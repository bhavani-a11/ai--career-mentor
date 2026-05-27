from pydantic import BaseModel, Field
from typing import Optional

class UserRegister(BaseModel):
    """Schema for registering a new user."""
    email: str = Field(..., description="The user's unique email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: str = Field(..., description="The user's full name")

class UserLogin(BaseModel):
    """Schema for user login request."""
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

class UserOut(BaseModel):
    """Schema for returning user details publicly."""
    id: int = Field(..., description="PostgreSQL generated integer ID")
    email: str
    full_name: str

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    """Schema for returning a JWT token response."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Internal schema for token verification payload."""
    email: Optional[str] = None
