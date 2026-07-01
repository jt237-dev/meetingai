import anthropic
import json
import re
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

MAX_TOKENS_PER_CHUNK = 50000  # ~200 000 caractères : volontairement très haut.
# Claude Haiku 4.5 a une fenêtre de contexte d'environ 200k tokens. La quasi-
# totalité des transcriptions de réunion réelles (même 1h-2h, multi-dossiers)
# tiennent dans un seul appel direct sur le texte BRUT. Le découpage en chunks
# + résumé intermédiaire a un double coût : (1) il coûte plus cher (plusieurs
# appels Haiku au lieu d'un, chacun avec son propre prompt d'instructions), et
# (2) il PERD de l'information avant même l'analyse finale, qui ne voit plus
# que des résumés et non le texte exact. Ce découpage ne doit donc rester
# qu'un filet de sécurité pour les cas réellement extrêmes (transcriptions de
# plusieurs heures), pas le chemin normal.
CHARS_PER_TOKEN = 4


def _decode_vtt_entities(name: str) -> str:
    """Décode les entités HTML que Teams insère dans les noms (ex: &#233; -> é)."""
    import html
    return html.unescape(name).strip()


# Noms génériques d'agents non identifiés à NE PAS proposer comme participants
# réels (Teams nomme ainsi les comptes non rattachés à une personne).
_GENERIC_SPEAKER_RE = re.compile(r'^agent\s+\w+\s*\d*$', re.IGNORECASE)


def extract_speakers_from_vtt(transcript: str) -> list[str]:
    """Extrait la liste officielle des locuteurs depuis le transcript.

    C'est la SOURCE DE VÉRITÉ des participants : Teams écrit le nom complet réel
    de chaque intervenant, alors que l'audio ne contient souvent que les prénoms
    cités à l'oral, mal reconnus ou incomplets. Sans cette liste, l'IA reconstruit
    les participants à l'oreille et produit des prénoms seuls + des oublis (le
    président, gros locuteur, peut même manquer).

    Le transcript arrive normalement au format "Nom: texte" (préfixe ajouté par
    extract_transcript_from_vtt). Par sécurité, on gère aussi l'ancien format à
    balises <v Nom>. On déduplique en gardant l'ordre de première apparition.
    """
    seen = {}

    # Format principal : balises <v Nom> (si le transcript brut les contient encore).
    for raw in re.findall(r'<v\s+([^>]+)>', transcript):
        name = _decode_vtt_entities(raw)
        if name and name.lower() not in seen:
            seen[name.lower()] = name

    # Format "Nom: texte" en début de ligne (préfixe locuteur).
    # On exige un nom plausible : commence par une majuscule/lettre, longueur
    # raisonnable, pas une phrase entière (heuristique : <= 6 mots avant le ':').
    if not seen:
        for line in transcript.splitlines():
            m = re.match(r'^([^:\n]{2,60}?):\s', line)
            if not m:
                continue
            name = _decode_vtt_entities(m.group(1))
            if not name or len(name.split()) > 6:
                continue
            if name.lower() not in seen:
                seen[name.lower()] = name

    return list(seen.values())


def clean_transcript(transcript: str) -> str:
    """Supprime les timestamps et métadonnées VTT inutiles.

    NB : on garde les balises <v Nom> dans le texte (elles aident l'IA à
    attribuer chaque propos au bon locuteur). L'extraction de la liste
    officielle des participants se fait à part via extract_speakers_from_vtt().
    """
    transcript = re.sub(r'\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[\.,]\d{3}', '', transcript)
    transcript = re.sub(r'WEBVTT.*?\n', '', transcript)
    transcript = re.sub(r'^[\w-]+/\d+-\d+\s*$', '', transcript, flags=re.MULTILINE)  # IDs de cue Teams
    transcript = re.sub(r'^\d+\s*$', '', transcript, flags=re.MULTILINE)
    transcript = re.sub(r'\n{3,}', '\n\n', transcript)
    return transcript.strip()


