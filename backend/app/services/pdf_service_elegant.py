from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from io import BytesIO
from datetime import datetime
import json

# ── Constantes ───────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
SIDEBAR_W      = 3.2*cm
ACCENT_W       = 0.35*cm
THIN_W         = 0.07*cm
LEFT_MARGIN    = SIDEBAR_W + ACCENT_W + THIN_W + 0.8*cm
RIGHT_MARGIN   = LEFT_MARGIN - SIDEBAR_W - ACCENT_W - THIN_W
TOP_MARGIN     = 3.2*cm
BOTTOM_MARGIN  = 3.0*cm

def hex_to_color(h):
    try: return colors.HexColor(h)
    except: return colors.HexColor("#C41230")

def parse_json_field(value):
    if not value: return []
    if isinstance(value, list): return value
    try: return json.loads(value)
    except: return []


def make_page_decorator(company_name, primary_color, accent_color, dark_color, meeting_title):
    """Retourne la fonction de décoration de page (barre latérale + header + footer)."""
    def draw_page(canv, doc):
        canv.saveState()
        w, h = A4

        # Barre latérale sombre
        canv.setFillColor(dark_color)
        canv.rect(0, 0, SIDEBAR_W, h, fill=1, stroke=0)

        # Bande couleur primaire
        canv.setFillColor(primary_color)
        canv.rect(SIDEBAR_W, 0, ACCENT_W, h, fill=1, stroke=0)

        # Trait accent fin
        canv.setFillColor(accent_color)
        canv.rect(SIDEBAR_W + ACCENT_W, 0, THIN_W, h, fill=1, stroke=0)

        # Nom entreprise vertical
        canv.setFillColor(colors.white)
        canv.setFont("Helvetica-Bold", 10)
        canv.saveState()
        canv.translate(SIDEBAR_W / 2, h / 2)
        canv.rotate(90)
        canv.drawCentredString(0, 0, company_name.upper())
        canv.restoreState()

        # Badge MeetingAI en haut
        canv.setFillColor(accent_color)
        canv.setFont("Helvetica-Bold", 8)
        canv.drawCentredString(SIDEBAR_W / 2, h - 1.6*cm, "MEETING")
        canv.setFillColor(colors.white)
        canv.drawCentredString(SIDEBAR_W / 2, h - 2.1*cm, "AI")

        # Numéro de page en bas
        canv.setFillColor(colors.white)
        canv.setFont("Helvetica-Bold", 15)
        canv.drawCentredString(SIDEBAR_W / 2, 1.8*cm, str(doc.page))
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#888888"))
        canv.drawCentredString(SIDEBAR_W / 2, 1.3*cm, "PAGE")

        # En-tête zone contenu
        canv.setFillColor(colors.HexColor("#aaaaaa"))
        canv.setFont("Helvetica", 7)
        generated = datetime.now().strftime("%d/%m/%Y à %H:%M")
        canv.drawString(LEFT_MARGIN, h - 0.9*cm,
                        f"Généré le {generated}  •  Document confidentiel")
        canv.drawRightString(w - RIGHT_MARGIN, h - 0.9*cm, "COMPTE-RENDU DE RÉUNION")
        canv.setStrokeColor(colors.HexColor("#eeeeee"))
        canv.setLineWidth(0.5)
        canv.line(LEFT_MARGIN, h - 1.2*cm, w - RIGHT_MARGIN, h - 1.2*cm)

        # Pied de page zone contenu
        canv.line(LEFT_MARGIN, 2.5*cm, w - RIGHT_MARGIN, 2.5*cm)
        canv.setFillColor(colors.HexColor("#aaaaaa"))
        canv.setFont("Helvetica", 7)
        title_short = (meeting_title[:65] + "...") if len(meeting_title) > 65 else meeting_title
        canv.drawString(LEFT_MARGIN, 1.9*cm, title_short)

        canv.restoreState()
    return draw_page


