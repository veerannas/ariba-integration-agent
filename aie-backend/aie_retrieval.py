"""AIE Retrieval Module — scrapes PO data from SAP Business Network supplier portal via CDP."""
import asyncio
import json
import re
from typing import List, Dict, Optional

try:
    import websockets
except ImportError:
    websockets = None


CDP_URL = "http://127.0.0.1:9222"
SUPPLIER_PORTAL_PATTERN = "portal.us.bn.cloud.ariba.com"
ADMIN_PORTAL_PATTERN = "admin.us2.gcpint.ariba.com"


async def find_page_ws(url_pattern: str) -> Optional[str]:
    """Find a Chrome page matching the URL pattern and return its WebSocket URL."""
    import urllib.request
    resp = urllib.request.urlopen(f"{CDP_URL}/json/list")
    pages = json.loads(resp.read())
    for page in pages:
        if url_pattern in page.get("url", ""):
            return page["webSocketDebuggerUrl"]
    return None


async def evaluate_js(ws_url: str, expression: str) -> str:
    """Evaluate JavaScript in a Chrome page via CDP."""
    async with websockets.connect(ws_url) as ws:
        cmd = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": expression}}
        await ws.send(json.dumps(cmd))
        resp = json.loads(await ws.recv())
        result = resp.get("result", {}).get("result", {})
        return result.get("value", "")


async def retrieve_pos_from_portal() -> List[Dict]:
    """Scrape Purchase Order list from the supplier portal tab in Chrome."""
    ws_url = await find_page_ws(SUPPLIER_PORTAL_PATTERN)
    if not ws_url:
        return []

    js_scrape = """
    (function() {
        var rows = document.querySelectorAll('[class*="row"], tr');
        var poData = [];
        rows.forEach(function(row) {
            var text = row.textContent;
            if (text.match(/[0-9]{10}/) && text.match(/USD|EUR|BRL/)) {
                var cells = row.querySelectorAll('td, [class*="cell"], span, div');
                var data = [];
                cells.forEach(function(c) {
                    var t = c.textContent.trim();
                    if (t && t.length < 80 && !data.includes(t)) data.push(t);
                });
                if (data.length > 0) poData.push(data);
            }
        });
        var seen = {};
        var unique = [];
        poData.forEach(function(row) {
            var key = row.find(function(c) { return c.match(/^[0-9]{10}$/); });
            if (key && !seen[key]) { seen[key] = true; unique.push(row); }
        });
        return JSON.stringify(unique);
    })()
    """
    raw = await evaluate_js(ws_url, js_scrape)
    if not raw:
        return []

    rows = json.loads(raw)
    results = []
    for row in rows:
        po_number = next((c for c in row if re.match(r"^\d{10}$", c)), None)
        amount = next((c for c in row if "$" in c or "USD" in c or "EUR" in c), "")
        date = next((c for c in row if re.match(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", c)), "")
        status = next((c for c in row if c in ("New", "Failed", "Confirmed", "Shipped", "Acknowledged")), "Unknown")
        customer = next((c for c in row if "Account" in c or "Test" in c), "")

        if po_number:
            results.append({
                "poNumber": po_number,
                "amount": amount,
                "date": date,
                "status": status,
                "customer": customer,
                "format": "cXML",
                "source": "portal-scrape",
            })
    return results


async def export_cxml_from_admin(po_number: str, payload_id: str = "") -> Optional[str]:
    """Export cXML for a PO via the admin portal's Search Document tool."""
    ws_url = await find_page_ws(ADMIN_PORTAL_PATTERN)
    if not ws_url:
        return None

    # Navigate to Supply Chain > Toolbox > Search Document and search by document number
    search_js = f"""
    (function() {{
        // Find Search Document link and click
        var links = document.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {{
            if (links[i].textContent.trim() === 'Search Document') {{
                links[i].click();
                return 'navigating';
            }}
        }}
        return 'search-doc-not-found';
    }})()
    """
    result = await evaluate_js(ws_url, search_js)
    if result == "search-doc-not-found":
        return None

    # Wait for page, then fill in document number and search
    await asyncio.sleep(3)

    fill_and_search_js = f"""
    (function() {{
        var inputs = document.querySelectorAll('input[type="text"]');
        // Find the Document Number field (3rd input typically)
        for (var i = 0; i < inputs.length; i++) {{
            var label = inputs[i].previousElementSibling || inputs[i].parentElement;
            if (label && label.textContent.includes('Document Number')) {{
                inputs[i].value = '{po_number}';
                inputs[i].dispatchEvent(new Event('input'));
                break;
            }}
        }}
        // Click Search button
        var btns = document.querySelectorAll('td, button');
        for (var i = 0; i < btns.length; i++) {{
            if (btns[i].textContent.trim() === 'Search') {{
                btns[i].click();
                return 'searching';
            }}
        }}
        return 'search-btn-not-found';
    }})()
    """
    await evaluate_js(ws_url, fill_and_search_js)
    await asyncio.sleep(5)

    # Click the document ID link, then Export cXML
    # This is a simplified version — full implementation would handle the multi-step flow
    return None  # For now, return None — cXML export requires file download handling


def retrieve_pos_sync() -> List[Dict]:
    """Synchronous wrapper for PO retrieval."""
    if not websockets:
        return []
    try:
        return asyncio.run(retrieve_pos_from_portal())
    except Exception as e:
        print(f"Retrieval error: {e}")
        return []


if __name__ == "__main__":
    pos = retrieve_pos_sync()
    print(json.dumps(pos, indent=2))
