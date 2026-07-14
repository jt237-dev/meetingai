from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    PasswordChange,
    ProfileUpdate,
    Token,
    UserCreateByAdmin,
    UserCreatedResponse,
    UserListItem,
    UserLogin,
    UserOut,
)
from app.services.email_service import generate_password, send_credentials_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Connexion : vérifie l'email + mot de passe, renvoie un jeton JWT."""
    user = db.query(User).filter(User.email == payload.email).first()

    # Message volontairement identique si email inconnu OU mot de passe faux :
    # on ne révèle pas quels emails existent.
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/users", response_model=UserCreatedResponse, status_code=201)
def create_user_by_admin(
    payload: UserCreateByAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Crée un utilisateur — RÉSERVÉ AUX ADMINISTRATEURS.

    Le mot de passe est généré aléatoirement par le serveur et envoyé par email
    au destinataire : l'admin ne le connaît jamais. Si l'envoi de l'email échoue,
    le compte est quand même créé (email_sent = false) pour ne pas bloquer.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    password = generate_password()

    user = User(
        email=payload.email,
        hashed_password=hash_password(password),
        full_name=payload.full_name,
        is_admin=payload.is_admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    email_sent = send_credentials_email(
        to_email=user.email,
        full_name=user.full_name,
        password=password,
    )

    return {"user": user, "email_sent": email_sent}


@router.get("/users", response_model=list[UserListItem])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Liste tous les utilisateurs — RÉSERVÉ AUX ADMINISTRATEURS."""
    return db.query(User).order_by(User.id).all()


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Supprime un utilisateur — RÉSERVÉ AUX ADMINISTRATEURS."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Profil de l'utilisateur connecté."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Modifie le nom et/ou l'email de l'utilisateur connecté."""
    if payload.email and payload.email != current_user.email:
        taken = db.query(User).filter(User.email == payload.email).first()
        if taken:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change le mot de passe (exige l'ancien pour éviter les détournements)."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Mot de passe mis à jour"}