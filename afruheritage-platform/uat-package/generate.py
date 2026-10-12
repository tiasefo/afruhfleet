#!/usr/bin/env python3
"""Generate the Afruheritage customer UAT handover package from tests_data.py."""
import os, html, datetime
from tests_data import DOMAIN, USER_TYPES, TESTS, COMING_SOON

OUT = os.path.dirname(os.path.abspath(__file__))
TODAY = "October 2026"

# ============ DOCX ============
def build_docx():
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(11)

    h = doc.add_heading('Afruheritage — Customer UAT Guide', 0)
    p = doc.add_paragraph()
    p.add_run('User Acceptance Testing Guide for Business Customers\n').bold = True
    p.add_run(f'Testing website: {DOMAIN}\nVersion 1.0 — {TODAY}')

    doc.add_heading('Before you start', 1)
    for line in [
        "You do not need any technical knowledge. Everything happens in a normal web browser (Chrome, Edge, Safari or Firefox).",
        f"All testing starts at {DOMAIN}. You never need to type an address with numbers, ports, or anything technical.",
        "Have access to the email inbox you register with — Afruheritage sends real emails you must open.",
        "Fill in the checklist spreadsheet (AFRUHERITAGE_UAT_CHECKLIST.xlsx) as you go: mark each test PASS, FAIL or BLOCKED and describe what actually happened.",
        "Take a screenshot whenever something does not work — it helps us fix it quickly.",
        "Some capabilities are excluded from the initial launch or still being built — they are listed in the launch-exclusions register at the back of this guide; do not test them.",
        "Known defects you SHOULD report are listed in the Delivery Gaps & Defects register (e.g. missing shipment update emails).",
        "Do not make real payments during testing. Plan and trial selection are free to use.",
    ]:
        doc.add_paragraph(line, style='List Bullet')

    doc.add_heading('Who can test what — user types', 1)
    for ut in USER_TYPES:
        doc.add_heading(ut['name'], 2)
        doc.add_paragraph(f"Who: {ut['who']}")
        doc.add_paragraph(f"What they can do: {ut['can_do']}")
        doc.add_paragraph(f"What they cannot do: {ut['cannot_do']}")

    doc.add_heading('How to run each test', 1)
    doc.add_paragraph(
        "Each test below tells you who should do it, where to begin, exactly what to click, "
        "and what should happen. After finishing, write your result in the checklist: "
        "PASS (worked as described), FAIL (something went wrong) or BLOCKED (you could not "
        "complete the test at all).")

    doc.add_heading('The tests', 1)
    for t in TESTS:
        doc.add_heading(f"{t['id']} — {t['title']}", 2)
        tbl = doc.add_table(rows=4, cols=2)
        tbl.style = 'Light Grid Accent 1'
        tbl.rows[0].cells[0].text = 'Test ID'; tbl.rows[0].cells[1].text = t['id']
        tbl.rows[1].cells[0].text = 'Who should perform this test'; tbl.rows[1].cells[1].text = t['user']
        tbl.rows[2].cells[0].text = 'Business journey'; tbl.rows[2].cells[1].text = t['journey']
        tbl.rows[3].cells[0].text = 'Where to begin'; tbl.rows[3].cells[1].text = t['start']
        doc.add_paragraph()
        doc.add_paragraph('What to do:')
        for i, s in enumerate(t['steps'], 1):
            doc.add_paragraph(f"{i}. {s}", style='List Number')
        doc.add_paragraph('What should happen:')
        doc.add_paragraph(t['expected'])
        doc.add_paragraph('Result:   PASS ☐    FAIL ☐    BLOCKED ☐')
        doc.add_paragraph('What actually happened: ____________________________________________')
        doc.add_paragraph('Comments or problems encountered: ____________________________________')
        doc.add_paragraph('Screenshot reference: ______________________________________________')
        doc.add_paragraph()

    doc.add_heading('Not in the initial launch — do not test these', 1)
    doc.add_paragraph(
        "The capabilities below are excluded from the initial launch or still under "
        "implementation. Do not test them. Known defects are in the Delivery Gaps & "
        "Defects register — those SHOULD be reported.")
    tbl = doc.add_table(rows=1, cols=4)
    tbl.style = 'Light Grid Accent 1'
    for i, htxt in enumerate(['Feature', 'Where it appears', 'Status', 'Notes']):
        tbl.rows[0].cells[i].text = htxt
    for c in COMING_SOON:
        row = tbl.add_row().cells
        row[0].text = c['feature']; row[1].text = c['where']
        row[2].text = c['status']; row[3].text = c.get('note', '')

    doc.add_heading('Emails you should receive', 1)
    for line in [
        "Welcome email — after registering a company (subject mentions your company name).",
        "Invitation email — when a business owner invites you (subject: 'You've been invited to join <company> on Afruheritage').",
        "Password reset email — after using 'Forgot Password' (subject: 'Afruheritage — Password Reset Request').",
        "Support ticket confirmation — after submitting a support ticket on a company portal.",
        "If an expected email does not arrive within 10 minutes, mark the test FAIL and check the spam folder first.",
    ]:
        doc.add_paragraph(line, style='List Bullet')

    doc.add_heading('If something goes wrong', 1)
    doc.add_paragraph(
        "Write down the test ID, what you clicked, what you expected, and what actually happened. "
        "Attach a screenshot to the checklist. Your Afruheritage contact will review all results "
        "at the end of UAT.")

    doc.save(os.path.join(OUT, 'AFRUHERITAGE_CUSTOMER_UAT_GUIDE.docx'))
    print('DOCX written')

