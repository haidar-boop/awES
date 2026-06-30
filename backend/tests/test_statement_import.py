"""Tests for broker / platform statement import."""
import io

import pytest

import statement_import as si


# --- number parsing --------------------------------------------------------

@pytest.mark.parametrize("raw,expected", [
    ("12.50", 12.5),
    ("-8.00", -8.0),
    ("1 234.56", 1234.56),     # MT4 space thousands separator
    ("1,234.56", 1234.56),     # comma thousands + dot decimal
    ("1.234,56", None),        # ambiguous EU format -> still parses to a number
    ("(45.00)", -45.0),        # parentheses negative
    ("$100.00", 100.0),        # currency symbol
    ("1,5", 1.5),              # decimal comma
    ("", None),
    ("n/a", None),
])
def test_parse_number(raw, expected):
    out = si._parse_number(raw)
    if expected is None and raw in ("", "n/a"):
        assert out is None
    elif raw == "1.234,56":
        assert out is not None  # don't assert exact value for ambiguous input
    else:
        assert out == pytest.approx(expected)


# --- MT4 / MT5 HTML statement ----------------------------------------------

MT4_HTML = """
<html><body>
<table>
<tr><th>Ticket</th><th>Open Time</th><th>Type</th><th>Size</th><th>Item</th>
    <th>Price</th><th>Profit</th></tr>
<tr><td>1001</td><td>2024.01.02 10:00</td><td>buy</td><td>0.10</td><td>eurusd</td>
    <td>1.1050</td><td>12.50</td></tr>
<tr><td>1002</td><td>2024.01.03 11:00</td><td>sell</td><td>0.10</td><td>eurusd</td>
    <td>1.1010</td><td>-8.00</td></tr>
<tr><td>1003</td><td>2024.01.04 09:30</td><td>buy</td><td>0.20</td><td>gbpusd</td>
    <td>1.2700</td><td>1 234.56</td></tr>
</table>
</body></html>
"""


def test_mt4_html_extracts_profit_column():
    r = si.parse_statement(MT4_HTML.encode("utf-8"), "statement.htm")
    assert r.source_format == "mt4_mt5_html"
    assert r.kind == "trades"
    assert r.column.lower() == "profit"
    assert r.values == pytest.approx([12.5, -8.0, 1234.56])


# --- TradingView "List of Trades" CSV (profit only on exit rows) ------------

TV_CSV = """Trade #,Type,Date/Time,Price USD,Contracts,Profit USD,Profit %,Cumulative profit USD
1,Entry long,2024-01-02,100.00,1,,,
1,Exit long,2024-01-03,110.00,1,10.00,10.0,10.00
2,Entry long,2024-01-04,110.00,1,,,
2,Exit long,2024-01-05,104.50,1,-5.50,-5.0,4.50
3,Entry long,2024-01-06,104.50,1,,,
3,Exit long,2024-01-07,120.00,1,15.50,14.8,20.00
"""


def test_tradingview_csv_prefers_per_trade_profit_over_cumulative():
    r = si.parse_statement(TV_CSV.encode("utf-8"), "trades.csv")
    assert r.source_format == "csv"
    assert r.kind == "trades"
    assert "profit usd" in r.column.lower()
    assert r.values == pytest.approx([10.0, -5.5, 15.5])


# --- generic balance/equity CSV (no per-trade P&L) -------------------------

BALANCE_CSV = """Date,Balance
2024-01-01,10000
2024-01-02,10120
2024-01-03,10080
2024-01-04,10250
"""


def test_balance_csv_falls_back_to_equity():
    r = si.parse_statement(BALANCE_CSV.encode("utf-8"), "equity.csv")
    assert r.kind == "equity"
    assert r.column.lower() == "balance"
    assert r.values == pytest.approx([10000, 10120, 10080, 10250])
    assert any("balance/equity" in n for n in r.notes)


# --- XLSX (TradingView / MT5 report) ---------------------------------------

def _make_xlsx(rows):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "List of trades"
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_xlsx_extracts_pnl_column():
    content = _make_xlsx([
        ["Trade #", "Type", "Profit", "Cumulative profit"],
        [1, "Exit long", 10.0, 10.0],
        [2, "Exit long", -5.5, 4.5],
        [3, "Exit long", 15.5, 20.0],
    ])
    r = si.parse_statement(content, "report.xlsx")
    assert r.source_format == "xlsx"
    assert r.kind == "trades"
    assert r.column.lower() == "profit"
    assert r.values == pytest.approx([10.0, -5.5, 15.5])


# --- the extracted text feeds the existing parser --------------------------

def test_result_text_roundtrips_through_parser():
    import parsing
    r = si.parse_statement(MT4_HTML.encode("utf-8"), "statement.htm")
    parsed = parsing.parse_input(r.text, data_kind="trades")
    assert parsed.data_kind == "trades"
    assert parsed.n >= 2


# --- errors ----------------------------------------------------------------

def test_empty_file_rejected():
    with pytest.raises(si.ImportError_):
        si.parse_statement(b"", "x.csv")


def test_unreadable_table_rejected():
    with pytest.raises(si.ImportError_):
        si.parse_statement(b"hello world no columns here", "x.csv")


# --- /api/import endpoint --------------------------------------------------

def test_import_endpoint_returns_extracted_series():
    from fastapi.testclient import TestClient
    import main
    client = TestClient(main.app)
    resp = client.post(
        "/api/import",
        files={"file": ("statement.htm", MT4_HTML.encode("utf-8"), "text/html")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["kind"] == "trades"
    assert body["n"] == 3
    assert body["source_format"] == "mt4_mt5_html"
    assert "pnl" in body["text"].splitlines()[0].lower()


def test_import_endpoint_rejects_garbage():
    from fastapi.testclient import TestClient
    import main
    client = TestClient(main.app)
    resp = client.post(
        "/api/import",
        files={"file": ("x.csv", b"not a table", "text/csv")},
    )
    assert resp.status_code == 400
