/**
 * AIA v3.0 — Data Storage Schema
 * Defines the chrome.storage.local structure for all extension data.
 * This file is imported by sidepanel.js and background.js.
 */

const AIA_STORAGE_VERSION = '3.0.0';

/* ===== STAGE DEFINITIONS ===== */
const STAGES = {
  s1: { id: 's1', label: 'Plan',   fullName: 'Plan',   color: '#c68a00', order: 1 },
  s2: { id: 's2', label: 'Design', fullName: 'Design', color: '#a89000', order: 2 },
  s3: { id: 's3', label: 'Build',  fullName: 'Build',  color: '#7d9a00', order: 3 },
  s4: { id: 's4', label: 'Test',   fullName: 'Test',   color: '#4f9e1a', order: 4 },
  s5: { id: 's5', label: 'Deploy', fullName: 'Deploy', color: '#2a8f2a', order: 5 },
  s6: { id: 's6', label: 'Live',   fullName: 'Live',   color: '#107e3e', order: 6 },
};

/* ===== DEFAULT STORAGE STRUCTURE ===== */
const DEFAULT_STORAGE = {
  _version: AIA_STORAGE_VERSION,

  /* ---- Suppliers (keyed by ANID) ---- */
  suppliers: {
    // Example:
    // 'AN01234567890': {
    //   anid: 'AN01234567890',
    //   name: 'Acme Manufacturing Corp',
    //   initials: 'AC',
    //   currentStage: 's3',          // s1-s6
    //   stageHistory: [
    //     { stage: 's1', completedAt: '2026-04-08T10:00:00Z' },
    //     { stage: 's2', completedAt: '2026-04-12T14:00:00Z' }
    //   ],
    //   tasks: {                      // per-stage task completion
    //     's1-t1': true, 's1-t2': true, 's1-t3': true, 's1-t4': true,
    //     's2-t1': true, 's2-t2': false,
    //     ...
    //   },
    //   mandatoryDocs: {
    //     buyerIntegrationGuide: { uploaded: true, fileName: '...', uploadedAt: '...' },
    //     businessRuleSpec:      { uploaded: true, fileName: '...', uploadedAt: '...' }
    //   },
    //   siAdvisor: { name: '', email: '', phone: '' },
    //   troubleshoot: { level1Attempted: false, level2Attempted: false },
    //   createdAt: '2026-04-01T08:00:00Z',
    //   updatedAt: '2026-04-16T09:30:00Z'
    // }
  },

  /* ---- Buyers (keyed by ANID or name slug) ---- */
  buyers: {
    // Example:
    // 'sap-se': {
    //   id: 'sap-se',
    //   name: 'SAP SE',
    //   initials: 'SA',
    //   currentStage: 'b1',
    //   guides: {
    //     integrationGuide: { fileName: '...', uploadedAt: '...', size: 0 },
    //     businessRuleSpec:  { fileName: '...', uploadedAt: '...', size: 0 }
    //   },
    //   suppliers: ['AN01234567890', 'AN09876543210'],  // linked supplier ANIDs
    //   createdAt: '...',
    //   updatedAt: '...'
    // }
  },

  /* ---- Supplier Mappings (for Guides > Supplier Mapping validation) ---- */
  supplierMappings: {
    // 'AN01234567890_850': {
    //   anid: 'AN01234567890',
    //   transactionType: '850',       // 850, 855, 856, 810, 820
    //   fileName: 'acme_po850_mapping_v2.xml',
    //   fileSize: 42000,
    //   detectedFormat: 'EDI X12',    // auto-detected: 'cXML', 'EDI X12', 'CSV'
    //   buyerGuideId: 'sap-se',       // which buyer guide to compare against
    //   validationResult: {
    //     status: 'changes_required', // 'successful', 'changes_required', 'not_validated'
    //     successCount: 18,
    //     changesCount: 3,
    //     changes: [
    //       { type: 'missing', field: 'SAC', description: '...' },
    //       { type: 'mismatch', field: 'PO1-06', description: '...' },
    //     ],
    //     validatedAt: '2026-04-16T10:00:00Z'
    //   },
    //   uploadedAt: '2026-04-14T08:00:00Z'
    // }
  },

  /* ---- Settings ---- */
  settings: {
    defaultView: 'buyer',             // 'buyer' or 'supplier' for dashboard
    lastActiveTab: 'dashboard',
    lastActiveSupplier: null,          // ANID of last viewed supplier
    lastActiveBuyer: null,
  },

  /* ---- Context (set by content script) ---- */
  currentContext: {
    anid: null,
    supplierName: null,
    portal: null,                      // 'ariba' or 'cig'
    pageUrl: null,
    detectedAt: null
  }
};

