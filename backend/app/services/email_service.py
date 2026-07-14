"""Envoi d'emails via Resend.

Utilisé pour transmettre ses identifiants à un utilisateur que l'administrateur
vient de créer. Le mot de passe est généré aléatoirement et n'est connu que du
destinataire (l'admin ne le voit pas).

Variables d'environnement nécessaires (à définir sur Railway) :
  RESEND_API_KEY  : la clé API Resend
  RESEND_FROM     : l'adresse expéditrice (ex: "MeetSense <no-reply@ton-domaine.com>")
                    Le domaine doit être vérifié dans Resend.
  APP_URL         : l'URL du frontend, pour le lien de connexion dans l'email
"""

import os
import secrets
import string

import resend


def generate_password(length: int = 12) -> str:
    """Génère un mot de passe aléatoire solide et lisible.

    On exclut les caractères ambigus (l, I, 1, O, 0) pour éviter les erreurs de
    saisie quand l'utilisateur recopie son mot de passe depuis l'email.
    """
    alphabet = (
        string.ascii_lowercase.replace("l", "")
        + string.ascii_uppercase.replace("I", "").replace("O", "")
        + string.digits.replace("1", "").replace("0", "")
        + "!@#$%*?"
    )
    return "".join(secrets.choice(alphabet) for _ in range(length))


def send_credentials_email(to_email: str, full_name: str | None, password: str) -> bool:
    """Envoie les identifiants au nouvel utilisateur.

    Renvoie True si l'email est parti, False sinon. On ne lève pas d'exception :
    l'échec de l'email ne doit pas annuler la création du compte (l'admin pourra
    toujours communiquer le mot de passe autrement).
    """
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("RESEND_FROM")
    app_url = os.getenv("APP_URL", "")

    if not api_key or not sender:
        print("[EMAIL] RESEND_API_KEY ou RESEND_FROM non défini — email non envoyé.")
        return False

    resend.api_key = api_key
    greeting = f"Bonjour {full_name}," if full_name else "Bonjour,"

    login_link = (
        f'<p style="margin:24px 0;">'
        f'<a href="{app_url}/login" '
        f'style="background:#ee3124;color:#fff;padding:12px 24px;border-radius:8px;'
        f'text-decoration:none;font-weight:bold;display:inline-block;">'
        f"Se connecter</a></p>"
        if app_url else ""
    )

    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#333;">
      <h2 style="color:#111;">Bienvenue sur MeetSense AI</h2>
      <p>{greeting}</p>
      <p>Un compte vient d'être créé pour vous sur MeetSense AI, la plateforme
         d'analyse et de génération de comptes rendus de réunion.</p>

      <div style="background:#f5f5f5;border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Email :</strong> {to_email}</p>
        <p style="margin:0;"><strong>Mot de passe provisoire :</strong>
           <code style="background:#fff;padding:4px 8px;border-radius:4px;border:1px solid #ddd;">{password}</code>
        </p>
      </div>

      <p><strong>Important :</strong> par sécurité, changez ce mot de passe dès votre
         première connexion, depuis la page <em>Paramètres</em>.</p>

      {login_link}

      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
        Si vous n'attendiez pas cet email, ignorez-le.
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": sender,
            "to": [to_email],
            "subject": "Vos identifiants MeetSense AI",
            "html": html,
        })
        print(f"[EMAIL] Identifiants envoyés à {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Échec de l'envoi à {to_email} : {e}")
        return False