import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from typing import List
from backend.core import deps
from backend.core.config import settings
from backend.core.permissions import verify_project_access, verify_project_owner
from backend.schemas.member import MemberInvite, MemberResponse
from backend.services.email import EmailService
from supabase import create_client, Client
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

supabase: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
) if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY else None


@router.get("/{project_id}/members", response_model=List[MemberResponse])
def list_members(
    project_id: uuid.UUID,
    current_user=Depends(deps.get_current_user),
):
    """List all members of a project (owner or member can view)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    pid = str(project_id)
    uid = str(current_user.id)

    verify_project_access(pid, uid, supabase)

    try:
        response = supabase.table("project_members") \
            .select("*, profiles!project_members_user_id_fkey(full_name)") \
            .eq("project_id", pid) \
            .order("invited_at", desc=False) \
            .execute()

        members = []
        for m in (response.data or []):
            profile = m.pop("profiles", None)
            m["full_name"] = profile.get("full_name") if profile else None
            members.append(m)

        return members
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing members: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")


@router.post("/{project_id}/members/invite", response_model=MemberResponse)
def invite_member(
    project_id: uuid.UUID,
    invite: MemberInvite,
    background_tasks: BackgroundTasks,
    current_user=Depends(deps.get_current_user),
):
    """Invite a member to the project by email. Only the project owner can invite."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    pid = str(project_id)
    uid = str(current_user.id)

    verify_project_owner(pid, uid, supabase)

    email = invite.email.lower()

    # Cannot invite yourself
    if email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    # Check if already invited
    existing = supabase.table("project_members") \
        .select("id, status") \
        .eq("project_id", pid) \
        .eq("email", email) \
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="This email has already been invited")

    # Check if the email belongs to a registered user
    profile = supabase.table("profiles") \
        .select("id, full_name") \
        .eq("email", email) \
        .execute()

    member_data = {
        "id": str(uuid.uuid4()),
        "project_id": pid,
        "email": email,
        "invited_by": uid,
        "invited_at": datetime.utcnow().isoformat(),
    }

    if profile.data and len(profile.data) > 0:
        # User exists -- auto-accept
        member_data["user_id"] = profile.data[0]["id"]
        member_data["status"] = "accepted"
        member_data["joined_at"] = datetime.utcnow().isoformat()
    else:
        # User not registered -- keep pending
        member_data["status"] = "pending"

    try:
        response = supabase.table("project_members").insert(member_data).execute()

        if response.data and len(response.data) > 0:
            result = response.data[0]
            if profile.data and len(profile.data) > 0:
                result["full_name"] = profile.data[0].get("full_name")

            # Send invitation email synchronously for immediate feedback
            project = verify_project_owner(pid, uid, supabase)
            inviter_name = current_user.email.split("@")[0]
            inviter_profile = supabase.table("profiles").select("full_name").eq("id", uid).execute()
            if inviter_profile.data and inviter_profile.data[0].get("full_name"):
                inviter_name = inviter_profile.data[0]["full_name"]

            from backend.core.database import get_db
            db = next(get_db())
            try:
                email_service = EmailService(db=db)
                is_existing = bool(profile.data and len(profile.data) > 0)
                email_sent = email_service.send_invitation(
                    to_email=email,
                    project_name=project["name"],
                    inviter_name=inviter_name,
                    is_existing_user=is_existing,
                )
            finally:
                db.close()

            result["email_sent"] = email_sent
            return result
        else:
            raise HTTPException(status_code=500, detail="Failed to invite member")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting member: {e}")
        if "uq_project_member" in str(e):
            raise HTTPException(status_code=400, detail="This email has already been invited")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")


@router.post("/{project_id}/members/{member_id}/resend-invite")
def resend_invitation(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user=Depends(deps.get_current_user),
):
    """Resend invitation email to a pending member. Only the project owner can resend."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    pid = str(project_id)
    uid = str(current_user.id)

    project = verify_project_owner(pid, uid, supabase)

    # Get the member
    member = supabase.table("project_members") \
        .select("*") \
        .eq("id", str(member_id)) \
        .eq("project_id", pid) \
        .single() \
        .execute()

    if not member.data:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.data["status"] != "pending":
        raise HTTPException(status_code=400, detail="此成員已接受邀請，無需重寄")

    # Get inviter name
    inviter_name = current_user.email.split("@")[0]
    inviter_profile = supabase.table("profiles").select("full_name").eq("id", uid).execute()
    if inviter_profile.data and inviter_profile.data[0].get("full_name"):
        inviter_name = inviter_profile.data[0]["full_name"]

    # Send email synchronously for immediate feedback
    from backend.core.database import get_db
    db = next(get_db())
    try:
        email_service = EmailService(db=db)
        success = email_service.send_invitation(
            to_email=member.data["email"],
            project_name=project["name"],
            inviter_name=inviter_name,
        )
    finally:
        db.close()

    if success:
        return {"status": "sent", "email": member.data["email"]}
    else:
        raise HTTPException(status_code=500, detail="郵件發送失敗，請檢查 Email 設定")


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user=Depends(deps.get_current_user),
):
    """Remove a member from the project. Only the project owner can remove."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error")

    pid = str(project_id)
    uid = str(current_user.id)

    verify_project_owner(pid, uid, supabase)

    try:
        # Verify the member exists in this project
        member = supabase.table("project_members") \
            .select("id") \
            .eq("id", str(member_id)) \
            .eq("project_id", pid) \
            .single() \
            .execute()

        if not member.data:
            raise HTTPException(status_code=404, detail="Member not found")

        supabase.table("project_members").delete().eq("id", str(member_id)).execute()
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {e}")
        raise HTTPException(status_code=500, detail="伺服器內部錯誤，請稍後再試")
