"""Sécurité : hachage des mots de passe (bcrypt) et jetons JWT.

Principe : on ne stocke jamais un mot de passe en clair. On stocke son
« hachage » — une empreinte irréversible. Pour vérifier une connexion, on
hache le mot de passe fourni et on compare les empreintes.

Le jeton JWT sert ensuite à prouver l'identité à chaque requête, sans avoir à
renvoyer le mot de passe.
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.user import User

# bcrypt : algorithme de hachage lent par conception (résiste au brute-force).
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt refuse tout mot de passe de plus de 72 OCTETS (limite de l'algorithme).
# On tronque donc systématiquement avant de hacher ET de vérifier, sinon un mot
# de passe long fait planter le hachage. 72 octets, c'est déjà énorme pour un
# mot de passe (l'immense majorité fait 12-30 caractères).
_BCRYPT_MAX_BYTES = 72


def _truncate(password: str) -> str:
    """Tronque proprement à 72 octets (et non 72 caractères : un accent = 2 octets)."""
    encoded = password.encode("utf-8")
    if len(encoded) <= _BCRYPT_MAX_BYTES:
        return password
    # On coupe à 72 octets puis on ignore un éventuel caractère coupé en deux.
    return encoded[:_BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")

# Indique à FastAPI où le client obtient un jeton (utile pour la doc /docs).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def hash_password(password: str) -> str:
    """Transforme un mot de passe en empreinte irréversible."""
    return pwd_context.hash(_truncate(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un mot de passe correspond à son empreinte stockée."""
    return pwd_context.verify(_truncate(plain_password), hashed_password)


def create_access_token(subject: str) -> str:
    """Crée un jeton JWT signé, valable pour une durée limitée."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dépendance FastAPI : récupère l'utilisateur à partir du jeton.

    À utiliser sur toute route à protéger :
        def ma_route(user: User = Depends(get_current_user)):
    Si le jeton est absent, invalide ou expiré -> 401 (accès refusé).
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou session expirée",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        if not email:
            raise credentials_error
    except jwt.PyJWTError:
        raise credentials_error

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_error
    return user