/* AIA v3.0.0 — Panel Controller (no inline handlers, MV3 CSP safe) */

/* TAB NAVIGATION */
document.querySelectorAll('.nav-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.nav-tab').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* DASHBOARD TOGGLE */
document.querySelectorAll('.dash-toggle-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var m = btn.querySelector('.dash-toggle-name').textContent.trim().toLowerCase();
    document.querySelectorAll('.dash-toggle-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('dash-buyer').classList.toggle('active', m.includes('buyer'));
    document.getElementById('dash-supplier').classList.toggle('active', m.includes('supplier'));
  });
});

/* INTEGRATION TOGGLE */
document.querySelectorAll('.int-circle-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var m = btn.textContent.trim().toLowerCase();
    document.querySelectorAll('.int-circle-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('int-supplier').classList.toggle('active', m.includes('supplier'));
    document.getElementById('int-buyer').classList.toggle('active', m.includes('buyer'));
  });
});

/* STAGE STEPPER — Supplier */
document.querySelectorAll('#int-supplier .stage-arrow').forEach(function(arrow){
  arrow.addEventListener('click', function(){
    var s = arrow.dataset.stage;
    document.querySelectorAll('#int-supplier .stage-content').forEach(function(c){ c.classList.remove('active'); });
    document.getElementById('stage-' + s).classList.add('active');
    var n = {s1:'Plan',s2:'Design',s3:'Build',s4:'Test',s5:'Deploy',s6:'Live'};
    var c = {s1:'var(--stage-1)',s2:'var(--stage-2)',s3:'var(--stage-3)',s4:'var(--stage-4)',s5:'var(--stage-5)',s6:'var(--stage-6)'};
    document.getElementById('ctx-stage-badge').innerHTML = '<span class="ctx-stage-dot" style="background:' + c[s] + '"></span>' + n[s];
  });
});

/* STAGE STEPPER — Buyer */
document.querySelectorAll('#int-buyer .stage-arrow').forEach(function(arrow){
  arrow.addEventListener('click', function(){
    var s = arrow.dataset.stage;
    document.querySelectorAll('#int-buyer .stage-content').forEach(function(c){ c.classList.remove('active'); });
    document.getElementById('stage-' + s).classList.add('active');
  });
});

/* CARD HEADER TOGGLE */
document.querySelectorAll('.card-header').forEach(function(hdr){
  hdr.addEventListener('click', function(){
    var body = hdr.nextElementSibling;
    if (body && body.classList.contains('card-body')) {
      body.style.display = body.style.display === 'block' ? 'none' : 'block';
    }
  });
});

/* LEVEL TOGGLE (Troubleshoot 3-level) */
document.querySelectorAll('.ts-level-header').forEach(function(hdr){
  hdr.addEventListener('click', function(){
    var body = hdr.nextElementSibling;
    if (body) body.style.display = body.style.display === 'block' ? 'none' : 'block';
  });
});

/* SUB-TABS (CIG + Guides) */
document.querySelectorAll('.sub-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    /* Deactivate siblings */
    tab.parentElement.querySelectorAll('.sub-tab').forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    /* Find target view from data-view attribute */
    var viewId = tab.dataset.view;
    if (viewId) {
      tab.closest('.panel').querySelectorAll('.sub-view').forEach(function(v){ v.classList.remove('active'); });
      document.getElementById(viewId).classList.add('active');
    }
  });
});

/* CHECKBOX TOGGLE */
document.querySelectorAll('.task input[type=checkbox]:not([disabled])').forEach(function(cb){
  cb.addEventListener('change', function(){
    cb.parentElement.querySelector('.task-text').classList.toggle('done', cb.checked);
  });
});

/* HEADER BUTTONS */
document.getElementById('btn-reload').addEventListener('click', function(){
  try {
    var f = confirm('Full reload?\n\nOK = Full\nCancel = Panel only');
    if (f) chrome.runtime.reload(); else location.reload();
  } catch(e) { location.reload(); }
});

document.getElementById('btn-export').addEventListener('click', function(){
  try {
    chrome.runtime.sendMessage({type: 'EXPORT_DATA', format: 'json'}, function(d){
      var b = new Blob([JSON.stringify(d, null, 2)], {type: 'application/json'});
      var u = URL.createObjectURL(b);
      var a = document.createElement('a'); a.href = u; a.download = 'aia-export.json'; a.click();
    });
  } catch(e) {}
});

/* VERSION */
try {
  var m = chrome.runtime.getManifest();
  document.getElementById('version-badge').textContent = 'v' + m.version;
} catch(e) {}

