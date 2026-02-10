from fastapi import APIRouter, Depends
from typing import Any

# Resolve circular import by using TYPE_CHECKING or lazy import
# But here simple deps import is fine
from backend.core import deps 

router = APIRouter()

@router.get("/me")
def read_users_me(current_user: Any = Depends(deps.get_current_user)):
    """
    Get current user.
    """
    return current_user
