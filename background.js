/**
 * Ariba Integration Agent v2.0 — Background Service Worker
 * Handles lifecycle, context menus, message routing, and AI knowledge base.
 */

importScripts('atlas-updater.js');

// ===== Installation =====
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      integrations: [],
      checklistState: {},
      settings: { notifications: true, autoDetect: true, theme: 'light' },
      stats: { active: 0, completed: 0, testing: 0, blocked: 0 }
    });
    console.log('[Ariba Agent] Extension installed.');
  }
  // Create context menus on both install and update
  chrome.contextMenus.create({ id: 'ariba-lookup-mapping', title: 'Ariba Agent: Look up EDI/cXML mapping', contexts: ['selection'] }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({ id: 'ariba-troubleshoot', title: 'Ariba Agent: Troubleshoot this error', contexts: ['selection'] }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({ id: 'ariba-explain', title: 'Ariba Agent: Explain this field/element', contexts: ['selection'] }, () => chrome.runtime.lastError);

  // Auto-reopen side panel after extension reload/update
  if (details.reason === 'update' || details.reason === 'install') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {});
      }
    });
  }
});

// Open side panel on action click
chrome.action.onClicked?.addListener?.((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// ===== Context Menu Handlers =====
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const text = info.selectionText?.trim();
  if (!text) return;
  const handlers = {
    'ariba-lookup-mapping': () => handleAIQuery(`EDI cXML mapping for ${text}`),
    'ariba-troubleshoot': () => handleAIQuery(`troubleshoot error: ${text}`),
    'ariba-explain': () => handleAIQuery(`explain Ariba field: ${text}`)
  };
  const handler = handlers[info.menuItemId];
  if (handler) handler().then(r => chrome.tabs.sendMessage(tab.id, { type: 'SHOW_TOOLTIP', content: r.response }));
});

// ===== Message Router =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const routes = {
    'GET_PAGE_CONTEXT': () => detectContext(sender.tab).then(sendResponse),
    'SAVE_INTEGRATION': () => saveIntegration(msg.data).then(sendResponse),
    'DELETE_INTEGRATION': () => deleteIntegration(msg.data).then(sendResponse),
    'UPDATE_CHECKLIST': () => updateChecklist(msg.data).then(sendResponse),
    'GET_STATS': () => chrome.storage.local.get('stats', r => sendResponse(r.stats)),
    'GET_INTEGRATIONS': () => chrome.storage.local.get('integrations', r => sendResponse(r.integrations || [])),
    'GET_CHECKLIST_STATE': () => chrome.storage.local.get('checklistState', r => sendResponse(r.checklistState || {})),
    'AI_QUERY': () => handleAIQuery(msg.query, msg.context).then(sendResponse),
    'GENERATE_TEST_PLAN': () => generateTestPlan(msg.data).then(sendResponse),
    'GENERATE_IGW': () => generateIGW(msg.data).then(sendResponse),
    'SCORE_READINESS': () => scoreSupplierReadiness(msg.data).then(sendResponse),
    'DETECT_ERRORS': () => detectAndSuggestFixes(msg.pageContent).then(sendResponse),
    'EXPORT_DATA': () => exportData(msg.format).then(sendResponse),
    'OPEN_SIDEPANEL': () => {
      const windowId = sender.tab ? sender.tab.windowId : undefined;
      const openPanel = (wid) => {
        chrome.sidePanel.open({ windowId: wid }).then(() => {
          // Close the calling tab (full tab view) after sidepanel opens
          if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id).catch(() => {});
          }
          sendResponse({ ok: true });
        }).catch(() => sendResponse({ ok: false }));
      };
      if (windowId) { openPanel(windowId); }
      else { chrome.windows.getCurrent(win => openPanel(win.id)); }
    },
    'OPEN_TAB': () => {
      const tabUrl = chrome.runtime.getURL('tab.html');
      chrome.tabs.query({}, (tabs) => {
        const existing = tabs.find(t => t.url && t.url.indexOf('tab.html') >= 0);
        if (existing) { chrome.tabs.update(existing.id, { active: true }); }
        else { chrome.tabs.create({ url: tabUrl }); }
        sendResponse({ ok: true });
      });
    },
    'CONTEXT_DETECTED': () => {
      // Store context and forward to all extension pages (sidepanel)
      chrome.storage.local.set({ currentContext: msg.context });
      chrome.runtime.sendMessage({ type: 'CONTEXT_UPDATE', context: msg.context }).catch(() => {});
      sendResponse({ ok: true });
    },
    // ===== AIE RETRIEVAL: Scrape portal via content script =====
    'SCRAPE_ACTIVE_TAB': () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ error: 'No active tab' });
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_PORTAL' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: 'Content script not available. Navigate to an Ariba portal page.' });
          } else {
            sendResponse(response);
          }
        });
      });
    },
    // ===== AIE RETRIEVAL: Get captured cXML from network interception =====
    'GET_NETWORK_CAPTURES': () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ captured: [] });
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CAPTURED_CXML' }, (response) => {
          if (chrome.runtime.lastError) sendResponse({ captured: [] });
          else sendResponse(response || { captured: [] });
        });
      });
    },
    // ===== AIE RETRIEVAL: Notification of cXML captured passively =====
    'CXML_CAPTURED': () => {
      // Forward to sidepanel for live capture indicator
      chrome.runtime.sendMessage({
        type: 'CXML_CAPTURE_NOTIFY',
        url: msg.url,
        method: msg.method,
        timestamp: msg.timestamp,
        size: msg.size
      }).catch(() => {});
      sendResponse({ ok: true });
    }
  };
  if (routes[msg.type]) { routes[msg.type](); return true; }
});

