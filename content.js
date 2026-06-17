/**
 * Ariba Integration Agent — Content Script
 * FAB overlay on Ariba pages + context detection + error scanning
 */
(() => {
  'use strict';
  if (document.getElementById('ariba-agent-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'ariba-agent-overlay';
  overlay.innerHTML = '<button id="ariba-agent-fab" title="Ariba Integration Agent">🤖</button>';
  document.body.appendChild(overlay);

  document.getElementById('ariba-agent-fab').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    showContextTooltip();
  });

  let tooltipVisible = false;
  function showContextTooltip() {
    const existing = document.querySelector('.ariba-agent-tooltip');
    if (existing) { existing.remove(); tooltipVisible = false; return; }

    const url = window.location.href;
    let page = 'SAP Ariba', hints = [];
    if (url.includes('integration.ariba.com')) { page = 'CIG Portal'; hints = ['CIG project/adapter area detected', 'Use the Mapping tab for EDI↔cXML reference']; }
    else if (url.includes('admin') && url.includes('ariba.com')) {
      page = 'Ariba Network Admin';
      const body = getFullPageText(3000);
      if (/invoice/i.test(body)) hints.push('Invoice area — check for 3-way match errors, price/qty mismatches');
      if (/rejected|failed|error/i.test(body)) hints.push('⚠️ Errors detected — use Troubleshoot tab for AI-assisted diagnosis');
      if (/order|purchase/i.test(body)) hints.push('PO management area — check PO→POC→ASN→Invoice flow');
      if (/ship|asn/i.test(body)) hints.push('Shipping/ASN section — verify ASN HL hierarchy');
    }
    else if (url.includes('service.ariba.com')) {
      page = url.includes('Supplier') ? 'AN — Supplier Portal' : 'Ariba Network';
      const body = getFullPageText(2000);
      if (/order|purchase/i.test(body)) hints.push('PO management area — check PO→POC→ASN→Invoice flow');
      if (/ship|asn/i.test(body)) hints.push('Shipping/ASN section — verify ASN HL hierarchy');
      if (/invoice/i.test(body)) hints.push('Invoice area — ensure 3-way match alignment');
      if (/test/i.test(body)) hints.push('Testing area — use Checklist tab for tracking');
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'ariba-agent-tooltip';
    tooltip.innerHTML = `<strong>📍 ${page}</strong><br><br>${hints.length ? hints.map(h => `💡 ${h}`).join('<br><br>') : '💡 Click the extension icon for full features: onboarding, mapping, checklists, AI chat.'}`;
    document.body.appendChild(tooltip);
    tooltipVisible = true;
    setTimeout(() => { if (tooltipVisible) { tooltip.remove(); tooltipVisible = false; } }, 8000);
    document.addEventListener('click', function dismiss(e) {
      if (!tooltip.contains(e.target) && e.target.id !== 'ariba-agent-fab') { tooltip.remove(); tooltipVisible = false; document.removeEventListener('click', dismiss); }
    });
  }

  // Helper: get ALL visible text including dialogs, popovers, overlays (SAP UI5 renders these outside normal body flow)
  function getFullPageText(limit) {
    const sources = [
      document.body?.innerText || '',
      // SAP UI5 static area (dialogs, popovers, message boxes)
      ...Array.from(document.querySelectorAll('#sap-ui-static, [role="dialog"], [role="alertdialog"], .sapMDialog, .sapMPopover, .sapMMessageBox, .sapMMessageToast')).map(el => el.innerText || ''),
      // Generic overlays & modals
      ...Array.from(document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"], [class*="error-message"], [class*="ErrorMessage"]')).map(el => el.innerText || '')
    ];
    const combined = [...new Set(sources)].join('\n');
    return limit ? combined.substring(0, limit) : combined;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SHOW_TOOLTIP') {
      document.querySelector('.ariba-agent-tooltip')?.remove();
      const t = document.createElement('div'); t.className = 'ariba-agent-tooltip';
      t.innerHTML = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      document.body.appendChild(t); setTimeout(() => t.remove(), 15000);
    }
    if (msg.type === 'GET_PAGE_CONTENT') { sendResponse({ url: window.location.href, title: document.title, text: getFullPageText(8000) }); return true; }
  });

  // Auto-scan for errors
  // Strategy: First check if the page actually contains error indicators in the
  // transaction data (e.g., FAILED status in table rows, error message popovers).
  // Only then scan for specific error codes. This prevents false positives from
  // matching column headers, form labels, or stale popover text.
  function scanErrors() {
    // Phase 1: Check for genuine error context on the page
    // Look for actual FAILED/error transactions in table data rows (not headers/labels)
    if (!hasErrorContext()) return;

    // Phase 2: Only scan error content sources — dialog/popover text and
    // actual error-containing table cells, NOT generic page text (which
    // includes column headers like "Document Status", "Document Type", etc.)
    const text = getErrorContentText();
    if (!text.trim()) return;

    const patterns = [
      { p: /ANID.*mismatch/i, c: 'ANID_MISMATCH' },
      { p: /field.*missing|required.*field/i, c: 'MAP_FIELD_MISSING' },
      { p: /connection.*fail|connectivity.*error/i, c: 'CONNECTIVITY_FAIL' },
      { p: /duplicate.*document/i, c: 'DUPLICATE_DOC' },
      { p: /schema.*valid|validation.*error/i, c: 'SCHEMA_VALIDATION' },
      { p: /certificate.*expir/i, c: 'CERT_EXPIRED' },
      // CIG-specific error codes
      { p: /DOC-\d+.*error|DOC-\d+.*fail|document.*preprocessing.*error/i, c: 'CIG_DOC_PROCESSING' },
      { p: /INV-\d+|invoice.*validation.*fail|invoice.*reject/i, c: 'INVOICE_VALIDATION' },
      { p: /Rejected\s+Invoice|Status:?\s*Rejected|Routing:?\s*Failed/i, c: 'INVOICE_3WAY_MATCH' },
      { p: /unit\s+price.*not\s+match|price.*tolerance|price.*variance|price.*mismatch/i, c: 'INVOICE_PRICE_MISMATCH' },
      { p: /quantity.*exceeds|qty.*exceeds|quantity.*mismatch|quantity.*limit/i, c: 'INVOICE_QTY_MISMATCH' },
      { p: /subtotal.*exceeds|total.*mismatch|amount.*mismatch/i, c: 'INVOICE_AMOUNT_MISMATCH' },
      { p: /3.?way.*match|match.*fail/i, c: 'INVOICE_3WAY_MATCH' },
      { p: /adapter.*fail|adapter.*error|translation.*fail/i, c: 'CIG_ADAPTER_FAIL' },
      { p: /HL.*hierarchy|HL.*level|BSN.*error|856.*error|ASN.*reject/i, c: 'ASN_HL_HIERARCHY' },
      { p: /vendor.*ID.*mismatch|vendor.*not.*found|vendor.*inactive/i, c: 'VENDOR_ID_MAP' },
      { p: /Edit\s*&\s*Resubmit/i, c: 'DOC_REJECTED_RESUBMIT' },
      // CIG Platform & AN errors — tightened to require full error message context
      { p: /Error:OC-\d+|Cannot\s+find.*referenced\s+PO|PO.*not\s+found/i, c: 'PO_REFERENCE_NOT_FOUND' },
      { p: /CIG-PLT-\d+/i, c: 'CIG_PLATFORM_ERROR' },
      { p: /ANERR-\d+/i, c: 'AN_ERROR_REFERENCE' },
      { p: /ErrorCode[:\s]*["']?400["']?|HTTP[\/\s]*400/i, c: 'BAD_REQUEST_400' },
      { p: /Document\s+failed\s+in\s+Business\s+Network/i, c: 'DOC_FAILED_BN' },
      { p: /CIG-PLT-00644/i, c: 'CIG_PLT_00644' },
      // Removed: /ErrorCode|ErrorResponse/i — too broad, matches form labels & column headers
      // Replaced with a tighter pattern requiring a quoted/numeric error code value
      { p: /ErrorCode[:\s]*["'][^"']+["']|ErrorResponse[:\s]*["'][^"']+["']/i, c: 'CIG_ERROR_RESPONSE' }
    ];
    const detected = patterns.filter(p => p.p.test(text));
    if (detected.length) {
      chrome.runtime.sendMessage({
        type: 'DETECT_ERRORS',
        pageContent: text.substring(0, 5000),
        detectedCodes: detected.map(d => d.c),
        url: window.location.href
      });
    }
  }

  // Check whether the page actually contains error indicators in the transaction data.
  // This gates the more expensive pattern scan to avoid false positives from
  // normal page elements (column headers, filter labels, etc.)
  function hasErrorContext() {
    // 1. Check for active error dialogs/popovers (highest priority)
    const errorDialogs = document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], .sapMDialog, .sapMPopover, .sapMMessageBox'
    );
    for (const dlg of errorDialogs) {
      const dlgText = dlg.innerText || '';
      if (/error\s+message|Error:|FAILED|ErrorCode|ANERR-|CIG-PLT-/i.test(dlgText)) {
        return true;
      }
    }

    // 2. Check for FAILED status in actual table data rows (not headers)
    // Look specifically for table cells or row content containing "FAILED"
    const rows = document.querySelectorAll('tr, [role="row"]');
    for (const row of rows) {
      // Skip header rows
      if (row.querySelector('th, [role="columnheader"]')) continue;
      const rowText = row.innerText || '';
      if (/\bFAILED\b/i.test(rowText)) return true;
    }

    // 3. Check for "Document Status: FAILED" in detail pages
    const detailPage = getFullPageText(5000);
    if (/Document\s+Status:?\s*FAILED/i.test(detailPage)) return true;

    // 4. Check for explicit error indicator elements
    const errorIndicators = document.querySelectorAll(
      '.sapMMessageBox, [class*="error-message"], [class*="ErrorMessage"], .sapMMessageStrip'
    );
    if (errorIndicators.length > 0) {
      for (const el of errorIndicators) {
        if ((el.innerText || '').trim().length > 0) return true;
      }
    }

    return false;
  }

  // Get text specifically from error content sources — NOT the full page text.
  // This avoids matching column headers like "Document Status", "Document Type", etc.
  function getErrorContentText() {
    const sources = [];

    // Dialog/popover content (SAP UI5 renders these in #sap-ui-static)
    const overlaySelectors = [
      '#sap-ui-static [role="dialog"]',
      '#sap-ui-static [role="alertdialog"]',
      '.sapMDialog', '.sapMPopover', '.sapMMessageBox', '.sapMMessageToast',
      '[class*="error-message"]', '[class*="ErrorMessage"]'
    ];
    for (const sel of overlaySelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const t = el.innerText || '';
        if (t.trim()) sources.push(t);
      });
    }

    // Text from table rows that contain FAILED status
    const rows = document.querySelectorAll('tr, [role="row"]');
    for (const row of rows) {
      if (row.querySelector('th, [role="columnheader"]')) continue;
      const rowText = row.innerText || '';
      if (/\bFAILED\b/i.test(rowText)) sources.push(rowText);
    }

    // Detail page header area (for transaction detail pages)
    const detailHeaders = document.querySelectorAll('.sapMPageHeader, .sapMTitle, [class*="DetailHeader"]');
    for (const hdr of detailHeaders) {
      const t = hdr.innerText || '';
      if (/FAILED|Error/i.test(t)) sources.push(t);
    }

    return [...new Set(sources)].join('\n');
  }

  // ===== ANID & SUPPLIER/BUYER CONTEXT DETECTION =====
  function detectContext() {
    var ctx = { anid: '', name: '', orgType: '', portal: '', url: window.location.href };

    // Strategy 1: localStorage (SAP Business Network stores sa.* keys)
    try {
      ctx.name = localStorage.getItem('sa.orgName') || localStorage.getItem('sa.supplierName') || '';
      ctx.anid = localStorage.getItem('sa.orgAnid') || '';
      ctx.orgType = (localStorage.getItem('sa.orgType') || '').toLowerCase(); // 'supplier' or 'buyer'
      if (!ctx.orgType && localStorage.getItem('sa.isSCMSupplier') === 'true') ctx.orgType = 'supplier';
    } catch(e) {}

    // Strategy 2: URL parameters
    if (!ctx.anid) {
      try {
        var params = new URLSearchParams(window.location.search);
        ctx.anid = params.get('anid') || params.get('ANID') || params.get('supplierId') || '';
      } catch(e) {}
    }

    // Strategy 3: URL path pattern (AN followed by digits)
    if (!ctx.anid) {
      var pathMatch = window.location.href.match(/AN\d{8,14}/);
      if (pathMatch) ctx.anid = pathMatch[0];
    }

    // Strategy 4: Page body text scan
    if (!ctx.anid) {
      var bodySnippet = (document.body?.innerText || '').substring(0, 5000);
      var bodyMatch = bodySnippet.match(/AN\d{8,14}/);
      if (bodyMatch) ctx.anid = bodyMatch[0];
    }

    // Strategy 5: DOM data attributes
    if (!ctx.anid) {
      var el = document.querySelector('[data-anid]');
      if (el) ctx.anid = el.getAttribute('data-anid');
    }

    // Strategy 6: Name from page elements if not found in localStorage
    if (!ctx.name) {
      var nameSelectors = [
        '.account-type', '[class*="orgName"]', '[class*="OrgName"]',
        '[class*="companyName"]', '[class*="CompanyName"]',
        'h1', '.sapMTitle'
      ];
      for (var i = 0; i < nameSelectors.length; i++) {
        var nameEl = document.querySelector(nameSelectors[i]);
        if (nameEl) {
          var t = (nameEl.innerText || '').trim();
          if (t && t.length > 2 && t.length < 80) { ctx.name = t; break; }
        }
      }
    }

    // Detect portal type from URL
    var url = window.location.href;
    if (url.includes('integration.ariba.com')) ctx.portal = 'cig';
    else if (url.includes('ariba.com')) ctx.portal = 'ariba';

    return ctx;
  }

  function sendContext() {
    var ctx = detectContext();
    if (ctx.anid || ctx.name) {
      chrome.runtime.sendMessage({ type: 'CONTEXT_DETECTED', context: ctx }).catch(function(){});
      console.log('[AIA] Context detected:', ctx.name, ctx.anid, ctx.orgType);
    }
  }

  // Send context on load and on SPA navigation
  if (document.readyState === 'complete') { setTimeout(scanErrors, 2000); setTimeout(sendContext, 1500); }
  else window.addEventListener('load', () => { setTimeout(scanErrors, 2000); setTimeout(sendContext, 1500); });

  // Re-scan on dynamic content changes (SPA navigation in Ariba)
  var lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    clearTimeout(window._aiaRescanTimer);
    window._aiaRescanTimer = setTimeout(scanErrors, 3000);
    // Re-detect context on URL change (SPA navigation)
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(sendContext, 1500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also listen for requests from the sidepanel
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_CONTEXT') {
      sendResponse(detectContext());
      return true;
    }
    if (msg.type === 'SCRAPE_PORTAL') {
      scrapePortalTransactions().then(sendResponse).catch(e => sendResponse({ error: e.message }));
      return true;
    }
    if (msg.type === 'GET_CAPTURED_CXML') {
      sendResponse({ captured: window._aiaCapturedCxml || [] });
      window._aiaCapturedCxml = [];
      return true;
    }
  });

  // ===== PORTAL DOM SCRAPER =====
  // Scrapes transaction list from Ariba Business Network supplier portal
  // Supports: portal.us.bn.cloud.ariba.com (new BN portal) + service.ariba.com (legacy)
  function scrapePortalTransactions() {
    return new Promise((resolve) => {
      var url = window.location.href;
      var transactions = [];

      // Strategy 1: New BN Cloud portal (portal.*.bn.cloud.ariba.com)
      if (url.includes('bn.cloud.ariba.com') || url.includes('portal.')) {
        transactions = scrapeNewPortal();
      }
      // Strategy 2: Legacy service.ariba.com portal
      else if (url.includes('service.ariba.com')) {
        transactions = scrapeLegacyPortal();
      }
      // Strategy 3: Generic table scan (fallback)
      else {
        transactions = scrapeGenericTables();
      }

      resolve({ success: true, transactions: transactions, url: url, scrapedAt: new Date().toISOString() });
    });
  }

  // Scrape from new BN Cloud portal (Angular/React SPA with data tables)
  function scrapeNewPortal() {
    var txns = [];

    // Look for order/invoice tables — BN portal uses data grids
    var tableSelectors = [
      'table', '[role="grid"]', '[class*="datatable"]', '[class*="DataTable"]',
      '[class*="order-list"]', '[class*="OrderList"]', '[class*="transaction"]',
      '[class*="document-list"]', 'cdk-table', 'mat-table'
    ];

    var tables = [];
    tableSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(t => {
        if (!tables.includes(t) && t.querySelectorAll('tr, [role="row"]').length > 1) tables.push(t);
      });
    });

    tables.forEach(table => {
      var rows = table.querySelectorAll('tr:not(:first-child), [role="row"]:not([role="columnheader"])');
      var headerRow = table.querySelector('tr:first-child, [role="columnheader"], thead tr');
      var headers = [];
      if (headerRow) {
        headerRow.querySelectorAll('th, td, [role="columnheader"]').forEach(h => {
          headers.push((h.innerText || '').trim().toLowerCase());
        });
      }

      rows.forEach(row => {
        // Skip header rows
        if (row.querySelector('th, [role="columnheader"]')) return;
        var cells = row.querySelectorAll('td, [role="gridcell"]');
        if (cells.length < 3) return;

        var cellTexts = Array.from(cells).map(c => (c.innerText || '').trim());
        var txn = parseRowToTransaction(cellTexts, headers, row);
        if (txn) txns.push(txn);
      });
    });

    // Also scrape card-based layouts (some BN portals use cards instead of tables)
    var cardSelectors = [
      '[class*="order-card"]', '[class*="OrderCard"]', '[class*="transaction-card"]',
      '[class*="document-card"]', '[class*="po-card"]', '[class*="invoice-card"]'
    ];
    cardSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(card => {
        var txn = parseCardToTransaction(card);
        if (txn) txns.push(txn);
      });
    });

    return txns;
  }

  // Scrape from legacy service.ariba.com (SAP UI5 based)
  function scrapeLegacyPortal() {
    var txns = [];
    // SAP UI5 tables use specific classes
    var ui5Tables = document.querySelectorAll('.sapMList, .sapMTable, .sapUiTable, [class*="sapMListItem"]');

    if (ui5Tables.length === 0) {
      // Fallback to standard tables
      return scrapeGenericTables();
    }

    // Scan list items (SAP UI5 renders as li elements with data)
    document.querySelectorAll('.sapMListItem, .sapMLIB, [role="listitem"]').forEach(item => {
      var text = (item.innerText || '').trim();
      if (!text) return;

      var txn = {
        docNumber: extractNumberFromText(text),
        type: detectTypeFromText(text),
        date: extractDateFromText(text),
        status: extractStatusFromText(text),
        amount: extractAmountFromText(text),
        format: 'cXML',
        source: 'portal_scrape',
        rawText: text.substring(0, 200)
      };
      if (txn.docNumber && txn.docNumber !== 'N/A') txns.push(txn);
    });

    return txns;
  }

  // Generic table scraper (works on any page with tables containing transaction data)
  function scrapeGenericTables() {
    var txns = [];
    document.querySelectorAll('table').forEach(table => {
      var rows = table.querySelectorAll('tbody tr, tr');
      var headerRow = table.querySelector('thead tr, tr:first-child');
      var headers = [];
      if (headerRow) {
        headerRow.querySelectorAll('th, td').forEach(h => headers.push((h.innerText || '').trim().toLowerCase()));
      }

      rows.forEach((row, idx) => {
        if (idx === 0 && row.querySelector('th')) return; // skip header
        var cells = row.querySelectorAll('td');
        if (cells.length < 2) return;
        var cellTexts = Array.from(cells).map(c => (c.innerText || '').trim());
        var txn = parseRowToTransaction(cellTexts, headers, row);
        if (txn) txns.push(txn);
      });
    });
    return txns;
  }

  // Parse a table row into a transaction object
  function parseRowToTransaction(cellTexts, headers, row) {
    var txn = { format: 'cXML', source: 'portal_scrape' };
    var fullText = cellTexts.join(' ');

    // Try header-based matching first
    for (var i = 0; i < headers.length && i < cellTexts.length; i++) {
      var h = headers[i];
      var v = cellTexts[i];
      if (!v) continue;

      if (/order.*num|po.*num|document.*num|order.*id|doc.*id|number/i.test(h)) txn.docNumber = v;
      else if (/type|doc.*type|document.*type|category/i.test(h)) txn.type = detectTypeFromText(v);
      else if (/date|created|timestamp|time/i.test(h)) txn.date = v;
      else if (/status|state/i.test(h)) txn.status = v;
      else if (/amount|total|value|price/i.test(h)) txn.amount = v;
      else if (/supplier|vendor/i.test(h)) txn.supplier = v;
    }

    // Fallback: pattern-based extraction from cell text
    if (!txn.docNumber) txn.docNumber = extractNumberFromText(fullText);
    if (!txn.type) txn.type = detectTypeFromText(fullText);
    if (!txn.date) txn.date = extractDateFromText(fullText);
    if (!txn.status) txn.status = extractStatusFromText(fullText);

    // Only return if we found a valid doc number
    if (!txn.docNumber || txn.docNumber === 'N/A') return null;

    // Try to get link to transaction detail (for later cXML extraction)
    var link = row.querySelector('a[href]');
    if (link) txn.detailUrl = link.href;

    return txn;
  }

  // Parse a card element into a transaction
  function parseCardToTransaction(card) {
    var text = (card.innerText || '').trim();
    if (!text) return null;
    var txn = {
      docNumber: extractNumberFromText(text),
      type: detectTypeFromText(text),
      date: extractDateFromText(text),
      status: extractStatusFromText(text),
      amount: extractAmountFromText(text),
      format: 'cXML',
      source: 'portal_scrape',
      rawText: text.substring(0, 200)
    };
    var link = card.querySelector('a[href]');
    if (link) txn.detailUrl = link.href;
    return (txn.docNumber && txn.docNumber !== 'N/A') ? txn : null;
  }

  // Helper: extract document number from text
  function extractNumberFromText(text) {
    // PO numbers: typically 10 digits, or prefixed with PO/DO/INV
    var patterns = [
      /(?:PO|Order|Document)\s*#?\s*:?\s*(\d{6,12})/i,
      /(?:Invoice)\s*#?\s*:?\s*(\w{4,20})/i,
      /(?:ASN|Shipment)\s*#?\s*:?\s*(\w{4,20})/i,
      /\b(\d{10})\b/, // 10-digit number (common for SAP PO numbers)
      /\b(\d{7,12})\b/ // 7-12 digit number
    ];
    for (var p of patterns) {
      var m = text.match(p);
      if (m && m[1]) return m[1];
    }
    return 'N/A';
  }

  // Helper: detect transaction type from text
  function detectTypeFromText(text) {
    if (/purchase\s*order|PO\b|order\s*request/i.test(text)) return 'PurchaseOrder';
    if (/invoice|INV\b/i.test(text)) return 'Invoice';
    if (/ship\s*notice|ASN\b|advance\s*ship/i.test(text)) return 'ShipNotice';
    if (/confirm|POC\b|order\s*confirm/i.test(text)) return 'OrderConfirmation';
    return 'PurchaseOrder'; // default for supplier portal
  }

  // Helper: extract date from text
  function extractDateFromText(text) {
    var m = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/) || text.match(/(\d{2}[-/]\d{2}[-/]\d{4})/) || text.match(/(\w{3}\s+\d{1,2},?\s+\d{4})/);
    return m ? m[1] : '';
  }

  // Helper: extract status from text
  function extractStatusFromText(text) {
    if (/\bfailed\b|\berror\b|\brejected\b/i.test(text)) return 'Failed';
    if (/\bnew\b|\bpending\b|\bopen\b/i.test(text)) return 'New';
    if (/\bprocessed\b|\bsent\b|\baccepted\b|\bconfirmed\b/i.test(text)) return 'Processed';
    if (/\bpartial/i.test(text)) return 'Partial';
    return 'New';
  }

  // Helper: extract amount from text
  function extractAmountFromText(text) {
    var m = text.match(/[\$€£]\s*([\d,]+\.?\d*)/);
    if (m) return m[0];
    m = text.match(/([\d,]+\.\d{2})\s*(?:USD|EUR|GBP)/);
    return m ? m[0] : '';
  }

  // ===== NETWORK INTERCEPTION (XHR/Fetch monkey-patch) =====
  // Captures cXML content from network responses passing through the browser
  window._aiaCapturedCxml = [];

  function injectNetworkInterceptor() {
    // Inject into page context to intercept all XHR/fetch calls
    var script = document.createElement('script');
    script.textContent = `
      (function() {
        var captured = [];
        var MAX_CAPTURED = 50;

        // Intercept XMLHttpRequest
        var origXHROpen = XMLHttpRequest.prototype.open;
        var origXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
          this._aiaUrl = url;
          this._aiaMethod = method;
          return origXHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
          this.addEventListener('load', function() {
            try {
              var responseText = this.responseText || '';
              if (isCxmlContent(responseText, this._aiaUrl)) {
                pushCapture(responseText, this._aiaUrl, 'xhr');
              }
            } catch(e) {}
          });
          return origXHRSend.apply(this, arguments);
        };

        // Intercept fetch
        var origFetch = window.fetch;
        window.fetch = function() {
          var url = arguments[0];
          if (typeof url === 'object' && url.url) url = url.url;
          return origFetch.apply(this, arguments).then(function(response) {
            var clone = response.clone();
            clone.text().then(function(body) {
              if (isCxmlContent(body, url)) {
                pushCapture(body, url, 'fetch');
              }
            }).catch(function(){});
            return response;
          });
        };

        function isCxmlContent(text, url) {
          if (!text || text.length < 50) return false;
          // Check if response contains cXML
          if (/<cXML/i.test(text) || /<\\?xml[^>]*>\\s*<!DOCTYPE\\s+cXML/i.test(text)) return true;
          // Check URL patterns for cXML endpoints
          if (url && /cxml|transaction|order|invoice|shipnotice/i.test(url)) {
            if (/<\\?xml/i.test(text)) return true;
          }
          return false;
        }

        function pushCapture(content, url, method) {
          if (captured.length >= MAX_CAPTURED) captured.shift();
          captured.push({ content: content, url: url || '', method: method, timestamp: new Date().toISOString() });
          // Dispatch custom event so content script can pick it up
          window.dispatchEvent(new CustomEvent('aia-cxml-captured', { detail: { count: captured.length } }));
        }

        // Expose for content script retrieval
        window.__aiaCapturedCxml = captured;
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    // Listen for capture events from page context
    window.addEventListener('aia-cxml-captured', () => {
      try {
        var pageCaptured = window.__aiaCapturedCxml || [];
        // Move new captures to content script context
        while (pageCaptured.length > 0) {
          var item = pageCaptured.shift();
          window._aiaCapturedCxml.push(item);
          // Notify background/sidepanel of new capture
          chrome.runtime.sendMessage({
            type: 'CXML_CAPTURED',
            url: item.url,
            method: item.method,
            timestamp: item.timestamp,
            size: item.content.length
          }).catch(() => {});
        }
      } catch(e) {}
    });
  }

  // Inject network interceptor on Ariba pages
  if (/ariba\.com/i.test(window.location.href)) {
    injectNetworkInterceptor();
  }

  console.log('[AIA v3] Content script loaded on:', window.location.href);
})();
