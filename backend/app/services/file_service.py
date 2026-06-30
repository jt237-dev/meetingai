import webvtt
import docx
import os
from pathlib import Path


def extract_transcript_from_vtt(file_path: str) -> str:
    """Extrait le texte d'un fichier .vtt (sous-titres WebVTT) EN CONSERVANT
    le nom du locuteur de chaque réplique.

    Pourquoi c'est important : Teams écrit le nom complet réel de chaque
    intervenant dans une balise <v Nom>...</v>. La propriété `caption.text`
    de webvtt-py supprime cette balise et ne renvoie que le texte parlé — donc
    l'ancienne version perdait TOUS les noms. Or l'audio ne contient souvent
    que des prénoms cités à l'oral, mal reconnus : sans les balises <v>, l'IA
    en aval reconstruit la liste des participants à l'oreille et produit des
    prénoms tronqués et des oublis (le président, gros locuteur, peut manquer).

    On préfixe donc chaque réplique par "Nom: ...". Ce format :
      - préserve la liste exacte des participants (noms complets) ;
      - aide l'IA à attribuer chaque propos / engagement au bon locuteur ;
      - reste lisible et compact.

    On fusionne les répliques consécutives du même locuteur et on évite les
    doublons de texte immédiats (artefacts fréquents des sous-titres Teams).
    """
    lines = []
    last_speaker = None
    last_text = None

    for caption in webvtt.read(file_path):
        text = caption.text.strip()
        if not text:
            continue

        # `voice` = nom dans la balise <v Nom>. Peut être None si la balise
        # est absente (rare). On garde alors la réplique sans préfixe.
        speaker = (getattr(caption, "voice", None) or "").strip() or None

        # Éviter le doublon de texte immédiat (même phrase répétée d'affilée).
        if text == last_text and speaker == last_speaker:
            continue

        if speaker and speaker == last_speaker:
            # Même locuteur qui continue : on accole au bloc précédent.
            lines[-1] += " " + text
        elif speaker:
            lines.append(f"{speaker}: {text}")
        else:
            lines.append(text)

        last_speaker = speaker
        last_text = text

    return "\n".join(lines)


def extract_transcript_from_docx(file_path: str) -> str:
    """Extrait le texte d'un fichier .docx."""
    doc = docx.Document(file_path)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def extract_transcript_from_txt(file_path: str) -> str:
    """Extrait le texte d'un fichier .txt."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_transcript(file_path: str) -> str:
    """
    Détecte le type de fichier et extrait le texte automatiquement.
    """
    extension = Path(file_path).suffix.lower()

    if extension == ".vtt":
        return extract_transcript_from_vtt(file_path)
    elif extension == ".docx":
        return extract_transcript_from_docx(file_path)
    elif extension in [".txt", ".srt"]:
        return extract_transcript_from_txt(file_path)
    else:
        raise ValueError(f"Format de fichier non supporté : {extension}")