// ===== Page Context Detection =====
async function detectContext(tab) {
  if (!tab?.url) return { page: 'unknown', context: {} };
  const url = tab.url;
  let ctx = { url, page: 'unknown', suggestions: [], actions: [] };
  if (url.includes('integration.ariba.com')) {
    ctx.page = 'CIG Portal';
    ctx.suggestions = ['Check CIG adapter configuration', 'Verify message mapping rules', 'Test connectivity with supplier'];
    ctx.actions = ['validate-mapping', 'test-connectivity', 'view-adapter-templates'];
  } else if (url.includes('admin') && url.includes('ariba.com')) {
    ctx.page = 'Ariba Network Admin';
    ctx.suggestions = ['Review document status and errors', 'Check invoice validation results', 'Verify supplier account configuration'];
    ctx.actions = ['check-documents', 'view-invoices', 'run-diagnostics'];
  } else if (url.includes('service.ariba.com') && url.includes('Supplier')) {
    ctx.page = 'AN — Supplier Portal';
    ctx.suggestions = ['Verify AN account setup', 'Check document routing rules', 'Review transaction history'];
    ctx.actions = ['check-account', 'view-documents', 'run-diagnostics'];
  } else if (url.includes('service.ariba.com')) {
    ctx.page = 'Ariba Network';
    ctx.suggestions = ['View supplier relationships', 'Check document exchange status', 'Review integration settings'];
    ctx.actions = ['view-relationships', 'check-status', 'open-settings'];
  } else if (url.includes('ariba.com')) {
    ctx.page = 'SAP Ariba';
    ctx.suggestions = ['Navigate to integration settings', 'Check supplier onboarding status'];
  }
  return ctx;
}

// ===== Integration CRUD =====
async function saveIntegration(data) {
  const r = await chrome.storage.local.get(['integrations', 'stats']);
  const integrations = r.integrations || [];
  const stats = r.stats || { active: 0, completed: 0, testing: 0, blocked: 0 };
  const idx = integrations.findIndex(i => i.id === data.id);
  if (idx >= 0) {
    const old = integrations[idx];
    if (old.status !== data.status) {
      if (old.status) stats[old.status] = Math.max(0, (stats[old.status] || 0) - 1);
      if (data.status) stats[data.status] = (stats[data.status] || 0) + 1;
    }
    integrations[idx] = { ...old, ...data, updatedAt: Date.now() };
  } else {
    data.id = data.id || `INT-${Date.now()}`;
    data.createdAt = Date.now();
    data.updatedAt = Date.now();
    data.status = data.status || 'active';
    integrations.push(data);
    stats[data.status] = (stats[data.status] || 0) + 1;
  }
  await chrome.storage.local.set({ integrations, stats });
  return { success: true, id: data.id };
}

async function deleteIntegration(data) {
  const r = await chrome.storage.local.get(['integrations', 'stats']);
  const integrations = r.integrations || [];
  const stats = r.stats || { active: 0, completed: 0, testing: 0, blocked: 0 };
  const idx = integrations.findIndex(i => i.id === data.id);
  if (idx >= 0) {
    const old = integrations[idx];
    if (old.status) stats[old.status] = Math.max(0, (stats[old.status] || 0) - 1);
    integrations.splice(idx, 1);
    await chrome.storage.local.set({ integrations, stats });
  }
  return { success: true };
}

async function updateChecklist(data) {
  const r = await chrome.storage.local.get('checklistState');
  const state = r.checklistState || {};
  state[data.itemId] = data.checked;
  await chrome.storage.local.set({ checklistState: state });
  return { success: true };
}

