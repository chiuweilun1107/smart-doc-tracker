from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core import deps
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.cache import cache
from backend.models import Project, Document, DeadlineEvent
# Import NotificationService for manual trigger
from backend.services.notification import NotificationService
from supabase import create_client, Client

router = APIRouter()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None

@router.get("/stats")
def get_dashboard_stats(
    current_user = Depends(deps.get_current_user),
):
    """
    Get aggregated statistics for dashboard.
    Cached for 60 seconds to improve performance.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        user_id = str(current_user.id)

        # Try to get from cache first
        cache_key = f"dashboard:stats:{user_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        today = datetime.now().date().isoformat()

        # Optimized: Reduce database round trips by using better query strategy
        # 1. Get projects with count
        projects_response = supabase.table("projects")\
            .select("id", count="exact")\
            .eq("owner_id", user_id)\
            .execute()
        projects_count = projects_response.count if projects_response.count is not None else 0
        project_ids = [p['id'] for p in projects_response.data] if projects_response.data else []

        # Initialize defaults
        doc_count = 0
        overdue_count = 0
        upcoming_count = 0
        recent_events = []

        if not project_ids:
            result = {
                "total_projects": projects_count,
                "total_documents": 0,
                "overdue_tasks": 0,
                "upcoming_tasks": 0,
                "recent_events": []
            }
            cache.set(cache_key, result, ttl=60)
            return result

        # 2. Get documents count
        docs_response = supabase.table("documents")\
            .select("id", count="exact")\
            .in_("project_id", project_ids)\
            .execute()
        doc_count = docs_response.count if docs_response.count is not None else 0
        doc_ids = [d['id'] for d in docs_response.data] if docs_response.data else []

        if not doc_ids:
            result = {
                "total_projects": projects_count,
                "total_documents": doc_count,
                "overdue_tasks": 0,
                "upcoming_tasks": 0,
                "recent_events": []
            }
            cache.set(cache_key, result, ttl=60)
            return result

        # 3. Get all event counts and recent events in fewer queries
        # Count overdue
        overdue = supabase.table("deadline_events")\
            .select("id", count="exact")\
            .in_("document_id", doc_ids)\
            .lt("due_date", today)\
            .neq("status", "completed")\
            .execute()
        overdue_count = overdue.count if overdue.count is not None else 0

        # Count upcoming
        upcoming = supabase.table("deadline_events")\
            .select("id", count="exact")\
            .in_("document_id", doc_ids)\
            .gte("due_date", today)\
            .neq("status", "completed")\
            .execute()
        upcoming_count = upcoming.count if upcoming.count is not None else 0

        # Get recent events with document and project join (optimized with specific fields)
        recent_response = supabase.table("deadline_events")\
            .select("id, title, due_date, status, confidence_score, document_id, documents(original_filename, project_id, projects(id, name))")\
            .in_("document_id", doc_ids)\
            .neq("status", "completed")\
            .order("due_date", desc=False)\
            .limit(5)\
            .execute()
        recent_events = recent_response.data if recent_response.data else []

        result = {
            "total_projects": projects_count,
            "total_documents": doc_count,
            "overdue_tasks": overdue_count,
            "upcoming_tasks": upcoming_count,
            "recent_events": recent_events
        }

        # Cache the result for 60 seconds
        cache.set(cache_key, result, ttl=60)

        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        # Log full traceback for debugging, but don't expose to client
        traceback.print_exc()
        print(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard statistics")

@router.post("/notifications/trigger")
def trigger_notifications(
    current_user = Depends(deps.get_current_user),
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