# ============ PDF ============
def build_pdf():
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                    TableStyle, PageBreak)

    path = os.path.join(OUT, 'AFRUHERITAGE_CUSTOMER_UAT_GUIDE.pdf')
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=18*mm, bottomMargin=18*mm,
                            title='Afruheritage Customer UAT Guide')
    ss = getSampleStyleSheet()
    H1 = ParagraphStyle('H1', parent=ss['Heading1'], textColor=colors.HexColor('#063f4f'))
    H2 = ParagraphStyle('H2', parent=ss['Heading2'], textColor=colors.HexColor('#0a5568'), spaceBefore=14)
    H3 = ParagraphStyle('H3', parent=ss['Heading3'], textColor=colors.HexColor('#0a5568'))
    B = ParagraphStyle('B', parent=ss['BodyText'], fontSize=10, leading=14)
    S = ParagraphStyle('S', parent=ss['BodyText'], fontSize=10, leading=14, leftIndent=14)

    story = [
        Paragraph('Afruheritage — Customer UAT Guide', ss['Title']),
        Spacer(1, 6),
        Paragraph(f'User Acceptance Testing Guide for Business Customers — {DOMAIN} — Version 1.0, {TODAY}', B),
        Spacer(1, 14),
        Paragraph('Before you start', H1),
    ]
    for line in [
        "You do not need any technical knowledge. Everything happens in a normal web browser.",
        f"All testing starts at {DOMAIN}.",
        "Have access to the email inbox you register with — Afruheritage sends real emails.",
        "Fill in the checklist spreadsheet as you go: PASS, FAIL or BLOCKED for each test.",
        "Take a screenshot whenever something does not work.",
        "Capabilities marked excluded or under implementation are not available — do not test them.",
        "Known defects (in the Delivery Gaps register) SHOULD be reported.",
        "Do not make real payments during testing.",
    ]:
        story.append(Paragraph('• ' + line, S))
    story.append(Paragraph('Who can test what — user types', H1))
    for ut in USER_TYPES:
        story.append(Paragraph(ut['name'], H3))
        story.append(Paragraph(f"<b>Who:</b> {ut['who']}", S))
        story.append(Paragraph(f"<b>Can do:</b> {ut['can_do']}", S))
        story.append(Paragraph(f"<b>Cannot do:</b> {ut['cannot_do']}", S))

    story.append(Paragraph('The tests', H1))
    for t in TESTS:
        story.append(Paragraph(f"{t['id']} — {t['title']}", H2))
        story.append(Paragraph(f"<b>Who:</b> {t['user']} &nbsp;&nbsp; <b>Journey:</b> {t['journey']}", S))
        story.append(Paragraph(f"<b>Where to begin:</b> {t['start']}", S))
        story.append(Paragraph('<b>What to do:</b>', S))
        for i, s in enumerate(t['steps'], 1):
            story.append(Paragraph(f"{i}. {s}", S))
        story.append(Paragraph(f"<b>What should happen:</b> {t['expected']}", S))
        story.append(Paragraph('<b>Result:</b> PASS ☐ &nbsp; FAIL ☐ &nbsp; BLOCKED ☐', S))
        story.append(Paragraph('<b>What actually happened:</b> ________________________________________', S))
        story.append(Paragraph('<b>Comments:</b> ____________________________________________________', S))
        story.append(Spacer(1, 10))

    story.append(Paragraph('Not in the initial launch — do not test these', H1))
    story.append(Paragraph(
        "The capabilities below are excluded from the initial launch or still under "
        "implementation — do not test them. Known defects in the Delivery Gaps "
        "register SHOULD be reported.", B))
    data = [['Feature', 'Where', 'Status', 'Notes']]
    for c in COMING_SOON:
        data.append([Paragraph(c['feature'], B), Paragraph(c['where'], B),
                     Paragraph(c['status'], B), Paragraph(c.get('note', ''), B)])
    tbl = Table(data, colWidths=[45*mm, 40*mm, 45*mm, 44*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#063f4f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#eef6f8')]),
    ]))
    story.append(tbl)

    story.append(Paragraph('Emails you should receive', H1))
    for line in [
        "Welcome email — after registering a company.",
        "Invitation email — 'You've been invited to join <company> on Afruheritage'.",
        "Password reset email — 'Afruheritage — Password Reset Request'.",
        "Support ticket confirmation — after submitting a ticket on a company portal.",
        "If an expected email does not arrive within 10 minutes, mark the test FAIL.",
    ]:
        story.append(Paragraph('• ' + line, S))
    story.append(Paragraph('If something goes wrong', H1))
    story.append(Paragraph(
        "Write down the test ID, what you clicked, what you expected, and what actually "
        "happened. Attach a screenshot to the checklist.", B))
    doc.build(story)
    print('PDF written')

