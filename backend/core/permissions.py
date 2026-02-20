
import logging
from fastapi import HTTPException
from supabase import Client
from backend.core.config import settings
from supabase import create_client

logger = logging.getLogger(__name__)

# Use the same service-role Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None


def verify_project_access(project_id: str, user_id: str, supabase_client: Client = None) -> dict:
    """
    Verify the user is owner or accepted member of a project.
    Returns the project data dict if access is granted.
    Raises HTTPException(404) if project not found or user has no access.
    """
    client = supabase_client or supabase
    if not client:
        raise HTTPException(status_code=500, detail="Database connection error")

    project = client.table("projects").select("*").eq("id", project_id).single().execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Owner check
    if project.data["owner_id"] == user_id:
        return project.data

    # Member check
    member = client.table("project_members") \
        .select("id") \
        .eq("project_id", project_id) \
        .eq("user_id", user_id) \
        .eq("status", "accepted") \
        .execute()

    if not member.data:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.data


def verify_project_owner(project_id: str, user_id: str, supabase_client: Client = None) -> dict:
    """
    Verify the user is the owner of a project.
    Returns the project data dict if ownership is confirmed.
    Raises HTTPException(403) if user is not the owner.
    """
    client = supabase_client or supabase
    if not client:
        raise HTTPException(status_code=500, detail="Database connection error")

    project = client.table("projects").select("*") \
        .eq("id", project_id) \
        .eq("owner_id", user_id) \
        .single().execute()

    if not project.data:
        raise HTTPException(status_code=403, detail="Only project owner can perform this action")

    return project.data