// ===== Test Plan Generator =====
async function generateTestPlan(data) {
  const { docTypes = [], supplierName = 'Supplier', buyerName = 'Buyer' } = data;
  const scenarioMap = {
    PO: [
      { id: 'PO-01', scenario: 'Standard PO', action: 'Buyer sends PO with single line item', expected: 'Supplier receives and confirms', priority: 'Critical' },
      { id: 'PO-02', scenario: 'Multi-line PO', action: 'Buyer sends PO with 5+ line items', expected: 'All lines received correctly', priority: 'High' },
      { id: 'PO-03', scenario: 'PO Change', action: 'Buyer sends PO change (qty/date)', expected: 'Supplier sees updated values', priority: 'High' },
      { id: 'PO-04', scenario: 'PO Cancel', action: 'Buyer cancels PO', expected: 'Supplier receives cancellation', priority: 'Medium' }
    ],
    POC: [
      { id: 'POC-01', scenario: 'Full Accept', action: 'Supplier confirms all lines', expected: 'Buyer sees accepted PO', priority: 'Critical' },
      { id: 'POC-02', scenario: 'Partial Accept', action: 'Supplier modifies qty on line 2', expected: 'Buyer sees modified confirmation', priority: 'High' },
      { id: 'POC-03', scenario: 'Reject', action: 'Supplier rejects PO', expected: 'Buyer sees rejection with reason', priority: 'High' },
      { id: 'POC-04', scenario: 'Date Change', action: 'Supplier confirms with new delivery date', expected: 'Buyer sees updated date', priority: 'Medium' }
    ],
    ASN: [
      { id: 'ASN-01', scenario: 'Full Ship', action: 'Supplier ships complete order', expected: 'Buyer receives ASN, GR posts', priority: 'Critical' },
      { id: 'ASN-02', scenario: 'Partial Ship', action: 'Supplier ships partial qty', expected: 'Buyer sees partial, backorder open', priority: 'High' },
      { id: 'ASN-03', scenario: 'Multi-pack Ship', action: 'Shipment with multiple packages', expected: 'All HL levels parse correctly', priority: 'High' },
      { id: 'ASN-04', scenario: 'Ship with BOL/tracking', action: 'ASN includes carrier + tracking', expected: 'Tracking info visible in AN', priority: 'Medium' }
    ],
    INV: [
      { id: 'INV-01', scenario: 'Standard Invoice', action: 'Supplier submits PO-based invoice', expected: '3-way match passes', priority: 'Critical' },
      { id: 'INV-02', scenario: 'Invoice with Tax', action: 'Invoice includes tax/charges', expected: 'Tax lines parsed correctly', priority: 'High' },
      { id: 'INV-03', scenario: 'Credit Memo', action: 'Supplier submits credit memo', expected: 'Buyer processes credit', priority: 'High' },
      { id: 'INV-04', scenario: 'Duplicate Invoice', action: 'Resend same invoice number', expected: 'System rejects duplicate', priority: 'Medium' }
    ],
    REM: [
      { id: 'REM-01', scenario: 'Payment Remittance', action: 'Buyer sends remittance advice', expected: 'Supplier receives payment details', priority: 'Critical' },
      { id: 'REM-02', scenario: 'Multi-invoice Remittance', action: 'Remittance covers 3 invoices', expected: 'All invoice refs parsed', priority: 'High' }
    ]
  };
  let scenarios = [];
  docTypes.forEach(dt => { if (scenarioMap[dt]) scenarios.push(...scenarioMap[dt]); });
  return {
    planName: `Integration Test Plan — ${supplierName} × ${buyerName}`,
    generatedAt: new Date().toISOString(),
    docTypes,
    totalScenarios: scenarios.length,
    scenarios,
    roundTripTests: [
      { flow: 'PO → POC', applicable: docTypes.includes('PO') && docTypes.includes('POC') },
      { flow: 'PO → ASN → INV', applicable: docTypes.includes('PO') && docTypes.includes('ASN') && docTypes.includes('INV') },
      { flow: 'PO → POC → ASN → INV → REM', applicable: docTypes.length >= 4 }
    ].filter(t => t.applicable),
    signoff: { verbalSignoff: false, writtenSignoff: false, signoffDate: null }
  };
}

