/**
 * cXML Anonymizer — Pure JS engine for anonymizing cXML transactional documents.
 * Ported from Python Streamlit app (github.com/Foom-552/cXML-Anonymizer).
 * Runs entirely in-browser using DOMParser + XMLSerializer.
 */
// eslint-disable-next-line no-unused-vars
var CxmlAnonymizer = (function() {
'use strict';

// ─── Country Profiles ─────────────────────────────────────────────────────────
const COUNTRY_PROFILES = {
  AU: { display_name:"Australia (APAC)", region:"APAC", City:"Anonymized City", State:"WA", PostalCode:"6000", Country:"Australia", isoCountryCode:"AU", Money:"1.00", currency:"AUD", Number:"0891234567" },
  NZ: { display_name:"New Zealand (APAC)", region:"APAC", City:"Anonymized City", State:"Auckland", PostalCode:"1010", Country:"New Zealand", isoCountryCode:"NZ", Money:"1.00", currency:"NZD", Number:"093012345" },
  IN: { display_name:"India (APAC)", region:"APAC", City:"Anonymized City", State:"Maharashtra", PostalCode:"400001", Country:"India", isoCountryCode:"IN", Money:"1.00", currency:"INR", Number:"02212345678" },
  CN: { display_name:"China (APAC)", region:"APAC", City:"Anonymized City", State:"Shanghai", PostalCode:"200000", Country:"China", isoCountryCode:"CN", Money:"1.00", currency:"CNY", Number:"02112345678" },
  SG: { display_name:"Singapore (APAC)", region:"APAC", City:"Anonymized City", State:"SG", PostalCode:"018956", Country:"Singapore", isoCountryCode:"SG", Money:"1.00", currency:"SGD", Number:"61234567" },
  KR: { display_name:"South Korea (APAC)", region:"APAC", City:"Anonymized City", State:"Seoul", PostalCode:"04524", Country:"Korea, Republic of", isoCountryCode:"KR", Money:"1.00", currency:"KRW", Number:"0212345678" },
  TH: { display_name:"Thailand (APAC)", region:"APAC", City:"Anonymized City", State:"Bangkok", PostalCode:"10110", Country:"Thailand", isoCountryCode:"TH", Money:"1.00", currency:"THB", Number:"021234567" },
  ID: { display_name:"Indonesia (APAC)", region:"APAC", City:"Anonymized City", State:"Jakarta", PostalCode:"10110", Country:"Indonesia", isoCountryCode:"ID", Money:"1.00", currency:"IDR", Number:"02112345678" },
  PH: { display_name:"Philippines (APAC)", region:"APAC", City:"Anonymized City", State:"Metro Manila", PostalCode:"1000", Country:"Philippines", isoCountryCode:"PH", Money:"1.00", currency:"PHP", Number:"0281234567" },
  MY: { display_name:"Malaysia (APAC)", region:"APAC", City:"Anonymized City", State:"Kuala Lumpur", PostalCode:"50450", Country:"Malaysia", isoCountryCode:"MY", Money:"1.00", currency:"MYR", Number:"0312345678" },
  US: { display_name:"United States (NAMAR)", region:"NAMAR", City:"Anonymized City", State:"CA", PostalCode:"90210", Country:"United States", isoCountryCode:"US", Money:"1.00", currency:"USD", Number:"555-555-5555" },
  CA: { display_name:"Canada (NAMAR)", region:"NAMAR", City:"Anonymized City", State:"ON", PostalCode:"M5H 2N2", Country:"Canada", isoCountryCode:"CA", Money:"1.00", currency:"CAD", Number:"416-555-5555" },
  MX: { display_name:"Mexico (NAMAR)", region:"NAMAR", City:"Anonymized City", State:"CDMX", PostalCode:"06600", Country:"Mexico", isoCountryCode:"MX", Money:"1.00", currency:"MXN", Number:"5512345678" },
  DE: { display_name:"Germany (EMEA)", region:"EMEA", City:"Anonymized City", State:"BE", PostalCode:"10115", Country:"Germany", isoCountryCode:"DE", Money:"1.00", currency:"EUR", Number:"03012345678" },
  GB: { display_name:"United Kingdom (EMEA)", region:"EMEA", City:"Anonymized City", State:"London", PostalCode:"SW1A 1AA", Country:"United Kingdom", isoCountryCode:"GB", Money:"1.00", currency:"GBP", Number:"02012345678" },
  FR: { display_name:"France (EMEA)", region:"EMEA", City:"Anonymized City", State:"IDF", PostalCode:"75001", Country:"France", isoCountryCode:"FR", Money:"1.00", currency:"EUR", Number:"0112345678" },
  NL: { display_name:"Netherlands (EMEA)", region:"EMEA", City:"Anonymized City", State:"NH", PostalCode:"1012 AB", Country:"Netherlands", isoCountryCode:"NL", Money:"1.00", currency:"EUR", Number:"0201234567" },
  CH: { display_name:"Switzerland (EMEA)", region:"EMEA", City:"Anonymized City", State:"ZH", PostalCode:"8001", Country:"Switzerland", isoCountryCode:"CH", Money:"1.00", currency:"CHF", Number:"0441234567" },
  SE: { display_name:"Sweden (EMEA)", region:"EMEA", City:"Anonymized City", State:"Stockholm", PostalCode:"111 22", Country:"Sweden", isoCountryCode:"SE", Money:"1.00", currency:"SEK", Number:"081234567" },
  AE: { display_name:"UAE (EMEA)", region:"EMEA", City:"Anonymized City", State:"Dubai", PostalCode:"00000", Country:"United Arab Emirates", isoCountryCode:"AE", Money:"1.00", currency:"AED", Number:"041234567" },
  SA: { display_name:"Saudi Arabia (EMEA)", region:"EMEA", City:"Anonymized City", State:"Riyadh", PostalCode:"11564", Country:"Saudi Arabia", isoCountryCode:"SA", Money:"1.00", currency:"SAR", Number:"0112345678" },
  ZA: { display_name:"South Africa (EMEA)", region:"EMEA", City:"Anonymized City", State:"Gauteng", PostalCode:"2000", Country:"South Africa", isoCountryCode:"ZA", Money:"1.00", currency:"ZAR", Number:"0111234567" },
  IL: { display_name:"Israel (EMEA)", region:"EMEA", City:"Anonymized City", State:"Tel Aviv", PostalCode:"6100000", Country:"Israel", isoCountryCode:"IL", Money:"1.00", currency:"ILS", Number:"031234567" },
  TR: { display_name:"Turkey (EMEA)", region:"EMEA", City:"Anonymized City", State:"Istanbul", PostalCode:"34000", Country:"Turkey", isoCountryCode:"TR", Money:"1.00", currency:"TRY", Number:"02121234567" },
  JP: { display_name:"Japan", region:"Japan", City:"Chiyoda", State:"Tokyo", PostalCode:"100-0001", Country:"Japan", isoCountryCode:"JP", Money:"1.00", currency:"JPY", Number:"0312345678" },
  BR: { display_name:"Brazil (LATAM)", region:"LATAM", City:"Anonymized City", State:"SP", PostalCode:"01000-000", Country:"Brazil", isoCountryCode:"BR", Money:"1.00", currency:"BRL", Number:"1112345678" },
  AR: { display_name:"Argentina (LATAM)", region:"LATAM", City:"Anonymized City", State:"BA", PostalCode:"C1001", Country:"Argentina", isoCountryCode:"AR", Money:"1.00", currency:"ARS", Number:"1112345678" },
  CO: { display_name:"Colombia (LATAM)", region:"LATAM", City:"Anonymized City", State:"Bogota", PostalCode:"110111", Country:"Colombia", isoCountryCode:"CO", Money:"1.00", currency:"COP", Number:"6011234567" },
  CL: { display_name:"Chile (LATAM)", region:"LATAM", City:"Anonymized City", State:"RM", PostalCode:"8320000", Country:"Chile", isoCountryCode:"CL", Money:"1.00", currency:"CLP", Number:"221234567" },
};

const REGION_DEFAULTS = { APAC:"AU", NAMAR:"US", EMEA:"DE", Japan:"JP", LATAM:"BR" };
const DEFAULT_REGION = "APAC";

const ISO_COUNTRY_TO_REGION = {
  AU:"APAC",NZ:"APAC",IN:"APAC",CN:"APAC",SG:"APAC",KR:"APAC",TH:"APAC",ID:"APAC",PH:"APAC",VN:"APAC",MY:"APAC",TW:"APAC",HK:"APAC",BD:"APAC",LK:"APAC",
  US:"NAMAR",CA:"NAMAR",
  JP:"Japan",
  GB:"EMEA",DE:"EMEA",FR:"EMEA",IT:"EMEA",ES:"EMEA",NL:"EMEA",BE:"EMEA",CH:"EMEA",AT:"EMEA",SE:"EMEA",NO:"EMEA",DK:"EMEA",FI:"EMEA",IE:"EMEA",PT:"EMEA",PL:"EMEA",CZ:"EMEA",HU:"EMEA",RO:"EMEA",GR:"EMEA",
  AE:"EMEA",SA:"EMEA",QA:"EMEA",KW:"EMEA",BH:"EMEA",IL:"EMEA",TR:"EMEA",ZA:"EMEA",NG:"EMEA",EG:"EMEA",KE:"EMEA",PK:"EMEA",
  MX:"LATAM",BR:"LATAM",AR:"LATAM",CO:"LATAM",CL:"LATAM",PE:"LATAM",EC:"LATAM",VE:"LATAM",UY:"LATAM",
};

const CURRENCY_TO_COUNTRY = {
  AUD:["APAC","AU"],NZD:["APAC","NZ"],INR:["APAC","IN"],CNY:["APAC","CN"],SGD:["APAC","SG"],KRW:["APAC","KR"],THB:["APAC","TH"],IDR:["APAC","ID"],PHP:["APAC","PH"],MYR:["APAC","MY"],
  USD:["NAMAR","US"],CAD:["NAMAR","CA"],
  JPY:["Japan","JP"],
  EUR:["EMEA","DE"],GBP:["EMEA","GB"],CHF:["EMEA","CH"],SEK:["EMEA","SE"],NOK:["EMEA","NO"],DKK:["EMEA","DK"],PLN:["EMEA","PL"],ZAR:["EMEA","ZA"],AED:["EMEA","AE"],SAR:["EMEA","SA"],TRY:["EMEA","TR"],ILS:["EMEA","IL"],
  MXN:["LATAM","MX"],BRL:["LATAM","BR"],ARS:["LATAM","AR"],COP:["LATAM","CO"],CLP:["LATAM","CL"],PEN:["LATAM","PE"],
};

const COUNTRY_NAME_TO_CODE = {
  australia:"AU","new zealand":"NZ",india:"IN",china:"CN",singapore:"SG","south korea":"KR",thailand:"TH",indonesia:"ID",philippines:"PH",malaysia:"MY",
  "united states":"US",usa:"US",canada:"CA",mexico:"MX",
  japan:"JP",
  germany:"DE",france:"FR","united kingdom":"GB",uk:"GB",netherlands:"NL",spain:"ES",italy:"IT",sweden:"SE",switzerland:"CH",austria:"AT",belgium:"BE",
  "united arab emirates":"AE",uae:"AE","saudi arabia":"SA","south africa":"ZA",israel:"IL",turkey:"TR",
  brazil:"BR",brasil:"BR",argentina:"AR",colombia:"CO",chile:"CL",peru:"PE",
};

// ─── Extrinsic Anonymization Maps ─────────────────────────────────────────────
const EXTRINSIC_ANONYMIZATION_MAP = {
  supplierVatID:"Supplier ABN", buyerVatID:"Buyer ABN", vatID:"ABN", taxID:"TAX-ID-000000000", taxExemptionNumber:"TAX-EXEMPT-000000",
  abn:"000000000", gst:"GST-000000000", businessIdentNo:"BUSINESS-ID-00000000000",
  supplierID:"SUPPLIER-ID-00000", buyerID:"BUYER-ID-00000", vendorID:"VENDOR-ID-00000", VendorIdNumber:"VENDOR-ID-0000",
  vendorAbbreviationCode:"Anonymized Vendor", partyAdditionalID:"PARTY-ID-00000000", customerId:"CUSTOMER-ID-00000",
  customerNumber:"CUSTOMER-00000", supplierNumber:"SUPPLIER-00000", accountNumber:"ACCOUNT-00000",
  userIdentification:"Anonymized User", mailbox:"anonymized.user@anonymized.com", Requester:"Anonymized Requester",
  contactName:"Anonymized Contact", buyerContact:"Anonymized Buyer Contact", supplierContact:"Anonymized Supplier Contact",
  requestorName:"Anonymized Requestor", approverName:"Anonymized Approver", userID:"USER-ID-00000", userId:"USER-ID-00000",
  requestForQuotationRef:"RFQ-0000000000-00000", purchaseRequisitionNo:"PR-0000000000-00000",
  customerReferenceNo:"CUSTOMER-REF-00000", contractID:"CONTRACT-ID-00000", agreementID:"AGREEMENT-ID-00000",
  orderID:"ORDER-ID-00000", invoiceID:"INVOICE-ID-00000", trackingNumber:"TRACKING-000000000",
  costCenter:"COST-CENTER-00000", costCentre:"COST-CENTER-00000", glAccount:"GL-ACCOUNT-00000",
  wbsElement:"WBS-ELEMENT-00000", profitCenter:"PROFIT-CENTER-00000", companyCode:"COMPANY-CODE-0000",
  networkID:"NETWORK-ID-00000", buyerNetworkID:"BUYER-NETWORK-ID-00000", supplierNetworkID:"SUPPLIER-NETWORK-ID-00000",
  erpSystemID:"ERP-SYSTEM-ID-00000", systemID:"SYSTEM-ID-00000",
  note:"Anonymized note.", comment:"Anonymized comment.", description:"Anonymized description.",
  invoiceNumber:"ANON-INVOICE-NO-00000", poNumber:"ANON-PO-NO-00000", purchaseOrderNumber:"ANON-PO-NO-00000",
  deliveryNoteNo:"ANON-DELIVERY-NO-00000", goodsReceiptNo:"ANON-GR-NO-00000",
  bankAccountNumber:"ANON-BANK-ACCT-00000", iban:"ANON-IBAN-00000000", swiftCode:"ANONBICX", bic:"ANONBICX",
  bankName:"Anonymized Bank", bankRoutingNumber:"ANON-ROUTING-00000", paymentReference:"ANON-PAYMENT-REF-00000",
  legalEntityName:"Anonymized Legal Entity", legalEntityID:"ANON-LEGAL-ID-00000",
  submitterEmail:"submitter@anonymized.com", submitterName:"Anonymized Submitter",
  contactEmail:"contact@anonymized.com", supplementNo:"ANONYMIZED-PHONE",
};

const PRESERVE_EXTRINSIC_NAMES = new Set([
  "extLineNumber","materialStorageLocation","warehouseStorageLocationNo","incoTerm","incoTermDesc","incoTermLocation",
  "CompanyCode","PurchaseGroup","PurchaseOrganization","Ariba.invoicingAllowed",
  "AribaNetwork.PaymentTermsExplanation","transactionCategoryOrType","invoiceSourceDocument","invoiceType",
]);

const GENERIC_ANONYMIZATION_MAP = {
  Name:"Anonymized Name", Email:"test.user@anonymized.com", Street:"123 Anonymized St",
  Description:"Anonymized Item Description", Comments:"Anonymized comment.",
  SupplierPartID:"ANONYMIZED_PART_ID", BuyerPartID:"ANONYMIZED_PART_ID",
  agreementID:"ANONYMIZED_AGREEMENT_ID", addressID:"ANONYMIZED_ADDRESS_ID",
  agreementItemNumber:"0", documentID:"ANONYMIZED_DOC_ID",
};

// Tags whose text is replaced with profile-driven values
const PROFILE_DRIVEN_TAGS = new Set(["City","State","PostalCode","Country","Number"]);
// Tags that get distinct anonymization (different originals → different placeholders)
const DISTINCT_TAGS = new Set(["Name","Email","Number","Street","DeliverTo"]);

const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localName(el) {
  return el.localName || el.tagName.split(':').pop();
}

function getAllElements(doc) {
  return doc.querySelectorAll('*');
}

function looksLikeXml(content) {
  const s = content.trimStart();
  return s.startsWith('<?xml') || s.startsWith('<cXML');
}

// ─── Region Detection ─────────────────────────────────────────────────────────

function detectCountry(doc) {
  const countryEls = doc.querySelectorAll('Country');
  const moneyEls = doc.querySelectorAll('Money');

  // 1. isoCountryCode majority-vote
  const codeCounts = {};
  for (const el of countryEls) {
    const code = (el.getAttribute('isoCountryCode') || '').toUpperCase();
    if (code && ISO_COUNTRY_TO_REGION[code]) {
      codeCounts[code] = (codeCounts[code] || 0) + 1;
    }
  }
  const codes = Object.keys(codeCounts);
  if (codes.length) {
    const winner = codes.reduce((a, b) => codeCounts[a] >= codeCounts[b] ? a : b);
    return { country: winner, region: ISO_COUNTRY_TO_REGION[winner], method: `isoCountryCode='${winner}'` };
  }

  // 2. Currency on <Money>
  for (const el of moneyEls) {
    const cur = (el.getAttribute('currency') || '').toUpperCase();
    if (CURRENCY_TO_COUNTRY[cur]) {
      const [region, country] = CURRENCY_TO_COUNTRY[cur];
      return { country, region, method: `currency='${cur}'` };
    }
  }

  // 3. Country text content
  for (const el of countryEls) {
    const name = (el.textContent || '').trim().toLowerCase();
    if (COUNTRY_NAME_TO_CODE[name]) {
      const code = COUNTRY_NAME_TO_CODE[name];
      return { country: code, region: ISO_COUNTRY_TO_REGION[code] || DEFAULT_REGION, method: `country name='${el.textContent.trim()}'` };
    }
  }

  // 4. Fallback
  return { country: REGION_DEFAULTS[DEFAULT_REGION], region: DEFAULT_REGION, method: 'fallback default' };
}

function resolveProfile(countryCode) {
  if (COUNTRY_PROFILES[countryCode]) return COUNTRY_PROFILES[countryCode];
  const region = ISO_COUNTRY_TO_REGION[countryCode] || DEFAULT_REGION;
  const defaultCode = REGION_DEFAULTS[region] || REGION_DEFAULTS[DEFAULT_REGION];
  return COUNTRY_PROFILES[defaultCode];
}

// ─── Document Type Detection ──────────────────────────────────────────────────

function detectDocumentType(doc) {
  const request = doc.querySelector('Request');
  if (!request) {
    if (doc.querySelector('Response')) return { baseType:'Response', subType:'', label:'Response' };
    return { baseType:'Unknown', subType:'', label:'Unknown' };
  }

  if (request.querySelector('OrderRequest')) {
    const orh = doc.querySelector('OrderRequestHeader');
    if (!orh) return { baseType:'OrderRequest', subType:'New', label:'OrderRequest' };
    const poType = (orh.getAttribute('type') || 'new').toLowerCase();
    const orderVersion = orh.getAttribute('orderVersion') || '1';
    const orderType = orh.getAttribute('orderType') || 'regular';
    let subType = 'New';
    if (poType === 'delete') subType = 'Cancel';
    else if (poType === 'update') subType = 'Change';
    else if (parseInt(orderVersion) > 1) subType = 'Change';
    const parts = [];
    if (subType !== 'New') parts.push(subType);
    if (orderType !== 'regular') parts.push(orderType);
    const label = parts.length ? `OrderRequest (${parts.join(', ')})` : 'OrderRequest';
    return { baseType:'OrderRequest', subType, orderVersion, orderType, label };
  }
  if (request.querySelector('ConfirmationRequest')) return { baseType:'OrderConfirmation', subType:'', label:'Order Confirmation' };
  if (request.querySelector('ShipNoticeRequest')) return { baseType:'ShipNotice', subType:'', label:'Ship Notice' };
  if (request.querySelector('InvoiceDetailRequest')) return { baseType:'Invoice', subType:'', label:'Invoice' };
  return { baseType:'Request (Other)', subType:'', label:'Request (Other)' };
}

// ─── Anonymization Engine ─────────────────────────────────────────────────────

function anonymizeDocument(xmlContent, overrideCountry) {
  if (!looksLikeXml(xmlContent)) {
    return { success: false, error: 'File does not appear to contain XML content.' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { success: false, error: 'XML parsing error: ' + parseError.textContent.substring(0, 200) };
  }

  const root = doc.documentElement;
  if (localName(root) !== 'cXML') {
    return { success: false, error: `Invalid root element <${localName(root)}>. Expected <cXML>.` };
  }

  if (!root.getAttribute('payloadID')) {
    return { success: false, error: "Missing required 'payloadID' attribute on <cXML>." };
  }

  const docMeta = detectDocumentType(doc);
  let detection;
  if (overrideCountry && overrideCountry !== 'auto') {
    const region = ISO_COUNTRY_TO_REGION[overrideCountry] || DEFAULT_REGION;
    detection = { country: overrideCountry, region, method: `manual override (${overrideCountry})` };
  } else {
    detection = detectCountry(doc);
  }
  const profile = resolveProfile(detection.country);

  const log = [];
  const valueMap = {}; // original value → anonymized value (for consistency)
  const distinctCounters = {}; // tag → counter for distinct anonymization

  // Phase 1: Header template
  applyHeaderTemplate(root, docMeta, log);

  // Phase 2: Anonymize elements
  anonymizeElements(root, profile, log, valueMap, distinctCounters);

  // Serialize back to string
  const serializer = new XMLSerializer();
  let output = serializer.serializeToString(doc);

  // Fix: add XML declaration and DOCTYPE if missing
  if (!output.startsWith('<?xml')) {
    output = '<?xml version="1.0" encoding="UTF-8"?>\n' + output;
  }
  // Insert DOCTYPE after xml declaration
  const dtd = '<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.069/cXML.dtd">';
  output = output.replace(/(^<\?xml[^?]*\?>\s*)/, `$1${dtd}\n`);

  return {
    success: true,
    output,
    docMeta,
    detection,
    profile,
    log,
    substitutionCount: log.length,
  };
}

function applyHeaderTemplate(root, docMeta, log) {
  // cXML root attributes
  const headerAttrs = [
    ['payloadID', '#PAYLOADID#'],
    ['timestamp', '2026-01-01T14:53:00-07:00'],
    ['version', '1.2.069'],
  ];
  for (const [attr, newVal] of headerAttrs) {
    const old = root.getAttribute(attr);
    root.setAttribute(attr, newVal);
    if (old && old !== newVal) log.push({ field: `<cXML ${attr}>`, original: old, anonymized: newVal });
  }

  // xml:lang
  root.setAttribute('xml:lang', 'en-US');

  // Header/Credential identities
  const header = root.querySelector('Header');
  if (header) {
    const credentialReplacements = [
      ['From', '#SENDERID#', 'NetworkId'],
      ['To', '#RECEIVERID#', 'NetworkId'],
      ['Sender', '#PROVIDERID#', 'NetworkID'],
    ];
    for (const [parentTag, identity, domain] of credentialReplacements) {
      const parentEl = header.querySelector(parentTag);
      if (!parentEl) continue;
      const cred = parentEl.querySelector('Credential');
      if (!cred) continue;
      const idEl = cred.querySelector('Identity');
      const oldIdentity = idEl ? idEl.textContent : '';
      const oldDomain = cred.getAttribute('domain') || '';
      cred.setAttribute('domain', domain);
      if (idEl) { idEl.textContent = identity; }
      if (oldIdentity !== identity) log.push({ field: `<${parentTag}/Credential/Identity>`, original: oldIdentity, anonymized: identity });
    }

    // UserAgent
    const sender = header.querySelector('Sender');
    if (sender) {
      const ua = sender.querySelector('UserAgent');
      if (ua) {
        const old = ua.textContent;
        ua.textContent = 'Ariba SN';
        if (old !== 'Ariba SN') log.push({ field: '<Sender/UserAgent>', original: old, anonymized: 'Ariba SN' });
      }
    }
  }

  // Request deploymentMode
  const request = root.querySelector('Request');
  if (request) {
    const old = request.getAttribute('deploymentMode');
    request.setAttribute('deploymentMode', 'test');
    if (old !== 'test') log.push({ field: '<Request deploymentMode>', original: old || '', anonymized: 'test' });
  }

  // OrderRequestHeader
  const orh = root.querySelector('OrderRequestHeader');
  if (orh) {
    const preserveAttrs = docMeta.subType === 'Change' || docMeta.subType === 'Cancel';
    const currentOrderType = docMeta.orderType || orh.getAttribute('orderType') || 'regular';

    const replacements = [
      ['orderDate', '#DATETIME#'],
      ['orderID', '#DOCUMENTID#'],
      ['orderType', currentOrderType],
    ];
    if (preserveAttrs) {
      replacements.push(['orderVersion', orh.getAttribute('orderVersion') || '1']);
      replacements.push(['type', orh.getAttribute('type') || 'new']);
    } else {
      replacements.push(['orderVersion', '1']);
      replacements.push(['type', 'new']);
    }

    for (const [attr, newVal] of replacements) {
      const old = orh.getAttribute(attr);
      orh.setAttribute(attr, newVal);
      if (old && old !== newVal) log.push({ field: `<OrderRequestHeader ${attr}>`, original: old, anonymized: newVal });
    }

    // DocumentReference for Change/Cancel POs
    if (preserveAttrs) {
      const docRef = orh.querySelector('DocumentReference');
      if (docRef) {
        const old = docRef.getAttribute('payloadID');
        docRef.setAttribute('payloadID', '#PREV_PAYLOADID#');
        if (old) log.push({ field: '<DocumentReference payloadID>', original: old, anonymized: '#PREV_PAYLOADID#' });
      }
    }
  }
}

function anonymizeElements(root, profile, log, valueMap, distinctCounters) {
  const allElements = root.querySelectorAll('*');

  for (const el of allElements) {
    const tag = localName(el);

    // Skip structural containers
    if (['cXML','Header','Request','Response','From','To','Sender','Credential','OrderRequest',
         'ConfirmationRequest','ShipNoticeRequest','InvoiceDetailRequest','OrderRequestHeader'].includes(tag)) continue;

    // Extrinsic elements — special handling
    if (tag === 'Extrinsic') {
      anonymizeExtrinsic(el, log, valueMap);
      continue;
    }

    // Profile-driven tags (City, State, PostalCode, Country, Number inside TelephoneNumber)
    if (PROFILE_DRIVEN_TAGS.has(tag)) {
      const parentTag = el.parentElement ? localName(el.parentElement) : '';
      // Number only inside TelephoneNumber/Phone/Fax
      if (tag === 'Number' && !['TelephoneNumber','Phone','Fax'].includes(parentTag)) continue;
      // Country: only replace text, preserve isoCountryCode
      if (tag === 'Country') {
        const old = el.textContent.trim();
        if (old && old !== profile.Country) {
          el.textContent = profile.Country;
          el.setAttribute('isoCountryCode', profile.isoCountryCode);
          log.push({ field: `<${tag}>`, original: old, anonymized: profile.Country });
        }
        continue;
      }
      const old = el.textContent.trim();
      const newVal = profile[tag] || 'Anonymized';
      if (old && old !== newVal) {
        el.textContent = newVal;
        log.push({ field: `<${tag}>`, original: old, anonymized: newVal });
      }
      continue;
    }

    // Distinct tags (Name, Email, Street, DeliverTo)
    if (DISTINCT_TAGS.has(tag)) {
      const old = el.textContent.trim();
      if (!old) continue;
      if (!valueMap[old]) {
        distinctCounters[tag] = (distinctCounters[tag] || 0) + 1;
        const count = distinctCounters[tag];
        if (tag === 'Name') valueMap[old] = count === 1 ? 'Anonymized Name' : `Anonymized Name ${count}`;
        else if (tag === 'Email') valueMap[old] = count === 1 ? 'test.user@anonymized.com' : `test.user${count}@anonymized.com`;
        else if (tag === 'Street') valueMap[old] = count === 1 ? '123 Anonymized St' : `${100 + count} Anonymized St`;
        else if (tag === 'DeliverTo') valueMap[old] = count === 1 ? 'Anonymized Recipient' : `Anonymized Recipient ${count}`;
        else if (tag === 'Number') valueMap[old] = profile.Number || '0000000000';
        else valueMap[old] = `Anonymized ${tag} ${count}`;
      }
      el.textContent = valueMap[old];
      log.push({ field: `<${tag}>`, original: old, anonymized: valueMap[old] });
      continue;
    }

    // Money elements — anonymize amount
    if (tag === 'Money') {
      const old = el.textContent.trim();
      if (old && old !== '1.00') {
        el.textContent = '1.00';
        // Also set currency to profile
        if (el.getAttribute('currency')) el.setAttribute('currency', profile.currency);
        log.push({ field: '<Money>', original: old, anonymized: '1.00' });
      }
      continue;
    }

    // IdReference — anonymize identifier attribute
    if (tag === 'IdReference') {
      const ident = el.getAttribute('identifier');
      if (ident) {
        const anon = valueMap[ident] || 'ANONYMIZED_IDENTIFIER';
        el.setAttribute('identifier', anon);
        if (ident !== anon) log.push({ field: '<IdReference identifier>', original: ident, anonymized: anon });
      }
      continue;
    }

    // Generic tag-name match (Description, Comments, SupplierPartID, BuyerPartID)
    if (GENERIC_ANONYMIZATION_MAP[tag]) {
      const old = el.textContent.trim();
      if (old && old !== GENERIC_ANONYMIZATION_MAP[tag]) {
        el.textContent = GENERIC_ANONYMIZATION_MAP[tag];
        log.push({ field: `<${tag}>`, original: old, anonymized: GENERIC_ANONYMIZATION_MAP[tag] });
      }
      continue;
    }

    // Sensitive attributes on any element
    for (const attr of el.attributes) {
      if (['name','email','phone','contact','firstName','lastName'].includes(attr.name.toLowerCase())) {
        // Only if parent is a contact-type element
        if (['Contact','ShipTo','BillTo','InvoicePartner'].includes(localName(el.parentElement || {}))) {
          const old = attr.value;
          if (old) {
            el.setAttribute(attr.name, 'Anonymized');
            log.push({ field: `<${tag} ${attr.name}>`, original: old, anonymized: 'Anonymized' });
          }
        }
      }
    }
  }
}

function anonymizeExtrinsic(el, log, valueMap) {
  const name = el.getAttribute('name') || '';

  // Preserved extrinsics — do not touch
  if (PRESERVE_EXTRINSIC_NAMES.has(name)) return;

  // Check if it has sub-elements (structural extrinsic)
  if (el.children.length > 0) {
    // Anonymize URL children
    for (const child of el.querySelectorAll('URL')) {
      const old = child.textContent.trim();
      if (old) {
        const repl = old.startsWith('cid:') ? 'cid:anonymized@cxml.org' : 'https://anonymized.example.com';
        child.textContent = repl;
        log.push({ field: `<URL> (Extrinsic '${name}')`, original: old, anonymized: repl });
      }
    }
    return;
  }

  // Text-content extrinsic
  const old = (el.textContent || '').trim();
  if (!old) return;

  if (EXTRINSIC_ANONYMIZATION_MAP[name]) {
    const newVal = EXTRINSIC_ANONYMIZATION_MAP[name];
    el.textContent = newVal;
    valueMap[old] = newVal;
    log.push({ field: `<Extrinsic name="${name}">`, original: old, anonymized: newVal });
  }
  // Unknown extrinsics with potentially sensitive names — anonymize generically
  else if (/id|name|email|phone|contact|number|account|ref|code/i.test(name)) {
    const newVal = `ANONYMIZED_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    el.textContent = newVal;
    valueMap[old] = newVal;
    log.push({ field: `<Extrinsic name="${name}">`, original: old, anonymized: newVal });
  }
}

// ─── Batch Processing ─────────────────────────────────────────────────────────

function processBatch(files, overrideCountry, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = anonymizeDocument(file.content, overrideCountry);
    results.push({
      filename: file.name,
      ...result,
    });
    if (onProgress) onProgress(i + 1, files.length);
  }
  return results;
}

// ─── ZIP Generation ───────────────────────────────────────────────────────────

async function generateZip(results) {
  // Use JSZip if available, otherwise manual ZIP (simplified)
  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    for (const r of results) {
      if (r.success) {
        const anonName = r.filename.replace(/(\.[^.]+)$/, '_ANONYMIZED$1');
        zip.file(anonName, r.output);
      }
    }
    return await zip.generateAsync({ type: 'blob' });
  }
  // Fallback: create a simple concatenation download (single file if 1 result)
  if (results.length === 1 && results[0].success) {
    return new Blob([results[0].output], { type: 'text/xml' });
  }
  // Multiple files without JSZip — download individually
  return null;
}

function generateLogTSV(results) {
  let tsv = 'Filename\tField\tOriginal\tAnonymized\n';
  for (const r of results) {
    if (!r.success || !r.log) continue;
    for (const entry of r.log) {
      tsv += `${r.filename}\t${entry.field}\t${entry.original}\t${entry.anonymized}\n`;
    }
  }
  return new Blob([tsv], { type: 'text/tab-separated-values' });
}

// ─── Public API ───────────────────────────────────────────────────────────────

return {
  anonymizeDocument,
  processBatch,
  generateZip,
  generateLogTSV,
  detectCountry,
  detectDocumentType,
  resolveProfile,
  looksLikeXml,
  COUNTRY_PROFILES,
  MAX_FILES,
  MAX_FILE_SIZE_MB,
};

})();
