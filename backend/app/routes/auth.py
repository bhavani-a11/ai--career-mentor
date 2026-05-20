from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta

from app.db.mongodb import get_database
from app.models.user import UserRegister, UserLogin, UserOut, Token
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Registers a new user by checking if the email is already in use,
    hashing the password, and storing the record in the users collection.
    """
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": user_data.email.strip().lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    # Hash password and insert
    hashed_password = auth_service.get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email.strip().lower(),
        "password": hashed_password,
        "full_name": user_data.full_name
    }
    
    result = await db["users"].insert_one(new_user)
    
    # Retrieve the inserted user record
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    return created_user

@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Authenticates a user via email and password, returning a JWT token upon success.
    """
    # Check user credentials
    user = await db["users"].find_one({"email": user_data.email.strip().lower()})
    if not user or not auth_service.verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    access_token = auth_service.create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(auth_service.get_current_user)):
    """
    Returns the currently logged in user's profile details.
    """
    return current_user