// ===== IGW Generator =====
async function generateIGW(data) {
  const { supplierName, buyerName, erpType, connectivity, docTypes = [], anid } = data;
  const docSpecs = {
    PO: { x12: '850', cxml: 'OrderRequest', direction: 'Buyer → Supplier', keyFields: 'BEG (PO#, Date), N1 (Ship/Bill To), PO1 (Items), CTT (Totals)' },
    POC: { x12: '855', cxml: 'ConfirmationRequest', direction: 'Supplier → Buyer', keyFields: 'BAK (Confirm Type), PO1 (Status per line), DTM (Delivery date)' },
    ASN: { x12: '856', cxml: 'ShipNoticeRequest', direction: 'Supplier → Buyer', keyFields: 'BSN (Ship ID), HL hierarchy (Ship/Order/Pack/Item), REF (BOL/Tracking)' },
    INV: { x12: '810', cxml: 'InvoiceDetailRequest', direction: 'Supplier → Buyer', keyFields: 'BIG (Invoice#, PO ref), IT1 (Line items), TDS (Totals), SAC (Tax/Charges)' },
    REM: { x12: '820', cxml: 'PaymentRemittanceRequest', direction: 'Buyer → Supplier', keyFields: 'BPR (Payment method/amount), RMR (Invoice references)' }
  };
  const adapterTemplates = {
    'SAP S/4HANA': 'iDoc ORDERS/ORDRSP/DESADV/INVOIC → CIG → cXML',
    'SAP ECC': 'iDoc ORDERS/ORDRSP → CIG → cXML (via RFC/ALE)',
    'Oracle': 'Oracle XML Gateway → CIG → X12/cXML',
    'JDE': 'JDE EDI Flat File → CIG → X12 → cXML',
    'Infor': 'Infor ION BODs → CIG → cXML',
    'Other': 'Custom flat file / CSV → CIG → X12/cXML'
  };
  return {
    title: `Integration Guide Workbook — ${supplierName}`,
    generatedAt: new Date().toISOString(),
    buyer: { name: buyerName, anid },
    supplier: { name: supplierName, erpType, connectivity },
    adapterTemplate: adapterTemplates[erpType] || adapterTemplates['Other'],
    scope: docTypes.map(dt => ({
      docType: dt,
      ...(docSpecs[dt] || {}),
      mappingNotes: `Review ${dt} mapping rules in CIG. Verify all mandatory fields per buyer specifications.`
    })),
    connectivitySetup: {
      method: connectivity,
      steps: connectivity === 'AS2' ?
        ['Exchange AS2 certificates (public keys)', 'Configure partner AS2 ID in CIG', 'Set endpoint URL', 'Test MDN exchange', 'Verify ping/health check'] :
        connectivity === 'VAN' ?
        ['Confirm VAN provider (OpenText/SPS/etc.)', 'Configure VAN mailbox/ISA-ID', 'Setup routing in CIG', 'Send test interchange', 'Verify functional ack (997)'] :
        ['Configure HTTPS endpoint URL', 'Setup authentication (SharedSecret/Certificate)', 'Whitelist IP ranges', 'Send test cXML PunchOut', 'Verify response codes']
    },
    testPlanOutline: docTypes.map(dt => `${dt}: Standard, exception, and round-trip scenarios`),
    roles: ['SI — CIG config & mapping', 'SIFL — Test plan & kickoff', 'Supplier Tech — ERP mapping', 'Supplier PM — Timeline & sign-off']
  };
}

// ===== Supplier Readiness Scoring =====
async function scoreSupplierReadiness(data) {
  const { erpType, volume, hasEDI, hasCxml, connectivity, documentsReady, teamAssigned } = data;
  let score = 0; let factors = [];
  // ERP maturity
  const erpScores = { 'SAP S/4HANA': 25, 'SAP ECC': 22, 'Oracle': 20, 'JDE': 15, 'Infor': 18, 'Other': 10 };
  score += erpScores[erpType] || 10;
  factors.push({ factor: 'ERP Type', value: erpType, points: erpScores[erpType] || 10 });
  // B2B capability
  if (hasEDI) { score += 15; factors.push({ factor: 'EDI Capable', value: 'Yes', points: 15 }); }
  if (hasCxml) { score += 15; factors.push({ factor: 'cXML Capable', value: 'Yes', points: 15 }); }
  if (!hasEDI && !hasCxml) { score += 5; factors.push({ factor: 'B2B Capability', value: 'None — portal only', points: 5 }); }
  // Volume
  if (volume === 'high') { score += 20; factors.push({ factor: 'Transaction Volume', value: 'High (1000+/month)', points: 20 }); }
  else if (volume === 'medium') { score += 15; factors.push({ factor: 'Transaction Volume', value: 'Medium (100-999/month)', points: 15 }); }
  else { score += 8; factors.push({ factor: 'Transaction Volume', value: 'Low (<100/month)', points: 8 }); }
  // Connectivity
  if (connectivity) { score += 10; factors.push({ factor: 'Connectivity Method', value: connectivity, points: 10 }); }
  // Readiness
  if (documentsReady) { score += 10; factors.push({ factor: 'Documents Ready', value: 'Yes', points: 10 }); }
  if (teamAssigned) { score += 5; factors.push({ factor: 'Team Assigned', value: 'Yes', points: 5 }); }
  const tier = score >= 80 ? 'Fast-Track' : score >= 55 ? 'Standard' : 'Guided';
  const estDays = score >= 80 ? '7-10 days' : score >= 55 ? '14-21 days' : '30-45 days';
  return { score: Math.min(100, score), tier, estimatedOnboarding: estDays, factors, recommendations: generateRecommendations(data, score) };
}

