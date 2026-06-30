from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas as rl_canvas
from io import BytesIO
from datetime import datetime
import json

PAGE_W, PAGE_H = A4
LEFT_MARGIN   = 1.8*cm
RIGHT_MARGIN  = 1.8*cm
TOP_MARGIN    = 4.5*cm
BOTTOM_MARGIN = 2.5*cm

def hex_to_color(h):
    try: return colors.HexColor(h)
    except: return colors.HexColor("#C41230")

def parse_json_field(value):
    if not value: return []
    if isinstance(value, list): return value
    try: return json.loads(value)
    except: return []


def make_page_decorator(company_name, primary_color, accent_color, dark_color, meeting_title):
    def draw_page(canv, doc):
        canv.saveState()
        w, h = A4

        # ── Bandeau supérieur pleine largeur ─────────────────────
        canv.setFillColor(dark_color)
        canv.rect(0, h - 3.8*cm, w, 3.8*cm, fill=1, stroke=0)

        # Trait coloré sous le bandeau
        canv.setFillColor(primary_color)
        canv.rect(0, h - 4.0*cm, w, 0.2*cm, fill=1, stroke=0)

        # Trait accent fin
        canv.setFillColor(accent_color)
        canv.rect(0, h - 4.2*cm, w, 0.2*cm, fill=1, stroke=0)

        # Carré décoratif gauche
        canv.setFillColor(primary_color)
        canv.rect(0, h - 3.8*cm, 1.2*cm, 3.8*cm, fill=1, stroke=0)

        # Nom entreprise
        canv.setFillColor(colors.white)
        canv.setFont("Helvetica-Bold", 14)
        canv.drawString(1.6*cm, h - 1.6*cm, company_name.upper())

        # Label document
        canv.setFillColor(accent_color)
        canv.setFont("Helvetica-Bold", 8)
        canv.drawString(1.6*cm, h - 2.2*cm, "COMPTE-RENDU DE RÉUNION")

        # Date générée (droite)
        canv.setFillColor(colors.HexColor("#aaaaaa"))
        canv.setFont("Helvetica", 7)
        generated = datetime.now().strftime("%d/%m/%Y à %H:%M")
        canv.drawRightString(w - 1.8*cm, h - 1.6*cm, f"Généré le {generated}")
        canv.drawRightString(w - 1.8*cm, h - 2.2*cm, "Document confidentiel")

        # Trait décoratif vertical dans le bandeau
        canv.setStrokeColor(colors.HexColor("#ffffff33"))
        canv.setLineWidth(0.5)
        canv.line(w - 5*cm, h - 0.4*cm, w - 5*cm, h - 3.4*cm)

        # ── Pied de page ─────────────────────────────────────────
        canv.setFillColor(colors.HexColor("#f5f5f5"))
        canv.rect(0, 0, w, 1.8*cm, fill=1, stroke=0)

        canv.setFillColor(accent_color)
        canv.rect(0, 1.8*cm, w, 0.15*cm, fill=1, stroke=0)

        canv.setFillColor(colors.HexColor("#888888"))
        canv.setFont("Helvetica", 7)
        title_short = (meeting_title[:70] + "...") if len(meeting_title) > 70 else meeting_title
        canv.drawString(1.8*cm, 1.0*cm, title_short)

        canv.setFillColor(dark_color)
        canv.setFont("Helvetica-Bold", 10)
        canv.drawRightString(w - 1.8*cm, 0.8*cm, f"{doc.page}")
        canv.setFont("Helvetica", 7)
        canv.setFillColor(colors.HexColor("#888888"))
        canv.drawRightString(w - 1.8*cm, 1.2*cm, "PAGE")

        canv.restoreState()
    return draw_page


def _card_section(title, primary_color, accent_color, cw):
    """Titre de section avec badge coloré style carte."""
    style = ParagraphStyle(
        "CS", fontName="Helvetica-Bold", fontSize=10,
        textColor=colors.white, leading=14
    )
    data = [[
        Paragraph(f"◆  {title.upper()}", style)
    ]]
    t = Table(data, colWidths=[cw])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), primary_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("LINEBEFORE",    (0, 0), (0, -1), 4, accent_color),
    ]))
    return [t, Spacer(1, 0.15*cm)]


def _two_col_cards(items, primary_color, accent_color, dark_color, cw):
    """Items en grille 2 colonnes style cartes."""
    col_w = (cw - 0.3*cm) / 2
    elements = []
    pairs = [items[i:i+2] for i in range(0, len(items), 2)]
    for pair in pairs:
        row = []
        for item in pair:
            cell_data = [[Paragraph(str(item), ParagraphStyle(
                "CC", fontName="Helvetica", fontSize=9,
                textColor=dark_color, leading=14
            ))]]
            cell_t = Table(cell_data, colWidths=[col_w])
            cell_t.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#fafafa")),
                ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                ("LINEABOVE",     (0, 0), (-1, 0), 2, primary_color),
                ("TOPPADDING",    (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            ]))
            row.append(cell_t)
        # Si nombre impair, ajouter cellule vide
        if len(pair) == 1:
            empty = Table([[Paragraph("", ParagraphStyle("e", fontName="Helvetica", fontSize=9))]], colWidths=[col_w])
            row.append(empty)
        grid_data = [row]
        grid = Table(grid_data, colWidths=[col_w, col_w], spaceBefore=0)
        grid.setStyle(TableStyle([
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING",   (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
            ("COLPADDING",   (0, 0), (-1, -1), 3),
        ]))
        elements.append(grid)
        elements.append(Spacer(1, 0.2*cm))
    return elements