def make_section_title(text, primary_color, content_w):
    data = [[Paragraph(f"<b>{text.upper()}</b>", ParagraphStyle(
        "SB", fontName="Helvetica-Bold", fontSize=9,
        textColor=primary_color, leading=14
    ))]]
    t = Table(data, colWidths=[content_w])
    t.setStyle(TableStyle([
        ("LINEBELOW",     (0, 0), (-1, -1), 1.5, primary_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    return [t]


def make_numbered_items(items, primary_color, accent_color, content_w):
    NUM_W  = 0.75*cm
    TEXT_W = content_w - NUM_W
    elements = []
    for i, item in enumerate(items, 1):
        bg = primary_color if i % 2 == 1 else accent_color
        tc = colors.white if i % 2 == 1 else colors.HexColor("#231F20")
        row = [[
            Paragraph(f"<b>{i:02d}</b>", ParagraphStyle(
                "N", fontName="Helvetica-Bold", fontSize=9,
                textColor=tc, alignment=TA_CENTER
            )),
            Paragraph(str(item), ParagraphStyle(
                "I", fontName="Helvetica", fontSize=9,
                textColor=colors.HexColor("#231F20"), leading=14
            ))
        ]]
        t = Table(row, colWidths=[NUM_W, TEXT_W])
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (0, 0), bg),
            ("BACKGROUND",  (1, 0), (1, 0), colors.HexColor("#fafafa")),
            ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",     (0, 0), (-1, -1), 6),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.1*cm))
    return elements


def make_bullet_items(items, primary_color, cw):
    out = []
    s_bi = ParagraphStyle(
        "bi", fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#231F20"), leading=14,
        leftIndent=10, spaceBefore=2
    )
    for item in items:
        # Pas de table — juste un Paragraph avec trait gauche simulé via une table 1 colonne
        row = [[Paragraph(f"  {str(item)}", s_bi)]]
        t = Table(row, colWidths=[cw])
        t.setStyle(TableStyle([
            ("LINEBEFORE",  (0, 0), (0, -1), 3, primary_color),
            ("BACKGROUND",  (0, 0), (-1, -1), colors.HexColor("#fafafa")),
            ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",     (0, 0), (-1, -1), 6),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ]))
        out.append(t)
        out.append(Spacer(1, 0.1*cm))
    return out

def generate_meeting_pdf_elegant(
    meeting: dict,
    company_name: str      = "Mon Entreprise",
    primary_color_hex: str = "#C41230",
    accent_color_hex: str  = "#FFCC00",
    dark_color_hex: str    = "#231F20",
    font_name: str         = "Helvetica",
) -> bytes:

    buffer        = BytesIO()
    primary_color = hex_to_color(primary_color_hex)
    accent_color  = hex_to_color(accent_color_hex)
    dark_color    = hex_to_color(dark_color_hex)
    meeting_title = meeting.get("title", "Réunion")

    draw_page = make_page_decorator(
        company_name, primary_color, accent_color, dark_color, meeting_title
    )

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
    )

    # Largeur réelle du contenu (calculée par SimpleDocTemplate)
    content_w = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

    # ── Styles ────────────────────────────────────────────────────
    s_title = ParagraphStyle("T", fontName="Helvetica-Bold", fontSize=16,
        textColor=colors.HexColor("#231F20"), leading=24, spaceBefore=4, spaceAfter=4)
    s_meta  = ParagraphStyle("M", fontName="Helvetica", fontSize=8,
        textColor=colors.HexColor("#888888"), spaceAfter=8)
    s_body  = ParagraphStyle("B", fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#231F20"), leading=15,
        alignment=TA_JUSTIFY, spaceAfter=6)
    s_cell  = ParagraphStyle("C", fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#231F20"), leading=13)
    s_hdr   = ParagraphStyle("CH", fontName="Helvetica-Bold", fontSize=9,
        textColor=colors.white)
    s_num   = ParagraphStyle("TN", fontName="Helvetica-Bold", fontSize=9,
        textColor=primary_color, alignment=TA_CENTER)
    s_due   = ParagraphStyle("Due", fontName="Helvetica-Bold", fontSize=8,
        textColor=colors.HexColor("#231F20"), alignment=TA_CENTER)

    # ── Données ───────────────────────────────────────────────────
    participants  = meeting.get("participants", [])
    tasks         = parse_json_field(meeting.get("tasks", []))
    decisions     = parse_json_field(meeting.get("decisions", []))
    objectifs     = parse_json_field(meeting.get("objectifs", []))
    solutions     = parse_json_field(meeting.get("solutions", []))
    consequences  = parse_json_field(meeting.get("consequences", []))
    problematique = meeting.get("problematique", "")
    summary       = meeting.get("summary", "")

    elements = []

    # ── Titre ─────────────────────────────────────────────────────
    elements.append(Paragraph(meeting_title, s_title))
    meeting_date = meeting.get("date", "")
    date_str = datetime.now().strftime("%d %B %Y")
    if meeting_date:
        try:
            dt = datetime.fromisoformat(str(meeting_date).replace("Z", "+00:00"))
            date_str = dt.strftime("%d %B %Y  •  %H:%M")
        except: pass
    duration = meeting.get("duration")
    elements.append(Paragraph(
        f"{date_str}{'  •  ' + str(duration) + ' min' if duration else ''}", s_meta
    ))

    # ── Bandeau stats ─────────────────────────────────────────────
    STAT_W = content_w / 3
    stats_data = [[
        Paragraph(f"<b>{len(participants)}</b><br/>Participants",
            ParagraphStyle("s1", fontName="Helvetica-Bold", fontSize=13,
                textColor=colors.white, alignment=TA_CENTER, leading=18)),
        Paragraph(f"<b>{len(decisions)}</b><br/>Décisions",
            ParagraphStyle("s2", fontName="Helvetica-Bold", fontSize=13,
                textColor=colors.HexColor("#231F20"), alignment=TA_CENTER, leading=18)),
        Paragraph(f"<b>{len(tasks)}</b><br/>Tâches",
            ParagraphStyle("s3", fontName="Helvetica-Bold", fontSize=13,
                textColor=colors.white, alignment=TA_CENTER, leading=18)),
    ]]
    st = Table(stats_data, colWidths=[STAT_W, STAT_W, STAT_W])
    st.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (0, 0), primary_color),
        ("BACKGROUND",  (1, 0), (1, 0), accent_color),
        ("BACKGROUND",  (2, 0), (2, 0), dark_color),
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",     (0, 0), (-1, -1), 10),
        ("LINEAFTER",   (0, 0), (1, 0), 1, colors.white),
    ]))
    elements.append(st)

    # ── Sections ──────────────────────────────────────────────────
    if problematique:
        elements += make_section_title("Problématique", primary_color, content_w)
        elements.append(Paragraph(problematique, s_body))
    if objectifs:
        elements += make_section_title("Objectifs", primary_color, content_w)
        elements += make_numbered_items(objectifs, primary_color, accent_color, content_w)
    if summary:
        elements += make_section_title("Résumé exécutif", primary_color, content_w)
        elements.append(Paragraph(summary, s_body))
    if solutions:
        elements += make_section_title("Solutions & Approches", primary_color, content_w)
        elements += make_numbered_items(solutions, primary_color, accent_color, content_w)
    if consequences:
        elements += make_section_title("Conséquences & Impacts", primary_color, content_w)
        elements += make_bullet_items(consequences, primary_color, content_w)
    if decisions:
        elements += make_section_title("Décisions officielles", primary_color, content_w)
        elements += make_numbered_items(decisions, primary_color, accent_color, content_w)

    # ── Participants ───────────────────────────────────────────────
    if participants:
        elements += make_section_title("Participants", primary_color, content_w)
        COL1 = content_w * 0.52
        COL2 = content_w * 0.48
        p_data = [[Paragraph("<b>Nom</b>", s_hdr), Paragraph("<b>Rôle</b>", s_hdr)]]
        for p in participants:
            p_data.append([
                Paragraph(p.get("name", ""), s_cell),
                Paragraph(p.get("role") or "—", s_cell)
            ])
        pt = Table(p_data, colWidths=[COL1, COL2])
        pt.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), dark_color),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",       (0, 0), (-1, -1), 7),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(pt)

    # ── Tâches ────────────────────────────────────────────────────
    if tasks:
        elements += make_section_title("Plan d'action — Tâches", primary_color, content_w)
        NUM_W  = 0.7*cm
        RESP_W = 2.6*cm
        DATE_W = 1.8*cm
        TASK_W = content_w - NUM_W - RESP_W - DATE_W
        t_data = [[
            Paragraph("<b>#</b>",           s_hdr),
            Paragraph("<b>Tâche</b>",       s_hdr),
            Paragraph("<b>Responsable</b>", s_hdr),
            Paragraph("<b>Échéance</b>",    s_hdr),
        ]]
        for i, t in enumerate(tasks, 1):
            due = t.get("due_date", "")
            if due and str(due) not in ("None", "null", ""):
                try:
                    due_dt = datetime.fromisoformat(str(due).replace("Z", "+00:00"))
                    due = due_dt.strftime("%d/%m/%Y")
                except: pass
            else:
                due = "—"
            t_data.append([
                Paragraph(f"<b>{i:02d}</b>", s_num),
                Paragraph(str(t.get("title", "")), s_cell),
                Paragraph(str(t.get("assigned_to") or "—"), s_cell),
                Paragraph(due, s_due),
            ])
        tt = Table(t_data, colWidths=[NUM_W, TASK_W, RESP_W, DATE_W])
        tt.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), dark_color),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",       (0, 0), (-1, -1), 7),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND",    (3, 1), (3, -1), colors.HexColor("#FFFBEB")),
        ]))
        elements.append(tt)

    elements.append(Spacer(1, 1*cm))
    doc.build(elements, onFirstPage=draw_page, onLaterPages=draw_page)
    return buffer.getvalue()