# ============ XLSX ============
def build_xlsx():
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'UAT Checklist'
    header_fill = PatternFill('solid', fgColor='063F4F')
    hfont = Font(color='FFFFFF', bold=True)
    thin = Border(*[Side(style='thin', color='CCCCCC')]*4)

    headers = ['Test ID', 'Business Journey', 'User Type', 'Feature', 'Starting URL',
               'Steps', 'Expected Result', 'Status (PASS/FAIL/BLOCKED)', 'Tester',
               'Test Date', 'Actual Result', 'Comments', 'Evidence Reference', 'Defect Ref']
    ws.append(headers)
    for c in ws[1]:
        c.fill = header_fill; c.font = hfont
        c.alignment = Alignment(vertical='center', wrap_text=True); c.border = thin
    for t in TESTS:
        ws.append([t['id'], t['journey'], t['user'], t['title'], t['start'],
                   '\n'.join(f"{i}. {s}" for i, s in enumerate(t['steps'], 1)),
                   t['expected'], '', '', '', '', '', '', ''])
    widths = [10, 16, 22, 30, 26, 60, 45, 14, 12, 12, 30, 25, 25, 12]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(vertical='top', wrap_text=True)
            c.border = thin
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = f"A1:N{ws.max_row}"

    # summary sheet
    ws2 = wb.create_sheet('Summary')
    ws2.append(['Afruheritage UAT Progress Summary'])
    ws2['A1'].font = Font(bold=True, size=14)
    ws2.append([])
    ws2.append(['Metric', 'Value'])
    ws2.append(['Total tests', len(TESTS)])
    ws2.append(['Passed', f'=COUNTIF(\'UAT Checklist\'!H2:H{len(TESTS)+1},"PASS")'])
    ws2.append(['Failed', f'=COUNTIF(\'UAT Checklist\'!H2:H{len(TESTS)+1},"FAIL")'])
    ws2.append(['Blocked', f'=COUNTIF(\'UAT Checklist\'!H2:H{len(TESTS)+1},"BLOCKED")'])
    ws2.append(['Not yet run', f'=COUNTBLANK(\'UAT Checklist\'!H2:H{len(TESTS)+1})'])
    ws2.column_dimensions['A'].width = 20; ws2.column_dimensions['B'].width = 15
    ws2['A3'].font = ws2['B3'].font = Font(bold=True)

    # coming soon sheet
    ws3 = wb.create_sheet('Launch Exclusions')
    ws3.append(['Feature', 'Where it appears', 'Status', 'Notes'])
    for c in ws3[1]:
        c.fill = header_fill; c.font = hfont; c.border = thin
    for c in COMING_SOON:
        ws3.append([c['feature'], c['where'], c['status'], c.get('note', '')])
    for i, w in enumerate([45, 40, 45, 60], 1):
        ws3.column_dimensions[get_column_letter(i)].width = w
    for row in ws3.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(vertical='top', wrap_text=True); c.border = thin
    ws3.freeze_panes = 'A2'

    # user types sheet
    ws4 = wb.create_sheet('User Types')
    ws4.append(['User Type', 'Who', 'Can do', 'Cannot do'])
    for c in ws4[1]:
        c.fill = header_fill; c.font = hfont; c.border = thin
    for ut in USER_TYPES:
        ws4.append([ut['name'], ut['who'], ut['can_do'], ut['cannot_do']])
    for i, w in enumerate([30, 35, 60, 55], 1):
        ws4.column_dimensions[get_column_letter(i)].width = w
    for row in ws4.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(vertical='top', wrap_text=True); c.border = thin

    wb.save(os.path.join(OUT, 'AFRUHERITAGE_UAT_CHECKLIST.xlsx'))
    print('XLSX written')