/* ===== TASK DEFINITIONS PER STAGE ===== */
const SUPPLIER_TASKS = {
  s1: [
    { id: 's1-t1', text: 'Supplier AN account registration',      role: 'Supplier' },
    { id: 's1-t2', text: 'B2B standard selection',                 role: 'Tech Lead' },
    { id: 's1-t3', text: 'ERP type & capability assessment',       role: 'SI',       ai: true },
    { id: 's1-t4', text: 'Assign project team & resources',        role: 'PM' },
  ],
  s2: [
    { id: 's2-t1', text: 'Confirm scope: doc types, locations',    role: 'Business' },
    { id: 's2-t2', text: 'Evaluate options (Portal/CSV/B2B)',      role: 'Tech Lead', ai: true },
    { id: 's2-t3', text: 'Review IGW & specifications',            role: 'Tech Lead' },
    { id: 's2-t4', text: 'Supplier-facing kickoff call',           role: 'All' },
    { id: 's2-t5', text: 'Negotiate & commit to timeline',         role: 'PM' },
    { id: 's2-t6', text: 'Upload Buyer Integration Guide',         role: 'SI',       mandatory: true, docType: 'buyerIntegrationGuide' },
    { id: 's2-t7', text: 'Upload Business Rule Specification',     role: 'SI',       mandatory: true, docType: 'businessRuleSpec' },
  ],
  s3: [
    { id: 's3-t1', text: 'Setup AN & Managed Gateway (CIG)',       role: 'Tech Lead', ai: true },
    { id: 's3-t2', text: 'Establish connectivity (AS2/VAN/HTTPS)', role: 'Tech Lead' },
    { id: 's3-t3', text: 'Complete EDI/cXML mapping to ERP',       role: 'ERP Tech',  ai: true },
    { id: 's3-t4', text: 'Validate mapping against IGW specs',     role: 'SI',        ai: true },
    { id: 's3-t5', text: 'Configure CIG adapter templates',        role: 'SI' },
  ],
  s4: [
    { id: 's4-t1', text: 'Unit testing of B2B messages',           role: 'Tech Lead', ai: true },
    { id: 's4-t2', text: 'End-to-end UAT with buyer',              role: 'Testing' },
    { id: 's4-t3', text: 'Validate documents in supplier ERP',     role: 'ERP Tech' },
    { id: 's4-t4', text: 'Troubleshoot mapping/processing errors', role: 'Tech Lead' },
    { id: 's4-t5', text: 'Formal testing sign-off',                role: 'Business' },
  ],
  s5: [
    { id: 's5-t1', text: 'Migrate mappings & config to production', role: 'Tech Lead' },
    { id: 's5-t2', text: 'Configure production AN & CIG',           role: 'SI' },
    { id: 's5-t3', text: 'Smoke-test production transactions',      role: 'Testing' },
    { id: 's5-t4', text: 'Enable supplier in production',           role: 'SI' },
    { id: 's5-t5', text: 'Implement change management',             role: 'PM' },
  ],
  s6: [
    { id: 's6-t1', text: 'Hypercare monitoring & issue resolution', role: 'SI' },
    { id: 's6-t2', text: 'Monitor error rates & SLA compliance',   role: 'SI' },
    { id: 's6-t3', text: 'TRR acceptance',                         role: 'All' },
    { id: 's6-t4', text: 'Knowledge transfer & documentation',     role: 'SI' },
    { id: 's6-t5', text: 'Transition to steady-state operations',  role: 'PM' },
  ],
};

