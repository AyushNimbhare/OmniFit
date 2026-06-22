from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    token = credentials.credentials
    
    # Local Development & Test Bypass Mode:
    # If the token is a Firebase UID directly, or formatted as bypass-Name-email_domain.com
    firebase_uid = token
    
    user = session.exec(select(User).where(User.firebase_uid == firebase_uid)).first()
    if not user:
        if firebase_uid.startswith("bypass"):
            # Parse bypass token: bypass-<Name>-<email_with_dot_replaced_by_underscore>
            parts = firebase_uid.split("-")
            name = "Test User"
            email = "test@example.com"
            if len(parts) > 1:
                name = parts[1].replace("_", " ")
            if len(parts) > 2:
                email = parts[2].replace("_at_", "@").replace("_dot_", ".")
            
            user = User(
                email=email,
                name=name,
                firebase_uid=firebase_uid
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid or not synced. Register/Login first."
            )
    return user

@router.post("/sync", response_model=UserResponse)
def sync_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Syncs the user from Firebase client auth to the local database.
    Creates the user if they do not exist, or updates their profile if they do.
    """
    user = session.exec(select(User).where(User.firebase_uid == user_data.firebase_uid)).first()
    if not user:
        user = User(
            email=user_data.email,
            name=user_data.name,
            firebase_uid=user_data.firebase_uid
        )
        session.add(user)
    else:
        user.name = user_data.name
        user.email = user_data.email
        session.add(user)
        
    session.commit()
    session.refresh(user)
    return user