# ============ HTML dashboard ============
def build_html():
    cards = []
    for t in TESTS:
        steps = ''.join(f'<li>{html.escape(s)}</li>' for s in t['steps'])
        cards.append(f'''
      <div class="card" id="{t['id']}">
        <div class="card-head">
          <span class="tid">{t['id']}</span>
          <span class="badge">{html.escape(t['journey'])}</span>
        </div>
        <h3>{html.escape(t['title'])}</h3>
        <p class="who"><b>Who:</b> {html.escape(t['user'])} &nbsp; <b>Start:</b> <code>{html.escape(t['start'])}</code></p>
        <details><summary>Steps &amp; expected result</summary>
          <ol>{steps}</ol>
          <p class="exp"><b>Expected:</b> {html.escape(t['expected'])}</p>
          <div class="result-row">
            <label><input type="radio" name="{t['id']}" value="PASS"> PASS</label>
            <label><input type="radio" name="{t['id']}" value="FAIL"> FAIL</label>
            <label><input type="radio" name="{t['id']}" value="BLOCKED"> BLOCKED</label>
          </div>
          <textarea placeholder="What actually happened / comments"></textarea>
        </details>
      </div>''')
    soon_rows = ''.join(
        f"<tr><td>{html.escape(c['feature'])}</td><td>{html.escape(c['where'])}</td>"
        f"<td><span class='soon'>{html.escape(c['status'])}</span></td><td>{html.escape(c.get('note',''))}</td></tr>"
        for c in COMING_SOON)
    toc = ''.join(f'<a href="#{t["id"]}" class="toc-link">{t["id"]}</a>' for t in TESTS)
    page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Afruheritage UAT Dashboard</title>
