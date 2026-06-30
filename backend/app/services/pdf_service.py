from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, BaseDocTemplate, Frame, PageTemplate
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas as rl_canvas
from io import BytesIO
from datetime import datetime
from typing import Optional
import json

# ── Palette ─────────────────────────────────────────────────────
COLOR_RED    = colors.HexColor("#C41230")
COLOR_YELLOW = colors.HexColor("#FFCC00")
COLOR_DARK   = colors.HexColor("#231F20")
COLOR_WHITE  = colors.HexColor("#FFFFFF")
COLOR_LIGHT  = colors.HexColor("#F8F8F8")
COLOR_BORDER = colors.HexColor("#E5E7EB")
COLOR_GREY   = colors.HexColor("#6B7280")

def hex_to_color(hex_str: str):
    try:
        return colors.HexColor(hex_str)
    except:
        return COLOR_RED

def parse_json_field(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        return json.loads(value)
    except:
        return []

class MeetingReportDoc(BaseDocTemplate):
    def __init__(self, buffer, company_name, primary_color, meeting_title, **kwargs):
        super().__init__(buffer, **kwargs)
        self.company_name = company_name
        self.primary_color = primary_color
        self.meeting_title = meeting_title
        self.page_width, self.page_height = A4

        frame = Frame(
            2*cm, 2.8*cm,
            self.page_width - 4*cm,
            self.page_height - 5.8*cm,
            id='main', leftPadding=0, rightPadding=0,
            topPadding=0, bottomPadding=0
        )
        template = PageTemplate(id='main', frames=frame, onPage=self._draw_page)
        self.addPageTemplates([template])

    def _draw_page(self, canv, doc):
        canv.saveState()
        w, h = A4

        # ── Bandeau rouge en-tête ────────────────────────────────
        canv.setFillColor(self.primary_color)
        canv.rect(0, h - 2.8*cm, w, 2.8*cm, fill=1, stroke=0)

        # Bande jaune fine
        canv.setFillColor(COLOR_YELLOW)
        canv.rect(0, h - 3.1*cm, w, 0.3*cm, fill=1, stroke=0)

        # Nom entreprise
        canv.setFillColor(COLOR_WHITE)
        canv.setFont("Helvetica-Bold", 14)
        canv.drawString(2*cm, h - 1.6*cm, self.company_name.upper())

        # Sous-titre droit
        canv.setFont("Helvetica", 8)
        canv.setFillColor(colors.HexColor("#FFCC00"))
        canv.drawRightString(w - 2*cm, h - 1.3*cm, "COMPTE-RENDU DE RÉUNION")
        canv.setFillColor(COLOR_WHITE)
        canv.setFont("Helvetica", 7)
        canv.drawRightString(w - 2*cm, h - 1.8*cm, "Document confidentiel — Usage interne")

        # ── Pied de page sombre ──────────────────────────────────
        canv.setFillColor(COLOR_DARK)
        canv.rect(0, 0, w, 2.2*cm, fill=1, stroke=0)

        canv.setFillColor(COLOR_YELLOW)
        canv.rect(0, 2.2*cm, w, 0.15*cm, fill=1, stroke=0)

        canv.setFillColor(COLOR_WHITE)
        canv.setFont("Helvetica", 8)
        generated = datetime.now().strftime("%d/%m/%Y à %H:%M")
        canv.drawString(2*cm, 1.3*cm, f"MeetingAI  •  Généré le {generated}")
        canv.drawString(2*cm, 0.7*cm, self.meeting_title[:80])

        canv.setFont("Helvetica-Bold", 10)
        canv.setFillColor(COLOR_YELLOW)
        canv.drawRightString(w - 2*cm, 1.0*cm, f"Page {doc.page}")

        canv.restoreState()


def section_block(title: str, primary_color, icon: str = "■") -> list:
    """Retourne un bloc titre de section stylé."""
    style = ParagraphStyle(
        "Sec", fontName="Helvetica-Bold", fontSize=11,
        textColor=primary_color,
        spaceBefore=18, spaceAfter=0,
    )
    elements = []
    elements.append(Paragraph(f"{icon}  {title.upper()}", style))
    elements.append(HRFlowable(
        width="100%", thickness=1.5,
        color=primary_color, spaceAfter=8
    ))
    return elements


def numbered_list(items: list, primary_color) -> list:
    """Liste numérotée avec badge coloré."""
    elements = []
    for i, item in enumerate(items, 1):
        row = [[
            Paragraph(f"<b>{i:02d}</b>", ParagraphStyle(
                "Num", fontName="Helvetica-Bold", fontSize=10,
                textColor=COLOR_WHITE, alignment=TA_CENTER
            )),
            Paragraph(str(item), ParagraphStyle(
                "Item", fontName="Helvetica", fontSize=10,
                textColor=COLOR_DARK, leading=15
            ))
        ]]
        t = Table(row, colWidths=[1.0*cm, 16.0*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), primary_color),
            ("BACKGROUND", (1, 0), (1, 0), COLOR_LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.12*cm))
    return elements