function generateRecommendations(data, score) {
  const recs = [];
  if (!data.hasEDI && !data.hasCxml) recs.push('Evaluate cXML over HTTPS as fastest path for non-EDI suppliers');
  if (!data.connectivity) recs.push('Determine connectivity method (AS2/VAN/HTTPS) before kickoff');
  if (!data.teamAssigned) recs.push('Assign supplier project team (Technical Lead, Testing Contact, Business Owner)');
  if (!data.documentsReady) recs.push('Prepare scope documents and confirm document types before kickoff');
  if (data.erpType === 'Other') recs.push('Request ERP details early — custom mapping may require extra time');
  if (score < 55) recs.push('Consider guided onboarding with dedicated SI support');
  return recs;
}

// ===== Error Detection =====
async function detectAndSuggestFixes(pageContent) {
  const patterns = [
    { pattern: /ANID.*mismatch/i, code: 'ANID_MISMATCH', fix: 'Verify ANID mapping in AN admin. Check for multiple accounts (test vs prod).' },
    { pattern: /field.*missing|required.*field/i, code: 'MAP_FIELD_MISSING', fix: 'Review IGW for mandatory fields. Check CIG mapping config.' },
    { pattern: /connection.*fail|connectivity.*error/i, code: 'CONNECTIVITY_FAIL', fix: 'Verify certs (AS2), VAN mailbox, or HTTPS endpoint. Check firewall.' },
    { pattern: /duplicate.*document|duplicate.*number/i, code: 'DUPLICATE_DOC', fix: 'Check retransmission. Verify unique doc ID in supplier ERP.' },
    { pattern: /schema.*valid|validation.*error/i, code: 'SCHEMA_VALIDATION', fix: 'Validate against DTD/schema. Check version compatibility.' },
    { pattern: /certificate.*expir/i, code: 'CERT_EXPIRED', fix: 'Renew cert, upload new key to CIG/AN, verify trust chain.' }
  ];
  return patterns.filter(p => p.pattern.test(pageContent)).map(p => ({ code: p.code, fix: p.fix }));
}

// ===== Export Data =====
async function exportData(format) {
  const data = await chrome.storage.local.get(['integrations', 'checklistState', 'stats']);
  return data;
}

// ===== AI Query Handler =====
async function handleAIQuery(query, context = {}) {
  const q = query.toLowerCase();

  if (q.includes('edi') || q.includes('x12') || q.includes('cxml') || q.includes('mapping')) return { response: generateMappingHelp(q), source: 'kb' };
  if (q.includes('cig') || q.includes('gateway') || q.includes('connectivity') || q.includes('as2') || q.includes('van')) return { response: generateCIGHelp(q), source: 'kb' };
  if (q.includes('onboard') || q.includes('kickoff') || q.includes('supplier') || q.includes('buyer')) return { response: generateOnboardingHelp(q), source: 'kb' };
  if (q.includes('error') || q.includes('fail') || q.includes('issue') || q.includes('troubleshoot')) return { response: generateTroubleshootingHelp(q), source: 'kb' };
  if (q.includes('test') || q.includes('uat') || q.includes('scenario')) return { response: generateTestingHelp(q), source: 'kb' };
  if (q.includes('igw') || q.includes('integration guide') || q.includes('workbook')) return { response: generateIGWHelp(), source: 'kb' };
  if (q.includes('role') || q.includes('si ') || q.includes('sifl') || q.includes('nel')) return { response: generateRolesHelp(), source: 'kb' };
  if (q.includes('document type') || q.includes('doc type') || q.includes('scope')) return { response: generateDocTypeHelp(), source: 'kb' };

  return {
    response: `I can help with Ariba integration topics:\n\n• **Onboarding** — Supplier/Buyer workflows, phases, timelines\n• **EDI/cXML Mapping** — X12 ↔ cXML field mappings (850, 855, 856, 810, 820)\n• **CIG Configuration** — Managed Gateway setup, AS2/VAN/HTTPS\n• **Testing** — UAT scenarios, test plan creation, sign-off process\n• **Troubleshooting** — ANID mismatch, mapping failures, cert issues\n• **IGW** — Integration Guide Workbook creation\n• **Roles** — SI, SIFL, NEL, Testing Contact responsibilities\n• **Document Types** — PO, POC, ASN, Invoice, Remittance\n\nWhat would you like to know?`,
    source: 'kb'
  };
}