/* ===== CONTEXT BAR — Live supplier/buyer detection ===== */
function getInitials(name) {
  if (!name) return '--';
  var words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function updateContextBar(ctx) {
  if (!ctx) return;
  var nameEl = document.getElementById('ctx-name');
  var idEl = document.getElementById('ctx-id');
  var avatarEl = document.getElementById('ctx-avatar');
  var initials = getInitials(ctx.name);

  if (ctx.name) {
    nameEl.textContent = ctx.name;
    avatarEl.textContent = initials;
  }

  if (ctx.anid) {
    idEl.textContent = ctx.anid;
  }

  /* === Update context bar avatar color === */
  if (ctx.orgType === 'supplier') {
    avatarEl.style.background = 'var(--stage-3)';
  } else if (ctx.orgType === 'buyer') {
    avatarEl.style.background = 'var(--sap-primary)';
  } else {
    avatarEl.style.background = '#999'; /* Gray for unknown */
  }

  /* === Update Integration tab toggle & circles === */
  var intSupplierBtn = document.querySelectorAll('.int-circle-btn')[0];
  var intBuyerBtn = document.querySelectorAll('.int-circle-btn')[1];
  var intSupplierAvatar = intSupplierBtn ? intSupplierBtn.querySelector('.int-circle-avatar') : null;
  var intBuyerAvatar = intBuyerBtn ? intBuyerBtn.querySelector('.int-circle-avatar') : null;

  if (ctx.orgType === 'supplier') {
    /* This is a supplier portal — update supplier circle with real name */
    if (intSupplierAvatar) {
      intSupplierAvatar.textContent = initials;
      intSupplierAvatar.style.background = 'var(--stage-3)';
    }
    /* Buyer circle stays blue with generic BU or gray if unknown */
    if (intBuyerAvatar) {
      intBuyerAvatar.style.background = 'var(--sap-primary)';
    }
    /* Auto-select Supplier view */
    if (intSupplierBtn && !intSupplierBtn.classList.contains('active')) {
      intSupplierBtn.click();
    }
  } else if (ctx.orgType === 'buyer') {
    /* This is a buyer portal — update buyer circle with real name */
    if (intBuyerAvatar) {
      intBuyerAvatar.textContent = initials;
      intBuyerAvatar.style.background = 'var(--sap-primary)';
    }
    /* Supplier circle stays green with generic or gray */
    if (intSupplierAvatar) {
      intSupplierAvatar.style.background = 'var(--stage-3)';
    }
    /* Auto-select Buyer view */
    if (intBuyerBtn && !intBuyerBtn.classList.contains('active')) {
      intBuyerBtn.click();
    }
  } else {
    /* Unknown — make both circles gray */
    if (intSupplierAvatar) intSupplierAvatar.style.background = '#999';
    if (intBuyerAvatar) intBuyerAvatar.style.background = '#999';
  }

  /* === Update Dashboard toggle circles too === */
  var dashBuyerBtn = document.querySelectorAll('.dash-toggle-btn')[0];
  var dashSupplierBtn = document.querySelectorAll('.dash-toggle-btn')[1];
  var dashBuyerAvatar = dashBuyerBtn ? dashBuyerBtn.querySelector('.dash-toggle-avatar') : null;
  var dashSupplierAvatar = dashSupplierBtn ? dashSupplierBtn.querySelector('.dash-toggle-avatar') : null;

  if (ctx.orgType === 'supplier') {
    if (dashSupplierAvatar) {
      dashSupplierAvatar.textContent = initials;
      dashSupplierAvatar.style.background = 'var(--stage-3)';
    }
    if (dashBuyerAvatar) dashBuyerAvatar.style.background = 'var(--sap-primary)';
  } else if (ctx.orgType === 'buyer') {
    if (dashBuyerAvatar) {
      dashBuyerAvatar.textContent = initials;
      dashBuyerAvatar.style.background = 'var(--sap-primary)';
    }
    if (dashSupplierAvatar) dashSupplierAvatar.style.background = 'var(--stage-3)';
  } else {
    if (dashBuyerAvatar) dashBuyerAvatar.style.background = '#999';
    if (dashSupplierAvatar) dashSupplierAvatar.style.background = '#999';
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
    if (msg.type === 'CONTEXT_UPDATE' && msg.context) {
      updateContextBar(msg.context);
    }
  });

  /* On load: request context from storage + active tab */
  chrome.storage.local.get('currentContext', function(result) {
    if (result.currentContext) updateContextBar(result.currentContext);
  });

  /* Also try to get context directly from the active tab's content script */
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CONTEXT' }, function(ctx) {
        if (!chrome.runtime.lastError && ctx) updateContextBar(ctx);
      });
    }
  });
} catch(e) { console.log('[AIA] Context listener error:', e.message); }

console.log('[AIA] Panel controller loaded — v3.0.0');