def split_transcript(transcript: str) -> list[str]:
    """Découpe la transcription en chunks si elle est trop longue."""
    max_chars = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN
    if len(transcript) <= max_chars:
        return [transcript]

    chunks = []
    while len(transcript) > 0:
        chunk = transcript[:max_chars]
        last_newline = chunk.rfind('\n')
        if last_newline > 0:
            chunk = chunk[:last_newline]
        chunks.append(chunk)
        transcript = transcript[len(chunk):]

    return chunks


def summarize_chunk(chunk: str, chunk_index: int, total_chunks: int) -> str:
    """Résume un morceau de transcription.

    IMPORTANT : ce résumé sert ensuite de SEULE base à l'analyse finale (la
    transcription brute du chunk n'est plus relue après coup). Si ce résumé
    ne garde que "décisions/tâches", tout ce qui alimente le tableau
    récapitulatif des dossiers, les résolutions, le divers, la veille, les
    opportunités d'apprendre, etc. est perdu avant même d'arriver à l'étape
    d'extraction du JSON final — d'où des champs vides sur les réunions
    longues (comité d'étude denses, multi-dossiers) qui déclenchent le
    découpage en chunks. On demande donc explicitement TOUS les éléments
    structurés, avec le même niveau de détail que le JSON final.
    """
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"""Résume cette partie ({chunk_index+1}/{total_chunks}) d'une transcription de réunion (comité d'étude bancaire).
Ne fais PAS un résumé générique : extrais et conserve explicitement, s'ils sont présents dans ce passage,
TOUS les éléments suivants, avec les noms propres et détails exacts (ne paraphrase pas les noms) :

- Participants mentionnés (noms, rôles)
- Pour CHAQUE dossier d'étude ou protocole présenté : son intitulé exact, la nature du document
  (ex: Rapport d'Étude, Protocole), le nom de l'analyste/présentateur, les observations et
  recommandations précises formulées par les participants, la décision du comité sur ce dossier
  (validé / validé sous réserve / rejeté...), et le délai éventuel accordé
- Résolutions ou engagements officiels pris par le comité (qui s'engage à faire quoi, et quand)
- Tâches assignées (qui, quoi, échéance)
- Décisions prises
- Points de veille technologique ou sectorielle évoqués
- Faits marquants de la période
- Points "divers" abordés en fin de séance (souvent annoncés par "un point divers", "pour finir...")
- Pénalité/contribution de type tontine UNIQUEMENT si une amende/sanction/montant
  est explicitement prononcé à l'oral envers une personne nommée. N'invente pas de
  pénalité à partir d'un simple incident (retard, déconnexion, écran figé) non
  sanctionné. Montant 2500 FCFA par défaut quand une amende est bien évoquée.
- Tout rapporteur désigné pour la séance actuelle ou la prochaine séance

Si un de ces éléments n'apparaît pas dans ce passage, ne l'invente pas, ignore-le simplement.

Transcription :
\"\"\"{chunk}\"\"\"

Résumé structuré :"""
        }]
    )
    input_t = message.usage.input_tokens
    output_t = message.usage.output_tokens
    cost_fcfa = (input_t * 0.80 + output_t * 4.00) / 1_000_000 * 655.957
    print(f"[CHUNK {chunk_index+1}/{total_chunks}] input={input_t} output={output_t} → {cost_fcfa:.2f} FCFA")
    return message.content[0].text.strip()


def extract_json(text: str) -> str:
    """Extrait proprement le JSON d'une réponse texte."""
    text = text.strip()

    # Supprimer les balises markdown ```json ... ```
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                text = part
                break

    # Trouver le JSON entre la première { et la dernière }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]

    return text.strip()