<style>
:root{{--teal:#063f4f;--teal2:#0a5568;--bg:#f6f9fa;--card:#ffffff;--line:#e2e8f0;--txt:#1e293b;--mut:#64748b}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--txt);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}}
header{{background:var(--teal);color:#fff;padding:28px 32px}}
header h1{{margin:0;font-size:24px}}header p{{margin:6px 0 0;opacity:.85;font-size:14px}}
.wrap{{max-width:1100px;margin:0 auto;padding:24px}}
.toc{{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 24px}}
.toc-link{{background:#fff;border:1px solid var(--line);border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--teal2);text-decoration:none}}
.toc-link:hover{{background:var(--teal2);color:#fff}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,.04)}}
.card-head{{display:flex;justify-content:space-between;align-items:center}}
.tid{{font-weight:700;color:var(--teal);font-size:14px}}
.badge{{background:#e8f4f7;color:var(--teal2);font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}}
.card h3{{margin:8px 0 4px;font-size:17px}}
.who{{font-size:12px;color:var(--mut)}}
.who code{{background:#eef2f5;padding:1px 6px;border-radius:4px}}
details{{margin-top:10px}}summary{{cursor:pointer;font-weight:600;color:var(--teal2);font-size:13px}}
ol{{font-size:13px;line-height:1.7;padding-left:22px}}
.exp{{font-size:13px;background:#f0f9f4;border-left:3px solid #2e9e63;padding:8px 12px;border-radius:0 6px 6px 0}}
.result-row{{display:flex;gap:18px;margin:10px 0;font-size:13px;font-weight:600}}
.result-row label{{display:flex;gap:6px;align-items:center;cursor:pointer}}
textarea{{width:100%;min-height:56px;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:13px;font-family:inherit}}
h2{{color:var(--teal);margin-top:36px}}
table{{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;font-size:13px}}
th{{background:var(--teal);color:#fff;text-align:left;padding:10px;font-size:12px}}
td{{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}}
.soon{{color:#b45309;font-weight:600}}
footer{{text-align:center;color:var(--mut);font-size:12px;padding:24px}}
</style></head><body>
<header><h1>Afruheritage — Customer UAT Dashboard</h1>
<p>Test site: {DOMAIN} · {len(TESTS)} tests · Use with the UAT Guide (Word/PDF) and Checklist (Excel)</p></header>
<div class="wrap">
<h2>Test index</h2><div class="toc">{toc}</div>
<h2>Tests</h2>{''.join(cards)}
<h2>Not in the initial launch — do not test these</h2>
<p style="font-size:13px;color:#666">Excluded from initial launch or under implementation per PO rulings D-01..D-12. Known defects you SHOULD report are in DELIVERY_GAPS_AND_DEFECTS.md.</p>
<table><tr><th>Feature</th><th>Where it appears</th><th>Status</th><th>Notes</th></tr>{soon_rows}</table>
</div>
<footer>Afruheritage UAT Dashboard · generated {TODAY} · statuses selected here are not saved — record them in the Excel checklist</footer>
</body></html>'''
    open(os.path.join(OUT, 'AFRUHERITAGE_UAT_DASHBOARD.html'), 'w').write(page)
    print('HTML dashboard written')

# ============ README ============
def build_readme():
    md = f"""# Afruheritage — Customer UAT Handover Package

Testing website: **{DOMAIN}** · Version 1.0 · {TODAY}

## Contents

| File | What it is |
|---|---|
| `AFRUHERITAGE_CUSTOMER_UAT_GUIDE.docx` | Plain-English step-by-step testing guide (Word) |
| `AFRUHERITAGE_CUSTOMER_UAT_GUIDE.pdf` | Same guide as a PDF |
| `AFRUHERITAGE_UAT_CHECKLIST.xlsx` | Excel checklist — record PASS / FAIL / BLOCKED, actual results, comments and evidence per test |
| `AFRUHERITAGE_UAT_DASHBOARD.html` | Clickable light-mode dashboard — same test IDs as the checklist |
| `AFRUHERITAGE_SMTP_UAT_REPORT.md` | Verified email delivery report (welcome, invitation, password reset, support ticket) |
| `LAUNCH_SCOPE_REGISTER.md` | Definitive launch scope per PO rulings D-01..D-12 |
| `COMING_SOON_REGISTER.md` | Launch exclusions + under-implementation (do not test) |
| `PO_DECISIONS_REQUIRED.md` | The 12 decisions the Product Owner must rule on |
| `DELIVERY_GAPS_AND_DEFECTS.md` | Known defects/gaps — these SHOULD be reported |
| `AVAILABLE_FEATURES_REGISTER.md` | 4-tier feature classification |
| `PRODUCT_CAPABILITY_MATRIX.md` / `.xlsx` | Full capability reconciliation (evidence + PO decisions) |
| `CUSTOMER_JOURNEY_VERIFICATION_REPORT.md` | Playwright verification record (14/14 PASS) |
| `SENTINEL_CUSTOMER_ADMIN_GAP_MATRIX.xlsx` | Admin console gap matrix (WORKING/PARTIAL/MISSING) |

## How the pieces fit together

Every test has an ID (for example `REG-01`, `SHIP-04`). The same IDs appear in the Word/PDF
guide, the Excel checklist and the HTML dashboard, so a tester can read the steps in the
guide, tick the result on the dashboard, and record the formal result in the checklist.

## What testers need

- A normal web browser and an email inbox they can check.
- Start every test at {DOMAIN} (or the company portal address shown in the welcome email).
- No technical tools are needed.

## Results the developer verified before handover

| Area | Result |
|---|---|
| Business registration + welcome email | Verified end-to-end |
| Sign-in + onboarding + trial activation | Verified |
| Team invitation email + acceptance + employee sign-in | Verified — correct invitation subject |
| Driver and vehicle creation | Verified |
| Shipment creation + full status lifecycle | Verified — all seven status steps |
| Public shipment tracking | Verified |
| Password reset email + new password sign-in | Verified |
| Support ticket on company portal + confirmation email | Verified |
| Support ticket tracking by reference | Verified |
| Two-company data isolation | Verified earlier — repeat during UAT |
| Coming Soon presentation for unfinished features | Verified — marketplace, routes, vendor signup show honest Coming Soon or Preview only states |

See `AFRUHERITAGE_SMTP_UAT_REPORT.md` for the email evidence summary.
"""
    open(os.path.join(OUT, 'README.md'), 'w').write(md)
    print('README written')

def build_coming_soon_md():
    lines = ["# Afruheritage — Launch Exclusions & Under Implementation\n",
             "**PO rulings D-01..D-12 applied.** The capabilities below are either excluded from the "
             "initial launch or approved for build but not yet deployed. Do not test them. Known "
             "defects you SHOULD report are in DELIVERY_GAPS_AND_DEFECTS.md. Full scope: "
             "LAUNCH_SCOPE_REGISTER.md.\n"]
    for c in COMING_SOON:
        lines.append(f"## {c['feature']}")
        lines.append(f"- **Where it appears:** {c['where']}")
        lines.append(f"- **Status:** {c['status']}")
        if c.get('note'):
            lines.append(f"- **Note:** {c['note']}")
        lines.append('')
    open(os.path.join(OUT, 'COMING_SOON_REGISTER.md'), 'w').write('\n'.join(lines))
    print('Pending-decision register written')

if __name__ == '__main__':
    build_docx()
    build_pdf()
    build_xlsx()
    build_html()
    build_readme()
    build_coming_soon_md()
