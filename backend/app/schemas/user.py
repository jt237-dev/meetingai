from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="6 caractères minimum")
    full_name: str | None = None


class UserOut(BaseModel):
    """Ce qu'on renvoie au client : JAMAIS le mot de passe."""
    id: int
    email: EmailStr
    full_name: str | None = None
    is_admin: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    """Mise à jour du profil (champs optionnels)."""
    full_name: str | None = None
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, description="6 caractères minimum")