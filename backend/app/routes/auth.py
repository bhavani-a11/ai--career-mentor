from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.base import get_db
from app.db.models import User
from app.models.user import UserRegister, UserLogin, UserOut, Token
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Registers a new user by checking if the email is already in use,
    hashing the password, and storing the record in PostgreSQL.
    """
    try:
        email = user_data.email.strip().lower()
        print(f"Attempting to register with email: {email}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        print(f"Existing user found: {existing_user}")
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        
        # Hash password and insert
        hashed_password = auth_service.get_password_hash(user_data.password)
        new_user = User(
            email=email,
            password=hashed_password,
            full_name=user_data.full_name
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Successfully registered user with ID: {new_user.id}")
        return new_user
    except HTTPException as he:
        # Re-raise known HTTP exceptions (like email already exists)
        raise he
    except Exception as e:
        # Catch all other exceptions and return a detailed error
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        ) from e

@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticates a user via email and password, returning a JWT token upon success.
    """
    # Check user credentials
    user = db.query(User).filter(User.email == user_data.email.strip().lower()).first()
    if not user or not auth_service.verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    access_token = auth_service.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(auth_service.get_current_user)):
    """
    Returns the currently logged in user's profile details.
    """
    return current_user