def bullet_list(items: list) -> list:
    """Liste à puces simple."""
    style = ParagraphStyle(
        "Bul", fontName="Helvetica", fontSize=10,
        textColor=COLOR_DARK, leading=15,
        leftIndent=14, spaceAfter=4
    )
    return [Paragraph(f"— {item}", style) for item in items]


def generate_meeting_pdf(
    meeting: dict,
    company_name: str = "Mon Entreprise",
    company_logo_path: Optional[str] = None,
    primary_color_hex: str = "#C41230",
    font_name: str = "Helvetica",
) -> bytes:

    buffer = BytesIO()
    primary_color = hex_to_color(primary_color_hex)
    meeting_title = meeting.get("title", "Réunion")

    doc = MeetingReportDoc(
        buffer,
        company_name=company_name,
        primary_color=primary_color,
        meeting_title=meeting_title,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=3.5*cm, bottomMargin=3.0*cm,
    )

    style_title = ParagraphStyle(
        "T", fontName="Helvetica-Bold", fontSize=20,
        textColor=COLOR_DARK, alignment=TA_CENTER,
        spaceBefore=6, spaceAfter=4,leading=25
    )
    style_meta = ParagraphStyle(
        "M", fontName="Helvetica", fontSize=9,
        textColor=COLOR_GREY, alignment=TA_CENTER, spaceAfter=10
    )
    style_body = ParagraphStyle(
        "B", fontName="Helvetica", fontSize=10,
        textColor=COLOR_DARK, leading=16,
        alignment=TA_JUSTIFY, spaceAfter=6
    )
    style_label_white = ParagraphStyle(
        "LW", fontName="Helvetica-Bold", fontSize=9,
        textColor=COLOR_WHITE, alignment=TA_CENTER
    )
    style_cell = ParagraphStyle(
        "C", fontName="Helvetica", fontSize=10,
        textColor=COLOR_DARK, leading=14
    )

    elements = []

    # ── TITRE ────────────────────────────────────────────────────
    elements.append(Spacer(1, 0.9*cm))
    elements.append(Paragraph(meeting_title, style_title))
    elements.append(Spacer(1, 0.5*cm))

    # Date & durée
    meeting_date = meeting.get("date", "")
    date_str = datetime.now().strftime("%d %B %Y")
    if meeting_date:
        try:
            dt = datetime.fromisoformat(str(meeting_date).replace("Z", "+00:00"))
            date_str = dt.strftime("%d %B %Y  •  %H:%M")
        except:
            pass
    duration = meeting.get("duration")
    dur_str = f"  •  Durée : {duration} min" if duration else ""
    elements.append(Paragraph(f"{date_str}{dur_str}", style_meta))
    elements.append(Spacer(1, 0.3*cm))

    # ── BANDEAU STATISTIQUES ─────────────────────────────────────
    participants = meeting.get("participants", [])
    tasks        = parse_json_field(meeting.get("tasks", []))
    decisions    = parse_json_field(meeting.get("decisions", []))
    objectifs    = parse_json_field(meeting.get("objectifs", []))
    solutions    = parse_json_field(meeting.get("solutions", []))
    consequences = parse_json_field(meeting.get("consequences", []))
    problematique = meeting.get("problematique", "")

    stats = [
        [
            Paragraph(f"<b>{len(participants)}</b>", ParagraphStyle("SN", fontName="Helvetica-Bold", fontSize=22, textColor=COLOR_YELLOW, alignment=TA_CENTER)),
            Paragraph(f"<b>{len(decisions)}</b>",    ParagraphStyle("SN2", fontName="Helvetica-Bold", fontSize=22, textColor=COLOR_YELLOW, alignment=TA_CENTER)),
            Paragraph(f"<b>{len(tasks)}</b>",        ParagraphStyle("SN3", fontName="Helvetica-Bold", fontSize=22, textColor=COLOR_YELLOW, alignment=TA_CENTER)),
        ],
        [
            Paragraph("PARTICIPANTS", style_label_white),
            Paragraph("DÉCISIONS",    style_label_white),
            Paragraph("TÂCHES",       style_label_white),
        ]
    ]
    stats_table = Table(stats, colWidths=[5.7*cm, 5.7*cm, 5.6*cm], rowHeights=[1.2*cm, 0.7*cm])
    stats_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_DARK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEAFTER", (0, 0), (1, -1), 0.5, COLOR_GREY),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 0.5*cm))

    # ── PROBLÉMATIQUE ────────────────────────────────────────────
    if problematique:
        elements += section_block("Problématique", primary_color, "◆")
        prob_data = [[Paragraph(problematique, style_body)]]
        prob_table = Table(prob_data, colWidths=[17*cm])
        prob_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF0F2")),
            ("LINEBEFORE", (0, 0), (0, -1), 5, primary_color),
            ("PADDING", (0, 0), (-1, -1), 12),
        ]))
        elements.append(prob_table)

    # ── OBJECTIFS ────────────────────────────────────────────────
    if objectifs:
        elements += section_block("Objectifs", primary_color, "◆")
        elements += numbered_list(objectifs, primary_color)

    # ── RÉSUMÉ EXÉCUTIF ──────────────────────────────────────────
    summary = meeting.get("summary", "")
    if summary:
        elements += section_block("Résumé exécutif", primary_color, "◆")
        elements.append(Paragraph(summary, style_body))

    # ── SOLUTIONS ────────────────────────────────────────────────
    if solutions:
        elements += section_block("Solutions & Approches", primary_color, "◆")
        elements += numbered_list(solutions, primary_color)

    # ── CONSÉQUENCES ─────────────────────────────────────────────
    if consequences:
        elements += section_block("Conséquences & Impacts attendus", primary_color, "◆")
        elements += bullet_list(consequences)

    # ── DÉCISIONS ────────────────────────────────────────────────
    if decisions:
        elements += section_block("Décisions officielles", primary_color, "◆")
        elements += numbered_list(decisions, primary_color)

    # ── PARTICIPANTS ─────────────────────────────────────────────
    if participants:
        elements += section_block("Participants", primary_color, "◆")
        p_data = [[
            Paragraph("<b>Nom</b>", style_label_white),
            Paragraph("<b>Fonction / Rôle</b>", style_label_white)
        ]]
        for p in participants:
            p_data.append([
                Paragraph(p.get("name", ""), style_cell),
                Paragraph(p.get("role") or "—", style_cell)
            ])
        p_table = Table(p_data, colWidths=[8.5*cm, 8.5*cm])
        p_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(p_table)

    # ── TÂCHES ───────────────────────────────────────────────────
    if tasks:
        elements += section_block("Plan d'action — Tâches assignées", primary_color, "◆")
        t_data = [[
            Paragraph("<b>#</b>", style_label_white),
            Paragraph("<b>Tâche</b>", style_label_white),
            Paragraph("<b>Responsable</b>", style_label_white),
            Paragraph("<b>Échéance</b>", style_label_white),
        ]]
        for i, t in enumerate(tasks, 1):
            due = t.get("due_date", "")
            if due and due != "None":
                try:
                    due_dt = datetime.fromisoformat(str(due).replace("Z", "+00:00"))
                    due = due_dt.strftime("%d/%m/%Y")
                except:
                    pass
            else:
                due = "—"

            t_data.append([
                    Paragraph(f"<b>{i:02d}</b>", ParagraphStyle(
                    "TN", fontName="Helvetica-Bold", fontSize=10,
                    textColor=primary_color, alignment=TA_CENTER
                )),
                Paragraph(str(t.get("title", "")), style_cell),
                Paragraph(str(t.get("assigned_to") or "—"), style_cell),
                Paragraph(due, ParagraphStyle(
                    "Due", fontName="Helvetica-Bold", fontSize=9,
                    textColor=COLOR_DARK, alignment=TA_CENTER
                )),
            ])

        t_table = Table(t_data, colWidths=[1.2*cm, 9.6*cm, 3.8*cm, 2.4*cm])
        t_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (3, 1), (3, -1), colors.HexColor("#FFFBEB")),
        ]))
        elements.append(t_table)

    elements.append(Spacer(1, 1*cm))

    doc.build(elements)
    return buffer.getvalue()