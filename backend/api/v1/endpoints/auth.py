import logging

from fastapi import APIRouter, Depends
from typing import Any
from datetime import datetime

from backend.core import deps
from backend.core.config import settings
from backend.core.cache import cache
from supabase import create_client, Client

logger = logging.getLogger(__name__)

router = APIRouter()

supabase: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None


def accept_pending_invitations(user_id: str, email: str) -> bool:
    """Auto-accept pending project invitations matching this email. Returns True if any were accepted."""
    if not supabase:
        return False
    try:
        pending = supabase.table("project_members") \
            .select("id, project_id") \
            .eq("email", email.lower()) \
            .eq("status", "pending") \
            .is_("user_id", "null") \
            .execute()

        if not pending.data:
            return False

        for inv in pending.data:
            supabase.table("project_members") \
                .update({
                    "user_id": user_id,
                    "status": "accepted",
                    "joined_at": datetime.utcnow().isoformat(),
                }) \
                .eq("id", inv["id"]) \
                .execute()
            logger.info(f"Auto-accepted invitation for {email} to project {inv['project_id']}")

        # Invalidate dashboard cache so stats reflect the new projects
        cache.delete(f"dashboard:stats:{user_id}")

        return True

    except Exception as e:
        logger.error(f"Error accepting pending invitations: {e}")
        return False


@router.get("/me")
def read_users_me(
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Get current user. Also auto-accepts any pending project invitations (synchronous).
    """
    accept_pending_invitations(
        str(current_user.id),
        current_user.email,
    )
    return current_user