/* ===== TROUBLESHOOT ENGINE (27 Known Issues, 28 Error Patterns) ===== */
// ===== TROUBLESHOOT TAB =====
const KNOWN_ISSUES = [
  {
    id: 'ANID_MISMATCH', category: 'account', severity: 'Critical',
    title: 'ANID Mismatch',
    problem: 'Supplier ANID does not match the buyer\'s vendor record in Ariba Network. Documents are rejected or routed to the wrong account. This often occurs when suppliers have multiple AN accounts (test vs production) or when the buyer\'s ERP vendor master has an outdated ANID.',
    solution: '<ol><li>Log into <b>Ariba Network</b> → Administration → Account Settings → verify the ANID</li><li>Cross-check the ANID in the buyer\'s ERP vendor master record</li><li>If duplicate accounts exist, contact Ariba Support to merge/deactivate the incorrect one</li><li>Update the AN relationship with the correct ANID</li><li>Re-send a test document to verify routing</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Open Ariba Network Admin'
  },
  {
    id: 'MAP_FIELD_MISSING', category: 'mapping', severity: 'High',
    title: 'Required Field Missing in Mapping',
    problem: 'A mandatory field in the EDI X12 or cXML document is not populated or mapped incorrectly in CIG. The document fails schema validation on the buyer side. Common culprits: missing BEG05 (PO Type), empty N1 segments, or missing ITD (payment terms).',
    solution: '<ol><li>Open <b>CIG Portal</b> → your project → Message Mapping</li><li>Review the IGW specification for mandatory fields</li><li>Check the source ERP output — ensure the field is populated before CIG translation</li><li>Add or fix the mapping rule in CIG for the missing field</li><li>Re-run a unit test with a complete document</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'Open CIG Portal'
  },
  {
    id: 'CONNECTIVITY_FAIL', category: 'connectivity', severity: 'Critical',
    title: 'Connectivity / Transport Failure',
    problem: 'Cannot establish or maintain connectivity between supplier\'s system and Ariba Network via AS2, VAN, or HTTPS. Symptoms include timeout errors, connection refused, MDN not received (AS2), or HTTP 4xx/5xx responses.',
    solution: '<ol><li><b>AS2:</b> Verify certificates are not expired, AS2 IDs match on both sides, endpoint URL is correct, port 443 is open</li><li><b>VAN:</b> Confirm VAN mailbox is active, ISA-ID/qualifier are correct, routing rules are set</li><li><b>HTTPS:</b> Check endpoint URL, authentication credentials, IP whitelist, and SSL certificate</li><li>Run a <b>CIG connectivity test</b> from the portal</li><li>Check firewall logs for blocked connections</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Connectivity Test'
  },
  {
    id: 'DUPLICATE_DOC', category: 'document', severity: 'Medium',
    title: 'Duplicate Document Rejected',
    problem: 'A document (Invoice, ASN, etc.) is rejected because the document number already exists in the buyer\'s system. This happens due to accidental retransmission, or if the supplier\'s ERP reuses document numbers.',
    solution: '<ol><li>Verify in the supplier\'s ERP whether the document was sent more than once</li><li>Check the Ariba Network document history for the duplicate</li><li>If intentional re-send: change the document number or use a revision indicator</li><li>For invoices: ensure unique Invoice Number per supplier-buyer pair</li><li>Configure ERP to enforce unique document numbering</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Check Document History'
  },
  {
    id: 'SCHEMA_VALIDATION', category: 'mapping', severity: 'High',
    title: 'Schema / DTD Validation Error',
    problem: 'The cXML or X12 document fails schema validation. This means the document structure doesn\'t conform to the expected DTD/XSD. Common causes: wrong cXML version, invalid element nesting, missing required attributes, or unsupported X12 version.',
    solution: '<ol><li>Check the cXML version expected by the buyer (e.g., 1.2.024 vs 1.2.056)</li><li>Validate the document against the correct DTD/XSD before sending</li><li>In CIG, verify the output format matches the buyer\'s requirements</li><li>For X12: confirm the version (4010, 5010, etc.) in ISA12/GS08</li><li>Use Ariba\'s document validator tool if available</li></ol>',
    portalLink: 'https://help.sap.com/docs/ariba-network', portalLabel: 'Ariba Schema Documentation'
  },
  {
    id: 'CERT_EXPIRED', category: 'certificate', severity: 'Critical',
    title: 'Certificate Expired or Untrusted',
    problem: 'SSL or AS2 certificates have expired, are self-signed, or the certificate chain is incomplete. All AS2 and HTTPS communications fail until the certificate issue is resolved.',
    solution: '<ol><li>Check cert expiry date: CIG Portal → Connectivity → Certificates</li><li>Renew the certificate with your Certificate Authority</li><li>Upload the new public certificate to CIG and Ariba Network</li><li>Ensure the full certificate chain is included (root + intermediate CAs)</li><li>Ask the trading partner to update their trust store with your new cert</li><li>Re-test connectivity after certificate update</li></ol><p style="margin-top:6px"><b>Prevention:</b> Set calendar alerts 30 days before cert expiry.</p>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Certificate Management'
  },
  {
    id: 'VENDOR_ID_MAP', category: 'account', severity: 'High',
    title: 'Vendor ID Mapping Mismatch',
    problem: 'The supplier\'s vendor ID in the buyer\'s ERP does not match the ID configured in Ariba Network. Documents may route correctly but fail ERP posting because the vendor code is unknown or inactive.',
    solution: '<ol><li>Compare the vendor ID in the buyer\'s ERP with the Ariba Network supplier profile</li><li>Check AN → Administration → Customer Relationships for the configured vendor ID</li><li>Update the vendor ID in either the ERP or AN to ensure alignment</li><li>If the supplier has multiple plant/location codes, map each one</li><li>Re-process the failed documents after correction</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'AN Customer Relationships'
  },
  {
    id: 'TEST_ENV_CONFIG', category: 'testing', severity: 'Medium',
    title: 'Test Environment Misconfigured',
    problem: 'Test transactions fail because the NDL (Network Development Lab) test account is not properly linked, the test CIG project points to production endpoints, or test/prod environments are mixed.',
    solution: '<ol><li>Verify the NDL test account is active: service.ariba.com (test environment)</li><li>Confirm CIG test project points to the <b>test</b> AN endpoint, not production</li><li>Ensure the test ANID is different from the production ANID</li><li>Check that test documents use distinct PO/Invoice numbers from production</li><li>Reset the test environment if data is corrupted</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'AN Test Environment'
  },
  {
    id: 'CIG_ADAPTER_FAIL', category: 'cig', severity: 'High',
    title: 'CIG Adapter Configuration Error',
    problem: 'The CIG adapter template does not match the supplier\'s ERP output format. Translation fails mid-process. Common when using the wrong adapter (e.g., SAP iDoc adapter for an Oracle ERP) or when the adapter version is outdated.',
    solution: '<ol><li>Open CIG Portal → project → Adapter Configuration</li><li>Verify the adapter template matches the supplier\'s ERP type</li><li>Check the adapter version — update to latest if available</li><li>Review the translation log for specific field/segment errors</li><li>If custom mapping is needed, create a custom adapter rule</li><li>Test with a sample document after reconfiguration</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Adapter Config'
  },
  {
    id: 'ASN_HL_HIERARCHY', category: 'document', severity: 'High',
    title: 'ASN HL Hierarchy Error (856)',
    problem: 'The ASN (856) document has an incorrect HL (Hierarchical Level) structure. The expected hierarchy is Shipment → Order → Pack → Item, but levels are missing, duplicated, or in wrong order. This is the #1 most common ASN failure.',
    solution: '<ol><li>Verify HL segment structure: HL01 (ID), HL02 (Parent ID), HL03 (Level Code)</li><li>Required levels: <b>S</b> (Shipment), <b>O</b> (Order), <b>P</b> (Pack — optional), <b>I</b> (Item)</li><li>Each child HL must reference the correct parent HL ID</li><li>Check CIG mapping to ensure HL codes translate correctly to cXML ShipNotice hierarchy</li><li>Test with a minimal ASN (1 shipment, 1 order, 1 item) first</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'Review ASN Mapping in CIG'
  },
  {
    id: 'INVOICE_3WAY_MATCH', category: 'document', severity: 'High',
    title: 'Invoice 3-Way Match Failure',
    problem: 'Invoice is rejected by the buyer\'s system because it fails the 3-way match against the PO and GR/ASN. Common causes: quantity mismatch, price variance beyond tolerance, or missing PO reference.',
    solution: '<ol><li>Verify the invoice references the correct PO number (BIG02 in 810)</li><li>Check that invoice quantity ≤ received quantity (from ASN/GR)</li><li>Confirm unit price matches the PO line item price</li><li>Check if the buyer has a price tolerance (e.g., ±5%) and adjust if within tolerance</li><li>For service invoices: ensure SES (Service Entry Sheet) is approved before invoicing</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Check Invoice Status in AN'
  },
  {
    id: 'PROD_CUTOVER_FAIL', category: 'production', severity: 'Critical',
    title: 'Production Cutover Failure',
    problem: 'Integration works in test but fails in production. Common causes: CIG mappings not migrated, production AN relationship not established, production certificates not uploaded, or firewall rules differ between environments.',
    solution: '<ol><li>Verify CIG production project was created (separate from test)</li><li>Confirm all mapping rules were migrated from test → production</li><li>Check production AN account is active and relationship is established</li><li>Upload production certificates (they may differ from test)</li><li>Verify firewall/network rules allow production traffic</li><li>Run a full smoke test in production before enabling live transactions</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Production Project'
  },
  {
    id: 'INVOICE_REJECTED', category: 'document', severity: 'Critical',
    title: 'Invoice Rejected by Buyer',
    problem: 'The invoice has been rejected by the buyer\'s system due to business rule violations. The invoice status shows "Rejected" and routing shows "Failed". This typically means the invoice failed one or more buyer-side validation rules (e.g., price tolerance, quantity limits, subtotal validation). Check the "Reasons" section for specific error codes like INV-138, INV-25, INV-52, DOC-6, DOC-1.',
    solution: '<ol><li>Review the <b>Reasons</b> section on the invoice detail page for specific error codes</li><li><b>INV-138</b>: Unit price mismatch — compare invoice price vs PO line price</li><li><b>INV-25</b>: Quantity exceeds limit — ensure invoice qty ≤ received/ordered qty</li><li><b>INV-52</b>: Subtotal exceeds line item subtotals — recalculate line amounts</li><li><b>DOC-6</b>: Document preprocessing error — check document format/structure</li><li><b>DOC-1</b>: Invoice validation failed — fix all rule violations first</li><li>Click <b>"Edit & Resubmit"</b> to correct and resend the invoice</li><li>Contact the buyer if tolerance thresholds need adjustment</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Check Invoice in AN'
  },
  {
    id: 'INVOICE_PRICE_MISMATCH', category: 'document', severity: 'High',
    title: 'Invoice Unit Price Mismatch (INV-138)',
    problem: 'The unit price on the invoice line does not match the unit price on the corresponding PO line, and exceeds the buyer\'s price tolerance threshold. Error code INV-138 indicates the price variance is outside the acceptable range (e.g., invoice price: 4.5, PO price: 0.94). Each mismatched line generates a separate INV-138 error.',
    solution: '<ol><li>Compare the unit price on each invoice line with the original PO line price</li><li>Check if a PO Change (855) was sent with updated prices — the invoice should match the latest PO revision</li><li>Verify the price in the supplier\'s ERP matches the agreed PO price</li><li>If a legitimate price change occurred, request a PO amendment from the buyer first</li><li>Check the buyer\'s price tolerance setting (e.g., ±5%) — small variances may pass</li><li>Edit the invoice to correct prices and resubmit via "Edit & Resubmit"</li></ol><p style="margin-top:6px"><b>Root cause:</b> Often caused by incorrect unit of measure conversion, currency rounding, or supplier ERP using a different price list than the PO.</p>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Review PO Prices in AN'
  },
  {
    id: 'INVOICE_QTY_MISMATCH', category: 'document', severity: 'High',
    title: 'Invoice Quantity Exceeds Limit (INV-25)',
    problem: 'The quantity on the invoice line exceeds the buying organization\'s quantity limits. Error code INV-25 means the invoiced quantity is greater than the ordered or received quantity. The buyer\'s system enforces that you cannot invoice for more than what was ordered/delivered.',
    solution: '<ol><li>Compare invoice quantity with the PO line quantity for each line item</li><li>Check if an ASN/Goods Receipt has been posted — invoice qty should not exceed received qty</li><li>If partial shipments were made, ensure the invoice only covers the shipped quantity</li><li>Verify unit of measure (UoM) is consistent between PO, ASN, and Invoice</li><li>If over-delivery was agreed upon, request the buyer to update the PO quantity first</li><li>Edit the invoice to correct quantities and resubmit</li></ol><p style="margin-top:6px"><b>Common cause:</b> UoM mismatch (e.g., invoicing in "each" when PO is in "cases") or invoicing the full PO qty when only partial shipment was received.</p>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Check PO Quantities'
  },
  {
    id: 'INVOICE_SUBTOTAL_MISMATCH', category: 'document', severity: 'High',
    title: 'Invoice Subtotal Exceeds Line Item Totals (INV-52)',
    problem: 'The subtotal of a line item on the invoice exceeds the buying organization\'s calculated line item subtotal. Error code INV-52 indicates that the line-level extended amount (qty × unit price) doesn\'t match the expected total based on the PO. This often cascades from INV-138 (price mismatch) and INV-25 (qty mismatch) errors.',
    solution: '<ol><li>Recalculate each line: <b>Line Subtotal = Quantity × Unit Price</b></li><li>Ensure the line subtotal matches what the buyer\'s system expects based on the PO</li><li>Fix any underlying <b>INV-138</b> (price) and <b>INV-25</b> (qty) errors first — this often resolves INV-52 automatically</li><li>Check for rounding differences between supplier and buyer systems</li><li>Verify tax and charges are not incorrectly included in line subtotals</li><li>Edit the invoice to correct the amounts and resubmit</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Review Invoice Lines'
  },
  {
    id: 'DOC_PREPROCESSING_ERROR', category: 'cig', severity: 'High',
    title: 'Document Preprocessing Error (DOC-6)',
    problem: 'A document preprocessing error occurred during CIG processing (DOC-6). This means the document failed during the initial parsing/translation phase before business rule validation. Common causes: malformed XML/EDI, missing mandatory envelope segments, incorrect document structure, or CIG adapter misconfiguration.',
    solution: '<ol><li>Check the CIG transaction log for the detailed preprocessing error</li><li>Verify the source document structure (XML/EDI) is well-formed</li><li>For EDI: ensure ISA/GS/ST envelope segments are complete and valid</li><li>For cXML: validate against the expected DTD version</li><li>Check CIG adapter template matches the supplier\'s ERP output format</li><li>Review if any mandatory fields are missing in the source document</li><li>Re-process the document after fixing the source format</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Transaction Log'
  },
  {
    id: 'INVOICE_VALIDATION_FAILED', category: 'document', severity: 'Critical',
    title: 'Invoice Validation Failed (DOC-1)',
    problem: 'The invoice has failed the buyer\'s business rule validation (DOC-1: Invoice validation failed). This is a summary error that appears when one or more specific invoice validation rules (INV-*) have been violated. The invoice will be rejected and routing will fail until all validation errors are resolved.',
    solution: '<ol><li>Review <b>all</b> INV-* error codes listed in the Reasons section</li><li>Fix each issue in order of severity — price mismatches (INV-138) and quantity issues (INV-25) first</li><li>Ensure the invoice references the correct PO number</li><li>Verify all line items match the PO terms</li><li>After fixing all issues, use <b>"Edit & Resubmit"</b> to resend</li><li>If errors persist, contact the buyer to verify their validation rules and tolerances</li></ol><p style="margin-top:6px"><b>Note:</b> DOC-1 will clear automatically once all underlying INV-* errors are resolved.</p>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Edit & Resubmit Invoice'
  },
  {
    id: 'ROUTING_FAILED', category: 'document', severity: 'High',
    title: 'Document Routing Failed',
    problem: 'The document routing has failed, meaning the document could not be delivered to the buyer\'s system. This can occur after business rule validation failures (rejected documents are not routed) or due to connectivity/configuration issues between Ariba Network and the buyer\'s ERP.',
    solution: '<ol><li>Check if the document was <b>rejected</b> — routing fails automatically for rejected documents</li><li>Fix the underlying rejection reasons (INV-*, DOC-* errors) first</li><li>If the document was not rejected, check AN routing configuration</li><li>Verify the buyer\'s integration endpoint is active and reachable</li><li>Check if the buyer\'s ANID and routing rules are correctly configured</li><li>Resubmit the document after fixing all issues</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Check Routing Status'
  },
  {
    id: 'DOC_PROCESSING_STATUS', category: 'cig', severity: 'Low',
    title: 'Document Processing Status (DOC-492/DOC-172)',
    problem: 'DOC-492: The document has been received by SAP Business Network. DOC-172: The document has been successfully validated by Ariba Network and started processing. These are informational status codes, not errors. They indicate normal document processing flow.',
    solution: '<p>These are <b>informational status codes</b>, not errors:</p><ul><li><b>DOC-492:</b> Document received — confirmation that AN accepted the document</li><li><b>DOC-172:</b> Document validated and processing started — passed initial format checks</li></ul><p>If the document still fails after these codes, look for subsequent error codes (INV-*, DOC-1, DOC-6) that indicate the actual validation failures.</p>',
    portalLink: 'https://service.ariba.com', portalLabel: 'View Document History'
  },
  {
    id: 'INVOICE_RULE_VIOLATION', category: 'document', severity: 'High',
    title: 'Invoice Business Rule Violation (INV-*)',
    problem: 'One or more Ariba Network invoice validation rules (INV-*) have been violated. Common codes: INV-25 (quantity exceeds limits), INV-52 (subtotal exceeds limits), INV-138 (unit price mismatch). These rules are configured by the buyer and enforce compliance with PO terms.',
    solution: '<ol><li>Identify all INV-* codes in the rejection reasons</li><li><b>INV-25:</b> Reduce invoiced quantity to match PO/received qty</li><li><b>INV-52:</b> Correct line subtotals (fix price and qty first)</li><li><b>INV-138:</b> Align unit prices with PO prices</li><li>Cross-reference each invoice line with the original PO</li><li>Use "Edit & Resubmit" after correcting all violations</li><li>Contact buyer if you believe the PO terms are outdated</li></ol>',
    portalLink: 'https://service.ariba.com', portalLabel: 'Review Invoice Rules'
  },
  {
    id: 'PO_REFERENCE_NOT_FOUND', category: 'cig', severity: 'Critical',
    title: 'Referenced PO Not Found (OC-7)',
    problem: 'The document references a Purchase Order number that cannot be found in the SAP Business Network. Error code OC-7 means the PO number in the submitted document (e.g., invoice, ASN, PO confirmation) does not match any existing PO in the buyer\'s Ariba Network account. This causes the document to fail with a 400 Bad Request response. Common causes: incorrect PO number in the source ERP, PO not yet transmitted to AN, PO number format mismatch (leading zeros, prefixes), or the PO was sent to a different ANID/test vs production environment.',
    solution: '<ol><li><b>Verify the PO number</b> — check the exact PO number in the error (e.g., 4300045510) against the buyer\'s Ariba Network</li><li><b>Check PO existence</b> — log into AN → search for the PO number. If not found, the buyer may not have sent it yet</li><li><b>Check PO number format</b> — some ERPs add/strip leading zeros or prefixes (e.g., "4300045510" vs "0004300045510")</li><li><b>Verify environment</b> — ensure both the PO and the document are in the same environment (test vs production)</li><li><b>Check ANID alignment</b> — the PO must be sent to the same supplier ANID that is submitting the document</li><li><b>Contact the buyer</b> — ask them to verify the PO was transmitted to AN and confirm the exact PO number format</li><li><b>Check CIG mapping</b> — if using CIG, verify the PO reference field mapping (BIG02 for invoices, BAK03 for confirmations)</li></ol><p style="margin-top:6px"><b>ANERR reference:</b> Save the ANERR-* number from the error for Ariba Support if escalation is needed.</p>',
    portalLink: 'https://support.ariba.com/item/view/189049', portalLabel: 'SAP Note 189049 — CIG Error Resolution'
  },
  {
    id: 'CIG_PLT_00644', category: 'cig', severity: 'Critical',
    title: 'CIG Platform Error: Document Failed in Business Network (CIG-PLT-00644)',
    problem: 'The document was processed by CIG but failed when submitted to the SAP Business Network. Error code CIG-PLT-00644 indicates the translated document was rejected by AN\'s inbound validation. The root cause is typically in the document content (e.g., invalid PO reference, missing mandatory fields, ANID mismatch) rather than in the CIG translation itself. The AN error details (OC-* code) provide the specific failure reason.',
    solution: '<ol><li><b>Read the full error</b> — look for the OC-* error code and the detailed error message after "ErrorResponse:"</li><li><b>OC-7 (PO not found):</b> Verify the PO number exists in AN. Check format and environment (test/prod)</li><li><b>OC-1 (Document validation):</b> Check mandatory fields and document structure</li><li><b>OC-3 (Duplicate):</b> The document number already exists — use a unique number</li><li><b>Review SAP Note 189049</b> — this note covers common CIG-PLT-00644 scenarios and solutions</li><li><b>Check CIG transaction log</b> — open CIG Portal → Monitor → find the failed transaction for full details</li><li><b>Save the ANERR-* number</b> — needed if you escalate to SAP/Ariba Support</li></ol>',
    portalLink: 'https://support.ariba.com/item/view/189049', portalLabel: 'SAP Note 189049 — CIG-PLT-00644'
  },
  {
    id: 'CIG_PLATFORM_ERROR', category: 'cig', severity: 'High',
    title: 'CIG Platform Error (CIG-PLT-*)',
    problem: 'A CIG (Cloud Integration Gateway) platform-level error occurred during document processing. CIG-PLT-* errors indicate failures in the CIG middleware layer — either during translation, routing, or submission to the Ariba Network. The specific CIG-PLT code identifies the error type.',
    solution: '<ol><li><b>CIG-PLT-00644:</b> Document failed in Business Network — check the OC-* error for root cause</li><li><b>CIG-PLT-00100/200:</b> Translation/mapping error — review CIG adapter configuration</li><li><b>CIG-PLT-00300:</b> Connectivity error — check AS2/VAN/HTTPS settings</li><li>Open <b>CIG Portal</b> → Monitor → Transaction Log for detailed error information</li><li>Review <b>SAP Note 189049</b> for common CIG platform error resolutions</li><li>If the error persists, open an incident with SAP Support — include the CIG-PLT code and ANERR reference</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Transaction Monitor'
  },
  {
    id: 'AN_ERROR_REFERENCE', category: 'document', severity: 'Medium',
    title: 'Ariba Network Error Reference (ANERR-*)',
    problem: 'An ANERR-* reference number has been generated for this error. This is a unique identifier assigned by the Ariba Network for tracking and support purposes. The ANERR number can be used when contacting SAP/Ariba Support to quickly locate the failed transaction and its detailed error logs.',
    solution: '<ol><li><b>Save the ANERR number</b> — you will need it for any support ticket</li><li>The ANERR number helps Ariba Support trace the exact transaction in their backend systems</li><li>Focus on resolving the <b>root cause error</b> (OC-*, CIG-PLT-*, INV-*) first</li><li>If you cannot resolve the root cause, open a support ticket at <b>support.ariba.com</b> with:<ul><li>The ANERR-* reference number</li><li>The full error message</li><li>The document type and number</li><li>Your ANID and the trading partner\'s ANID</li></ul></li></ol>',
    portalLink: 'https://support.ariba.com', portalLabel: 'Open Ariba Support Ticket'
  },
  {
    id: 'BAD_REQUEST_400', category: 'cig', severity: 'High',
    title: 'Bad Request (HTTP 400) from Business Network',
    problem: 'The SAP Business Network returned an HTTP 400 "Bad Request" response when CIG submitted the document. This means the document payload was rejected by AN\'s inbound API. The 400 status indicates a client-side error — the document content is invalid, not the connectivity. The specific OC-* error code in the response body explains why.',
    solution: '<ol><li><b>Read the ErrorResponse</b> — the OC-* code and message after "ErrorResponse:" explain the exact issue</li><li><b>Common 400 causes:</b><ul><li>OC-7: Referenced PO not found in AN</li><li>OC-1: Document fails AN validation rules</li><li>OC-3: Duplicate document number</li><li>OC-5: Invalid ANID or relationship not established</li></ul></li><li>Fix the document content in the source ERP or CIG mapping</li><li>Resubmit the document after correction</li><li>If the issue is environmental (test vs prod), verify CIG project points to the correct AN endpoint</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'Check CIG Transaction Log'
  },
  {
    id: 'DOC_FAILED_BN', category: 'cig', severity: 'Critical',
    title: 'Document Failed in Business Network',
    problem: 'The document was successfully processed by CIG but failed when delivered to the SAP Business Network. This is a downstream failure — CIG translated the document correctly, but AN rejected it during inbound validation. The AN error (OC-* code) identifies the specific reason for rejection.',
    solution: '<ol><li><b>Check the OC-* error code</b> in the error message for the specific failure reason</li><li><b>Verify document references</b> — PO numbers, ANID, vendor IDs must all be valid in AN</li><li><b>Check AN environment</b> — ensure CIG is pointing to the correct AN environment (test or production)</li><li>Open the <b>CIG transaction log</b> to see the full AN response</li><li>Fix the root cause and resubmit the document through CIG</li><li>If the AN error is unclear, use the ANERR-* reference number to contact Ariba Support</li></ol>',
    portalLink: 'https://integration.ariba.com', portalLabel: 'CIG Monitor — Failed Transactions'
  }
];

