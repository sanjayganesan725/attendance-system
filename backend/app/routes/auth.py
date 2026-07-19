import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.database.session import get_db
from app.models import models
from app.schemas import schemas
from app.auth.auth_handler import get_current_user
from app.utils.helpers import log_activity

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    from sqlalchemy import func
    username_val = form_data.username.strip()
    user = db.query(models.User).filter(
        (func.lower(models.User.email) == func.lower(username_val)) |
        (func.lower(models.User.full_name) == func.lower(username_val))
    ).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    access_token = security.create_access_token(subject=user.id)
    
    # Audit log
    log_activity(db, user_id=user.id, action="LOGIN", details=f"User {user.email} logged in successfully")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.full_name,
        "email": user.email,
        "user_id": user.id
    }

@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    data: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not security.verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    
    log_activity(db, user_id=current_user.id, action="CHANGE_PASSWORD", details="Changed account password")
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        # Avoid user enumeration attacks, but return success mock response
        return {"message": "If the email exists, a password reset link has been sent"}
        
    # Generate mock token
    reset_token = security.create_access_token(subject=user.id)
    # Log the token locally for ease of evaluation
    print(f"PASSWORD RESET LINK FOR {user.email}: http://localhost:5173/reset-password?token={reset_token}")
    
    log_activity(db, user_id=user.id, action="FORGOT_PASSWORD", details="Requested password reset link")
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user_id = security.decode_access_token(data.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    
    log_activity(db, user_id=user.id, action="RESET_PASSWORD", details="Successfully reset account password")
    return {"message": "Password reset successfully"}

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.email:
        existing = db.query(models.User).filter(models.User.email == data.email, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered to another user")
        current_user.email = data.email
    if data.full_name:
        current_user.full_name = data.full_name
    if data.phone:
        current_user.phone = data.phone
        
    db.commit()
    db.refresh(current_user)
    
    log_activity(db, user_id=current_user.id, action="UPDATE_PROFILE", details="Updated personal profile info")
    return current_user

@router.post("/profile/picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG images are allowed")
        
    # Create filename
    filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update DB url
    # Use relative path that we can serve via static files
    profile_url = f"/uploads/{filename}"
    current_user.profile_picture_url = profile_url
    db.commit()
    
    log_activity(db, user_id=current_user.id, action="UPLOAD_PROFILE_PICTURE", details="Uploaded new profile photo")
    return {"profile_picture_url": profile_url}