// ===== Knowledge Base Generators =====
function generateMappingHelp(q) {
  if (q.includes('850') || q.includes('purchase order') || (q.includes('po') && !q.includes('poc')))
    return `**EDI 850 ↔ cXML OrderRequest (Purchase Order)**\n\n| X12 Segment | cXML Element | Key Fields |\n|---|---|---|\n| BEG | OrderRequestHeader | PO#, Date, Type |\n| REF | Extrinsic | Reference IDs |\n| DTM | @orderDate | Date/Time |\n| N1/N3/N4 | Address (ShipTo/BillTo) | Name, Address |\n| PO1 | ItemOut | Line#, Qty, UoM, Price |\n| PID | Description | Item description |\n| CTT | Total | Line count, hash total |\n\nCIG translates X12→cXML inbound, cXML→X12 outbound.\nSupported X12 versions: 4010, 4030, 5010, 5030`;
  if (q.includes('855') || q.includes('confirmation') || q.includes('poc'))
    return `**EDI 855 ↔ cXML ConfirmationRequest (PO Confirmation)**\n\n| X12 | cXML | Fields |\n|---|---|---|\n| BAK | ConfirmationHeader | PO#, Confirm Type, Date |\n| PO1 | ConfirmationItem | Line#, Qty, Price, Status |\n| DTM | @confirmDate | Est. delivery date |\n\n**Status types**: Accept (AC), Reject (RJ), Modify (AD)\nSupplier sends 855 → CIG translates → cXML ConfirmationRequest → Buyer AN`;
  if (q.includes('856') || q.includes('asn') || q.includes('ship'))
    return `**EDI 856 ↔ cXML ShipNoticeRequest (ASN)**\n\n| X12 | cXML | Fields |\n|---|---|---|\n| BSN | ShipNoticeHeader | Shipment ID, Date |\n| HL (Shipment) | ShipNoticePortion | Carrier, tracking |\n| HL (Order) | OrderReference | PO Number |\n| HL (Pack) | Packaging | Package type, weight |\n| HL (Item) | ShipNoticeItem | Part#, qty, UoM |\n| REF | Extrinsic | BOL, PRO#, tracking |\n\n**Critical**: HL hierarchy must be correct (Shipment→Order→Pack→Item).\nMissing HL levels = most common ASN failure.`;
  if (q.includes('810') || q.includes('invoice'))
    return `**EDI 810 ↔ cXML InvoiceDetailRequest (Invoice)**\n\n| X12 | cXML | Fields |\n|---|---|---|\n| BIG | InvoiceDetailRequestHeader | Invoice#, Date, PO Ref |\n| N1 | InvoicePartner | RemitTo/BillTo |\n| IT1 | InvoiceDetailItem | Line#, qty, price |\n| TDS | InvoiceDetailSummary | Total amounts |\n| SAC | Discount/Charge | Allowances, tax |\n\n**Key**: 3-way match alignment (PO → ASN → Invoice).\nMismatch on qty/price = automatic rejection in most buyer systems.`;
  if (q.includes('820') || q.includes('remittance') || q.includes('payment'))
    return `**EDI 820 ↔ cXML PaymentRemittanceRequest**\n\n| X12 | cXML | Fields |\n|---|---|---|\n| BPR | PaymentRemittanceHeader | Method, amount, date |\n| RMR | PaymentRemittanceDetail | Invoice ref, amount applied |\n\nBuyer sends 820 with payment details referencing one or more invoices.\nSupplier uses to reconcile AP.`;
  return `**EDI X12 ↔ cXML Mapping Overview**\n\n| EDI X12 | cXML | Document |\n|---|---|---|\n| 850 | OrderRequest | Purchase Order |\n| 855 | ConfirmationRequest | PO Confirmation |\n| 856 | ShipNoticeRequest | ASN |\n| 810 | InvoiceDetailRequest | Invoice |\n| 820 | PaymentRemittanceRequest | Remittance |\n| 997 | — | Functional Ack |\n\nSupported X12: 4010, 4030, 5010, 5030\ncXML: 1.2.024 – 1.2.056\n\nAsk about a specific document for detailed field mappings!`;
}

