from fastapi import APIRouter, Depends, BackgroundTasks
from typing import Any
from datetime import datetime

from backend.core import deps
from backend.core.config import settings
from supabase import create_client, Client

router = APIRouter()

supabase: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None


def accept_pending_invitations(user_id: str, email: str):
    """Auto-accept pending project invitations matching this email and notify via email."""
    if not supabase:
        return
    try:
        pending = supabase.table("project_members") \
            .select("id, project_id") \
            .eq("email", email.lower()) \
            .eq("status", "pending") \
            .is_("user_id", "null") \
            .execute()

        if not pending.data:
            return

        from backend.services.email import EmailService
        email_service = EmailService()

        for inv in pending.data:
            supabase.table("project_members") \
                .update({
                    "user_id": user_id,
                    "status": "accepted",
                    "joined_at": datetime.utcnow().isoformat(),
                }) \
                .eq("id", inv["id"]) \
                .execute()

            # Notify the user about the project they just joined
            try:
                project = supabase.table("projects") \
                    .select("name, owner_id") \
                    .eq("id", inv["project_id"]) \
                    .single() \
                    .execute()
                if project.data:
                    owner = supabase.table("profiles") \
                        .select("full_name, email") \
                        .eq("id", project.data["owner_id"]) \
                        .single() \
                        .execute()
                    inviter_name = (owner.data.get("full_name") or owner.data.get("email", "").split("@")[0]) if owner.data else "Someone"
                    email_service.send_invitation(
                        to_email=email,
                        project_name=project.data["name"],
                        inviter_name=inviter_name,
                    )
            except Exception as e:
                print(f"Error sending join notification: {e}")

    except Exception as e:
        print(f"Error accepting pending invitations: {e}")


@router.get("/me")
def read_users_me(
    background_tasks: BackgroundTasks,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Get current user. Also auto-accepts any pending project invitations.
    """
    background_tasks.add_task(
        accept_pending_invitations,
        str(current_user.id),
        current_user.email,
    )
    return current_user
