
from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from supabase import create_client, Client
from backend.core.config import settings

# Define OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase Client (Lazy Load or Global)
# Note: For production, better to use a singleton
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY) if settings.SUPABASE_URL and settings.SUPABASE_KEY else None

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Validates the JWT token and returns the user object.
    Priority:
    1. Verify via Supabase Auth API (most secure, checks revocation, slower)
    2. Verify via JWT Signature (fast, requires JWT_SECRET)
    
    For MVP, we will try to get user data from Supabase Auth API using the token.
    """
    if not supabase:
        # Fallback for dev if no credentials (should not happen in prod)
        # Or if we want to decode without verifying signature (UNSAFE for prod)
        try:
            # Dangerous: decoding without verification for debugging if keys missing
            payload = jwt.get_unverified_claims(token)
            return payload
        except Exception:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials (No Supabase Client)",
                headers={"WWW-Authenticate": "Bearer"},
            )

    try:
        # Verify token by getting user from Supabase using the token
        user = supabase.auth.get_user(token)
        if not user:
             raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
