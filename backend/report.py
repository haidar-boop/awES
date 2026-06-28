"""PDF report generation -- the paid-audit deliverable.

Renders charts with matplotlib (headless) and lays out a clean, shareable
report with ReportLab. Takes the same analysis dict the API returns.
"""
from __future__ import annotations

import io

import matplotlib

matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # noqa: E402
from reportlab.lib.units import cm  # noqa: E402
from reportlab.platypus import (  # noqa: E402
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable,
)

VERDICT_COLORS = {
    "red": colors.HexColor("#dc2626"),
    "yellow": colors.HexColor("#d97706"),
    "green": colors.HexColor("#16a34a"),
}
STATUS_COLORS = {
    "pass": colors.HexColor("#16a34a"),
    "warn": colors.HexColor("#d97706"),
    "fail": colors.HexColor("#dc2626"),
    "info": colors.HexColor("#475569"),
}


def _fig_to_image(fig, width_cm=16) -> Image:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    w = width_cm * cm
    return Image(buf, width=w, height=w * 0.5)


def _equity_chart(analysis) -> Image:
    eq = analysis["charts"]["equity"]
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(eq["x"], eq["strategy"], label="Strategy", color="#2563eb", lw=1.6)
    if eq.get("benchmark"):
        ax.plot(eq["x"], eq["benchmark"], label="Buy & hold", color="#94a3b8",
                lw=1.2, ls="--")
    ax.set_title("Equity curve (growth of 1)")
    ax.set_xlabel("Period")
    ax.legend(loc="upper left", fontsize=8)
    ax.grid(alpha=0.2)
    return _fig_to_image(fig)


def _drawdown_chart(analysis) -> Image:
    dd = analysis["charts"]["drawdown"]
    fig, ax = plt.subplots(figsize=(8, 4))
    y = [v * 100 if v is not None else 0 for v in dd["drawdown"]]
    ax.fill_between(dd["x"], y, 0, color="#dc2626", alpha=0.4)
    ax.plot(dd["x"], y, color="#dc2626", lw=0.8)
    ax.set_title("Drawdown (underwater plot)")
    ax.set_xlabel("Period")
    ax.set_ylabel("Drawdown %")
    ax.grid(alpha=0.2)
    return _fig_to_image(fig)


def _mc_chart(analysis) -> Image | None:
    mc = analysis["charts"].get("monte_carlo")
    if not mc:
        return None
    fig, ax = plt.subplots(figsize=(8, 4))
    x = mc["x"]
    ax.fill_between(x, mc["p5"], mc["p95"], color="#3b82f6", alpha=0.15,
                    label="5-95 pct")
    ax.fill_between(x, mc["p25"], mc["p75"], color="#3b82f6", alpha=0.25,
                    label="25-75 pct")
    ax.plot(x, mc["p50"], color="#3b82f6", lw=1.0, ls=":", label="Median")
    ax.plot(x, mc["actual"], color="#dc2626", lw=1.8, label="Actual")
    ax.set_title("Monte Carlo cone (resampled paths)")
    ax.set_xlabel("Period")
    ax.legend(loc="upper left", fontsize=8)
    ax.grid(alpha=0.2)
    return _fig_to_image(fig)


def build_pdf(analysis: dict) -> bytes:
    """Return PDF bytes for a given analysis dict."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=1.6 * cm, bottomMargin=1.6 * cm,
        title="Backtest Reality Check Report",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("Small", parent=styles["Normal"], fontSize=8,
                              textColor=colors.HexColor("#64748b")))
    styles.add(ParagraphStyle("H1b", parent=styles["Heading1"], fontSize=18))
    styles.add(ParagraphStyle("VerdictTitle", parent=styles["Heading1"],
                              fontSize=20, textColor=colors.white))
    styles.add(ParagraphStyle("VerdictSub", parent=styles["Normal"],
                              fontSize=11, textColor=colors.white))
    story = []

    v = analysis["verdict"]
    color = VERDICT_COLORS.get(v["level"], colors.grey)

    story.append(Paragraph("Backtest Reality Check", styles["H1b"]))
    story.append(Paragraph(
        "Statistical robustness audit of a trading strategy backtest.",
        styles["Small"]))
    story.append(Spacer(1, 0.3 * cm))

    # Verdict banner
    banner = Table(
        [[Paragraph(v["headline"], styles["VerdictTitle"])],
         [Paragraph(v["summary"], styles["VerdictSub"])]],
        colWidths=[doc.width],
    )
    banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(banner)
    story.append(Spacer(1, 0.3 * cm))

    if v["top_reasons"]:
        story.append(Paragraph("<b>Why this verdict</b>", styles["Normal"]))
        for r in v["top_reasons"]:
            story.append(Paragraph(f"• {r}", styles["Normal"]))
        story.append(Spacer(1, 0.2 * cm))

    if v["warnings"]:
        story.append(Paragraph("<b>Warnings</b>", styles["Normal"]))
        for w in v["warnings"]:
            story.append(Paragraph(f"⚠ {w}", styles["Normal"]))
        story.append(Spacer(1, 0.2 * cm))

    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.2 * cm))

    # Key metrics table from explanations
    story.append(Paragraph("<b>Key metrics</b>", styles["Heading2"]))
    rows = [["Metric", "Value", "Read"]]
    cell_style = ParagraphStyle("cell", parent=styles["Normal"], fontSize=8)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.HexColor("#f8fafc")]),
    ]
    for i, e in enumerate(analysis["explanations"], start=1):
        rows.append([
            Paragraph(e["label"], cell_style),
            Paragraph(str(e["value"]), cell_style),
            Paragraph(e["plain"], cell_style),
        ])
        sc = STATUS_COLORS.get(e["status"])
        if sc:
            style_cmds.append(("TEXTCOLOR", (1, i), (1, i), sc))
    tbl = Table(rows, colWidths=[4.2 * cm, 2.6 * cm, doc.width - 6.8 * cm])
    tbl.setStyle(TableStyle(style_cmds))
    story.append(tbl)
    story.append(Spacer(1, 0.4 * cm))

    # Charts
    story.append(Paragraph("<b>Charts</b>", styles["Heading2"]))
    story.append(_equity_chart(analysis))
    story.append(Spacer(1, 0.2 * cm))
    story.append(_drawdown_chart(analysis))
    mc_img = _mc_chart(analysis)
    if mc_img is not None:
        story.append(Spacer(1, 0.2 * cm))
        story.append(mc_img)

    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    story.append(Paragraph(v["disclaimer"], styles["Small"]))
    story.append(Paragraph(
        "Backtest Reality Check runs established statistical robustness tests "
        "(PSR, Deflated Sharpe, out-of-sample degradation, Monte Carlo). It "
        "never predicts profit -- only whether a backtest survives scrutiny.",
        styles["Small"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()