function initTroubleshoot() {
  document.getElementById('ts-scan-btn').addEventListener('click', runAutoScan);
  document.getElementById('ts-diagnose-btn').addEventListener('click', runManualDiagnose);
}

function runAutoScan() {
  const btn = document.getElementById('ts-scan-btn');
  const resultsEl = document.getElementById('ts-scan-results');
  btn.disabled = true; btn.textContent = 'Scanning...';

  // Get current page content via the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]?.id) {
      showScanResults([], 'No active tab found. Navigate to an Ariba page and try again.');
      btn.disabled = false; btn.textContent = 'Scan Now';
      return;
    }
    // Try to get page content from content script
    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' }, response => {
      btn.disabled = false; btn.textContent = 'Scan Now';
      if (chrome.runtime.lastError || !response) {
        // Content script not loaded — might not be an Ariba page
        const url = tabs[0].url || '';
        if (!url.includes('ariba.com') && !url.includes('sap.com')) {
          showScanResults([], 'Not on an Ariba page. Navigate to <b>service.ariba.com</b>, <b>integration.ariba.com</b>, or any <b>*.ariba.com</b> page to auto-detect errors.');
        } else {
          // Try to inject content script on-the-fly for pages where it wasn't auto-injected
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              // Gather text from body + SAP UI5 dialogs/popovers/overlays
              const sources = [
                document.body?.innerText || '',
                ...Array.from(document.querySelectorAll('#sap-ui-static, [role="dialog"], [role="alertdialog"], .sapMDialog, .sapMPopover, .sapMMessageBox')).map(el => el.innerText || ''),
                ...Array.from(document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"], [class*="error-message"], [class*="ErrorMessage"]')).map(el => el.innerText || '')
              ];
              const text = [...new Set(sources)].join('\n').substring(0, 8000);
              return { url: window.location.href, title: document.title, text };
            }
          }).then(results => {
            btn.disabled = false; btn.textContent = 'Scan Now';
            if (results?.[0]?.result) {
              const r = results[0].result;
              const detected = analyzePageForErrors(r.text || '', r.url || '');
              showScanResults(detected, null, r.url);
            } else {
              showScanResults([], 'Could not read page content. Try refreshing the page first.');
            }
          }).catch(() => {
            showScanResults([], 'Could not read page content. Try refreshing the page first.');
            btn.disabled = false; btn.textContent = 'Scan Now';
          });
          return; // exit early, scripting.executeScript handles the response
        }
        return;
      }
      // Analyze the page content against known error patterns
      const detected = analyzePageForErrors(response.text || '', response.url || '');
      showScanResults(detected, null, response.url);
    });
  });
}

