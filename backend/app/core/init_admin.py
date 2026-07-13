"""Création de l'utilisateur admin initial au démarrage de l'application.

Sans cela, la base serait vide et personne ne pourrait se connecter.
L'email et le mot de passe de l'admin viennent des variables d'environnement
ADMIN_EMAIL et ADMIN_PASSWORD (à définir sur Railway).

Si l'admin existe déjà, on ne fait rien : la fonction est donc sûre à
exécuter à chaque démarrage.
"""

import os

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User


def create_initial_admin() -> None:
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        print("[INIT] ADMIN_EMAIL/ADMIN_PASSWORD non définis — admin non créé.")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"[INIT] Admin déjà présent : {email}")
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=os.getenv("ADMIN_NAME", "Administrateur"),
            is_admin=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[INIT] Admin créé : {email}")
    except Exception as e:
        db.rollback()
        print(f"[INIT] Erreur création admin : {e}")
    finally:
        db.close()