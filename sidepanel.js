/* AIA v3.2.0 — Side Panel Controller (Chrome Theme, MV3 CSP safe)
   All event listeners — no inline handlers. */

/* ===== NAV SLIDER ===== */
function updateNavSlider() {
  var activeTab = document.querySelector('.nav-tab.active');
  var slider = document.getElementById('nav-slider');
  if (!activeTab || !slider) return;
  var track = activeTab.parentElement;
  var trackRect = track.getBoundingClientRect();
  var tabRect = activeTab.getBoundingClientRect();
  slider.style.left = (tabRect.left - trackRect.left) + 'px';
  slider.style.width = tabRect.width + 'px';
}

/* ===== TAB NAVIGATION ===== */
document.querySelectorAll('.nav-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    var panel = document.getElementById('tab-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
    updateNavSlider();
  });
});
/* Init slider position after DOM ready */
setTimeout(updateNavSlider, 50);
window.addEventListener('resize', updateNavSlider);

/* ===== DASHBOARD TOGGLE (Buyer / Supplier) ===== */
document.querySelectorAll('.dash-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var mode = btn.dataset.mode;
    document.querySelectorAll('.dash-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('dash-buyer').classList.toggle('active', mode === 'buyer');
    document.getElementById('dash-supplier').classList.toggle('active', mode === 'supplier');
  });
});

/* ===== INTEGRATION TOGGLE (Supplier / Buyer) ===== */
document.querySelectorAll('.int-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var mode = btn.dataset.mode;
    document.querySelectorAll('.int-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('int-supplier').classList.toggle('active', mode === 'supplier');
    document.getElementById('int-buyer').classList.toggle('active', mode === 'buyer');
  });
});

/* ===== STAGE STEPPER — Supplier ===== */
document.querySelectorAll('#int-supplier .arrow-step').forEach(function(step) {
  step.addEventListener('click', function() {
    var s = step.dataset.stage;
    if (!s) return;
    document.querySelectorAll('#int-supplier .arrow-step').forEach(function(st) { st.classList.remove('selected'); });
    step.classList.add('selected');
    document.querySelectorAll('#int-supplier .stage-view').forEach(function(c) { c.classList.remove('active'); });
    var target = document.getElementById('stage-' + s);
    if (target) target.classList.add('active');
    /* Update context bar badge */
    var names = { s1:'Plan', s2:'Design', s3:'Build', s4:'Test', s5:'Deploy', s6:'Live' };
    var colors = { s1:'var(--stage-1)', s2:'var(--stage-2)', s3:'var(--stage-3)', s4:'var(--stage-4)', s5:'var(--stage-5)', s6:'var(--stage-6)' };
    var dot = document.getElementById('ctx-dot');
    var text = document.getElementById('ctx-stage-text');
    if (dot) dot.style.background = colors[s] || 'var(--text2)';
    if (text) text.textContent = names[s] || '--';
  });
});

/* ===== STAGE STEPPER — Buyer ===== */
document.querySelectorAll('#int-buyer .arrow-step').forEach(function(step) {
  step.addEventListener('click', function() {
    var s = step.dataset.stage;
    if (!s) return;
    document.querySelectorAll('#int-buyer .arrow-step').forEach(function(st) { st.classList.remove('selected'); });
    step.classList.add('selected');
    document.querySelectorAll('#int-buyer .stage-view').forEach(function(c) { c.classList.remove('active'); });
    var target = document.getElementById('stage-' + s);
    if (target) target.classList.add('active');
  });
});

/* ===== SUB-TABS (CIG + Guides) ===== */
document.querySelectorAll('.sub-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    tab.parentElement.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    var viewId = tab.dataset.view;
    if (viewId) {
      tab.closest('.panel').querySelectorAll('.sub-view').forEach(function(v) { v.classList.remove('active'); });
      var view = document.getElementById(viewId);
      if (view) view.classList.add('active');
    }
  });
});

/* ===== CARD HEADER TOGGLE ===== */
document.querySelectorAll('.card-hdr').forEach(function(hdr) {
  hdr.addEventListener('click', function() {
    var body = hdr.nextElementSibling;
    if (body && body.classList.contains('card-body')) {
      body.style.display = body.style.display === 'none' ? 'block' : (body.style.display === 'block' ? 'none' : 'block');
    }
  });
});

/* ===== LEVEL TOGGLE (Troubleshoot 3-level) ===== */
document.querySelectorAll('.ts-level-hdr').forEach(function(hdr) {
  hdr.addEventListener('click', function() {
    var body = hdr.nextElementSibling;
    if (body) body.style.display = body.style.display === 'block' ? 'none' : 'block';
  });
});

/* ===== CHECKBOX TOGGLE ===== */
document.querySelectorAll('.task input[type=checkbox]:not([disabled])').forEach(function(cb) {
  cb.addEventListener('change', function() {
    var txt = cb.parentElement.querySelector('.task-text');
    if (txt) txt.classList.toggle('done', cb.checked);
  });
});

/* ===== HEADER BUTTONS ===== */
var refreshBtn = document.getElementById('btn-refresh');
if (refreshBtn) {
  refreshBtn.addEventListener('click', function() {
    location.reload();
  });
}

var reloadBtn = document.getElementById('btn-reload');
if (reloadBtn) {
  reloadBtn.addEventListener('click', function() {
    try { chrome.runtime.reload(); } catch(e) { location.reload(); }
  });
}

var exportBtn = document.getElementById('btn-export');
if (exportBtn) {
  exportBtn.addEventListener('click', function() {
    try {
      chrome.runtime.sendMessage({ type: 'EXPORT_DATA', format: 'json' }, function(d) {
        var b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
        var u = URL.createObjectURL(b);
        var a = document.createElement('a'); a.href = u; a.download = 'aia-export.json'; a.click();
      });
    } catch(e) {}
  });
}

/* ===== CIG MAPPING AI CONFIGURE ===== */
var CIG_DOC_MAPPINGS = {
  'cig-d-po': { name:'Purchase Order', x12:'850', segs:[{x:'BEG',c:'OrderRequestHeader',f:'PO#, Date, Type'},{x:'N1/N3/N4',c:'Address',f:'ShipTo/BillTo'},{x:'PO1',c:'ItemOut',f:'Line#, Qty, UoM, Price'},{x:'CTT',c:'Total',f:'Line count, hash total'}] },
  'cig-d-oc': { name:'Order Confirmation', x12:'855', segs:[{x:'BAK',c:'ConfirmationHeader',f:'PO#, Type, Date'},{x:'PO1',c:'ConfirmationItem',f:'Line#, Qty, Price, Status'},{x:'DTM',c:'@confirmDate',f:'Est. delivery'}] },
  'cig-d-asn': { name:'ASN', x12:'856', segs:[{x:'BSN',c:'ShipNoticeHeader',f:'Shipment ID, Date'},{x:'HL (S)',c:'ShipNoticePortion',f:'Carrier, tracking'},{x:'HL (I)',c:'ShipNoticeItem',f:'Part#, qty, UoM'}] },
  'cig-d-inv': { name:'Invoice', x12:'810', segs:[{x:'BIG',c:'InvoiceDetailReqHdr',f:'Invoice#, Date, PO Ref'},{x:'IT1',c:'InvoiceDetailItem',f:'Line#, qty, price'},{x:'TDS',c:'InvoiceDetailSummary',f:'Total amounts'}] },
  'cig-d-rem': { name:'Remittance', x12:'820', segs:[{x:'BPR',c:'PaymentRemittanceHdr',f:'Method, amount, date'},{x:'RMR',c:'PaymentRemittanceDetail',f:'Invoice ref, amount'}] }
};

var cigConfigBtn = document.getElementById('cig-configure-btn');
if (cigConfigBtn) {
  cigConfigBtn.addEventListener('click', function() {
    var result = document.getElementById('cig-ai-result');
    var tables = document.getElementById('cig-ai-tables');
    tables.innerHTML = '';
    var count = 0;
    Object.keys(CIG_DOC_MAPPINGS).forEach(function(id) {
      var cb = document.getElementById(id);
      if (cb && cb.checked) {
        count++;
        var d = CIG_DOC_MAPPINGS[id];
        tables.innerHTML += '<div class="card" style="margin-top:8px"><div class="card-hdr"><span><span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">auto_awesome</span> ' + d.name + ' — ' + d.x12 + '</span><span class="badge badge-success">AI Configured</span></div><div class="card-body" style="display:block"><table class="map-table"><thead><tr><th>X12</th><th>cXML</th><th>Fields</th></tr></thead><tbody>' + d.segs.map(function(s) { return '<tr><td class="code">' + s.x + '</td><td class="code">' + s.c + '</td><td>' + s.f + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
      }
    });
    document.getElementById('cig-ai-count').textContent = count;
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ===== CONTEXT BAR — Live supplier/buyer detection ===== */
function getInitials(name) {
  if (!name) return '--';
  var words = name.trim().split(/\s+/);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function updateContextBar(ctx) {
  if (!ctx) return;
  var nameEl = document.getElementById('ctx-name');
  var idEl = document.getElementById('ctx-id');
  var avatarEl = document.getElementById('ctx-avatar');
  var avatarText = avatarEl ? avatarEl.querySelector('.ctx-avatar-text') : null;
  var initials = getInitials(ctx.name);

  if (ctx.name) { nameEl.textContent = ctx.name; if (avatarText) avatarText.textContent = initials; }
  if (ctx.anid) { idEl.textContent = ctx.anid; }

  if (ctx.orgType === 'supplier') {
    avatarEl.style.background = 'var(--stage-3)';
  } else if (ctx.orgType === 'buyer') {
    avatarEl.style.background = 'var(--accent)';
  } else {
    avatarEl.style.background = '#999';
  }

  /* Update Integration toggle avatars */
  var intSA = document.getElementById('int-supplier-avatar');
  var intBA = document.getElementById('int-buyer-avatar');
  if (ctx.orgType === 'supplier') {
    if (intSA) { intSA.textContent = initials; intSA.style.background = 'var(--stage-3)'; }
    if (intBA) intBA.style.background = 'var(--accent)';
  } else if (ctx.orgType === 'buyer') {
    if (intBA) { intBA.textContent = initials; intBA.style.background = 'var(--accent)'; }
    if (intSA) intSA.style.background = 'var(--stage-3)';
  }

  /* Update Dashboard toggle avatars */
  var dashBA = document.getElementById('dash-buyer-avatar');
  var dashSA = document.getElementById('dash-supplier-avatar');
  if (ctx.orgType === 'supplier') {
    if (dashSA) { dashSA.textContent = initials; dashSA.style.background = 'var(--stage-3)'; }
    if (dashBA) dashBA.style.background = 'var(--accent)';
  } else if (ctx.orgType === 'buyer') {
    if (dashBA) { dashBA.textContent = initials; dashBA.style.background = 'var(--accent)'; }
    if (dashSA) dashSA.style.background = 'var(--stage-3)';
  }

  if (ctx.portal) {
    var portalNames = { cig: 'CIG Portal', ariba: 'Ariba Network' };
    if (!ctx.name) nameEl.textContent = portalNames[ctx.portal] || 'SAP Ariba';
  }
  console.log('[AIA] Context updated:', ctx.name, ctx.anid, ctx.orgType);
}

/* Listen for context updates from background */
try {
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.type === 'CONTEXT_UPDATE' && msg.context) updateContextBar(msg.context);
  });
  chrome.storage.local.get('currentContext', function(result) {
    if (result.currentContext) updateContextBar(result.currentContext);
  });
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CONTEXT' }, function(ctx) {
        if (!chrome.runtime.lastError && ctx) updateContextBar(ctx);
      });
    }
  });
} catch(e) { console.log('[AIA] Context listener error:', e.message); }

/* ===== TROUBLESHOOT ENGINE (27 Known Issues, 28 Error Patterns) ===== */
var KNOWN_ISSUES = [
  { id:'ANID_MISMATCH', category:'account', severity:'Critical', title:'ANID Mismatch', problem:'Supplier ANID does not match the buyer\'s vendor record in Ariba Network. Documents are rejected or routed to the wrong account.', solution:'<ol><li>Log into <b>Ariba Network</b> → Administration → Account Settings → verify the ANID</li><li>Cross-check the ANID in the buyer\'s ERP vendor master record</li><li>If duplicate accounts exist, contact Ariba Support to merge/deactivate</li><li>Update the AN relationship with the correct ANID</li><li>Re-send a test document to verify routing</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Open Ariba Network Admin' },
  { id:'MAP_FIELD_MISSING', category:'mapping', severity:'High', title:'Required Field Missing in Mapping', problem:'A mandatory field in the EDI X12 or cXML document is not populated or mapped incorrectly in CIG.', solution:'<ol><li>Open <b>CIG Portal</b> → your project → Message Mapping</li><li>Review the IGW specification for mandatory fields</li><li>Check the source ERP output</li><li>Add or fix the mapping rule in CIG</li><li>Re-run a unit test</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'Open CIG Portal' },
  { id:'CONNECTIVITY_FAIL', category:'connectivity', severity:'Critical', title:'Connectivity / Transport Failure', problem:'Cannot establish connectivity between supplier\'s system and Ariba Network via AS2, VAN, or HTTPS.', solution:'<ol><li><b>AS2:</b> Verify certificates, AS2 IDs, endpoint URL, port 443</li><li><b>VAN:</b> Confirm mailbox, ISA-ID/qualifier, routing rules</li><li><b>HTTPS:</b> Check endpoint, auth, IP whitelist, SSL</li><li>Run CIG connectivity test</li><li>Check firewall logs</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Connectivity Test' },
  { id:'DUPLICATE_DOC', category:'document', severity:'Medium', title:'Duplicate Document Rejected', problem:'A document is rejected because the document number already exists in the buyer\'s system.', solution:'<ol><li>Verify if the document was sent more than once</li><li>Check Ariba Network document history</li><li>Change document number or use revision indicator</li><li>Configure ERP for unique numbering</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Check Document History' },
  { id:'SCHEMA_VALIDATION', category:'mapping', severity:'High', title:'Schema / DTD Validation Error', problem:'The cXML or X12 document fails schema validation.', solution:'<ol><li>Check expected cXML version</li><li>Validate against correct DTD/XSD</li><li>In CIG, verify output format</li><li>For X12: confirm version in ISA12/GS08</li></ol>', portalLink:'https://help.sap.com/docs/ariba-network', portalLabel:'Ariba Schema Documentation' },
  { id:'CERT_EXPIRED', category:'certificate', severity:'Critical', title:'Certificate Expired or Untrusted', problem:'SSL or AS2 certificates have expired, are self-signed, or the chain is incomplete.', solution:'<ol><li>Check cert expiry: CIG Portal → Connectivity → Certificates</li><li>Renew with your CA</li><li>Upload new cert to CIG and AN</li><li>Include full certificate chain</li><li>Ask trading partner to update trust store</li><li>Re-test connectivity</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Certificate Management' },
  { id:'VENDOR_ID_MAP', category:'account', severity:'High', title:'Vendor ID Mapping Mismatch', problem:'The supplier\'s vendor ID in the buyer\'s ERP does not match Ariba Network.', solution:'<ol><li>Compare vendor ID in buyer ERP with AN profile</li><li>Check AN → Customer Relationships</li><li>Update vendor ID alignment</li><li>Map multiple plant/location codes</li><li>Re-process failed documents</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'AN Customer Relationships' },
  { id:'TEST_ENV_CONFIG', category:'testing', severity:'Medium', title:'Test Environment Misconfigured', problem:'Test transactions fail due to NDL account or CIG project misconfiguration.', solution:'<ol><li>Verify NDL test account is active</li><li>Confirm CIG test project points to test AN endpoint</li><li>Ensure test ANID differs from production</li><li>Use distinct document numbers</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'AN Test Environment' },
  { id:'CIG_ADAPTER_FAIL', category:'cig', severity:'High', title:'CIG Adapter Configuration Error', problem:'CIG adapter template does not match supplier\'s ERP output format.', solution:'<ol><li>Open CIG Portal → Adapter Configuration</li><li>Verify adapter matches ERP type</li><li>Check adapter version</li><li>Review translation log</li><li>Test after reconfiguration</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Adapter Config' },
  { id:'ASN_HL_HIERARCHY', category:'document', severity:'High', title:'ASN HL Hierarchy Error (856)', problem:'ASN has incorrect HL structure. Expected: Shipment → Order → Pack → Item.', solution:'<ol><li>Verify HL segments: HL01, HL02, HL03</li><li>Required levels: S, O, P (optional), I</li><li>Check parent-child references</li><li>Check CIG mapping for HL codes</li><li>Test with minimal ASN first</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'Review ASN Mapping in CIG' },
  { id:'INVOICE_3WAY_MATCH', category:'document', severity:'High', title:'Invoice 3-Way Match Failure', problem:'Invoice rejected due to 3-way match failure against PO and GR/ASN.', solution:'<ol><li>Verify invoice references correct PO</li><li>Check qty ≤ received qty</li><li>Confirm unit price matches PO</li><li>Check buyer price tolerance</li><li>For services: ensure SES approved</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Check Invoice Status in AN' },
  { id:'PROD_CUTOVER_FAIL', category:'production', severity:'Critical', title:'Production Cutover Failure', problem:'Integration works in test but fails in production.', solution:'<ol><li>Verify CIG production project exists</li><li>Confirm mappings migrated from test</li><li>Check production AN account</li><li>Upload production certificates</li><li>Verify firewall rules</li><li>Run full smoke test</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Production Project' },
  { id:'INVOICE_REJECTED', category:'document', severity:'Critical', title:'Invoice Rejected by Buyer', problem:'Invoice rejected due to business rule violations. Check error codes like INV-138, INV-25, INV-52, DOC-6, DOC-1.', solution:'<ol><li>Review Reasons section for error codes</li><li><b>INV-138</b>: Unit price mismatch</li><li><b>INV-25</b>: Quantity exceeds limit</li><li><b>INV-52</b>: Subtotal exceeds line item subtotals</li><li><b>DOC-6</b>: Document preprocessing error</li><li><b>DOC-1</b>: Invoice validation failed</li><li>Click <b>"Edit & Resubmit"</b></li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Check Invoice in AN' },
  { id:'INVOICE_PRICE_MISMATCH', category:'document', severity:'High', title:'Invoice Unit Price Mismatch (INV-138)', problem:'Unit price on invoice does not match PO line and exceeds buyer\'s price tolerance.', solution:'<ol><li>Compare unit price on each invoice line with PO</li><li>Check if PO Change (855) was sent</li><li>Verify price in supplier ERP</li><li>Edit invoice and resubmit</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Review PO Prices in AN' },
  { id:'INVOICE_QTY_MISMATCH', category:'document', severity:'High', title:'Invoice Quantity Exceeds Limit (INV-25)', problem:'Invoiced quantity exceeds the buying organization\'s quantity limits.', solution:'<ol><li>Compare invoice qty with PO line qty</li><li>Check ASN/Goods Receipt</li><li>Verify UoM consistency</li><li>Edit and resubmit</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Check PO Quantities' },
  { id:'INVOICE_SUBTOTAL_MISMATCH', category:'document', severity:'High', title:'Invoice Subtotal Exceeds Line Item Totals (INV-52)', problem:'Line-level extended amount doesn\'t match expected total based on PO.', solution:'<ol><li>Recalculate: Subtotal = Qty × Unit Price</li><li>Fix INV-138 and INV-25 first</li><li>Check rounding differences</li><li>Edit and resubmit</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Review Invoice Lines' },
  { id:'DOC_PREPROCESSING_ERROR', category:'cig', severity:'High', title:'Document Preprocessing Error (DOC-6)', problem:'Document failed during initial parsing/translation in CIG.', solution:'<ol><li>Check CIG transaction log</li><li>Verify source document structure</li><li>For EDI: check ISA/GS/ST envelopes</li><li>For cXML: validate against DTD</li><li>Check CIG adapter template</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Transaction Log' },
  { id:'INVOICE_VALIDATION_FAILED', category:'document', severity:'Critical', title:'Invoice Validation Failed (DOC-1)', problem:'Invoice failed buyer\'s business rule validation. Summary error for INV-* violations.', solution:'<ol><li>Review all INV-* error codes</li><li>Fix price, qty issues first</li><li>Ensure correct PO reference</li><li>Use "Edit & Resubmit"</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Edit & Resubmit Invoice' },
  { id:'ROUTING_FAILED', category:'document', severity:'High', title:'Document Routing Failed', problem:'Document could not be delivered to buyer\'s system.', solution:'<ol><li>Check if document was rejected</li><li>Fix underlying errors first</li><li>Check AN routing configuration</li><li>Verify buyer endpoint</li><li>Resubmit after fixes</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Check Routing Status' },
  { id:'DOC_PROCESSING_STATUS', category:'cig', severity:'Low', title:'Document Processing Status (DOC-492/DOC-172)', problem:'Informational status codes: DOC-492 = received, DOC-172 = validated and processing.', solution:'<p>These are <b>informational</b>, not errors. If the document still fails, look for subsequent INV-*/DOC-* codes.</p>', portalLink:'https://service.ariba.com', portalLabel:'View Document History' },
  { id:'PO_REFERENCE_NOT_FOUND', category:'cig', severity:'Critical', title:'Referenced PO Not Found (OC-7)', problem:'PO number in document does not match any existing PO in buyer\'s Ariba Network.', solution:'<ol><li>Verify PO number</li><li>Check PO existence in AN</li><li>Check PO number format (leading zeros)</li><li>Verify environment (test vs prod)</li><li>Check ANID alignment</li><li>Contact buyer</li></ol>', portalLink:'https://support.ariba.com/item/view/189049', portalLabel:'SAP Note 189049' },
  { id:'CIG_PLT_00644', category:'cig', severity:'Critical', title:'CIG Platform Error (CIG-PLT-00644)', problem:'Document processed by CIG but failed when submitted to Business Network.', solution:'<ol><li>Read full error — look for OC-* code</li><li><b>OC-7:</b> PO not found</li><li><b>OC-1:</b> Document validation</li><li><b>OC-3:</b> Duplicate</li><li>Review SAP Note 189049</li><li>Check CIG transaction log</li></ol>', portalLink:'https://support.ariba.com/item/view/189049', portalLabel:'SAP Note 189049 — CIG-PLT-00644' },
  { id:'CIG_PLATFORM_ERROR', category:'cig', severity:'High', title:'CIG Platform Error (CIG-PLT-*)', problem:'CIG middleware-level error during translation, routing, or submission.', solution:'<ol><li><b>CIG-PLT-00644:</b> Check OC-* code</li><li><b>CIG-PLT-00100/200:</b> Review adapter config</li><li><b>CIG-PLT-00300:</b> Check connectivity</li><li>Open CIG Monitor</li><li>Review SAP Note 189049</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Transaction Monitor' },
  { id:'AN_ERROR_REFERENCE', category:'document', severity:'Medium', title:'Ariba Network Error Reference (ANERR-*)', problem:'ANERR-* reference number generated for tracking.', solution:'<ol><li>Save the ANERR number for support tickets</li><li>Focus on root cause error first</li><li>Open support ticket with ANERR, error message, document details, and ANIDs</li></ol>', portalLink:'https://support.ariba.com', portalLabel:'Open Ariba Support Ticket' },
  { id:'BAD_REQUEST_400', category:'cig', severity:'High', title:'Bad Request (HTTP 400) from Business Network', problem:'AN returned HTTP 400 — document payload is invalid.', solution:'<ol><li>Read ErrorResponse OC-* code</li><li>Fix document content</li><li>Resubmit after correction</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'Check CIG Transaction Log' },
  { id:'DOC_FAILED_BN', category:'cig', severity:'Critical', title:'Document Failed in Business Network', problem:'Document processed by CIG but failed AN inbound validation.', solution:'<ol><li>Check OC-* error code</li><li>Verify document references</li><li>Check AN environment</li><li>Open CIG transaction log</li><li>Fix and resubmit</li></ol>', portalLink:'https://integration.ariba.com', portalLabel:'CIG Monitor — Failed Transactions' },
  { id:'INVOICE_RULE_VIOLATION', category:'document', severity:'High', title:'Invoice Business Rule Violation (INV-*)', problem:'One or more invoice validation rules violated.', solution:'<ol><li>Identify all INV-* codes</li><li><b>INV-25:</b> Reduce qty</li><li><b>INV-52:</b> Correct subtotals</li><li><b>INV-138:</b> Align prices</li><li>Use "Edit & Resubmit"</li></ol>', portalLink:'https://service.ariba.com', portalLabel:'Review Invoice Rules' }
];

/* ===== PATTERN ANALYSIS ===== */
function analyzePageForErrors(text, url) {
  var detected = [];
  var patterns = [
    { regex: /ANID.*mismatch|mismatch.*ANID|account.*not.*found|unknown.*supplier/i, issueId: 'ANID_MISMATCH' },
    { regex: /field.*missing|required.*field|mandatory.*empty|element.*required/i, issueId: 'MAP_FIELD_MISSING' },
    { regex: /connection.*fail|connectivity.*error|timeout|connection.*refused|cannot.*connect/i, issueId: 'CONNECTIVITY_FAIL' },
    { regex: /duplicate.*document|duplicate.*number|already.*exist|duplicate.*invoice/i, issueId: 'DUPLICATE_DOC' },
    { regex: /schema.*valid|DTD.*error|XML.*parse|malformed/i, issueId: 'SCHEMA_VALIDATION' },
    { regex: /certificate.*expir|cert.*invalid|untrusted.*cert|SSL.*error|TLS.*fail/i, issueId: 'CERT_EXPIRED' },
    { regex: /vendor.*ID.*mismatch|vendor.*not.*found|vendor.*inactive/i, issueId: 'VENDOR_ID_MAP' },
    { regex: /test.*account.*error|NDL.*fail|test.*environment.*error/i, issueId: 'TEST_ENV_CONFIG' },
    { regex: /adapter.*fail|adapter.*error|translation.*fail|CIG.*adapter.*error/i, issueId: 'CIG_ADAPTER_FAIL' },
    { regex: /HL.*hierarchy|HL.*level.*error|BSN.*error|856.*error|ASN.*reject/i, issueId: 'ASN_HL_HIERARCHY' },
    { regex: /production.*cutover.*fail|cutover.*error|prod.*config.*fail/i, issueId: 'PROD_CUTOVER_FAIL' },
    { regex: /INV-138/i, issueId: 'INVOICE_PRICE_MISMATCH' },
    { regex: /INV-25/i, issueId: 'INVOICE_QTY_MISMATCH' },
    { regex: /INV-52/i, issueId: 'INVOICE_SUBTOTAL_MISMATCH' },
    { regex: /unit\s*price.*(?:not\s+match|mismatch|does\s+not\s+match)|price.*tolerance|price.*variance/i, issueId: 'INVOICE_PRICE_MISMATCH' },
    { regex: /quantity.*exceeds.*limit|qty.*exceeds|invoiced\s+quantity.*greater/i, issueId: 'INVOICE_QTY_MISMATCH' },
    { regex: /subtotal.*exceeds|line\s*item\s*subtotal.*exceeds/i, issueId: 'INVOICE_SUBTOTAL_MISMATCH' },
    { regex: /DOC-6[^0-9]|document\s*preprocessing\s*error/i, issueId: 'DOC_PREPROCESSING_ERROR' },
    { regex: /DOC-1[^0-9]|invoice\s*validation\s*failed/i, issueId: 'INVOICE_VALIDATION_FAILED' },
    { regex: /DOC-492|DOC-172/i, issueId: 'DOC_PROCESSING_STATUS' },
    { regex: /Rejected\s+Invoice|invoice.*rejected|Status:?\s*Rejected/i, issueId: 'INVOICE_REJECTED' },
    { regex: /Routing:?\s*Failed/i, issueId: 'ROUTING_FAILED' },
    { regex: /Edit\s*&\s*Resubmit/i, issueId: 'INVOICE_REJECTED' },
    { regex: /3.?way\s*match|three.?way\s*match/i, issueId: 'INVOICE_3WAY_MATCH' },
    { regex: /\bOC-\d+|Cannot\s+find.*referenced\s+PO|PO\s+(?:number\s+)?not\s+found/i, issueId: 'PO_REFERENCE_NOT_FOUND' },
    { regex: /CIG-PLT-00644/i, issueId: 'CIG_PLT_00644' },
    { regex: /CIG-PLT-\d+/i, issueId: 'CIG_PLATFORM_ERROR' },
    { regex: /ANERR-\d+/i, issueId: 'AN_ERROR_REFERENCE' },
    { regex: /ErrorCode[:\s]*["']?400["']?|HTTP[\/\s]*400.*Bad\s*Request/i, issueId: 'BAD_REQUEST_400' },
    { regex: /Document\s+failed\s+in\s+Business\s+Network/i, issueId: 'DOC_FAILED_BN' }
  ];
  var addedIds = new Set();
  patterns.forEach(function(p) {
    if (p.regex.test(text)) {
      var issue = KNOWN_ISSUES.find(function(i) { return i.id === p.issueId; });
      if (issue && !addedIds.has(issue.id)) { detected.push(issue); addedIds.add(issue.id); }
    }
  });
  /* Post-processing: remove redundant issues */
  var specificInv = ['INVOICE_PRICE_MISMATCH','INVOICE_QTY_MISMATCH','INVOICE_SUBTOTAL_MISMATCH'];
  var hasSpecific = detected.some(function(d) { return specificInv.indexOf(d.id) >= 0; });
  var hasRejected = addedIds.has('INVOICE_REJECTED');
  var filtered = detected.filter(function(d) {
    if (d.id === 'INVOICE_RULE_VIOLATION' && hasSpecific) return false;
    if (d.id === 'ROUTING_FAILED' && hasRejected) return false;
    if (d.id === 'INVOICE_VALIDATION_FAILED' && hasSpecific) return false;
    if (d.id === 'INVOICE_3WAY_MATCH' && hasSpecific) return false;
    return true;
  });
  var invCodes = text.match(/INV-\d+/g);
  var docCodes = text.match(/DOC-\d+/g);
  var ocCodes = text.match(/OC-\d+/g);
  var cigCodes = text.match(/CIG-PLT-\d+/g);
  var anErrCodes = text.match(/ANERR-\d+/g);
  if (invCodes || docCodes || ocCodes || cigCodes || anErrCodes) {
    filtered._rawCodes = [].concat(invCodes||[], docCodes||[], ocCodes||[], cigCodes||[], anErrCodes||[]).filter(function(v,i,a) { return a.indexOf(v)===i; });
  }
  return filtered;
}

/* ===== AUTO SCAN ===== */
function runAutoScan() {
  var btn = document.getElementById('ts-scan-btn');
  btn.disabled = true; btn.textContent = 'Scanning...';
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].id) {
        showScanResults([], 'No active tab found. Navigate to an Ariba page and try again.');
        btn.disabled = false; btn.textContent = 'Scan';
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' }, function(response) {
        btn.disabled = false; btn.textContent = 'Scan';
        if (chrome.runtime.lastError || !response) {
          var url = tabs[0].url || '';
          if (!url.includes('ariba.com') && !url.includes('sap.com')) {
            showScanResults([], 'Not on an Ariba page. Navigate to <b>service.ariba.com</b> or <b>integration.ariba.com</b>.');
          } else {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: function() {
                var sources = [document.body ? document.body.innerText : ''];
                document.querySelectorAll('#sap-ui-static,[role="dialog"],[role="alertdialog"],.sapMDialog,.sapMPopover').forEach(function(el) { sources.push(el.innerText || ''); });
                return { url: window.location.href, title: document.title, text: sources.join('\n').substring(0, 8000) };
              }
            }).then(function(results) {
              if (results && results[0] && results[0].result) {
                var r = results[0].result;
                showScanResults(analyzePageForErrors(r.text || '', r.url || ''), null, r.url);
              } else {
                showScanResults([], 'Could not read page content.');
              }
            }).catch(function() { showScanResults([], 'Could not read page content.'); });
          }
          return;
        }
        showScanResults(analyzePageForErrors(response.text || '', response.url || ''), null, response.url);
      });
    });
  } catch(e) {
    showScanResults([], 'Chrome extension API not available.');
    btn.disabled = false; btn.textContent = 'Scan';
  }
}

function showScanResults(detected, fallbackMsg, url) {
  var el = document.getElementById('ts-scan-results');
  if (fallbackMsg) {
    el.innerHTML = '<div class="ts-no-issues" style="background:var(--warn-light);border-color:rgba(227,116,0,.2)"><div class="ts-check"><span class="material-symbols-rounded" style="font-size:28px;color:var(--warn)">warning</span></div><p style="color:var(--warn)">' + fallbackMsg + '</p></div>';
    return;
  }
  if (!detected.length) {
    el.innerHTML = '<div class="ts-no-issues"><div class="ts-check"><span class="material-symbols-rounded" style="font-size:28px;color:var(--ok)">check_circle</span></div><p>No issues detected on this page</p><div class="ts-sub">The current page looks clean.' + (url ? '<br>Scanned: ' + url : '') + '</div></div>';
    return;
  }
  el.innerHTML = '<div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--err)"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">error</span> ' + detected.length + ' issue' + (detected.length>1?'s':'') + ' detected</div>' +
    (detected._rawCodes ? '<div style="font-size:11px;margin-bottom:8px;padding:6px 8px;background:var(--warn-light);border-radius:var(--r-sm);border:1px solid rgba(227,116,0,.2)"><b>Error codes:</b> ' + detected._rawCodes.join(', ') + '</div>' : '') +
    detected.map(renderIssueCard).join('');
  wireEmailButtons();
}

function renderIssueCard(issue) {
  var sevClass = issue.severity === 'Critical' ? 'badge-error' : issue.severity === 'High' ? 'badge-warning' : 'badge-dur';
  return '<div class="ts-result-card"><div class="ts-result-header"><span class="material-symbols-rounded" style="font-size:16px;color:var(--err)">error</span><div style="flex:1"><div class="ts-result-title">' + issue.title + '</div><span class="ts-result-code">' + issue.id + '</span></div><span class="badge ' + sevClass + '">' + issue.severity + '</span></div>' +
    '<div class="ts-problem"><div class="ts-problem-label"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">report</span> Problem</div><div class="ts-problem-text">' + issue.problem + '</div></div>' +
    '<div class="ts-solution"><div class="ts-solution-label"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">check_circle</span> Fix</div><div class="ts-solution-text">' + issue.solution + '<a class="ts-solution-link" href="' + issue.portalLink + '" target="_blank"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">open_in_new</span> ' + issue.portalLabel + '</a></div></div>' +
    '<button class="btn-draft-email" data-issue-id="' + issue.id + '"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">mail</span> Draft Resolution Email</button></div>';
}

/* ===== MANUAL DIAGNOSE ===== */
function runManualDiagnose() {
  var category = document.getElementById('ts-category').value;
  var errorText = document.getElementById('ts-error-text').value.trim();
  var resPanel = document.getElementById('ts-resolution');
  var resContent = document.getElementById('ts-resolution-content');
  if (!errorText && !category) {
    resPanel.style.display = 'block';
    resContent.innerHTML = '<div class="ts-no-issues" style="background:var(--warn-light);border-color:rgba(227,116,0,.2)"><div class="ts-check"><span class="material-symbols-rounded" style="font-size:28px;color:var(--warn)">warning</span></div><p style="color:var(--warn)">Please select a category or describe the error</p></div>';
    return;
  }
  var matches = [];
  if (errorText) matches = analyzePageForErrors(errorText, '');
  if (!matches.length && category) matches = KNOWN_ISSUES.filter(function(i) { return i.category === category; });
  if (!matches.length && errorText) {
    var words = errorText.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
    if (words.length > 0) {
      matches = KNOWN_ISSUES.filter(function(issue) {
        var searchText = (issue.title + ' ' + issue.id).toLowerCase();
        var matchCount = words.filter(function(w) { return searchText.indexOf(w) >= 0; }).length;
        return matchCount >= 2 || words.some(function(w) { return /^(inv|doc|oc|cig|anerr)/i.test(w) && searchText.indexOf(w) >= 0; });
      });
    }
  }
  if (category && matches.length > 5) {
    var catFiltered = matches.filter(function(i) { return i.category === category; });
    if (catFiltered.length > 0) matches = catFiltered;
  }
  resPanel.style.display = 'block';
  if (!matches.length) {
    resContent.innerHTML = '<div class="ts-result-card"><div class="ts-result-header"><span class="material-symbols-rounded" style="font-size:16px;color:var(--warn)">help</span><div><div class="ts-result-title">No exact match found</div></div></div><div class="ts-solution"><div class="ts-solution-label"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">lightbulb</span> Suggestions</div><div class="ts-solution-text"><ol><li>Try a different description or paste the exact error</li><li>Select a category</li><li>Check Ariba Support</li></ol><a class="ts-solution-link" href="https://support.ariba.com" target="_blank"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">open_in_new</span> Open Ariba Support</a></div></div></div>';
    return;
  }
  resContent.innerHTML = '<div style="font-size:12px;color:var(--text2);margin-bottom:8px">Found <b>' + matches.length + '</b> matching issue' + (matches.length>1?'s':'') + ':</div>' + matches.map(renderIssueCard).join('');
  wireEmailButtons();
  resPanel.scrollIntoView({ behavior: 'smooth' });
}

/* ===== DRAFT EMAIL ===== */
function draftEmail(issueId) {
  var issue = KNOWN_ISSUES.find(function(i) { return i.id === issueId; });
  if (!issue) return;
  var supplierName = (document.getElementById('ctx-name') || {}).textContent || 'Supplier';
  var anid = (document.getElementById('ctx-id') || {}).textContent || '';
  var solutionText = issue.solution.replace(/<ol>/g,'\n').replace(/<\/ol>/g,'').replace(/<ul>/g,'\n').replace(/<\/ul>/g,'').replace(/<li>/g,'  - ').replace(/<\/li>/g,'\n').replace(/<b>/g,'').replace(/<\/b>/g,'').replace(/<br\s*\/?>/g,'\n').replace(/<p[^>]*>/g,'\n').replace(/<\/p>/g,'').replace(/<[^>]+>/g,'').replace(/\n{3,}/g,'\n\n').trim();
  var subject = '[AIA] Resolution Required: ' + issue.title + ' (' + issue.id + ') — ' + supplierName;
  var body = 'Hi Team,\n\nThe Ariba Integration Agent (AIA) has identified the following issue:\n\nError Code: ' + issue.id + '\nSeverity: ' + issue.severity + '\nSupplier: ' + supplierName + '\n' + (anid ? 'ANID: ' + anid + '\n' : '') + '\nPROBLEM:\n' + issue.problem + '\n\nRECOMMENDED RESOLUTION:\n' + solutionText + '\n\nPortal Link: ' + issue.portalLink + '\n\nBest regards,\nAIA — Ariba Integration Agent v3.1.0\n';
  var outlookUrl = 'https://outlook.office.com/mail/deeplink/compose?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  try { chrome.tabs.create({ url: outlookUrl }); } catch(e) { window.open(outlookUrl, '_blank'); }
}

function wireEmailButtons() {
  document.querySelectorAll('.btn-draft-email').forEach(function(btn) {
    btn.addEventListener('click', function() { draftEmail(btn.getAttribute('data-issue-id')); });
  });
}

/* ===== WIRE TROUBLESHOOT BUTTONS ===== */
var scanBtn = document.getElementById('ts-scan-btn');
if (scanBtn) scanBtn.addEventListener('click', runAutoScan);
var diagnoseBtn = document.getElementById('ts-diagnose-btn');
if (diagnoseBtn) diagnoseBtn.addEventListener('click', runManualDiagnose);

/* ================================================================
   cXML → EDI GUIDE CREATION ENGINE
   Upload cXML docs → Parse → Convert to EDI segments → Excel download
   ================================================================ */

var cxmlFiles = { po: null, poc: null, oc: null, asn: null, gr: null, inv: null };

/* SAP ANSI X12 4010 EDI Segment Reference Data
   Col A = EDI Segment, Col B = Explanation, Col C = SAP Guide Reference */
var EDI_REFERENCE = {
  /* ===== Purchase Order — EDI 850 ===== */
  po: [
    ['ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*GLOBALPARTS    *260427*1030*U*00401*000000001*0*P*>~', 'Interchange Control Header (ISA) — 16 fixed-width elements defining the EDI envelope. ISA01-02: Authorization qualifier/info (00=no auth). ISA03-04: Security qualifier/info (00=none). ISA05-06: Sender ID qualifier (ZZ=mutually defined) and 15-char padded sender ID. ISA07-08: Receiver ID qualifier and 15-char padded receiver ID. ISA09: Interchange date (YYMMDD). ISA10: Interchange time (HHMM). ISA11: Repetition separator (U=standard). ISA12: Version (00401=ANSI X12 v4010). ISA13: 9-digit zero-padded control number (must match IEA02). ISA14: Acknowledgment requested (0=No, 1=Yes). ISA15: Usage indicator (P=Production, T=Test). ISA16: Component element separator (>). In this example: Acme Corp sends to GlobalParts on April 27, 2026 at 10:30, production mode, interchange #000000001.', '§1 Interchange Envelope, pp. 8-12'],
    ['GS*PO*ACMECORP*GLOBALPARTS*20260427*1030*1*X*004010~', 'Functional Group Header (GS) — Groups one or more transaction sets of the same type. GS01: Functional ID code (PO=Purchase Order, PR=PO Acknowledgment, SH=Ship Notice, IN=Invoice). GS02: Application sender code. GS03: Application receiver code. GS04: Date (CCYYMMDD). GS05: Time (HHMM). GS06: Group control number (must match GE02). GS07: Responsible agency code (X=ASC X12). GS08: Version/release/industry ID (004010). In this example: PO functional group from ACMECORP to GLOBALPARTS, group control #1.', '§1 Functional Group, pp. 12-14'],
    ['ST*850*0001~', 'Transaction Set Header (ST) — Marks the start of an individual transaction set within the functional group. ST01: Transaction set identifier code (850=Purchase Order). ST02: Transaction set control number (4-9 digits, must match SE02). Multiple ST/SE pairs can exist within one GS/GE group. In this example: Purchase Order transaction set #0001.', '§2 Transaction Set Header, p. 15'],
    ['BEG*00*NE*PO-2026-78543**20260427~', 'Beginning Segment for Purchase Order (BEG) — Defines the PO identity and purpose. BEG01: Transaction set purpose code (00=Original, 01=Cancellation, 04=Change, 05=Replace, 06=Confirmation). BEG02: PO type code (NE=New Order, DS=Drop Ship, BK=Blanket, SA=Stand-Alone, RC=Release from Blanket). BEG03: Purchase order number. BEG04: Release number (blank if not a blanket release). BEG05: PO date (CCYYMMDD). In this example: Original new PO number PO-2026-78543 dated April 27, 2026.', '§2 BEG Segment, pp. 16-18'],
    ['REF*CO*ATLAS-2026~', 'Reference Identification (REF) — Provides additional reference numbers for the PO. REF01: Reference ID qualifier (CO=Customer Order Number, DP=Department Number, AH=Agreement Number/Cost Center, VR=Vendor Reference, ZZ=Mutually Defined, IA=Internal Vendor Number). REF02: Reference identification value. Multiple REF segments are common. In this example: Customer order reference "ATLAS-2026" (project code).', '§2 REF Segment, pp. 19-21'],
    ['REF*DP*Manufacturing~', 'Reference Identification (REF) — Additional reference. REF01: DP=Department Name/Number. REF02: Department value. In this example: Requesting department is "Manufacturing".', '§2 REF Segment, pp. 19-21'],
    ['REF*AH*CC-4400-MFG~', 'Reference Identification (REF) — Additional reference. REF01: AH=Agreement Number (often used for cost center or internal accounting code). In this example: Cost center allocation "CC-4400-MFG".', '§2 REF Segment, pp. 19-21'],
    ['PER*BD*Jennifer Martinez*TE*2145550198*EM*j.martinez@acme.com~', 'Administrative Communications Contact (PER) — Identifies contact persons for the PO. PER01: Contact function code (BD=Buyer Name/Department, DC=Delivery Contact, IC=Information Contact, CN=General Contact). PER02: Contact name. PER03-04: Communication number qualifier (TE=Telephone) and number. PER05-06: Second qualifier (EM=Email) and address. PER07-08: Third qualifier (FX=Fax) and number (optional). In this example: Buyer contact Jennifer Martinez with phone and email.', '§2 PER Segment, p. 22'],
    ['PER*DC*Robert Chen*TE*7135550142*EM*r.chen@acme.com~', 'Administrative Communications Contact (PER) — Second contact. PER01: DC=Delivery Contact. In this example: Delivery contact Robert Chen at the receiving location.', '§2 PER Segment, p. 22'],
    ['DTM*002*20260510~', 'Date/Time Reference (DTM) — Specifies dates relevant to the PO. DTM01: Date/time qualifier (002=Delivery Requested, 004=Purchase Order Date, 010=Requested Ship Date, 011=Shipped, 017=Estimated Delivery, 037=Ship Not Before, 038=Ship No Later). DTM02: Date (CCYYMMDD). DTM03: Time (HHMM, optional). In this example: Delivery requested by May 10, 2026.', '§2 DTM Segment, pp. 30-31'],
    ['TD5*O*2*FXFE*M~', 'Carrier Details / Routing (TD5) — Specifies transportation routing and carrier. TD501: Routing sequence code (O=Origin Carrier, B=Origin/Delivery Carrier). TD502: ID code qualifier (2=Standard Carrier Alpha Code). TD503: Carrier identification (SCAC: FXFE=FedEx Freight, UPSN=UPS, USPS=Postal Service, FDEG=FedEx Ground). TD504: Transportation method/type code (M=Motor, A=Air, R=Rail, S=Ocean, X=Intermodal). In this example: Ship via FedEx Freight (FXFE) by motor carrier.', '§2 TD5 Segment, pp. 31-33'],
    ['N1*ST*Acme Corp - Distribution Center*92*ADDR-ST-001~', 'Party Identification (N1) — Identifies organizational entities involved in the transaction. N101: Entity identifier code (ST=Ship-To, BT=Bill-To, BY=Buying Party, VN=Vendor, SE=Selling Party, SF=Ship-From, RI=Remit-To). N102: Entity name. N103: Identification code qualifier (92=Assigned by Buyer/Seller, 1=D-U-N-S Number, 9=DUNS+4, 91=Assigned by Seller, ZZ=Mutually Defined). N104: Identification code. In this example: Ship-To party is Acme Corp Distribution Center, buyer-assigned address ID ADDR-ST-001.', '§3 N1 Loop, pp. 35-37'],
    ['N3*4500 Industrial Parkway*Building 7, Suite 200~', 'Party Address (N3) — Street address for the entity identified in the preceding N1 segment. N301: Address line 1. N302: Address line 2 (optional — suite, building, floor). In this example: Two-line address for the ship-to location.', '§3 N3 Segment, p. 38'],
    ['N4*Houston*TX*77041*US~', 'Party Geographic Location (N4) — City, state, postal code, and country for the N1 entity. N401: City name. N402: State or province code (2-letter). N403: Postal/ZIP code. N404: Country code (ISO 3166-1 alpha-2: US, CA, GB, DE, MX, CN). In this example: Houston, Texas 77041, United States.', '§3 N4 Segment, p. 38'],
    ['N1*BT*Acme Corp - Accounts Payable~', 'Party Identification (N1) — Bill-To party. N101: BT=Bill-To. N102: Name. N103/N104 are optional if no coded ID is needed. In this example: Bill-To is Acme Corp Accounts Payable department.', '§3 N1 Loop, pp. 35-37'],
    ['N3*1200 Commerce Drive~', 'Party Address (N3) — Bill-To street address. In this example: Single-line billing address.', '§3 N3 Segment, p. 38'],
    ['N4*Dallas*TX*75201*US~', 'Party Geographic Location (N4) — Bill-To city/state/zip. In this example: Dallas, Texas 75201.', '§3 N4 Segment, p. 38'],
    ['ITD*01*3*2**30****Net 30~', 'Terms of Sale / Deferred Terms (ITD) — Defines payment terms for the PO. ITD01: Terms type code (01=Basic, 02=End of Month, 05=Discount Not Applicable, 08=Basic Discount Offered). ITD02: Terms basis date code (3=Invoice Date, 1=Ship Date, 2=Delivery Date). ITD03: Terms discount percent. ITD05: Terms discount due days. ITD07: Terms net due days. ITD12: Description. In this example: 2% early payment discount, net due in 30 days from invoice date, described as "Net 30".', '§2 ITD Segment, pp. 28-30'],
    ['PO1*1*500*EA*3.50*PE*VP*BOLT-SS316-M10X50*BP*ACM-FST-00142~', 'Purchase Order Line Item (PO1) — Core line item detail. PO101: Assigned identification (line number). PO102: Quantity ordered. PO103: Unit of measure (EA=Each, BX=Box, CS=Case, KG=Kilogram, LB=Pound, FT=Foot, PC=Piece). PO104: Unit price. PO105: Basis of unit price code (PE=Price per Each, PP=Price per Pound). PO106 onward: Repeating pairs of product/service ID qualifier + value (VP=Vendor Part#, BP=Buyer Part#, UP=UPC, EN=EAN/GTIN-13, UK=GTIN-14, MG=Manufacturer Part#). In this example: Line 1, 500 each at $3.50, vendor part BOLT-SS316-M10X50, buyer part ACM-FST-00142.', '§4 PO1 Loop, pp. 39-42'],
    ['PID*F****Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80, DIN 933, Full Thread~', 'Product/Item Description (PID) — Free-form or structured product description for the preceding PO1 line. PID01: Item description type (F=Free-form, S=Structured/Coded). PID02-04: Unused in free-form mode. PID05: Free-form description text (up to 80 characters). In this example: Detailed bolt specification including material, size, grade, and standard.', '§4 PID Segment, pp. 42-43'],
    ['TXI*ST*143.50****8.25~', 'Tax Information (TXI) — Tax details at the line item level. TXI01: Tax type code (ST=State Sales Tax, FD=Federal Tax, CT=City Tax, VA=Value Added Tax, TX=All Taxes Combined). TXI02: Monetary amount (tax amount for this line). TXI06: Tax percentage. In this example: $143.50 state sales tax at 8.25% rate on line 1 (500 × $3.50 = $1,750.00 × 8.25% ≈ $143.50).', '§4 TXI Segment, pp. 43-44'],
    ['SCH*500*EA***002*20260510~', 'Line Item Schedule (SCH) — Delivery schedule for the line item, allowing split deliveries across multiple dates. SCH01: Quantity. SCH02: Unit of measure. SCH05: Date/time qualifier (002=Delivery Requested, 010=Requested Ship). SCH06: Date (CCYYMMDD). Multiple SCH segments per PO1 line enable split shipments. In this example: Deliver all 500 each by May 10, 2026.', '§4 SCH Segment, pp. 44-45'],
    ['PO1*2*200*EA*1.25*PE*VP*NUT-SS316-M10-HEX*BP*ACM-FST-00143~', 'Purchase Order Line Item (PO1) — Line 2. In this example: 200 hex nuts at $1.25 each, vendor part NUT-SS316-M10-HEX.', '§4 PO1 Loop, pp. 39-42'],
    ['PID*F****Stainless Steel 316 Hex Nut M10, Grade A4-80, DIN 934~', 'Product/Item Description (PID) — Line 2 description. In this example: M10 hex nut specification.', '§4 PID Segment, pp. 42-43'],
    ['TXI*ST*20.63****8.25~', 'Tax Information (TXI) — Line 2 tax. In this example: $20.63 state tax on $250.00 line total.', '§4 TXI Segment, pp. 43-44'],
    ['SCH*200*EA***002*20260510~', 'Line Item Schedule (SCH) — Line 2 delivery. In this example: 200 each by May 10.', '§4 SCH Segment, pp. 44-45'],
    ['PO1*3*100*EA*0.75*PE*VP*WSHR-SS316-M10-FLAT*BP*ACM-FST-00144~', 'Purchase Order Line Item (PO1) — Line 3. In this example: 100 flat washers at $0.75 each.', '§4 PO1 Loop, pp. 39-42'],
    ['PID*F****Stainless Steel 316 Flat Washer M10, DIN 125A, OD 20mm~', 'Product/Item Description (PID) — Line 3 description.', '§4 PID Segment, pp. 42-43'],
    ['SCH*100*EA***002*20260510~', 'Line Item Schedule (SCH) — Line 3 delivery by May 10.', '§4 SCH Segment, pp. 44-45'],
    ['PO1*4*50*EA*28.00*PE*VP*GSKT-VITON-DN50-PN16*BP*ACM-GSK-00287~', 'Purchase Order Line Item (PO1) — Line 4. In this example: 50 Viton gaskets at $28.00 each.', '§4 PO1 Loop, pp. 39-42'],
    ['PID*F****Viton Gasket DN50 PN16, Full Face, 3mm Thick, Flanged~', 'Product/Item Description (PID) — Line 4 description.', '§4 PID Segment, pp. 42-43'],
    ['TXI*ST*115.50****8.25~', 'Tax Information (TXI) — Line 4 tax. In this example: $115.50 state tax on $1,400.00 line total.', '§4 TXI Segment, pp. 43-44'],
    ['SCH*50*EA***002*20260512~', 'Line Item Schedule (SCH) — Line 4 delivery. In this example: 50 each by May 12 (2 days later than other lines).', '§4 SCH Segment, pp. 44-45'],
    ['PO1*5*1000*EA*12.50*PE*VP*SEAL-ORING-BUNA-214*BP*ACM-SEL-00512~', 'Purchase Order Line Item (PO1) — Line 5. In this example: 1000 O-rings at $12.50 each.', '§4 PO1 Loop, pp. 39-42'],
    ['PID*F****Buna-N O-Ring, AS568-214, ID 1", CS 3/32", 70 Durometer~', 'Product/Item Description (PID) — Line 5 description with standard size reference.', '§4 PID Segment, pp. 42-43'],
    ['SCH*1000*EA***002*20260508~', 'Line Item Schedule (SCH) — Line 5 delivery. In this example: 1000 each by May 8 (earliest delivery — priority item).', '§4 SCH Segment, pp. 44-45'],
    ['NTE*GEN*Urgent order - needed for Q2 production run. Please confirm delivery by May 10, 2026. Ref: Project ATLAS-2026.~', 'Note/Special Instruction (NTE) — Free-form text notes attached to the PO. NTE01: Note reference code (GEN=Entire Transaction/General Note, LIN=Line Item Note, SPH=Special Handling, ORI=Order Instructions). NTE02: Free-form message text (up to 264 characters). In this example: General urgency note referencing production timeline and project code.', '§2 NTE Segment, p. 34'],
    ['CTT*5~', 'Transaction Totals (CTT) — Summary count for validation. CTT01: Number of line items (count of PO1 segments in this transaction set). CTT02: Hash total (optional — sum of PO1 quantities for cross-check). In this example: 5 PO1 line items in this purchase order.', '§5 Summary, pp. 46-47'],
    ['AMT*TT*18750.00~', 'Monetary Amount (AMT) — Total monetary value. AMT01: Amount qualifier code (TT=Total Transaction Amount). AMT02: Monetary amount (decimal dollars, NOT cents — unlike TDS in 810). In this example: Total PO value is $18,750.00 (sum: 1750 + 250 + 75 + 1400 + 12500 + taxes/charges).', '§5 AMT Segment, p. 47'],
    ['SE*38*0001~', 'Transaction Set Trailer (SE) — Marks the end of the transaction set. SE01: Number of included segments (count every segment from ST to SE inclusive). SE02: Transaction set control number (must exactly match ST02). In this example: 38 total segments, control number 0001.', '§5 Trailer, p. 48'],
    ['GE*1*1~', 'Functional Group Trailer (GE) — Marks the end of the functional group. GE01: Number of transaction sets included in this group. GE02: Group control number (must exactly match GS06). In this example: 1 transaction set in group #1.', '§5 Group Trailer, p. 48'],
    ['IEA*1*000000001~', 'Interchange Control Trailer (IEA) — Marks the end of the interchange envelope. IEA01: Number of included functional groups. IEA02: Interchange control number (9-digit, must exactly match ISA13). In this example: 1 functional group, interchange #000000001.', '§5 Interchange Trailer, p. 49']
  ],

  /* ===== Order Confirmation — EDI 855 ===== */
  oc: [
    ['ISA*00*          *00*          *ZZ*GLOBALPARTS    *ZZ*ACMECORP       *260428*0815*U*00401*000000002*0*P*>~', 'Interchange Control Header (ISA) — 16 fixed-width elements defining the EDI envelope. ISA01-02: Authorization qualifier/info (00=no auth). ISA03-04: Security qualifier/info (00=none). ISA05-06: Sender ID qualifier (ZZ=mutually defined) and 15-char padded sender ID. ISA07-08: Receiver ID qualifier and padded receiver ID. ISA09: Interchange date (YYMMDD). ISA10: Time (HHMM). ISA11: Repetition separator (U). ISA12: Version (00401). ISA13: 9-digit control number (must match IEA02). ISA14: Ack requested (0=No). ISA15: Usage (P=Production, T=Test). ISA16: Component separator (>). In this example: GlobalParts sends to Acme Corp on April 28, 2026 at 08:15, production mode, interchange #000000002.', '§1 Interchange Envelope, pp. 8-12'],
    ['GS*PR*GLOBALPARTS*ACMECORP*20260428*0815*2*X*004010~', 'Functional Group Header (GS) — Groups transaction sets of the same type. GS01: Functional ID code (PR=Purchase Order Acknowledgment, PO=Purchase Order, SH=Ship Notice, IN=Invoice, RQ=Receiving Advice). GS02: Application sender. GS03: Application receiver. GS04: Date (CCYYMMDD). GS05: Time. GS06: Group control number (must match GE02). GS07: Responsible agency (X=ASC X12). GS08: Version (004010). In this example: PO Acknowledgment group from GLOBALPARTS to ACMECORP, group #2.', '§1 Functional Group, pp. 12-14'],
    ['ST*855*0001~', 'Transaction Set Header (ST) — Marks start of an individual transaction set. ST01: Transaction set identifier (855=Purchase Order Acknowledgment). ST02: Control number (4-9 digits, must match SE02). In this example: PO Acknowledgment transaction set #0001.', '§2 Header, p. 15'],
    ['BAK*06*AC*PO-2026-78543*20260428****GP-SO-2026-41205~', 'Beginning Segment for PO Acknowledgment (BAK) — Defines the acknowledgment identity and purpose. BAK01: Transaction set purpose code (06=Confirm, 00=Original, 01=Cancellation, 04=Change). BAK02: Acknowledgment type (AC=Acknowledge with Detail and Changes, AD=Acknowledge - No Changes, AK=Acknowledge - No Detail, RD=Reject with Detail, RF=Reject Entirely). BAK03: PO number being acknowledged. BAK04: Acknowledgment date (CCYYMMDD). BAK09: Vendor order/sales order number (supplier\'s internal reference). In this example: Confirming PO-2026-78543, acknowledged April 28, supplier sales order GP-SO-2026-41205.', '§2 BAK Segment, pp. 16-18'],
    ['REF*VR*CONF-GP-90421~', 'Reference Identification (REF) — Additional reference numbers. REF01: Reference ID qualifier (VR=Vendor Order Reference, CO=Customer Order, CT=Contract Number, ZZ=Mutually Defined). REF02: Reference value. In this example: Vendor confirmation reference CONF-GP-90421.', '§2 REF Segment, pp. 19-20'],
    ['NTE*GEN*Thank you for your order PO-2026-78543. Lines 1-3 and 5 confirmed for delivery by May 10. Line 4 (Viton Gaskets) is on backorder - expected ship date May 18, 2026.~', 'Note/Special Instruction (NTE) — Free-form text about the overall acknowledgment. NTE01: Note reference code (GEN=Entire Transaction/General Note, LIN=Line Item Note, SPH=Special Handling). NTE02: Free-form message (up to 264 chars). In this example: Summary of acceptance status — 4 lines confirmed, 1 line backordered with expected date.', '§2 NTE Segment, p. 20'],
    ['N1*SF*GlobalParts Inc. - Main Warehouse~', 'Party Identification (N1) — Identifies organizational entities. N101: Entity identifier code (SF=Ship From, ST=Ship To, VN=Vendor, BY=Buying Party, SE=Selling Party). N102: Entity name. N103: ID qualifier (optional). N104: ID code (optional). In this example: Ship-From party is GlobalParts main warehouse.', '§3 N1 Loop, pp. 22-24'],
    ['N3*8900 Logistics Boulevard~', 'Party Address (N3) — Street address for the entity in the preceding N1. N301: Address line 1. N302: Address line 2 (optional). In this example: Warehouse street address.', '§3 N3 Segment, p. 24'],
    ['N4*Chicago*IL*60632*US~', 'Party Geographic Location (N4) — City, state, postal code, country. N401: City. N402: State/province (2-letter). N403: ZIP/postal code. N404: Country code (ISO 3166-1 alpha-2). In this example: Chicago, Illinois 60632, United States.', '§3 N4 Segment, p. 25'],
    ['PER*CN**TE*3125550377*EM*orders@globalparts.com~', 'Administrative Communications Contact (PER) — Contact information. PER01: Contact function code (CN=General Contact, BD=Buyer, DC=Delivery Contact). PER02: Contact name (blank here). PER03-04: Communication qualifier (TE=Telephone) and number. PER05-06: Second qualifier (EM=Email) and address. In this example: General contact with phone 312-555-0377 and email orders@globalparts.com.', '§3 PER Segment, p. 25'],
    ['PO1*1*500*EA*3.50*PE*VP*BOLT-SS316-M10X50*BP*ACM-FST-00142~', 'Purchase Order Line Item (PO1) — Line item detail being acknowledged. PO101: Line number. PO102: Quantity ordered. PO103: Unit of measure (EA=Each, BX=Box, CS=Case, KG=Kilogram). PO104: Unit price. PO105: Basis of unit price (PE=Price per Each). PO106+: Repeating product ID qualifier/value pairs (VP=Vendor Part, BP=Buyer Part, UP=UPC, EN=EAN). In this example: Line 1, 500 each at $3.50, vendor part BOLT-SS316-M10X50, buyer part ACM-FST-00142.', '§4 PO1 Loop, pp. 26-28'],
    ['PID*F****Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80~', 'Product/Item Description (PID) — Free-form or structured description. PID01: Description type (F=Free-form, S=Structured). PID05: Free-form text (up to 80 chars). In this example: Full specification of the hex bolt being confirmed.', '§4 PID Segment, p. 33'],
    ['ACK*IA*500*EA****002*20260509~', 'Line Item Acknowledgment (ACK) — Status of each line item. ACK01: Status code (IA=Item Accepted, IB=Item Backordered, IC=Item Changed, ID=Item Deleted/Cancelled, IP=Accepted - Price Changed, IR=Item Rejected, IS=Item Scheduled Later). ACK02: Quantity acknowledged. ACK03: UOM. ACK07: Date/time qualifier (002=Delivery Requested/Promised). ACK08: Promised date (CCYYMMDD). In this example: Line 1 accepted — all 500 units, delivery promised by May 9, 2026.', '§4 ACK Segment, pp. 29-32'],
    ['NTE*LIN*In stock. Will ship from Chicago warehouse.~', 'Line-Level Note (NTE) — Notes specific to a line item explaining status, stock availability, or backorder reason. NTE01: LIN=Line Item Note. NTE02: Free-form text. In this example: Confirmation that line 1 is in stock and ready to ship.', '§4 NTE Segment (Line), p. 33'],
    ['DTM*011*20260506~', 'Date/Time Reference (DTM) — Date associated with the acknowledgment line. DTM01: Qualifier (011=Shipped/Will Ship, 002=Delivery Requested, 017=Estimated Delivery, 068=Promised for Delivery). DTM02: Date (CCYYMMDD). In this example: Expected ship date May 6, 2026 for line 1.', '§4 DTM Segment, pp. 20-21'],
    ['PO1*2*200*EA*1.25*PE*VP*NUT-SS316-M10-HEX*BP*ACM-FST-00143~', 'Purchase Order Line Item (PO1) — Line 2. In this example: 200 hex nuts at $1.25 each, vendor part NUT-SS316-M10-HEX.', '§4 PO1 Loop, pp. 26-28'],
    ['ACK*IA*200*EA****002*20260509~', 'Line Item Acknowledgment (ACK) — Line 2 accepted. In this example: All 200 units accepted, delivery promised by May 9.', '§4 ACK Segment, pp. 29-32'],
    ['DTM*011*20260506~', 'Date/Time Reference (DTM) — Line 2 ship date. In this example: Expected ship date May 6 for line 2.', '§4 DTM Segment, pp. 20-21'],
    ['PO1*3*100*EA*0.75*PE*VP*WSHR-SS316-M10-FLAT*BP*ACM-FST-00144~', 'Purchase Order Line Item (PO1) — Line 3. In this example: 100 flat washers at $0.75 each.', '§4 PO1 Loop, pp. 26-28'],
    ['ACK*IA*100*EA****002*20260509~', 'Line Item Acknowledgment (ACK) — Line 3 accepted. In this example: All 100 units accepted, delivery by May 9.', '§4 ACK Segment, pp. 29-32'],
    ['DTM*011*20260506~', 'Date/Time Reference (DTM) — Line 3 ship date May 6.', '§4 DTM Segment, pp. 20-21'],
    ['PO1*4*50*EA*28.00*PE*VP*GSKT-VITON-DN50-PN16*BP*ACM-GSK-00287~', 'Purchase Order Line Item (PO1) — Line 4. In this example: 50 Viton gaskets at $28.00 each.', '§4 PO1 Loop, pp. 26-28'],
    ['ACK*IB*50*EA****002*20260520~', 'Line Item Acknowledgment (ACK) — Line 4 BACKORDERED. ACK01: IB=Item Backordered — supplier acknowledges the order but cannot fulfill immediately. ACK08: Revised delivery date. In this example: All 50 gaskets backordered, delivery pushed to May 20, 2026 (10 days later than other lines).', '§4 ACK Segment, pp. 29-32'],
    ['NTE*LIN*Viton gaskets on backorder from manufacturer. Expected restock May 16. Shipment will follow on May 18.~', 'Line-Level Note (NTE) — Backorder explanation. In this example: Supplier explains the Viton gaskets are awaiting manufacturer restock, with specific dates for restock and shipment.', '§4 NTE Segment (Line), p. 33'],
    ['DTM*011*20260518~', 'Date/Time Reference (DTM) — Line 4 revised ship date. In this example: Will ship May 18 after restock on May 16.', '§4 DTM Segment, pp. 20-21'],
    ['PO1*5*1000*EA*12.50*PE*VP*SEAL-ORING-BUNA-214*BP*ACM-SEL-00512~', 'Purchase Order Line Item (PO1) — Line 5. In this example: 1000 O-rings at $12.50 each.', '§4 PO1 Loop, pp. 26-28'],
    ['ACK*IA*1000*EA****002*20260508~', 'Line Item Acknowledgment (ACK) — Line 5 accepted. In this example: All 1000 O-rings accepted, delivery promised by May 8 — earliest of all lines (priority item).', '§4 ACK Segment, pp. 29-32'],
    ['NTE*LIN*Priority item - will ship first on May 5.~', 'Line-Level Note (NTE) — Priority shipping note. In this example: Supplier confirms O-rings will ship ahead of other lines on May 5.', '§4 NTE Segment (Line), p. 33'],
    ['DTM*011*20260505~', 'Date/Time Reference (DTM) — Line 5 ship date. In this example: Ships May 5, 2026 — first item out the door.', '§4 DTM Segment, pp. 20-21'],
    ['CTT*5~', 'Transaction Totals (CTT) — Summary count for validation. CTT01: Number of PO1 line items acknowledged (count of PO1 segments). In this example: 5 line items acknowledged in this 855.', '§5 Summary, pp. 34-35'],
    ['SE*29*0001~', 'Transaction Set Trailer (SE) — SE01: Number of included segments (count every segment from ST to SE inclusive). SE02: Transaction set control number (must match ST02). In this example: 29 total segments, control number 0001.', '§5 Trailer, p. 35'],
    ['GE*1*2~', 'Functional Group Trailer (GE) — GE01: Number of transaction sets in this group. GE02: Group control number (must match GS06). In this example: 1 transaction set in group #2.', '§5 Group Trailer, p. 35'],
    ['IEA*1*000000002~', 'Interchange Control Trailer (IEA) — IEA01: Number of functional groups. IEA02: Interchange control number (must match ISA13). In this example: 1 group, interchange #000000002.', '§5 Interchange Trailer, p. 36']
  ],

  /* ===== Advance Ship Notice — EDI 856 ===== */
  asn: [
    ['ISA*00*          *00*          *ZZ*GLOBALPARTS    *ZZ*ACMECORP       *260506*1422*U*00401*000000003*0*P*>~', 'Interchange Control Header (ISA) — 16 fixed-width elements defining the EDI envelope. ISA05-06: Sender qualifier/ID (ZZ=mutually defined, 15-char padded). ISA07-08: Receiver qualifier/ID. ISA09-10: Date/time. ISA12: Version (00401=ANSI X12 4010). ISA13: 9-digit control number (must match IEA02). ISA15: P=Production, T=Test. In this example: GlobalParts sends ASN to Acme Corp on May 6, 2026 at 14:22, interchange #000000003.', '§1 Interchange Envelope, pp. 8-12'],
    ['GS*SH*GLOBALPARTS*ACMECORP*20260506*1422*3*X*004010~', 'Functional Group Header (GS) — GS01: Functional ID code (SH=Ship Notice/Manifest, PO=Purchase Order, PR=PO Acknowledgment, IN=Invoice). GS06: Group control number (must match GE02). In this example: Ship Notice group from GLOBALPARTS to ACMECORP, group #3.', '§1 Functional Group, pp. 12-14'],
    ['ST*856*0001~', 'Transaction Set Header (ST) — ST01: 856=Ship Notice/Manifest (Advance Ship Notice). ST02: Control number (must match SE02). In this example: ASN transaction set #0001.', '§2 Header, p. 15'],
    ['BSN*00*SHP-GP-2026-07891*20260506*1422*0001~', 'Beginning Segment for Ship Notice (BSN) — BSN01: Purpose code (00=Original, 01=Replace, 02=Add, 03=Delete, 04=No Action). BSN02: Shipment identification number (supplier-assigned). BSN03: Ship date (CCYYMMDD). BSN04: Ship time (HHMM). BSN05: Hierarchical structure code (0001=standard HL structure). In this example: Original shipment SHP-GP-2026-07891, shipped May 6, 2026 at 14:22.', '§2 BSN Segment, pp. 16-18'],
    ['DTM*011*20260506~', 'Date/Time Reference (DTM) — DTM01: Qualifier (011=Shipped, 002=Delivery Requested/Scheduled, 017=Estimated Delivery, 050=Received). DTM02: Date (CCYYMMDD). In this example: Shipped date May 6, 2026.', '§2 DTM Segment, p. 19'],
    ['DTM*002*20260509~', 'Date/Time Reference (DTM) — Second date reference. In this example: Expected delivery date May 9, 2026 (3 days transit from Chicago to Houston).', '§2 DTM Segment, p. 19'],
    ['HL*1**S~', 'Hierarchical Level — Shipment (HL) — The HL loop is the backbone of the 856 structure, defining parent-child relationships. HL01: Unique level ID within the transaction. HL02: Parent ID (blank = top level). HL03: Level code (S=Shipment, O=Order, P=Pack/Tare, I=Item). The hierarchy flows: Shipment → Order → Pack → Item. In this example: Top-level shipment node, HL ID 1, no parent.', '§3 HL Loop, pp. 20-25'],
    ['TD1*CTN*3~', 'Carrier Details — Quantity and Weight (TD1) — TD101: Packaging code (CTN=Carton, PLT=Pallet, DRM=Drum, BAG=Bag, BDL=Bundle). TD102: Lading quantity (number of packages). TD106: Weight qualifier (G=Gross, N=Net). TD107: Weight value. TD108: UOM (LB, KG). In this example: 3 cartons in this shipment.', '§3 TD1 Segment, pp. 25-26'],
    ['TD5*O*2*FXFE*M*FedEx Freight~', 'Carrier Details — Routing (TD5) — TD501: Routing sequence (O=Origin Carrier, B=Both Origin and Delivery). TD502: ID code qualifier (2=SCAC). TD503: Carrier SCAC code (FXFE=FedEx Freight, UPSN=UPS, USPS=Postal, FDEG=FedEx Ground). TD504: Transportation method (M=Motor, A=Air, R=Rail, S=Ocean, X=Intermodal). TD505: Carrier name. In this example: FedEx Freight motor carrier from origin.', '§3 TD5 Segment, pp. 26-28'],
    ['REF*BM*794644790132~', 'Reference Identification (REF) — REF01: Qualifier (BM=Bill of Lading, CN=PRO/Carrier Number, SI=Shipment ID, 2I=Tracking Number, PO=Purchase Order). REF02: Reference value. In this example: Bill of Lading tracking number 794644790132.', '§3 REF Segment, pp. 28-29'],
    ['N1*SF*GlobalParts Inc. - Main Warehouse~', 'Party Identification — Ship From (N1) — N101: SF=Ship From. N102: Ship-from entity name. At shipment HL level, identifies the origin warehouse/facility. In this example: Shipping from GlobalParts main warehouse.', '§3 N1 Loop, pp. 30-32'],
    ['N3*8900 Logistics Boulevard~', 'Party Address (N3) — Ship-from street address. In this example: Warehouse address on Logistics Boulevard.', '§3 N3 Segment, p. 32'],
    ['N4*Chicago*IL*60632*US~', 'Party Geographic Location (N4) — Ship-from city/state/zip/country. In this example: Chicago, IL 60632, US.', '§3 N4 Segment, p. 32'],
    ['PER*CN**TE*3125550377~', 'Administrative Contact (PER) — Shipping contact at origin facility. PER01: CN=General Contact. PER03-04: TE=Telephone and number. In this example: Warehouse contact phone 312-555-0377.', '§3 PER Segment, p. 32'],
    ['N1*ST*Acme Corp - Distribution Center~', 'Party Identification — Ship To (N1) — N101: ST=Ship To. N102: Destination entity name. In this example: Delivering to Acme Corp Distribution Center.', '§3 N1 Loop, pp. 30-32'],
    ['N3*4500 Industrial Parkway*Building 7, Suite 200~', 'Party Address (N3) — Ship-to street address. N301: Address line 1. N302: Address line 2 (building, suite, floor). In this example: Two-line address with building and suite detail.', '§3 N3 Segment, p. 32'],
    ['N4*Houston*TX*77041*US~', 'Party Geographic Location (N4) — Ship-to location. In this example: Houston, TX 77041, US.', '§3 N4 Segment, p. 32'],
    ['NTE*GEN*Shipment contains lines 1, 2, 3, and 5 from PO-2026-78543. Line 4 (Viton Gaskets) will ship separately on May 18. Handle with care - contains precision O-rings.~', 'Note/Special Instruction (NTE) — Shipment-level notes. NTE01: GEN=General Note. NTE02: Free-form text. In this example: Notes about partial shipment (4 of 5 lines), backordered item, and handling instructions.', '§3 NTE Segment, p. 33'],
    ['HL*2*1*O~', 'Hierarchical Level — Order (HL) — HL03: O=Order level. HL02: Parent ID pointing to shipment HL. Groups items by purchase order within the shipment. In this example: Order level, child of shipment HL*1.', '§3 HL Loop (Order), pp. 33-34'],
    ['PRF*PO-2026-78543~', 'Purchase Order Reference (PRF) — PRF01: PO number this shipment fulfills. PRF04: Release number (optional for blanket orders). PRF05: Change order sequence (optional). Appears at Order HL level to link items back to the original PO. In this example: Fulfilling PO-2026-78543.', '§3 PRF Segment, pp. 33-34'],
    ['HL*3*2*P~', 'Hierarchical Level — Pack (HL) — HL03: P=Pack/Tare level. Represents a physical package, carton, or pallet. HL02: Parent = order level. In this example: First carton (CTN-001), child of order HL*2.', '§3 HL Loop (Pack), pp. 34-35'],
    ['MAN*GM*CTN-001~', 'Marks and Numbers (MAN) — MAN01: Qualifier (GM=Shipping Container/Carton Mark, CP=Carrier Assigned Package ID, SM=SSCC-18 Barcode, UC=UCC-128). MAN02: Package mark or barcode value. In this example: Carton marked CTN-001.', '§3 MAN Segment, pp. 34-35'],
    ['HL*4*3*I~', 'Hierarchical Level — Item (HL) — HL03: I=Item level. Contains line item details for what is inside the pack. HL02: Parent = pack HL*3 (CTN-001). In this example: First item inside carton CTN-001.', '§3 HL Loop (Item), pp. 36-37'],
    ['LIN*1*VP*BOLT-SS316-M10X50*BP*ACM-FST-00142~', 'Item Identification (LIN) — LIN01: Line number from original PO. LIN02+: Repeating qualifier/value pairs (VP=Vendor Part, BP=Buyer Part, UP=UPC, EN=EAN, LT=Lot Number). In this example: PO line 1, vendor part BOLT-SS316-M10X50, buyer part ACM-FST-00142.', '§3 LIN Segment, pp. 36-37'],
    ['SN1*1*500*EA~', 'Item Detail — Shipment (SN1) — SN101: Line number. SN102: Quantity shipped. SN103: Unit of measure (EA=Each). SN105: Quantity ordered (optional). In this example: 500 bolts shipped for line 1.', '§3 SN1 Segment, pp. 37-38'],
    ['PID*F****Stainless Steel 316 Hex Bolt M10x50mm~', 'Product/Item Description (PID) — PID01: F=Free-form. PID05: Description text. In this example: Hex bolt description.', '§3 PID Segment, p. 39'],
    ['LIN**LT*LOT-B2026-0506A~', 'Item Identification — Lot (LIN) — Additional LIN for lot/batch tracking. LIN02: LT=Lot Number. LIN03: Lot value. In this example: Lot number LOT-B2026-0506A for the bolts.', '§3 LIN Segment (Lot), pp. 36-37'],
    ['REF*BT*GP-BATCH-SS316-4421~', 'Item-Level Reference (REF) — REF01: BT=Batch Number. Tracks manufacturer batch for quality traceability. In this example: Batch GP-BATCH-SS316-4421 for stainless steel items.', '§3 REF Segment (Item), p. 39'],
    ['HL*5*3*I~', 'Hierarchical Level — Item (HL) — Second item in carton CTN-001. In this example: PO line 2 (hex nuts), also packed in CTN-001.', '§3 HL Loop (Item), pp. 36-37'],
    ['LIN*2*VP*NUT-SS316-M10-HEX*BP*ACM-FST-00143~', 'Item Identification (LIN) — Line 2. In this example: Vendor part NUT-SS316-M10-HEX, buyer part ACM-FST-00143.', '§3 LIN Segment, pp. 36-37'],
    ['SN1*2*200*EA~', 'Item Detail — Shipment (SN1) — Line 2. In this example: 200 hex nuts shipped.', '§3 SN1 Segment, pp. 37-38'],
    ['PID*F****Stainless Steel 316 Hex Nut M10~', 'Product/Item Description (PID) — Line 2 description.', '§3 PID Segment, p. 39'],
    ['HL*6*2*P~', 'Hierarchical Level — Pack (HL) — Second carton. HL02: Parent = order HL*2. In this example: Carton CTN-002, second physical package.', '§3 HL Loop (Pack), pp. 34-35'],
    ['MAN*GM*CTN-002~', 'Marks and Numbers (MAN) — In this example: Second carton marked CTN-002.', '§3 MAN Segment, pp. 34-35'],
    ['HL*7*6*I~', 'Hierarchical Level — Item (HL) — Item inside CTN-002. In this example: Flat washers (line 3) packed in carton CTN-002.', '§3 HL Loop (Item), pp. 36-37'],
    ['LIN*3*VP*WSHR-SS316-M10-FLAT*BP*ACM-FST-00144~', 'Item Identification (LIN) — Line 3. In this example: Vendor part WSHR-SS316-M10-FLAT.', '§3 LIN Segment, pp. 36-37'],
    ['SN1*3*100*EA~', 'Item Detail — Shipment (SN1) — Line 3. In this example: 100 flat washers shipped.', '§3 SN1 Segment, pp. 37-38'],
    ['PID*F****Stainless Steel 316 Flat Washer M10~', 'Product/Item Description (PID) — Line 3 description.', '§3 PID Segment, p. 39'],
    ['HL*8*2*P~', 'Hierarchical Level — Pack (HL) — Third carton. In this example: Carton CTN-003, dedicated to the precision O-rings.', '§3 HL Loop (Pack), pp. 34-35'],
    ['MAN*GM*CTN-003~', 'Marks and Numbers (MAN) — In this example: Third carton marked CTN-003.', '§3 MAN Segment, pp. 34-35'],
    ['HL*9*8*I~', 'Hierarchical Level — Item (HL) — Item inside CTN-003. In this example: O-rings (line 5) in carton CTN-003.', '§3 HL Loop (Item), pp. 36-37'],
    ['LIN*5*VP*SEAL-ORING-BUNA-214*BP*ACM-SEL-00512~', 'Item Identification (LIN) — Line 5. Note: Line 4 (gaskets) is backordered and not in this shipment. In this example: Vendor part SEAL-ORING-BUNA-214.', '§3 LIN Segment, pp. 36-37'],
    ['SN1*5*1000*EA~', 'Item Detail — Shipment (SN1) — Line 5. In this example: 1000 O-rings shipped.', '§3 SN1 Segment, pp. 37-38'],
    ['PID*F****Buna-N O-Ring, AS568-214~', 'Product/Item Description (PID) — Line 5 description with standard reference.', '§3 PID Segment, p. 39'],
    ['REF*BT*GP-BATCH-BUNA-7803~', 'Item-Level Reference (REF) — Batch tracking for O-rings. In this example: Batch GP-BATCH-BUNA-7803.', '§3 REF Segment (Item), p. 39'],
    ['CTT*9~', 'Transaction Totals (CTT) — CTT01: Total number of HL segments in the transaction set. In this example: 9 HL levels (1 shipment + 1 order + 3 packs + 4 items).', '§4 Summary, p. 40'],
    ['SE*45*0001~', 'Transaction Set Trailer (SE) — SE01: Total segment count (ST to SE inclusive). SE02: Control number (must match ST02). In this example: 45 segments, control #0001.', '§4 Trailer, p. 40'],
    ['GE*1*3~', 'Functional Group Trailer (GE) — GE01: Transaction set count. GE02: Group control number (must match GS06). In this example: 1 transaction set in group #3.', '§4 Group Trailer, p. 41'],
    ['IEA*1*000000003~', 'Interchange Control Trailer (IEA) — IEA01: Functional group count. IEA02: Interchange control number (must match ISA13). In this example: 1 group, interchange #000000003.', '§4 Interchange Trailer, p. 41']
  ],

  /* ===== Goods Receipt — EDI 861 ===== */
  gr: [
    ['ISA*00*          *00*          *ZZ*ACMECORP       *ZZ*GLOBALPARTS    *260509*1645*U*00401*000000004*0*P*>~', 'Interchange Control Header (ISA) — Buyer sends receiving advice to supplier (direction reversed vs. 850/855/856). ISA05-06: Sender = ACMECORP (buyer). ISA07-08: Receiver = GLOBALPARTS (supplier). ISA13: 9-digit control number (must match IEA02). In this example: Acme Corp notifies GlobalParts of goods receipt on May 9, 2026 at 16:45, interchange #000000004.', '§1 Interchange Envelope, pp. 8-12'],
    ['GS*RQ*ACMECORP*GLOBALPARTS*20260509*1645*4*X*004010~', 'Functional Group Header (GS) — GS01: Functional ID code (RQ=Receiving Advice/Acceptance Certificate; also RA in some implementations). GS06: Group control number (must match GE02). In this example: Receiving Advice group from ACMECORP to GLOBALPARTS, group #4.', '§1 Functional Group, pp. 12-14'],
    ['ST*861*0001~', 'Transaction Set Header (ST) — ST01: 861=Receiving Advice/Acceptance Certificate (Goods Receipt). ST02: Control number (must match SE02). In this example: GR transaction set #0001.', '§2 Header, p. 15'],
    ['BRA*00*GR-2026-05421*20260509*A~', 'Beginning Segment for Receiving Advice (BRA) — BRA01: Transaction set purpose code (00=Original, 02=Add, 04=Delete). BRA02: Receiving advice number (buyer-assigned). BRA03: Receipt date (CCYYMMDD). BRA04: Transaction type code (A=No Action/Informational, 01=Complete Receipt, 07=Partial Receipt). In this example: Original goods receipt GR-2026-05421, dated May 9, 2026, informational receipt notice.', '§2 BRA Segment, pp. 16-18'],
    ['REF*SI*SHP-GP-2026-07891~', 'Reference Identification (REF) — Links receipt to the original ASN shipment. REF01: SI=Shipment Identification. REF02: Shipment number from BSN02 of the 856 ASN. In this example: References ASN shipment SHP-GP-2026-07891.', '§2 REF Segment, pp. 19-20'],
    ['REF*PO*PO-2026-78543~', 'Reference Identification (REF) — Links receipt to the original purchase order. REF01: PO=Purchase Order Number. REF02: PO number from BEG03 of the 850. In this example: Against PO-2026-78543.', '§2 REF Segment, pp. 19-20'],
    ['DTM*050*20260509*1645~', 'Date/Time Reference (DTM) — DTM01: Qualifier (050=Received, 011=Shipped, 002=Delivery Requested). DTM02: Date (CCYYMMDD). DTM03: Time (HHMM, optional). In this example: Goods received May 9, 2026 at 16:45.', '§2 DTM Segment, pp. 20-21'],
    ['N1*ST*Acme Corp - Distribution Center*92*ADDR-ST-001~', 'Party Identification (N1) — Receiving location. N101: ST=Ship-To/Receiving Location. N102: Name. N103: ID qualifier (92=Assigned by Buyer). N104: Location code. In this example: Received at Acme Corp Distribution Center, address ID ADDR-ST-001.', '§3 N1 Loop, pp. 22-24'],
    ['N3*4500 Industrial Parkway~', 'Party Address (N3) — Receiving dock street address. In this example: Distribution center address.', '§3 N3 Segment, p. 24'],
    ['N4*Houston*TX*77041*US~', 'Party Geographic Location (N4) — Receiving location. In this example: Houston, TX 77041, US.', '§3 N4 Segment, p. 25'],
    ['PER*GR*Robert Chen*EM*r.chen@acme.com~', 'Administrative Contact (PER) — Person who inspected/received goods. PER01: GR=Goods Receipt Contact. PER02: Contact name. PER05-06: EM=Email. In this example: Robert Chen performed the inspection, email r.chen@acme.com.', '§3 PER Segment, p. 25'],
    ['NTE*GEN*Received shipment SHP-GP-2026-07891 at Dock B. All items inspected. Line 5 (O-Rings) - 3 units found damaged, receiving 997 of 1000. Damage claim to follow.~', 'Note/Special Instruction (NTE) — General receipt notes including inspection results and damage. NTE01: GEN=General Note. NTE02: Free-form text. In this example: Overall receipt summary — all items inspected, 3 O-rings damaged, damage claim pending.', '§3 NTE Segment, p. 25'],
    ['REF*ZZ*Dock B~', 'Receiving Location Reference (REF) — REF01: ZZ=Mutually Defined (used for dock/bay/door identification). REF02: Dock location where goods were unloaded. In this example: Received at Dock B.', '§3 REF Segment (Location), p. 26'],
    ['RCD*1*500**EA*500*EA~', 'Receiving Conditions (RCD) — Reports condition and quantities for each received item. RCD01: Receiving condition code (1=Accepted/Good Condition, 2=Damaged, 3=Rejected/Returned, 5=Short Shipment, 7=Over Shipment). RCD02: Quantity for this condition. RCD04: UOM. RCD05: Total quantity received. RCD06: UOM. RCD07: Quantity damaged (optional). RCD08: Damaged UOM (optional). In this example: Line 1 — 500 bolts received, all 500 in good condition.', '§4 RCD Loop, pp. 26-29'],
    ['LIN*1*VP*BOLT-SS316-M10X50*BP*ACM-FST-00142~', 'Item Identification (LIN) — Product IDs for the received item. Same qualifier/value pairs as PO1/IT1. In this example: PO line 1, vendor part BOLT-SS316-M10X50.', '§4 LIN Segment, pp. 29-30'],
    ['SN1*1*500*EA~', 'Item Detail (SN1) — SN101: Line number. SN102: Quantity received. SN103: UOM. Confirms actual quantity at receiving dock. In this example: 500 bolts received.', '§4 SN1 Segment, p. 30'],
    ['PID*F****SS316 Hex Bolt M10x50~', 'Product/Item Description (PID) — In this example: Abbreviated bolt description.', '§4 PID Segment, p. 31'],
    ['REF*BT*GP-BATCH-SS316-4421~', 'Line-Level Reference (REF) — Batch tracking. REF01: BT=Batch Number. Matches batch from the 856 ASN for traceability. In this example: Batch GP-BATCH-SS316-4421 received and verified.', '§4 REF Segment (Line), pp. 31-32'],
    ['RCD*1*200**EA*200*EA~', 'Receiving Conditions (RCD) — Line 2. In this example: 200 hex nuts received, all in good condition.', '§4 RCD Loop, pp. 26-29'],
    ['LIN*2*VP*NUT-SS316-M10-HEX*BP*ACM-FST-00143~', 'Item Identification (LIN) — Line 2. In this example: Vendor part NUT-SS316-M10-HEX.', '§4 LIN Segment, pp. 29-30'],
    ['SN1*2*200*EA~', 'Item Detail (SN1) — Line 2. In this example: 200 nuts received.', '§4 SN1 Segment, p. 30'],
    ['PID*F****SS316 Hex Nut M10~', 'Product/Item Description (PID) — Line 2 description.', '§4 PID Segment, p. 31'],
    ['RCD*1*100**EA*100*EA~', 'Receiving Conditions (RCD) — Line 3. In this example: 100 flat washers, all accepted.', '§4 RCD Loop, pp. 26-29'],
    ['LIN*3*VP*WSHR-SS316-M10-FLAT*BP*ACM-FST-00144~', 'Item Identification (LIN) — Line 3.', '§4 LIN Segment, pp. 29-30'],
    ['SN1*3*100*EA~', 'Item Detail (SN1) — Line 3. In this example: 100 washers received.', '§4 SN1 Segment, p. 30'],
    ['PID*F****SS316 Flat Washer M10~', 'Product/Item Description (PID) — Line 3 description.', '§4 PID Segment, p. 31'],
    ['RCD*1*997**EA*997*EA*3*EA~', 'Receiving Conditions (RCD) — Line 5 (O-rings) with DAMAGE. RCD02: 997 accepted. RCD05: 997 total received in good condition. RCD07: 3 units damaged. RCD08: EA. When RCD07/08 are present, they indicate the damaged quantity. In this example: 997 of 1000 O-rings accepted; 3 units damaged in transit.', '§4 RCD Loop, pp. 26-29'],
    ['LIN*5*VP*SEAL-ORING-BUNA-214*BP*ACM-SEL-00512~', 'Item Identification (LIN) — Line 5. In this example: Vendor part SEAL-ORING-BUNA-214.', '§4 LIN Segment, pp. 29-30'],
    ['SN1*5*997*EA~', 'Item Detail (SN1) — Line 5 with adjusted quantity. SN102 shows 997 (not 1000) because 3 were damaged. In this example: 997 O-rings received in acceptable condition.', '§4 SN1 Segment, p. 30'],
    ['PID*F****Buna-N O-Ring AS568-214~', 'Product/Item Description (PID) — Line 5 description.', '§4 PID Segment, p. 31'],
    ['REF*BT*GP-BATCH-BUNA-7803~', 'Line-Level Reference (REF) — Batch for O-rings. In this example: Batch GP-BATCH-BUNA-7803.', '§4 REF Segment (Line), pp. 31-32'],
    ['NTE*LIN*997 of 1000 received in good condition. 3 units damaged in transit - crushed packaging on one bag. Damage photos on file (DMG-2026-0509-001).~', 'Line-Level Note (NTE) — Detailed damage/inspection notes for the specific line item. NTE01: LIN=Line Item Note. In this example: Documents the damage — 3 units crushed, photos recorded with reference number DMG-2026-0509-001 for the claim.', '§4 NTE Segment (Line), p. 32'],
    ['CTT*4~', 'Transaction Totals (CTT) — CTT01: Number of RCD loops (received line items). In this example: 4 line items received (lines 1, 2, 3, 5 — line 4 gaskets were backordered and not in this shipment).', '§5 Summary, p. 33'],
    ['SE*32*0001~', 'Transaction Set Trailer (SE) — SE01: Segment count (ST to SE inclusive). SE02: Control number (must match ST02). In this example: 32 segments, control #0001.', '§5 Trailer, p. 34'],
    ['GE*1*4~', 'Functional Group Trailer (GE) — GE01: Transaction set count. GE02: Group control number (must match GS06). In this example: 1 transaction set in group #4.', '§5 Group Trailer, p. 34'],
    ['IEA*1*000000004~', 'Interchange Control Trailer (IEA) — IEA01: Functional group count. IEA02: Interchange control number (must match ISA13). In this example: 1 group, interchange #000000004.', '§5 Interchange Trailer, p. 35']
  ],

  /* ===== Invoice — EDI 810 ===== */
  inv: [
    ['ISA*00*          *00*          *ZZ*GLOBALPARTS    *ZZ*ACMECORP       *260515*0930*U*00401*000000005*0*P*>~', 'Interchange Control Header (ISA) — Supplier sends invoice to buyer. ISA05-06: Sender = GLOBALPARTS. ISA07-08: Receiver = ACMECORP. ISA13: 9-digit control number (must match IEA02). ISA15: P=Production. In this example: GlobalParts invoices Acme Corp on May 15, 2026 at 09:30, interchange #000000005.', '§1 Interchange Envelope, pp. 8-12'],
    ['GS*IN*GLOBALPARTS*ACMECORP*20260515*0930*5*X*004010~', 'Functional Group Header (GS) — GS01: Functional ID code (IN=Invoice). GS06: Group control number (must match GE02). In this example: Invoice group from GLOBALPARTS to ACMECORP, group #5.', '§1 Functional Group, pp. 12-14'],
    ['ST*810*0001~', 'Transaction Set Header (ST) — ST01: 810=Invoice. ST02: Control number (must match SE02). In this example: Invoice transaction set #0001.', '§2 Header, p. 15'],
    ['BIG*20260515*INV-GP-2026-18734*20260427*PO-2026-78543~', 'Beginning Segment for Invoice (BIG) — BIG01: Invoice date (CCYYMMDD). BIG02: Invoice number (supplier-assigned). BIG03: PO date from the original 850. BIG04: PO number being invoiced. BIG07: Transaction type (optional: DI=Debit Invoice, CR=Credit Memo). In this example: Invoice INV-GP-2026-18734 dated May 15, against PO-2026-78543 dated April 27.', '§2 BIG Segment, pp. 16-19'],
    ['REF*VR*GP-SO-2026-41205~', 'Reference Identification (REF) — REF01: VR=Vendor Order/Sales Order Reference. Links invoice to supplier\'s internal sales order. In this example: Supplier sales order GP-SO-2026-41205.', '§2 REF Segment, pp. 19-21'],
    ['REF*SI*SHP-GP-2026-07891~', 'Reference Identification (REF) — REF01: SI=Shipment Identification. Links invoice to the ASN/shipment. In this example: For shipment SHP-GP-2026-07891.', '§2 REF Segment, pp. 19-21'],
    ['REF*TI*36-7891234~', 'Reference Identification (REF) — REF01: TI=Tax Identification Number (EIN/VAT). Used for tax reporting and compliance. In this example: Supplier Tax ID 36-7891234.', '§2 REF Segment, pp. 19-21'],
    ['NTE*GEN*Invoice for shipment SHP-GP-2026-07891 against PO-2026-78543. Partial invoice - excludes Line 4 (Viton Gaskets, backordered). Terms: 2/10 Net 30.~', 'Note/Special Instruction (NTE) — General invoice notes explaining scope and payment terms. NTE01: GEN=General Note. In this example: Partial invoice (4 of 5 PO lines), backordered item excluded, payment terms stated.', '§2 NTE Segment, p. 21'],
    ['N1*RI*GlobalParts Inc.*92*36-7891234~', 'Party Identification — Remit-To (N1) — N101: RI=Remit-To (pay to this entity). N102: Name. N103: ID qualifier (92=Assigned by Buyer/Seller, 1=DUNS). N104: Tax ID / identification code. In this example: Pay to GlobalParts Inc., Tax ID 36-7891234.', '§3 N1 Loop, pp. 22-24'],
    ['N3*8900 Logistics Boulevard~', 'Party Address (N3) — Remit-to street address. In this example: GlobalParts billing address.', '§3 N3 Segment, p. 25'],
    ['N4*Chicago*IL*60632*US~', 'Party Geographic Location (N4) — Remit-to location. In this example: Chicago, IL 60632, US.', '§3 N4 Segment, p. 26'],
    ['PER*CN**TE*3125550388*EM*billing@globalparts.com~', 'Administrative Contact (PER) — Billing/accounts receivable contact. PER01: CN=General Contact. In this example: Billing contact phone 312-555-0388, email billing@globalparts.com.', '§3 PER Segment, p. 26'],
    ['N1*BT*Acme Corp - Accounts Payable~', 'Party Identification — Bill-To (N1) — N101: BT=Bill-To. N102: Buyer\'s accounts payable department. In this example: Bill-To is Acme Corp AP department.', '§3 N1 Loop, pp. 22-24'],
    ['N3*1200 Commerce Drive~', 'Party Address (N3) — Bill-to street address. In this example: AP billing address.', '§3 N3 Segment, p. 25'],
    ['N4*Dallas*TX*75201*US~', 'Party Geographic Location (N4) — Bill-to location. In this example: Dallas, TX 75201.', '§3 N4 Segment, p. 26'],
    ['ITD*01*3*2**30****2/10 Net 30~', 'Terms of Sale (ITD) — ITD01: Terms type (01=Basic, 02=End of Month, 05=Discount Not Applicable). ITD02: Terms basis date code (3=Invoice Date, 1=Ship Date). ITD03: Discount percent. ITD05: Discount due days. ITD07: Net due days. ITD12: Description. In this example: 2% discount if paid within 10 days, net due in 30 days from invoice date.', '§2 ITD Segment, pp. 26-27'],
    ['IT1*1*500*EA*3.50*PE*VP*BOLT-SS316-M10X50*BP*ACM-FST-00142~', 'Invoice Line Item (IT1) — IT101: Line number. IT102: Quantity invoiced. IT103: UOM (EA=Each). IT104: Unit price. IT105: Basis (PE=Price per Each, PP=Per Pound). IT106+: Repeating qualifier/value pairs (VP=Vendor Part, BP=Buyer Part, UP=UPC, EN=EAN). In this example: Line 1, 500 bolts at $3.50 each = $1,750.00 line total.', '§4 IT1 Loop, pp. 29-32'],
    ['PID*F****Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80, DIN 933~', 'Product/Item Description (PID) — PID01: F=Free-form. PID05: Description text. In this example: Full bolt specification.', '§4 PID Segment, pp. 32-33'],
    ['TXI*ST*144.38****8.25~', 'Tax Information — Line Level (TXI) — TXI01: Tax type code (ST=State Sales Tax, FD=Federal, CT=City, VA=Value Added Tax, TX=All Taxes). TXI02: Tax amount for this line. TXI06: Tax percentage. In this example: $144.38 state tax at 8.25% on $1,750.00.', '§4 TXI Segment, pp. 36-37'],
    ['IT1*2*200*EA*1.25*PE*VP*NUT-SS316-M10-HEX*BP*ACM-FST-00143~', 'Invoice Line Item (IT1) — Line 2. In this example: 200 hex nuts at $1.25 = $250.00.', '§4 IT1 Loop, pp. 29-32'],
    ['PID*F****Stainless Steel 316 Hex Nut M10, Grade A4-80, DIN 934~', 'Product/Item Description (PID) — Line 2 description.', '§4 PID Segment, pp. 32-33'],
    ['TXI*ST*20.63****8.25~', 'Tax Information (TXI) — Line 2 tax. In this example: $20.63 state tax on $250.00.', '§4 TXI Segment, pp. 36-37'],
    ['IT1*3*100*EA*0.75*PE*VP*WSHR-SS316-M10-FLAT*BP*ACM-FST-00144~', 'Invoice Line Item (IT1) — Line 3. In this example: 100 flat washers at $0.75 = $75.00.', '§4 IT1 Loop, pp. 29-32'],
    ['PID*F****Stainless Steel 316 Flat Washer M10, DIN 125A~', 'Product/Item Description (PID) — Line 3 description.', '§4 PID Segment, pp. 32-33'],
    ['TXI*ST*6.19****8.25~', 'Tax Information (TXI) — Line 3 tax. In this example: $6.19 state tax on $75.00.', '§4 TXI Segment, pp. 36-37'],
    ['IT1*4*997*EA*12.50*PE*VP*SEAL-ORING-BUNA-214*BP*ACM-SEL-00512~', 'Invoice Line Item (IT1) — Line 4 (mapped from PO line 5). IMPORTANT: Quantity is 997 not 1000 — adjusted per goods receipt GR-2026-05421 where 3 units were damaged. In this example: 997 O-rings at $12.50 = $12,462.50.', '§4 IT1 Loop, pp. 29-32'],
    ['PID*F****Buna-N O-Ring, AS568-214, ID 1", CS 3/32"~', 'Product/Item Description (PID) — Line 4 description with standard dimensions.', '§4 PID Segment, pp. 32-33'],
    ['TXI*ST*1028.16****8.25~', 'Tax Information (TXI) — Line 4 tax. In this example: $1,028.16 state tax on $12,462.50.', '§4 TXI Segment, pp. 36-37'],
    ['NTE*LIN*Invoicing 997 of 1000 ordered per GR-2026-05421. 3 units damaged in transit - not invoiced.~', 'Line-Level Note (NTE) — Explains quantity adjustment. NTE01: LIN=Line Item Note. In this example: 3 damaged O-rings excluded from invoice, referencing the goods receipt number.', '§4 NTE Segment (Line), p. 33'],
    ['TDS*1602186~', 'Total Monetary Value Summary (TDS) — TDS01: Total invoice amount in CENTS (not dollars). IMPORTANT: Divide by 100 to get dollar amount. TDS02: Amount subject to terms discount (optional). TDS03: Discounted amount due (optional). In this example: $16,021.86 total (1602186 cents). Breakdown: $1,750 + $250 + $75 + $12,462.50 = $14,537.50 subtotal + $1,199.36 tax + $285.00 freight = $16,021.86.', '§5 TDS Segment, pp. 38-39'],
    ['CAD*M*FXFE~', 'Carrier Details (CAD) — CAD01: Transportation method (M=Motor, A=Air, R=Rail, S=Ocean). CAD02: SCAC code identifying the freight carrier. Used for freight charge reconciliation. In this example: FedEx Freight (FXFE), motor carrier.', '§5 CAD Segment, p. 40'],
    ['SAC*C*D240***28500~', 'Service/Allowance/Charge — Summary (SAC) — SAC01: Indicator (C=Charge, A=Allowance). SAC02: Service code (D240=Freight, H750=Handling, C310=Discount, F900=Fuel Surcharge). SAC05: Amount in CENTS. In this example: $285.00 freight charge (28500 cents).', '§5 SAC Segment, pp. 34-36'],
    ['TXI*TX*1199.36****8.25~', 'Summary Tax Information (TXI) — Total tax at invoice level. TXI01: TX=All Taxes Combined. TXI02: Total tax amount (sum of all line-level taxes). TXI06: Tax rate. In this example: $1,199.36 total tax at 8.25% ($144.38 + $20.63 + $6.19 + $1,028.16 = $1,199.36).', '§5 TXI Segment (Summary), p. 39'],
    ['CTT*4~', 'Transaction Totals (CTT) — CTT01: Number of IT1 line items. CTT02: Hash total (optional). In this example: 4 invoice line items (PO lines 1-3 and 5; line 4 gaskets excluded — still backordered).', '§5 Summary, p. 41'],
    ['SE*33*0001~', 'Transaction Set Trailer (SE) — SE01: Segment count (ST to SE inclusive). SE02: Control number (must match ST02). In this example: 33 segments, control #0001.', '§5 Trailer, p. 42'],
    ['GE*1*5~', 'Functional Group Trailer (GE) — GE01: Transaction set count. GE02: Group control number (must match GS06). In this example: 1 transaction set in group #5.', '§5 Group Trailer, p. 42'],
    ['IEA*1*000000005~', 'Interchange Control Trailer (IEA) — IEA01: Functional group count. IEA02: Interchange control number (must match ISA13). In this example: 1 group, interchange #000000005.', '§5 Interchange Trailer, p. 43']
  ]
};

var DOC_LABELS = {
  po: 'Purchase Order (850)',
  poc: 'Purchase Order Change (860)',
  oc: 'Order Confirmation (855)',
  asn: 'Advance Ship Notice (856)',
  gr: 'Goods Receipt (861)',
  inv: 'Invoice (810)'
};

/* Wire file upload slots */
function initCxmlUpload() {
  var docTypes = ['po', 'poc', 'oc', 'asn', 'gr', 'inv'];
  docTypes.forEach(function(docType) {
    var fileInput = document.getElementById('file-' + docType);
    var dropZone = document.querySelector('#slot-' + docType + ' .cxml-upload-drop');
    if (!fileInput || !dropZone) return;

    /* Click to upload */
    dropZone.addEventListener('click', function() { fileInput.click(); });

    /* File selected */
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        handleFileSelected(docType, fileInput.files[0]);
      }
    });

    /* Drag & drop */
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', function(e) {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelected(docType, e.dataTransfer.files[0]);
      }
    });
  });

  /* Convert button */
  var convertBtn = document.getElementById('cxml-convert-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', convertAndDownloadCxmlGuide);
  }
  /* Download cXML files button */
  var xmlDlBtn = document.getElementById('cxml-download-xml-btn');
  if (xmlDlBtn) {
    xmlDlBtn.addEventListener('click', downloadCxmlFiles);
  }
}

function handleFileSelected(docType, file) {
  cxmlFiles[docType] = file;
  var drop = document.querySelector('#slot-' + docType + ' .cxml-upload-drop');
  var status = document.getElementById('status-' + docType);
  drop.classList.add('has-file');
  var truncName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
  status.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px">check_circle</span> ' + truncName;
  updateUploadSummary();
}

function updateUploadSummary() {
  var count = Object.values(cxmlFiles).filter(function(f) { return f !== null; }).length;
  var summaryEl = document.getElementById('cxml-upload-summary');
  var countEl = document.getElementById('cxml-upload-count');
  var convertBtn = document.getElementById('cxml-convert-btn');
  var xmlDlBtn = document.getElementById('cxml-download-xml-btn');

  if (count > 0) {
    summaryEl.style.display = 'block';
    countEl.textContent = count;
    convertBtn.disabled = false;
    if (xmlDlBtn) xmlDlBtn.disabled = false;
  } else {
    summaryEl.style.display = 'none';
    convertBtn.disabled = true;
    if (xmlDlBtn) xmlDlBtn.disabled = true;
  }
}

/* Parse cXML and extract elements for EDI segment enrichment */
function parseCxmlDocument(xmlText) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, 'text/xml');
  var elements = [];
  /* Walk all unique element tag names */
  var tags = new Set();
  function walk(node) {
    if (node.nodeType === 1) {
      tags.add(node.tagName);
      for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
    }
  }
  walk(doc.documentElement);
  return Array.from(tags);
}

/* Convert uploaded files → cXML Guide Excel workbook and download */
function convertAndDownloadCxmlGuide() {
  var convertBtn = document.getElementById('cxml-convert-btn');
  var progressEl = document.getElementById('cxml-convert-progress');
  var progFill = document.getElementById('cxml-prog-fill');
  var progText = document.getElementById('cxml-prog-text');
  var progPct = document.getElementById('cxml-prog-pct');

  convertBtn.disabled = true;
  convertBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_empty</span> Generating...';
  var xmlDlBtn = document.getElementById('cxml-download-xml-btn');
  if (xmlDlBtn) xmlDlBtn.disabled = true;
  progressEl.style.display = 'block';

  var uploadedTypes = Object.keys(cxmlFiles).filter(function(k) { return cxmlFiles[k] !== null; });
  var totalSteps = uploadedTypes.length + 1;
  var currentStep = 0;

  function updateProgress(text) {
    currentStep++;
    var pct = Math.round((currentStep / totalSteps) * 100);
    progFill.style.width = pct + '%';
    progText.textContent = text;
    progPct.textContent = pct + '%';
  }

  /* Read all files */
  var readPromises = uploadedTypes.map(function(docType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var content = e.target.result;
        updateProgress('Parsed ' + (DOC_LABELS[docType] || docType));
        resolve({ docType: docType, content: content });
      };
      reader.onerror = function() { resolve({ docType: docType, content: '' }); };
      reader.readAsText(cxmlFiles[docType]);
    });
  });

  Promise.all(readPromises).then(function(results) {
    updateProgress('Generating cXML Guide workbook...');

    try {
      if (typeof XLSX === 'undefined') throw new Error('SheetJS (XLSX) library not loaded');
      if (typeof CxmlGuideEngine === 'undefined') throw new Error('CxmlGuideEngine not loaded');

      var wb = XLSX.utils.book_new();

      results.forEach(function(result) {
        var docType = result.docType;
        var content = result.content;
        if (!content) return;

        /* Detect input type and get cXML */
        var inputType = CxmlGuideEngine.detectInputType(content);
        var cxmlText;
        if (inputType === 'edi') {
          var converted = CxmlGuideEngine.convertEdiToCxml(content);
          cxmlText = converted.cxml;
        } else {
          cxmlText = content; /* cXML input — use as-is, no masking */
        }

        /* Generate guide rows */
        var guideRows = CxmlGuideEngine.generateGuideRows(cxmlText);

        /* Build sheet: Column A = cXML Element (with value), Column B = Explanation */
        var sheetData = [['cXML Element', 'Explanation']];
        guideRows.forEach(function(row) {
          sheetData.push([row[0], row[1]]);
        });

        var ws = XLSX.utils.aoa_to_sheet(sheetData);

        /* --- Styling (requires xlsx-js-style) --- */
        var thinBorder = { style: 'thin', color: { rgb: 'BFBFBF' } };
        var headerStyle = {
          font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
          fill: { fgColor: { rgb: '1F4E79' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: { top: thinBorder, bottom: { style: 'medium', color: { rgb: '1F4E79' } }, left: thinBorder, right: thinBorder }
        };

        /* Apply header styles */
        if (ws['A1']) ws['A1'].s = headerStyle;
        if (ws['B1']) ws['B1'].s = headerStyle;

        /* Data cell styles */
        var cxmlStyle = function(odd) {
          return {
            font: { sz: 9, name: 'Consolas', color: { rgb: '1A1A2E' } },
            fill: { fgColor: { rgb: odd ? 'F2F7FB' : 'FFFFFF' } },
            alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
            border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
          };
        };
        var explStyle = function(odd) {
          return {
            font: { sz: 10, name: 'Calibri', color: { rgb: '333333' } },
            fill: { fgColor: { rgb: odd ? 'F2F7FB' : 'FFFFFF' } },
            alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
            border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
          };
        };

        /* Apply data styles */
        for (var r = 1; r <= guideRows.length; r++) {
          var odd = r % 2 === 1;
          var cellA = XLSX.utils.encode_cell({ r: r, c: 0 });
          var cellB = XLSX.utils.encode_cell({ r: r, c: 1 });
          if (ws[cellA]) ws[cellA].s = cxmlStyle(odd);
          if (ws[cellB]) ws[cellB].s = explStyle(odd);
        }

        /* Column widths */
        ws['!cols'] = [{ wch: 90 }, { wch: 80 }];

        /* Sheet name from doc type */
        var sheetName = (DOC_LABELS[docType] || docType).replace(/[\/\\*?\[\]:]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      /* Download */
      var filename = 'cXML_Guide_' + new Date().toISOString().slice(0, 10) + '.xlsx';
      downloadXlsxBlob(wb, filename);

      progFill.style.width = '100%';
      progText.textContent = 'Done! Downloaded ' + filename;
      progPct.textContent = '100%';
      progFill.style.background = 'var(--ok)';
    } catch (err) {
      progFill.style.background = 'var(--err)';
      progText.textContent = 'Error: ' + err.message;
      console.error('cXML Guide error:', err);
    }

    convertBtn.disabled = false;
    convertBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">download</span> Download cXML Guide (Excel)';
    if (xmlDlBtn) xmlDlBtn.disabled = false;
    setTimeout(function() { progressEl.style.display = 'none'; progFill.style.background = 'var(--accent)'; }, 2000);
  });
}

/* Download cXML files (original or converted from EDI) */
function downloadCxmlFiles() {
  var uploadedTypes = Object.keys(cxmlFiles).filter(function(k) { return cxmlFiles[k] !== null; });
  if (uploadedTypes.length === 0) return;

  var readPromises = uploadedTypes.map(function(docType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve({ docType: docType, content: e.target.result }); };
      reader.onerror = function() { resolve({ docType: docType, content: '' }); };
      reader.readAsText(cxmlFiles[docType]);
    });
  });

  Promise.all(readPromises).then(function(results) {
    if (typeof CxmlGuideEngine === 'undefined') { alert('CxmlGuideEngine not loaded'); return; }

    if (results.length === 1) {
      /* Single file — download directly */
      var r = results[0];
      var inputType = CxmlGuideEngine.detectInputType(r.content);
      var cxmlText = inputType === 'edi' ? CxmlGuideEngine.convertEdiToCxml(r.content).cxml : r.content;
      var blob = new Blob([cxmlText], { type: 'application/xml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (DOC_LABELS[r.docType] || r.docType).replace(/[^a-zA-Z0-9]/g, '_') + '.xml';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      /* Multiple files — zip them */
      if (typeof JSZip === 'undefined') { alert('JSZip not loaded'); return; }
      var zip = new JSZip();
      results.forEach(function(r) {
        if (!r.content) return;
        var inputType = CxmlGuideEngine.detectInputType(r.content);
        var cxmlText = inputType === 'edi' ? CxmlGuideEngine.convertEdiToCxml(r.content).cxml : r.content;
        var fname = (DOC_LABELS[r.docType] || r.docType).replace(/[^a-zA-Z0-9]/g, '_') + '.xml';
        zip.file(fname, cxmlText);
      });
      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'cXML_Documents_' + new Date().toISOString().slice(0, 10) + '.zip';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  });
}

/* Blob-based Excel download — works in Chrome extension sidepanel where XLSX.writeFile may fail */
function downloadXlsxBlob(wb, filename) {
  var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  var blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

/* Initialize on load */
initCxmlUpload();
initEdiUpload();
initCigGuide();

/* ================================================================
   EDI → cXML CONVERSION ENGINE
   Upload EDI X12 docs → Parse → Convert to cXML tags → Excel download
   ================================================================ */

var ediFiles = { po: null, poc: null, oc: null, asn: null, gr: null, inv: null };

/* cXML Reference Data — maps EDI doc types to cXML tags with explanations
   Col A = cXML Tag/Element, Col B = Explanation */
/* CXML_REFERENCE — actual cXML snippets from sample files with section dividers.
   Row format: [cxmlSnippet, explanation] — data row
               [sectionTitle, 'section'] — section header row */
var CXML_REFERENCE = {
  po: [
    ['XML Declaration & Envelope', 'section'],
    ['<?xml version="1.0" encoding="UTF-8"?>', 'XML declaration — specifies version 1.0 and UTF-8 encoding for all cXML documents.'],
    ['<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">', 'Document Type Declaration — references the cXML 1.2.050 DTD for schema validation.'],
    ['<cXML payloadID="20260427.001.req@acme.com" timestamp="2026-04-27T10:30:00-05:00" xml:lang="en-US">', 'Root element. In this example: payloadID uniquely identifies this PO transmission, timestamp is ISO 8601, xml:lang="en-US".'],
    ['Header / Authentication', 'section'],
    ['<Header>', 'Authentication and routing envelope — contains From, To, and Sender credential blocks.'],
    ['<From><Credential domain="NetworkID"><Identity>AN01000000001</Identity></Credential></From>', 'Identifies the buyer (Acme Corp). In this example: Ariba Network ID AN01000000001. domain can also be DUNS, SystemID, etc.'],
    ['<To><Credential domain="NetworkID"><Identity>AN01000000002</Identity></Credential></To>', 'Identifies the supplier (GlobalParts). In this example: Ariba Network ID AN01000000002.'],
    ['<Sender><Credential domain="NetworkID"><Identity>AN01000000001</Identity><SharedSecret>welcome123</SharedSecret></Credential>', 'Sending system credentials. SharedSecret is the authentication token. In this example: buyer system authenticates with "welcome123".'],
    ['<UserAgent>Procurement System v5.2</UserAgent></Sender>', 'Identifies the sending application/version. Useful for debugging integration issues.'],
    ['</Header>', 'Closes the Header authentication block.'],
    ['Order Request', 'section'],
    ['<Request deploymentMode="production">', 'Request envelope. deploymentMode="production" for live data, "test" for testing. Contains the business document.'],
    ['<OrderRequest>', 'Top-level Purchase Order element — contains OrderRequestHeader and one or more ItemOut line items.'],
    ['<OrderRequestHeader orderID="PO-2026-78543" orderDate="2026-04-27T10:30:00-05:00" type="new">', 'PO header. In this example: orderID="PO-2026-78543", type="new" (also supports "update" or "delete"). Maps from EDI BEG segment.'],
    ['<Total><Money currency="USD">18750.00</Money></Total>', 'Total PO value. In this example: $18,750.00 USD. currency uses ISO 4217 codes. Maps from EDI CTT/AMT.'],
    ['Ship-To Address', 'section'],
    ['<ShipTo>', 'Ship-to address block — maps from EDI N1 loop with qualifier "ST".'],
    ['<Address addressID="ADDR-ST-001">', 'Address container. addressID is a unique reference for this address location.'],
    ['<Name xml:lang="en">Acme Corp - Distribution Center</Name>', 'Location name. In this example: "Acme Corp - Distribution Center". Maps from EDI N1-02.'],
    ['<PostalAddress>', 'Structured postal address — contains Street, City, State, PostalCode, Country. Maps from EDI N3/N4.'],
    ['<DeliverTo>Receiving Dock B</DeliverTo>', 'Specific delivery point within the address. In this example: "Receiving Dock B".'],
    ['<Street>4500 Industrial Parkway</Street>', 'Street line 1. Maps from EDI N3-01. Multiple Street elements supported.'],
    ['<Street>Building 7, Suite 200</Street>', 'Street line 2 (optional). In this example: building/suite detail. Maps from EDI N3-02.'],
    ['<City>Houston</City><State>TX</State>', 'City and state/province. Maps from EDI N4-01 and N4-02.'],
    ['<PostalCode>77041</PostalCode>', 'ZIP/postal code. Maps from EDI N4-03.'],
    ['<Country isoCountryCode="US">United States</Country>', 'Country with ISO 3166-1 alpha-2 code. In this example: "US". Maps from EDI N4-04.'],
    ['</PostalAddress></Address></ShipTo>', 'Closes the ShipTo address block.'],
    ['Bill-To Address', 'section'],
    ['<BillTo>', 'Bill-to address block — same structure as ShipTo. Maps from EDI N1 loop with qualifier "BT".'],
    ['<Address addressID="ADDR-BT-001"><Name xml:lang="en">Acme Corp - Accounts Payable</Name>', 'In this example: billing goes to "Acme Corp - Accounts Payable" in Dallas, TX.'],
    ['<PostalAddress><Street>1200 Commerce Drive</Street><City>Dallas</City><State>TX</State><PostalCode>75201</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress>', 'Full bill-to postal address. Maps from EDI N3/N4 segments under BT N1 loop.'],
    ['</Address></BillTo>', 'Closes the BillTo address block.'],
    ['Payment & Contacts', 'section'],
    ['<Payment><PaymentTerm payInNumberOfDays="30"/></Payment>', 'Payment terms. In this example: Net 30 days. Maps from EDI ITD segment.'],
    ['<Contact role="buyer"><Name xml:lang="en">Jennifer Martinez</Name>', 'Buyer contact. In this example: Jennifer Martinez. role can be buyer, shipTo, orderContact, etc. Maps from EDI PER.'],
    ['<Phone><TelephoneNumber><CountryCode isoCountryCode="US">1</CountryCode><AreaOrCityCode>214</AreaOrCityCode><Number>555-0198</Number></TelephoneNumber></Phone>', 'Phone number with country/area code. Maps from EDI PER-03/04.'],
    ['<Email preferredLang="en">j.martinez@acme.com</Email></Contact>', 'Email address. In this example: j.martinez@acme.com. Maps from EDI PER-07/08 with qualifier EM.'],
    ['<Contact role="shipTo"><Name xml:lang="en">Robert Chen</Name>...r.chen@acme.com</Contact>', 'Ship-to contact. In this example: Robert Chen at receiving dock. Multiple Contact elements supported.'],
    ['<Comments xml:lang="en">Urgent order — needed for Q2 production run...</Comments>', 'Free-form PO comments. In this example: urgency note and reference to Project ATLAS-2026. Maps from EDI N9/MSG.'],
    ['<Extrinsic name="CostCenter">CC-4400-MFG</Extrinsic>', 'Custom name-value pair. In this example: Cost Center assignment. Not part of standard cXML — used for ERP-specific data.'],
    ['<Extrinsic name="ProjectCode">ATLAS-2026</Extrinsic>', 'Another Extrinsic. In this example: project code for accounting allocation.'],
    ['</OrderRequestHeader>', 'Closes the OrderRequestHeader block.'],
    ['Line Items', 'section'],
    ['<ItemOut lineNumber="1" quantity="500">', 'Line item 1. In this example: 500 units of bolts. lineNumber maps from EDI PO1-01, quantity from PO1-02.'],
    ['<ItemID><SupplierPartID>BOLT-SS316-M10X50</SupplierPartID><BuyerPartID>ACM-FST-00142</BuyerPartID></ItemID>', 'Product IDs. In this example: supplier part BOLT-SS316-M10X50, buyer part ACM-FST-00142. Maps from EDI PO1 VP/BP qualifiers.'],
    ['<Description xml:lang="en">Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80, DIN 933, Full Thread</Description>', 'Item description. Maps from EDI PID segment (F=free-form text).'],
    ['<UnitOfMeasure>EA</UnitOfMeasure>', 'UN/CEFACT unit code. In this example: EA (Each). Other common: BX, CS, KG, LB. Maps from EDI PO1-03.'],
    ['<UnitPrice><Money currency="USD">3.50</Money></UnitPrice>', 'Unit price. In this example: $3.50 per bolt. Maps from EDI PO1-04.'],
    ['<Tax><Money currency="USD">143.50</Money>', 'Tax container with total tax amount. In this example: $143.50 sales tax on line 1.'],
    ['<TaxDetail category="sales" percentageRate="8.25" purpose="tax">', 'Tax detail. In this example: 8.25% TX state sales tax. category can be sales, vat, gst. Maps from EDI TXI.'],
    ['<TaxableAmount><Money currency="USD">1750.00</Money></TaxableAmount>', 'Taxable base amount. In this example: 500 × $3.50 = $1,750.00.'],
    ['<TaxAmount><Money currency="USD">143.50</Money></TaxAmount></TaxDetail></Tax>', 'Calculated tax. In this example: $1,750.00 × 8.25% ≈ $143.50.'],
    ['<ScheduleLine requestedDeliveryDate="2026-05-10T00:00:00-05:00" quantity="500"/>', 'Delivery schedule. In this example: all 500 requested by May 10, 2026. Maps from EDI SCH segment.'],
    ['<Distribution><Accounting name="DistributionCharge">', 'Accounting distribution for GL posting. Contains AccountingSegment elements.'],
    ['<AccountingSegment id="4400" description="Manufacturing" type="CostCenter"/>', 'Cost center allocation. In this example: CC 4400 (Manufacturing). Maps from custom EDI REF segments.'],
    ['<AccountingSegment id="5100" description="Raw Materials" type="GLAccount"/></Accounting></Distribution>', 'GL account. In this example: account 5100 (Raw Materials).'],
    ['</ItemOut>', 'Closes line item 1.'],
    ['<ItemOut lineNumber="2" quantity="200">...<SupplierPartID>NUT-SS316-M10-HEX</SupplierPartID>...<UnitPrice><Money currency="USD">1.25</Money></UnitPrice>...</ItemOut>', 'Line 2: 200× SS316 Hex Nuts at $1.25 ea. Same structure as line 1.'],
    ['<ItemOut lineNumber="3" quantity="100">...<SupplierPartID>WSHR-SS316-M10-FLAT</SupplierPartID>...<UnitPrice><Money currency="USD">0.75</Money></UnitPrice>...</ItemOut>', 'Line 3: 100× SS316 Flat Washers at $0.75 ea.'],
    ['<ItemOut lineNumber="4" quantity="50">...<SupplierPartID>GSKT-VITON-DN50-PN16</SupplierPartID>...<UnitPrice><Money currency="USD">28.00</Money></UnitPrice>...</ItemOut>', 'Line 4: 50× Viton Gaskets at $28.00 ea. Includes tax: $115.50.'],
    ['<ItemOut lineNumber="5" quantity="1000">...<SupplierPartID>SEAL-ORING-BUNA-214</SupplierPartID>...<UnitPrice><Money currency="USD">12.50</Money></UnitPrice>...</ItemOut>', 'Line 5: 1000× Buna-N O-Rings at $12.50 ea. Delivery by May 8.'],
    ['Closing', 'section'],
    ['</OrderRequest>', 'Closes the OrderRequest element.'],
    ['</Request>', 'Closes the Request envelope.'],
    ['</cXML>', 'Closes the root cXML document.']
  ],
  oc: [
    ['XML Declaration & Envelope', 'section'],
    ['<?xml version="1.0" encoding="UTF-8"?>', 'XML declaration — version 1.0, UTF-8 encoding.'],
    ['<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">', 'cXML DTD reference for schema validation.'],
    ['<cXML payloadID="20260428.002.conf@globalparts.com" timestamp="2026-04-28T08:15:00-05:00" xml:lang="en-US">', 'Root element. In this example: confirmation from GlobalParts, one day after the PO was sent.'],
    ['Header / Authentication', 'section'],
    ['<Header>', 'Authentication envelope.'],
    ['<From><Credential domain="NetworkID"><Identity>AN01000000002</Identity></Credential></From>', 'From supplier (GlobalParts AN01000000002) — note reversed direction vs. PO.'],
    ['<To><Credential domain="NetworkID"><Identity>AN01000000001</Identity></Credential></To>', 'To buyer (Acme Corp AN01000000001).'],
    ['<Sender><Credential domain="NetworkID"><Identity>AN01000000002</Identity><SharedSecret>supplier_secret_456</SharedSecret></Credential>', 'Supplier authenticates. In this example: SharedSecret="supplier_secret_456".'],
    ['<UserAgent>GlobalParts ERP v8.1</UserAgent></Sender></Header>', 'Sender ERP identification.'],
    ['Confirmation Header', 'section'],
    ['<Request deploymentMode="production">', 'Request envelope for production environment.'],
    ['<ConfirmationRequest>', 'Top-level Order Confirmation element. Maps from EDI 855 transaction set.'],
    ['<ConfirmationHeader type="detail" confirmID="CONF-GP-90421" noticeDate="2026-04-28T08:15:00-05:00">', 'Header. In this example: type="detail" (line-by-line status), confirmID="CONF-GP-90421". type can be: accept, reject, detail, backordered. Maps from EDI BAK.'],
    ['<DocumentReference payloadID="20260427.001.req@acme.com"/>', 'Links back to the original PO. In this example: references the PO payloadID. Maps from EDI BAK PO number.'],
    ['Ship-From & Comments', 'section'],
    ['<Contact role="shipFrom"><Name xml:lang="en">GlobalParts Inc. - Main Warehouse</Name>', 'Ship-from location. In this example: Chicago warehouse at 8900 Logistics Boulevard.'],
    ['<PostalAddress><Street>8900 Logistics Boulevard</Street><City>Chicago</City><State>IL</State><PostalCode>60632</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress>', 'Full ship-from address.'],
    ['<Phone>...<Number>555-0377</Number>...</Phone><Email preferredLang="en">orders@globalparts.com</Email></Contact>', 'Ship-from contact details.'],
    ['<Comments xml:lang="en">Thank you for your order PO-2026-78543. Lines 1-3 and 5 confirmed...Line 4 (Viton Gaskets) is on backorder...</Comments>', 'Free-form confirmation comments. In this example: partial acceptance with backorder note.'],
    ['<Extrinsic name="SupplierOrderNumber">GP-SO-2026-41205</Extrinsic>', 'Supplier\'s internal order number. In this example: GP-SO-2026-41205.'],
    ['</ConfirmationHeader>', 'Closes the ConfirmationHeader.'],
    ['Confirmation Line Items', 'section'],
    ['<ConfirmationItem lineNumber="1" quantity="500">', 'Line 1 confirmation. In this example: confirming 500 bolts from PO line 1.'],
    ['<ConfirmationStatus type="accept" quantity="500" deliveryDate="2026-05-09T00:00:00-05:00" shipmentDate="2026-05-06T00:00:00-05:00"/>', 'Accepted. In this example: full qty accepted, ships May 6, delivers May 9. Maps from EDI ACK segment.'],
    ['<ItemIn><ItemID><SupplierPartID>BOLT-SS316-M10X50</SupplierPartID><BuyerPartID>ACM-FST-00142</BuyerPartID></ItemID>', 'Item reference. ItemIn contains the confirmed product IDs.'],
    ['<Description xml:lang="en">Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80</Description></ItemIn>', 'Item description within ItemIn.'],
    ['<UnitOfMeasure>EA</UnitOfMeasure><UnitPrice><Money currency="USD">3.50</Money></UnitPrice>', 'Confirmed UoM and unit price. Price may differ from PO if supplier adjusts.'],
    ['<Comments xml:lang="en">In stock. Will ship from Chicago warehouse.</Comments></ConfirmationItem>', 'Line-level comment. In this example: stock availability note.'],
    ['<ConfirmationItem lineNumber="4" quantity="50"><ConfirmationStatus type="backordered" quantity="50" deliveryDate="2026-05-20" shipmentDate="2026-05-18"/>', 'Line 4: BACKORDERED. In this example: Viton Gaskets delayed. type="backordered" with later delivery date.'],
    ['<Comments xml:lang="en">Viton gaskets on backorder from manufacturer. Expected restock May 16...</Comments></ConfirmationItem>', 'Backorder explanation. In this example: manufacturer delay with estimated restock date.'],
    ['<ConfirmationItem lineNumber="5" quantity="1000"><ConfirmationStatus type="accept" quantity="1000" deliveryDate="2026-05-08" shipmentDate="2026-05-05"/>...SEAL-ORING-BUNA-214...</ConfirmationItem>', 'Line 5: Accepted. In this example: 1000 O-Rings, earliest delivery May 8.'],
    ['Closing', 'section'],
    ['</ConfirmationRequest></Request></cXML>', 'Closes the ConfirmationRequest, Request, and root cXML elements.']
  ],
  asn: [
    ['XML Declaration & Envelope', 'section'],
    ['<?xml version="1.0" encoding="UTF-8"?>', 'XML declaration.'],
    ['<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">', 'cXML DTD reference.'],
    ['<cXML payloadID="20260506.003.ship@globalparts.com" timestamp="2026-05-06T14:22:00-05:00" xml:lang="en-US">', 'Root element. In this example: ship notice from GlobalParts on May 6 (ship date).'],
    ['Header / Authentication', 'section'],
    ['<Header>', 'Authentication envelope.'],
    ['<From><Credential domain="NetworkID"><Identity>AN01000000002</Identity></Credential></From>', 'From supplier (GlobalParts) — the shipper.'],
    ['<To><Credential domain="NetworkID"><Identity>AN01000000001</Identity></Credential></To>', 'To buyer (Acme Corp) — the receiver.'],
    ['<Sender>...<SharedSecret>supplier_secret_456</SharedSecret>...<UserAgent>GlobalParts ERP v8.1</UserAgent></Sender></Header>', 'Sender authentication block.'],
    ['Ship Notice Header', 'section'],
    ['<Request deploymentMode="production">', 'Request envelope.'],
    ['<ShipNoticeRequest>', 'Top-level ASN element. Contains ShipNoticeHeader and ShipNoticePortion(s). Maps from EDI 856.'],
    ['<ShipNoticeHeader shipmentID="SHP-GP-2026-07891" noticeDate="2026-05-06T14:22:00-05:00" deliveryDate="2026-05-09T00:00:00-05:00" shipmentDate="2026-05-06T14:00:00-05:00">', 'Header. In this example: shipmentID="SHP-GP-2026-07891", ships May 6 14:00, estimated delivery May 9. Maps from EDI BSN/DTM.'],
    ['Ship-From & Ship-To', 'section'],
    ['<Contact role="shipFrom"><Name xml:lang="en">GlobalParts Inc. - Main Warehouse</Name>', 'Origin. In this example: Chicago warehouse. Maps from EDI N1 SF qualifier at Shipment HL.'],
    ['<PostalAddress><Street>8900 Logistics Boulevard</Street><City>Chicago</City><State>IL</State><PostalCode>60632</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress></Contact>', 'Ship-from address.'],
    ['<Contact role="shipTo"><Name xml:lang="en">Acme Corp - Distribution Center</Name>', 'Destination. In this example: Houston distribution center. Maps from EDI N1 ST qualifier.'],
    ['<PostalAddress><Street>4500 Industrial Parkway</Street><Street>Building 7, Suite 200</Street><City>Houston</City><State>TX</State><PostalCode>77041</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress></Contact>', 'Ship-to address — matches the PO ShipTo.'],
    ['Comments & Carrier', 'section'],
    ['<Comments xml:lang="en">Shipment contains lines 1, 2, 3, and 5 from PO-2026-78543. Line 4 (Viton Gaskets) will ship separately on May 18...</Comments>', 'Shipping notes. In this example: partial shipment explanation — line 4 backordered.'],
    ['<Extrinsic name="CarrierName">FedEx Freight</Extrinsic>', 'Custom carrier name. In this example: FedEx Freight.'],
    ['<Extrinsic name="TrackingURL">https://www.fedex.com/tracking?tracknumbers=794644790132</Extrinsic>', 'Tracking link. In this example: FedEx tracking URL with PRO number.'],
    ['<Extrinsic name="NumberOfPackages">3</Extrinsic>', 'Package count. In this example: 3 packages in this shipment.'],
    ['<ShipControl>', 'Carrier and tracking container. Maps from EDI TD5/REF segments.'],
    ['<CarrierIdentifier domain="SCAC">FXFE</CarrierIdentifier>', 'Standard Carrier Alpha Code. In this example: FXFE (FedEx Freight). Maps from EDI TD5-03.'],
    ['<CarrierIdentifier domain="companyName">FedEx Freight</CarrierIdentifier>', 'Human-readable carrier name.'],
    ['<ShipmentIdentifier>794644790132</ShipmentIdentifier>', 'Tracking/PRO number. In this example: FedEx tracking 794644790132. Maps from EDI REF CN qualifier.'],
    ['<Route method="motor"/></ShipControl>', 'Transport method. In this example: "motor" (truck). Options: air, motor, rail, ship. Maps from EDI TD5-01.'],
    ['</ShipNoticeHeader>', 'Closes the ShipNoticeHeader.'],
    ['Ship Notice Line Items', 'section'],
    ['<ShipNoticePortion>', 'Groups items for one PO. In this example: all items reference PO-2026-78543. Maps from EDI Order-level HL.'],
    ['<OrderReference orderID="PO-2026-78543"><DocumentReference payloadID="20260427.001.req@acme.com"/></OrderReference>', 'PO reference. In this example: links to original PO. Maps from EDI PRF segment.'],
    ['<ShipNoticeItem lineNumber="1" quantity="500">', 'Shipped line item. In this example: 500 bolts from PO line 1. Maps from EDI Item-level HL + LIN/SN1.'],
    ['<ItemID><SupplierPartID>BOLT-SS316-M10X50</SupplierPartID><BuyerPartID>ACM-FST-00142</BuyerPartID></ItemID>', 'Product IDs for shipped item.'],
    ['<Description xml:lang="en">Stainless Steel 316 Hex Bolt M10x50mm</Description>', 'Item description.'],
    ['<UnitOfMeasure>EA</UnitOfMeasure>', 'Unit of measure for shipped quantity.'],
    ['<Packaging><PackagingCode>CTN</PackagingCode><Description xml:lang="en">Carton - 250 pcs each, 2 cartons</Description></Packaging>', 'Packaging detail. In this example: CTN (Carton), 250 pcs/carton × 2. Maps from EDI TD1.'],
    ['<Batch><BuyerBatchID>LOT-B2026-0506A</BuyerBatchID><SupplierBatchID>GP-BATCH-SS316-4421</SupplierBatchID></Batch>', 'Batch/lot tracking. In this example: buyer and supplier batch IDs for traceability.'],
    ['</ShipNoticeItem>', 'Closes line item 1.'],
    ['<ShipNoticeItem lineNumber="2" quantity="200">...<SupplierPartID>NUT-SS316-M10-HEX</SupplierPartID>...<PackagingCode>CTN</PackagingCode>...</ShipNoticeItem>', 'Line 2: 200× Hex Nuts in 1 carton.'],
    ['<ShipNoticeItem lineNumber="3" quantity="100">...<SupplierPartID>WSHR-SS316-M10-FLAT</SupplierPartID>...</ShipNoticeItem>', 'Line 3: 100× Flat Washers.'],
    ['<ShipNoticeItem lineNumber="5" quantity="1000">...<SupplierPartID>SEAL-ORING-BUNA-214</SupplierPartID>...<Batch><SupplierBatchID>GP-BATCH-BUNA-7803</SupplierBatchID></Batch>...</ShipNoticeItem>', 'Line 5: 1000× O-Rings with batch tracking. Note: Line 4 NOT shipped (backordered).'],
    ['Closing', 'section'],
    ['</ShipNoticePortion>', 'Closes the ShipNoticePortion grouping.'],
    ['</ShipNoticeRequest></Request></cXML>', 'Closes ShipNoticeRequest, Request, and root cXML.']
  ],
  gr: [
    ['XML Declaration & Envelope', 'section'],
    ['<?xml version="1.0" encoding="UTF-8"?>', 'XML declaration.'],
    ['<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">', 'cXML DTD reference.'],
    ['<cXML payloadID="20260509.004.rcpt@acme.com" timestamp="2026-05-09T16:45:00-05:00" xml:lang="en-US">', 'Root element. In this example: goods receipt by Acme Corp on May 9 (delivery day).'],
    ['Header / Authentication', 'section'],
    ['<Header>', 'Authentication envelope.'],
    ['<From><Credential domain="NetworkID"><Identity>AN01000000001</Identity></Credential></From>', 'From buyer (Acme Corp) — the receiving party sends the GR.'],
    ['<To><Credential domain="NetworkID"><Identity>AN01000000002</Identity></Credential></To>', 'To supplier (GlobalParts) — notification of receipt.'],
    ['<Sender>...<SharedSecret>welcome123</SharedSecret>...<UserAgent>Acme WMS v3.4</UserAgent></Sender></Header>', 'Sender: Acme Warehouse Management System v3.4.'],
    ['Receipt Header', 'section'],
    ['<Request deploymentMode="production">', 'Request envelope.'],
    ['<ReceiptRequest>', 'Top-level Goods Receipt element. Maps from EDI 861 transaction set.'],
    ['<ReceiptRequestHeader receiptDate="2026-05-09T16:45:00-05:00" operation="new">', 'Header. In this example: received May 9 at 16:45. operation="new" (also supports "delete"). Maps from EDI RCD/DTM.'],
    ['References & Location', 'section'],
    ['<DocumentReference payloadID="20260506.003.ship@globalparts.com"/>', 'Links to the ASN. In this example: references the ship notice payloadID.'],
    ['<ShipNoticeReference shipmentID="SHP-GP-2026-07891"/>', 'Links to specific shipment. In this example: the FedEx shipment from May 6.'],
    ['<Contact role="locationTo"><Name xml:lang="en">Acme Corp - Distribution Center</Name>', 'Receiving warehouse. In this example: Houston distribution center.'],
    ['<PostalAddress><Street>4500 Industrial Parkway</Street><City>Houston</City><State>TX</State><PostalCode>77041</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress></Contact>', 'Receiving location address.'],
    ['<Contact role="receivingContact"><Name xml:lang="en">Robert Chen</Name><Email preferredLang="en">r.chen@acme.com</Email></Contact>', 'Person who received. In this example: Robert Chen at the dock.'],
    ['<Comments xml:lang="en">Received shipment SHP-GP-2026-07891 at Dock B. All items inspected. Line 5 (O-Rings) — 3 units found damaged...</Comments>', 'Receipt notes. In this example: damage reported on line 5 (3 of 1000 O-Rings).'],
    ['<Extrinsic name="ReceivingDock">Dock B</Extrinsic>', 'Custom: receiving dock. In this example: Dock B.'],
    ['<Extrinsic name="InspectedBy">Robert Chen</Extrinsic>', 'Custom: inspector name.'],
    ['<Extrinsic name="GRNumber">GR-2026-05421</Extrinsic>', 'Custom: internal GR document number.'],
    ['</ReceiptRequestHeader>', 'Closes the ReceiptRequestHeader.'],
    ['Receipt Line Items', 'section'],
    ['<ReceiptOrder>', 'Groups receipt items by PO. Contains OrderReference and ReceiptItem elements.'],
    ['<OrderReference orderID="PO-2026-78543"><DocumentReference payloadID="20260427.001.req@acme.com"/></OrderReference>', 'PO reference. In this example: receiving against PO-2026-78543. Maps from EDI REF PO qualifier.'],
    ['<ReceiptItem lineNumber="1" quantity="500">', 'Line 1 receipt. In this example: 500 bolts received. Maps from EDI RCD/QTY.'],
    ['<ItemID><SupplierPartID>BOLT-SS316-M10X50</SupplierPartID><BuyerPartID>ACM-FST-00142</BuyerPartID></ItemID>', 'Product IDs.'],
    ['<ReceivedQuantity status="accepted">500</ReceivedQuantity>', 'Quantity and status. In this example: all 500 accepted. status can be: accepted, rejected, damaged.'],
    ['<UnitOfMeasure>EA</UnitOfMeasure>', 'Unit of measure.'],
    ['<ShortDescription xml:lang="en">SS316 Hex Bolt M10x50</ShortDescription>', 'Brief item description.'],
    ['<Batch batchNumber="GP-BATCH-SS316-4421"/></ReceiptItem>', 'Batch tracking. In this example: matches the supplier batch from the ASN.'],
    ['<ReceiptItem lineNumber="5" quantity="997">', 'Line 5: PARTIAL receipt. In this example: 997 of 1000 O-Rings (3 damaged).'],
    ['<ReceivedQuantity status="accepted">997</ReceivedQuantity>', 'Partial acceptance. In this example: 997 accepted, 3 damaged units excluded.'],
    ['<Batch batchNumber="GP-BATCH-BUNA-7803"/>', 'Batch number for received O-Rings.'],
    ['<Description xml:lang="en">997 of 1000 received in good condition. 3 units damaged in transit — crushed packaging...</Description></ReceiptItem>', 'Damage description for the discrepancy. In this example: references damage claim DMG-2026-0509-001.'],
    ['Closing', 'section'],
    ['</ReceiptOrder>', 'Closes the ReceiptOrder grouping.'],
    ['</ReceiptRequest></Request></cXML>', 'Closes ReceiptRequest, Request, and root cXML.']
  ],
  inv: [
    ['XML Declaration & Envelope', 'section'],
    ['<?xml version="1.0" encoding="UTF-8"?>', 'XML declaration.'],
    ['<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">', 'cXML DTD reference.'],
    ['<cXML payloadID="20260515.005.inv@globalparts.com" timestamp="2026-05-15T09:30:00-05:00" xml:lang="en-US">', 'Root element. In this example: invoice from GlobalParts on May 15.'],
    ['Header / Authentication', 'section'],
    ['<Header>', 'Authentication envelope.'],
    ['<From><Credential domain="NetworkID"><Identity>AN01000000002</Identity></Credential></From>', 'From supplier (GlobalParts) — the invoicing party.'],
    ['<To><Credential domain="NetworkID"><Identity>AN01000000001</Identity></Credential></To>', 'To buyer (Acme Corp) — the payer.'],
    ['<Sender>...<SharedSecret>supplier_secret_456</SharedSecret>...<UserAgent>GlobalParts ERP v8.1</UserAgent></Sender></Header>', 'Sender authentication.'],
    ['Invoice Header', 'section'],
    ['<Request deploymentMode="production">', 'Request envelope.'],
    ['<InvoiceDetailRequest>', 'Top-level Invoice element. Maps from EDI 810 transaction set.'],
    ['<InvoiceDetailRequestHeader invoiceID="INV-GP-2026-18734" invoiceDate="2026-05-15T09:30:00-05:00" purpose="standard" operation="new">', 'Header. In this example: invoiceID="INV-GP-2026-18734", purpose="standard" (also: creditMemo, debitMemo). Maps from EDI BIG.'],
    ['<InvoiceDetailHeaderIndicator/>', 'Indicates this is a header-level invoice (has trading partner info).'],
    ['<InvoiceDetailLineIndicator/>', 'Indicates line-item detail is included.'],
    ['Invoice Partners', 'section'],
    ['<InvoicePartner><Contact role="remitTo"><Name xml:lang="en">GlobalParts Inc.</Name>', 'Remit-to party. In this example: payments go to GlobalParts in Chicago.'],
    ['<PostalAddress><Street>8900 Logistics Boulevard</Street><City>Chicago</City><State>IL</State><PostalCode>60632</PostalCode><Country isoCountryCode="US">United States</Country></PostalAddress>', 'Remit-to address. Maps from EDI N1/N3/N4 with RE qualifier.'],
    ['<IdReference domain="TaxID" identifier="36-7891234"/></Contact></InvoicePartner>', 'Tax ID. In this example: EIN 36-7891234.'],
    ['<InvoicePartner><Contact role="billTo"><Name xml:lang="en">Acme Corp - Accounts Payable</Name>', 'Bill-to party. In this example: Acme AP in Dallas.'],
    ['<PostalAddress><Street>1200 Commerce Drive</Street><City>Dallas</City><State>TX</State><PostalCode>75201</PostalCode>...</PostalAddress></Contact></InvoicePartner>', 'Bill-to address. Maps from EDI N1 BT qualifier.'],
    ['<InvoicePartner><Contact role="from"><Name xml:lang="en">GlobalParts Inc. - Billing Department</Name><Email preferredLang="en">billing@globalparts.com</Email>...</Contact></InvoicePartner>', 'Invoice originator contact. In this example: billing@globalparts.com, phone 312-555-0388.'],
    ['Payment Terms & References', 'section'],
    ['<DocumentReference payloadID="20260427.001.req@acme.com"/>', 'PO reference. In this example: links to original PO.'],
    ['<PaymentTerm payInNumberOfDays="30"><Discount><DiscountPercent percent="2"/><DeadlineDays>10</DeadlineDays></Discount></PaymentTerm>', 'Payment terms. In this example: 2/10 Net 30 (2% discount if paid in 10 days, net due in 30). Maps from EDI ITD.'],
    ['<Comments xml:lang="en">Invoice for shipment SHP-GP-2026-07891 against PO-2026-78543. Partial invoice — excludes Line 4 (Viton Gaskets, backordered). Terms: 2/10 Net 30.</Comments>', 'Invoice notes. In this example: partial invoice explanation.'],
    ['<Extrinsic name="SupplierOrderNumber">GP-SO-2026-41205</Extrinsic>', 'Supplier order reference.'],
    ['<Extrinsic name="ShipmentReference">SHP-GP-2026-07891</Extrinsic>', 'Related shipment reference.'],
    ['<Extrinsic name="TaxID">36-7891234</Extrinsic>', 'Tax ID extrinsic.'],
    ['</InvoiceDetailRequestHeader>', 'Closes the InvoiceDetailRequestHeader.'],
    ['Invoice Line Items', 'section'],
    ['<InvoiceDetailOrder>', 'Groups invoice items by PO. Contains InvoiceDetailOrderInfo and InvoiceDetailItem elements.'],
    ['<InvoiceDetailOrderInfo><OrderReference orderID="PO-2026-78543"><DocumentReference payloadID="20260427.001.req@acme.com"/></OrderReference></InvoiceDetailOrderInfo>', 'PO reference within invoice. Maps from EDI BIG-04 or REF.'],
    ['<InvoiceDetailItem invoiceLineNumber="1" quantity="500">', 'Invoice line 1. In this example: 500 bolts. Maps from EDI IT1.'],
    ['<InvoiceDetailItemReference lineNumber="1"><ItemID><SupplierPartID>BOLT-SS316-M10X50</SupplierPartID><BuyerPartID>ACM-FST-00142</BuyerPartID></ItemID>', 'PO line reference and product IDs.'],
    ['<Description xml:lang="en">Stainless Steel 316 Hex Bolt M10x50mm, Grade A4-80, DIN 933</Description></InvoiceDetailItemReference>', 'Item description.'],
    ['<UnitOfMeasure>EA</UnitOfMeasure><UnitPrice><Money currency="USD">3.50</Money></UnitPrice>', 'Unit details. In this example: EA at $3.50.'],
    ['<SubtotalAmount><Money currency="USD">1750.00</Money></SubtotalAmount>', 'Line subtotal. In this example: 500 × $3.50 = $1,750.00.'],
    ['<Tax><Money currency="USD">143.50</Money><TaxDetail category="sales" percentageRate="8.25" purpose="tax"><TaxableAmount><Money currency="USD">1750.00</Money></TaxableAmount><TaxAmount><Money currency="USD">144.38</Money></TaxAmount></TaxDetail></Tax>', 'Line tax. In this example: 8.25% TX sales tax = $144.38. Maps from EDI TXI.'],
    ['<GrossAmount><Money currency="USD">1894.38</Money></GrossAmount>', 'Gross = subtotal + tax. In this example: $1,750.00 + $144.38 = $1,894.38.'],
    ['<NetAmount><Money currency="USD">1894.38</Money></NetAmount></InvoiceDetailItem>', 'Net amount (after any adjustments). Same as gross when no discounts.'],
    ['<InvoiceDetailItem invoiceLineNumber="4" quantity="997">...<SupplierPartID>SEAL-ORING-BUNA-214</SupplierPartID>...<SubtotalAmount><Money currency="USD">12462.50</Money></SubtotalAmount>...', 'Line 4 (inv): 997 O-Rings at $12.50 = $12,462.50. Note: invoices 997 (not 1000) per GR quantity.'],
    ['<Comments xml:lang="en">Invoicing 997 of 1000 ordered per GR-2026-05421. 3 units damaged in transit — not invoiced.</Comments></InvoiceDetailItem>', 'Quantity reconciliation note. In this example: 3 damaged units excluded from invoice.'],
    ['</InvoiceDetailOrder>', 'Closes the InvoiceDetailOrder.'],
    ['Invoice Summary', 'section'],
    ['<InvoiceDetailSummary>', 'Invoice totals section. Maps from EDI TDS/summary segments.'],
    ['<SubtotalAmount><Money currency="USD">14537.50</Money></SubtotalAmount>', 'Sum of all line subtotals. In this example: $14,537.50.'],
    ['<Tax><Money currency="USD">1199.36</Money><TaxDetail category="sales" percentageRate="8.25"><TaxableAmount><Money currency="USD">14537.50</Money></TaxableAmount><TaxAmount><Money currency="USD">1199.36</Money></TaxAmount></TaxDetail></Tax>', 'Total tax. In this example: $1,199.36 total sales tax.'],
    ['<SpecialHandlingAmount><Money currency="USD">0.00</Money></SpecialHandlingAmount>', 'Special handling charges. In this example: $0.00. Maps from EDI SAC with handling code.'],
    ['<ShippingAmount><Money currency="USD">285.00</Money></ShippingAmount>', 'Shipping charges. In this example: $285.00 FedEx Freight. Maps from EDI SAC with freight code.'],
    ['<GrossAmount><Money currency="USD">16021.86</Money></GrossAmount>', 'Gross total. In this example: $14,537.50 + $1,199.36 + $285.00 = $16,021.86.'],
    ['<InvoiceDetailDiscount><Money currency="USD">0.00</Money></InvoiceDetailDiscount>', 'Discount applied. In this example: $0.00 (discount available if paid in 10 days). Maps from EDI SAC.'],
    ['<NetAmount><Money currency="USD">16021.86</Money></NetAmount>', 'Net payable. In this example: $16,021.86.'],
    ['<DueAmount><Money currency="USD">16021.86</Money></DueAmount>', 'Final amount due. In this example: $16,021.86 due within 30 days.'],
    ['</InvoiceDetailSummary>', 'Closes the InvoiceDetailSummary.'],
    ['Closing', 'section'],
    ['</InvoiceDetailRequest></Request></cXML>', 'Closes InvoiceDetailRequest, Request, and root cXML.']
  ]
};

var CXML_DOC_LABELS = {
  po: 'Purchase Order (850)',
  poc: 'Purchase Order Change (860)',
  oc: 'Order Confirmation (855)',
  asn: 'ASN (856)',
  gr: 'Goods Receipt (861)',
  inv: 'Invoice (810)'
};

/* Parse EDI X12 document and extract segment types */
function parseEdiDocument(ediText) {
  var segments = [];
  var segSep = '~';
  /* Auto-detect segment separator */
  if (ediText.indexOf('~') < 0 && ediText.indexOf('\n') > 0) segSep = '\n';
  var lines = ediText.split(segSep).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  var elemSep = '*';
  /* Detect element separator from ISA if present */
  if (lines.length > 0 && lines[0].substring(0, 3) === 'ISA' && lines[0].length > 3) {
    elemSep = lines[0].charAt(3);
  }
  var segTypes = [];
  var segData = [];
  lines.forEach(function(line) {
    var parts = line.split(elemSep);
    var segId = parts[0].toUpperCase();
    if (segTypes.indexOf(segId) < 0) segTypes.push(segId);
    segData.push({ id: segId, elements: parts });
  });
  return { segmentTypes: segTypes, segments: segData, raw: ediText };
}

/* Generate cXML file content from parsed EDI */
function generateCxmlFromEdi(docType, parsed) {
  var now = new Date().toISOString();
  var payloadId = now.replace(/[^0-9]/g, '') + '.' + Math.random().toString(36).substring(2, 8) + '@aia.sap.com';
  var segs = parsed.segments;

  /* ── Helpers ── */
  function getField(segId, idx) {
    var seg = segs.find(function(s) { return s.id === segId; });
    return seg && seg.elements[idx] ? seg.elements[idx] : '';
  }
  function getAllSegs(segId) { return segs.filter(function(s) { return s.id === segId; }); }
  function fmtDate(d) { return d.length >= 8 ? d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8) : now.slice(0,10); }
  function buildAddress(n1Seg, segList) {
    /* Given N1 seg, find the next N3 and N4 that follow it in segList */
    var idx = segList.indexOf(n1Seg);
    var n3 = null, n4 = null;
    for (var j = idx + 1; j < segList.length && j <= idx + 3; j++) {
      if (segList[j].id === 'N3') n3 = segList[j];
      else if (segList[j].id === 'N4') n4 = segList[j];
      else if (segList[j].id === 'N1' || segList[j].id === 'PO1' || segList[j].id === 'IT1' || segList[j].id === 'PER' || segList[j].id === 'ITD' || segList[j].id === 'HL' || segList[j].id === 'LIN') break;
    }
    var street = n3 ? escXml(n3.elements[1] || '') : '';
    var street2 = n3 && n3.elements[2] ? escXml(n3.elements[2]) : '';
    var city = n4 ? escXml(n4.elements[1] || '') : '';
    var state = n4 ? escXml(n4.elements[2] || '') : '';
    var zip = n4 ? escXml(n4.elements[3] || '') : '';
    var country = n4 ? escXml(n4.elements[4] || 'US') : 'US';
    var name = escXml(n1Seg.elements[2] || '');
    var xml = '<Address>\n';
    xml += '              <Name xml:lang="en">' + name + '</Name>\n';
    xml += '              <PostalAddress>\n';
    xml += '                <Street>' + street + '</Street>\n';
    if (street2) xml += '                <Street>' + street2 + '</Street>\n';
    xml += '                <City>' + city + '</City>\n';
    xml += '                <State>' + state + '</State>\n';
    xml += '                <PostalCode>' + zip + '</PostalCode>\n';
    xml += '                <Country isoCountryCode="' + country + '">' + country + '</Country>\n';
    xml += '              </PostalAddress>\n';
    xml += '            </Address>';
    return xml;
  }
  function buildContact(perSeg, role) {
    if (!perSeg) return '';
    var name = escXml(perSeg.elements[2] || '');
    var xml = '        <Contact role="' + role + '">\n';
    xml += '          <Name xml:lang="en">' + name + '</Name>\n';
    /* PER fields: [1]=qualifier, [2]=name, [3]=commQual1, [4]=commVal1, [5]=commQual2, [6]=commVal2 */
    for (var p = 3; p < perSeg.elements.length - 1; p += 2) {
      var cq = perSeg.elements[p] || '';
      var cv = perSeg.elements[p + 1] || '';
      if (cq === 'TE') xml += '          <Phone><TelephoneNumber><CountryCode isoCountryCode="US">1</CountryCode><AreaOrCityCode/><Number>' + escXml(cv) + '</Number></TelephoneNumber></Phone>\n';
      else if (cq === 'EM') xml += '          <Email preferredLang="en">' + escXml(cv) + '</Email>\n';
    }
    xml += '        </Contact>\n';
    return xml;
  }
  function collectNotesAfter(segId, segIdx) {
    /* Collect NTE segments following a given segment index */
    var notes = [];
    for (var n = segIdx + 1; n < segs.length; n++) {
      if (segs[n].id === 'NTE') notes.push(segs[n].elements[2] || '');
      else break;
    }
    return notes.join(' ');
  }

  var senderID = getField('ISA', 6).trim() || 'SENDER';
  var receiverID = getField('ISA', 8).trim() || 'RECEIVER';

  var header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">\n' +
    '<cXML payloadID="' + payloadId + '" timestamp="' + now + '" xml:lang="en-US">\n' +
    '  <Header>\n' +
    '    <From><Credential domain="NetworkID"><Identity>' + senderID + '</Identity></Credential></From>\n' +
    '    <To><Credential domain="NetworkID"><Identity>' + receiverID + '</Identity></Credential></To>\n' +
    '    <Sender><Credential domain="NetworkID"><Identity>' + senderID + '</Identity><SharedSecret>********</SharedSecret></Credential><UserAgent>AIA v3.1.0</UserAgent></Sender>\n' +
    '  </Header>\n' +
    '  <Request deploymentMode="production">\n';

  var body = '';
  var footer = '  </Request>\n</cXML>';

  /* ══════════════════════════════════════════════════════════════
     PO — 850 → OrderRequest
     Segments: BEG, REF, PER, DTM, TD5, N1/N3/N4, ITD, PO1, PID, TXI, SCH, NTE, CTT, AMT
     ══════════════════════════════════════════════════════════════ */
  if (docType === 'po') {
    var poNum = getField('BEG', 3) || 'PO-UNKNOWN';
    var poDate = getField('BEG', 5) || '';
    var poDateFmt = fmtDate(poDate);
    var delivDate = getField('DTM', 2) || '';
    var delivDateFmt = delivDate ? fmtDate(delivDate) : '';
    var amtTotal = getField('AMT', 2) || '0.00';
    var currency = 'USD';

    body = '    <OrderRequest>\n';
    body += '      <OrderRequestHeader orderID="' + escXml(poNum) + '" orderDate="' + poDateFmt + 'T00:00:00-00:00" type="new">\n';
    body += '        <Total><Money currency="' + currency + '">' + amtTotal + '</Money></Total>\n';

    /* ShipTo / BillTo from N1+N3+N4 */
    var allRawSegs = segs;
    var n1Segs = getAllSegs('N1');
    n1Segs.forEach(function(n1) {
      var qual = n1.elements[1] || '';
      if (qual === 'ST') {
        body += '        <ShipTo>\n            ' + buildAddress(n1, allRawSegs) + '\n        </ShipTo>\n';
      } else if (qual === 'BT') {
        body += '        <BillTo>\n            ' + buildAddress(n1, allRawSegs) + '\n        </BillTo>\n';
      }
    });

    /* Delivery date from DTM*002 */
    if (delivDateFmt) body += '        <Extrinsic name="requestedDeliveryDate">' + delivDateFmt + '</Extrinsic>\n';

    /* Shipping: TD5 */
    var td5 = segs.find(function(s) { return s.id === 'TD5'; });
    if (td5) {
      body += '        <ShipControl>\n';
      body += '          <CarrierIdentifier domain="SCAC">' + escXml(td5.elements[3] || '') + '</CarrierIdentifier>\n';
      body += '          <TransportInformation><Route method="' + escXml(td5.elements[4] || 'motor') + '"/></TransportInformation>\n';
      body += '        </ShipControl>\n';
    }

    /* Payment terms from ITD */
    var itd = segs.find(function(s) { return s.id === 'ITD'; });
    if (itd) {
      var termDesc = itd.elements[9] || '';
      var discPct = itd.elements[3] || '';
      var netDays = itd.elements[5] || '';
      body += '        <PaymentTerm payInNumberOfDays="' + netDays + '">\n';
      if (discPct) body += '          <Discount><DiscountPercent percent="' + discPct + '"/></Discount>\n';
      body += '          <Extrinsic name="termDescription">' + escXml(termDesc) + '</Extrinsic>\n';
      body += '        </PaymentTerm>\n';
    }

    /* Contacts from PER */
    var perSegs = getAllSegs('PER');
    perSegs.forEach(function(per) {
      var role = per.elements[1] === 'BD' ? 'buyerDepartment' : per.elements[1] === 'DC' ? 'deliveryContact' : 'default';
      body += buildContact(per, role);
    });

    /* REF extrinsics */
    var refSegs = getAllSegs('REF');
    refSegs.forEach(function(ref) {
      body += '        <Extrinsic name="REF-' + escXml(ref.elements[1] || '') + '">' + escXml(ref.elements[2] || '') + '</Extrinsic>\n';
    });

    /* General notes from NTE */
    var genNotes = segs.filter(function(s) { return s.id === 'NTE' && s.elements[1] === 'GEN'; });
    if (genNotes.length > 0) {
      body += '        <Comments xml:lang="en">' + escXml(genNotes.map(function(n) { return n.elements[2] || ''; }).join(' ')) + '</Comments>\n';
    } else {
      body += '        <Comments xml:lang="en">Generated by AIA from EDI 850</Comments>\n';
    }

    body += '      </OrderRequestHeader>\n';

    /* Line items from PO1 + PID + TXI + SCH */
    var po1Segs = getAllSegs('PO1');
    po1Segs.forEach(function(po1, idx) {
      var lineNum = po1.elements[1] || String(idx + 1);
      var qty = po1.elements[2] || '1';
      var uom = po1.elements[3] || 'EA';
      var price = po1.elements[4] || '0.00';
      var po1Idx = segs.indexOf(po1);

      /* Find PID right after this PO1 */
      var desc = 'Item ' + lineNum;
      for (var d = po1Idx + 1; d < segs.length && d <= po1Idx + 4; d++) {
        if (segs[d].id === 'PID') { desc = segs[d].elements[5] || desc; break; }
        if (segs[d].id === 'PO1') break;
      }

      /* Find TXI after this PO1 */
      var taxAmt = '', taxRate = '';
      for (var t = po1Idx + 1; t < segs.length && t <= po1Idx + 5; t++) {
        if (segs[t].id === 'TXI') { taxAmt = segs[t].elements[2] || ''; taxRate = segs[t].elements[6] || ''; break; }
        if (segs[t].id === 'PO1') break;
      }

      /* Find SCH after this PO1 */
      var schDate = '';
      for (var sc = po1Idx + 1; sc < segs.length && sc <= po1Idx + 6; sc++) {
        if (segs[sc].id === 'SCH') { schDate = segs[sc].elements[6] || ''; break; }
        if (segs[sc].id === 'PO1') break;
      }

      body += '      <ItemOut lineNumber="' + lineNum + '" quantity="' + qty + '"';
      if (schDate) body += ' requestedDeliveryDate="' + fmtDate(schDate) + 'T00:00:00-00:00"';
      body += '>\n';
      body += '        <ItemID>\n';
      body += '          <SupplierPartID>' + escXml(getPartId(po1.elements, 'VP')) + '</SupplierPartID>\n';
      var bpId = getPartId(po1.elements, 'BP');
      if (bpId) body += '          <BuyerPartID>' + escXml(bpId) + '</BuyerPartID>\n';
      body += '        </ItemID>\n';
      body += '        <ItemDetail>\n';
      body += '          <UnitPrice><Money currency="' + currency + '">' + price + '</Money></UnitPrice>\n';
      body += '          <Description xml:lang="en">' + escXml(desc) + '</Description>\n';
      body += '          <UnitOfMeasure>' + uom + '</UnitOfMeasure>\n';
      body += '          <Classification domain="UNSPSC">00000000</Classification>\n';
      body += '        </ItemDetail>\n';
      if (taxAmt) {
        body += '        <Tax>\n';
        body += '          <Money currency="' + currency + '">' + taxAmt + '</Money>\n';
        body += '          <Description xml:lang="en">Sales Tax' + (taxRate ? ' (' + taxRate + '%)' : '') + '</Description>\n';
        body += '        </Tax>\n';
      }
      body += '      </ItemOut>\n';
    });
    body += '    </OrderRequest>\n';

  /* ══════════════════════════════════════════════════════════════
     OC — 855 → ConfirmationRequest
     Segments: BAK, REF, NTE, N1/N3/N4, PER, PO1, PID, ACK, DTM
     ══════════════════════════════════════════════════════════════ */
  } else if (docType === 'oc') {
    var bakPO = getField('BAK', 3) || 'PO-UNKNOWN';
    var bakDate = getField('BAK', 4) || '';
    var bakType = getField('BAK', 2) || 'AC';
    var soNumber = getField('BAK', 8) || '';
    var confType = bakType === 'AC' ? 'accept' : bakType === 'RJ' ? 'reject' : bakType === 'AD' ? 'detail' : 'accept';

    body = '    <ConfirmationRequest>\n';
    body += '      <ConfirmationHeader type="' + confType + '" confirmID="' + escXml(soNumber || ('CONF-' + bakPO)) + '" noticeDate="' + (bakDate ? fmtDate(bakDate) : now.slice(0,10)) + 'T00:00:00-00:00">\n';
    body += '        <DocumentReference payloadID="' + escXml(bakPO) + '@buyer.com"/>\n';

    /* Ship-From address from N1*SF + N3 + N4 */
    var allRawSegsOc = segs;
    var n1OcSegs = getAllSegs('N1');
    n1OcSegs.forEach(function(n1) {
      var qual = n1.elements[1] || '';
      if (qual === 'SF') {
        body += '        <Contact role="shipFrom">\n';
        body += '          <Name xml:lang="en">' + escXml(n1.elements[2] || '') + '</Name>\n';
        /* PER after SF N1 */
        var sfIdx = segs.indexOf(n1);
        for (var pp = sfIdx + 1; pp < segs.length && pp <= sfIdx + 4; pp++) {
          if (segs[pp].id === 'PER') {
            for (var cp = 3; cp < segs[pp].elements.length - 1; cp += 2) {
              var cqp = segs[pp].elements[cp] || '';
              var cvp = segs[pp].elements[cp + 1] || '';
              if (cqp === 'TE') body += '          <Phone><TelephoneNumber><CountryCode isoCountryCode="US">1</CountryCode><AreaOrCityCode/><Number>' + escXml(cvp) + '</Number></TelephoneNumber></Phone>\n';
              else if (cqp === 'EM') body += '          <Email preferredLang="en">' + escXml(cvp) + '</Email>\n';
            }
            break;
          }
          if (segs[pp].id === 'N1' || segs[pp].id === 'PO1') break;
        }
        body += '          <PostalAddress>\n';
        var n3oc = null, n4oc = null;
        for (var oc = sfIdx + 1; oc < segs.length && oc <= sfIdx + 3; oc++) {
          if (segs[oc].id === 'N3') n3oc = segs[oc];
          else if (segs[oc].id === 'N4') n4oc = segs[oc];
          else if (segs[oc].id === 'N1' || segs[oc].id === 'PO1') break;
        }
        if (n3oc) body += '            <Street>' + escXml(n3oc.elements[1] || '') + '</Street>\n';
        if (n4oc) {
          body += '            <City>' + escXml(n4oc.elements[1] || '') + '</City>\n';
          body += '            <State>' + escXml(n4oc.elements[2] || '') + '</State>\n';
          body += '            <PostalCode>' + escXml(n4oc.elements[3] || '') + '</PostalCode>\n';
          body += '            <Country isoCountryCode="' + escXml(n4oc.elements[4] || 'US') + '">' + escXml(n4oc.elements[4] || 'US') + '</Country>\n';
        }
        body += '          </PostalAddress>\n';
        body += '        </Contact>\n';
      }
    });

    /* REF extrinsics */
    var refOcSegs = getAllSegs('REF');
    refOcSegs.forEach(function(ref) {
      body += '        <Extrinsic name="REF-' + escXml(ref.elements[1] || '') + '">' + escXml(ref.elements[2] || '') + '</Extrinsic>\n';
    });

    /* General notes */
    var genNotesOc = segs.filter(function(s) { return s.id === 'NTE' && s.elements[1] === 'GEN'; });
    if (genNotesOc.length > 0) body += '        <Comments xml:lang="en">' + escXml(genNotesOc.map(function(n) { return n.elements[2] || ''; }).join(' ')) + '</Comments>\n';
    else body += '        <Comments xml:lang="en">Generated by AIA from EDI 855</Comments>\n';

    body += '      </ConfirmationHeader>\n';

    /* Line items: PO1 + ACK + PID + DTM + NTE*LIN */
    var po1OcSegs = getAllSegs('PO1');
    po1OcSegs.forEach(function(po1, idx) {
      var lineNum = po1.elements[1] || String(idx + 1);
      var qty = po1.elements[2] || '1';
      var uom = po1.elements[3] || 'EA';
      var price = po1.elements[4] || '0.00';
      var po1Idx = segs.indexOf(po1);

      /* Find PID description */
      var desc = '';
      for (var d = po1Idx + 1; d < segs.length && d <= po1Idx + 4; d++) {
        if (segs[d].id === 'PID') { desc = segs[d].elements[5] || ''; break; }
        if (segs[d].id === 'PO1') break;
      }

      /* Find ACK */
      var ackType = 'accept', ackQty = qty, ackDate = '';
      for (var a = po1Idx + 1; a < segs.length && a <= po1Idx + 5; a++) {
        if (segs[a].id === 'ACK') {
          var ac = segs[a].elements[1] || 'IA';
          ackType = ac === 'IA' ? 'accept' : ac === 'IB' ? 'backordered' : ac === 'IR' ? 'reject' : ac === 'IC' ? 'detail' : 'accept';
          ackQty = segs[a].elements[2] || qty;
          ackDate = segs[a].elements[8] || '';
          break;
        }
        if (segs[a].id === 'PO1') break;
      }

      /* Find DTM*011 (estimated ship date) */
      for (var dt = po1Idx + 1; dt < segs.length && dt <= po1Idx + 6; dt++) {
        if (segs[dt].id === 'DTM' && segs[dt].elements[1] === '011') { ackDate = segs[dt].elements[2] || ackDate; break; }
        if (segs[dt].id === 'PO1') break;
      }

      /* Find NTE*LIN */
      var lineNote = '';
      for (var ln = po1Idx + 1; ln < segs.length && ln <= po1Idx + 7; ln++) {
        if (segs[ln].id === 'NTE' && segs[ln].elements[1] === 'LIN') { lineNote = segs[ln].elements[2] || ''; break; }
        if (segs[ln].id === 'PO1') break;
      }

      body += '      <ConfirmationItem lineNumber="' + lineNum + '" quantity="' + qty + '">\n';
      body += '        <ConfirmationStatus type="' + ackType + '" quantity="' + ackQty + '"';
      if (ackDate) body += ' deliveryDate="' + fmtDate(ackDate) + 'T00:00:00-00:00"';
      body += '/>\n';
      body += '        <ItemIn>\n';
      body += '          <ItemID>\n';
      body += '            <SupplierPartID>' + escXml(getPartId(po1.elements, 'VP')) + '</SupplierPartID>\n';
      var bpOc = getPartId(po1.elements, 'BP');
      if (bpOc) body += '            <BuyerPartID>' + escXml(bpOc) + '</BuyerPartID>\n';
      body += '          </ItemID>\n';
      if (desc) body += '          <Description xml:lang="en">' + escXml(desc) + '</Description>\n';
      body += '        </ItemIn>\n';
      body += '        <UnitOfMeasure>' + uom + '</UnitOfMeasure>\n';
      body += '        <UnitPrice><Money currency="USD">' + price + '</Money></UnitPrice>\n';
      if (lineNote) body += '        <Comments xml:lang="en">' + escXml(lineNote) + '</Comments>\n';
      body += '      </ConfirmationItem>\n';
    });
    body += '    </ConfirmationRequest>\n';

  /* ══════════════════════════════════════════════════════════════
     ASN — 856 → ShipNoticeRequest
     Segments: BSN, DTM, HL, TD1, TD5, REF, N1/N3/N4, PER, NTE, PRF, MAN, LIN, SN1, PID
     ══════════════════════════════════════════════════════════════ */
  } else if (docType === 'asn') {
    var bsnId = getField('BSN', 2) || 'ASN-UNKNOWN';
    var bsnDate = getField('BSN', 3) || '';
    var bsnDateFmt = bsnDate ? fmtDate(bsnDate) : now.slice(0,10);

    /* DTM dates */
    var shipDate = '', delivDate2 = '';
    getAllSegs('DTM').forEach(function(dtm) {
      if (dtm.elements[1] === '011') shipDate = dtm.elements[2] || '';
      if (dtm.elements[1] === '002') delivDate2 = dtm.elements[2] || '';
    });

    body = '    <ShipNoticeRequest>\n';
    body += '      <ShipNoticeHeader shipmentID="' + escXml(bsnId) + '" noticeDate="' + bsnDateFmt + 'T00:00:00-00:00"';
    if (shipDate) body += ' shipmentDate="' + fmtDate(shipDate) + 'T00:00:00-00:00"';
    if (delivDate2) body += ' deliveryDate="' + fmtDate(delivDate2) + 'T00:00:00-00:00"';
    body += '>\n';

    /* Ship-From and Ship-To from N1+N3+N4 */
    var allRawSegsAsn = segs;
    getAllSegs('N1').forEach(function(n1) {
      var qual = n1.elements[1] || '';
      if (qual === 'SF') {
        body += '        <Contact role="shipFrom">\n';
        body += '          <Name xml:lang="en">' + escXml(n1.elements[2] || '') + '</Name>\n';
        /* PER contact */
        var sfIdx2 = segs.indexOf(n1);
        for (var pp2 = sfIdx2 + 1; pp2 < segs.length && pp2 <= sfIdx2 + 5; pp2++) {
          if (segs[pp2].id === 'PER') {
            for (var cp2 = 3; cp2 < segs[pp2].elements.length - 1; cp2 += 2) {
              var cq2 = segs[pp2].elements[cp2] || '';
              var cv2 = segs[pp2].elements[cp2 + 1] || '';
              if (cq2 === 'TE') body += '          <Phone><TelephoneNumber><CountryCode isoCountryCode="US">1</CountryCode><AreaOrCityCode/><Number>' + escXml(cv2) + '</Number></TelephoneNumber></Phone>\n';
              else if (cq2 === 'EM') body += '          <Email preferredLang="en">' + escXml(cv2) + '</Email>\n';
            }
            break;
          }
          if (segs[pp2].id === 'N1' || segs[pp2].id === 'HL') break;
        }
        body += '          <PostalAddress>\n';
        var n3sf = null, n4sf = null;
        for (var sf = sfIdx2 + 1; sf < segs.length && sf <= sfIdx2 + 3; sf++) {
          if (segs[sf].id === 'N3') n3sf = segs[sf];
          else if (segs[sf].id === 'N4') n4sf = segs[sf];
          else if (segs[sf].id === 'N1' || segs[sf].id === 'PER' || segs[sf].id === 'HL') break;
        }
        if (n3sf) {
          body += '            <Street>' + escXml(n3sf.elements[1] || '') + '</Street>\n';
          if (n3sf.elements[2]) body += '            <Street>' + escXml(n3sf.elements[2]) + '</Street>\n';
        }
        if (n4sf) {
          body += '            <City>' + escXml(n4sf.elements[1] || '') + '</City>\n';
          body += '            <State>' + escXml(n4sf.elements[2] || '') + '</State>\n';
          body += '            <PostalCode>' + escXml(n4sf.elements[3] || '') + '</PostalCode>\n';
          body += '            <Country isoCountryCode="' + escXml(n4sf.elements[4] || 'US') + '">' + escXml(n4sf.elements[4] || 'US') + '</Country>\n';
        }
        body += '          </PostalAddress>\n';
        body += '        </Contact>\n';
      }
      if (qual === 'ST') {
        body += '        <Contact role="shipTo">\n';
        body += '          <Name xml:lang="en">' + escXml(n1.elements[2] || '') + '</Name>\n';
        var stIdx = segs.indexOf(n1);
        var n3st = null, n4st = null;
        for (var st = stIdx + 1; st < segs.length && st <= stIdx + 3; st++) {
          if (segs[st].id === 'N3') n3st = segs[st];
          else if (segs[st].id === 'N4') n4st = segs[st];
          else if (segs[st].id === 'N1' || segs[st].id === 'HL') break;
        }
        body += '          <PostalAddress>\n';
        if (n3st) {
          body += '            <Street>' + escXml(n3st.elements[1] || '') + '</Street>\n';
          if (n3st.elements[2]) body += '            <Street>' + escXml(n3st.elements[2]) + '</Street>\n';
        }
        if (n4st) {
          body += '            <City>' + escXml(n4st.elements[1] || '') + '</City>\n';
          body += '            <State>' + escXml(n4st.elements[2] || '') + '</State>\n';
          body += '            <PostalCode>' + escXml(n4st.elements[3] || '') + '</PostalCode>\n';
          body += '            <Country isoCountryCode="' + escXml(n4st.elements[4] || 'US') + '">' + escXml(n4st.elements[4] || 'US') + '</Country>\n';
        }
        body += '          </PostalAddress>\n';
        body += '        </Contact>\n';
      }
    });

    /* TD1 packaging */
    var td1 = segs.find(function(s) { return s.id === 'TD1'; });
    if (td1) {
      body += '        <Packaging>\n';
      body += '          <PackagingCode>' + escXml(td1.elements[1] || 'CTN') + '</PackagingCode>\n';
      body += '          <PackageCount>' + escXml(td1.elements[2] || '1') + '</PackageCount>\n';
      body += '        </Packaging>\n';
    }

    /* TD5 carrier + REF*BM BOL */
    var td5Asn = segs.find(function(s) { return s.id === 'TD5'; });
    if (td5Asn) {
      body += '        <ShipControl>\n';
      body += '          <CarrierIdentifier domain="SCAC">' + escXml(td5Asn.elements[3] || '') + '</CarrierIdentifier>\n';
      var carrierName = td5Asn.elements[5] || '';
      if (carrierName) body += '          <CarrierIdentifier domain="carrierName">' + escXml(carrierName) + '</CarrierIdentifier>\n';
      var refBM = segs.find(function(s) { return s.id === 'REF' && s.elements[1] === 'BM'; });
      if (refBM) body += '          <ShipmentIdentifier trackingDomain="BOL">' + escXml(refBM.elements[2] || '') + '</ShipmentIdentifier>\n';
      var refCN = segs.find(function(s) { return s.id === 'REF' && s.elements[1] === 'CN'; });
      if (refCN) body += '          <ShipmentIdentifier trackingDomain="trackingNumber">' + escXml(refCN.elements[2] || '') + '</ShipmentIdentifier>\n';
      body += '        </ShipControl>\n';
    }

    /* General notes */
    var genNotesAsn = segs.filter(function(s) { return s.id === 'NTE' && s.elements[1] === 'GEN'; });
    if (genNotesAsn.length > 0) body += '        <Comments xml:lang="en">' + escXml(genNotesAsn.map(function(n) { return n.elements[2] || ''; }).join(' ')) + '</Comments>\n';

    body += '      </ShipNoticeHeader>\n';

    /* ShipNoticePortion — PO ref from PRF */
    body += '      <ShipNoticePortion>\n';
    var prfSeg = segs.find(function(s) { return s.id === 'PRF'; });
    if (prfSeg) body += '        <OrderReference orderID="' + escXml(prfSeg.elements[1] || '') + '"/>\n';

    /* Items from LIN + SN1 + PID + MAN + REF*BT */
    var linSegs = getAllSegs('LIN');
    var sn1Segs = getAllSegs('SN1');
    linSegs.forEach(function(lin, idx) {
      var linIdx = segs.indexOf(lin);
      var lineNum = lin.elements[1] || String(idx + 1);
      var qty = sn1Segs[idx] ? (sn1Segs[idx].elements[2] || '1') : '1';
      var uom = sn1Segs[idx] ? (sn1Segs[idx].elements[3] || 'EA') : 'EA';

      /* PID description */
      var desc = '';
      for (var d = linIdx + 1; d < segs.length && d <= linIdx + 4; d++) {
        if (segs[d].id === 'PID') { desc = segs[d].elements[5] || ''; break; }
        if (segs[d].id === 'LIN' || segs[d].id === 'HL') break;
      }

      /* MAN mark number (check HL parent pack) */
      var manNum = '';
      for (var m = linIdx - 1; m >= 0 && m >= linIdx - 5; m--) {
        if (segs[m].id === 'MAN') { manNum = segs[m].elements[2] || ''; break; }
        if (segs[m].id === 'LIN') break;
      }

      /* REF*BT batch */
      var batchRef = '';
      for (var br = linIdx + 1; br < segs.length && br <= linIdx + 5; br++) {
        if (segs[br].id === 'REF' && segs[br].elements[1] === 'BT') { batchRef = segs[br].elements[2] || ''; break; }
        if (segs[br].id === 'LIN' || segs[br].id === 'HL') break;
      }

      body += '        <ShipNoticeItem lineNumber="' + lineNum + '" quantity="' + qty + '">\n';
      body += '          <ItemID>\n';
      body += '            <SupplierPartID>' + escXml(getPartId(lin.elements, 'VP')) + '</SupplierPartID>\n';
      var bpAsn = getPartId(lin.elements, 'BP');
      if (bpAsn) body += '            <BuyerPartID>' + escXml(bpAsn) + '</BuyerPartID>\n';
      body += '          </ItemID>\n';
      if (desc) body += '          <Description xml:lang="en">' + escXml(desc) + '</Description>\n';
      body += '          <UnitOfMeasure>' + uom + '</UnitOfMeasure>\n';
      if (manNum) body += '          <Packaging><PackagingLevelCode>0001</PackagingLevelCode><ShippingContainerSerialCode>' + escXml(manNum) + '</ShippingContainerSerialCode></Packaging>\n';
      if (batchRef) body += '          <Batch><BuyerBatchID>' + escXml(batchRef) + '</BuyerBatchID></Batch>\n';
      body += '        </ShipNoticeItem>\n';
    });
    body += '      </ShipNoticePortion>\n';
    body += '    </ShipNoticeRequest>\n';

  /* ══════════════════════════════════════════════════════════════
     GR — 861 → ReceiptRequest
     Segments: BRA, REF, DTM, N1/N3/N4, PER, NTE, RCD, LIN, SN1, PID
     ══════════════════════════════════════════════════════════════ */
  } else if (docType === 'gr') {
    var grId = getField('BRA', 2) || 'GR-UNKNOWN';
    var grDate = getField('BRA', 3) || '';
    var grDateFmt = grDate ? fmtDate(grDate) : now.slice(0,10);

    body = '    <ReceiptRequest>\n';
    body += '      <ReceiptRequestHeader receiptDate="' + grDateFmt + 'T00:00:00-00:00">\n';

    /* REF*PO and REF*SI */
    var refPO = segs.find(function(s) { return s.id === 'REF' && s.elements[1] === 'PO'; });
    var refSI = segs.find(function(s) { return s.id === 'REF' && s.elements[1] === 'SI'; });
    if (refPO) body += '        <DocumentReference payloadID="' + escXml(refPO.elements[2] || '') + '@buyer.com"/>\n';
    if (refSI) body += '        <ShipNoticeIDInfo shipNoticeID="' + escXml(refSI.elements[2] || '') + '"/>\n';

    /* DTM*050 receipt datetime */
    var dtm050 = segs.find(function(s) { return s.id === 'DTM' && s.elements[1] === '050'; });
    if (dtm050) {
      var rDate = dtm050.elements[2] || '';
      var rTime = dtm050.elements[3] || '';
      body += '        <Extrinsic name="receiptDateTime">' + (rDate ? fmtDate(rDate) : '') + (rTime ? 'T' + rTime.slice(0,2) + ':' + rTime.slice(2,4) + ':00' : '') + '</Extrinsic>\n';
    }

    /* Receiving location N1*ST + N3 + N4 */
    var allRawSegsGr = segs;
    getAllSegs('N1').forEach(function(n1) {
      if (n1.elements[1] === 'ST') {
        body += '        <ReceivingAddress>\n            ' + buildAddress(n1, allRawSegsGr) + '\n        </ReceivingAddress>\n';
      }
    });

    /* PER contact */
    var perGr = segs.find(function(s) { return s.id === 'PER' && s.elements[1] === 'GR'; });
    if (perGr) body += buildContact(perGr, 'receivingContact');

    /* Dock location REF*ZZ */
    var refZZ = segs.find(function(s) { return s.id === 'REF' && s.elements[1] === 'ZZ'; });
    if (refZZ) body += '        <Extrinsic name="dockLocation">' + escXml(refZZ.elements[2] || '') + '</Extrinsic>\n';

    /* General notes */
    var genNotesGr = segs.filter(function(s) { return s.id === 'NTE' && s.elements[1] === 'GEN'; });
    if (genNotesGr.length > 0) body += '        <Comments xml:lang="en">' + escXml(genNotesGr.map(function(n) { return n.elements[2] || ''; }).join(' ')) + '</Comments>\n';
    else body += '        <Comments xml:lang="en">Generated by AIA from EDI 861</Comments>\n';

    body += '      </ReceiptRequestHeader>\n';

    /* ReceiptOrder */
    body += '      <ReceiptOrder>\n';
    if (refPO) body += '        <OrderReference orderID="' + escXml(refPO.elements[2] || '') + '"/>\n';

    /* Items from RCD + LIN + SN1 + PID + NTE*LIN + REF*BT */
    var rcdSegs = getAllSegs('RCD');
    var linGrSegs = getAllSegs('LIN');
    var sn1GrSegs = getAllSegs('SN1');
    var count = Math.max(rcdSegs.length, linGrSegs.length, sn1GrSegs.length, 1);

    for (var i = 0; i < count; i++) {
      var rcd = rcdSegs[i] || null;
      var linGr = linGrSegs[i] || null;
      var sn1Gr = sn1GrSegs[i] || null;
      var lineNum = sn1Gr ? (sn1Gr.elements[1] || String(i + 1)) : String(i + 1);
      var receivedQty = sn1Gr ? (sn1Gr.elements[2] || '1') : (rcd ? (rcd.elements[2] || '1') : '1');
      var rUom = sn1Gr ? (sn1Gr.elements[3] || 'EA') : 'EA';
      var damagedQty = rcd && rcd.elements[7] ? rcd.elements[7] : '';

      /* PID + NTE*LIN + REF*BT after LIN */
      var desc = '', lineNote = '', batchRef = '';
      if (linGr) {
        var liIdx = segs.indexOf(linGr);
        for (var d2 = liIdx + 1; d2 < segs.length && d2 <= liIdx + 6; d2++) {
          if (segs[d2].id === 'PID') desc = segs[d2].elements[5] || '';
          else if (segs[d2].id === 'NTE' && segs[d2].elements[1] === 'LIN') lineNote = segs[d2].elements[2] || '';
          else if (segs[d2].id === 'REF' && segs[d2].elements[1] === 'BT') batchRef = segs[d2].elements[2] || '';
          else if (segs[d2].id === 'RCD' || segs[d2].id === 'LIN') break;
        }
      }

      body += '        <ReceiptItem lineNumber="' + lineNum + '" quantity="' + receivedQty + '"';
      if (damagedQty) body += ' rejectedQuantity="' + damagedQty + '"';
      body += '>\n';
      if (linGr) {
        body += '          <ItemID>\n';
        body += '            <SupplierPartID>' + escXml(getPartId(linGr.elements, 'VP')) + '</SupplierPartID>\n';
        var bpGr = getPartId(linGr.elements, 'BP');
        if (bpGr) body += '            <BuyerPartID>' + escXml(bpGr) + '</BuyerPartID>\n';
        body += '          </ItemID>\n';
      }
      if (desc) body += '          <Description xml:lang="en">' + escXml(desc) + '</Description>\n';
      body += '          <UnitOfMeasure>' + rUom + '</UnitOfMeasure>\n';
      if (batchRef) body += '          <Batch><BuyerBatchID>' + escXml(batchRef) + '</BuyerBatchID></Batch>\n';
      if (damagedQty) body += '          <Status code="damaged" text="' + damagedQty + ' units damaged"/>\n';
      if (lineNote) body += '          <Comments xml:lang="en">' + escXml(lineNote) + '</Comments>\n';
      body += '        </ReceiptItem>\n';
    }

    body += '      </ReceiptOrder>\n';
    body += '    </ReceiptRequest>\n';

  /* ══════════════════════════════════════════════════════════════
     INV — 810 → InvoiceDetailRequest
     Segments: BIG, REF, NTE, N1/N3/N4, PER, ITD, IT1, PID, TXI, SAC, CAD, TDS, CTT
     ══════════════════════════════════════════════════════════════ */
  } else if (docType === 'inv') {
    var invNum = getField('BIG', 2) || 'INV-UNKNOWN';
    var invDate = getField('BIG', 1) || '';
    var invDateFmt = fmtDate(invDate);
    var poRef = getField('BIG', 4) || '';
    var currency = 'USD';

    body = '    <InvoiceDetailRequest>\n';
    body += '      <InvoiceDetailRequestHeader invoiceID="' + escXml(invNum) + '" invoiceDate="' + invDateFmt + 'T00:00:00-00:00" purpose="standard">\n';
    body += '        <InvoiceDetailHeaderIndicator/>\n';
    body += '        <InvoiceDetailLineIndicator/>\n';

    /* Partners from N1+N3+N4 */
    var allRawSegsInv = segs;
    getAllSegs('N1').forEach(function(n1) {
      var qual = n1.elements[1] || '';
      var role = qual === 'RI' ? 'remitTo' : qual === 'BT' ? 'billTo' : qual === 'SF' ? 'shipFrom' : qual === 'ST' ? 'soldTo' : '';
      if (role) {
        body += '        <InvoicePartner>\n';
        body += '          <Contact role="' + role + '">\n';
        body += '            <Name xml:lang="en">' + escXml(n1.elements[2] || '') + '</Name>\n';
        /* PER after this N1 */
        var n1Idx = segs.indexOf(n1);
        for (var pp3 = n1Idx + 1; pp3 < segs.length && pp3 <= n1Idx + 5; pp3++) {
          if (segs[pp3].id === 'PER') {
            for (var cp3 = 3; cp3 < segs[pp3].elements.length - 1; cp3 += 2) {
              var cq3 = segs[pp3].elements[cp3] || '';
              var cv3 = segs[pp3].elements[cp3 + 1] || '';
              if (cq3 === 'TE') body += '            <Phone><TelephoneNumber><CountryCode isoCountryCode="US">1</CountryCode><AreaOrCityCode/><Number>' + escXml(cv3) + '</Number></TelephoneNumber></Phone>\n';
              else if (cq3 === 'EM') body += '            <Email preferredLang="en">' + escXml(cv3) + '</Email>\n';
            }
            break;
          }
          if (segs[pp3].id === 'N1' || segs[pp3].id === 'IT1' || segs[pp3].id === 'ITD') break;
        }
        /* N3+N4 address */
        var n3inv = null, n4inv = null;
        for (var iv = n1Idx + 1; iv < segs.length && iv <= n1Idx + 3; iv++) {
          if (segs[iv].id === 'N3') n3inv = segs[iv];
          else if (segs[iv].id === 'N4') n4inv = segs[iv];
          else if (segs[iv].id === 'N1' || segs[iv].id === 'PER') break;
        }
        body += '            <PostalAddress>\n';
        if (n3inv) body += '              <Street>' + escXml(n3inv.elements[1] || '') + '</Street>\n';
        if (n4inv) {
          body += '              <City>' + escXml(n4inv.elements[1] || '') + '</City>\n';
          body += '              <State>' + escXml(n4inv.elements[2] || '') + '</State>\n';
          body += '              <PostalCode>' + escXml(n4inv.elements[3] || '') + '</PostalCode>\n';
          body += '              <Country isoCountryCode="' + escXml(n4inv.elements[4] || 'US') + '">' + escXml(n4inv.elements[4] || 'US') + '</Country>\n';
        }
        body += '            </PostalAddress>\n';
        body += '          </Contact>\n';
        body += '        </InvoicePartner>\n';
      }
    });

    /* Payment terms from ITD */
    var itdInv = segs.find(function(s) { return s.id === 'ITD'; });
    if (itdInv) {
      var termDescInv = itdInv.elements[9] || '';
      var discPctInv = itdInv.elements[3] || '';
      var netDaysInv = itdInv.elements[5] || '';
      body += '        <PaymentTerm payInNumberOfDays="' + netDaysInv + '">\n';
      if (discPctInv) body += '          <Discount><DiscountPercent percent="' + discPctInv + '"/></Discount>\n';
      body += '          <Extrinsic name="termDescription">' + escXml(termDescInv) + '</Extrinsic>\n';
      body += '        </PaymentTerm>\n';
    }

    /* REF extrinsics */
    getAllSegs('REF').forEach(function(ref) {
      body += '        <Extrinsic name="REF-' + escXml(ref.elements[1] || '') + '">' + escXml(ref.elements[2] || '') + '</Extrinsic>\n';
    });

    /* Document reference */
    if (poRef) body += '        <DocumentReference payloadID="' + escXml(poRef) + '@buyer.com"/>\n';

    /* General notes */
    var genNotesInv = segs.filter(function(s) { return s.id === 'NTE' && s.elements[1] === 'GEN'; });
    if (genNotesInv.length > 0) body += '        <Comments xml:lang="en">' + escXml(genNotesInv.map(function(n) { return n.elements[2] || ''; }).join(' ')) + '</Comments>\n';
    else body += '        <Comments xml:lang="en">Generated by AIA from EDI 810</Comments>\n';

    body += '      </InvoiceDetailRequestHeader>\n';

    /* InvoiceDetailOrder */
    body += '      <InvoiceDetailOrder>\n';
    body += '        <InvoiceDetailOrderInfo><OrderReference orderID="' + escXml(poRef) + '"/></InvoiceDetailOrderInfo>\n';

    /* Line items from IT1 + PID + TXI + NTE*LIN */
    var it1Segs = getAllSegs('IT1');
    it1Segs.forEach(function(it1, idx) {
      var lineNum = it1.elements[1] || String(idx + 1);
      var qty = it1.elements[2] || '1';
      var uom = it1.elements[3] || 'EA';
      var price = it1.elements[4] || '0.00';
      var it1Idx = segs.indexOf(it1);

      /* PID description */
      var desc = '';
      for (var d3 = it1Idx + 1; d3 < segs.length && d3 <= it1Idx + 4; d3++) {
        if (segs[d3].id === 'PID') { desc = segs[d3].elements[5] || ''; break; }
        if (segs[d3].id === 'IT1') break;
      }

      /* TXI tax */
      var taxAmt = '', taxRate = '';
      for (var t3 = it1Idx + 1; t3 < segs.length && t3 <= it1Idx + 5; t3++) {
        if (segs[t3].id === 'TXI') { taxAmt = segs[t3].elements[2] || ''; taxRate = segs[t3].elements[6] || ''; break; }
        if (segs[t3].id === 'IT1') break;
      }

      /* NTE*LIN */
      var lineNote = '';
      for (var ln2 = it1Idx + 1; ln2 < segs.length && ln2 <= it1Idx + 6; ln2++) {
        if (segs[ln2].id === 'NTE' && segs[ln2].elements[1] === 'LIN') { lineNote = segs[ln2].elements[2] || ''; break; }
        if (segs[ln2].id === 'IT1') break;
      }

      var subtotal = (parseFloat(qty) * parseFloat(price)).toFixed(2);
      body += '        <InvoiceDetailItem invoiceLineNumber="' + lineNum + '" quantity="' + qty + '">\n';
      body += '          <InvoiceDetailItemReference lineNumber="' + lineNum + '">\n';
      body += '            <ItemID>\n';
      body += '              <SupplierPartID>' + escXml(getPartId(it1.elements, 'VP')) + '</SupplierPartID>\n';
      var bpInv = getPartId(it1.elements, 'BP');
      if (bpInv) body += '              <BuyerPartID>' + escXml(bpInv) + '</BuyerPartID>\n';
      body += '            </ItemID>\n';
      if (desc) body += '            <Description xml:lang="en">' + escXml(desc) + '</Description>\n';
      body += '          </InvoiceDetailItemReference>\n';
      body += '          <UnitOfMeasure>' + uom + '</UnitOfMeasure>\n';
      body += '          <UnitPrice><Money currency="' + currency + '">' + price + '</Money></UnitPrice>\n';
      body += '          <SubtotalAmount><Money currency="' + currency + '">' + subtotal + '</Money></SubtotalAmount>\n';
      if (taxAmt) {
        body += '          <Tax>\n';
        body += '            <Money currency="' + currency + '">' + taxAmt + '</Money>\n';
        body += '            <Description xml:lang="en">Sales Tax' + (taxRate ? ' (' + taxRate + '%)' : '') + '</Description>\n';
        body += '          </Tax>\n';
      }
      if (lineNote) body += '          <Comments xml:lang="en">' + escXml(lineNote) + '</Comments>\n';
      body += '        </InvoiceDetailItem>\n';
    });
    body += '      </InvoiceDetailOrder>\n';

    /* Summary: TDS, SAC, TXI*TX, CAD */
    var tds = getField('TDS', 1) || '0';
    var totalAmt = (parseFloat(tds) / 100).toFixed(2); /* TDS is in cents */
    var subtotalItems = it1Segs.reduce(function(sum, it1) {
      return sum + (parseFloat(it1.elements[2] || 1) * parseFloat(it1.elements[4] || 0));
    }, 0).toFixed(2);

    /* SAC charges */
    var sacSegs = getAllSegs('SAC');
    var sacTotal = 0;
    var sacXml = '';
    sacSegs.forEach(function(sac) {
      var sacType = sac.elements[1] || 'C'; /* C=charge, A=allowance */
      var sacCode = sac.elements[2] || '';
      var sacAmt = sac.elements[5] ? (parseFloat(sac.elements[5]) / 100).toFixed(2) : '0.00';
      sacTotal += parseFloat(sacAmt);
      sacXml += '        <InvoiceDetailDiscount>\n';
      sacXml += '          <Money currency="' + currency + '">' + (sacType === 'A' ? '-' : '') + sacAmt + '</Money>\n';
      sacXml += '        </InvoiceDetailDiscount>\n';
    });

    /* Summary-level TXI */
    var txiSummary = segs.find(function(s) { return s.id === 'TXI' && s.elements[1] === 'TX'; });
    var summaryTax = txiSummary ? (txiSummary.elements[2] || '0.00') : '0.00';
    var summaryTaxRate = txiSummary ? (txiSummary.elements[6] || '') : '';

    body += '      <InvoiceDetailSummary>\n';
    body += '        <SubtotalAmount><Money currency="' + currency + '">' + subtotalItems + '</Money></SubtotalAmount>\n';
    body += '        <Tax>\n';
    body += '          <Money currency="' + currency + '">' + summaryTax + '</Money>\n';
    if (summaryTaxRate) body += '          <Description xml:lang="en">Total Tax (' + summaryTaxRate + '%)</Description>\n';
    body += '        </Tax>\n';
    if (sacXml) body += sacXml;
    if (sacTotal > 0) body += '        <SpecialHandlingAmount><Money currency="' + currency + '">' + sacTotal.toFixed(2) + '</Money></SpecialHandlingAmount>\n';
    body += '        <GrossAmount><Money currency="' + currency + '">' + totalAmt + '</Money></GrossAmount>\n';
    body += '        <NetAmount><Money currency="' + currency + '">' + totalAmt + '</Money></NetAmount>\n';
    body += '        <DueAmount><Money currency="' + currency + '">' + totalAmt + '</Money></DueAmount>\n';
    body += '      </InvoiceDetailSummary>\n';
    body += '    </InvoiceDetailRequest>\n';
  }

  return header + body + footer;
}

function escXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getPartId(elements, qualifier) {
  /* Search PO1/IT1/LIN element pairs for qualifier+value */
  for (var i = 5; i < elements.length - 1; i += 2) {
    if (elements[i] === qualifier) return elements[i + 1] || '';
  }
  return '';
}

/* Wire EDI upload slots */
function initEdiUpload() {
  var docTypes = ['po', 'poc', 'oc', 'asn', 'gr', 'inv'];
  docTypes.forEach(function(docType) {
    var fileInput = document.getElementById('edi-file-' + docType);
    var dropZone = document.querySelector('#edi-slot-' + docType + ' .cxml-upload-drop');
    if (!fileInput || !dropZone) return;

    dropZone.addEventListener('click', function() { fileInput.click(); });

    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) handleEdiFileSelected(docType, fileInput.files[0]);
    });

    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleEdiFileSelected(docType, e.dataTransfer.files[0]);
      }
    });
  });

  var convertBtn = document.getElementById('edi-convert-btn');
  if (convertBtn) convertBtn.addEventListener('click', ediGuideDownloadExcel);

  var filesBtn = document.getElementById('edi-download-files-btn');
  if (filesBtn) filesBtn.addEventListener('click', ediDownloadAsEdiFiles);
}

function handleEdiFileSelected(docType, file) {
  ediFiles[docType] = file;
  var drop = document.querySelector('#edi-slot-' + docType + ' .cxml-upload-drop');
  var status = document.getElementById('edi-status-' + docType);
  drop.classList.add('has-file');
  var truncName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
  status.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px">check_circle</span> ' + truncName;
  updateEdiUploadSummary();
}

function updateEdiUploadSummary() {
  var count = Object.values(ediFiles).filter(function(f) { return f !== null; }).length;
  var summaryEl = document.getElementById('edi-upload-summary');
  var countEl = document.getElementById('edi-upload-count');
  var convertBtn = document.getElementById('edi-convert-btn');
  var cxmlBtn = document.getElementById('edi-download-cxml-btn');
  if (count > 0) {
    summaryEl.style.display = 'block';
    countEl.textContent = count;
    convertBtn.disabled = false;
    cxmlBtn.disabled = false;
  } else {
    summaryEl.style.display = 'none';
    convertBtn.disabled = true;
    cxmlBtn.disabled = true;
  }
}

/* EDI Guide — Download Excel (strict, no masking/modification) */
function ediGuideDownloadExcel() {
  var convertBtn = document.getElementById('edi-convert-btn');
  var progressEl = document.getElementById('edi-convert-progress');
  var progFill = document.getElementById('edi-conv-prog-fill');
  var progText = document.getElementById('edi-conv-prog-text');
  var progPct = document.getElementById('edi-conv-prog-pct');

  convertBtn.disabled = true;
  convertBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_empty</span> Generating...';
  progressEl.style.display = 'block';

  var uploadedTypes = Object.keys(ediFiles).filter(function(k) { return ediFiles[k] !== null; });
  var totalSteps = uploadedTypes.length + 1;
  var currentStep = 0;

  function updateProgress(text) {
    currentStep++;
    var pct = Math.round((currentStep / totalSteps) * 100);
    progFill.style.width = pct + '%';
    progText.textContent = text;
    progPct.textContent = pct + '%';
  }

  var readPromises = uploadedTypes.map(function(docType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var content = e.target.result;
        var inputType = EdiGuideEngine.detectInputType(content);
        var ediContent = content;

        // If input is cXML, convert to EDI strictly (no masking)
        if (inputType === 'cxml') {
          ediContent = EdiGuideEngine.convertCxmlToEdi(docType, content);
        }

        // Parse EDI (preserves all segments/qualifiers byte-for-byte)
        var parsed = EdiGuideEngine.parseEdi(ediContent);
        updateProgress('Parsed ' + CXML_DOC_LABELS[docType]);
        resolve({ docType: docType, parsed: parsed, inputType: inputType });
      };
      reader.onerror = function() { resolve({ docType: docType, parsed: { segments: [], raw: '' }, inputType: 'unknown' }); };
      reader.readAsText(ediFiles[docType]);
    });
  });

  Promise.all(readPromises).then(function(results) {
    updateProgress('Generating Excel workbook...');
    var wb = XLSX.utils.book_new();
    var TAB_COLORS = { po: '0070FF', poc: '7B2D8B', oc: '00B050', asn: 'FF9900', gr: '9933FF', inv: 'FF0000' };

    results.forEach(function(result) {
      var docType = result.docType;
      var parsed = result.parsed;

      // Generate guide rows: [raw_segment, explanation]
      var guideRows = EdiGuideEngine.generateGuideRows(parsed);

      /* Build sheet data — 3 columns: EDI Segment | Explanation | SAP Standard Reference */
      var sheetData = [
        ['EDI Segment', 'Explanation', EdiGuideEngine.SAP_GUIDE_URL]
      ];
      guideRows.forEach(function(row) {
        var segId = (row[0] || '').split('*')[0].split('~')[0].trim().toUpperCase();
        var ref = EdiGuideEngine.getSegmentRef(segId, docType);
        sheetData.push([row[0], row[1], ref]);
      });

      var ws = XLSX.utils.aoa_to_sheet(sheetData);

      /* Styles */
      var allBorder = {
        top: { style: 'thin', color: { rgb: 'BFBFBF' } },
        bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
        left: { style: 'thin', color: { rgb: 'BFBFBF' } },
        right: { style: 'thin', color: { rgb: 'BFBFBF' } }
      };
      var headerBorder = {
        top: { style: 'thin', color: { rgb: 'BFBFBF' } },
        bottom: { style: 'medium', color: { rgb: '1F4E79' } },
        left: { style: 'thin', color: { rgb: 'BFBFBF' } },
        right: { style: 'thin', color: { rgb: 'BFBFBF' } }
      };
      var headerStyle = {
        font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: headerBorder
      };
      var headerLinkStyle = {
        font: { name: 'Calibri', sz: 11, bold: true, underline: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: headerBorder
      };

      function makeRowStyle(isOdd) {
        var bgColor = isOdd ? 'F2F7FB' : 'FFFFFF';
        return {
          font: { name: 'Consolas', sz: 10, color: { rgb: '1A1A1A' } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
          border: allBorder
        };
      }
      function makeExplStyle(isOdd) {
        var bgColor = isOdd ? 'F2F7FB' : 'FFFFFF';
        return {
          font: { name: 'Calibri', sz: 10, color: { rgb: '333333' } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
          border: allBorder
        };
      }
      function makeRefStyle(isOdd) {
        var bgColor = isOdd ? 'F2F7FB' : 'FFFFFF';
        return {
          font: { name: 'Calibri', sz: 10, color: { rgb: '0563C1' } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          border: allBorder
        };
      }

      var range = XLSX.utils.decode_range(ws['!ref']);
      if (ws['A1']) ws['A1'].s = headerStyle;
      if (ws['B1']) ws['B1'].s = headerStyle;
      if (ws['C1']) {
        ws['C1'].s = headerLinkStyle;
        ws['C1'].l = { Target: EdiGuideEngine.SAP_GUIDE_URL, Tooltip: 'SAP ANSI X12 4010 Implementation Guides' };
      }

      for (var r = 1; r <= range.e.r; r++) {
        var rowNum = r + 1;
        var cellA = ws['A' + rowNum];
        var cellB = ws['B' + rowNum];
        var cellC = ws['C' + rowNum];
        var isOdd = r % 2 === 1;
        if (cellA) cellA.s = makeRowStyle(isOdd);
        if (cellB) cellB.s = makeExplStyle(isOdd);
        if (cellC) cellC.s = makeRefStyle(isOdd);
      }

      ws['!cols'] = [{ wch: 90 }, { wch: 110 }, { wch: 40 }];
      ws['!rows'] = [{ hpx: 32 }];
      ws['!sheetPr'] = { tabColor: { rgb: TAB_COLORS[docType] || '0070FF' } };

      var sheetName = CXML_DOC_LABELS[docType].substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    var filename = 'AIA_EDI_Guide_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.xlsx';
    downloadXlsxBlob(wb, filename);

    convertBtn.disabled = false;
    convertBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">download</span> Download EDI Guide (Excel)';
    setTimeout(function() { progressEl.style.display = 'none'; }, 2000);
    progFill.style.width = '100%';
    progText.textContent = 'Download complete!';
    progPct.textContent = '100%';
  });
}

/* EDI Guide — Download as separate EDI files (strict output) */
function ediDownloadAsEdiFiles() {
  var uploadedTypes = Object.keys(ediFiles).filter(function(k) { return ediFiles[k] !== null; });
  if (uploadedTypes.length === 0) return;

  var EDI_FILENAMES = {
    po: 'EDI_850_PurchaseOrder.edi',
    poc: 'EDI_860_POChange.edi',
    oc: 'EDI_855_OrderConfirmation.edi',
    asn: 'EDI_856_ASN.edi',
    gr: 'EDI_861_GoodsReceipt.edi',
    inv: 'EDI_810_Invoice.edi'
  };

  var readPromises = uploadedTypes.map(function(docType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var content = e.target.result;
        var inputType = EdiGuideEngine.detectInputType(content);
        var ediContent = content;

        // If input is cXML, convert to EDI strictly (no masking)
        if (inputType === 'cxml') {
          ediContent = EdiGuideEngine.convertCxmlToEdi(docType, content);
        }
        // If input is EDI, use as-is (byte-for-byte)
        resolve({ docType: docType, content: ediContent });
      };
      reader.onerror = function() { resolve({ docType: docType, content: '' }); };
      reader.readAsText(ediFiles[docType]);
    });
  });

  Promise.all(readPromises).then(function(results) {
    if (results.length === 1) {
      // Single file: direct download
      var r = results[0];
      if (!r.content) return;
      var blob = new Blob([r.content], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = EDI_FILENAMES[r.docType] || 'output.edi';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Multiple files: ZIP download
      var zip = new JSZip();
      results.forEach(function(r) {
        if (r.content) zip.file(EDI_FILENAMES[r.docType], r.content);
      });
      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'AIA_EDI_Files_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.zip';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  });
}

/* ===== cXML → Download as separate EDI files ===== */
function initCxmlEdiDownload() {
  var btn = document.getElementById('cxml-download-edi-btn');
  if (!btn) return;
  btn.addEventListener('click', cxmlDownloadAsEdiFiles);
}

function generateEdiFromCxml(docType, xmlText) {
   /* ========================================================================
      AIA Mapping Knowledge Base — Deterministic cXML→EDI Rules Engine
      Reads from localStorage (aia_mkb_config) at runtime; falls back to defaults
      ======================================================================== */

   var mkbConfig = (function() {
     var defaults = {
       uomCxmlToX12: {"EA":"EA","PCE":"EA","PC":"EA","LTR":"LT","LT":"LT","GAL":"GA","ML":"ML","KGM":"KG","KG":"KG","GRM":"GR","GM":"GR","LBS":"LB","LB":"LB","OZ":"OZ","TON":"TN","MTR":"MT","MT":"MT","FT":"FT","IN":"IN","CM":"CM","MM":"MM","YD":"YD","MI":"MI","BX":"BX","CS":"CS","PK":"PK","PA":"PA","BG":"BG","RL":"RL","DZ":"DZ","CT":"CT","PR":"PR","SET":"ST","HR":"HR","DA":"DA","MO":"MO","SQM":"SM","SQF":"SF","CBM":"CI","CFT":"CF","PLT":"PL","DRM":"DR","BAG":"BG","BTL":"BO","CAN":"CA","JAR":"JR"},
       refQualifiers: {"CompanyCode":"CO","PurchaseGroup":"PG","PurchaseOrganization":"8X","partyAdditionalID":"VR","Requester":"ZZ","Ariba.invoicingAllowed":"ZZ","Ariba.availableAmount":"ZZ","AribaNetwork.PaymentTermsExplanation":"ZZ","payloadID":"ZZ","SystemID":"ZZ","ERPCommodityCode":"ZZ","AccountCategory":"ZZ","ReceivingType":"ZZ","extLineNumber":"ZZ","storageLocationID":"WH","buyerLocationID":"92"},
       decisions: { priceHandling:'always_per_unit', emptyFields:'preserve', isaFormat:'strict_fixed_width', phoneFormat:'raw_digits', sapExtrinsics:'REF_ZZ', controlKeys:'N9_MSG', segmentTerminator:'\\n', elementSeparator:'*', deploymentModeToISA15:true, includeAMTBeforeCTT:true, supplierN1Qualifier:'SE', ediVersion:'004010', isaRepetitionSeparator:'U' },
       n1Qualifiers: { ShipTo:'ST', BillTo:'BT', soldTo:'SO', supplierCorporate:'SE', buyFrom:'VN', shipFrom:'SF', remitTo:'RE' },
       docTypeConfig: { po:{stCode:'850',gsCode:'PO',begPurpose:'00',begType:'NE'}, oc:{stCode:'855',gsCode:'PR',bakPurpose:'06'}, asn:{stCode:'856',gsCode:'SH'}, gr:{stCode:'861',gsCode:'RC'}, inv:{stCode:'810',gsCode:'IN'} }
     };
     try {
       var stored = localStorage.getItem('aia_mkb_config');
       if (stored) {
         var parsed = JSON.parse(stored);
         return {
           uomCxmlToX12: parsed.uomCxmlToX12 || defaults.uomCxmlToX12,
           refQualifiers: (function() {
             /* Editor stores {key:{qualifier,description}} — flatten to {key:qualifier} for engine */
             var raw = parsed.refQualifiers || {};
             var flat = {};
             for (var k in raw) { flat[k] = typeof raw[k] === 'object' ? raw[k].qualifier : raw[k]; }
             return flat;
           })(),
           decisions: parsed.decisions || defaults.decisions,
           n1Qualifiers: parsed.n1Qualifiers || defaults.n1Qualifiers,
           docTypeConfig: parsed.docTypeConfig || defaults.docTypeConfig
         };
       }
     } catch(e) { /* fall through to defaults */ }
     return { uomCxmlToX12: defaults.uomCxmlToX12, refQualifiers: defaults.refQualifiers, decisions: defaults.decisions, n1Qualifiers: defaults.n1Qualifiers, docTypeConfig: defaults.docTypeConfig };
   })();

   var MKB_UOM = mkbConfig.uomCxmlToX12;
   var MKB_REF = mkbConfig.refQualifiers;
   var MKB_DECISIONS = mkbConfig.decisions;
   var MKB_N1 = mkbConfig.n1Qualifiers;
   var MKB_DOCTYPE = mkbConfig.docTypeConfig;

  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, 'text/xml');

  /* --- Utility functions --- */
  function getText(el, tag) {
    if (!el) return '';
    var found = el.getElementsByTagName(tag);
    return found.length > 0 ? (found[0].textContent || '').trim() : '';
  }
  function getAttr(el, tag, attr) {
    if (!el) return '';
    var found = el.getElementsByTagName(tag);
    return found.length > 0 ? (found[0].getAttribute(attr) || '') : '';
  }
  function getDirectAttr(el, attr) {
    return el ? (el.getAttribute(attr) || '') : '';
  }
  function pad(s, n) { s = s || ''; while (s.length < n) s += ' '; return s.substring(0, n); }
  function convertUom(cxmlUom) { return MKB_UOM[cxmlUom] || MKB_UOM[cxmlUom.toUpperCase()] || cxmlUom.substring(0,2).toUpperCase(); }
  function rawDigits(phone) { return (phone || '').replace(/[^0-9]/g, ''); }
  function dateOnly(isoStr) { return (isoStr || '').replace(/[^0-9]/g, '').substring(0, 8); }
  function getAllByTag(el, tag) { return el ? Array.prototype.slice.call(el.getElementsByTagName(tag)) : []; }
  function getFirstByTag(el, tag) { var a = el.getElementsByTagName(tag); return a.length > 0 ? a[0] : null; }
  function getIdRef(el, domain) {
    var refs = getAllByTag(el, 'IdReference');
    for (var i = 0; i < refs.length; i++) {
      if (refs[i].getAttribute('domain') === domain) return refs[i].getAttribute('identifier') || '';
    }
    return '';
  }

  /* --- Extract envelope info --- */
  var fromEl = getFirstByTag(doc, 'From');
  var toEl = getFirstByTag(doc, 'To');
  var senderEl = getFirstByTag(doc, 'Sender');
  var cxmlRoot = doc.getElementsByTagName('cXML')[0];

  /* Get NetworkID specifically (not SystemID) */
  var fromId = '', toId = '', systemId = '';
  if (fromEl) {
    var fromCreds = getAllByTag(fromEl, 'Credential');
    for (var fc = 0; fc < fromCreds.length; fc++) {
      var dom = fromCreds[fc].getAttribute('domain');
      if (dom === 'NetworkID') fromId = getText(fromCreds[fc], 'Identity');
      if (dom === 'SystemID') systemId = getText(fromCreds[fc], 'Identity');
    }
  }
  if (toEl) {
    var toCreds = getAllByTag(toEl, 'Credential');
    for (var tc = 0; tc < toCreds.length; tc++) {
      if (toCreds[tc].getAttribute('domain') === 'NetworkID') toId = getText(toCreds[tc], 'Identity');
    }
  }
  fromId = fromId || 'SENDER         ';
  toId = toId || 'RECEIVER       ';

  var payloadID = cxmlRoot ? (cxmlRoot.getAttribute('payloadID') || '') : '';
  var timestamp = cxmlRoot ? (cxmlRoot.getAttribute('timestamp') || '') : '';
  var senderIdentity = senderEl ? getText(senderEl, 'Identity') : '';
  var userAgent = senderEl ? getText(senderEl, 'UserAgent') : '';

  /* Deployment mode → ISA15 */
  var requestEl = getFirstByTag(doc, 'Request');
  var deployMode = requestEl ? (requestEl.getAttribute('deploymentMode') || 'production') : 'production';
  var isa15 = (deployMode === 'test') ? 'T' : 'P';

  /* Dates */
  var tsDate = dateOnly(timestamp) || new Date().toISOString().slice(2,10).replace(/-/g,'');
  var yymmdd = tsDate.length === 8 ? tsDate.substring(2) : tsDate;
  var ccyymmdd = tsDate.length >= 8 ? tsDate : ('20' + tsDate);
  var hhmm = timestamp ? timestamp.substring(11,13) + timestamp.substring(14,16) : new Date().toISOString().slice(11,16).replace(':','');
  var ctrl = '000000001';

  var dtConf = MKB_DOCTYPE[docType] || { stCode:'850', gsCode:'PO' };
   var stCode = dtConf.stCode;
   var gsCode = dtConf.gsCode;
   var repSep = MKB_DECISIONS.isaRepetitionSeparator || 'U';
   var ediVer = MKB_DECISIONS.ediVersion || '004010';

   var lines = [];

   /* === ISA — strict fixed-width === */
   lines.push('ISA*00*          *00*          *ZZ*' + pad(fromId, 15) + '*ZZ*' + pad(toId, 15) + '*' + yymmdd + '*' + hhmm + '*' + repSep + '*00401*' + ctrl + '*0*' + isa15 + '*>');
   lines.push('GS*' + gsCode + '*' + fromId + '*' + toId + '*' + ccyymmdd + '*' + hhmm + '*1*X*' + ediVer);
   lines.push('ST*' + stCode + '*0001');

  /* ===========================================================================
     PO — 850
     =========================================================================== */
  if (docType === 'po') {
    var orh = getFirstByTag(doc, 'OrderRequestHeader');
    var poId = getDirectAttr(orh, 'orderID') || 'PO-UNKNOWN';
    var poDate = dateOnly(getDirectAttr(orh, 'orderDate')) || ccyymmdd;
    var orderType = getDirectAttr(orh, 'orderType') || 'regular';
    var orderVersion = getDirectAttr(orh, 'orderVersion') || '1';

    lines.push('BEG*00*NE*' + poId + '**' + poDate);

    /* CUR — Currency from Total/Money */
    var totalMoney = getFirstByTag(orh, 'Money');
    var currency = totalMoney ? (totalMoney.getAttribute('currency') || 'USD') : 'USD';
    var totalAmt = totalMoney ? (totalMoney.textContent || '0.00').trim() : '0.00';
    lines.push('CUR*BY*' + currency);

    /* REF — payloadID and SystemID */
    if (payloadID) lines.push('REF*ZZ*' + payloadID + '*payloadID');
    if (systemId) lines.push('REF*ZZ*' + systemId + '*SystemID');

    /* REF — Extrinsics */
    var extrinsics = orh ? getAllByTag(orh, 'Extrinsic') : [];
    var payTermsDesc = '';
    for (var ei = 0; ei < extrinsics.length; ei++) {
      var exName = extrinsics[ei].getAttribute('name') || '';
      var exVal = (extrinsics[ei].textContent || '').trim();
      if (exName === 'AribaNetwork.PaymentTermsExplanation') { payTermsDesc = exVal; continue; }
      var refQual = MKB_REF[exName] || 'ZZ';
      lines.push('REF*' + refQual + '*' + exVal + '*' + exName);
    }

    /* REF — ExternalDocumentType */
    var extDocType = getFirstByTag(orh, 'ExternalDocumentType');
    if (extDocType) {
      var docTypeCode = extDocType.getAttribute('documentType') || '';
      var docTypeDesc = getText(extDocType, 'Description');
      lines.push('REF*CT*' + docTypeCode + '*' + (docTypeDesc || ''));
    }

    /* PER — Sender */
    if (userAgent || senderIdentity) {
      lines.push('PER*AD*' + (userAgent || '') + '*EM*' + senderIdentity);
    }

    /* ITD — Payment Terms */
    var payTerm = getFirstByTag(orh, 'PaymentTerm');
    if (payTerm) {
      var netDays = payTerm.getAttribute('payInNumberOfDays') || '30';
      var discEl = getFirstByTag(payTerm, 'DiscountPercent');
      var discPct = discEl ? (discEl.getAttribute('percent') || '0.000') : '0.000';
      lines.push('ITD*01*3*' + discPct + '***' + netDays + '*****' + (payTermsDesc || 'Net due in ' + netDays + ' days'));
    }

    /* DTM — Order Date */
    lines.push('DTM*002*' + poDate);

    /* N9 — Order metadata */
    lines.push('N9*ZZ*OrderType*' + orderType);
    lines.push('N9*ZZ*OrderVersion*' + orderVersion);
    if (deployMode) lines.push('N9*ZZ*DeploymentMode*' + deployMode);

    /* N9 — LegalEntity */
    var legalEntity = getFirstByTag(orh, 'LegalEntity');
    if (legalEntity) {
      var leId = getIdRef(legalEntity, 'CompanyCode');
      var leDesc = getText(legalEntity, 'Description');
      lines.push('N9*L1*' + leId + '*LegalEntity');
      if (leDesc) lines.push('MSG*' + leDesc);
    }

    /* N9 — OrganizationalUnits */
    var orgUnits = orh ? getAllByTag(orh, 'OrganizationalUnit') : [];
    for (var ou = 0; ou < orgUnits.length; ou++) {
      var ouIdRefs = getAllByTag(orgUnits[ou], 'IdReference');
      for (var oi = 0; oi < ouIdRefs.length; oi++) {
        var ouDomain = ouIdRefs[oi].getAttribute('domain') || '';
        var ouIdent = ouIdRefs[oi].getAttribute('identifier') || '';
        var ouDesc = getText(ouIdRefs[oi], 'Description');
        lines.push('N9*ZZ*' + ouDomain + '*' + ouIdent);
        if (ouDesc) lines.push('MSG*' + ouDesc);
      }
    }

    /* === N1 Loops === */

    /* ShipTo */
    var shipTo = getFirstByTag(orh, 'ShipTo');
    if (shipTo) {
      var stAddr = getFirstByTag(shipTo, 'Address');
      var stAddrId = stAddr ? (stAddr.getAttribute('addressID') || '') : '';
      var stName = getText(shipTo, 'Name') || 'Ship To';
      lines.push('N1*ST*' + stName + '*92*' + stAddrId);
      var stStreet = getText(shipTo, 'Street');
      if (stStreet) lines.push('N3*' + stStreet);
      var stCity = getText(shipTo, 'City') || '';
      var stState = getText(shipTo, 'State') || '';
      var stZip = getText(shipTo, 'PostalCode') || '';
      var stCountry = getAttr(shipTo, 'Country', 'isoCountryCode') || 'US';
      lines.push('N4*' + stCity + '*' + stState + '*' + stZip + '*' + stCountry);
      /* Phone */
      var stPhone = getText(shipTo, 'Number');
      if (stPhone || true) lines.push('PER*CN**TE*' + rawDigits(stPhone));
      /* IdReferences */
      var stIdRefs = getAllByTag(shipTo, 'IdReference');
      for (var sr = 0; sr < stIdRefs.length; sr++) {
        var srDom = stIdRefs[sr].getAttribute('domain') || '';
        var srId = stIdRefs[sr].getAttribute('identifier') || '';
        if (srDom === 'buyerLocationID') continue; /* already in N1 */
        var srQual = MKB_REF[srDom] || 'ZZ';
        lines.push('REF*' + srQual + '*' + srId + '*' + srDom);
      }
    }

    /* BillTo */
    var billTo = getFirstByTag(orh, 'BillTo');
    if (billTo) {
      var btAddr = getFirstByTag(billTo, 'Address');
      var btAddrId = btAddr ? (btAddr.getAttribute('addressID') || '') : '';
      var btName = getText(billTo, 'Name') || 'Bill To';
      lines.push('N1*BT*' + btName + '*92*' + btAddrId);
      var btStreet = getText(billTo, 'Street');
      if (btStreet) lines.push('N3*' + btStreet);
      var btCity = getText(billTo, 'City') || '';
      var btState = getText(billTo, 'State') || '';
      var btZip = getText(billTo, 'PostalCode') || '';
      var btCountry = getAttr(billTo, 'Country', 'isoCountryCode') || 'US';
      lines.push('N4*' + btCity + '*' + btState + '*' + btZip + '*' + btCountry);
      /* Phone + Fax */
      var btPhoneEl = getFirstByTag(billTo, 'Phone');
      var btFaxEl = getFirstByTag(billTo, 'Fax');
      var btPhone = btPhoneEl ? rawDigits(getText(btPhoneEl, 'Number')) : '';
      var btFax = btFaxEl ? rawDigits(getText(btFaxEl, 'Number')) : '';
      lines.push('PER*AP**TE*' + btPhone + '*FX*' + btFax);
    }

    /* SoldTo (BusinessPartner role="soldTo") */
    var bizPartners = orh ? getAllByTag(orh, 'BusinessPartner') : [];
    for (var bp = 0; bp < bizPartners.length; bp++) {
      if (bizPartners[bp].getAttribute('role') === 'soldTo') {
        var soAddr = getFirstByTag(bizPartners[bp], 'Address');
        var soAddrId = soAddr ? (soAddr.getAttribute('addressID') || '') : '';
        var soName = getText(bizPartners[bp], 'Name') || 'Sold To';
        lines.push('N1*SO*' + soName + '*92*' + soAddrId);
        var soStreet = getText(bizPartners[bp], 'Street');
        if (soStreet) lines.push('N3*' + soStreet);
        var soCity = getText(bizPartners[bp], 'City') || '';
        var soState = getText(bizPartners[bp], 'State') || '';
        var soZip = getText(bizPartners[bp], 'PostalCode') || '';
        var soCountry = getAttr(bizPartners[bp], 'Country', 'isoCountryCode') || 'US';
        lines.push('N4*' + soCity + '*' + soState + '*' + soZip + '*' + soCountry);
        var soPhoneEl = getFirstByTag(bizPartners[bp], 'Phone');
        var soFaxEl = getFirstByTag(bizPartners[bp], 'Fax');
        var soPhone = soPhoneEl ? rawDigits(getText(soPhoneEl, 'Number')) : '';
        var soFax = soFaxEl ? rawDigits(getText(soFaxEl, 'Number')) : '';
        lines.push('PER*AP**TE*' + soPhone + '*FX*' + soFax);
      }
    }

    /* Supplier (Contact role="supplierCorporate") */
    var contacts = orh ? getAllByTag(orh, 'Contact') : [];
    for (var ct = 0; ct < contacts.length; ct++) {
      if (contacts[ct].getAttribute('role') === 'supplierCorporate') {
        var seAddrId = contacts[ct].getAttribute('addressID') || '';
        var seName = getText(contacts[ct], 'Name') || 'Supplier';
        lines.push('N1*' + (MKB_N1.supplierCorporate || 'SE') + '*' + seName + '*92*' + seAddrId);
        var seStreet = getText(contacts[ct], 'Street');
        if (seStreet) lines.push('N3*' + seStreet);
        var seCity = getText(contacts[ct], 'City') || '';
        var seState = getText(contacts[ct], 'State') || '';
        var seZip = getText(contacts[ct], 'PostalCode') || '';
        var seCountry = getAttr(contacts[ct], 'Country', 'isoCountryCode') || 'US';
        lines.push('N4*' + seCity + '*' + seState + '*' + seZip + '*' + seCountry);
        /* Email + Fax (may be empty — preserve) */
        var seEmail = getText(contacts[ct], 'Email') || '';
        var seFaxEl = getFirstByTag(contacts[ct], 'Fax');
        var seFax = seFaxEl ? rawDigits(getText(seFaxEl, 'Number')) : '';
        lines.push('PER*IC**EM*' + seEmail + '*FX*' + seFax);
      }
    }

    /* === PO1 Line Items === */
    var items = doc.getElementsByTagName('ItemOut');
    for (var i = 0; i < items.length; i++) {
      var lineNum = items[i].getAttribute('lineNumber') || String(i + 1);
      var qty = items[i].getAttribute('quantity') || '1';
      var reqDelDate = dateOnly(items[i].getAttribute('requestedDeliveryDate'));
      var itemDetail = getFirstByTag(items[i], 'ItemDetail') || items[i]; /* fallback: flat cXML without ItemDetail wrapper */

       /* UOM */
       var cxmlUom = getText(itemDetail, 'UnitOfMeasure') || getText(items[i], 'UnitOfMeasure') || 'EA';
       var ediUom = convertUom(cxmlUom);

       /* Price — calculate per-unit from PriceBasisQuantity */
       var unitPriceEl = getFirstByTag(itemDetail, 'UnitPrice') || getFirstByTag(items[i], 'UnitPrice');
       var rawPrice = unitPriceEl ? getText(unitPriceEl, 'Money') : '0.00';
       var rawPriceNum = parseFloat(rawPrice) || 0;
       var priceBasisEl = getFirstByTag(itemDetail, 'PriceBasisQuantity') || getFirstByTag(items[i], 'PriceBasisQuantity');
       var basisQty = priceBasisEl ? (parseFloat(priceBasisEl.getAttribute('quantity')) || 1) : 1;
      var perUnitPrice = (basisQty > 0) ? (rawPriceNum / basisQty) : rawPriceNum;
      var perUnitPriceStr = perUnitPrice.toFixed(2);

      /* Part IDs */
      var suppPart = getText(items[i], 'SupplierPartID') || '';
      var buyPart = getText(items[i], 'BuyerPartID') || '';

      lines.push('PO1*' + lineNum + '*' + qty + '*' + ediUom + '*' + perUnitPriceStr + '*PE*BP*' + buyPart + '*VP*' + suppPart);

      /* PID */
      var desc = getText(itemDetail, 'Description');
      if (desc) lines.push('PID*F*08***' + desc);

      /* REF — Line-level classifications and extrinsics */
      var lineClasses = itemDetail ? getAllByTag(itemDetail, 'Classification') : [];
      for (var lc = 0; lc < lineClasses.length; lc++) {
        var lcDom = lineClasses[lc].getAttribute('domain') || '';
        var lcVal = (lineClasses[lc].textContent || '').trim();
        lines.push('REF*ZZ*' + lcVal + '*' + lcDom);
      }
      var lineExtrs = itemDetail ? getAllByTag(itemDetail, 'Extrinsic') : [];
      for (var le = 0; le < lineExtrs.length; le++) {
        var leName = lineExtrs[le].getAttribute('name') || '';
        var leVal = (lineExtrs[le].textContent || '').trim();
        lines.push('REF*ZZ*' + leVal + '*' + leName);
      }

      /* DTM — Requested Delivery Date */
      if (reqDelDate) lines.push('DTM*002*' + reqDelDate);

      /* N9/MSG — Price Basis Quantity */
      if (basisQty > 1) {
        var basisUom = priceBasisEl ? getText(priceBasisEl, 'UnitOfMeasure') : cxmlUom;
        lines.push('N9*ZZ*PriceBasisQuantity');
        lines.push('MSG*Original price $' + rawPriceNum.toFixed(2) + ' per ' + basisQty + ' ' + basisUom + ' converted to $' + perUnitPriceStr + ' per 1 ' + basisUom);
      }

      /* N9/MSG — PlannedAcceptanceDays */
      var acceptDays = itemDetail ? getText(itemDetail, 'PlannedAcceptanceDays') : '';
      if (acceptDays) lines.push('N9*ZZ*PlannedAcceptanceDays*' + acceptDays);

      /* N9/MSG — BuyerPlannerCode contact */
      var lineContacts = getAllByTag(items[i], 'Contact');
      for (var lci = 0; lci < lineContacts.length; lci++) {
        if (lineContacts[lci].getAttribute('role') === 'BuyerPlannerCode') {
          var bpcName = getText(lineContacts[lci], 'Name');
          var bpcId = getIdRef(lineContacts[lci], 'BuyerPlannerCode');
          lines.push('N9*ZZ*BuyerPlannerCode*' + bpcId);
          if (bpcName) lines.push('MSG*' + bpcName);
        }
      }

      /* N9/MSG — ControlKeys */
      var controlKeys = getFirstByTag(items[i], 'ControlKeys');
      if (controlKeys) {
        /* OCInstruction */
        var ocInstr = getFirstByTag(controlKeys, 'OCInstruction');
        if (ocInstr) {
          lines.push('N9*ZZ*OCInstruction*' + (ocInstr.getAttribute('value') || ''));
          var ocLower = getFirstByTag(ocInstr, 'Lower');
          var ocUpper = getFirstByTag(ocInstr, 'Upper');
          if (ocLower) {
            var ocLQty = getAttr(ocLower, 'Percentage', 'percent') || '';
            var ocLTime = getAttr(ocLower, 'TimeTolerance', 'limit') || '';
            var ocLTimeType = getAttr(ocLower, 'TimeTolerance', 'type') || 'days';
            lines.push('MSG*Lower: Qty Tolerance ' + ocLQty + '%' + (ocLTime ? ', Time Tolerance ' + ocLTime + ' ' + ocLTimeType : ''));
          }
          if (ocUpper) {
            var ocUQty = getAttr(ocUpper, 'Percentage', 'percent') || '';
            var ocUTime = getAttr(ocUpper, 'TimeTolerance', 'limit') || '';
            var ocUTimeType = getAttr(ocUpper, 'TimeTolerance', 'type') || 'days';
            lines.push('MSG*Upper: Qty Tolerance ' + ocUQty + '%' + (ocUTime ? ', Time Tolerance ' + ocUTime + ' ' + ocUTimeType : ''));
          }
        }
        /* ASNInstruction */
        var asnInstr = getFirstByTag(controlKeys, 'ASNInstruction');
        if (asnInstr) {
          lines.push('N9*ZZ*ASNInstruction*' + (asnInstr.getAttribute('value') || ''));
          var asnLower = getFirstByTag(asnInstr, 'Lower');
          var asnUpper = getFirstByTag(asnInstr, 'Upper');
          if (asnLower) { lines.push('MSG*Lower: Qty Tolerance ' + (getAttr(asnLower, 'Percentage', 'percent') || '') + '%'); }
          if (asnUpper) { lines.push('MSG*Upper: Qty Tolerance ' + (getAttr(asnUpper, 'Percentage', 'percent') || '') + '%'); }
        }
        /* InvoiceInstruction */
        var invInstr = getFirstByTag(controlKeys, 'InvoiceInstruction');
        if (invInstr) {
          lines.push('N9*ZZ*InvoiceInstruction*' + (invInstr.getAttribute('value') || ''));
        }
      }

      /* N9/MSG — Distribution */
      var distEls = getAllByTag(items[i], 'Distribution');
      for (var di = 0; di < distEls.length; di++) {
        lines.push('N9*ZZ*DistributionCharge');
        var acctSegs = getAllByTag(distEls[di], 'AccountingSegment');
        for (var as = 0; as < acctSegs.length; as++) {
          var asName = getText(acctSegs[as], 'Name');
          var asId = acctSegs[as].getAttribute('id') || '';
          lines.push('MSG*' + asName + ': ' + asId);
        }
        var chargeMoney = getText(distEls[di], 'Money');
        if (chargeMoney) {
          var chargeCur = getAttr(distEls[di], 'Money', 'currency') || currency;
          lines.push('MSG*Charge Amount: ' + chargeMoney + ' ' + chargeCur);
        }
      }

      /* N9/MSG — ScheduleLines */
      var schedLines = getAllByTag(items[i], 'ScheduleLine');
      for (var sl = 0; sl < schedLines.length; sl++) {
        var slLineNum = schedLines[sl].getAttribute('lineNumber') || String(sl + 1);
        var slQty = schedLines[sl].getAttribute('quantity') || '';
        var slDate = dateOnly(schedLines[sl].getAttribute('requestedDeliveryDate'));
        var slUom = getText(schedLines[sl], 'UnitOfMeasure') || cxmlUom;
        lines.push('N9*ZZ*ScheduleLine*' + slLineNum);
        lines.push('MSG*Qty: ' + slQty + ' ' + slUom + ', Delivery Date: ' + slDate);
      }

      /* N9/MSG — QualityInfo & BatchInfo */
      var itemIndustry = getFirstByTag(items[i], 'ItemOutIndustry');
      if (itemIndustry) {
        var qualInfo = getFirstByTag(itemIndustry, 'QualityInfo');
        var batchInfo = getFirstByTag(itemIndustry, 'BatchInfo');
        if (qualInfo || batchInfo) {
          lines.push('N9*ZZ*QualityInfo');
          if (qualInfo) {
            lines.push('MSG*Requires Quality Process: ' + (qualInfo.getAttribute('requiresQualityProcess') || 'no'));
            var qiCode = getIdRef(qualInfo, 'controlCode');
            var qiDesc = getIdRef(qualInfo, 'controlCodeDesc');
            if (qiCode) lines.push('MSG*Control Code: ' + qiCode + (qiDesc ? ' (' + qiDesc + ')' : ''));
          }
          if (batchInfo) {
            lines.push('MSG*Requires Batch: ' + (batchInfo.getAttribute('requiresBatch') || 'no'));
          }
        }
      }
    }
    /* end PO1 loop */

    /* AMT — Total before CTT */
    lines.push('AMT*TT*' + totalAmt);
    lines.push('CTT*' + items.length);

  } else if (docType === 'oc') {
    /* === Order Confirmation — 855 === */
    var confHeader = getFirstByTag(doc, 'ConfirmationHeader');
    var confType = confHeader ? (confHeader.getAttribute('type') || 'accept') : 'accept';
    var confDate = dateOnly(confHeader ? confHeader.getAttribute('noticeDate') : '') || ccyymmdd;
    var typeCode = confType === 'reject' ? 'RD' : confType === 'detail' ? 'AD' : 'AC';

    /* Get PO reference */
    var docRef = getFirstByTag(doc, 'DocumentReference');
    var confPO = docRef ? (docRef.getAttribute('payloadID') || '').split('@')[0] : '';
    if (!confPO) confPO = docRef ? (docRef.getAttribute('orderID') || 'PO-UNKNOWN') : 'PO-UNKNOWN';

    lines.push('BAK*06*' + typeCode + '*' + confPO + '*' + confDate);

    /* CUR */
    var ocCurrency = getAttr(doc, 'Money', 'currency') || 'USD';
    lines.push('CUR*SE*' + ocCurrency);

    /* REF — payloadID */
    if (payloadID) lines.push('REF*ZZ*' + payloadID + '*payloadID');

    /* N9 metadata */
    if (deployMode) lines.push('N9*ZZ*DeploymentMode*' + deployMode);

    /* N1 — Ship From (if Correspondent or Contact exists) */
    var ocCorr = getFirstByTag(toEl, 'Correspondent');
    if (ocCorr) {
      var ocCorrName = getText(ocCorr, 'Name');
      lines.push('N1*SF*' + ocCorrName);
      var ocCorrStreet = getText(ocCorr, 'Street');
      if (ocCorrStreet) lines.push('N3*' + ocCorrStreet);
      var ocCorrCity = getText(ocCorr, 'City') || '';
      var ocCorrCountry = getAttr(ocCorr, 'Country', 'isoCountryCode') || 'US';
      lines.push('N4*' + ocCorrCity + '***' + ocCorrCountry);
    }

    /* Confirmation Items */
    var confItems = doc.getElementsByTagName('ConfirmationItem');
    for (var ci = 0; ci < confItems.length; ci++) {
      var cLineNum = confItems[ci].getAttribute('lineNumber') || String(ci + 1);
      var cQty = confItems[ci].getAttribute('quantity') || '1';
      var cUomRaw = getText(confItems[ci], 'UnitOfMeasure') || 'EA';
      var cUom = convertUom(cUomRaw);

      /* Price */
      var cUnitPriceEl = getFirstByTag(confItems[ci], 'UnitPrice');
      var cRawPrice = cUnitPriceEl ? getText(cUnitPriceEl, 'Money') : '0.00';
      var cBasisEl = getFirstByTag(confItems[ci], 'PriceBasisQuantity');
      var cBasisQty = cBasisEl ? (parseFloat(cBasisEl.getAttribute('quantity')) || 1) : 1;
      var cPerUnit = ((parseFloat(cRawPrice) || 0) / cBasisQty).toFixed(2);

      var cSuppPart = getText(confItems[ci], 'SupplierPartID') || '';
      var cBuyPart = getText(confItems[ci], 'BuyerPartID') || '';
      lines.push('PO1*' + cLineNum + '*' + cQty + '*' + cUom + '*' + cPerUnit + '*PE*BP*' + cBuyPart + '*VP*' + cSuppPart);

      var cDesc = getText(confItems[ci], 'Description');
      if (cDesc) lines.push('PID*F*08***' + cDesc);

      /* ACK per ConfirmationStatus */
      var statusEls = getAllByTag(confItems[ci], 'ConfirmationStatus');
      for (var si = 0; si < statusEls.length; si++) {
        var sType = statusEls[si].getAttribute('type') || 'accept';
        var ackCode = sType === 'reject' ? 'IR' : sType === 'backordered' ? 'IB' : sType === 'detail' ? 'ID' : 'IA';
        var sQty = statusEls[si].getAttribute('quantity') || cQty;
        var sDate = dateOnly(statusEls[si].getAttribute('deliveryDate')) || '';
        lines.push('ACK*' + ackCode + '*' + sQty + '*' + cUom + '****' + (sDate ? '002*' + sDate : ''));
      }

      /* DTM — ship date or delivery date at line level */
      var cReqDel = dateOnly(confItems[ci].getAttribute('requestedDeliveryDate'));
      if (cReqDel) lines.push('DTM*002*' + cReqDel);
    }

    lines.push('CTT*' + confItems.length);

  } else if (docType === 'asn') {
    /* === ASN — 856 === */
    var snHeader = getFirstByTag(doc, 'ShipNoticeHeader');
    var shipId = snHeader ? (snHeader.getAttribute('shipmentID') || 'ASN-UNKNOWN') : 'ASN-UNKNOWN';
    var shipDate = dateOnly(snHeader ? snHeader.getAttribute('shipmentDate') : '') || ccyymmdd;
    var delivDate = dateOnly(snHeader ? snHeader.getAttribute('deliveryDate') : '') || '';

    lines.push('BSN*00*' + shipId + '*' + shipDate.substring(0,8) + '*' + hhmm + '*0001');
    lines.push('DTM*011*' + shipDate);
    if (delivDate) lines.push('DTM*002*' + delivDate);

    /* CUR */
    var asnCur = getAttr(doc, 'Money', 'currency') || 'USD';
    lines.push('CUR*SE*' + asnCur);

    /* REF — payloadID */
    if (payloadID) lines.push('REF*ZZ*' + payloadID + '*payloadID');

    var hlCount = 1;
    /* HL*1 — Shipment level */
    lines.push('HL*' + hlCount + '**S');

    /* TD1 — packaging */
    var numPkgs = snHeader ? getAllByTag(snHeader, 'PackageDescription').length : 0;
    if (numPkgs > 0) lines.push('TD1*CTN*' + numPkgs);

    /* TD5 — Carrier */
    var carriers = doc.getElementsByTagName('CarrierIdentifier');
    var carrierName = getText(doc.documentElement, 'CarrierIdentifier');
    if (carriers.length > 0) {
      var scac = (carriers[0].textContent || '').trim();
      lines.push('TD5*O*2*' + scac + '*M');
    }

    /* REF — tracking */
    var trackIds = doc.getElementsByTagName('ShipmentIdentifier');
    if (trackIds.length > 0) lines.push('REF*CN*' + (trackIds[0].textContent || '').trim());
    var bolNums = doc.getElementsByTagName('BillOfLadingNumber');
    if (bolNums.length > 0) lines.push('REF*BM*' + (bolNums[0].textContent || '').trim());

    /* N1 — Ship From */
    var snShipFrom = getFirstByTag(doc, 'ShipFrom') || getFirstByTag(toEl, 'Correspondent');
    if (snShipFrom) {
      var sfName = getText(snShipFrom, 'Name') || '';
      lines.push('N1*SF*' + sfName);
      var sfStreet = getText(snShipFrom, 'Street');
      if (sfStreet) lines.push('N3*' + sfStreet);
      var sfCity = getText(snShipFrom, 'City') || '';
      var sfState = getText(snShipFrom, 'State') || '';
      var sfZip = getText(snShipFrom, 'PostalCode') || '';
      var sfCountry = getAttr(snShipFrom, 'Country', 'isoCountryCode') || 'US';
      lines.push('N4*' + sfCity + '*' + sfState + '*' + sfZip + '*' + sfCountry);
    }

    /* N1 — Ship To */
    var snShipTo = getFirstByTag(doc, 'ShipTo');
    if (snShipTo) {
      var asnStName = getText(snShipTo, 'Name') || '';
      var asnStAddrId = getAttr(snShipTo, 'Address', 'addressID') || '';
      lines.push('N1*ST*' + asnStName + '*92*' + asnStAddrId);
      var asnStStreet = getText(snShipTo, 'Street');
      if (asnStStreet) lines.push('N3*' + asnStStreet);
      var asnStCity = getText(snShipTo, 'City') || '';
      var asnStState = getText(snShipTo, 'State') || '';
      var asnStZip = getText(snShipTo, 'PostalCode') || '';
      var asnStCountry = getAttr(snShipTo, 'Country', 'isoCountryCode') || 'US';
      lines.push('N4*' + asnStCity + '*' + asnStState + '*' + asnStZip + '*' + asnStCountry);
    }

    /* HL*2 — Order level */
    var orderRef = getAttr(doc, 'OrderReference', 'orderID');
    if (orderRef) {
      hlCount++;
      lines.push('HL*' + hlCount + '*1*O');
      lines.push('PRF*' + orderRef);
    }

    /* HL — Item level */
    var sniItems = doc.getElementsByTagName('ShipNoticeItem');
    for (var sni = 0; sni < sniItems.length; sni++) {
      hlCount++;
      lines.push('HL*' + hlCount + '*' + (orderRef ? '2' : '1') + '*I');
      var sniLineNum = sniItems[sni].getAttribute('lineNumber') || String(sni + 1);
      var sniPart = getText(sniItems[sni], 'SupplierPartID') || '';
      var sniBPart = getText(sniItems[sni], 'BuyerPartID') || '';
      if (sniPart || sniBPart) lines.push('LIN*' + sniLineNum + '*BP*' + sniBPart + '*VP*' + sniPart);
      var sniQty = sniItems[sni].getAttribute('quantity') || '1';
      var sniUom = convertUom(getText(sniItems[sni], 'UnitOfMeasure') || 'EA');
      lines.push('SN1*' + sniLineNum + '*' + sniQty + '*' + sniUom);
      var sniDesc = getText(sniItems[sni], 'Description');
      if (sniDesc) lines.push('PID*F*08***' + sniDesc);
      /* Batch/Lot */
      var sniBatch = getText(sniItems[sni], 'Batch');
      if (sniBatch) lines.push('REF*BT*' + sniBatch);
    }

    lines.push('CTT*' + hlCount);

  } else if (docType === 'gr') {
    /* === Goods Receipt — 861 === */
    var rcptHeader = getFirstByTag(doc, 'ReceiptHeader') || getFirstByTag(doc, 'ReceivingHeader');
    var rcptId = rcptHeader ? (getDirectAttr(rcptHeader, 'receiptID') || 'RCV-UNKNOWN') : 'RCV-UNKNOWN';
    var rcptDate = dateOnly(rcptHeader ? getDirectAttr(rcptHeader, 'receiptDate') : '') || ccyymmdd;

    lines.push('RCD*01');
    lines.push('DTM*050*' + rcptDate);

    /* CUR */
    var grCur = getAttr(doc, 'Money', 'currency') || 'USD';
    lines.push('CUR*BY*' + grCur);

    /* REF — PO reference */
    var grOrderRef = getAttr(doc, 'OrderReference', 'orderID') || '';
    if (grOrderRef) lines.push('REF*PO*' + grOrderRef);
    if (payloadID) lines.push('REF*ZZ*' + payloadID + '*payloadID');

    /* N9 metadata */
    if (deployMode) lines.push('N9*ZZ*DeploymentMode*' + deployMode);

    /* N1 — Ship To (receiver) */
    var grShipTo = getFirstByTag(doc, 'ShipTo');
    if (grShipTo) {
      var grStName = getText(grShipTo, 'Name') || '';
      lines.push('N1*ST*' + grStName);
      var grStStreet = getText(grShipTo, 'Street');
      if (grStStreet) lines.push('N3*' + grStStreet);
      var grStCity = getText(grShipTo, 'City') || '';
      var grStState = getText(grShipTo, 'State') || '';
      var grStZip = getText(grShipTo, 'PostalCode') || '';
      lines.push('N4*' + grStCity + '*' + grStState + '*' + grStZip + '*US');
    }

    /* Receipt Items */
    var rcptItems = doc.getElementsByTagName('ReceiptItem');
    for (var ri = 0; ri < rcptItems.length; ri++) {
      var riLineNum = rcptItems[ri].getAttribute('lineNumber') || String(ri + 1);
      var riPart = getText(rcptItems[ri], 'SupplierPartID') || '';
      var riBPart = getText(rcptItems[ri], 'BuyerPartID') || '';
      if (riPart || riBPart) lines.push('LIN*' + riLineNum + '*BP*' + riBPart + '*VP*' + riPart);
      var riQty = rcptItems[ri].getAttribute('quantity') || '1';
      var riUom = convertUom(getText(rcptItems[ri], 'UnitOfMeasure') || 'EA');
      lines.push('QTY*02*' + riQty + '*' + riUom);
      var riDesc = getText(rcptItems[ri], 'Description');
      if (riDesc) lines.push('PID*F*08***' + riDesc);
      /* Receiving status */
      var riStatus = rcptItems[ri].getAttribute('type') || 'received';
      lines.push('N9*ZZ*ReceiptStatus*' + riStatus);
    }

    lines.push('CTT*' + rcptItems.length);

  } else if (docType === 'inv') {
    /* === Invoice — 810 === */
    var invHeader = getFirstByTag(doc, 'InvoiceDetailRequestHeader');
    var invId = invHeader ? (getDirectAttr(invHeader, 'invoiceID') || 'INV-UNKNOWN') : 'INV-UNKNOWN';
    var invDate = dateOnly(invHeader ? getDirectAttr(invHeader, 'invoiceDate') : '') || ccyymmdd;
    var invPurpose = invHeader ? (getDirectAttr(invHeader, 'purpose') || 'standard') : 'standard';

    /* PO Ref */
    var invOrderRef = getAttr(doc, 'OrderReference', 'orderID') || '';

    lines.push('BIG*' + invDate + '*' + invId + '**' + invOrderRef);

    /* CUR */
    var invCur = getAttr(doc, 'Money', 'currency') || 'USD';
    lines.push('CUR*SE*' + invCur);

    /* REF */
    if (payloadID) lines.push('REF*ZZ*' + payloadID + '*payloadID');
    if (invOrderRef) lines.push('REF*PO*' + invOrderRef);

    /* N9 metadata */
    lines.push('N9*ZZ*InvoicePurpose*' + invPurpose);
    if (deployMode) lines.push('N9*ZZ*DeploymentMode*' + deployMode);

    /* ITD — Payment Terms */
    var invPayTerm = getFirstByTag(invHeader, 'PaymentTerm');
    if (invPayTerm) {
      var invNetDays = invPayTerm.getAttribute('payInNumberOfDays') || '30';
      var invDiscEl = getFirstByTag(invPayTerm, 'DiscountPercent');
      var invDiscPct = invDiscEl ? (invDiscEl.getAttribute('percent') || '0.000') : '0.000';
      lines.push('ITD*01*3*' + invDiscPct + '***' + invNetDays);
    }

    /* N1 — Partners */
    var invPartners = doc.getElementsByTagName('InvoicePartner');
    for (var ip = 0; ip < invPartners.length; ip++) {
      var ipRole = getAttr(invPartners[ip], 'Contact', 'role') || '';
      var ipName = getText(invPartners[ip], 'Name') || '';
      var ipAddrId = getAttr(invPartners[ip], 'Contact', 'addressID') || '';
      var n1Qual = ipRole === 'remitTo' ? 'RE' : ipRole === 'billTo' ? 'BT' : ipRole === 'soldTo' ? 'SO' : 'ZZ';
      lines.push('N1*' + n1Qual + '*' + ipName + (ipAddrId ? '*92*' + ipAddrId : ''));
      var ipStreet = getText(invPartners[ip], 'Street');
      if (ipStreet) lines.push('N3*' + ipStreet);
      var ipCity = getText(invPartners[ip], 'City') || '';
      var ipState = getText(invPartners[ip], 'State') || '';
      var ipZip = getText(invPartners[ip], 'PostalCode') || '';
      var ipCountry = getAttr(invPartners[ip], 'Country', 'isoCountryCode') || 'US';
      if (ipCity) lines.push('N4*' + ipCity + '*' + ipState + '*' + ipZip + '*' + ipCountry);
    }

    /* IT1 — Invoice line items */
    var invItems = doc.getElementsByTagName('InvoiceDetailItem');
    var totalCents = 0;
    for (var ii = 0; ii < invItems.length; ii++) {
      var iiLineNum = invItems[ii].getAttribute('invoiceLineNumber') || String(ii + 1);
      var iiQty = invItems[ii].getAttribute('quantity') || '1';
      var iiUomRaw = getText(invItems[ii], 'UnitOfMeasure') || 'EA';
      var iiUom = convertUom(iiUomRaw);

      /* Price with basis calculation */
      var iiUpEl = getFirstByTag(invItems[ii], 'UnitPrice');
      var iiRawPrice = iiUpEl ? getText(iiUpEl, 'Money') : '0.00';
      var iiBasisEl = getFirstByTag(invItems[ii], 'PriceBasisQuantity');
      var iiBasisQty = iiBasisEl ? (parseFloat(iiBasisEl.getAttribute('quantity')) || 1) : 1;
      var iiPerUnit = ((parseFloat(iiRawPrice) || 0) / iiBasisQty).toFixed(2);

      var iiSuppPart = getText(invItems[ii], 'SupplierPartID') || '';
      var iiBuyPart = getText(invItems[ii], 'BuyerPartID') || '';
      lines.push('IT1*' + iiLineNum + '*' + iiQty + '*' + iiUom + '*' + iiPerUnit + '*PE*BP*' + iiBuyPart + '*VP*' + iiSuppPart);

      var iiDesc = getText(invItems[ii], 'Description');
      if (iiDesc) lines.push('PID*F*08***' + iiDesc);

      totalCents += Math.round(parseFloat(iiQty) * parseFloat(iiPerUnit) * 100);

      /* Tax at line level */
      var iiTax = getFirstByTag(invItems[ii], 'Tax');
      if (iiTax) {
        var taxAmt = getText(iiTax, 'Money') || '0.00';
        var taxDesc = getText(iiTax, 'Description') || 'Tax';
        lines.push('TXI*TX*' + taxAmt + '****' + taxDesc);
      }
    }

    /* TDS — Total in cents */
    lines.push('TDS*' + totalCents);

    /* Tax summary */
    var invTaxTotal = getFirstByTag(invHeader, 'Tax');
    if (invTaxTotal) {
      var totalTax = getText(invTaxTotal, 'Money') || '0.00';
      lines.push('TXI*TX*' + totalTax);
    }

    /* AMT */
    var invTotal = invHeader ? getText(invHeader, 'Money') : '';
    if (!invTotal) invTotal = (totalCents / 100).toFixed(2);
    lines.push('AMT*TT*' + invTotal);

    lines.push('CTT*' + invItems.length);
  }

  /* === SE/GE/IEA — Trailer === */
  var seCount = lines.length + 1; /* +1 for SE itself (ST is already in lines) */
  lines.push('SE*' + seCount + '*0001');
  lines.push('GE*1*1');
  lines.push('IEA*1*' + ctrl);

  return lines.join('\n');
}

function cxmlDownloadAsEdiFiles() {
  var uploadedTypes = Object.keys(cxmlFiles).filter(function(k) { return cxmlFiles[k] !== null; });
  if (uploadedTypes.length === 0) return;

  var EDI_FILENAMES = {
    po: 'EDI_850_PurchaseOrder.edi',
    oc: 'EDI_855_OrderConfirmation.edi',
    asn: 'EDI_856_ASN.edi',
    gr: 'EDI_861_GoodsReceipt.edi',
    inv: 'EDI_810_Invoice.edi'
  };

  var readPromises = uploadedTypes.map(function(docType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var ediContent = '';
        try { ediContent = generateEdiFromCxml(docType, e.target.result); } catch(err) { console.error('[AIA] EDI gen error:', err); }
        resolve({ docType: docType, content: ediContent });
      };
      reader.onerror = function() { resolve({ docType: docType, content: '' }); };
      reader.readAsText(cxmlFiles[docType]);
    });
  });

  Promise.all(readPromises).then(function(results) {
    results.forEach(function(result) {
      if (!result.content) return;
      var blob = new Blob([result.content], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = EDI_FILENAMES[result.docType];
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

/* Wire cXML → EDI download button and update summary to enable both buttons */
initCxmlEdiDownload();

/* ===== CIG GUIDE CREATION ===== */
function initCigGuide() {
  var btn = document.getElementById('cig-guide-btn');
  if (!btn) return;
  btn.addEventListener('click', generateCigGuide);
}

function generateCigGuide() {
  var btn = document.getElementById('cig-guide-btn');
  var progressEl = document.getElementById('cig-guide-progress');
  var progFill = document.getElementById('cig-prog-fill');
  var progText = document.getElementById('cig-prog-text');
  var progPct = document.getElementById('cig-prog-pct');
  var erpType = document.getElementById('cig-erp-type').value;
  var connectivity = document.getElementById('cig-connectivity').value;
  var adapter = document.getElementById('cig-adapter').value;
  var docScope = document.getElementById('cig-doc-scope').value;
  var company = document.getElementById('cig-company').value.trim() || 'Your Company';

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">hourglass_empty</span> Generating...';
  progressEl.style.display = 'block';

  var totalSteps = 5;
  var step = 0;
  function tick(msg) {
    step++;
    var pct = Math.round((step / totalSteps) * 100);
    progFill.style.width = pct + '%';
    progText.textContent = msg;
    progPct.textContent = pct + '%';
  }

  setTimeout(function() {
    var wb = XLSX.utils.book_new();

    /* Sheet 1: Overview */
    tick('Building CIG overview...');
    var scopeDocs = {
      all: 'Purchase Order, Order Confirmation, ASN, Goods Receipt, Invoice',
      procurement: 'Purchase Order, Order Confirmation, Invoice',
      logistics: 'ASN, Goods Receipt'
    };
    var overviewData = [
      ['CIG Configuration Guide — ' + company],
      ['Generated by AIA (Ariba Integration Agent) on ' + new Date().toISOString().slice(0, 10)],
      [],
      ['Parameter', 'Value'],
      ['ERP System', erpType],
      ['Connectivity Protocol', connectivity],
      ['Adapter Template', adapter.replace(/-/g, ' → ').replace('CIG', 'CIG')],
      ['Document Scope', scopeDocs[docScope]],
      ['Company', company],
      [],
      ['Section', 'Description'],
      ['1. Prerequisites', 'System requirements and access needed before CIG setup'],
      ['2. CIG Adapter Config', 'Adapter-specific configuration for ' + erpType],
      ['3. Connectivity Setup', 'Protocol configuration for ' + connectivity],
      ['4. Document Routing', 'Document type routing and transformation rules'],
      ['5. Testing & Go-Live', 'Test plan, monitoring, and production cutover checklist']
    ];
    var wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 30 }, { wch: 80 }];
    wsOverview['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    /* Sheet 2: Prerequisites */
    tick('Building prerequisites...');
    var prereqRows = [
      ['CIG Prerequisites — ' + erpType],
      [],
      ['#', 'Prerequisite', 'Details', 'Status'],
      ['1', 'Ariba Network Account', 'Active AN account with integration entitlement. ANID must be provisioned.', '☐'],
      ['2', 'CIG License', 'CIG add-on enabled in Ariba Network admin. Contact SAP support if not visible.', '☐'],
      ['3', 'ERP Connectivity', erpType === 'SAP S/4HANA' || erpType === 'SAP ECC' ? 'RFC destination or ALE distribution model configured for iDoc processing. SM59 + WE20 config required.' : 'Middleware or integration layer configured to send/receive ' + (adapter.indexOf('X12') >= 0 ? 'EDI X12' : 'flat files') + ' to CIG endpoint.', '☐'],
      ['4', 'Certificate / Credentials', connectivity === 'AS2' ? 'AS2 certificate (X.509) exchanged with Ariba. MDN URL configured.' : connectivity === 'VAN' ? 'VAN provider credentials and mailbox ID. ISA/GS qualifier IDs assigned.' : 'HTTPS client certificate or API key for cXML endpoint authentication.', '☐'],
      ['5', 'Firewall / Network', 'Whitelist Ariba CIG endpoints: s1.ariba.com (prod), s1-eu.ariba.com (EU). Ports: 443 (HTTPS), 4080 (AS2).', '☐'],
      ['6', 'Test Environment', 'Ariba Network Test account (AN-T) configured for end-to-end testing before production.', '☐'],
      ['7', 'Document Mapping Specs', 'Mapping specification for each document type: field-level mapping from ERP format to cXML.', '☐'],
      ['8', 'Business Rules', 'Approved business rules: tax handling, tolerance, matching (2-way/3-way), currency, UoM.', '☐']
    ];
    var wsPrereq = XLSX.utils.aoa_to_sheet(prereqRows);
    wsPrereq['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 90 }, { wch: 8 }];
    wsPrereq['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, wsPrereq, 'Prerequisites');

    /* Sheet 3: Adapter Configuration */
    tick('Building adapter configuration...');
    var adapterRows = [
      ['CIG Adapter Configuration — ' + adapter.replace(/-/g, ' → ')],
      [],
      ['Step', 'Action', 'Details', 'Reference']
    ];

    if (erpType === 'SAP S/4HANA' || erpType === 'SAP ECC') {
      adapterRows = adapterRows.concat([
        ['1', 'Install CIG Add-on', 'Download and install CIGINT add-on from SAP Marketplace (SWDC). Version must match ERP kernel patch level.', 'SAP Note 2260525'],
        ['2', 'Configure RFC Destination', 'SM59 → Create RFC destination type "G" (HTTP) pointing to Ariba CIG endpoint. Set SSL certificate.', 'SAP Note 2186516'],
        ['3', 'ALE Distribution Model', 'BD64 → Create distribution model for outbound iDoc types: ORDERS (PO), ORDCHG, DESADV (ASN), GSVERF (GR), INVOIC (INV).', 'CIG Admin Guide Ch. 3'],
        ['4', 'Partner Profile (WE20)', 'Create partner profile for CIG. Set outbound params: message type, iDoc type, port, and processing mode.', 'CIG Admin Guide Ch. 4'],
        ['5', 'Port Configuration (WE21)', 'Define XML-HTTP port pointing to CIG RFC destination. Set content type = application/xml.', 'CIG Admin Guide Ch. 4'],
        ['6', 'iDoc → cXML Mapping', 'In CIG Admin UI: configure document mappings. Map iDoc segments to cXML elements for each doc type.', 'CIG Mapping Reference'],
        ['7', 'Number Ranges', 'SNRO → Ensure number ranges for iDoc control numbers, CIG message IDs are configured and not exhausted.', 'SAP Note 1840227'],
        ['8', 'Background Jobs', 'SM36 → Schedule jobs: RBDAPP01 (iDoc processing), RBDMOIND (iDoc status), CIG_MONITOR (CIG health check).', 'CIG Admin Guide Ch. 6']
      ]);
    } else {
      adapterRows = adapterRows.concat([
        ['1', 'Register CIG Endpoint', 'In Ariba Network Admin → CIG Configuration → Register your ERP endpoint URL and authentication method.', 'CIG Admin Guide Ch. 2'],
        ['2', 'Configure Adapter', 'Select adapter template: ' + adapter + '. Configure source format (' + (adapter.indexOf('X12') >= 0 ? 'EDI X12' : adapter.indexOf('CSV') >= 0 ? 'CSV/Flat File' : 'Native') + ') and target format (cXML).', 'CIG Admin Guide Ch. 3'],
        ['3', 'Field Mapping', 'Map source fields to cXML elements. Use CIG mapping editor for each document type.', 'CIG Mapping Reference'],
        ['4', 'Set Transformation Rules', 'Configure value mappings (UoM codes, currency, tax codes) between ERP and Ariba formats.', 'CIG Admin Guide Ch. 4'],
        ['5', 'Configure Error Handling', 'Set retry policy (3 retries, exponential backoff). Configure error notification email.', 'CIG Admin Guide Ch. 5'],
        ['6', 'Schedule Processing', 'Set polling interval for inbound documents. Configure batch size and processing window.', 'CIG Admin Guide Ch. 6']
      ]);
    }

    var wsAdapter = XLSX.utils.aoa_to_sheet(adapterRows);
    wsAdapter['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 85 }, { wch: 25 }];
    wsAdapter['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, wsAdapter, 'Adapter Config');

    /* Sheet 4: Document Routing */
    tick('Building document routing...');
    var routeHeader = [
      ['Document Routing & Transformation — ' + company],
      [],
      ['Document', 'Direction', 'ERP Format', 'CIG Transform', 'Ariba Format', 'GS Functional ID', 'Transaction Set', 'Notes']
    ];
    var allDocs = [
      ['Purchase Order', 'Inbound (Ariba→ERP)', 'cXML OrderRequest', adapter.replace(/-/g,' → '), erpType.indexOf('SAP') >= 0 ? 'iDoc ORDERS05' : adapter.indexOf('X12') >= 0 ? 'EDI 850' : 'CSV/Flat', 'PO', '850', 'Ariba sends PO to CIG; CIG transforms and delivers to ERP'],
      ['Order Confirmation', 'Outbound (ERP→Ariba)', erpType.indexOf('SAP') >= 0 ? 'iDoc ORDRSP' : adapter.indexOf('X12') >= 0 ? 'EDI 855' : 'CSV', adapter.replace(/-/g,' → '), 'cXML ConfirmationRequest', 'PR', '855', 'ERP sends OC to CIG; CIG transforms to cXML and posts to Ariba'],
      ['ASN / Ship Notice', 'Outbound (ERP→Ariba)', erpType.indexOf('SAP') >= 0 ? 'iDoc DESADV' : adapter.indexOf('X12') >= 0 ? 'EDI 856' : 'CSV', adapter.replace(/-/g,' → '), 'cXML ShipNoticeRequest', 'SH', '856', 'Triggered after goods issue in ERP'],
      ['Goods Receipt', 'Inbound (Ariba→ERP)', 'cXML ReceiptRequest', adapter.replace(/-/g,' → '), erpType.indexOf('SAP') >= 0 ? 'iDoc GSVERF' : 'Receipt record', 'RC', '861', 'Service entry sheet or GR from Ariba'],
      ['Invoice', 'Outbound (ERP→Ariba)', erpType.indexOf('SAP') >= 0 ? 'iDoc INVOIC02' : adapter.indexOf('X12') >= 0 ? 'EDI 810' : 'CSV', adapter.replace(/-/g,' → '), 'cXML InvoiceDetailRequest', 'IN', '810', 'Invoice from ERP; must include PO reference']
    ];
    var scopeFilter = { all: ['Purchase Order','Order Confirmation','ASN / Ship Notice','Goods Receipt','Invoice'], procurement: ['Purchase Order','Order Confirmation','Invoice'], logistics: ['ASN / Ship Notice','Goods Receipt'] };
    var filteredDocs = allDocs.filter(function(row) { return scopeFilter[docScope].indexOf(row[0]) >= 0; });
    var routeData = routeHeader.concat(filteredDocs);

    var wsRoute = XLSX.utils.aoa_to_sheet(routeData);
    wsRoute['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 50 }];
    wsRoute['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    XLSX.utils.book_append_sheet(wb, wsRoute, 'Document Routing');

    /* Sheet 5: Testing & Go-Live Checklist */
    tick('Building test & go-live checklist...');
    var testData = [
      ['Testing & Go-Live Checklist — ' + company],
      [],
      ['Phase', '#', 'Task', 'Owner', 'Status', 'Notes'],
      ['Unit Test', '1', 'Send test PO from Ariba AN-T to CIG', 'Integration Team', '☐', 'Use AN test account'],
      ['Unit Test', '2', 'Verify PO received in ERP test system', erpType + ' Team', '☐', 'Check iDoc/file landed correctly'],
      ['Unit Test', '3', 'Send test OC from ERP to Ariba via CIG', erpType + ' Team', '☐', 'Verify cXML posted to AN-T'],
      ['Unit Test', '4', 'Send test ASN from ERP through CIG', erpType + ' Team', '☐', 'Include pack/ship details'],
      ['Unit Test', '5', 'Send test Invoice from ERP through CIG', erpType + ' Team', '☐', 'Verify tax, totals, PO ref'],
      ['Unit Test', '6', 'Verify all documents visible in Ariba AN-T', 'Integration Team', '☐', 'Check document status = Acknowledged'],
      ['Integration Test', '7', 'Full round-trip: PO → OC → ASN → GR → INV', 'Both Teams', '☐', 'End-to-end with matching PO numbers'],
      ['Integration Test', '8', 'Error scenario: send malformed document', 'Integration Team', '☐', 'Verify CIG error handling & notification'],
      ['Integration Test', '9', 'Retry scenario: simulate network timeout', 'Integration Team', '☐', 'Verify automatic retry works'],
      ['Integration Test', '10', 'Volume test: send 50+ documents in batch', 'Integration Team', '☐', 'Measure throughput, check no drops'],
      ['Go-Live Prep', '11', 'Switch CIG config from AN-T to Production', 'Integration Team', '☐', 'Update ISA IDs, certificates, endpoints'],
      ['Go-Live Prep', '12', 'Update firewall rules for production endpoints', 'Network Team', '☐', 's1.ariba.com / s1-eu.ariba.com'],
      ['Go-Live Prep', '13', 'Enable CIG monitoring dashboard', 'Integration Team', '☐', 'Set alert thresholds for failures'],
      ['Go-Live Prep', '14', 'Production smoke test: send 1 PO + 1 INV', 'Both Teams', '☐', 'Verify end-to-end in production'],
      ['Go-Live', '15', 'Enable full document flow in production', 'Integration Team', '☐', 'Monitor first 24h closely'],
      ['Go-Live', '16', 'Handover to support team', 'Integration Team', '☐', 'Document runbook, escalation paths'],
      [],
      ['Monitoring Checklist (Post Go-Live)', '', '', '', '', ''],
      ['Daily', '1', 'Check CIG dashboard for failed/stuck documents', 'Support', '☐', 'Ariba Network → Integration → CIG Monitor'],
      ['Daily', '2', 'Review ERP integration logs for errors', 'Support', '☐', erpType.indexOf('SAP') >= 0 ? 'BD87 / WE05 for iDoc errors' : 'Check ERP integration log'],
      ['Weekly', '3', 'Review document volume trends', 'Support', '☐', 'Compare vs. baseline, flag anomalies'],
      ['Monthly', '4', 'Certificate expiry check', 'Security Team', '☐', 'AS2/HTTPS certificates — renew 30d before expiry']
    ];
    var wsTest = XLSX.utils.aoa_to_sheet(testData);
    wsTest['!cols'] = [{ wch: 18 }, { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 8 }, { wch: 50 }];
    wsTest['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    XLSX.utils.book_append_sheet(wb, wsTest, 'Testing & Go-Live');

    /* Download */
    var filename = 'AIA_CIG_Guide_' + company.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.xlsx';
    downloadXlsxBlob(wb, filename);

    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">download</span> Generate & Download CIG Guide';
    setTimeout(function() { progressEl.style.display = 'none'; }, 2000);
  }, 100);
}

/* ===== CIG GUIDE CREATION — Transaction Fetch (Mock UI) ===== */
var CIG_MOCK_TRANSACTIONS = [
  { date: '2026-04-28', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78543', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-28', type: 'OC', direction: 'Outbound', docId: 'CONF-GP-90421', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ConfirmationRequest>...</ConfirmationRequest></Request></cXML>' },
  { date: '2026-04-27', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78510', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-26', type: 'ASN', direction: 'Outbound', docId: 'SHP-GP-2026-07891', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ShipNoticeRequest>...</ShipNoticeRequest></Request></cXML>' },
  { date: '2026-04-25', type: 'INV', direction: 'Outbound', docId: 'INV-GP-2026-18734', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><InvoiceDetailRequest>...</InvoiceDetailRequest></Request></cXML>' },
  { date: '2026-04-24', type: 'GR', direction: 'Inbound', docId: 'GR-2026-05421', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ReceiptRequest>...</ReceiptRequest></Request></cXML>' },
  { date: '2026-04-23', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78499', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-22', type: 'OC', direction: 'Outbound', docId: 'CONF-GP-90398', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ConfirmationRequest>...</ConfirmationRequest></Request></cXML>' },
  { date: '2026-04-21', type: 'ASN', direction: 'Outbound', docId: 'SHP-GP-2026-07850', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ShipNoticeRequest>...</ShipNoticeRequest></Request></cXML>' },
  { date: '2026-04-20', type: 'INV', direction: 'Outbound', docId: 'INV-GP-2026-18700', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><InvoiceDetailRequest>...</InvoiceDetailRequest></Request></cXML>' },
  { date: '2026-04-19', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78472', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-18', type: 'GR', direction: 'Inbound', docId: 'GR-2026-05390', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ReceiptRequest>...</ReceiptRequest></Request></cXML>' },
  { date: '2026-04-15', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78440', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-12', type: 'INV', direction: 'Outbound', docId: 'INV-GP-2026-18650', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><InvoiceDetailRequest>...</InvoiceDetailRequest></Request></cXML>' },
  { date: '2026-04-10', type: 'ASN', direction: 'Outbound', docId: 'SHP-GP-2026-07800', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ShipNoticeRequest>...</ShipNoticeRequest></Request></cXML>' },
  { date: '2026-04-08', type: 'OC', direction: 'Outbound', docId: 'CONF-GP-90350', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ConfirmationRequest>...</ConfirmationRequest></Request></cXML>' },
  { date: '2026-04-05', type: 'PO', direction: 'Inbound', docId: 'PO-2026-78401', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><OrderRequest>...</OrderRequest></Request></cXML>' },
  { date: '2026-04-03', type: 'GR', direction: 'Inbound', docId: 'GR-2026-05340', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><ReceiptRequest>...</ReceiptRequest></Request></cXML>' },
  { date: '2026-04-01', type: 'INV', direction: 'Outbound', docId: 'INV-GP-2026-18600', status: 'Success', format: 'cxml', payload: '<?xml version="1.0"?>\n<cXML><Request><InvoiceDetailRequest>...</InvoiceDetailRequest></Request></cXML>' }
];

function initCigGuideCreation() {
  var connectBtn = document.getElementById('cig-gc-connect-btn');
  var refreshBtn = document.getElementById('cig-gc-refresh-btn');
  var downloadBtn = document.getElementById('cig-gc-download-btn');
  var guideBtn = document.getElementById('cig-gc-guide-btn');
  var selectAll = document.getElementById('cig-gc-select-all');
  if (!connectBtn) return;

  /* Format toggle */
  document.querySelectorAll('.cig-gc-fmt-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.cig-gc-fmt-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  connectBtn.addEventListener('click', function() {
    var url = document.getElementById('cig-gc-url').value.trim();
    var user = document.getElementById('cig-gc-user').value.trim();
    if (!url || !user) {
      document.getElementById('cig-gc-status-badge').textContent = 'Missing fields';
      document.getElementById('cig-gc-status-badge').className = 'badge badge-crit';
      return;
    }

    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">hourglass_empty</span> Connecting...';

    /* Simulate connection delay */
    setTimeout(function() {
      document.getElementById('cig-gc-status-badge').textContent = 'Connected';
      document.getElementById('cig-gc-status-badge').className = 'badge badge-success';
      document.getElementById('cig-gc-filters').style.display = '';
      document.getElementById('cig-gc-results').style.display = '';
      document.getElementById('cig-gc-actions').style.display = '';
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">power</span> Connect & Fetch Transactions';
      renderCigTransactions();
    }, 1200);
  });

  if (refreshBtn) refreshBtn.addEventListener('click', renderCigTransactions);

  /* Select all checkbox */
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      document.querySelectorAll('.cig-gc-row-cb').forEach(function(cb) { cb.checked = selectAll.checked; });
    });
  }

  /* Download selected payloads */
  if (downloadBtn) downloadBtn.addEventListener('click', function() {
    var selected = getSelectedCigTransactions();
    if (selected.length === 0) return;

    selected.forEach(function(txn) {
      var ext = txn.format === 'edi' ? '.edi' : '.cxml';
      var blob = new Blob([txn.payload], { type: 'text/xml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = txn.docId + ext;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  /* Generate guide from selected */
  if (guideBtn) guideBtn.addEventListener('click', function() {
    var selected = getSelectedCigTransactions();
    if (selected.length === 0) return;

    var progressEl = document.getElementById('cig-gc-progress');
    var progFill = document.getElementById('cig-gc-prog-fill');
    var progText = document.getElementById('cig-gc-prog-text');
    var progPct = document.getElementById('cig-gc-prog-pct');
    progressEl.style.display = '';
    progFill.style.width = '0%';

    var step = 0;
    var total = selected.length + 1;
    function tick(msg) { step++; var p = Math.round((step/total)*100); progFill.style.width = p+'%'; progText.textContent = msg; progPct.textContent = p+'%'; }

    setTimeout(function() {
      tick('Building workbook...');
      selected.forEach(function(txn) { tick('Processing ' + txn.docId + '...'); });

      progFill.style.width = '100%';
      progText.textContent = 'Guide generated (mock)';
      progPct.textContent = '100%';
      setTimeout(function() { progressEl.style.display = 'none'; }, 2500);
    }, 500);
  });

  /* Auto-detect from portal checkbox */
  var autoConfig = document.getElementById('cig-gc-autoconfig');
  if (autoConfig) {
    autoConfig.addEventListener('change', function() {
      if (autoConfig.checked) {
        document.getElementById('cig-gc-url').value = 'https://integration.ariba.com/cig/v2/api';
        document.getElementById('cig-gc-user').value = 'auto-detected';
        document.getElementById('cig-gc-pass').value = 'auto-detected';
        document.getElementById('cig-gc-url').disabled = true;
        document.getElementById('cig-gc-user').disabled = true;
        document.getElementById('cig-gc-pass').disabled = true;
      } else {
        document.getElementById('cig-gc-url').disabled = false;
        document.getElementById('cig-gc-user').disabled = false;
        document.getElementById('cig-gc-pass').disabled = false;
      }
    });
  }
}

function getSelectedCigTransactions() {
  var checkboxes = document.querySelectorAll('.cig-gc-row-cb:checked');
  var indices = [];
  checkboxes.forEach(function(cb) { indices.push(parseInt(cb.dataset.idx)); });
  return indices.map(function(i) { return CIG_MOCK_TRANSACTIONS[i]; }).filter(Boolean);
}

function renderCigTransactions() {
  var tbody = document.getElementById('cig-gc-tbody');
  if (!tbody) return;

  /* Read filters */
  var selectedTypes = [];
  document.querySelectorAll('.cig-gc-doctype:checked').forEach(function(cb) { selectedTypes.push(cb.value.toUpperCase()); });
  var statusFilter = document.getElementById('cig-gc-txn-status').value;
  var period = parseInt(document.getElementById('cig-gc-period').value);
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  var cutoffStr = cutoff.toISOString().slice(0, 10);

  var TYPE_MAP = { PO: 'PO', OC: 'OC', ASN: 'ASN', GR: 'GR', INV: 'INV' };
  var STATUS_ICONS = { Success: '<span style="color:var(--ok)">✓</span>', Failed: '<span style="color:var(--error)">✗</span>' };
  var DIR_ICONS = { Inbound: '← In', Outbound: '→ Out' };

  var filtered = CIG_MOCK_TRANSACTIONS.filter(function(txn) {
    if (selectedTypes.indexOf(txn.type) < 0) return false;
    if (statusFilter !== 'all' && txn.status.toLowerCase() !== statusFilter) return false;
    if (txn.date < cutoffStr) return false;
    return true;
  });

  tbody.innerHTML = '';
  filtered.forEach(function(txn, idx) {
    var origIdx = CIG_MOCK_TRANSACTIONS.indexOf(txn);
    var tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--border2);cursor:pointer';
    tr.innerHTML = '<td style="padding:5px 8px"><input type="checkbox" class="cig-gc-row-cb" data-idx="' + origIdx + '" style="accent-color:var(--accent)"></td>' +
      '<td style="padding:5px 8px">' + txn.date + '</td>' +
      '<td style="padding:5px 8px"><span class="badge badge-dur">' + txn.type + '</span></td>' +
      '<td style="padding:5px 8px">' + (DIR_ICONS[txn.direction] || txn.direction) + '</td>' +
      '<td style="padding:5px 8px;font-family:Consolas,monospace;font-size:9px">' + txn.docId + '</td>' +
      '<td style="padding:5px 8px">' + (STATUS_ICONS[txn.status] || txn.status) + ' ' + txn.status + '</td>';
    tbody.appendChild(tr);
  });

  document.getElementById('cig-gc-count-badge').textContent = filtered.length + ' found';
}

initCigGuideCreation();

/* ===== GUIDE TEST CENTRAL — Upload + Send + Scan (Mock UI) ===== */
var gtcFiles = { po: null, oc: null, asn: null, gr: null, inv: null };
var gtcSentResults = [];

function initGuideTestCentral() {
  var docTypes = ['po', 'oc', 'asn', 'gr', 'inv'];
  docTypes.forEach(function(docType) {
    var fileInput = document.getElementById('gtc-file-' + docType);
    var dropZone = document.querySelector('#gtc-slot-' + docType + ' .cxml-upload-drop');
    if (!fileInput || !dropZone) return;

    dropZone.addEventListener('click', function() { fileInput.click(); });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) handleGtcFile(docType, e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) handleGtcFile(docType, fileInput.files[0]);
    });
  });

  var sendBtn = document.getElementById('gtc-send-btn');
  var scanBtn = document.getElementById('gtc-scan-btn');

  if (sendBtn) sendBtn.addEventListener('click', gtcSendToTest);
  if (scanBtn) scanBtn.addEventListener('click', gtcScanStatus);
}

function handleGtcFile(docType, file) {
  gtcFiles[docType] = file;
  var drop = document.querySelector('#gtc-slot-' + docType + ' .cxml-upload-drop');
  var status = document.getElementById('gtc-status-' + docType);
  drop.classList.add('has-file');
  var truncName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
  var isEdi = /\.(edi|x12|dat)$/i.test(file.name);
  var formatBadge = isEdi ? '<span class="badge badge-dur" style="font-size:8px;padding:1px 4px">EDI</span>' : '<span class="badge badge-dur" style="font-size:8px;padding:1px 4px">cXML</span>';
  status.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px">check_circle</span> ' + truncName + ' ' + formatBadge;
  updateGtcSummary();
}

function updateGtcSummary() {
  var count = Object.values(gtcFiles).filter(function(f) { return f !== null; }).length;
  var summaryEl = document.getElementById('gtc-upload-summary');
  var countEl = document.getElementById('gtc-upload-count');
  var sendBtn = document.getElementById('gtc-send-btn');
  if (count > 0) {
    summaryEl.style.display = '';
    countEl.textContent = count;
    sendBtn.disabled = false;
  } else {
    summaryEl.style.display = 'none';
    sendBtn.disabled = true;
  }
}

function gtcSendToTest() {
  var sendBtn = document.getElementById('gtc-send-btn');
  var scanBtn = document.getElementById('gtc-scan-btn');
  var resultsCard = document.getElementById('gtc-results');
  var resultRows = document.getElementById('gtc-result-rows');
  var resultBadge = document.getElementById('gtc-result-badge');

  var uploadedTypes = Object.keys(gtcFiles).filter(function(k) { return gtcFiles[k] !== null; });
  if (uploadedTypes.length === 0) return;

  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_empty</span> Sending...';

  var endpoint = document.getElementById('gtc-endpoint').value.trim();
  var env = document.getElementById('gtc-env').value;

  /* Mock response generation */
  var DOC_NAMES = { po: 'Purchase Order', oc: 'Order Confirmation', asn: 'Advance Ship Notice', gr: 'Goods Receipt', inv: 'Invoice' };
  var mockResponses = [
    { httpStatus: 200, cxmlStatus: 200, cxmlText: 'OK', detail: '' },
    { httpStatus: 200, cxmlStatus: 200, cxmlText: 'OK', detail: '' },
    { httpStatus: 200, cxmlStatus: 200, cxmlText: 'OK', detail: '' },
    { httpStatus: 200, cxmlStatus: 406, cxmlText: 'Not Acceptable', detail: 'OC-7: Referenced PO not found' },
    { httpStatus: 200, cxmlStatus: 200, cxmlText: 'OK', detail: '' }
  ];

  var delay = 0;
  gtcSentResults = [];
  resultRows.innerHTML = '';
  resultsCard.style.display = '';

  uploadedTypes.forEach(function(docType, idx) {
    var isEdi = gtcFiles[docType] && /\.(edi|x12|dat)$/i.test(gtcFiles[docType].name);
    var autoConvert = document.getElementById('gtc-auto-convert').checked;
    var mockIdx = idx % mockResponses.length;
    var mock = mockResponses[mockIdx];

    delay += 600;
    setTimeout(function() {
      var passed = mock.cxmlStatus === 200;
      var result = { docType: docType, httpStatus: mock.httpStatus, cxmlStatus: mock.cxmlStatus, cxmlText: mock.cxmlText, detail: mock.detail, passed: passed, timestamp: new Date().toISOString() };
      gtcSentResults.push(result);

      var statusIcon = passed ? '<span style="color:var(--ok)">✓</span>' : '<span style="color:var(--error)">✗</span>';
      var convertNote = (isEdi && autoConvert) ? ' <span style="color:var(--text2);font-size:9px">(EDI→cXML converted)</span>' : '';
      var row = document.createElement('div');
      row.style.cssText = 'padding:8px 12px;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center';
      row.innerHTML = '<div><b>' + DOC_NAMES[docType] + '</b>' + convertNote + '<br><span style="font-size:9px;color:var(--text2)">→ ' + endpoint + ' [' + env + ']</span></div>' +
        '<div style="text-align:right">' + statusIcon + ' HTTP ' + mock.httpStatus + ' / cXML ' + mock.cxmlStatus +
        (mock.detail ? '<br><span style="font-size:9px;color:var(--error)">' + mock.detail + '</span>' : '') + '</div>';
      resultRows.appendChild(row);

      /* Update badge */
      var passCount = gtcSentResults.filter(function(r) { return r.passed; }).length;
      resultBadge.textContent = passCount + '/' + gtcSentResults.length + ' passed';
      resultBadge.className = passCount === gtcSentResults.length ? 'badge badge-success' : 'badge badge-crit';

      /* Re-enable buttons after last */
      if (gtcSentResults.length === uploadedTypes.length) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">send</span> Send to Test';
        scanBtn.disabled = false;
      }
    }, delay);
  });
}

function gtcScanStatus() {
  var scanCard = document.getElementById('gtc-scan-results');
  var scanRows = document.getElementById('gtc-scan-rows');
  var scanBtn = document.getElementById('gtc-scan-btn');

  if (gtcSentResults.length === 0) return;

  scanBtn.disabled = true;
  scanBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_empty</span> Scanning...';
  scanCard.style.display = '';
  scanRows.innerHTML = '';

  var DOC_NAMES = { po: 'Purchase Order', oc: 'Order Confirmation', asn: 'Advance Ship Notice', gr: 'Goods Receipt', inv: 'Invoice' };

  /* Mock scan — simulate checking transaction status */
  var SCAN_STATUSES = ['Received by AN', 'Validated by AN', 'Delivered to Buyer', 'Processing Complete', 'Acknowledged'];

  setTimeout(function() {
    gtcSentResults.forEach(function(result) {
      var scanStatus = result.passed ? SCAN_STATUSES[Math.floor(Math.random() * SCAN_STATUSES.length)] : 'Rejected — ' + result.detail;
      var icon = result.passed ? '<span style="color:var(--ok)">✓</span>' : '<span style="color:var(--error)">✗</span>';

      var row = document.createElement('div');
      row.style.cssText = 'padding:8px 12px;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center';
      row.innerHTML = '<div><b>' + DOC_NAMES[result.docType] + '</b><br>' +
        '<span style="font-size:9px;color:var(--text2)">Sent: ' + result.timestamp.slice(11, 19) + ' UTC</span></div>' +
        '<div style="text-align:right">' + icon + ' ' + scanStatus + '</div>';
      scanRows.appendChild(row);
    });

    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">radar</span> Scan Status';
  }, 1500);
}

initGuideTestCentral();

/* ===== SETTINGS OVERLAY ===== */
var settingsBtn = document.getElementById('btn-settings');
var settingsOverlay = document.getElementById('settings-overlay');
var settingsClose = document.getElementById('settings-close');

if (settingsBtn && settingsOverlay) {
  settingsBtn.addEventListener('click', function() {
    settingsOverlay.style.display = 'flex';
  });
}
if (settingsClose) {
  settingsClose.addEventListener('click', function() {
    settingsOverlay.style.display = 'none';
  });
}

/* Password visibility toggle */
var settingsEye = document.getElementById('settings-eye');
if (settingsEye) {
  settingsEye.addEventListener('click', function() {
    var passInput = document.getElementById('settings-pass');
    var icon = settingsEye.querySelector('.material-symbols-rounded');
    if (passInput.type === 'password') { passInput.type = 'text'; icon.textContent = 'visibility_off'; }
    else { passInput.type = 'password'; icon.textContent = 'visibility'; }
  });
}

/* Login / Authenticate */
var loginBtn = document.getElementById('settings-login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', function() {
    var email = document.getElementById('settings-email').value.trim();
    var pass = document.getElementById('settings-pass').value;
    var rsa = document.getElementById('settings-rsa').value.trim();
    var statusEl = document.getElementById('settings-login-status');

    if (!email || !pass) {
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = 'Please enter email and password.';
      return;
    }
    if (rsa.length !== 6) {
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--error)';
      statusEl.textContent = 'RSA code must be 6 digits.';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">hourglass_empty</span> Authenticating...';
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--text2)';
    statusEl.textContent = 'Verifying credentials...';

    /* Mock authentication */
    setTimeout(function() {
      var nameParts = email.split('@')[0].split('.');
      var firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '';
      var lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';
      var fullName = (firstName + ' ' + lastName).trim();
      var initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();

      /* Update header */
      var headerUser = document.getElementById('header-user');
      var headerAvatar = document.getElementById('header-user-avatar');
      var headerName = document.getElementById('header-user-name');
      if (headerUser) { headerUser.style.display = 'flex'; }
      if (headerAvatar) { headerAvatar.textContent = initials; }
      if (headerName) { headerName.textContent = fullName; }

      /* Update welcome banner */
      var welcomeTitle = document.getElementById('dash-welcome-title');
      if (welcomeTitle) { welcomeTitle.textContent = 'Welcome, ' + firstName; }

      statusEl.style.color = 'var(--ok)';
      statusEl.textContent = '✓ Authenticated as ' + fullName;
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">check_circle</span> Authenticated';
      loginBtn.style.background = 'var(--ok)';

      /* Log activity */
      addActivityEntry('success', 'Employee ' + fullName + ' authenticated via RSA SecurID');

      setTimeout(function() { settingsOverlay.style.display = 'none'; }, 1200);
    }, 1500);
  });
}

/* ===== ACTIVITY OVERLAY ===== */
var activityBtn = document.getElementById('btn-activity');
var activityOverlay = document.getElementById('activity-overlay');
var activityClose = document.getElementById('activity-close');

var ACTIVITY_LOG = [
  { severity: 'info', desc: 'CIG endpoint updated for Acme Manufacturing Corp', time: '2026-04-28T14:32:00Z', category: 'CIG Config' },
  { severity: 'warning', desc: 'EDI X12 mapping modified — ASN 856 new segment added', time: '2026-04-28T11:05:00Z', category: 'Mapping' },
  { severity: 'success', desc: 'TechKom Solutions promoted to Production stage', time: '2026-04-27T16:48:00Z', category: 'Stage Change' },
  { severity: 'info', desc: 'Guide generated: CIG Integration Guide for GlobalCo', time: '2026-04-27T10:22:00Z', category: 'Guide' },
  { severity: 'critical', desc: 'Certificate expiring in 7 days for AS2 connection — Acme Corp', time: '2026-04-26T09:15:00Z', category: 'Security' },
  { severity: 'success', desc: 'Test Central: 5/5 documents passed for NexaParts GmbH', time: '2026-04-26T08:30:00Z', category: 'Testing' },
  { severity: 'warning', desc: 'Order Confirmation rejected — PO reference not found', time: '2026-04-25T15:42:00Z', category: 'Transaction' },
  { severity: 'info', desc: 'Supplier BASF SE onboarded — Stage 1 Plan initiated', time: '2026-04-25T11:00:00Z', category: 'Onboarding' },
  { severity: 'success', desc: 'BMW Group test cycle completed — 12/12 transactions passed', time: '2026-04-24T17:20:00Z', category: 'Testing' },
  { severity: 'info', desc: 'cXML→EDI guide downloaded for Purchase Order 850', time: '2026-04-24T14:10:00Z', category: 'Guide' },
  { severity: 'warning', desc: 'Siemens AG: Invoice 810 missing TXI tax segment', time: '2026-04-23T09:45:00Z', category: 'Validation' },
  { severity: 'critical', desc: 'CIG connection timeout — Ariba Network maintenance window', time: '2026-04-22T03:00:00Z', category: 'System' },
  { severity: 'success', desc: 'SAP SE integration go-live completed successfully', time: '2026-04-21T10:30:00Z', category: 'Go-Live' },
  { severity: 'info', desc: 'AIA extension updated to v3.2.0', time: '2026-04-20T08:00:00Z', category: 'System' }
];

function addActivityEntry(severity, desc) {
  ACTIVITY_LOG.unshift({ severity: severity, desc: desc, time: new Date().toISOString(), category: 'User Action' });
}

function renderActivityLog() {
  var listEl = document.getElementById('activity-list');
  if (!listEl) return;
  var sevFilter = document.getElementById('activity-sev-filter').value;
  var dayFilter = parseInt(document.getElementById('activity-date-filter').value);
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - dayFilter);

  var filtered = ACTIVITY_LOG.filter(function(e) {
    if (sevFilter !== 'all' && e.severity !== sevFilter) return false;
    if (new Date(e.time) < cutoff) return false;
    return true;
  });

  listEl.innerHTML = '';
  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px 0;font-size:12px"><span class="material-symbols-rounded" style="font-size:32px;display:block;margin-bottom:8px;opacity:.3">inbox</span>No activity entries found</div>';
    return;
  }

  filtered.forEach(function(entry) {
    var d = new Date(entry.time);
    var timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    var item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = '<div class="activity-sev-badge sev-' + entry.severity + '"></div>' +
      '<div class="activity-content">' +
        '<div class="activity-desc">' + entry.desc + '</div>' +
        '<div class="activity-meta">' +
          '<span class="activity-tag tag-' + entry.severity + '">' + entry.severity + '</span>' +
          '<span class="activity-time">' + timeStr + '</span>' +
          '<span class="activity-time" style="opacity:.5">• ' + entry.category + '</span>' +
        '</div>' +
      '</div>';
    listEl.appendChild(item);
  });
}

if (activityBtn && activityOverlay) {
  activityBtn.addEventListener('click', function() {
    activityOverlay.style.display = 'flex';
    renderActivityLog();
  });
}
if (activityClose) {
  activityClose.addEventListener('click', function() {
    activityOverlay.style.display = 'none';
  });
}

/* Activity filters */
var actSevFilter = document.getElementById('activity-sev-filter');
var actDateFilter = document.getElementById('activity-date-filter');
if (actSevFilter) actSevFilter.addEventListener('change', renderActivityLog);
if (actDateFilter) actDateFilter.addEventListener('change', renderActivityLog);

console.log('[AIA] Panel controller loaded — v3.2.0 AI Automated Integration');

/* ===== Mapping Knowledge Base (MKB) Editor ===== */
(function() {
  var MKB_STORAGE_KEY = 'aia_mkb_config';
  var MKB_DEFAULT = null;

  function loadMKB() {
    var stored = localStorage.getItem(MKB_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) { /* fall through */ }
    }
    return getMKBDefault();
  }

  function getMKBDefault() {
    if (MKB_DEFAULT) return MKB_DEFAULT;
    MKB_DEFAULT = {
      decisions: {
        priceHandling: 'always_per_unit',
        emptyFields: 'preserve',
        isaFormat: 'strict_fixed_width',
        phoneFormat: 'raw_digits',
        sapExtrinsics: 'REF_ZZ',
        controlKeys: 'N9_MSG',
        distributionMapping: 'N9_MSG',
        qualityInfoMapping: 'N9_MSG',
        scheduleLineMapping: 'N9_MSG',
        segmentTerminator: '\\n',
        elementSeparator: '*',
        componentSeparator: '>',
        deploymentModeToISA15: true,
        includeAMTBeforeCTT: true,
        supplierN1Qualifier: 'SE',
        ediVersion: '004010',
        isaRepetitionSeparator: 'U'
      },
      uomCxmlToX12: {
        EA:'EA',PCE:'EA',PC:'EA',LTR:'LT',LT:'LT',GAL:'GA',ML:'ML',
        KGM:'KG',KG:'KG',GRM:'GR',GM:'GR',LBS:'LB',LB:'LB',OZ:'OZ',
        TON:'TN',MTR:'MT',MT:'MT',FT:'FT',IN:'IN',CM:'CM',MM:'MM',
        YD:'YD',MI:'MI',BX:'BX',CS:'CS',PK:'PK',PA:'PA',BG:'BG',
        RL:'RL',DZ:'DZ',GR:'GR',CT:'CT',PR:'PR',SET:'ST',HR:'HR',
        DA:'DA',MO:'MO',WK:'WK',SQM:'SM',SQF:'SF',CBM:'CI',CFT:'CF',
        PLT:'PL',DRM:'DR',TNK:'TK',CYL:'CY',BAG:'BG',BTL:'BO',CAN:'CA',JAR:'JR'
      },
      refQualifiers: {
        CompanyCode: { qualifier:'CO', description:'Company Code' },
        PurchaseGroup: { qualifier:'PG', description:'Purchasing Group' },
        PurchaseOrganization: { qualifier:'8X', description:'Purchasing Organization' },
        partyAdditionalID: { qualifier:'VR', description:'Vendor Reference/Party ID' },
        Requester: { qualifier:'ZZ', description:'Requisitioner' },
        'Ariba.invoicingAllowed': { qualifier:'ZZ', description:'Invoicing Allowed Flag' },
        'Ariba.availableAmount': { qualifier:'ZZ', description:'Available PO Amount' },
        'AribaNetwork.PaymentTermsExplanation': { qualifier:'ZZ', description:'Payment Terms Description' },
        payloadID: { qualifier:'ZZ', description:'cXML Payload Correlation ID' },
        SystemID: { qualifier:'ZZ', description:'Source ERP System ID' },
        ERPCommodityCode: { qualifier:'ZZ', description:'ERP Commodity Code' },
        AccountCategory: { qualifier:'ZZ', description:'Account Assignment Category' },
        ReceivingType: { qualifier:'ZZ', description:'Goods Receipt Type' },
        extLineNumber: { qualifier:'ZZ', description:'External Line Number' },
        storageLocationID: { qualifier:'WH', description:'Storage/Warehouse Location' },
        buyerLocationID: { qualifier:'92', description:'Buyer Location ID' }
      },
      n1Qualifiers: {
        ShipTo:'ST', BillTo:'BT', soldTo:'SO', supplierCorporate:'SE',
        buyFrom:'VN', shipFrom:'SF', remitTo:'RE'
      },
      docTypeConfig: {
        po: { stCode:'850', gsCode:'PO', begPurpose:'00', begType:'NE' },
        oc: { stCode:'855', gsCode:'PR', bakPurpose:'06' },
        asn: { stCode:'856', gsCode:'SH' },
        gr: { stCode:'861', gsCode:'RC' },
        inv: { stCode:'810', gsCode:'IN' }
      }
    };
    return MKB_DEFAULT;
  }

  function saveMKB(config) {
    localStorage.setItem(MKB_STORAGE_KEY, JSON.stringify(config));
  }

  var currentMKB = loadMKB();

  /* Render Decisions Table */
  function renderDecisions() {
    var tbody = document.getElementById('mkb-decisions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var labels = {
      priceHandling: 'Price Handling',
      emptyFields: 'Empty Fields',
      isaFormat: 'ISA Format',
      phoneFormat: 'Phone Format',
      sapExtrinsics: 'SAP Extrinsics Mapping',
      controlKeys: 'Control Keys Mapping',
      distributionMapping: 'Distribution Mapping',
      qualityInfoMapping: 'Quality Info Mapping',
      scheduleLineMapping: 'Schedule Line Mapping',
      segmentTerminator: 'Segment Terminator',
      elementSeparator: 'Element Separator',
      componentSeparator: 'Component Separator',
      deploymentModeToISA15: 'deploymentMode → ISA15',
      includeAMTBeforeCTT: 'Include AMT before CTT',
      supplierN1Qualifier: 'Supplier N1 Qualifier',
      ediVersion: 'EDI Version',
      isaRepetitionSeparator: 'ISA Repetition Separator'
    };
    var keys = Object.keys(currentMKB.decisions);
    keys.forEach(function(key) {
      var val = currentMKB.decisions[key];
      var displayVal = typeof val === 'boolean' ? (val ? '✓ true' : '✗ false') : String(val).replace('\\n', '↵ (newline)');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mkb-key">' + (labels[key] || key) + '</td>' +
        '<td class="mkb-val">' + displayVal + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* Render UOM Table */
  function renderUOM(filter) {
    var tbody = document.getElementById('mkb-uom-tbody');
    var countEl = document.getElementById('mkb-uom-count');
    if (!tbody) return;
    tbody.innerHTML = '';
    var entries = Object.entries(currentMKB.uomCxmlToX12);
    var filtered = filter ? entries.filter(function(e) {
      return e[0].toLowerCase().indexOf(filter.toLowerCase()) >= 0 ||
             e[1].toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    }) : entries;
    if (countEl) countEl.textContent = entries.length + ' pairs';
    filtered.forEach(function(entry) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mkb-val">' + entry[0] + '</td>' +
        '<td class="mkb-val">' + entry[1] + '</td>' +
        '<td><button class="mkb-del-btn" data-uom-key="' + entry[0] + '"><span class="material-symbols-rounded" style="font-size:14px">close</span></button></td>';
      tbody.appendChild(tr);
    });
    /* wire delete buttons */
    tbody.querySelectorAll('.mkb-del-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.getAttribute('data-uom-key');
        delete currentMKB.uomCxmlToX12[key];
        renderUOM(document.getElementById('mkb-uom-search').value);
      });
    });
  }

  /* Render REF Qualifiers */
  function renderREF() {
    var tbody = document.getElementById('mkb-ref-tbody');
    var countEl = document.getElementById('mkb-ref-count');
    if (!tbody) return;
    tbody.innerHTML = '';
    var entries = Object.entries(currentMKB.refQualifiers);
    if (countEl) countEl.textContent = entries.length + ' rules';
    entries.forEach(function(entry) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mkb-key">' + entry[0] + '</td>' +
        '<td class="mkb-val">' + entry[1].qualifier + '</td>' +
        '<td class="mkb-desc">' + entry[1].description + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* Render N1 Qualifiers */
  function renderN1() {
    var tbody = document.getElementById('mkb-n1-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    Object.entries(currentMKB.n1Qualifiers).forEach(function(entry) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mkb-key">' + entry[0] + '</td>' +
        '<td class="mkb-val">' + entry[1] + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* Render Doc Type Config */
  function renderDocTypes() {
    var tbody = document.getElementById('mkb-doctype-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var typeLabels = { po:'Purchase Order', oc:'Order Confirm', asn:'Ship Notice', gr:'Goods Receipt', inv:'Invoice' };
    Object.entries(currentMKB.docTypeConfig).forEach(function(entry) {
      var key = entry[0], cfg = entry[1];
      var extra = [];
      if (cfg.begPurpose) extra.push('BEG Purpose: ' + cfg.begPurpose);
      if (cfg.begType) extra.push('BEG Type: ' + cfg.begType);
      if (cfg.bakPurpose) extra.push('BAK Purpose: ' + cfg.bakPurpose);
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mkb-key">' + (typeLabels[key] || key) + '</td>' +
        '<td class="mkb-val">' + cfg.stCode + '</td>' +
        '<td class="mkb-val">' + cfg.gsCode + '</td>' +
        '<td class="mkb-desc">' + (extra.join(', ') || '—') + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* Render all */
  function renderMKBEditor() {
    renderDecisions();
    renderUOM('');
    renderREF();
    renderN1();
    renderDocTypes();
  }

  /* Event wiring */
  var mkbSearchInput = document.getElementById('mkb-uom-search');
  if (mkbSearchInput) {
    mkbSearchInput.addEventListener('input', function() { renderUOM(this.value); });
  }

  var mkbAddBtn = document.getElementById('mkb-uom-add-btn');
  if (mkbAddBtn) {
    mkbAddBtn.addEventListener('click', function() {
      var cxml = prompt('Enter cXML UOM code (e.g., LTR):');
      if (!cxml) return;
      var x12 = prompt('Enter X12 UOM code (e.g., LT):');
      if (!x12) return;
      currentMKB.uomCxmlToX12[cxml.toUpperCase()] = x12.toUpperCase();
      renderUOM(document.getElementById('mkb-uom-search').value);
    });
  }

  var mkbSaveBtn = document.getElementById('mkb-save-btn');
  if (mkbSaveBtn) {
    mkbSaveBtn.addEventListener('click', function() {
      saveMKB(currentMKB);
       /* Conversion engine reads from localStorage at runtime — no extra wiring needed */
      var banner = document.createElement('div');
      banner.className = 'banner banner-ok';
      banner.style.marginTop = '8px';
      banner.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;color:var(--ok)">check_circle</span><div>Mapping settings saved successfully.</div>';
      mkbSaveBtn.parentElement.appendChild(banner);
      setTimeout(function() { banner.remove(); }, 3000);
    });
  }

  var mkbResetBtn = document.getElementById('mkb-reset-btn');
  if (mkbResetBtn) {
    mkbResetBtn.addEventListener('click', function() {
      if (!confirm('Reset all mapping settings to defaults? This cannot be undone.')) return;
      localStorage.removeItem(MKB_STORAGE_KEY);
      MKB_DEFAULT = null;
      currentMKB = getMKBDefault();
      renderMKBEditor();
    });
  }

  /* Initial render when tab becomes visible */
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.target.id === 'g-map' && m.target.classList.contains('active')) {
        renderMKBEditor();
      }
    });
  });
  var mapView = document.getElementById('g-map');
  if (mapView) {
    observer.observe(mapView, { attributes: true, attributeFilter: ['class'] });
    /* Also render if already active */
    if (mapView.classList.contains('active')) renderMKBEditor();
  }
})();

/* ===== AIE — Augmented Integration Experience ===== */
(function() {
  var AIE_BACKEND = 'http://localhost:8100';

  /* Arrow-Step Phase Navigation (reuses Integration tab pattern) */
  document.querySelectorAll('#aie-stepper .arrow-step').forEach(function(step) {
    step.addEventListener('click', function() {
      var stage = step.dataset.aieStage;
      if (!stage) return;
      document.querySelectorAll('#aie-stepper .arrow-step').forEach(function(s) { s.classList.remove('selected'); });
      step.classList.add('selected');
      document.querySelectorAll('.aie-stage-view').forEach(function(v) { v.classList.remove('active'); });
      var view = document.getElementById('aie-' + stage);
      if (view) view.classList.add('active');
    });
  });

  /* Method checkbox toggle config visibility */
  document.querySelectorAll('.aie-method-check').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var configId = 'aie-mc-' + cb.id.replace('aie-m-', '');
      var config = document.getElementById(configId);
      if (config) config.style.display = cb.checked ? 'block' : 'none';
    });
  });

  /* Upload zone click */
  var uploadZone = document.getElementById('aie-upload-zone');
  var fileInput = document.getElementById('aie-file-input');
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', function() { fileInput.click(); });
    uploadZone.addEventListener('dragover', function(e) { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', function() { uploadZone.classList.remove('drag-over'); });
    uploadZone.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      handleUploadedFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) handleUploadedFiles(fileInput.files);
    });
  }

  // Pending retrieved transactions (in-memory before save)
  var pendingTransactions = [];

  // Handle uploaded cXML files (manual upload method)
  function handleUploadedFiles(files) {
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      (function(file) {
        promises.push(new Promise(function(resolve) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var content = e.target.result;
            var type = TransactionStore.detectType(content);
            var docNumber = TransactionStore.extractDocNumber(content, type);
            resolve({
              cxml: content,
              source: 'manual_upload',
              filename: file.name,
              docNumber: docNumber,
              type: type,
              date: TransactionStore.extractDate(content) || new Date().toISOString(),
              status: 'New',
              size: content.length
            });
          };
          reader.onerror = function() { resolve(null); };
          reader.readAsText(file);
        }));
      })(files[i]);
    }
    Promise.all(promises).then(function(results) {
      var valid = results.filter(function(r) { return r !== null; });
      valid.forEach(function(txn) { pendingTransactions.push(txn); });
      renderTransactionTable();
      uploadZone.querySelector('div').textContent = valid.length + ' file(s) loaded';
    });
  }

  /* Select all transactions */
  var selectAll = document.getElementById('aie-txn-all');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      document.querySelectorAll('#aie-txn-tbody input[type="checkbox"]').forEach(function(cb) {
        cb.checked = selectAll.checked;
      });
    });
  }

  /* Render transactions table from pendingTransactions */
  function renderTransactionTable() {
    var tbody = document.getElementById('aie-txn-tbody');
    var emptyMsg = document.getElementById('aie-txn-empty');
    var saveRow = document.getElementById('aie-save-row');
    var countBadge = document.getElementById('aie-txn-count');
    var readiness = document.getElementById('aie-retrieval-readiness');
    var readinessText = document.getElementById('aie-readiness-text');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (pendingTransactions.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (saveRow) saveRow.style.display = 'none';
      if (readiness) readiness.style.display = 'none';
      if (countBadge) countBadge.textContent = '0';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (saveRow) saveRow.style.display = 'flex';
    if (countBadge) countBadge.textContent = pendingTransactions.length;
    if (readiness) readiness.style.display = 'flex';
    if (readinessText) readinessText.textContent = 'Retrieval: ' + pendingTransactions.length + ' transactions found';

    var typeLabels = { 'PurchaseOrder': 'PO', 'Invoice': 'INV', 'ShipNotice': 'ASN', 'OrderConfirmation': 'POC', 'cXML-Other': 'cXML', 'Unknown': '??' };
    var sourceIcons = { 'portal_scrape': '🌐', 'network_capture': '📡', 'manual_upload': '📁', 'webhook': '🔗', 'api': '🔌' };
    var statusClasses = { 'New': 'badge-success', 'Processed': 'badge-dur', 'Failed': 'badge-error', 'Partial': 'badge-warning' };

    pendingTransactions.forEach(function(txn, idx) {
      var typeLabel = typeLabels[txn.type] || txn.type;
      var sourceIcon = sourceIcons[txn.source] || '📄';
      var statusClass = statusClasses[txn.status] || 'badge-dur';
      var dateStr = txn.date ? new Date(txn.date).toLocaleDateString() : '';

      var row = document.createElement('tr');
      row.dataset.idx = idx;
      row.innerHTML = '<td><input type="checkbox" checked></td>' +
        '<td title="' + (txn.docNumber || '') + '">' + (txn.docNumber || 'N/A').substring(0, 12) + '</td>' +
        '<td><span class="badge badge-dur">' + typeLabel + '</span></td>' +
        '<td>' + dateStr + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + (txn.status || 'New') + '</span></td>' +
        '<td title="' + txn.source + '">' + sourceIcon + '</td>';
      tbody.appendChild(row);
    });
  }

  /* Retrieve transactions — LIVE from portal (DOM scraping + network captures) */
  var retrieveBtn = document.getElementById('aie-retrieve-btn');
  if (retrieveBtn) retrieveBtn.addEventListener('click', function() {
    retrieveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_top</span> Retrieving...';
    retrieveBtn.disabled = true;

    var activeMethods = {
      upload: document.getElementById('aie-m-upload')?.checked,
      scrape: document.getElementById('aie-m-scrape')?.checked,
      api: document.getElementById('aie-m-api')?.checked
    };

    var retrievalPromises = [];

    // Method A: DOM Scraping from active tab (supplier portal)
    if (activeMethods.scrape) {
      retrievalPromises.push(
        new Promise(function(resolve) {
          chrome.runtime.sendMessage({ type: 'SCRAPE_ACTIVE_TAB' }, function(response) {
            if (response && response.success && response.transactions) {
              response.transactions.forEach(function(txn) {
                pendingTransactions.push({
                  cxml: txn.cxml || null,
                  source: 'portal_scrape',
                  docNumber: txn.docNumber,
                  type: txn.type || 'PurchaseOrder',
                  date: txn.date || new Date().toISOString(),
                  status: txn.status || 'New',
                  amount: txn.amount || '',
                  detailUrl: txn.detailUrl || null,
                  rawText: txn.rawText || '',
                  size: (txn.cxml || '').length
                });
              });
            }
            resolve();
          });
        })
      );
    }

    // Method B: Network interception captures
    retrievalPromises.push(
      new Promise(function(resolve) {
        chrome.runtime.sendMessage({ type: 'GET_NETWORK_CAPTURES' }, function(response) {
          if (response && response.captured && response.captured.length > 0) {
            response.captured.forEach(function(capture) {
              var type = TransactionStore.detectType(capture.content);
              var docNumber = TransactionStore.extractDocNumber(capture.content, type);
              pendingTransactions.push({
                cxml: capture.content,
                source: 'network_capture',
                docNumber: docNumber,
                type: type,
                date: capture.timestamp || new Date().toISOString(),
                status: 'New',
                size: capture.content.length,
                captureUrl: capture.url
              });
            });
          }
          resolve();
        });
      })
    );

    Promise.all(retrievalPromises).then(function() {
      // Deduplicate by docNumber
      var seen = {};
      pendingTransactions = pendingTransactions.filter(function(txn) {
        var key = txn.docNumber + '_' + txn.type;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      });
      renderTransactionTable();
    }).finally(function() {
      retrieveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">sync</span> Retrieve Transactions';
      retrieveBtn.disabled = false;
    });
  });

  /* Save button — persist selected transactions to IndexedDB + chrome.storage */
  var saveBtn = document.getElementById('aie-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', function() {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_top</span> Saving...';

    // Get selected (checked) transaction indices
    var selected = [];
    document.querySelectorAll('#aie-txn-tbody tr').forEach(function(row) {
      var cb = row.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        var idx = parseInt(row.dataset.idx);
        if (!isNaN(idx) && pendingTransactions[idx]) selected.push(pendingTransactions[idx]);
      }
    });

    if (selected.length === 0) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">save</span> Save to Local Storage';
      return;
    }

    // Save each transaction to IndexedDB
    TransactionStore.saveMultiple(selected).then(function(saved) {
      // Update stored count display
      refreshStoredCount();
      // Show success
      saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">check_circle</span> Saved ' + saved.length + ' transactions';
      setTimeout(function() {
        saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">save</span> Save to Local Storage';
        saveBtn.disabled = false;
      }, 2000);
      // Mark retrieval as done
      markStageDone('retrieval');
    }).catch(function(err) {
      saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">error</span> Error: ' + err.message;
      setTimeout(function() {
        saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">save</span> Save to Local Storage';
        saveBtn.disabled = false;
      }, 3000);
    });
  });

  /* Clear button — clear pending transactions */
  var clearBtn = document.getElementById('aie-clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', function() {
    pendingTransactions = [];
    renderTransactionTable();
  });

  /* Refresh stored transaction count + render stored table */
  function refreshStoredCount() {
    TransactionStore.getIndex().then(function(index) {
      var countEl = document.getElementById('aie-stored-count');
      var tableEl = document.getElementById('aie-stored-table');
      var emptyEl = document.getElementById('aie-stored-empty');
      var tbody = document.getElementById('aie-stored-tbody');
      var deleteBtn = document.getElementById('aie-stored-delete-btn');

      if (countEl) countEl.textContent = index.length;

      if (index.length === 0) {
        if (tableEl) tableEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'none';
        return;
      }

      if (tableEl) tableEl.style.display = 'table';
      if (emptyEl) emptyEl.style.display = 'none';
      if (!tbody) return;

      var typeLabels = { 'PurchaseOrder': 'PO', 'Invoice': 'INV', 'ShipNotice': 'ASN', 'OrderConfirmation': 'POC', 'cXML-Other': 'cXML', 'Unknown': '??' };
      var sourceIcons = { 'portal_scrape': '🌐', 'network_capture': '📡', 'manual_upload': '📁', 'webhook': '🔗', 'api': '🔌' };

      tbody.innerHTML = '';
      // Show newest first
      index.slice().reverse().forEach(function(txn) {
        var row = document.createElement('tr');
        row.dataset.id = txn.id;
        var typeLabel = typeLabels[txn.type] || txn.type;
        var sourceIcon = sourceIcons[txn.source] || '📄';
        var dateStr = txn.date ? new Date(txn.date).toLocaleDateString() : '';
        var sizeStr = txn.size > 1024 ? Math.round(txn.size / 1024) + 'K' : txn.size + 'B';
        row.innerHTML = '<td><input type="checkbox" class="aie-stored-cb"></td>' +
          '<td title="' + txn.id + '">' + (txn.docNumber || 'N/A').substring(0, 12) + '</td>' +
          '<td><span class="badge badge-dur">' + typeLabel + '</span></td>' +
          '<td>' + dateStr + '</td>' +
          '<td title="' + txn.source + '">' + sourceIcon + '</td>' +
          '<td>' + sizeStr + '</td>';
        tbody.appendChild(row);
      });
    });
  }

  // Select all stored transactions
  var storedAll = document.getElementById('aie-stored-all');
  if (storedAll) storedAll.addEventListener('change', function() {
    document.querySelectorAll('.aie-stored-cb').forEach(function(cb) { cb.checked = storedAll.checked; });
    toggleStoredDeleteBtn();
  });

  // Show/hide delete button based on selection
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('aie-stored-cb')) toggleStoredDeleteBtn();
  });

  function toggleStoredDeleteBtn() {
    var deleteBtn = document.getElementById('aie-stored-delete-btn');
    var checked = document.querySelectorAll('.aie-stored-cb:checked').length;
    if (deleteBtn) deleteBtn.style.display = checked > 0 ? 'inline-flex' : 'none';
  }

  // Delete selected stored transactions
  var storedDeleteBtn = document.getElementById('aie-stored-delete-btn');
  if (storedDeleteBtn) storedDeleteBtn.addEventListener('click', function() {
    var selectedIds = [];
    document.querySelectorAll('#aie-stored-tbody tr').forEach(function(row) {
      var cb = row.querySelector('.aie-stored-cb');
      if (cb && cb.checked) selectedIds.push(row.dataset.id);
    });
    if (selectedIds.length === 0) return;

    storedDeleteBtn.disabled = true;
    storedDeleteBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">hourglass_top</span> Deleting...';

    Promise.all(selectedIds.map(function(id) { return TransactionStore.deleteById(id); }))
      .then(function() {
        refreshStoredCount();
        storedDeleteBtn.style.display = 'none';
        if (storedAll) storedAll.checked = false;
      })
      .finally(function() {
        storedDeleteBtn.disabled = false;
        storedDeleteBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">delete</span> Delete';
      });
  });

  // Load stored count on init
  refreshStoredCount();

  /* Network capture live indicator */
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.type === 'CXML_CAPTURE_NOTIFY') {
      var captureCard = document.getElementById('aie-capture-card');
      var captureCount = document.getElementById('aie-capture-count');
      var captureLog = document.getElementById('aie-capture-log');
      if (captureCard) captureCard.style.display = 'block';
      var current = parseInt((captureCount?.textContent || '0'));
      if (captureCount) captureCount.textContent = (current + 1) + ' captured';
      if (captureLog) {
        var entry = document.createElement('div');
        entry.textContent = '📡 ' + new Date(msg.timestamp).toLocaleTimeString() + ' — ' + Math.round(msg.size / 1024) + ' KB from ' + (msg.url || 'unknown').substring(0, 40);
        captureLog.appendChild(entry);
        // Keep only last 10 entries
        while (captureLog.children.length > 11) captureLog.removeChild(captureLog.children[1]);
      }
    }
  });

  /* Send to Analyzer */
  var toAnalyzer = document.getElementById('aie-to-analyzer');
  if (toAnalyzer) toAnalyzer.addEventListener('click', function() {
    // Get selected transactions from pending list
    var selected = [];
    document.querySelectorAll('#aie-txn-tbody tr').forEach(function(row) {
      var cb = row.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        var idx = parseInt(row.dataset.idx);
        if (!isNaN(idx) && pendingTransactions[idx]) selected.push(pendingTransactions[idx]);
      }
    });
    // Store for analyzer to use
    window.aieSelectedTransactions = selected;
    markStageDone('retrieval');
    navigateStage('analyzer');
  });

  /* Analyze button — calls backend with selected POs */
  var analyzeBtn = document.getElementById('aie-analyze-btn');
  if (analyzeBtn) analyzeBtn.addEventListener('click', function() {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">hourglass_top</span> Analyzing...';

    // Get selected PO numbers from retrieval table
    var selectedPOs = [];
    document.querySelectorAll('#aie-txn-table tbody tr').forEach(function(row) {
      var cb = row.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        var poNum = row.querySelector('td:nth-child(2)');
        if (poNum) selectedPOs.push(poNum.textContent.trim());
      }
    });
    var basePO = selectedPOs[0] || '7800459912';

    fetch(AIE_BACKEND + '/api/aie/generate-scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basePO: basePO,
        scenarios: [
          document.getElementById('aie-sc1').checked ? 'multi-line-split' : null,
          document.getElementById('aie-sc2').checked ? 'no-supplier-part' : null,
          document.getElementById('aie-sc3').checked ? 'adhoc-shipto' : null
        ].filter(Boolean)
      })
    }).then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        document.getElementById('aie-analyze-result').style.display = 'block';
        document.getElementById('aie-analyzer-readiness').style.display = 'flex';
        document.getElementById('aie-to-creator').style.display = 'inline-flex';
        document.getElementById('aie-version-count').textContent = data.scenarios.length;

        // Store scenarios for Creator/Tester
        window.aieScenarios = data.scenarios;
        window.aieBasePO = basePO;

        // Update Creator table
        updateCreatorTable(data.scenarios);
        // Update Tester table
        updateTesterTable(data.scenarios, basePO);

        markStageDone('analyzer');
      }
    })
    .catch(function(err) {
      document.getElementById('aie-analyze-result').style.display = 'block';
      document.getElementById('aie-analyzer-readiness').style.display = 'flex';
      document.getElementById('aie-to-creator').style.display = 'inline-flex';
      markStageDone('analyzer');
    })
    .finally(function() {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">auto_awesome</span> Analyze & Create Versions';
    });
  });

  /* Go to Creator */
  var toCreator = document.getElementById('aie-to-creator');
  if (toCreator) toCreator.addEventListener('click', function() { navigateStage('creator'); });

  /* Go to Tester */
  var toTester = document.getElementById('aie-to-tester');
  if (toTester) toTester.addEventListener('click', function() { navigateStage('tester'); });

  /* Download Excel — real file download */
  var dlExcel = document.getElementById('aie-download-excel');
  if (dlExcel) dlExcel.addEventListener('click', function() {
    var basePO = window.aieBasePO || '7800459912';
    dlExcel.disabled = true;
    dlExcel.textContent = 'Generating...';

    fetch(AIE_BACKEND + '/api/aie/download-excel/' + basePO)
      .then(function(r) {
        if (r.ok) return r.blob();
        throw new Error('Generation failed');
      })
      .then(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'AIE-Integration-Guide-' + basePO + '.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        document.getElementById('aie-creator-readiness').style.display = 'flex';
        markStageDone('creator');
      })
      .catch(function(err) { alert('Error: ' + err.message + '. Ensure backend is running.'); })
      .finally(function() {
        dlExcel.disabled = false;
        dlExcel.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">table_view</span> Download Excel Guide';
      });
  });

  /* Download cXMLs as zip (individual downloads for now) */
  var dlZip = document.getElementById('aie-download-cxml-zip');
  if (dlZip) dlZip.addEventListener('click', function() {
    var scenarios = window.aieScenarios || [];
    var ids = scenarios.map(function(s) {
      return s.name.toLowerCase().includes('multi') ? 'multi-line-split' :
             s.name.toLowerCase().includes('supplier') ? 'no-supplier-part' : 'adhoc-shipto';
    });
    ids.forEach(function(id) {
      fetch(AIE_BACKEND + '/api/aie/download-cxml/' + id)
        .then(function(r) { if (r.ok) return r.blob(); })
        .then(function(blob) {
          if (!blob) return;
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'scenario-' + id + '.cxml';
          a.click();
          URL.revokeObjectURL(url);
        });
    });
  });

  /* Send Test via CIG — real cXML push to SBN */
  document.querySelectorAll('.aie-send-test').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var row = btn.closest('tr');
      var version = row.querySelector('td:nth-child(2)').textContent.trim();
      var scenarioId = version.toLowerCase().includes('multi') ? 'multi-line-split' :
                       version.toLowerCase().includes('supplier') ? 'no-supplier-part' : 'adhoc-shipto';
      var basePO = window.aieBasePO || '7800459912';

      btn.textContent = 'Sending...';
      btn.disabled = true;

      fetch(AIE_BACKEND + '/api/aie/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poNumber: basePO, scenarioId: scenarioId })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-success">Sent</span>';
          row.querySelector('td:nth-child(5)').innerHTML = data.status === 'sent'
            ? '<span class="badge badge-success">200 OK</span>'
            : '<span class="badge badge-warning">' + data.status + '</span>';
          btn.textContent = 'Resend';
        } else {
          row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-error">Failed</span>';
          row.querySelector('td:nth-child(5)').innerHTML = '<span class="badge badge-error">' + (data.error || 'Error').substring(0, 30) + '</span>';
          btn.textContent = 'Retry';
        }
      })
      .catch(function(err) {
        row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-error">Error</span>';
        btn.textContent = 'Retry';
      })
      .finally(function() { btn.disabled = false; updateReadiness(); });
    });
  });

  /* Fetch config from buyer */
  var fetchConfig = document.getElementById('aie-fetch-config');
  if (fetchConfig) fetchConfig.addEventListener('click', function() {
    fetchConfig.textContent = 'Fetching...';
    fetchConfig.disabled = true;
    setTimeout(function() {
      fetchConfig.textContent = 'Fetched!';
      setTimeout(function() { fetchConfig.textContent = 'Fetch from Buyer'; fetchConfig.disabled = false; }, 1500);
    }, 2000);
  });

  /* Helpers */
  function navigateStage(stage) {
    document.querySelectorAll('#aie-stepper .arrow-step').forEach(function(s) { s.classList.remove('selected'); });
    var target = document.querySelector('[data-aie-stage="' + stage + '"]');
    if (target) target.classList.add('selected');
    document.querySelectorAll('.aie-stage-view').forEach(function(v) { v.classList.remove('active'); });
    var view = document.getElementById('aie-' + stage);
    if (view) view.classList.add('active');
  }

  function markStageDone(stage) {
    var el = document.querySelector('[data-aie-stage="' + stage + '"]');
    if (el) {
      el.classList.add('done');
      var inner = el.querySelector('.arrow-inner');
      if (inner) {
        var icon = inner.querySelector('.arrow-icon');
        var num = inner.querySelector('.arrow-num');
        if (!icon) {
          var newIcon = document.createElement('span');
          newIcon.className = 'arrow-icon material-symbols-rounded';
          newIcon.textContent = 'check_circle';
          inner.insertBefore(newIcon, inner.firstChild);
        }
        if (num) num.style.display = 'none';
      }
    }
    updateReadiness();
  }

  function updateReadiness() {
    var checks = document.querySelectorAll('#aie-checklist input[type="checkbox"]');
    var checked = 0;
    checks.forEach(function(c) { if (c.checked) checked++; });
    var score = Math.round((checked / checks.length) * 100);
    var valueEl = document.getElementById('aie-readiness-value');
    var detailEl = document.getElementById('aie-readiness-detail');
    var ringEl = document.getElementById('aie-readiness-ring');
    if (valueEl) valueEl.textContent = score + '%';
    if (detailEl) detailEl.textContent = checked + ' of ' + checks.length + ' checks passed';
    if (ringEl) {
      ringEl.classList.remove('good', 'mid');
      if (score >= 80) ringEl.classList.add('good');
      else if (score >= 40) ringEl.classList.add('mid');
    }
  }

  function updateCreatorTable(scenarios) {
    var tbody = document.getElementById('aie-versions-table');
    if (!tbody) return;
    var tbodyEl = tbody.querySelector('tbody');
    if (!tbodyEl) return;
    tbodyEl.innerHTML = '';
    scenarios.forEach(function(sc, i) {
      var items = sc.description.match(/\d+ /) ? sc.description.match(/\d+/)[0] : (i === 0 ? '3' : '4');
      tbodyEl.innerHTML += '<tr><td>' + (i + 1) + '</td><td><b>' + sc.name.replace(/Scenario \d+: /, '') + '</b></td>' +
        '<td>' + sc.description + '</td><td>' + items + '</td>' +
        '<td><span class="badge badge-success">Ready</span></td></tr>';
    });
  }

  function updateTesterTable(scenarios, basePO) {
    var tbody = document.querySelector('#aie-test-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    scenarios.forEach(function(sc) {
      var shortName = sc.name.replace(/Scenario \d+: /, '');
      var scenarioId = sc.name.toLowerCase().includes('multi') ? 'multi-line-split' :
                       sc.name.toLowerCase().includes('supplier') ? 'no-supplier-part' : 'adhoc-shipto';
      tbody.innerHTML += '<tr>' +
        '<td>OC for PO ' + basePO + '</td>' +
        '<td>' + shortName + '</td>' +
        '<td><span class="badge badge-dur">Outbound</span></td>' +
        '<td><span class="badge badge-dur">Not sent</span></td>' +
        '<td>—</td>' +
        '<td><button class="aie-btn-sm aie-send-test" data-scenario="' + scenarioId + '">Send via CIG</button></td></tr>';
    });

    // Re-attach event listeners for new buttons
    tbody.querySelectorAll('.aie-send-test').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = btn.closest('tr');
        var sid = btn.dataset.scenario;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        fetch(AIE_BACKEND + '/api/aie/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poNumber: basePO, scenarioId: sid })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-success">Sent</span>';
            row.querySelector('td:nth-child(5)').innerHTML = data.status === 'sent'
              ? '<span class="badge badge-success">200 OK</span>'
              : '<span class="badge badge-warning">' + data.status + '</span>';
            btn.textContent = 'Resend';
          } else {
            row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-error">Failed</span>';
            row.querySelector('td:nth-child(5)').innerHTML = '<span class="badge badge-error">' + (data.error || '').substring(0, 25) + '</span>';
            btn.textContent = 'Retry';
          }
        })
        .catch(function() {
          row.querySelector('td:nth-child(4)').innerHTML = '<span class="badge badge-error">Error</span>';
          btn.textContent = 'Retry';
        })
        .finally(function() { btn.disabled = false; updateReadiness(); });
      });
    });
  }

  updateReadiness();
})();

/* ===== cXML ANONYMIZER UI ===== */
(function() {
  var dropZone = document.getElementById('anon-drop-zone');
  var fileInput = document.getElementById('anon-file-input');
  var fileList = document.getElementById('anon-file-list');
  var processBtn = document.getElementById('anon-process-btn');
  var clearBtn = document.getElementById('anon-clear-btn');
  var summaryBanner = document.getElementById('anon-summary-banner');
  var fileCountEl = document.getElementById('anon-file-count');
  var progressEl = document.getElementById('anon-progress');
  var progFill = document.getElementById('anon-prog-fill');
  var progText = document.getElementById('anon-prog-text');
  var progPct = document.getElementById('anon-prog-pct');
  var resultsEl = document.getElementById('anon-results');
  var resultList = document.getElementById('anon-result-list');
  var resultCountEl = document.getElementById('anon-result-count');
  var downloadZipBtn = document.getElementById('anon-download-zip');
  var downloadLogBtn = document.getElementById('anon-download-log');
  var regionSelect = document.getElementById('anon-region');

  if (!dropZone || !fileInput) return; // guard if DOM not ready

  var pendingFiles = [];
  var processedResults = [];

  // Drop zone events
  dropZone.addEventListener('click', function() { fileInput.click(); });
  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-active'); });
  dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drag-active'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', function() { addFiles(fileInput.files); fileInput.value = ''; });

  function addFiles(fileListInput) {
    var remaining = CxmlAnonymizer.MAX_FILES - pendingFiles.length;
    var added = 0;
    for (var i = 0; i < fileListInput.length && added < remaining; i++) {
      var f = fileListInput[i];
      if (f.size > CxmlAnonymizer.MAX_FILE_SIZE_MB * 1024 * 1024) continue;
      pendingFiles.push(f);
      added++;
    }
    renderFileList();
  }

  function renderFileList() {
    if (!pendingFiles.length) {
      fileList.style.display = 'none';
      summaryBanner.style.display = 'none';
      processBtn.disabled = true;
      return;
    }
    fileList.style.display = 'block';
    summaryBanner.style.display = 'block';
    fileCountEl.textContent = pendingFiles.length;
    processBtn.disabled = false;
    fileList.innerHTML = pendingFiles.map(function(f, i) {
      var sizeKB = (f.size / 1024).toFixed(1);
      return '<div class="anon-file-item" style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;border-bottom:1px solid var(--border);font-size:12px">' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + f.name + '">' + f.name + '</span>' +
        '<span style="color:var(--text2);margin:0 8px">' + sizeKB + ' KB</span>' +
        '<button class="anon-remove-btn" data-idx="' + i + '" style="border:none;background:none;cursor:pointer;color:var(--error);font-size:14px">✕</button>' +
        '</div>';
    }).join('');
    fileList.querySelectorAll('.anon-remove-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        pendingFiles.splice(parseInt(btn.dataset.idx), 1);
        renderFileList();
      });
    });
  }

  clearBtn.addEventListener('click', function() {
    pendingFiles = [];
    processedResults = [];
    renderFileList();
    resultsEl.style.display = 'none';
    progressEl.style.display = 'none';
  });

  processBtn.addEventListener('click', async function() {
    if (!pendingFiles.length) return;
    processBtn.disabled = true;
    progressEl.style.display = 'block';
    resultsEl.style.display = 'none';
    var region = regionSelect.value;
    var dryRun = document.getElementById('anon-dryrun').checked;

    // Read all files
    var fileContents = [];
    for (var i = 0; i < pendingFiles.length; i++) {
      progText.textContent = 'Reading ' + pendingFiles[i].name + '...';
      progPct.textContent = Math.round(((i + 1) / pendingFiles.length) * 30) + '%';
      progFill.style.width = Math.round(((i + 1) / pendingFiles.length) * 30) + '%';
      var text = await pendingFiles[i].text();
      fileContents.push({ name: pendingFiles[i].name, content: text });
    }

    // Process
    processedResults = CxmlAnonymizer.processBatch(fileContents, region, function(done, total) {
      var pct = 30 + Math.round((done / total) * 70);
      progText.textContent = 'Anonymizing ' + done + '/' + total + '...';
      progPct.textContent = pct + '%';
      progFill.style.width = pct + '%';
    });

    // Attach source content to results for preview
    for (var j = 0; j < processedResults.length; j++) {
      if (fileContents[j]) processedResults[j]._sourceContent = fileContents[j].content;
    }

    // Show results
    progText.textContent = 'Done!';
    progPct.textContent = '100%';
    progFill.style.width = '100%';
    setTimeout(function() { progressEl.style.display = 'none'; }, 1500);

    renderResults();
    processBtn.disabled = false;
  });

  function renderResults() {
    resultsEl.style.display = 'block';
    var successCount = processedResults.filter(function(r) { return r.success; }).length;
    resultCountEl.textContent = successCount + '/' + processedResults.length + ' files';
    resultList.innerHTML = processedResults.map(function(r, idx) {
      var icon = r.success ? '✓' : '✗';
      var color = r.success ? 'var(--ok)' : 'var(--error)';
      var detail = r.success
        ? (r.detection ? r.detection.country + ' (' + r.detection.method + ')' : '') + ' — ' + r.substitutionCount + ' substitutions'
        : r.error;
      var docLabel = r.docMeta ? r.docMeta.label : '';
      return '<div class="anon-result-row" data-idx="' + idx + '" style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-bottom:1px solid var(--border);font-size:11px;cursor:pointer">' +
        '<span style="color:' + color + ';font-weight:700">' + icon + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + r.filename + '">' + r.filename + '</span>' +
        (docLabel ? '<span class="badge" style="font-size:9px">' + docLabel + '</span>' : '') +
        '<span style="color:var(--text2);font-size:10px">' + detail + '</span>' +
        '</div>';
    }).join('');

    // Show preview panels if we have successful results
    var sourceCard = document.getElementById('anon-source-card');
    var outputCard = document.getElementById('anon-output-card');
    var sourceSelect = document.getElementById('anon-source-select');
    var sourcePre = document.getElementById('anon-source-pre');
    var outputPre = document.getElementById('anon-output-pre');

    var successful = processedResults.filter(function(r) { return r.success; });
    if (successful.length > 0) {
      sourceCard.style.display = 'block';
      outputCard.style.display = 'block';

      // Populate file selector
      sourceSelect.innerHTML = successful.map(function(r, i) {
        return '<option value="' + i + '">' + r.filename + '</option>';
      }).join('');

      // Show first file preview
      showPreview(0);

      sourceSelect.addEventListener('change', function() {
        showPreview(parseInt(sourceSelect.value));
      });

      // Click on result row to select that file in preview
      resultList.querySelectorAll('.anon-result-row').forEach(function(row) {
        row.addEventListener('click', function() {
          var idx = parseInt(row.dataset.idx);
          var r = processedResults[idx];
          if (!r || !r.success) return;
          var successIdx = successful.indexOf(r);
          if (successIdx >= 0) {
            sourceSelect.value = successIdx;
            showPreview(successIdx);
          }
        });
      });
    } else {
      sourceCard.style.display = 'none';
      outputCard.style.display = 'none';
    }

    function showPreview(successIdx) {
      var r = successful[successIdx];
      if (!r) return;
      // Find original content from pendingFiles
      var originalContent = '';
      for (var i = 0; i < pendingFiles.length; i++) {
        if (pendingFiles[i].name === r.filename) {
          // We already read files — store them during processing
          break;
        }
      }
      // Use stored source content
      if (r._sourceContent) {
        sourcePre.textContent = r._sourceContent;
      } else {
        sourcePre.textContent = '(Source not available — file was processed)';
      }
      outputPre.textContent = r.output || '(No output)';
    }
  }

  // Collapse toggle for preview panels
  document.querySelectorAll('.anon-collapse-hdr').forEach(function(hdr) {
    hdr.addEventListener('click', function() {
      var targetId = hdr.getAttribute('data-target');
      var body = document.getElementById(targetId);
      if (!body) return;
      var isCollapsed = hdr.classList.toggle('collapsed');
      if (isCollapsed) {
        body.classList.add('collapsed');
      } else {
        body.classList.remove('collapsed');
      }
    });
  });

  downloadZipBtn.addEventListener('click', async function() {
    if (!processedResults.length) return;
    var successful = processedResults.filter(function(r) { return r.success; });
    if (!successful.length) return;

    // Each file downloads as Anonymize_originalname.cxml
    if (successful.length === 1) {
      var r = successful[0];
      var stem = r.filename.replace(/\.[^.]+$/, '');
      var blob = new Blob([r.output], { type: 'text/xml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Anonymize_' + stem + '.cxml';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Multiple files — ZIP with Anonymize_name.cxml entries
    if (typeof JSZip !== 'undefined') {
      var zip = new JSZip();
      successful.forEach(function(r) {
        var stem = r.filename.replace(/\.[^.]+$/, '');
        zip.file('Anonymize_' + stem + '.cxml', r.output);
      });
      var zipBlob = await zip.generateAsync({ type: 'blob' });
      var url = URL.createObjectURL(zipBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Anonymized_cXML_' + new Date().toISOString().slice(0, 10) + '.zip';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Fallback: download each individually
      successful.forEach(function(r) {
        var stem = r.filename.replace(/\.[^.]+$/, '');
        var blob = new Blob([r.output], { type: 'text/xml' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Anonymize_' + stem + '.cxml';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  });

  downloadLogBtn.addEventListener('click', function() {
    if (!processedResults.length) return;
    var successful = processedResults.filter(function(r) { return r.success && r.log; });
    if (!successful.length) return;

    // Build Excel workbook using xlsx library (already loaded)
    if (typeof XLSX === 'undefined') {
      alert('Excel library not loaded. Please reload the extension.');
      return;
    }

    var wb = XLSX.utils.book_new();

    // Summary sheet
    var summaryData = [['Filename', 'Document Type', 'Region', 'Detection Method', 'Substitutions', 'Status']];
    processedResults.forEach(function(r) {
      summaryData.push([
        r.filename,
        r.docMeta ? r.docMeta.label : '',
        r.detection ? r.detection.country : '',
        r.detection ? r.detection.method : '',
        r.success ? r.substitutionCount : 0,
        r.success ? 'Success' : 'Failed: ' + (r.error || '')
      ]);
    });
    var wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{wch:30},{wch:20},{wch:8},{wch:25},{wch:12},{wch:20}];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Detail sheet — all substitutions
    var detailData = [['Filename', 'Field', 'Original Value', 'Anonymized Value']];
    successful.forEach(function(r) {
      r.log.forEach(function(entry) {
        detailData.push([r.filename, entry.field, entry.original, entry.anonymized]);
      });
    });
    var wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    wsDetail['!cols'] = [{wch:25},{wch:35},{wch:40},{wch:40}];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Substitutions');

    // Write and download
    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    var blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Anonymization_Log_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  });
})();