def safe_parse_json(text: str) -> dict:
    """Parse le JSON avec tentative de correction automatique si échec."""
    cleaned = extract_json(text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[JSON ERROR] {e} — tentative de correction...")

        # Demander à Claude de corriger le JSON
        retry_message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,  # aligné sur l'analyse finale, sinon la correction retronque
            temperature=0,
            messages=[{
                "role": "user",
                "content": f"""Ce JSON est invalide. Corrige UNIQUEMENT les erreurs de syntaxe JSON 
(guillemets manquants, virgules, caractères spéciaux non échappés).
Retourne UNIQUEMENT le JSON corrigé, sans texte avant ou après, sans backticks.

JSON à corriger :
{cleaned}"""
            }]
        )
        retry_text = retry_message.content[0].text.strip()
        retry_cleaned = extract_json(retry_text)

        try:
            return json.loads(retry_cleaned)
        except json.JSONDecodeError:
            # Retourner un dict minimal pour ne pas bloquer
            print("[JSON ERROR] Impossible de parser, retour structure minimale")
            return {
                "title": "Réunion",
                "date": None,
                "duration": None,
                "lieu": None,
                "heure_debut": None,
                "heure_fin": None,
                "president": None,
                "rapporteur": None,
                "participants": [],
                "ordre_du_jour": [],
                "problematique": "",
                "objectifs": [],
                "summary": "",
                "solutions": [],
                "consequences": [],
                "decisions": [],
                "tasks": [],
                "activites_recommandations": [],
                "resolutions": [],
                "points_veille": None,
                "faits_saillants": None,
                "divers": None,
                "opportunites_apprendre": [],
                "solde_tontine": None,
                "rapporteurs_planification": []
            }


