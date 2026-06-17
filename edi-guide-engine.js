/**
 * EDI Guide Engine — Strict 1:1 Conversion (NO masking, NO modification)
 * 
 * Supports input: cXML or EDI X12
 * Output: Always EDI X12 (preserving ALL segments, qualifiers, values exactly)
 * 
 * Document types supported:
 *   po   = Purchase Order (850)
 *   poc  = Purchase Order Change (860)
 *   oc   = Order Confirmation (855)
 *   asn  = Advance Ship Notice (856)
 *   gr   = Goods Receipt (861)
 *   inv  = Invoice (810)
 */
var EdiGuideEngine = (function() {
  'use strict';

  /* ===== CONSTANTS ===== */
  var DOC_TYPES = {
    po:  { code: '850', gsCode: 'PO', label: 'Purchase Order', begPurpose: '00', begType: 'NE' },
    poc: { code: '860', gsCode: 'PO', label: 'Purchase Order Change', begPurpose: '04', begType: 'NE' },
    oc:  { code: '855', gsCode: 'PR', label: 'Order Confirmation', bakPurpose: '06' },
    asn: { code: '856', gsCode: 'SH', label: 'Advance Ship Notice' },
    gr:  { code: '861', gsCode: 'RC', label: 'Goods Receipt' },
    inv: { code: '810', gsCode: 'IN', label: 'Invoice' }
  };

  /* Standard EDI segment descriptions for the guide */
  var SEGMENT_DESCRIPTIONS = {
    'ISA': 'Interchange Control Header — identifies sender, receiver, date/time, control number, usage indicator',
    'GS':  'Functional Group Header — transaction type, sender/receiver app codes, date/time, group control number',
    'ST':  'Transaction Set Header — identifies the transaction type (850/855/856/860/861/810) and control number',
    'BEG': 'Beginning Segment for PO — purpose code, PO type code, PO number, release number, date',
    'BCH': 'Beginning Segment for PO Change — purpose code, PO type, PO number, release, date, change request date',
    'BAK': 'Beginning Segment for PO Acknowledgment — purpose code, order number, date, request reference number',
    'BSN': 'Beginning Segment for Ship Notice — purpose code, shipment ID, date, time',
    'BIG': 'Beginning Segment for Invoice — invoice date, invoice number, PO date, PO number',
    'BTI': 'Beginning Tax Information — receipt type, date, time',
    'CUR': 'Currency — entity code, currency code',
    'REF': 'Reference Identification (REF) — Provides additional reference numbers for the document. REF01: Reference ID qualifier. REF02: Reference identification value. REF03: Description (optional).',
    'PER': 'Administrative Communications Contact — qualifier, name, phone/email qualifiers and numbers',
    'TAX': 'Tax Reference — qualifier, jurisdiction, tax ID',
    'FOB': 'Free On Board — shipping terms code, location qualifier, description',
    'ITD': 'Terms of Sale/Deferred Terms — type, discount basis, discount percent, due days, net days, description',
    'DTM': 'Date/Time Reference — qualifier (002=Delivery, 010=Requested Ship, etc.) + date value',
    'SAC': 'Service/Allowance/Charge — indicator (A=Allowance, C=Charge), code, amount, description',
    'TD5': 'Carrier Details — routing sequence, ID qualifier, carrier ID, transport method, routing',
    'TD3': 'Carrier Equipment Detail — equipment type, number',
    'TD4': 'Carrier Special Handling — special handling code, description',
    'N9':  'Reference Identification — qualifier + free-form text reference (MSG=message, ZZ=mutually defined)',
    'MSG': 'Message Text — free-form message continuation of N9',
    'N1':  'Party Identification — entity code (ST=ShipTo, BT=BillTo, SE=Selling Party, VN=Vendor, SF=ShipFrom, RE=RemitTo), name, ID qualifier, ID',
    'N2':  'Additional Name Information — name continuation',
    'N3':  'Party Location — street address line(s)',
    'N4':  'Geographic Location — city, state, postal code, country',
    'PO1': 'Purchase Order Line Item — line#, quantity, UOM, unit price, basis, product ID qualifier, product ID',
    'POC': 'Line Item Change — change code, line#, quantity, UOM, unit price, product IDs',
    'PID': 'Product/Item Description — item description type (F=free-form), description text',
    'IT1': 'Invoice Line Item — line#, quantity invoiced, UOM, unit price, basis, product ID qualifier, product ID',
    'SLN': 'Subline Item Detail — sub-item number, relationship code, quantity, UOM, unit price',
    'CTP': 'Pricing Information — class code, qualifier, unit price, quantity, UOM',
    'CTT': 'Transaction Totals — number of line items, hash total',
    'AMT': 'Monetary Amount — qualifier (TT=Total), amount',
    'TDS': 'Total Monetary Value Summary — total invoice amount (in cents for 810)',
    'HL':  'Hierarchical Level — HL ID, parent HL ID, level code (S=Shipment, O=Order, I=Item)',
    'LIN': 'Item Identification — line number, product ID qualifier (VP=Vendor Part, BP=Buyer Part, UP=UPC), ID',
    'SN1': 'Item Detail (Shipment) — line number, quantity shipped, UOM',
    'MAN': 'Marks and Numbers — qualifier (GM=SSCC18, CP=Carrier Pro Number), value',
    'SE':  'Transaction Set Trailer — segment count, transaction control number',
    'GE':  'Functional Group Trailer — number of transaction sets, group control number',
    'IEA': 'Interchange Control Trailer — number of functional groups, interchange control number'
  };

  /* Element-level descriptions per segment (position → description) */
  var ELEMENT_DESCRIPTIONS = {
    'ISA': ['Segment ID', 'Authorization Qualifier', 'Authorization Info', 'Security Qualifier', 'Security Info', 'Interchange Sender Qualifier', 'Interchange Sender ID', 'Interchange Receiver Qualifier', 'Interchange Receiver ID', 'Interchange Date (YYMMDD)', 'Interchange Time (HHMM)', 'Repetition Separator', 'Interchange Control Version', 'Interchange Control Number', 'Acknowledgment Requested', 'Usage Indicator (P=Production, T=Test)', 'Component Element Separator'],
    'GS':  ['Segment ID', 'Functional ID Code', 'Application Sender Code', 'Application Receiver Code', 'Date (CCYYMMDD)', 'Time (HHMM)', 'Group Control Number', 'Responsible Agency Code', 'Version/Release/Industry ID'],
    'ST':  ['Segment ID', 'Transaction Set ID Code', 'Transaction Set Control Number'],
    'BEG': ['Segment ID', 'Transaction Set Purpose (00=Original, 01=Cancel, 04=Change, 05=Replace)', 'PO Type Code (NE=New, RL=Release, SA=Stand-alone)', 'Purchase Order Number', 'Release Number', 'Date (CCYYMMDD)'],
    'BCH': ['Segment ID', 'Transaction Set Purpose (04=Change)', 'PO Type Code', 'PO Number', 'Release Number', 'Change Request Date', '', 'PO Date'],
    'BAK': ['Segment ID', 'Purpose Code (06=Confirm)', 'Acknowledgment Type (AC=Accept, AD=Accept w/Change, RJ=Reject)', 'PO Number', 'Date'],
    'BSN': ['Segment ID', 'Purpose Code (00=Original)', 'Shipment ID', 'Date (CCYYMMDD)', 'Time (HHMM)'],
    'BIG': ['Segment ID', 'Invoice Date', 'Invoice Number', 'PO Date', 'PO Number', '', '', '', 'Transaction Type Code'],
    'CUR': ['Segment ID', 'Entity ID Code (BY=Buyer, SE=Seller)', 'Currency Code (ISO 4217)'],
    'REF': ['Segment ID', 'Reference ID Qualifier', 'Reference Identification', 'Description'],
    'PER': ['Segment ID', 'Contact Function Code (BD=Buyer, CN=General Contact)', 'Name', 'Comm Number Qualifier 1 (TE=Phone, EM=Email)', 'Comm Number 1', 'Comm Number Qualifier 2', 'Comm Number 2'],
    'N1':  ['Segment ID', 'Entity Identifier Code (ST=ShipTo, BT=BillTo, VN=Vendor, SE=Selling Party, SF=ShipFrom)', 'Name', 'Identification Code Qualifier (92=Assigned by Buyer, 9=DUNS)', 'Identification Code'],
    'N3':  ['Segment ID', 'Address Line 1', 'Address Line 2'],
    'N4':  ['Segment ID', 'City', 'State/Province', 'Postal Code', 'Country Code'],
    'PO1': ['Segment ID', 'Line Number', 'Quantity Ordered', 'Unit of Measure', 'Unit Price', 'Basis of Unit Price', 'Product/Service ID Qualifier', 'Product/Service ID', 'Product/Service ID Qualifier 2', 'Product/Service ID 2'],
    'POC': ['Segment ID', 'Change Code (AI=Add, CA=Cancel, DI=Delete, QI=Qty Increase, QD=Qty Decrease, PC=Price Change)', 'Line Number', 'Quantity', 'UOM', 'Unit Price', 'Basis', 'Product Qualifier', 'Product ID'],
    'IT1': ['Segment ID', 'Line Number', 'Quantity Invoiced', 'Unit of Measure', 'Unit Price', 'Basis of Unit Price', 'Product/Service ID Qualifier', 'Product/Service ID'],
    'PID': ['Segment ID', 'Item Description Type (F=Free-form, S=Structured)', 'Product/Process Characteristic Code', 'Agency Qualifier', 'Product Description Code', 'Description'],
    'CTT': ['Segment ID', 'Number of Line Items', 'Hash Total'],
    'AMT': ['Segment ID', 'Amount Qualifier Code (TT=Total Transaction)', 'Monetary Amount'],
    'TDS': ['Segment ID', 'Total Invoice Amount (in cents)'],
    'HL':  ['Segment ID', 'Hierarchical ID Number', 'Hierarchical Parent ID', 'Hierarchical Level Code (S=Shipment, O=Order, I=Item, P=Pack)'],
    'LIN': ['Segment ID', 'Assigned Identification', 'Product/Service ID Qualifier', 'Product/Service ID'],
    'SN1': ['Segment ID', 'Assigned Identification', 'Number of Units Shipped', 'Unit of Measure'],
    'MAN': ['Segment ID', 'Marks and Numbers Qualifier', 'Marks and Numbers'],
    'DTM': ['Segment ID', 'Date/Time Qualifier (002=Delivery Requested, 010=Requested Ship, 017=Estimated Delivery, 037=Ship Not Before, 038=Ship Not After, 063=Invoice Due)', 'Date (CCYYMMDD)'],
    'ITD': ['Segment ID', 'Terms Type Code', 'Terms Basis Date Code', 'Discount Percent', 'Terms Discount Due Date', 'Terms Discount Days Due', 'Terms Net Due Date', 'Terms Net Days', '', '', '', '', 'Description'],
    'FOB': ['Segment ID', 'Shipment Method of Payment (PP=Prepaid, CC=Collect, DF=Defined by Buyer/Seller)', 'Location Qualifier', 'Description'],
    'SAC': ['Segment ID', 'Allowance/Charge Indicator (A=Allowance, C=Charge)', 'Service/Promotion/Allowance Code', '', '', 'Amount', '', '', '', '', '', '', 'Description'],
    'TD5': ['Segment ID', 'Routing Sequence Code', 'ID Code Qualifier', 'Identification Code', 'Transportation Method/Type Code', 'Routing'],
    'SE':  ['Segment ID', 'Number of Included Segments', 'Transaction Set Control Number'],
    'GE':  ['Segment ID', 'Number of Transaction Sets Included', 'Group Control Number'],
    'IEA': ['Segment ID', 'Number of Included Functional Groups', 'Interchange Control Number']
  };

  /* ===== STRICT EDI PARSER (preserves everything) ===== */
  function parseEdi(ediText) {
    if (!ediText || typeof ediText !== 'string') return { segments: [], raw: '', elemSep: '*', segSep: '~' };

    var raw = ediText;
    var segSep = '~';
    // Auto-detect segment separator
    if (ediText.indexOf('~') < 0 && ediText.indexOf('\n') > 0) segSep = '\n';

    var lines = ediText.split(segSep).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
    var elemSep = '*';
    // Detect element separator from ISA
    if (lines.length > 0 && lines[0].substring(0, 3).toUpperCase() === 'ISA' && lines[0].length > 3) {
      elemSep = lines[0].charAt(3);
    }

    var segments = [];
    lines.forEach(function(line) {
      var parts = line.split(elemSep);
      // Uppercase segment ID per X12 standard, but preserve ALL element values exactly
      var segId = parts[0].toUpperCase();
      segments.push({
        id: segId,
        elements: parts,       // Original elements including segId at [0]
        rawLine: line          // Original raw line (byte-for-byte)
      });
    });

    return { segments: segments, raw: raw, elemSep: elemSep, segSep: segSep };
  }

  /* ===== STRICT cXML → EDI CONVERTER (NO masking, NO modification) ===== */
  function convertCxmlToEdi(docType, cxmlText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(cxmlText, 'text/xml');

    /* Utility: extract text content exactly as-is */
    function getText(el, tag) {
      if (!el) return '';
      var found = el.getElementsByTagName(tag);
      return found.length > 0 ? (found[0].textContent || '') : '';
    }
    function getAttr(el, tag, attr) {
      if (!el) return '';
      var found = el.getElementsByTagName(tag);
      return found.length > 0 ? (found[0].getAttribute(attr) || '') : '';
    }
    function getDirectAttr(el, attr) { return el ? (el.getAttribute(attr) || '') : ''; }
    function getAllByTag(el, tag) { return el ? Array.prototype.slice.call(el.getElementsByTagName(tag)) : []; }
    function getFirstByTag(el, tag) { var a = el.getElementsByTagName(tag); return a.length > 0 ? a[0] : null; }
    function pad(s, n) { s = s || ''; while (s.length < n) s += ' '; return s.substring(0, n); }
    function dateOnly(isoStr) { return (isoStr || '').replace(/[^0-9]/g, '').substring(0, 8); }
    function timeOnly(isoStr) {
      if (!isoStr) return '0000';
      var m = isoStr.match(/(\d{2}):(\d{2})/);
      return m ? m[1] + m[2] : '0000';
    }

    /* Extract envelope — NO substitution */
    var cxmlRoot = doc.getElementsByTagName('cXML')[0];
    var fromEl = getFirstByTag(doc, 'From');
    var toEl = getFirstByTag(doc, 'To');
    var senderEl = getFirstByTag(doc, 'Sender');

    var fromId = '', toId = '', sharedSecret = '';
    if (fromEl) {
      var fromCreds = getAllByTag(fromEl, 'Credential');
      for (var i = 0; i < fromCreds.length; i++) {
        if (fromCreds[i].getAttribute('domain') === 'NetworkID') fromId = getText(fromCreds[i], 'Identity');
      }
    }
    if (toEl) {
      var toCreds = getAllByTag(toEl, 'Credential');
      for (var j = 0; j < toCreds.length; j++) {
        if (toCreds[j].getAttribute('domain') === 'NetworkID') toId = getText(toCreds[j], 'Identity');
      }
    }
    if (senderEl) {
      sharedSecret = getText(senderEl, 'SharedSecret'); // NO masking — preserve exactly
    }
    fromId = fromId || '';
    toId = toId || '';

    var payloadID = cxmlRoot ? (cxmlRoot.getAttribute('payloadID') || '') : '';
    var timestamp = cxmlRoot ? (cxmlRoot.getAttribute('timestamp') || '') : '';

    var requestEl = getFirstByTag(doc, 'Request');
    var deployMode = requestEl ? (requestEl.getAttribute('deploymentMode') || 'production') : 'production';
    var isa15 = (deployMode === 'test') ? 'T' : 'P';

    var tsDate = dateOnly(timestamp);
    var yymmdd = tsDate.length >= 8 ? tsDate.substring(2, 8) : tsDate;
    var ccyymmdd = tsDate.length >= 8 ? tsDate : '';
    var hhmm = timeOnly(timestamp);
    var ctrl = '000000001';

    var dtConf = DOC_TYPES[docType] || DOC_TYPES.po;
    var stCode = dtConf.code;
    var gsCode = dtConf.gsCode;

    var segs = [];

    /* ISA */
    segs.push('ISA*00*          *00*          *ZZ*' + pad(fromId, 15) + '*ZZ*' + pad(toId, 15) + '*' + yymmdd + '*' + hhmm + '*U*00401*' + ctrl + '*0*' + isa15 + '*>');
    /* GS */
    segs.push('GS*' + gsCode + '*' + fromId + '*' + toId + '*' + ccyymmdd + '*' + hhmm + '*1*X*004010');
    /* ST */
    segs.push('ST*' + stCode + '*0001');

    /* Document-specific body */
    if (docType === 'po') segs = segs.concat(buildPO850(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));
    else if (docType === 'poc') segs = segs.concat(buildPOC860(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));
    else if (docType === 'oc') segs = segs.concat(buildOC855(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));
    else if (docType === 'asn') segs = segs.concat(buildASN856(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));
    else if (docType === 'gr') segs = segs.concat(buildGR861(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));
    else if (docType === 'inv') segs = segs.concat(buildINV810(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly));

    /* Trailer */
    var segCount = segs.length - 2 + 1; // segments between ST and SE inclusive
    segs.push('SE*' + segCount + '*0001');
    segs.push('GE*1*1');
    segs.push('IEA*1*' + ctrl);

    return segs.join('~\n') + '~';
  }

  /* ===== PO 850 Builder (strict, from cXML) ===== */
  function buildPO850(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    var orderHeader = getFirstByTag(doc, 'OrderRequestHeader');
    if (!orderHeader) return segs;

    var orderId = getDirectAttr(orderHeader, 'orderID') || '';
    var orderDate = dateOnly(getDirectAttr(orderHeader, 'orderDate'));

    segs.push('BEG*00*NE*' + orderId + '**' + orderDate);

    // CUR
    var totalMoney = getFirstByTag(orderHeader, 'Money');
    var currency = totalMoney ? (getDirectAttr(totalMoney, 'currency') || 'USD') : 'USD';
    segs.push('CUR*BY*' + currency);

    // REF segments — preserve ALL Extrinsic values exactly
    var extrinsics = getAllByTag(orderHeader, 'Extrinsic');
    extrinsics.forEach(function(ext) {
      var name = getDirectAttr(ext, 'name') || '';
      var value = (ext.textContent || '').trim();
      if (name && value) segs.push('REF*ZZ*' + value + '*' + name);
    });

    // PER (contact)
    var contacts = getAllByTag(orderHeader, 'Contact');
    contacts.forEach(function(contact) {
      var role = getDirectAttr(contact, 'role') || '';
      var name = getText(contact, 'Name') || '';
      var phone = getText(contact, 'Number') || '';
      var email = getText(contact, 'Email') || '';
      var perParts = ['PER', role === 'buyer' ? 'BD' : 'CN', name];
      if (phone) { perParts.push('TE'); perParts.push(phone); }
      if (email) { perParts.push('EM'); perParts.push(email); }
      segs.push(perParts.join('*'));
    });

    // ITD (payment terms)
    var paymentTerm = getFirstByTag(orderHeader, 'PaymentTerm');
    if (paymentTerm) {
      var days = getDirectAttr(paymentTerm, 'payInNumberOfDays') || '';
      var discount = getAttr(paymentTerm, 'Discount', 'percent') || '';
      segs.push('ITD*01*3*' + discount + '***' + days + '***' + days + '***');
    }

    // DTM (dates)
    var shipControl = getFirstByTag(orderHeader, 'ShipControl');
    if (shipControl) {
      var reqDate = getAttr(shipControl, 'RequestedDeliveryDate', 'date') || '';
      if (reqDate) segs.push('DTM*002*' + dateOnly(reqDate));
    }

    // N1 loops — ShipTo, BillTo, etc.
    var shipTo = getFirstByTag(orderHeader, 'ShipTo');
    if (shipTo) segs = segs.concat(buildN1FromAddress(shipTo, 'ST', getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag));
    var billTo = getFirstByTag(orderHeader, 'BillTo');
    if (billTo) segs = segs.concat(buildN1FromAddress(billTo, 'BT', getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag));

    // PO1 line items
    var items = getAllByTag(doc, 'ItemOut');
    items.forEach(function(item, idx) {
      var lineNum = getDirectAttr(item, 'lineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getAttr(item, 'UnitOfMeasure', '') || getText(item, 'UnitOfMeasure') || 'EA';
      var unitPrice = getAttr(item, 'Money', '') || getText(item, 'UnitPrice') || '';
      // Try to get from UnitPrice/Money
      var upEl = getFirstByTag(item, 'UnitPrice');
      if (upEl) unitPrice = getText(upEl, 'Money') || unitPrice;

      // Product IDs — preserve ALL qualifiers exactly
      var itemId = getFirstByTag(item, 'ItemID');
      var supPartId = itemId ? getText(itemId, 'SupplierPartID') : '';
      var buyPartId = itemId ? getText(itemId, 'BuyerPartID') : '';

      var po1Parts = ['PO1', lineNum, qty, uom, unitPrice, 'PE'];
      if (supPartId) { po1Parts.push('VP'); po1Parts.push(supPartId); }
      if (buyPartId) { po1Parts.push('BP'); po1Parts.push(buyPartId); }
      segs.push(po1Parts.join('*'));

      // PID (description)
      var desc = getText(item, 'Description') || '';
      if (desc) segs.push('PID*F****' + desc);
    });

    // CTT + AMT
    segs.push('CTT*' + items.length);
    var totalAmt = totalMoney ? (totalMoney.textContent || '0') : '0';
    segs.push('AMT*TT*' + totalAmt);

    return segs;
  }

  /* ===== POC 860 Builder (PO Change, strict from cXML) ===== */
  function buildPOC860(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    // PO Change uses OrderRequestHeader with type="update" or ChangeOrderHeader
    var header = getFirstByTag(doc, 'OrderRequestHeader') || getFirstByTag(doc, 'ChangeOrderHeader');
    if (!header) return segs;

    var orderId = getDirectAttr(header, 'orderID') || '';
    var orderDate = dateOnly(getDirectAttr(header, 'orderDate'));

    // BCH for PO Change
    segs.push('BCH*04*NE*' + orderId + '***' + orderDate);

    // CUR
    var totalMoney = getFirstByTag(header, 'Money');
    var currency = totalMoney ? (getDirectAttr(totalMoney, 'currency') || 'USD') : 'USD';
    segs.push('CUR*BY*' + currency);

    // REF segments
    var extrinsics = getAllByTag(header, 'Extrinsic');
    extrinsics.forEach(function(ext) {
      var name = getDirectAttr(ext, 'name') || '';
      var value = (ext.textContent || '').trim();
      if (name && value) segs.push('REF*ZZ*' + value + '*' + name);
    });

    // N1 loops
    var shipTo = getFirstByTag(header, 'ShipTo');
    if (shipTo) segs = segs.concat(buildN1FromAddress(shipTo, 'ST', getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag));
    var billTo = getFirstByTag(header, 'BillTo');
    if (billTo) segs = segs.concat(buildN1FromAddress(billTo, 'BT', getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag));

    // POC line items (change items)
    var items = getAllByTag(doc, 'ItemOut');
    items.forEach(function(item, idx) {
      var lineNum = getDirectAttr(item, 'lineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getAttr(item, 'UnitOfMeasure', '') || getText(item, 'UnitOfMeasure') || 'EA';
      var upEl = getFirstByTag(item, 'UnitPrice');
      var unitPrice = upEl ? getText(upEl, 'Money') : '';

      var itemId = getFirstByTag(item, 'ItemID');
      var supPartId = itemId ? getText(itemId, 'SupplierPartID') : '';

      // Determine change code from item attributes
      var changeCode = 'AI'; // default Add Item
      var itemType = getDirectAttr(item, 'type') || '';
      if (itemType === 'delete') changeCode = 'DI';
      else if (itemType === 'update') changeCode = 'CA';

      var pocParts = ['POC', changeCode, lineNum, qty, uom, unitPrice, 'PE'];
      if (supPartId) { pocParts.push('VP'); pocParts.push(supPartId); }
      segs.push(pocParts.join('*'));

      var desc = getText(item, 'Description') || '';
      if (desc) segs.push('PID*F****' + desc);
    });

    segs.push('CTT*' + items.length);

    return segs;
  }

  /* ===== OC 855 Builder (Order Confirmation, strict from cXML) ===== */
  function buildOC855(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    var confHeader = getFirstByTag(doc, 'ConfirmationHeader') || getFirstByTag(doc, 'OrderRequestHeader');
    if (!confHeader) return segs;

    var orderId = getDirectAttr(confHeader, 'orderID') || '';
    var confDate = dateOnly(getDirectAttr(confHeader, 'noticeDate') || getDirectAttr(confHeader, 'orderDate'));

    segs.push('BAK*06*AC*' + orderId + '*' + confDate);

    // REF
    var extrinsics = getAllByTag(confHeader, 'Extrinsic');
    extrinsics.forEach(function(ext) {
      var name = getDirectAttr(ext, 'name') || '';
      var value = (ext.textContent || '').trim();
      if (name && value) segs.push('REF*ZZ*' + value + '*' + name);
    });

    // Line items
    var items = getAllByTag(doc, 'ConfirmationItem') || getAllByTag(doc, 'ItemIn');
    if (items.length === 0) items = getAllByTag(doc, 'ItemOut');
    items.forEach(function(item, idx) {
      var lineNum = getDirectAttr(item, 'lineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getText(item, 'UnitOfMeasure') || 'EA';
      var upEl = getFirstByTag(item, 'UnitPrice');
      var unitPrice = upEl ? getText(upEl, 'Money') : '';
      segs.push('PO1*' + lineNum + '*' + qty + '*' + uom + '*' + unitPrice + '*PE');
    });

    segs.push('CTT*' + items.length);
    return segs;
  }

  /* ===== ASN 856 Builder (strict from cXML) ===== */
  function buildASN856(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    var shipHeader = getFirstByTag(doc, 'ShipNoticeHeader');
    if (!shipHeader) return segs;

    var shipmentId = getDirectAttr(shipHeader, 'shipmentID') || '';
    var shipDate = dateOnly(getDirectAttr(shipHeader, 'noticeDate') || getDirectAttr(shipHeader, 'shipmentDate'));
    var shipTime = timeOnly(getDirectAttr(shipHeader, 'noticeDate') || getDirectAttr(shipHeader, 'shipmentDate'));

    segs.push('BSN*00*' + shipmentId + '*' + shipDate + '*' + shipTime);

    // HL Shipment level
    var hlId = 1;
    segs.push('HL*' + hlId + '**S');

    // TD5 carrier
    var carrier = getFirstByTag(shipHeader, 'CarrierIdentifier');
    var carrierName = getText(shipHeader, 'CarrierIdentifier') || '';
    if (carrierName) segs.push('TD5**2*' + carrierName + '**');

    // DTM ship date
    if (shipDate) segs.push('DTM*011*' + shipDate);

    // N1 ShipFrom
    var shipFrom = getFirstByTag(shipHeader, 'ShipFrom');
    if (shipFrom) segs = segs.concat(buildN1FromAddress(shipFrom, 'SF', getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag));

    // HL Order level
    var shipNoticeItems = getAllByTag(doc, 'ShipNoticeItem') || getAllByTag(doc, 'ShipNoticePortion');
    if (shipNoticeItems.length === 0) shipNoticeItems = getAllByTag(doc, 'ItemOut');

    // Group by order
    hlId++;
    segs.push('HL*' + hlId + '*1*O');
    var ordRef = getFirstByTag(doc, 'OrderReference');
    if (ordRef) {
      var prfPO = getDirectAttr(ordRef, 'orderID') || '';
      if (prfPO) segs.push('PRF*' + prfPO);
    }

    // HL Item levels
    shipNoticeItems.forEach(function(item, idx) {
      hlId++;
      segs.push('HL*' + hlId + '*2*I');
      var lineNum = getDirectAttr(item, 'lineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getText(item, 'UnitOfMeasure') || 'EA';
      segs.push('SN1*' + lineNum + '*' + qty + '*' + uom);

      var itemId = getFirstByTag(item, 'ItemID');
      var supPartId = itemId ? getText(itemId, 'SupplierPartID') : '';
      var buyPartId = itemId ? getText(itemId, 'BuyerPartID') : '';
      if (supPartId || buyPartId) {
        var linParts = ['LIN', lineNum];
        if (supPartId) { linParts.push('VP'); linParts.push(supPartId); }
        if (buyPartId) { linParts.push('BP'); linParts.push(buyPartId); }
        segs.push(linParts.join('*'));
      }
    });

    segs.push('CTT*' + shipNoticeItems.length);
    return segs;
  }

  /* ===== GR 861 Builder (Goods Receipt, strict from cXML) ===== */
  function buildGR861(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    var recHeader = getFirstByTag(doc, 'ReceiptRequestHeader') || getFirstByTag(doc, 'ShipNoticeHeader');
    if (!recHeader) return segs;

    var receiptDate = dateOnly(getDirectAttr(recHeader, 'receiptDate') || getDirectAttr(recHeader, 'noticeDate'));
    segs.push('BTI*01*' + receiptDate);

    // REF for PO reference
    var ordRef = getFirstByTag(doc, 'OrderReference');
    if (ordRef) {
      var poNum = getDirectAttr(ordRef, 'orderID') || '';
      if (poNum) segs.push('REF*PO*' + poNum);
    }

    // Line items
    var items = getAllByTag(doc, 'ReceiptItem') || getAllByTag(doc, 'ShipNoticeItem') || getAllByTag(doc, 'ItemOut');
    items.forEach(function(item, idx) {
      var lineNum = getDirectAttr(item, 'lineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getText(item, 'UnitOfMeasure') || 'EA';
      segs.push('RCD*' + lineNum + '*' + qty + '*' + uom);
    });

    segs.push('CTT*' + items.length);
    return segs;
  }

  /* ===== INV 810 Builder (Invoice, strict from cXML) ===== */
  function buildINV810(doc, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag, dateOnly) {
    var segs = [];
    var invHeader = getFirstByTag(doc, 'InvoiceDetailRequestHeader');
    if (!invHeader) return segs;

    var invId = getDirectAttr(invHeader, 'invoiceID') || '';
    var invDate = dateOnly(getDirectAttr(invHeader, 'invoiceDate'));
    var poRef = getDirectAttr(invHeader, 'purchaseOrderID') || '';
    var poDate = '';

    // Try to find PO date from InvoiceDetailOrder
    var orderInfo = getFirstByTag(doc, 'InvoiceDetailOrder');
    if (orderInfo) {
      var orderRef = getFirstByTag(orderInfo, 'OrderReference');
      if (orderRef) {
        poRef = poRef || getDirectAttr(orderRef, 'orderID') || '';
        poDate = dateOnly(getDirectAttr(orderRef, 'orderDate'));
      }
    }

    segs.push('BIG*' + invDate + '*' + invId + '*' + poDate + '*' + poRef);

    // CUR
    var currency = getAttr(invHeader, 'Money', 'currency') || 'USD';
    segs.push('CUR*SE*' + currency);

    // REF
    var extrinsics = getAllByTag(invHeader, 'Extrinsic');
    extrinsics.forEach(function(ext) {
      var name = getDirectAttr(ext, 'name') || '';
      var value = (ext.textContent || '').trim();
      if (name && value) segs.push('REF*ZZ*' + value + '*' + name);
    });

    // N1 loops
    var parties = getAllByTag(doc, 'InvoicePartner');
    parties.forEach(function(party) {
      var contact = getFirstByTag(party, 'Contact');
      if (!contact) return;
      var role = getDirectAttr(contact, 'role') || '';
      var entityCode = role === 'remitTo' ? 'RE' : (role === 'billTo' ? 'BT' : 'SE');
      var name = getText(contact, 'Name') || '';
      segs.push('N1*' + entityCode + '*' + name);
      var street = getText(contact, 'Street') || '';
      if (street) segs.push('N3*' + street);
      var city = getText(contact, 'City') || '';
      var state = getText(contact, 'State') || '';
      var zip = getText(contact, 'PostalCode') || '';
      var country = getAttr(contact, 'Country', 'isoCountryCode') || '';
      if (city || state) segs.push('N4*' + city + '*' + state + '*' + zip + '*' + country);
    });

    // IT1 line items
    var items = getAllByTag(doc, 'InvoiceDetailItem');
    items.forEach(function(item, idx) {
      var lineNum = getDirectAttr(item, 'invoiceLineNumber') || String(idx + 1);
      var qty = getDirectAttr(item, 'quantity') || '1';
      var uom = getText(item, 'UnitOfMeasure') || 'EA';
      var upEl = getFirstByTag(item, 'UnitPrice');
      var unitPrice = upEl ? getText(upEl, 'Money') : '';
      var itemId = getFirstByTag(item, 'ItemID');
      var supPartId = itemId ? getText(itemId, 'SupplierPartID') : '';

      var it1Parts = ['IT1', lineNum, qty, uom, unitPrice, 'PE'];
      if (supPartId) { it1Parts.push('VP'); it1Parts.push(supPartId); }
      segs.push(it1Parts.join('*'));
    });

    // TDS (total in cents)
    var totalMoney = getFirstByTag(invHeader, 'Money');
    var totalAmt = totalMoney ? (totalMoney.textContent || '0') : '0';
    var totalCents = String(Math.round(parseFloat(totalAmt) * 100));
    segs.push('TDS*' + totalCents);

    segs.push('CTT*' + items.length);
    return segs;
  }

  /* ===== N1 Loop Builder (from cXML Address element) ===== */
  function buildN1FromAddress(addressParent, entityCode, getText, getAttr, getDirectAttr, getAllByTag, getFirstByTag) {
    var segs = [];
    var addrEl = getFirstByTag(addressParent, 'Address') || getFirstByTag(addressParent, 'PostalAddress');
    var name = getText(addressParent, 'Name') || '';
    var addressId = '';
    // Try to get addressID
    if (addressParent.getAttribute) addressId = addressParent.getAttribute('addressID') || '';
    if (!addressId && addrEl) addressId = getDirectAttr(addrEl, 'addressID') || '';

    var n1Parts = ['N1', entityCode, name];
    if (addressId) { n1Parts.push('92'); n1Parts.push(addressId); }
    segs.push(n1Parts.join('*'));

    // N3
    var streets = getAllByTag(addressParent, 'Street');
    if (streets.length > 0) {
      var n3Parts = ['N3'];
      streets.forEach(function(st) { n3Parts.push(st.textContent || ''); });
      segs.push(n3Parts.join('*'));
    }

    // N4
    var city = getText(addressParent, 'City') || '';
    var state = getText(addressParent, 'State') || '';
    var zip = getText(addressParent, 'PostalCode') || '';
    var country = getAttr(addressParent, 'Country', 'isoCountryCode') || '';
    if (city || state || zip) segs.push('N4*' + city + '*' + state + '*' + zip + '*' + country);

    return segs;
  }

  /* ===== GENERATE GUIDE (Excel data rows) ===== */
  // Input: parsed EDI segments
  // Output: array of [raw_segment, explanation] rows for Excel
  function generateGuideRows(parsedEdi) {
    var rows = [];
    var segments = parsedEdi.segments;

    segments.forEach(function(seg) {
      var rawLine = seg.rawLine;
      var segId = seg.id;
      var elements = seg.elements;

      // Build explanation
      var explanation = SEGMENT_DESCRIPTIONS[segId] || 'Segment: ' + segId;

      // Add element-level detail
      var elemDescs = ELEMENT_DESCRIPTIONS[segId];
      if (elemDescs && elements.length > 1) {
        var details = [];
        for (var i = 1; i < elements.length; i++) {
          var val = elements[i];
          if (val === '' || val === undefined) continue;
          var elemDesc = elemDescs[i] || ('Element ' + String(i).padStart(2, '0'));
          details.push(segId + String(i).padStart(2, '0') + '=' + val + ' (' + elemDesc + ')');
        }
        if (details.length > 0) explanation += '\n' + details.join('\n');
      }

      rows.push([rawLine, explanation]);
    });

    return rows;
  }

  /* ===== DETECT INPUT TYPE ===== */
  function detectInputType(content) {
    var trimmed = content.trim();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<cXML') || trimmed.startsWith('<!DOCTYPE cXML')) return 'cxml';
    if (/^ISA[*|~]/.test(trimmed) || /^ISA\*/.test(trimmed)) return 'edi';
    // Check for EDI without ISA (starts with GS or ST)
    if (/^(GS|ST|BEG|BAK|BSN|BIG|BCH)\*/.test(trimmed)) return 'edi';
    // Default: check for XML tags
    if (trimmed.indexOf('<') === 0) return 'cxml';
    return 'edi';
  }

  /* ===== DETECT DOC TYPE FROM CONTENT ===== */
  function detectDocType(content, inputType) {
    if (inputType === 'edi') {
      if (/\bST\*850\b/.test(content)) return 'po';
      if (/\bST\*860\b/.test(content)) return 'poc';
      if (/\bST\*855\b/.test(content)) return 'oc';
      if (/\bST\*856\b/.test(content)) return 'asn';
      if (/\bST\*861\b/.test(content)) return 'gr';
      if (/\bST\*810\b/.test(content)) return 'inv';
      // Fallback by segment presence
      if (/\bBCH\*/.test(content)) return 'poc';
      if (/\bBEG\*/.test(content)) return 'po';
      if (/\bBAK\*/.test(content)) return 'oc';
      if (/\bBSN\*/.test(content)) return 'asn';
      if (/\bBIG\*/.test(content)) return 'inv';
      if (/\bBTI\*/.test(content)) return 'gr';
    } else {
      if (/<OrderRequest/i.test(content)) {
        // Check if it's a change order
        if (/type\s*=\s*["']update["']/i.test(content) || /<ChangeOrder/i.test(content)) return 'poc';
        return 'po';
      }
      if (/<ConfirmationRequest/i.test(content)) return 'oc';
      if (/<ShipNoticeRequest/i.test(content)) return 'asn';
      if (/<ReceiptRequest/i.test(content)) return 'gr';
      if (/<InvoiceDetailRequest/i.test(content)) return 'inv';
    }
    return 'po'; // default
  }

  /* ===== SAP STANDARD GUIDE REFERENCES (Column C) ===== */
  // URL to SAP Help page with all ANSI X12 4010 guides
  var SAP_GUIDE_URL = 'https://help.sap.com/docs/ANSIX12_4010';

  // PDF URLs per doc type (for deep-linking)
  var SAP_GUIDE_PDFS = {
    po:  'https://help.sap.com/doc/sap-business-network-x12-po850-4010-outbound/cloud/en-US/SAP%20Business%20Network%20X12%20PO850%204010%20Outbound.pdf',
    poc: 'https://help.sap.com/doc/sap-business-network-x12-pc860-4010-outbound/cloud/en-US/SAP%20Business%20Network%20X12%20PC860%204010%20Outbound.pdf',
    oc:  'https://help.sap.com/doc/sap-business-network-x12-pr855-4010-inbound/cloud/en-US/SAP%20Business%20Network%20X12%20PR855%204010%20Inbound.pdf',
    asn: 'https://help.sap.com/doc/sap-business-network-x12-sh856-4010-inbound/cloud/en-US/SAP%20Business%20Network%20X12%20SH856%204010%20Inbound.pdf',
    gr:  'https://help.sap.com/doc/sap-business-network-x12-rc861-4010-inbound/cloud/en-US/SAP%20Business%20Network%20X12%20RC861%204010%20Inbound.pdf',
    inv: 'https://help.sap.com/doc/sap-business-network-x12-in810-4010-inbound/cloud/en-US/SAP%20Business%20Network%20X12%20IN810%204010%20Inbound.pdf'
  };

  // Segment reference pages per doc type
  // Format: "§<section> <SegmentName>, p. <page>" or "§<section> <SegmentName>, pp. <start>-<end>"
  // Derived from SAP Business Network X12 4010 Implementation Guides (TOC + Segment Summary SegNo)
  var SEGMENT_REFS = {
    po: {
      'ISA': '§2 Interchange Control Header, p. 13',
      'GS':  '§2 Functional Group Header, p. 14',
      'ST':  '§2 Transaction Set Header, p. 15',
      'BEG': '§2 Beginning Segment for PO, p. 16',
      'CUR': '§2 Currency, p. 17',
      'REF': '§2 References, pp. 18-22',
      'PER': '§2 PER Segment, p. 23',
      'FOB': '§2 FOB Segment, pp. 24-25',
      'CSH': '§2 CSH Segment, p. 25',
      'SAC': '§2 SAC Segment, pp. 26-30',
      'ITD': '§2 ITD Segment, pp. 31-32',
      'DTM': '§2 DTM Segment, pp. 33-34',
      'PID': '§2 PID Segment, pp. 35-36',
      'TXI': '§2 TXI Segment, pp. 37-38',
      'N9':  '§2 N9 Segment, pp. 39-46',
      'MSG': '§2 MSG Segment, p. 47',
      'N1':  '§2 N1 Loop, pp. 48-56',
      'N2':  '§2 N2 Segment, p. 50',
      'N3':  '§2 N3 Segment, p. 51',
      'N4':  '§2 N4 Segment, pp. 52-53',
      'TD5': '§2 TD5 Segment, pp. 54-55',
      'TD4': '§2 TD4 Segment, p. 56',
      'PO1': '§2 PO1 Segment, pp. 57-65',
      'LIN': '§2 LIN Segment, pp. 66-67',
      'CTP': '§2 CTP Segment, pp. 68-69',
      'MEA': '§2 MEA Segment, p. 70',
      'SLN': '§2 SLN Segment, pp. 71-75',
      'SCH': '§2 SCH Segment, pp. 76-78',
      'PKG': '§2 PKG Segment, p. 79',
      'PID': '§2 PID Segment, pp. 35-36',
      'CTT': '§2 CTT Segment, p. 127',
      'AMT': '§2 AMT Segment, p. 128',
      'SE':  '§2 Transaction Set Trailer, p. 129',
      'GE':  '§2 Functional Group Trailer, p. 129',
      'IEA': '§2 Interchange Control Trailer, p. 129'
    },
    poc: {
      'ISA': '§1 Interchange Envelope, p. 13',
      'GS':  '§1 Functional Group, p. 14',
      'ST':  '§2 Transaction Set Header, p. 15',
      'BCH': '§2 BCH Segment, pp. 16-17',
      'CUR': '§2 CUR Segment, p. 17',
      'REF': '§2 REF Segment, pp. 18-22',
      'PER': '§2 PER Segment, p. 23',
      'FOB': '§2 FOB Segment, p. 24',
      'CSH': '§2 CSH Segment, p. 25',
      'SAC': '§2 SAC Segment, pp. 26-30',
      'ITD': '§2 ITD Segment, p. 31',
      'DTM': '§2 DTM Segment, p. 32',
      'PID': '§2 PID Segment, p. 33',
      'TXI': '§2 TXI Segment, p. 34',
      'N9':  '§2 N9 Segment, pp. 35-48',
      'MSG': '§2 MSG Segment, p. 38',
      'N1':  '§2 N1 Loop, pp. 49-57',
      'N2':  '§2 N2 Segment, p. 50',
      'N3':  '§2 N3 Segment, p. 51',
      'N4':  '§2 N4 Segment, pp. 52-53',
      'TD5': '§2 TD5 Segment, p. 56',
      'TD4': '§2 TD4 Segment, p. 57',
      'POC': '§2 POC Segment, pp. 58-122',
      'SLN': '§2 SLN Segment, p. 118',
      'SCH': '§2 SCH Segment, p. 90',
      'LIN': '§2 LIN Segment, pp. 60-63',
      'CTP': '§2 CTP Segment, pp. 64-65',
      'MEA': '§2 MEA Segment, p. 66',
      'PKG': '§2 PKG Segment, p. 72',
      'CTT': '§2 CTT Segment, pp. 123-124',
      'AMT': '§2 AMT Segment, p. 124',
      'SE':  '§2 Transaction Set Trailer, p. 125',
      'GE':  '§2 Functional Group Trailer, p. 126',
      'IEA': '§2 Interchange Control Trailer, p. 127'
    },
    oc: {
      'ISA': '§1 Interchange Envelope, pp. 10-11',
      'GS':  '§1 Functional Group, p. 12',
      'ST':  '§2 Transaction Set Header, p. 13',
      'BAK': '§2 BAK Segment, pp. 14-15',
      'CUR': '§2 CUR Segment, p. 15',
      'REF': '§2 REF Segment, pp. 16-17',
      'FOB': '§2 FOB Segment, p. 18',
      'SAC': '§2 SAC Segment, pp. 19-25',
      'DTM': '§2 DTM Segment, p. 26',
      'TXI': '§2 TXI Segment, p. 27',
      'N9':  '§2 N9 Segment, pp. 28-39',
      'MSG': '§2 MSG Segment, p. 29',
      'N1':  '§2 N1 Loop, pp. 42-47',
      'N2':  '§2 N2 Segment, p. 43',
      'N3':  '§2 N3 Segment, p. 44',
      'N4':  '§2 N4 Segment, p. 45',
      'PER': '§2 PER Segment, p. 47',
      'PO1': '§2 PO1 Segment, pp. 48-63',
      'CTP': '§2 CTP Segment, p. 50',
      'MEA': '§2 MEA Segment, p. 52',
      'PID': '§2 PID Segment, pp. 40-41',
      'ACK': '§2 ACK Segment, pp. 64-93',
      'SCH': '§2 SCH Segment, p. 69',
      'CTT': '§2 CTT Segment, pp. 94-95',
      'AMT': '§2 AMT Segment, p. 95',
      'SE':  '§2 Transaction Set Trailer, p. 96',
      'GE':  '§2 Functional Group Trailer, p. 97',
      'IEA': '§2 Interchange Control Trailer, p. 98'
    },
    asn: {
      'ISA': '§1 Interchange Envelope, pp. 11-12',
      'GS':  '§1 Functional Group, p. 13',
      'ST':  '§2 Transaction Set Header, p. 14',
      'BSN': '§2 BSN Segment, pp. 15-16',
      'DTM': '§2 DTM Segment, p. 17',
      'HL':  '§2 HL Segment, pp. 18-24',
      'TD1': '§2 TD1 Segment, pp. 21-22',
      'TD5': '§2 TD5 Segment, pp. 25-28',
      'TD3': '§2 TD3 Segment, p. 26',
      'TD4': '§2 TD4 Segment, p. 27',
      'REF': '§2 REF Segment, pp. 35-39',
      'FOB': '§2 FOB Segment, pp. 43-44',
      'PER': '§2 PER Segment, p. 40',
      'N1':  '§2 N1 Loop, pp. 44-53',
      'N2':  '§2 N2 Segment, p. 45',
      'N3':  '§2 N3 Segment, p. 46',
      'N4':  '§2 N4 Segment, pp. 47-48',
      'CUR': '§2 CUR Segment, p. 54',
      'PRF': '§2 PRF Segment, p. 56',
      'LIN': '§2 LIN Segment, pp. 96-137',
      'SN1': '§2 SN1 Segment, p. 97',
      'SLN': '§2 SLN Segment, p. 98',
      'PO4': '§2 PO4 Segment, pp. 79-95',
      'PID': '§2 PID Segment, p. 57',
      'MEA': '§2 MEA Segment, p. 81',
      'MAN': '§2 MAN Segment, p. 83',
      'CTT': '§2 CTT Segment, p. 138',
      'SE':  '§2 Transaction Set Trailer, p. 139',
      'GE':  '§2 Functional Group Trailer, p. 140',
      'IEA': '§2 Interchange Control Trailer, p. 141'
    },
    gr: {
      'ISA': '§1 Interchange Envelope, pp. 8-9',
      'GS':  '§1 Functional Group, p. 9',
      'ST':  '§2 Transaction Set Header, p. 10',
      'BRA': '§2 BRA Segment, pp. 11-12',
      'CUR': '§2 CUR Segment, p. 12',
      'REF': '§2 REF Segment, p. 13',
      'DTM': '§2 DTM Segment, p. 14',
      'N1':  '§2 N1 Loop, pp. 23-27',
      'N3':  '§2 N3 Segment, p. 25',
      'N4':  '§2 N4 Segment, pp. 26-27',
      'RCD': '§2 RCD Segment, pp. 15-17',
      'LIN': '§2 LIN Segment, pp. 17-27',
      'SN1': '§2 SN1 Segment, p. 19',
      'PID': '§2 PID Segment, p. 18',
      'CTT': '§2 CTT Segment, p. 28',
      'SE':  '§2 Transaction Set Trailer, p. 29',
      'GE':  '§2 Functional Group Trailer, p. 30',
      'IEA': '§2 Interchange Control Trailer, p. 31',
      'BTI': '§2 BRA Segment, pp. 11-12'
    },
    inv: {
      'ISA': '§1 Interchange Envelope, pp. 11-12',
      'GS':  '§1 Functional Group, p. 13',
      'ST':  '§2 Transaction Set Header, p. 14',
      'BIG': '§2 BIG Segment, pp. 15-17',
      'NTE': '§2 NTE Segment, p. 18',
      'CUR': '§2 CUR Segment, p. 19',
      'REF': '§2 REF Segment, pp. 20-22',
      'N9':  '§2 N9 Segment, pp. 39-40',
      'MSG': '§2 MSG Segment, p. 40',
      'PER': '§2 PER Segment, p. 34',
      'N1':  '§2 N1 Loop, pp. 23-34',
      'N2':  '§2 N2 Segment, p. 24',
      'N3':  '§2 N3 Segment, p. 25',
      'N4':  '§2 N4 Segment, pp. 26-27',
      'ITD': '§2 ITD Segment, pp. 35-37',
      'DTM': '§2 DTM Segment, p. 38',
      'FOB': '§2 FOB Segment, p. 39',
      'SAC': '§2 SAC Segment, pp. 59-64',
      'TXI': '§2 TXI Segment, pp. 65-86',
      'IT1': '§2 IT1 Segment, pp. 41-58',
      'CTP': '§2 CTP Segment, p. 46',
      'PAM': '§2 PAM Segment, p. 47',
      'PID': '§2 PID Segment, p. 48',
      'MEA': '§2 MEA Segment, p. 49',
      'TDS': '§2 TDS Segment, p. 87',
      'AMT': '§2 AMT Segment, pp. 88-106',
      'CTT': '§2 CTT Segment, p. 107',
      'SE':  '§2 Transaction Set Trailer, p. 108',
      'GE':  '§2 Functional Group Trailer, p. 109',
      'IEA': '§2 Interchange Control Trailer, p. 110'
    }
  };

  /**
   * Get Column C reference for a segment in a specific doc type
   * @param {string} segId - Segment ID (e.g. 'BEG', 'REF', 'N1')
   * @param {string} docType - Document type (e.g. 'po', 'poc', 'oc')
   * @returns {string} Reference string (e.g. '§2 BEG Segment, pp. 17-20')
   */
  function getSegmentRef(segId, docType) {
    var refs = SEGMENT_REFS[docType] || SEGMENT_REFS.po;
    return refs[segId] || '§2 ' + segId + ' Segment';
  }

  /* ===== PUBLIC API ===== */
  return {
    DOC_TYPES: DOC_TYPES,
    SAP_GUIDE_URL: SAP_GUIDE_URL,
    SAP_GUIDE_PDFS: SAP_GUIDE_PDFS,
    SEGMENT_REFS: SEGMENT_REFS,
    parseEdi: parseEdi,
    convertCxmlToEdi: convertCxmlToEdi,
    generateGuideRows: generateGuideRows,
    getSegmentRef: getSegmentRef,
    detectInputType: detectInputType,
    detectDocType: detectDocType,
    SEGMENT_DESCRIPTIONS: SEGMENT_DESCRIPTIONS,
    ELEMENT_DESCRIPTIONS: ELEMENT_DESCRIPTIONS
  };
})();
