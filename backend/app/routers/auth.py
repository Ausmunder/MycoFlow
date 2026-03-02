"""
Authentication endpoints for MycoFlow.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..core.auth import authenticate_user, create_access_token, get_current_user

router = APIRouter()


@router.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with username and password, returns JWT access token."""
    if not authenticate_user(form_data.username, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Feil brukernavn eller passord",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/api/auth/verify")
def verify_token(current_user: str = Depends(get_current_user)):
    """Verify that the current token is valid. Returns username if OK."""
    return {"valid": True, "username": current_user}