function generateCIGHelp(q) {
  if (q.includes('as2'))
    return `**AS2 Connectivity via CIG**\n\n1. Exchange AS2 certificates (public keys)\n2. Configure partner AS2 ID in CIG\n3. Set endpoint URL (HTTPS port 443)\n4. Test with ping/health check\n5. Send test document, verify MDN receipt\n\n**Common issues**: Cert expiry, firewall port 443, mismatched AS2 IDs, MDN timeout\n**Tip**: CIG supports sync & async MDN`;
  if (q.includes('van'))
    return `**VAN Connectivity via CIG**\n\n1. Confirm VAN provider (OpenText, SPS Commerce, etc.)\n2. Get ISA Qualifier/ID from VAN\n3. Configure VAN mailbox in CIG\n4. Setup routing rules\n5. Test with interchange + verify 997 FA\n\n**Supported VANs**: OpenText, SPS Commerce, Cleo, IBM Sterling, TrueCommerce`;
  return `**Cloud Integration Gateway (CIG) Overview**\n\n\`Supplier ERP → (X12/cXML) → CIG → (cXML) → Ariba Network → Buyer\`\n\n**Connectivity Options**:\n• **AS2** — Secure B2B over HTTPS (high-volume EDI)\n• **VAN** — Third-party EDI routing (OpenText, SPS, etc.)\n• **HTTPS** — Direct web services (cXML-native)\n\n**Access CIG**:\n• Via AN: service.ariba.com → Supplier → CIG\n• Direct: https://integration.ariba.com\n\n**Steps**: Get CIG permission → Create project → Select adapter → Configure mapping → Test → Go-live\n\n**Pre-built adapters**: SAP S/4HANA, SAP ECC, Oracle, JDE, Infor`;
}

function generateOnboardingHelp(q) {
  if (q.includes('supplier'))
    return `**Supplier Onboarding (AI-Enabled: 1-2 weeks)**\n\n1️⃣ **Registration** (Day 1-2)\n   • AN account setup, ANID assignment\n   • B2B standard selection, team assignment\n\n2️⃣ **Scope & Documents** (Day 2-4)\n   • Confirm doc types, locations, materials\n   • Review IGW & specifications\n\n3️⃣ **CIG Connectivity** (Day 3-6)\n   • Setup CIG, establish AS2/VAN/HTTPS\n   • Complete EDI/cXML mapping\n\n4️⃣ **Testing** (Day 5-9)\n   • Unit test → E2E UAT with buyer\n   • Formal testing sign-off\n\n5️⃣ **Go-Live** (Day 8-14)\n   • Migrate to production, smoke tests\n   • Hypercare monitoring\n\n**Traditional: 30-120 days → AI-Enabled: 7-14 days**`;
  return `**Buyer Onboarding (AI-Enabled: 1-2 months)**\n\n1️⃣ **Prepare** (Weeks 1-4): Alignment, assessment, team\n2️⃣ **Explore** (Weeks 3-6): AN setup, CIG config, IGW creation\n3️⃣ **Realize** (Weeks 5-12): EDI mapping, UAT testing, sign-off\n4️⃣ **Deploy** (Weeks 10-14): Production migration, enablement\n5️⃣ **Run** (Weeks 12-18): Hypercare, monitoring, steady-state\n\n**Key roles**: SI, SIFL, NEL, Testing Contact, ERP Technical, Key User\n**Traditional: 150-250 days → AI-Enabled: 30-60 days**`;
}

function generateTroubleshootingHelp(q) {
  if (q.includes('anid') || q.includes('mismatch'))
    return `**ANID Mismatch Error**\n\n🔴 **Problem**: Supplier ANID doesn't match buyer's vendor record\n\n💡 **Resolution**:\n1. Check if supplier has multiple AN accounts (test vs prod)\n2. Verify ANID in AN admin console\n3. Confirm vendor ID in buyer ERP matches AN profile\n4. Merge/deactivate incorrect accounts if duplicate\n\n**Prevention**: Always verify ANID during registration phase`;
  if (q.includes('cert') || q.includes('certificate'))
    return `**Certificate Error**\n\n🔴 **Problem**: SSL/AS2 cert expired or untrusted\n\n💡 **Resolution**:\n1. Check cert expiry date in CIG\n2. Renew cert with CA\n3. Upload new public key to CIG/AN\n4. Verify trust chain (intermediate CAs)\n5. Re-test connectivity\n\n**Prevention**: Set cert expiry alerts 30 days before`;
  return `**Common Integration Errors**\n\n🔴 **ANID_MISMATCH** — Verify ANID mapping. Check multiple accounts.\n🔴 **MAP_FIELD_MISSING** — Review IGW mandatory fields. Check CIG mapping.\n🔴 **CONNECTIVITY_FAIL** — Verify certs/VAN/endpoint. Check firewall.\n🔴 **DUPLICATE_DOC** — Check retransmission. Verify unique doc ID.\n🔴 **SCHEMA_VALIDATION** — Validate against DTD/schema. Check version.\n🔴 **CERT_EXPIRED** — Renew cert, upload new key, verify trust chain.\n🔴 **VENDOR_ID_MAP** — Confirm vendor ID in ERP matches AN profile.\n🔴 **TEST_ENV_CONFIG** — Verify NDL test account linked to correct ANID.\n\nDescribe your specific error for targeted help!`;
}

