from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / "die-garage-fahrzeugexpertise.pdf"

orange = colors.HexColor("#ff3b18")
ink = colors.HexColor("#0a0a09")
grey = colors.HexColor("#666666")

doc = SimpleDocTemplate(str(PDF), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm)
title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=34, leading=34, textColor=ink, spaceAfter=8)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=17, leading=20, textColor=ink, spaceBefore=15, spaceAfter=8)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=14, textColor=grey)
small = ParagraphStyle("small", fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=orange, spaceAfter=7)

story = [
    Paragraph("DIE GARAGE / FAHRZEUGEXPERTISE", small),
    Paragraph("1972 PORSCHE<br/>911 S 2.4", title),
    Paragraph("Bericht DG-072-2026 | Erstellt am 15.06.2026 | Musterexpertise", body),
    Spacer(1, 7*mm),
    Image(str(ROOT / "assets" / "hero.jpg"), width=170*mm, height=96*mm),
    Spacer(1, 8*mm),
    Paragraph("FAHRZEUGDATEN", h2),
]

data = [
    ["FIN", "9112300XXX", "Kilometerstand", "84.200 km"],
    ["Erstzulassung", "07/1972", "Leistung", "190 PS"],
    ["Motor", "2.4L Boxer", "Getriebe", "5-Gang manuell"],
    ["Farbe", "Silbermetallic", "Bewertung", "2+ / gepflegt"],
]
table = Table(data, colWidths=[34*mm, 51*mm, 34*mm, 51*mm], rowHeights=11*mm)
table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#eeeeea")),
    ("GRID", (0,0), (-1,-1), .35, colors.HexColor("#c9c9c3")),
    ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (2,0), (2,-1), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
]))
story += [
    table,
    Paragraph("ZUSAMMENFASSUNG", h2),
    Paragraph("Matching-Numbers Klassiker mit nachvollziehbarer Historie. Karosseriestruktur ohne erkennbare Unfallschäden. Lack mit altersgerechten Gebrauchsspuren. Motorlauf, Schaltung und Bremsanlage bei Probefahrt ohne Auffälligkeiten.", body),
    PageBreak(),
    Paragraph("PRÜFPUNKTE", small),
    Paragraph("TECHNISCHER ZUSTAND", title),
]
checks = [
    ["Bereich", "Bewertung", "Bemerkung"],
    ["Motor / Einspritzung", "Sehr gut", "Revidiert 2024, trocken"],
    ["Getriebe / Kupplung", "Gut", "Saubere Schaltwege"],
    ["Fahrwerk / Bremsen", "Sehr gut", "Erneuert 2021"],
    ["Karosserie / Lack", "Gut", "Erhaltenswerte Patina"],
    ["Innenraum", "Sehr gut", "Original und gepflegt"],
]
checks_table = Table(checks, colWidths=[50*mm, 35*mm, 85*mm], rowHeights=12*mm)
checks_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ink), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), .4, colors.HexColor("#cccccc")),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 8), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
]))
story += [
    checks_table,
    Paragraph("SERVICEHISTORIE", h2),
    Paragraph("2026 - Große Inspektion und Ventilspiel<br/>2024 - Einspritzanlage revidiert<br/>2021 - Fahrwerk und Bremsen erneuert", body),
    Paragraph("HINWEIS", h2),
    Paragraph("Diese Musterexpertise dient als Layout- und Funktionsbeispiel. Vor Verkauf wird jedes Fahrzeug erneut geprüft. Angaben ersetzen kein unabhängiges Wertgutachten.", body),
]

def footer(canvas, _doc):
    canvas.saveState()
    canvas.setStrokeColor(orange)
    canvas.line(20*mm, 13*mm, 190*mm, 13*mm)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(ink)
    canvas.drawString(20*mm, 8*mm, "CLASSIC CAR DIE GARAGE GMBH / ROGGWIL / 071 278 60 60")
    canvas.drawRightString(190*mm, 8*mm, f"SEITE {_doc.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(PDF)
