from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core import deps
from backend.core.config import settings
from backend.core.database import get_db
from backend.models import Project, Document, DeadlineEvent
# Import NotificationService for manual trigger
from backend.services.notification import NotificationService
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None

@router.get("/stats")
def get_dashboard_stats(
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Get aggregated statistics for dashboard.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    try:
        # Safely get user_id regardless of whether current_user is an object or dict
        user_id = getattr(current_user, "id", None) or current_user.get("id")
        if not user_id:
             raise HTTPException(status_code=401, detail="User ID not found in token")
             
        today = datetime.now().date().isoformat()
        
        # 1. Total Projects
        # .count("exact", head=True) only returns count without data
        projects_response = supabase.table("projects").select("*", count="exact", head=True).eq("owner_id", user_id).execute()
        projects_count = projects_response.count if projects_response.count is not None else 0
        
        # 2. Total Documents (Need to check doc ownership via project ownership, or if RLS handles it)
        # Assuming RLS handles user isolation:
        # But documents table doesn't have owner_id directly? Ah, it has project_id.
        # If RLS is set up correctly (JOIN projects owner_id), then select count works.
        # But for simpler query, we might need a join or rely on RLS if authenticated client used.
        # Since we use anon key + manual query here, "documents" table RLS policy protects it?
        # WAIT: We are using ANON KEY here without user context in supabase client (unless passed).
        # We need to filter manually if RLS is not active for this client instance context.
        # The correct way is: filter by projects that belong to user.
        # This is a bit complex for a single query in Supabase-py without join support fully exposed.
        # Let's simplify: Query projects first (we have count), then documents in those projects?
        # Or just trust RLS if we set token? 
        # Correct: We should set token. But let's stick to manual filtering for reliability in Python logic.
        
        # Get user project IDs
        user_projects = supabase.table("projects").select("id").eq("owner_id", user_id).execute()
        project_ids = [p['id'] for p in user_projects.data]
        
        doc_count = 0
        overdue_count = 0
        upcoming_count = 0
        recent_events = []
        
        if project_ids:
            # Documents count
            # .in_("project_id", project_ids)
            docs_response = supabase.table("documents").select("*", count="exact", head=True).in_("project_id", project_ids).execute()
            doc_count = docs_response.count if docs_response.count is not None else 0
            
            # Deadline Events
            # Filter events by documents in project_ids?
            # events -> document_id -> project_id
            # This requires a join or 2-step lookup.
            # Get all docs for user
            user_docs = supabase.table("documents").select("id").in_("project_id", project_ids).execute()
            doc_ids = [d['id'] for d in user_docs.data]
            
            if doc_ids:
                # Overdue: due_date < today AND status != completed
                overdue = supabase.table("deadline_events")\
                    .select("*", count="exact", head=True)\
                    .in_("document_id", doc_ids)\
                    .lt("due_date", today)\
                    .neq("status", "completed")\
                    .execute()
                overdue_count = overdue.count if overdue.count is not None else 0
                
                # Upcoming: due_date >= today
                upcoming = supabase.table("deadline_events")\
                    .select("*", count="exact", head=True)\
                    .in_("document_id", doc_ids)\
                    .gte("due_date", today)\
                    .execute()
                upcoming_count = upcoming.count if upcoming.count is not None else 0
                
                # Recent Events (for list)
                # Get top 5 upcoming or overdue
                # Supabase join: documents(project_id, filename)
                # This syntax matches postgrest-py
                recent_response = supabase.table("deadline_events")\
                    .select("*, documents(project_id, filename)")\
                    .in_("document_id", doc_ids)\
                    .order("due_date", desc=False)\
                    .limit(5)\
                    .execute()
                # Determine status display (overdue vs upcoming)
                recent_events = recent_response.data
        
        return {
            "total_projects": projects_count,
            "total_documents": doc_count,
            "overdue_tasks": overdue_count,
            "upcoming_tasks": upcoming_count,
            "recent_events": recent_events
        }

    except Exception as e:
        import traceback
        error_msg = f"Error fetching stats: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/notifications/trigger")
def trigger_notifications(
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Manually trigger deadline check (for testing purposes).
    """
    try:
        service = NotificationService()
        service.check_deadlines()
        return {"message": "Deadline check triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