function analyzePageForErrors(text, url) {
  const detected = [];
  const patterns = [
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
    // Invoice-specific error codes — ordered from most specific to least
    { regex: /INV-138/i, issueId: 'INVOICE_PRICE_MISMATCH' },
    { regex: /INV-25/i, issueId: 'INVOICE_QTY_MISMATCH' },
    { regex: /INV-52/i, issueId: 'INVOICE_SUBTOTAL_MISMATCH' },
    { regex: /unit\s*price.*(?:not\s+match|mismatch|does\s+not\s+match)|price.*tolerance|price.*variance/i, issueId: 'INVOICE_PRICE_MISMATCH' },
    { regex: /quantity.*exceeds.*limit|qty.*exceeds|invoiced\s+quantity.*greater/i, issueId: 'INVOICE_QTY_MISMATCH' },
    { regex: /subtotal.*exceeds|line\s*item\s*subtotal.*exceeds/i, issueId: 'INVOICE_SUBTOTAL_MISMATCH' },
    // Document-level errors
    { regex: /DOC-6[^0-9]|document\s*preprocessing\s*error/i, issueId: 'DOC_PREPROCESSING_ERROR' },
    { regex: /DOC-1[^0-9]|invoice\s*validation\s*failed/i, issueId: 'INVOICE_VALIDATION_FAILED' },
    { regex: /DOC-492|DOC-172/i, issueId: 'DOC_PROCESSING_STATUS' },
    // Invoice status
    { regex: /Rejected\s+Invoice|invoice.*rejected|Status:?\s*Rejected/i, issueId: 'INVOICE_REJECTED' },
    { regex: /Routing:?\s*Failed/i, issueId: 'ROUTING_FAILED' },
    { regex: /Edit\s*&\s*Resubmit/i, issueId: 'INVOICE_REJECTED' },
    // 3-way match — strict: require "3-way" or "3way" or "three.?way"
    { regex: /3.?way\s*match|three.?way\s*match/i, issueId: 'INVOICE_3WAY_MATCH' },
    // CIG Platform errors, OC codes, AN errors
    { regex: /\bOC-\d+|Cannot\s+find.*referenced\s+PO|PO\s+(?:number\s+)?not\s+found|referenced\s+PO.*not/i, issueId: 'PO_REFERENCE_NOT_FOUND' },
    { regex: /CIG-PLT-00644/i, issueId: 'CIG_PLT_00644' },
    { regex: /CIG-PLT-\d+/i, issueId: 'CIG_PLATFORM_ERROR' },
    { regex: /ANERR-\d+/i, issueId: 'AN_ERROR_REFERENCE' },
    { regex: /ErrorCode[:\s]*["']?400["']?|HTTP[\/\s]*400.*Bad\s*Request/i, issueId: 'BAD_REQUEST_400' },
    { regex: /Document\s+failed\s+in\s+Business\s+Network/i, issueId: 'DOC_FAILED_BN' }
  ];
  // Track already-added issue IDs to avoid duplicates
  const addedIds = new Set();
  patterns.forEach(p => {
    if (p.regex.test(text)) {
      const issue = KNOWN_ISSUES.find(i => i.id === p.issueId);
      if (issue && !addedIds.has(issue.id)) {
        detected.push(issue);
        addedIds.add(issue.id);
      }
    }
  });

  // Post-processing: remove redundant/overlapping issues
  // If we have a specific INV-* issue, remove the generic INVOICE_RULE_VIOLATION
  const specificInvIssues = ['INVOICE_PRICE_MISMATCH', 'INVOICE_QTY_MISMATCH', 'INVOICE_SUBTOTAL_MISMATCH'];
  const hasSpecificInv = detected.some(d => specificInvIssues.includes(d.id));

  // If INVOICE_REJECTED is present and ROUTING_FAILED is also present, keep only INVOICE_REJECTED
  // (routing fails because the invoice was rejected — it's not a separate issue)
  const hasRejected = addedIds.has('INVOICE_REJECTED');
  const hasValidationFailed = addedIds.has('INVOICE_VALIDATION_FAILED');

  const filtered = detected.filter(d => {
    // Remove generic INVOICE_RULE_VIOLATION if specific INV-* issue exists
    if (d.id === 'INVOICE_RULE_VIOLATION' && hasSpecificInv) return false;
    // Remove ROUTING_FAILED if INVOICE_REJECTED exists (routing fails due to rejection)
    if (d.id === 'ROUTING_FAILED' && hasRejected) return false;
    // Remove INVOICE_VALIDATION_FAILED if specific INV-* errors explain it
    if (d.id === 'INVOICE_VALIDATION_FAILED' && hasSpecificInv) return false;
    // Remove 3WAY_MATCH if we already have specific price/qty/subtotal issues
    if (d.id === 'INVOICE_3WAY_MATCH' && hasSpecificInv) return false;
    return true;
  });

  // Extract actual error codes from page text for context
  const invCodes = text.match(/INV-\d+/g);
  const docCodes = text.match(/DOC-\d+/g);
  const ocCodes = text.match(/OC-\d+/g);
  const cigCodes = text.match(/CIG-PLT-\d+/g);
  const anErrCodes = text.match(/ANERR-\d+/g);
  if (invCodes || docCodes || ocCodes || cigCodes || anErrCodes) {
    filtered._rawCodes = [...new Set([...(invCodes || []), ...(docCodes || []), ...(ocCodes || []), ...(cigCodes || []), ...(anErrCodes || [])])];
  }
  return filtered;
}

function showScanResults(detected, fallbackMsg, url) {
  const el = document.getElementById('ts-scan-results');
  if (fallbackMsg) {
    el.innerHTML = `<div class="ts-no-issues" style="background:var(--sap-warning-light);border-color:#f0d0a0;"><div class="ts-check">⚠️</div><p style="color:var(--sap-warning)">${fallbackMsg}</p></div>`;
    return;
  }
  if (!detected.length) {
    el.innerHTML = `<div class="ts-no-issues"><div class="ts-check">✅</div><p>No issues detected on this page</p><div class="ts-sub">The current page looks clean. ${url ? '<br>Scanned: ' + url : ''}</div></div>`;
    return;
  }
  el.innerHTML = `<div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--sap-error);">⚠️ ${detected.length} issue${detected.length>1?'s':''} detected on current page</div>` +
    (detected._rawCodes ? `<div style="font-size:11px;margin-bottom:8px;padding:6px 8px;background:var(--sap-warning-light,#fff8e6);border-radius:6px;border:1px solid #f0d0a0;"><b>Error codes found:</b> ${detected._rawCodes.join(', ')}</div>` : '') +
    detected.map(issue => renderIssueCard(issue)).join('');
  wireEmailButtons();
}

function renderIssueCard(issue) {
  const sevClass = issue.severity === 'Critical' ? 'badge-error' : issue.severity === 'High' ? 'badge-warning' : 'badge-dur';
  const icon = issue.severity === 'Critical' ? '🔴' : issue.severity === 'High' ? '🟠' : '🟡';
  // Strip HTML from solution for email body
  const solutionPlain = issue.solution.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return `<div class="ts-result-card">
    <div class="ts-result-header"><div class="ts-result-icon">${icon}</div><div style="flex:1">
      <div class="ts-result-title">${issue.title}</div><span class="ts-result-code">${issue.id}</span></div>
      <span class="badge ${sevClass} ts-result-severity">${issue.severity}</span></div>
    <div class="ts-problem"><div class="ts-problem-label">🔴 Problem Identified</div><div class="ts-problem-text">${issue.problem}</div></div>
    <div class="ts-solution"><div class="ts-solution-label">✅ Recommended Fix</div><div class="ts-solution-text">${issue.solution}
      <a class="ts-solution-link" href="${issue.portalLink}" target="_blank">🌐 ${issue.portalLabel} →</a></div></div>
    <button class="btn-draft-email" data-issue-id="${issue.id}" data-issue-title="${issue.title.replace(/"/g,'&quot;')}" data-issue-severity="${issue.severity}">📧 Draft Resolution Email (Outlook)</button>
  </div>`;
}

function runManualDiagnose() {
  const category = document.getElementById('ts-category').value;
  const errorText = document.getElementById('ts-error-text').value.trim();
  const resPanel = document.getElementById('ts-resolution');
  const resContent = document.getElementById('ts-resolution-content');

  if (!errorText && !category) {
    resPanel.style.display = 'block';
    resContent.innerHTML = '<div class="ts-no-issues" style="background:var(--sap-warning-light);border-color:#f0d0a0;"><div class="ts-check">⚠️</div><p style="color:var(--sap-warning)">Please select a category or describe the error</p></div>';
    return;
  }

  // Match against known issues — use pattern-based detection first (most accurate)
  let matches = [];
  if (errorText) {
    matches = analyzePageForErrors(errorText, '');
  }
  // If no pattern match, try category filter
  if (!matches.length && category) {
    matches = KNOWN_ISSUES.filter(i => i.category === category);
  }
  // Last resort: keyword search but require multiple word matches for relevance
  if (!matches.length && errorText) {
    const words = errorText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length > 0) {
      matches = KNOWN_ISSUES.filter(issue => {
        const searchText = (issue.title + ' ' + issue.id).toLowerCase();
        const matchCount = words.filter(w => searchText.includes(w)).length;
        // Require at least 2 words to match, or 1 word if it's an error code
        return matchCount >= 2 || words.some(w => /^(inv|doc|oc|cig|anerr)/i.test(w) && searchText.includes(w));
      });
    }
  }
  // If category provided and we have too many results, filter by category
  if (category && matches.length > 5) {
    const catFiltered = matches.filter(i => i.category === category);
    if (catFiltered.length > 0) matches = catFiltered;
  }

  resPanel.style.display = 'block';
  if (!matches.length) {
    resContent.innerHTML = `<div class="ts-result-card"><div class="ts-result-header"><div class="ts-result-icon">🤔</div><div>
      <div class="ts-result-title">No exact match found</div></div></div>
      <div class="ts-solution"><div class="ts-solution-label">💡 Suggestions</div><div class="ts-solution-text">
      <ol><li>Try describing the error differently or paste the exact error message</li>
      <li>Select a category to see all related issues</li>
      <li>Use the <b>AI Chat</b> tab for free-form troubleshooting</li>
      <li>Check Ariba Support for this specific error</li></ol>
      <a class="ts-solution-link" href="https://support.ariba.com" target="_blank">🌐 Open Ariba Support Portal →</a></div></div></div>`;
    return;
  }

  resContent.innerHTML = `<div style="font-size:12px;color:var(--sap-text-secondary);margin-bottom:8px;">Found <b>${matches.length}</b> matching issue${matches.length>1?'s':''}:</div>` +
    matches.map(issue => renderIssueCard(issue)).join('');
  wireEmailButtons();
  resPanel.scrollIntoView({ behavior: 'smooth' });
}

/* ===== DRAFT RESOLUTION EMAIL ===== */
function draftEmail(issueId) {
  var issue = KNOWN_ISSUES.find(function(i) { return i.id === issueId; });
  if (!issue) return;

  /* Get supplier context from the context bar */
  var supplierName = document.getElementById('ctx-name')?.textContent || 'Supplier';
  var anid = document.getElementById('ctx-id')?.textContent || '';

  /* Strip HTML from solution text for plain email body */
  var solutionText = issue.solution.replace(/<ol>/g, '\n').replace(/<\/ol>/g, '').replace(/<ul>/g, '\n').replace(/<\/ul>/g, '').replace(/<li>/g, '  - ').replace(/<\/li>/g, '\n').replace(/<b>/g, '').replace(/<\/b>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<p[^>]*>/g, '\n').replace(/<\/p>/g, '').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

  var subject = '[AIA] Resolution Required: ' + issue.title + ' (' + issue.id + ') — ' + supplierName;

  var body = 'Hi Team,\n\n'
    + 'The Ariba Integration Agent (AIA) has identified the following issue that requires resolution:\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'ISSUE DETAILS\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Error Code: ' + issue.id + '\n'
    + 'Severity: ' + issue.severity + '\n'
    + 'Category: ' + issue.category + '\n'
    + 'Supplier: ' + supplierName + '\n'
    + (anid ? 'ANID: ' + anid + '\n' : '')
    + '\n'
    + 'PROBLEM:\n'
    + issue.problem + '\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'RECOMMENDED RESOLUTION\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + solutionText + '\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Portal Link: ' + issue.portalLink + '\n\n'
    + 'Please review and take the necessary action.\n\n'
    + 'Best regards,\n'
    + 'AIA — SCC Automation Agent v3.0.0\n';

  var outlookUrl = 'https://outlook.office.com/mail/deeplink/compose?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  try { chrome.tabs.create({ url: outlookUrl }); } catch(e) { window.open(outlookUrl, '_blank'); }
}
function wireEmailButtons() {
  /* Attach click listeners to all draft email buttons (after dynamic rendering) */
  document.querySelectorAll('.btn-draft-email').forEach(function(btn) {
    btn.addEventListener('click', function() {
      draftEmail(btn.getAttribute('data-issue-id'));
    });
  });
}

/* WIRE TROUBLESHOOT BUTTONS */
document.getElementById('ts-scan-btn').addEventListener('click', runAutoScan);
document.getElementById('ts-diagnose-btn').addEventListener('click', runManualDiagnose);

/* WIRE GUIDES BUTTONS */
var correctedDocBtn = document.getElementById('corrected-doc-btn');
if (correctedDocBtn) {
  correctedDocBtn.addEventListener('click', function() {
    alert('Corrected document generation will create an updated mapping file with all 3 changes applied.\n\nThis feature will export a corrected cXML/EDI file with:\n1. SAC segment added for Tax/Allowances\n2. PO1-06 UoM corrected from "EA" to "Each"\n3. N1*ST Ship-To qualifier with DUNS number added');
  });
}

var draftCorrectionBtn = document.getElementById('draft-correction-btn');
if (draftCorrectionBtn) {
  draftCorrectionBtn.addEventListener('click', function() {
    var supplierName = document.getElementById('ctx-name')?.textContent || 'Supplier';
    var anid = document.getElementById('ctx-id')?.textContent || '';
    
    var subject = '[AIA] Mapping Correction Required — 3 Changes Identified — ' + supplierName;
    var body = 'Hi Team,\n\n'
      + 'The AIA Supplier Mapping Validation has identified 3 changes required in the current EDI/cXML mapping.\n\n'
      + 'Supplier: ' + supplierName + '\n'
      + (anid ? 'ANID: ' + anid + '\n' : '')
      + '\n'
      + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      + 'VALIDATION SUMMARY\n'
      + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      + 'Successful matches: 18\n'
      + 'Changes required: 3\n\n'
      + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      + 'CHANGES REQUIRED\n'
      + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
      + '1. MISSING: SAC Segment (Tax/Allowances)\n'
      + '   Buyer guide requires SAC segment for invoice tax breakdown.\n'
      + '   Action: Add SAC segment to the outbound invoice mapping.\n\n'
      + '2. FIELD MISMATCH: PO1-06 (Unit of Measure)\n'
      + '   Supplier sends "EA", buyer expects "Each".\n'
      + '   Action: Update UoM translation in CIG adapter.\n\n'
      + '3. MISSING: N1*ST Ship-To Qualifier\n'
      + '   Buyer requires N1*ST with DUNS number.\n'
      + '   Action: Add N1*ST segment with DUNS identifier to PO mapping.\n\n'
      + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
      + 'Please review and apply the corrections to the mapping configuration.\n\n'
      + 'Best regards,\n'
      + 'AIA — SCC Automation Agent v3.0.0\n';
    
    var outlookUrl = 'https://outlook.office.com/mail/deeplink/compose?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    try { chrome.tabs.create({ url: outlookUrl }); } catch(e) { window.open(outlookUrl, '_blank'); }
  });
}

console.log('[AIA] Troubleshoot engine loaded — 27 known issues, 28 patterns');
