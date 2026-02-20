
import logging
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, Client
from backend.core.config import settings
from backend.schemas.user import CurrentUser

logger = logging.getLogger(__name__)

# Define OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase Client (Lazy Load or Global)
# Note: For production, better to use a singleton
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_KEY else None

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    """
    Validates the JWT token and returns the user object.
    Uses Supabase Auth API to verify token and check revocation.
    Returns a standardized CurrentUser schema.
    """
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )

    try:
        # Verify token by getting user from Supabase using the token
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Convert Supabase User to our CurrentUser schema
        user_data = user_response.user
        return CurrentUser(
            id=user_data.id,
            email=user_data.email or "",
            phone=getattr(user_data, "phone", None),
            email_confirmed_at=getattr(user_data, "email_confirmed_at", None),
            created_at=getattr(user_data, "created_at", None),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    Dependency that checks if the current user is an admin.
    Admin emails are read from the ADMIN_EMAILS environment variable (comma-separated).
    """
    admin_emails = [
        email.strip().lower()
        for email in settings.ADMIN_EMAILS.split(",")
        if email.strip()
    ]
    if current_user.email.lower() not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
