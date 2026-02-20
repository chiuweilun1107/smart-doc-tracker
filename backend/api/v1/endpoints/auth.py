import logging
import uuid

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

# Default notification rules for new users
DEFAULT_NOTIFICATION_RULES = [
    {"days_before": 7, "severity": "info", "channels": ["line", "email"]},
    {"days_before": 3, "severity": "warning", "channels": ["line", "email"]},
    {"days_before": 1, "severity": "critical", "channels": ["line", "email"]},
]


def ensure_default_notification_rules(user_id: str):
    """Create default notification rules for a user if they have none."""
    if not supabase:
        return
    try:
        existing = supabase.table("notification_rules") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .execute()

        if existing.count and existing.count > 0:
            return

        for rule in DEFAULT_NOTIFICATION_RULES:
            supabase.table("notification_rules").insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "days_before": rule["days_before"],
                "severity": rule["severity"],
                "is_active": True,
                "channels": rule["channels"],
            }).execute()

        logger.info(f"Created default notification rules for user {user_id}")

    except Exception as e:
        logger.error(f"Error creating default notification rules: {e}")


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
    Get current user. Also auto-accepts any pending project invitations
    and ensures default notification rules exist.
    """
    user_id = str(current_user.id)
    accept_pending_invitations(user_id, current_user.email)
    ensure_default_notification_rules(user_id)
    return current_user