const BUYER_TASKS = {
  b1: [
    { id: 'b1-t1', text: 'Executive alignment & project charter',        role: 'PM' },
    { id: 'b1-t2', text: 'Supplier portfolio assessment & wave plan',    role: 'NEL', ai: true },
    { id: 'b1-t3', text: 'AN buyer account configuration',              role: 'SI' },
    { id: 'b1-t4', text: 'Validation rules & tolerance setup',          role: 'Business' },
    { id: 'b1-t5', text: 'Internal team training & RACI',               role: 'PM' },
  ],
  b2: [
    { id: 'b2-t1', text: 'Define enablement approach per supplier tier', role: 'NEL' },
    { id: 'b2-t2', text: 'Create standardized IGW templates',           role: 'SI', ai: true },
    { id: 'b2-t3', text: 'Configure CIG buyer-side adapters',           role: 'Tech Lead' },
    { id: 'b2-t4', text: 'Define acceptance criteria per doc type',     role: 'Business' },
  ],
  b3: [
    { id: 'b3-t1', text: 'Buyer-side CIG configuration',               role: 'Tech Lead' },
    { id: 'b3-t2', text: 'ERP integration setup (iDoc/BAPI)',           role: 'ERP Tech' },
    { id: 'b3-t3', text: 'Inbound processing rules',                   role: 'SI' },
  ],
  b4: [
    { id: 'b4-t1', text: 'Validate buyer-side processing',             role: 'Testing' },
    { id: 'b4-t2', text: 'Test validation rules & posting',            role: 'ERP Tech' },
    { id: 'b4-t3', text: 'End-to-end with pilot supplier',             role: 'Testing' },
  ],
  b5: [
    { id: 'b5-t1', text: 'Production cutover',                         role: 'Tech Lead' },
    { id: 'b5-t2', text: 'Supplier wave enablement',                   role: 'NEL' },
    { id: 'b5-t3', text: 'Communication & change management',          role: 'PM' },
  ],
  b6: [
    { id: 'b6-t1', text: 'Monitoring & hypercare',                     role: 'SI' },
    { id: 'b6-t2', text: 'Ongoing supplier enablement waves',          role: 'NEL' },
    { id: 'b6-t3', text: 'Steady-state operations',                    role: 'PM' },
  ],
};

/* ===== B2B TRANSACTION TYPES ===== */
const B2B_TRANSACTIONS = [
  { id: '850', name: 'Purchase Order',       cxml: 'OrderRequest',         direction: 'Buyer → Supplier' },
  { id: '855', name: 'PO Acknowledgment',    cxml: 'ConfirmationRequest',  direction: 'Supplier → Buyer' },
  { id: '856', name: 'Advance Ship Notice',  cxml: 'ShipNoticeRequest',    direction: 'Supplier → Buyer' },
  { id: '810', name: 'Invoice',              cxml: 'InvoiceDetailRequest', direction: 'Supplier → Buyer' },
  { id: '820', name: 'Remittance Advice',    cxml: 'PaymentRemittance',    direction: 'Buyer → Supplier' },
];

/* ===== HELPER: Initialize storage ===== */
async function initStorage() {
  const data = await chrome.storage.local.get(null);
  if (!data._version || data._version !== AIA_STORAGE_VERSION) {
    // Fresh install or version upgrade
    await chrome.storage.local.set(DEFAULT_STORAGE);
    console.log('[AIA] Storage initialized to v' + AIA_STORAGE_VERSION);
  }
  return data;
}

/* ===== HELPER: Get supplier by ANID ===== */
async function getSupplier(anid) {
  const { suppliers } = await chrome.storage.local.get('suppliers');
  return suppliers?.[anid] || null;
}

/* ===== HELPER: Save supplier ===== */
async function saveSupplier(anid, supplierData) {
  const { suppliers } = await chrome.storage.local.get('suppliers');
  const updated = { ...suppliers, [anid]: { ...supplierData, updatedAt: new Date().toISOString() } };
  await chrome.storage.local.set({ suppliers: updated });
}

/* ===== HELPER: Get all suppliers as array ===== */
async function getAllSuppliers() {
  const { suppliers } = await chrome.storage.local.get('suppliers');
  return Object.values(suppliers || {});
}

/* ===== HELPER: Get buyer by ID ===== */
async function getBuyer(buyerId) {
  const { buyers } = await chrome.storage.local.get('buyers');
  return buyers?.[buyerId] || null;
}

/* ===== HELPER: Save buyer ===== */
async function saveBuyer(buyerId, buyerData) {
  const { buyers } = await chrome.storage.local.get('buyers');
  const updated = { ...buyers, [buyerId]: { ...buyerData, updatedAt: new Date().toISOString() } };
  await chrome.storage.local.set({ buyers: updated });
}

/* ===== HELPER: Update context from content script ===== */
async function updateContext(contextData) {
  await chrome.storage.local.set({
    currentContext: { ...contextData, detectedAt: new Date().toISOString() }
  });
}
