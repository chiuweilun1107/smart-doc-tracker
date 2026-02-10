
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any
from backend.core import deps
from backend.core.config import settings
from backend.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectList
from supabase import create_client, Client
import uuid

router = APIRouter()

# Initialize Supabase Client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_KEY else None

@router.get("/", response_model=List[Project])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Retrieve projects owned by current user.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    try:
        # Query 'projects' table filtering by owner_id (which is current_user.id)
        # We can rely on RLS if we set session, but manual filter is safer if using anon key without session context
        response = supabase.table("projects").select("*").eq("owner_id", current_user.id).range(skip, skip + limit - 1).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Project)
def create_project(
    *,
    project_in: ProjectCreate,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Create new project.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        project_data = project_in.dict()
        project_data["owner_id"] = current_user.id
        # ID and timestamps handled by DB default (or generate UUID here if needed)
        # Let's let DB handle ID? Or generate? SQLAlchemy model has default=uuid.uuid4
        # Supabase API (Postgrest) usually returns created object
        
        response = supabase.table("projects").insert(project_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create project")
            
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=Project)
def read_project(
    id: uuid.UUID,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Get project by ID.
    """
    try:
        response = supabase.table("projects").select("*").eq("id", str(id)).eq("owner_id", current_user.id).single().execute()
        # Single() raises error if not found? No, returns error object usually or raises.
        # supabase-py raises postgrest.exceptions.APIError maybe?
        if not response.data:
             raise HTTPException(status_code=404, detail="Project not found")
        return response.data
    except Exception as e:
         # Check if error is 'not found'
         print(f"Error msg: {str(e)}")
         raise HTTPException(status_code=404, detail="Project not found")