function generateTestingHelp(q) {
  return `**Integration Testing Guide**\n\n**Test Plan Structure** (per IGW):\n1. **Unit Tests** — Individual document type validation\n2. **Round-trip Tests** — PO → POC, PO → ASN → Invoice\n3. **Exception Tests** — Reject, modify, partial ship\n4. **Negative Tests** — Invalid data, missing fields, duplicates\n\n**Scenarios per Document**:\n• **PO**: Standard, change, cancel, multi-line\n• **POC**: Accept, reject, modify (qty/price/date)\n• **ASN**: Full ship, partial ship, multi-pack\n• **Invoice**: Standard, credit memo, with tax/charges\n\n**Sign-off Process**:\n1. SIFL creates & shares test plan\n2. Both parties execute scenarios\n3. Results documented\n4. Verbal sign-off on status call\n5. Written sign-off via email\n\n**Use the Test Plan Generator tab** to auto-generate scenarios!`;
}

function generateIGWHelp() {
  return `**Integration Guide Workbook (IGW)**\n\nThe IGW is a critical document created by SI/SIFL containing:\n\n• **Scope** — Document types, locations, materials\n• **B2B Specs** — EDI X12 or cXML format details\n• **Mapping Rules** — Field-by-field CIG to supplier ERP\n• **Test Scenarios** — Required test cases per doc type\n• **Samples** — Example documents for reference\n\n**Traditional**: Created manually over 1-2 weeks\n**AI-Enhanced**: Auto-generated from ERP profile & transaction history in hours\n\n**Workflow**: SI creates IGW → SIFL reviews → Shared at kickoff → Supplier uses for dev & testing\n\n**Use the IGW Generator tab** to auto-create one!`;
}

function generateRolesHelp() {
  return `**Integration Roles & Responsibilities**\n\n👤 **SI (Supplier Integrator)**\n   Manages CIG config, AN setup, integration guides, connectivity\n\n👤 **SIFL (SI Front Line)**\n   Creates test plans, validates testing, creates kickoff decks\n\n👤 **NEL (Network Enablement Lead)**\n   Manages supplier waves, onboarding coordination at scale\n\n👤 **Testing Contact**\n   Performs unit/UAT testing, validates documents in ERP\n\n👤 **ERP Technical Resource**\n   Handles back-end ERP mapping, data loading, processing\n\n👤 **Key User / Business Contact**\n   Day-to-day process knowledge, scope confirmation\n\n👤 **Project Lead**\n   Timeline, governance, change management\n\n👤 **Business Owner**\n   Signs off scope, testing, and go-live decisions`;
}

function generateDocTypeHelp() {
  return `**Document Types in Scope**\n\n| Code | Name | Direction | EDI | cXML |\n|---|---|---|---|---|\n| PO | Purchase Order | Buyer→Supplier | 850 | OrderRequest |\n| POC | PO Confirmation | Supplier→Buyer | 855 | ConfirmationRequest |\n| ASN | Advance Ship Notice | Supplier→Buyer | 856 | ShipNoticeRequest |\n| INV | Invoice | Supplier→Buyer | 810 | InvoiceDetailRequest |\n| SES | Service Entry Sheet | Supplier→Buyer | — | ServiceEntryRequest |\n| REM | Remittance Advice | Buyer→Supplier | 820 | PaymentRemittanceRequest |\n| FA | Functional Ack | Bidirectional | 997 | — |\n| FCST | Forecast | Buyer→Supplier | 830/862 | — |\n\nMost integrations start with PO + ASN + Invoice as minimum scope.`;
}

console.log('[Ariba Integration Agent v' + chrome.runtime.getManifest().version + '] Background service worker loaded.');

// ===== Atlas bulk field updater =====
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type !== 'ATLAS_UPDATE') return false;
  var list   = msg.siList   || [];
  var fields = { tcis: msg.tcisValue || '', tce: msg.tceValue || '', tceEnabled: msg.tceEnabledValue || '' };
  AtlasUpdater.bulkUpdate(list, fields, function(progress) {
    chrome.runtime.sendMessage({ type: 'ATLAS_PROGRESS', done: progress.done, total: progress.total, result: progress.result });
  }).then(function(results) {
    sendResponse({ ok: true, results: results });
  }).catch(function(err) {
    sendResponse({ ok: false, error: String(err) });
  });
  return true; // async
});
