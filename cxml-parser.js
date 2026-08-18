/* cxml-parser.js — parse cXML OrderRequest documents, no DOM dependency */
(function(global) {
  'use strict';

  function parseCXML(xmlString) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlString, 'text/xml');

    var parseErr = doc.querySelector('parsererror');
    if (parseErr) {
      return { ok: false, error: 'Invalid XML: ' + parseErr.textContent.slice(0, 120) };
    }

    function text(selector, ctx) {
      var el = (ctx || doc).querySelector(selector);
      return el ? el.textContent.trim() : '';
    }
    function attr(selector, a, ctx) {
      var el = (ctx || doc).querySelector(selector);
      return el ? (el.getAttribute(a) || '') : '';
    }

    /* Header: From = buyer, To = supplier */
    var buyerAnid = '', supplierAnid = '';
    doc.querySelectorAll('Header > From > Credential').forEach(function(c) {
      if (!buyerAnid || c.getAttribute('domain') === 'NetworkID') buyerAnid = text('Identity', c);
    });
    doc.querySelectorAll('Header > To > Credential').forEach(function(c) {
      if (!supplierAnid || c.getAttribute('domain') === 'NetworkID') supplierAnid = text('Identity', c);
    });

    var orderHeader = doc.querySelector('OrderRequestHeader');
    if (!orderHeader) return { ok: false, error: 'No OrderRequestHeader element found — not a PO cXML.' };

    var orderId    = orderHeader.getAttribute('orderID') || '';
    var orderDate  = orderHeader.getAttribute('orderDate') || '';
    var orderType  = orderHeader.getAttribute('type') || 'new';
    var currency   = attr('Total Money', 'currency');
    var totalAmt   = text('Total Money');
    var shipToName = text('ShipTo Address Name');

    var buyerContact = '', buyerEmail = '';
    doc.querySelectorAll('OrderRequestHeader Contact').forEach(function(c) {
      if (c.getAttribute('role') === 'buyerCorporate') {
        buyerContact = text('Name', c);
        buyerEmail   = text('Email', c);
      }
    });

    var items = [];
    doc.querySelectorAll('ItemOut').forEach(function(item) {
      items.push({
        lineNum:        item.getAttribute('lineNumber') || String(items.length + 1),
        qty:            item.getAttribute('quantity') || '1',
        supplierPartId: text('ItemID SupplierPartID', item),
        buyerPartId:    text('ItemID BuyerPartID', item),
        desc:           text('ItemDetail Description', item),
        uom:            text('ItemDetail UnitOfMeasure', item),
        unitPrice:      text('ItemDetail UnitPrice Money', item),
        currency:       attr('ItemDetail UnitPrice Money', 'currency', item)
      });
    });

    if (!orderId && !items.length) {
      return { ok: false, error: 'Could not parse PO fields — verify this is an OrderRequest.' };
    }

    return {
      ok: true,
      orderId:     orderId,
      orderDate:   orderDate,
      orderType:   orderType,
      currency:    currency,
      totalAmount: totalAmt,
      buyerAnid:   buyerAnid,
      supplierAnid: supplierAnid,
      shipToName:  shipToName,
      buyerContact: buyerContact,
      buyerEmail:  buyerEmail,
      lineCount:   items.length,
      items:       items,
      rawXml:      xmlString
    };
  }

  var SANITIZE_RULES = [
    { id: 'r01', label: 'payloadID → #PAYLOADID#',                skipReason: 'no payloadID attribute' },
    { id: 'r02', label: 'deploymentMode → test',                  skipReason: 'not set to production' },
    { id: 'r03', label: 'From/Identity → #SENDERID#',             skipReason: 'no From/Identity element' },
    { id: 'r04', label: 'To/Identity → #RECEIVERID#',             skipReason: 'no To/Identity element' },
    { id: 'r05', label: 'Sender/Identity → #PROVIDERID#',         skipReason: 'no Sender/Identity element' },
    { id: 'r06', label: 'orderDate → #DATETIME#',                 skipReason: 'no orderDate attribute' },
    { id: 'r07', label: 'orderID → #DOCUMENTID#',                 skipReason: 'no orderID attribute' },
    { id: 'r08', label: 'agreementID → #DOCUMENTID#',             skipReason: 'blanket PO only — not present' },
    { id: 'r09', label: 'agreementPayloadID → #PAYLOADID#',       skipReason: 'blanket PO only — not present' },
    { id: 'r10', label: 'requestedDeliveryDate year → +100',      skipReason: 'no requestedDeliveryDate attribute' },
    { id: 'r11', label: 'effectiveDate → prior to today',         skipReason: 'blanket/service PO only — not present' },
    { id: 'r12', label: 'expirationDate year → +100',             skipReason: 'blanket/service PO only — not present' },
    { id: 'r13', label: 'ShipFrom address → test (PA, US 15212)', skipReason: 'no ShipFrom element' },
    { id: 'r14', label: 'RemitTo address → test (PA, US 15212)',  skipReason: 'no RemitTo element' },
    { id: 'r15', label: 'ServicePeriod startDate → #DATETIME#',   skipReason: 'service PO only — not present' },
    { id: 'r16', label: 'ServicePeriod endDate → #DATETIME#',     skipReason: 'service PO only — not present' }
  ];

  global.CXMLParser = { parse: parseCXML, sanitize: sanitizeCXML, SANITIZE_RULES: SANITIZE_RULES };

  /* ── cXML Sanitizer — replaces real buyer/supplier data with test tokens ── */
  function sanitizeCXML(xmlString) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlString.trim(), 'text/xml');
    if (doc.querySelector('parsererror')) return { ok: false, xml: xmlString, changes: [], count: 0, firedIds: [] };

    var changes  = [];
    var firedIds = [];
    function fire(id, label) { firedIds.push(id); changes.push(label); }

    var now     = new Date();
    var futureY = now.getFullYear() + 100;
    var pastISO = new Date(now.getTime() - 86400000).toISOString().slice(0,19) + '-00:00';
    function bumpYear(s) { return s ? s.replace(/^\d{4}/, String(futureY)) : s; }

    var root = doc.documentElement;

    /* r01 — payloadID */
    if (root.hasAttribute('payloadID')) { root.setAttribute('payloadID', '#PAYLOADID#'); fire('r01', 'payloadID → #PAYLOADID#'); }

    /* r02 — deploymentMode */
    if (root.getAttribute('deploymentMode') === 'production') { root.setAttribute('deploymentMode', 'test'); fire('r02', 'deploymentMode → test'); }

    /* r03 — From/Identity */
    var fromId = doc.querySelector('Header > From > Credential > Identity');
    if (fromId) { fromId.textContent = '#SENDERID#'; fire('r03', 'From/Identity → #SENDERID#'); }

    /* r04 — To/Identity */
    var toId = doc.querySelector('Header > To > Credential > Identity');
    if (toId) { toId.textContent = '#RECEIVERID#'; fire('r04', 'To/Identity → #RECEIVERID#'); }

    /* r05 — Sender/Identity */
    var sndId = doc.querySelector('Header > Sender > Credential > Identity');
    if (sndId) { sndId.textContent = '#PROVIDERID#'; fire('r05', 'Sender/Identity → #PROVIDERID#'); }

    /* r06-r12 — OrderRequestHeader */
    var orh = doc.querySelector('OrderRequestHeader');
    if (orh) {
      if (orh.hasAttribute('orderDate'))         { orh.setAttribute('orderDate', '#DATETIME#'); fire('r06', 'orderDate → #DATETIME#'); }
      if (orh.hasAttribute('orderID'))           { orh.setAttribute('orderID', '#DOCUMENTID#'); fire('r07', 'orderID → #DOCUMENTID#'); }
      if (orh.hasAttribute('agreementID'))       { orh.setAttribute('agreementID', '#DOCUMENTID#'); fire('r08', 'agreementID → #DOCUMENTID#'); }
      if (orh.hasAttribute('agreementPayloadID')){ orh.setAttribute('agreementPayloadID', '#PAYLOADID#'); fire('r09', 'agreementPayloadID → #PAYLOADID#'); }
      var rdd = orh.getAttribute('requestedDeliveryDate');
      if (rdd) { orh.setAttribute('requestedDeliveryDate', bumpYear(rdd)); fire('r10', 'requestedDeliveryDate year → +100'); }
      var eff = orh.getAttribute('effectiveDate');
      if (eff) { orh.setAttribute('effectiveDate', pastISO); fire('r11', 'effectiveDate → prior to today'); }
      var exp = orh.getAttribute('expirationDate');
      if (exp) { orh.setAttribute('expirationDate', bumpYear(exp)); fire('r12', 'expirationDate year → +100'); }
    }

    /* r13 — ShipFrom address */
    var hasShipFrom = false;
    doc.querySelectorAll('ShipFrom').forEach(function(block) {
      hasShipFrom = true;
      var n = block.querySelector('PostalAddress > Name') || block.querySelector('Name');
      if (n) n.textContent = 'Supplier Name';
      block.querySelectorAll('Street').forEach(function(s, i) { s.textContent = i === 0 ? 'Supplier Address' : ''; });
      var city = block.querySelector('City'); if (city) city.textContent = '';
      var st   = block.querySelector('State'); if (st) st.textContent = 'PA';
      var zip  = block.querySelector('PostalCode'); if (zip) zip.textContent = '15212';
      var ctry = block.querySelector('Country');
      if (ctry) { ctry.textContent = 'US'; ctry.setAttribute('isoCountryCode', 'US'); }
    });
    if (hasShipFrom) fire('r13', 'ShipFrom address → test (PA, US 15212)');

    /* r14 — RemitTo address */
    var hasRemitTo = false;
    doc.querySelectorAll('RemitTo').forEach(function(block) {
      hasRemitTo = true;
      var n = block.querySelector('PostalAddress > Name') || block.querySelector('Name');
      if (n) n.textContent = 'Supplier Name';
      block.querySelectorAll('Street').forEach(function(s, i) { s.textContent = i === 0 ? 'Supplier Address' : ''; });
      var city = block.querySelector('City'); if (city) city.textContent = '';
      var st   = block.querySelector('State'); if (st) st.textContent = 'PA';
      var zip  = block.querySelector('PostalCode'); if (zip) zip.textContent = '15212';
      var ctry = block.querySelector('Country');
      if (ctry) { ctry.textContent = 'US'; ctry.setAttribute('isoCountryCode', 'US'); }
    });
    if (hasRemitTo) fire('r14', 'RemitTo address → test (PA, US 15212)');

    /* r15/r16 — ServicePeriod dates */
    var hasSpStart = false, hasSpEnd = false;
    doc.querySelectorAll('Extrinsic[name="ServicePeriod"] Period').forEach(function(p) {
      if (p.hasAttribute('startDate')) { p.setAttribute('startDate', '#DATETIME#'); hasSpStart = true; }
      if (p.hasAttribute('endDate'))   { p.setAttribute('endDate',   '#DATETIME#'); hasSpEnd   = true; }
    });
    if (hasSpStart) fire('r15', 'ServicePeriod startDate → #DATETIME#');
    if (hasSpEnd)   fire('r16', 'ServicePeriod endDate → #DATETIME#');

    return {
      ok:       true,
      xml:      new XMLSerializer().serializeToString(doc),
      changes:  changes,
      count:    changes.length,
      firedIds: firedIds
    };
  }

}(typeof globalThis !== 'undefined' ? globalThis : self));