def _numbered_list(items, primary_color, accent_color, cw):
    """Liste numérotée avec badge."""
    NW = 0.75*cm
    TW = cw - NW
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
        t = Table(row, colWidths=[NW, TW])
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (0, 0), bg),
            ("BACKGROUND",  (1, 0), (1, 0), colors.HexColor("#fafafa")),
            ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",     (0, 0), (-1, -1), 7),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.1*cm))
    return elements


def _bullets(items, primary_color, cw):
    """Bullets avec trait gauche, 1 colonne."""
    out = []
    s_bi = ParagraphStyle(
        "bi", fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#231F20"), leading=14,
        leftIndent=10, spaceBefore=2
    )
    for item in items:
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


def generate_meeting_pdf_modern(
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
    cw = doc.width

    # ── Styles ────────────────────────────────────────────────────
    s_title = ParagraphStyle("T", fontName="Helvetica-Bold", fontSize=18,
        textColor=dark_color, leading=26, spaceBefore=0, spaceAfter=4)
    s_meta  = ParagraphStyle("M", fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#888888"), spaceAfter=12)
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
    SW = cw / 3
    stats_data = [[
        Paragraph(f"<b>{len(participants)}</b><br/>Participants",
            ParagraphStyle("s1", fontName="Helvetica-Bold", fontSize=16,
                textColor=primary_color, alignment=TA_CENTER, leading=20)),
        Paragraph(f"<b>{len(decisions)}</b><br/>Décisions",
            ParagraphStyle("s2", fontName="Helvetica-Bold", fontSize=16,
                textColor=primary_color, alignment=TA_CENTER, leading=20)),
        Paragraph(f"<b>{len(tasks)}</b><br/>Tâches",
            ParagraphStyle("s3", fontName="Helvetica-Bold", fontSize=16,
                textColor=primary_color, alignment=TA_CENTER, leading=20)),
    ]]
    st = Table(stats_data, colWidths=[SW, SW, SW])
    st.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), colors.HexColor("#fafafa")),
        ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("LINEABOVE",   (0, 0), (-1, 0), 3, accent_color),
        ("LINEAFTER",   (0, 0), (1, 0), 0.5, colors.HexColor("#e5e7eb")),
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",     (0, 0), (-1, -1), 12),
    ]))
    elements.append(st)
    elements.append(Spacer(1, 0.4*cm))

    # ── Sections ──────────────────────────────────────────────────
    if problematique:
        elements += _card_section("Problématique", primary_color, accent_color, cw)
        prob_data = [[Paragraph(problematique, s_body)]]
        prob_t = Table(prob_data, colWidths=[cw])
        prob_t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#fff5f6")),
            ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING",       (0, 0), (-1, -1), 10),
        ]))
        elements.append(prob_t)
        elements.append(Spacer(1, 0.3*cm))

    if objectifs:
        elements += _card_section("Objectifs", primary_color, accent_color, cw)
        elements += _two_col_cards(objectifs, primary_color, accent_color, dark_color, cw)

    if summary:
        elements += _card_section("Résumé exécutif", primary_color, accent_color, cw)
        elements.append(Paragraph(summary, s_body))
        elements.append(Spacer(1, 0.3*cm))

    if solutions:
        elements += _card_section("Solutions & Approches", primary_color, accent_color, cw)
        elements += _two_col_cards(solutions, primary_color, accent_color, dark_color, cw)

    if consequences:
        elements += _card_section("Conséquences & Impacts", primary_color, accent_color, cw)
        elements += _bullets(consequences, primary_color, cw)
        elements.append(Spacer(1, 0.2*cm))

    if decisions:
        elements += _card_section("Décisions officielles", primary_color, accent_color, cw)
        elements += _numbered_list(decisions, primary_color, accent_color, cw)

    if participants:
        elements += _card_section("Participants", primary_color, accent_color, cw)
        COL1 = cw * 0.52; COL2 = cw * 0.48
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
        elements.append(Spacer(1, 0.3*cm))

    if tasks:
        elements += _card_section("Plan d'action — Tâches", primary_color, accent_color, cw)
        NW=0.7*cm; RW=2.6*cm; DW=1.8*cm; TW=cw-NW-RW-DW
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
        tt = Table(t_data, colWidths=[NW, TW, RW, DW])
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