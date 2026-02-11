
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.core import deps
from backend.core.config import settings
from backend.core.cache import cache
from backend.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectWithCounts
from supabase import create_client, Client
import uuid

router = APIRouter()

# Initialize Supabase Client with Service Role Key (bypasses RLS for backend operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None

@router.get("/", response_model=List[ProjectWithCounts])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_user),
):
    """
    Retrieve projects owned by current user, with doc_count and event_count.
    Cached for 120 seconds to improve performance.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Try to get from cache first
        cache_key = f"projects:list:{current_user.id}:{skip}:{limit}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        # 1. Get projects
        response = supabase.table("projects").select("*").eq("owner_id", current_user.id).range(skip, skip + limit - 1).execute()
        projects = response.data or []

        if not projects:
            return []

        project_ids = [p["id"] for p in projects]

        # 2. Count documents per project
        docs_response = supabase.table("documents").select("id, project_id").in_("project_id", project_ids).execute()
        docs = docs_response.data or []
        doc_count_map: dict[str, int] = {}
        doc_ids: list[str] = []
        for doc in docs:
            pid = doc["project_id"]
            doc_count_map[pid] = doc_count_map.get(pid, 0) + 1
            doc_ids.append(doc["id"])

        # 3. Count events per project (via documents)
        event_count_map: dict[str, int] = {}
        if doc_ids:
            events_response = supabase.table("deadline_events").select("id, document_id").in_("document_id", doc_ids).execute()
            events = events_response.data or []
            # Build doc_id -> project_id mapping
            doc_to_project = {doc["id"]: doc["project_id"] for doc in docs}
            for event in events:
                pid = doc_to_project.get(event["document_id"])
                if pid:
                    event_count_map[pid] = event_count_map.get(pid, 0) + 1

        # 4. Merge counts into projects
        result = []
        for p in projects:
            p["doc_count"] = doc_count_map.get(p["id"], 0)
            p["event_count"] = event_count_map.get(p["id"], 0)
            result.append(p)

        # Cache the result for 120 seconds
        cache.set(cache_key, result, ttl=120)

        return result
    except Exception as e:
        print(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Project)
def create_project(
    *,
    project_in: ProjectCreate,
    current_user = Depends(deps.get_current_user),
):
    """
    Create new project.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        project_data = project_in.dict(exclude_none=True)
        project_data["id"] = str(uuid.uuid4())
        project_data["owner_id"] = str(current_user.id)

        response = supabase.table("projects").insert(project_data).execute()

        if response.data and len(response.data) > 0:
            # Invalidate cache
            cache.delete_pattern(f"projects:list:{current_user.id}:*")
            cache.delete_pattern(f"dashboard:stats:{current_user.id}")
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create project")

    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=Project)
def read_project(
    id: uuid.UUID,
    current_user = Depends(deps.get_current_user),
):
    """
    Get project by ID.
    """
    try:
        response = supabase.table("projects").select("*").eq("id", str(id)).eq("owner_id", current_user.id).single().execute()
        if not response.data:
             raise HTTPException(status_code=404, detail="Project not found")
        return response.data
    except Exception as e:
         print(f"Error msg: {str(e)}")
         raise HTTPException(status_code=404, detail="Project not found")

@router.put("/{id}", response_model=Project)
def update_project(
    id: uuid.UUID,
    project_in: ProjectUpdate,
    current_user = Depends(deps.get_current_user),
):
    """
    Update a project (partial update).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Verify ownership
        existing = supabase.table("projects").select("id").eq("id", str(id)).eq("owner_id", current_user.id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Project not found")

        update_data = project_in.dict(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        response = supabase.table("projects").update(update_data).eq("id", str(id)).execute()

        if response.data and len(response.data) > 0:
            # Invalidate cache
            cache.delete_pattern(f"projects:list:{current_user.id}:*")
            cache.delete_pattern(f"dashboard:stats:{current_user.id}")
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update project")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: uuid.UUID,
    current_user = Depends(deps.get_current_user),
):
    """
    Delete a project. DB CASCADE handles documents and deadline_events.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Verify ownership
        existing = supabase.table("projects").select("id").eq("id", str(id)).eq("owner_id", current_user.id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Project not found")

        supabase.table("projects").delete().eq("id", str(id)).execute()

        # Invalidate cache
        cache.delete_pattern(f"projects:list:{current_user.id}:*")
        cache.delete_pattern(f"dashboard:stats:{current_user.id}")

        return None

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/documents")
def get_project_documents(
    id: uuid.UUID,
    current_user = Depends(deps.get_current_user),
):
    """
    Get all documents for a project.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        # Verify project ownership
        project = supabase.table("projects").select("id").eq("id", str(id)).eq("owner_id", current_user.id).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get all documents for this project
        response = supabase.table("documents").select("*").eq("project_id", str(id)).order("created_at", desc=True).execute()

        return response.data or []

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