def analyze_transcript(transcript: str) -> dict:
    """
    Analyse la transcription et extrait les infos structurées de la réunion.
    Gère automatiquement les transcriptions longues par chunks.
    """
    # Liste officielle des locuteurs, extraite des balises <v Nom> AVANT nettoyage.
    # Source de vérité pour les participants (noms complets réels).
    official_speakers = extract_speakers_from_vtt(transcript)

    transcript = clean_transcript(transcript)
    chunks = split_transcript(transcript)

    # Si plusieurs chunks, résumer chaque partie d'abord
    if len(chunks) > 1:
        summaries = []
        for i, chunk in enumerate(chunks):
            summary = summarize_chunk(chunk, i, len(chunks))
            summaries.append(f"Partie {i+1}/{len(chunks)} :\n{summary}")
        text_to_analyze = "\n\n".join(summaries)
    else:
        text_to_analyze = chunks[0]

    # Bloc à injecter dans le prompt : la liste fait autorité sur les participants.
    if official_speakers:
        real_names = [s for s in official_speakers if not _GENERIC_SPEAKER_RE.match(s)]
        generic_names = [s for s in official_speakers if _GENERIC_SPEAKER_RE.match(s)]

        speakers_block = (
            "LISTE OFFICIELLE DES PARTICIPANTS (source de vérité, extraite des "
            "métadonnées de la visioconférence — utilise EXACTEMENT ces noms "
            "complets, ne les tronque pas en prénoms et n'en invente pas d'autres) :\n- "
            + "\n- ".join(real_names)
        )
        if generic_names:
            speakers_block += (
                "\n\nCOMPTES GÉNÉRIQUES PARTAGÉS présents dans le transcript : "
                + ", ".join(generic_names)
                + ".\nCes étiquettes (ex: \"Agent DRI 04\") ne sont PAS des noms de "
                "personnes : ce sont des comptes de connexion partagés, qui peuvent "
                "être utilisés tour à tour par PLUSIEURS personnes. Identifie chaque "
                "personne derrière un compte grâce au texte : elle est interpellée "
                "par son prénom juste avant de prendre la parole (ex: \"Ok Nelly, tu "
                "peux commencer\" → c'est Nelly ; plus loin \"Lionnel, vas-y\" → c'est "
                "Lionnel depuis le même compte).\n"
                "DANS LE TABLEAU \"participants\" : garde ces comptes et affiche-les "
                "au format \"Agent DRI 04 (Nelly)\". Si plusieurs personnes ont utilisé "
                "le compte, liste-les toutes : \"Agent DRI 04 (Nelly, Lionnel)\". Si "
                "aucune personne n'est identifiable, laisse juste \"Agent DRI 04\".\n"
                "PARTOUT AILLEURS (\"analyste\", \"president\", \"rapporteur\", "
                "\"assigned_to\", \"opportunites_apprendre\") : utilise UNIQUEMENT le "
                "prénom réel de la personne précise concernée (ex: \"Nelly\" pour les "
                "dossiers qu'elle présente), jamais le libellé du compte ni le format "
                "entre parenthèses."
            )
    else:
        speakers_block = (
            "Aucune liste officielle de participants n'a pu être extraite des "
            "métadonnées ; identifie les participants à partir du texte."
        )

    # Prompt d'analyse finale structurée
    prompt = f"""Tu es un expert en rédaction de comptes-rendus professionnels.
Analyse ce contenu de réunion et extrais les informations suivantes.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans backticks.
Assure-toi que tous les guillemets dans les valeurs sont échappés avec \\.

RÈGLES IMPORTANTES :
- Les préfixes de locuteur du type "Agent DRI 04:" sont des comptes de connexion
  techniques PARTAGÉS, PAS des noms de personnes. ATTENTION : un même compte
  "Agent DRI 04" peut être utilisé tour à tour par PLUSIEURS personnes physiques
  (poste partagé). Identifie chaque personne grâce au texte : elle est interpellée
  par son prénom juste avant de parler. Ex : le président dit "Ok Nelly, tu peux
  commencer" → la personne qui présente depuis ce compte est Nelly ; mais si plus
  tard quelqu'un d'autre est nommé avant de parler depuis le même compte (ex:
  "Lionnel, vas-y"), c'est alors Lionnel qui s'exprime.
- "participants" : remplis ce tableau EXCLUSIVEMENT à partir de la LISTE OFFICIELLE
  DES PARTICIPANTS fournie ci-dessous. Reprends chaque nom EXACTEMENT tel qu'il y
  figure (nom complet, ex: "Loic KAMENI NDASSI", jamais seulement "Loïc"). Inclus
  TOUS les participants de cette liste, même ceux qui parlent peu. N'ajoute aucun
  nom absent de la liste et n'invente pas de participant à partir d'un prénom
  entendu à l'oral. CAS PARTICULIER des comptes génériques partagés ("Agent DRI 04") :
  ne les supprime PAS du tableau, mais affiche-les au format "Agent DRI 04 (Nelly)".
  Si PLUSIEURS personnes ont visiblement utilisé ce compte au cours de la réunion,
  liste-les TOUTES entre parenthèses, séparées par des virgules, ex:
  "Agent DRI 04 (Nelly, Lionnel)". Si aucune personne réelle n'est identifiable,
  garde juste "Agent DRI 04".
- EN REVANCHE, pour "analyste", "rapporteur", "president", les "assigned_to" des
  tâches/résolutions, et les noms dans "opportunites_apprendre" : n'utilise JAMAIS
  le libellé du compte ni le format avec parenthèses. Utilise UNIQUEMENT le nom
  réel de LA personne précise concernée (ex: "Nelly" comme analyste des dossiers
  qu'elle a présentés, jamais "Agent DRI 04" ni "Agent DRI 04 (Nelly)"). Quand
  plusieurs personnes partagent le compte, attribue chaque action à la BONNE
  personne selon qui parlait à ce moment-là (la présentation des dossiers = Nelly).
- Pour "president", "rapporteur" et les "assigned_to" : quand la personne
  correspond à quelqu'un de la liste officielle, utilise son NOM COMPLET tel qu'il
  apparaît dans cette liste (rapproche le prénom entendu à l'oral du nom complet :
  "Gaël" -> "Gael KIAMPI", "Vianney" -> "Brondol Vianney NENGOUEYE TAKAM", etc.).
- "president" et "rapporteur" doivent être un NOM PROPRE de personne. N'utilise
  JAMAIS le mot générique de la fonction lui-même ("Président", "Le président") comme valeur : si
  seul le titre de fonction est utilisé pour s'adresser à la personne sans qu'un nom propre ne soit
  donné ailleurs dans le texte, mets null plutôt que le mot "Président".
- "activites_recommandations" : CHAQUE dossier, étude ou protocole distinct présenté en séance doit
  donner lieu à UNE entrée, même si plusieurs dossiers sont présentés dans la même réunion. Cherche
  activement les moments où quelqu'un présente un "rapport d'étude", une "étude sur...", un
  "protocole de...", etc. — pas seulement un unique dossier "principal".
- "resolutions" : chaque résolution doit être formulée EXACTEMENT comme dans le gabarit officiel,
  c'est-à-dire "Nom de la personne : action ou engagement précis – délai", par exemple
  "Laurent AMBASSA : Améliorer le rapport NPL (Pareto, enquête GFC) – Prochaine séance". Cherche
  activement, pour chaque résolution, QUI s'est engagé à faire l'action ou QUI l'a proposée — la
  personne est presque toujours nommée juste avant ou juste après la résolution dans l'échange. Si
  et seulement si aucune personne précise n'est identifiable et que c'est une décision collective,
  utilise "Comité : ..." plutôt que de laisser le nom vide.
- "opportunites_apprendre" : système de pénalité/contribution façon tontine interne.
  RÈGLE STRICTE pour éviter toute ambiguïté : ne crée une entrée QUE si le texte
  mentionne EXPLICITEMENT une amende, une sanction, une pénalité ou un montant à
  payer visant une personne nommée (mots déclencheurs : "amende", "pénalité",
  "sanction", "tu paies", "2500", "tu dois mettre", "caisse/tontine", etc.).
  N'INFÈRE JAMAIS une pénalité à partir d'un simple incident : un retard non
  sanctionné à l'oral, un "écran figé", une déconnexion, un problème de connexion
  subi, une perturbation technique NE comptent PAS tant qu'aucune amende n'est
  explicitement prononcée à leur sujet. En cas de doute, NE crée PAS d'entrée
  (laisse la liste vide). Quand une entrée est justifiée, le "montant" est 2500
  (FCFA) par défaut sauf si un autre montant est cité.
- "divers" : cherche spécifiquement une intervention en fin de séance introduite par "un point
  divers", "pour finir", "avant de clore"... Si trouvée, résume-la ; sinon seulement, laisse null.
- "ai_confidence" : ce score mesure UNIQUEMENT ta confiance dans la justesse de ce que tu as extrait
  étant donné le texte disponible — PAS la qualité intrinsèque de l'enregistrement/transcription.
  Une réunion réelle contient toujours des hésitations, coupures, "allô", interruptions, erreurs de
  reconnaissance vocale sur les noms propres : ce sont des caractéristiques NORMALES d'une
  transcription réelle, pas des défauts qui doivent faire baisser ce score. Pose-toi plutôt la
  question : "les informations que j'ai mises dans ce JSON sont-elles fidèles à ce qui est dit,
  même si le texte source autour est confus ?" Si oui, le score doit être élevé (80-95) même si la
  transcription elle-même est très bruyante. Ne descends sous 60 que si des champs IMPORTANTS
  (dossiers présentés, décisions, tâches) n'ont VRAIMENT pas pu être identifiés du tout, pas
  simplement parce que des détails secondaires (un nom propre mal orthographié, un chiffre incertain)
  restent approximatifs.

Contenu :
\"\"\"
{text_to_analyze}
\"\"\"

{speakers_block}

Retourne UNIQUEMENT ce JSON (pas de texte avant ou après) :
{{
  "title": "titre court et descriptif de la réunion",
  "date": "date au format ISO 8601 si mentionnée, sinon null",
  "duration": "durée en MINUTES sous forme de NOMBRE ENTIER uniquement (ex: 120), jamais de texte comme '120 minutes'. null si inconnue",
  "ai_confidence": "score entier de 0 à 100 représentant ta confiance dans la JUSTESSE de ce que tu as extrait compte tenu du texte disponible (PAS une note de qualité de l'enregistrement)",
  "lieu": "lieu de la réunion si mentionné, sinon null",
  "heure_debut": "heure de début au format HH:MM si mentionnée, sinon null",
  "heure_fin": "heure de fin au format HH:MM si mentionnée, sinon null",
  "president": "nom du président de séance si mentionné, sinon null",
  "rapporteur": "nom du rapporteur si mentionné, sinon null",
  "participants": [
    {{"name": "nom complet", "role": "fonction ou rôle précis ou null", "present": true}}
  ],
  "ordre_du_jour": [
    "point 1 de l'ordre du jour",
    "point 2"
  ],
  "problematique": "description claire du problème ou contexte qui a motivé cette réunion en 2-3 phrases",
  "objectifs": [
    "objectif 1 de la réunion",
    "objectif 2"
  ],
  "summary": "résumé exécutif complet en 4-6 phrases",
  "solutions": [
    "solution ou approche proposée et validée 1",
    "solution 2"
  ],
  "consequences": [
    "impact ou conséquence attendue 1",
    "impact 2"
  ],
  "decisions": [
    "décision officielle prise 1",
    "décision 2"
  ],
  "tasks": [
    {{
      "title": "description précise de la tâche",
      "assigned_to": "nom de la personne assignée ou null",
      "due_date": "date limite ISO 8601 ou null"
    }}
  ],
  "activites_recommandations": [
    {{
      "date": "date de présentation du dossier (JJ/MM/AAAA) ou null",
      "dossier": "nom ou intitulé du dossier présenté",
      "nature_document": "nature du document présenté (ex: Rapport d'étude)",
      "analyste": "nom de l'analyste en charge",
      "observations": "observations et recommandations formulées",
      "decision_comite": "décision prise par le comité sur ce dossier",
      "delais": "délai accordé ou échéance, ou null"
    }}
  ],
  "resolutions": [
    "Nom de la personne : résolution officielle 1 (avec délai si mentionné)",
    "Nom de la personne : résolution 2"
  ],
  "points_veille": "texte libre sur les points de veille technologique ou sectorielle abordés, ou null",
  "faits_saillants": "texte libre sur les faits marquants de la période, ou null",
  "divers": "texte libre pour les points divers abordés en fin de séance, ou null",
  "opportunites_apprendre": [
    {{
      "nom": "nom complet de la personne",
      "motif": "motif de la contribution ou pénalité (ex: Retard, Trouble)",
      "montant": "montant en FCFA",
      "date": "date concernée (JJ/MM/AAAA)",
      "statut": "statut du paiement ou null"
    }}
  ],
  "solde_tontine": "montant total ou solde de la tontine/caisse si mentionné, sinon null",
  "rapporteurs_planification": [
    "nom du 1er rapporteur planifié pour la prochaine séance",
    "nom du 2e rapporteur"
  ]
}}"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        # 8192 (et non 4096) : avec 4096, la sortie JSON d'un compte rendu
        # multi-dossiers détaillé était coupée EN PLEIN MILIEU (output=4096
        # = limite atteinte), produisant un JSON tronqué -> erreur de parsing
        # "Expecting ',' delimiter" -> repli, et perte des champs situés en fin
        # de schéma (faits_saillants, opportunites_apprendre, rapporteurs...).
        max_tokens=8192,
        # temperature=0 : extraction la plus déterministe possible. Deux analyses
        # de la MÊME transcription donnent (quasi) le même JSON, au lieu de voir
        # un champ apparaître à un run et disparaître au suivant.
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    input_t = message.usage.input_tokens
    output_t = message.usage.output_tokens
    cost_fcfa = (input_t * 0.80 + output_t * 4.00) / 1_000_000 * 655.957
    print(f"[ANALYSE FINALE] input={input_t} output={output_t} → {cost_fcfa:.2f} FCFA")

    return safe_parse_json(message.content[0].text)