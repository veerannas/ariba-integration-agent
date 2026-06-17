/**
 * cXML Guide Engine — AIA Extension
 * Parses cXML or EDI input, outputs cXML guide rows (line | explanation).
 * EDI→cXML conversion preserves ALL values with zero masking.
 * Supports: PO (850), POC (860), OC (855), ASN (856), GR (861), INV (810)
 */
var CxmlGuideEngine = (function() {
  'use strict';

  /* ===== cXML ELEMENT DESCRIPTIONS ===== */
  var ELEMENT_DESC = {
    // Envelope
    'cXML': 'cXML document root — version and timestamp attributes define the DTD version and generation time',
    'Header': 'Authentication and routing envelope — contains sender, receiver, and credentials',
    'From': 'Identifies the sender of this cXML document (buying organization or supplier)',
    'To': 'Identifies the intended recipient of this cXML document',
    'Sender': 'Identifies the party transmitting the document (may differ from From — e.g., a network hub)',
    'Credential': 'Authentication credential — domain attribute specifies the identity system (e.g., NetworkId, DUNS)',
    'Identity': 'The actual identifier value within the credential domain',
    'SharedSecret': 'Authentication password/token shared between trading partners for message validation',
    'UserAgent': 'Software identifier of the sending application (informational)',
    'Request': 'Container for the business document payload (OrderRequest, ShipNotice, Invoice, etc.)',
    'Response': 'Container for response documents',
    'Status': 'Response status — code 200=success, 4xx/5xx=error',

    // OrderRequest (PO/POC)
    'OrderRequest': 'Purchase Order or Purchase Order Change request document',
    'OrderRequestHeader': 'PO header — orderID is the buyer PO number, orderDate is issue date, type indicates new/update',
    'Total': 'Total monetary value of the order',
    'Money': 'Monetary amount — currency attribute specifies ISO 4217 code (USD, EUR, etc.)',
    'ShipTo': 'Ship-to address — where goods should be delivered',
    'Address': 'Physical or logical address block',
    'Name': 'Human-readable name (organization, person, or description)',
    'PostalAddress': 'Structured postal address with street, city, state, postal code, country',
    'Street': 'Street address line',
    'City': 'City name',
    'State': 'State or province code',
    'PostalCode': 'Postal/ZIP code',
    'Country': 'Country — isoCountryCode attribute is the ISO 3166-1 alpha-2 code',
    'BillTo': 'Bill-to address — where invoices should be sent',
    'Payment': 'Payment terms and method information',
    'Terms': 'Payment terms — days, discount percentage, net due period',
    'Comments': 'Free-text comments — xml:lang specifies language, type can indicate purpose',
    'Extrinsic': 'Custom name-value field — name attribute is the field identifier, content is the value',
    'ItemOut': 'Order line item — quantity and lineNumber are key attributes',
    'ItemID': 'Item identification block containing supplier and buyer part numbers',
    'SupplierPartID': 'Supplier\'s catalog or part number for this item',
    'BuyerPartID': 'Buyer\'s internal material or part number',
    'SupplierPartAuxiliaryID': 'Additional supplier part identifier (auxiliary catalog number)',
    'ItemDetail': 'Detailed item information — description, unit price, classification, unit of measure',
    'UnitPrice': 'Price per unit of measure for this line item',
    'Description': 'Item description — xml:lang specifies language',
    'UnitOfMeasure': 'Unit of measure code (EA=Each, BX=Box, KG=Kilogram, etc.)',
    'Classification': 'Item classification — domain specifies the taxonomy (UNSPSC, CommodityCode, etc.)',
    'ManufacturerPartID': 'Manufacturer\'s part number',
    'ManufacturerName': 'Name of the item manufacturer',
    'URL': 'URL reference (e.g., to item image, spec sheet, or punchout catalog)',
    'ShortName': 'Short name or abbreviated description',
    'LeadTime': 'Expected lead time in days from order to delivery',
    'Tax': 'Tax information for the line or document',
    'TaxDetail': 'Tax detail — category, purpose, rate percentage',
    'TaxAmount': 'Calculated tax amount',
    'Shipping': 'Shipping method and cost information',
    'ShippingAmount': 'Shipping cost amount',
    'Distribution': 'Accounting distribution — charge allocation to cost centers or GL accounts',
    'Accounting': 'Accounting code information for cost allocation',
    'AccountingSegment': 'Individual accounting segment (cost center, GL account, WBS element, etc.)',
    'Charge': 'Charge allocation percentage or amount',
    'ScheduleLine': 'Delivery schedule line — requestedDeliveryDate and quantity',
    'DocumentReference': 'Reference to another document (e.g., master agreement, blanket PO)',
    'Contact': 'Contact information block — role attribute specifies function (buyer, shipTo, etc.)',
    'Phone': 'Phone number',
    'TelephoneNumber': 'Structured phone number with country code, area code, number',
    'Email': 'Email address',
    'Fax': 'Fax number',
    'IdReference': 'Cross-reference identifier — domain and identifier attributes',
    'OrderRequestHeaderIndustry': 'Industry-specific header extensions',
    'ReferenceDocumentInfo': 'Reference document identifier (e.g., contract number)',

    // ConfirmationRequest (OC)
    'ConfirmationRequest': 'Order Confirmation document — supplier confirms or rejects order lines',
    'ConfirmationHeader': 'Confirmation header — confirmID is the supplier\'s confirmation number',
    'OrderReference': 'Reference to the original purchase order being confirmed',
    'ConfirmationItem': 'Line item confirmation — lineNumber references the PO line',
    'ConfirmationStatus': 'Status of the line — type: accept, reject, backOrder, detail attributes show qty/date/price',

    // ShipNoticeRequest (ASN)
    'ShipNoticeRequest': 'Advance Ship Notice — notifies buyer that goods have been shipped',
    'ShipNoticeHeader': 'ASN header — shipmentID is the carrier tracking or shipment reference',
    'ShipNoticePortionControl': 'Controls partial shipment processing',
    'ShipControl': 'Shipping logistics — carrier, tracking, ship/delivery dates',
    'CarrierIdentifier': 'Carrier identification — domain specifies system (SCAC, IATA, etc.)',
    'ShipmentIdentifier': 'Shipment tracking number or bill of lading number',
    'Route': 'Shipping route information',
    'ShipNoticePortion': 'A portion/package within the shipment',
    'ShipNoticeItem': 'Line item in the shipment — quantity and lineNumber reference the PO',
    'PackageID': 'Package identification (e.g., SSCC, container number)',
    'Packaging': 'Package type and dimensions',
    'Dimension': 'Physical dimension (weight, volume, length, etc.)',
    'PackageTrackingNumber': 'Carrier package tracking number',
    'Hazard': 'Hazardous materials information',

    // ReceiptRequest (GR)
    'ReceiptRequest': 'Goods Receipt — buyer confirms receipt of shipped goods',
    'ReceiptRequestHeader': 'Receipt header — receiptDate is when goods were received',
    'ReceiptOrder': 'Receipt linked to a specific purchase order',
    'ReceiptOrderInfo': 'Order reference information for the receipt',
    'ReceiptItem': 'Line item receipt — quantity received, status, any discrepancies',

    // InvoiceDetailRequest (INV)
    'InvoiceDetailRequest': 'Invoice document — supplier requests payment for delivered goods/services',
    'InvoiceDetailRequestHeader': 'Invoice header — invoiceID is the supplier invoice number, invoiceDate is issue date',
    'InvoiceDetailHeaderIndicator': 'Indicates invoice type (standard, credit, debit)',
    'InvoiceDetailLineIndicator': 'Line-level indicator properties',
    'InvoicePartner': 'Party involved in the invoice (remitTo, billTo, soldTo, shipFrom)',
    'InvoiceDetailOrder': 'Invoice lines grouped by purchase order',
    'InvoiceDetailOrderInfo': 'Purchase order reference for this invoice group',
    'InvoiceDetailItem': 'Invoice line item — invoiceLineNumber, quantity, unit price',
    'SubtotalAmount': 'Subtotal before tax and charges',
    'GrossAmount': 'Gross amount (subtotal + charges)',
    'NetAmount': 'Net amount (gross - allowances)',
    'DueAmount': 'Amount due for payment',
    'InvoiceDetailDiscount': 'Discount information',
    'InvoiceDetailSummary': 'Invoice totals summary',
    'InvoiceTaxSummary': 'Tax summary across all lines',
    'InvoiceHeaderModifications': 'Header-level allowances, charges, or adjustments',
    'InvoiceDetailLineModifications': 'Line-level allowances, charges, or adjustments',
    'Modification': 'A specific allowance or charge modification',
    'ModificationDetail': 'Detail of the modification (amount, description)',
    'AdditionalDeduction': 'Additional deduction from invoice amount',
    'PaymentTerm': 'Payment term details — days for net, discount percentage and days',
    'GrossProgressPaymentAmount': 'Progress payment gross amount',
    'NetProgressPaymentAmount': 'Progress payment net amount',
    'RetainageAmount': 'Retainage (holdback) amount',
    'Period': 'Service period — startDate and endDate',
  };

  /* ===== ATTRIBUTE DESCRIPTIONS ===== */
  var ATTR_DESC = {
    'orderID': 'Buyer\'s purchase order number',
    'orderDate': 'PO issue date (ISO 8601 format)',
    'orderType': 'Order type — regular, blanket, release',
    'type': 'Document type indicator',
    'releaseRequired': 'Whether release orders are required against this agreement',
    'confirmID': 'Supplier\'s confirmation/acknowledgment number',
    'operation': 'Line operation — new, update, delete',
    'lineNumber': 'Line item number on the purchase order',
    'quantity': 'Quantity ordered, shipped, received, or invoiced',
    'shipmentID': 'Shipment identifier or tracking reference',
    'noticeDate': 'Date the ship notice was created',
    'invoiceID': 'Supplier\'s invoice number',
    'invoiceDate': 'Invoice issue date',
    'purpose': 'Invoice purpose — standard, creditMemo, debitMemo, lineLevelCreditMemo',
    'isInformationOnly': 'If "yes", invoice is for information only, no payment expected',
    'currency': 'ISO 4217 currency code (USD, EUR, GBP, JPY, etc.)',
    'isoCountryCode': 'ISO 3166-1 alpha-2 country code',
    'xml:lang': 'Language code (e.g., en-US, de-DE)',
    'domain': 'Classification or identity domain (NetworkId, DUNS, UNSPSC, etc.)',
    'name': 'Extrinsic field name or identifier',
    'payloadID': 'Unique message identifier (typically timestamp@sender)',
    'timestamp': 'Document creation timestamp (ISO 8601)',
    'version': 'cXML DTD version',
    'receiptDate': 'Date goods were received',
    'requestedDeliveryDate': 'Requested delivery date for this schedule line',
    'shipDate': 'Actual or planned ship date',
    'deliveryDate': 'Expected or actual delivery date',
    'role': 'Contact role — buyer, supplier, shipTo, remitTo, shipFrom',
    'addressID': 'Unique address identifier',
    'category': 'Tax category (sales, vat, gst, withholding)',
    'percentageRate': 'Tax or discount percentage rate',
    'taxPointDate': 'Date tax liability is established',
  };

  /* ===== cXML TEMPLATES FOR EDI→cXML CONVERSION ===== */

  /**
   * Parse EDI X12 content into structured segments
   */
  function parseEdiSegments(ediText) {
    var content = ediText.trim();
    // Detect segment terminator
    var terminator = '~';
    if (content.indexOf('~') === -1 && content.indexOf('\n') > -1) {
      terminator = '\n';
    }
    var rawSegs = content.split(terminator).filter(function(s) { return s.trim(); });
    var segments = [];
    rawSegs.forEach(function(raw) {
      var cleaned = raw.trim().replace(/^[\r\n]+/, '');
      if (!cleaned) return;
      // Detect element separator from ISA
      var sep = '*';
      if (cleaned.startsWith('ISA') && cleaned.length > 3) {
        sep = cleaned[3];
      }
      var elements = cleaned.split(sep);
      segments.push({ id: elements[0], elements: elements, raw: cleaned });
    });
    return segments;
  }

  /**
   * Detect document type from EDI content
   */
  function detectDocTypeFromEdi(segments) {
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'ST') {
        var code = seg.elements[1];
        if (code === '850') return 'po';
        if (code === '860') return 'poc';
        if (code === '855') return 'oc';
        if (code === '856') return 'asn';
        if (code === '861') return 'gr';
        if (code === '810') return 'inv';
      }
      if (seg.id === 'BCH') return 'poc';
      if (seg.id === 'BEG') return 'po';
      if (seg.id === 'BAK') return 'oc';
      if (seg.id === 'BSN') return 'asn';
      if (seg.id === 'BRA' || seg.id === 'BTI') return 'gr';
      if (seg.id === 'BIG') return 'inv';
    }
    return 'po';
  }

  /**
   * Detect document type from cXML content
   */
  function detectDocTypeFromCxml(xmlText) {
    if (/<OrderRequest[\s>]/i.test(xmlText)) {
      if (/type\s*=\s*["']update["']/i.test(xmlText) || /<ChangeOrder/i.test(xmlText)) return 'poc';
      return 'po';
    }
    if (/<ConfirmationRequest[\s>]/i.test(xmlText)) return 'oc';
    if (/<ShipNoticeRequest[\s>]/i.test(xmlText)) return 'asn';
    if (/<ReceiptRequest[\s>]/i.test(xmlText)) return 'gr';
    if (/<InvoiceDetailRequest[\s>]/i.test(xmlText)) return 'inv';
    return 'po';
  }

  /**
   * Get element value from EDI segment at position (1-indexed after segment ID)
   */
  function ediVal(seg, pos) {
    return (seg && seg.elements && seg.elements[pos]) ? seg.elements[pos].trim() : '';
  }

  /**
   * Find all segments with a given ID
   */
  function findSegs(segments, id) {
    return segments.filter(function(s) { return s.id === id; });
  }

  /**
   * Find first segment with given ID
   */
  function findSeg(segments, id) {
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === id) return segments[i];
    }
    return null;
  }

  /**
   * XML-escape a string
   */
  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /**
   * Format date from EDI format (YYYYMMDD or YYMMDD) to ISO
   */
  function ediDateToIso(dateStr) {
    if (!dateStr) return '';
    if (dateStr.length === 6) {
      var yy = parseInt(dateStr.substring(0, 2));
      var century = yy > 50 ? '19' : '20';
      return century + dateStr.substring(0, 2) + '-' + dateStr.substring(2, 4) + '-' + dateStr.substring(4, 6);
    }
    if (dateStr.length === 8) {
      return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8);
    }
    return dateStr;
  }

  /**
   * Format time from EDI (HHMM) to ISO
   */
  function ediTimeToIso(timeStr) {
    if (!timeStr || timeStr.length < 4) return 'T12:00:00-05:00';
    return 'T' + timeStr.substring(0, 2) + ':' + timeStr.substring(2, 4) + ':00-05:00';
  }

  /* ===== EDI → cXML CONVERTERS ===== */

  /**
   * Build cXML envelope from ISA/GS segments
   */
  function buildEnvelope(segments) {
    var isa = findSeg(segments, 'ISA');
    var gs = findSeg(segments, 'GS');
    var senderId = isa ? ediVal(isa, 6).trim() : 'SENDER';
    var receiverId = isa ? ediVal(isa, 8).trim() : 'RECEIVER';
    var senderQual = isa ? ediVal(isa, 5).trim() : 'ZZ';
    var receiverQual = isa ? ediVal(isa, 7).trim() : 'ZZ';
    var date = isa ? ediVal(isa, 9) : '';
    var time = isa ? ediVal(isa, 10) : '';
    var controlNum = isa ? ediVal(isa, 13) : '000000001';

    var isoDate = ediDateToIso(date);
    var isoTime = ediTimeToIso(time);
    var timestamp = isoDate + isoTime;
    var payloadId = timestamp.replace(/[^0-9]/g, '') + '@' + senderId.trim();

    return {
      senderId: senderId,
      receiverId: receiverId,
      senderQual: senderQual,
      receiverQual: receiverQual,
      timestamp: timestamp,
      payloadId: payloadId,
      gsAppSender: gs ? ediVal(gs, 2) : senderId,
      gsAppReceiver: gs ? ediVal(gs, 3) : receiverId
    };
  }

  /**
   * Build N1 loop party addresses from segments
   */
  function buildAddressesFromN1(segments, startIdx, endIdx) {
    var addresses = {};
    var currentParty = null;
    for (var i = startIdx; i < endIdx; i++) {
      var seg = segments[i];
      if (seg.id === 'N1') {
        var qual = ediVal(seg, 1); // ST=ShipTo, BT=BillTo, BY=Buyer, SE=Seller, VN=Vendor
        currentParty = {
          qualifier: qual,
          name: ediVal(seg, 2),
          idQual: ediVal(seg, 3),
          id: ediVal(seg, 4),
          street: [], city: '', state: '', zip: '', country: ''
        };
        addresses[qual] = currentParty;
      } else if (seg.id === 'N2' && currentParty) {
        currentParty.name2 = ediVal(seg, 1);
      } else if (seg.id === 'N3' && currentParty) {
        currentParty.street.push(ediVal(seg, 1));
        if (ediVal(seg, 2)) currentParty.street.push(ediVal(seg, 2));
      } else if (seg.id === 'N4' && currentParty) {
        currentParty.city = ediVal(seg, 1);
        currentParty.state = ediVal(seg, 2);
        currentParty.zip = ediVal(seg, 3);
        currentParty.country = ediVal(seg, 4) || 'US';
      } else if (seg.id === 'REF' && currentParty) {
        if (!currentParty.refs) currentParty.refs = [];
        currentParty.refs.push({ qual: ediVal(seg, 1), value: ediVal(seg, 2), desc: ediVal(seg, 3) });
      } else if (seg.id === 'PER' && currentParty) {
        currentParty.contactName = ediVal(seg, 2);
        currentParty.contactPhone = ediVal(seg, 4);
        currentParty.contactEmail = ediVal(seg, 8) || ediVal(seg, 6);
      }
    }
    return addresses;
  }

  /**
   * Render an Address block as cXML
   */
  function renderAddress(party, indent, role) {
    if (!party) return '';
    var lines = [];
    var addrId = party.id || party.qualifier || '';
    lines.push(indent + '<Address addressID="' + esc(addrId) + '">');
    lines.push(indent + '  <Name xml:lang="en">' + esc(party.name) + '</Name>');
    lines.push(indent + '  <PostalAddress>');
    if (party.street.length > 0) {
      party.street.forEach(function(s) {
        lines.push(indent + '    <Street>' + esc(s) + '</Street>');
      });
    }
    if (party.city) lines.push(indent + '    <City>' + esc(party.city) + '</City>');
    if (party.state) lines.push(indent + '    <State>' + esc(party.state) + '</State>');
    if (party.zip) lines.push(indent + '    <PostalCode>' + esc(party.zip) + '</PostalCode>');
    lines.push(indent + '    <Country isoCountryCode="' + esc(party.country || 'US') + '">' + esc(party.country || 'US') + '</Country>');
    lines.push(indent + '  </PostalAddress>');
    lines.push(indent + '</Address>');
    return lines.join('\n');
  }

  /**
   * Convert 850 PO EDI → cXML OrderRequest
   */
  function convertPoToCxml(segments) {
    var env = buildEnvelope(segments);
    var beg = findSeg(segments, 'BEG');
    var cur = findSeg(segments, 'CUR');
    var orderID = beg ? ediVal(beg, 3) : '';
    var orderDate = beg ? ediDateToIso(ediVal(beg, 5)) : '';
    var orderType = beg ? ediVal(beg, 2) : 'NE';
    var currency = cur ? ediVal(cur, 2) : 'USD';

    // Find N1 loop boundaries (header-level, before PO1)
    var po1Idx = segments.length;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'PO1') { po1Idx = i; break; }
    }
    var n1Start = 0;
    for (var i = 0; i < po1Idx; i++) {
      if (segments[i].id === 'N1') { n1Start = i; break; }
    }
    var addresses = buildAddressesFromN1(segments, n1Start, po1Idx);

    // REF segments at header level
    var headerRefs = [];
    for (var i = 0; i < po1Idx; i++) {
      if (segments[i].id === 'REF' && i < n1Start) {
        headerRefs.push(segments[i]);
      }
    }

    // ITD (terms)
    var itd = findSeg(segments, 'ITD');
    var dtmSegs = findSegs(segments, 'DTM');

    // Comments/N9
    var n9Segs = [];
    for (var i = 0; i < po1Idx; i++) {
      if (segments[i].id === 'N9') n9Segs.push(segments[i]);
    }

    // PO1 line items
    var lineItems = [];
    var currentLine = null;
    for (var i = po1Idx; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'PO1') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = {
          lineNum: ediVal(seg, 1),
          qty: ediVal(seg, 2),
          uom: ediVal(seg, 3),
          price: ediVal(seg, 4),
          basisOfPrice: ediVal(seg, 5),
          partIds: [],
          description: '',
          refs: [],
          pid: []
        };
        // Parse part IDs from PO1 elements (pairs: qualifier, value)
        for (var j = 6; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j];
          var val = seg.elements[j + 1];
          if (qual && val) {
            currentLine.partIds.push({ qualifier: qual, value: val });
          }
        }
      } else if (seg.id === 'PID' && currentLine) {
        currentLine.pid.push(ediVal(seg, 5) || ediVal(seg, 4));
      } else if (seg.id === 'REF' && currentLine) {
        currentLine.refs.push({ qual: ediVal(seg, 1), value: ediVal(seg, 2), desc: ediVal(seg, 3) });
      } else if (seg.id === 'SCH' && currentLine) {
        if (!currentLine.schedule) currentLine.schedule = [];
        currentLine.schedule.push({ qty: ediVal(seg, 1), uom: ediVal(seg, 2), dateQual: ediVal(seg, 5), date: ediVal(seg, 6) });
      } else if (seg.id === 'CTT' || seg.id === 'SE') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = null;
        break;
      }
    }
    if (currentLine) lineItems.push(currentLine);

    // Total from AMT or calculate
    var amt = findSeg(segments, 'AMT');
    var totalAmount = amt ? ediVal(amt, 2) : '';
    if (!totalAmount && lineItems.length > 0) {
      var sum = 0;
      lineItems.forEach(function(li) {
        sum += (parseFloat(li.qty) || 0) * (parseFloat(li.price) || 0);
      });
      totalAmount = sum.toFixed(2);
    }

    // Build cXML
    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppSender) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <OrderRequest>');
    lines.push('      <OrderRequestHeader orderID="' + esc(orderID) + '" orderDate="' + esc(orderDate) + '" type="new">');
    lines.push('        <Total>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </Total>');

    // ShipTo
    var shipTo = addresses['ST'] || addresses['ship'];
    if (shipTo) {
      lines.push('        <ShipTo>');
      lines.push(renderAddress(shipTo, '          '));
      lines.push('        </ShipTo>');
    }

    // BillTo
    var billTo = addresses['BT'] || addresses['bill'];
    if (billTo) {
      lines.push('        <BillTo>');
      lines.push(renderAddress(billTo, '          '));
      lines.push('        </BillTo>');
    }

    // Payment/Terms
    if (itd) {
      lines.push('        <Payment>');
      var discPct = ediVal(itd, 3);
      var netDays = ediVal(itd, 7) || ediVal(itd, 5);
      lines.push('          <Terms>');
      if (netDays) lines.push('            <Extrinsic name="netDays">' + esc(netDays) + '</Extrinsic>');
      if (discPct) lines.push('            <Extrinsic name="discountPercent">' + esc(discPct) + '</Extrinsic>');
      lines.push('          </Terms>');
      lines.push('        </Payment>');
    }

    // Comments from N9
    n9Segs.forEach(function(n9) {
      var refId = ediVal(n9, 1);
      var desc = ediVal(n9, 2);
      var freeForm = ediVal(n9, 3);
      if (freeForm || desc) {
        lines.push('        <Comments xml:lang="en" type="' + esc(refId) + '">' + esc(freeForm || desc) + '</Comments>');
      }
    });

    // Extrinsics from REFs
    headerRefs.forEach(function(ref) {
      var qual = ediVal(ref, 1);
      var val = ediVal(ref, 2);
      var desc = ediVal(ref, 3);
      lines.push('        <Extrinsic name="' + esc(qual + (desc ? '-' + desc : '')) + '">' + esc(val) + '</Extrinsic>');
    });

    lines.push('      </OrderRequestHeader>');

    // Line Items
    lineItems.forEach(function(li) {
      lines.push('      <ItemOut quantity="' + esc(li.qty) + '" lineNumber="' + esc(li.lineNum) + '">');
      lines.push('        <ItemID>');
      var suppPart = '', buyPart = '';
      li.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      if (suppPart) lines.push('          <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
      if (buyPart) lines.push('          <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
      // Other part IDs as SupplierPartAuxiliaryID
      li.partIds.forEach(function(p) {
        if (p.qualifier !== 'VP' && p.qualifier !== 'VN' && p.qualifier !== 'BP' && p.qualifier !== 'IN') {
          lines.push('          <!-- ' + esc(p.qualifier) + ' --><SupplierPartAuxiliaryID>' + esc(p.value) + '</SupplierPartAuxiliaryID>');
        }
      });
      lines.push('        </ItemID>');
      lines.push('        <ItemDetail>');
      lines.push('          <UnitPrice>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(li.price) + '</Money>');
      lines.push('          </UnitPrice>');
      var desc = li.pid.join(' ') || 'Item ' + li.lineNum;
      lines.push('          <Description xml:lang="en">' + esc(desc) + '</Description>');
      lines.push('          <UnitOfMeasure>' + esc(li.uom) + '</UnitOfMeasure>');
      lines.push('        </ItemDetail>');

      // Schedule lines
      if (li.schedule && li.schedule.length > 0) {
        li.schedule.forEach(function(sch) {
          var delDate = ediDateToIso(sch.date);
          lines.push('        <ScheduleLine quantity="' + esc(sch.qty) + '" requestedDeliveryDate="' + esc(delDate) + '"/>');
        });
      }

      lines.push('      </ItemOut>');
    });

    lines.push('    </OrderRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /**
   * Convert 860 POC EDI → cXML OrderRequest (type="update")
   */
  function convertPocToCxml(segments) {
    var env = buildEnvelope(segments);
    var bch = findSeg(segments, 'BCH');
    var cur = findSeg(segments, 'CUR');
    var orderID = bch ? ediVal(bch, 3) : '';
    var orderDate = bch ? ediDateToIso(ediVal(bch, 7)) : '';
    var purposeCode = bch ? ediVal(bch, 1) : '05'; // 05=Replace, 03=Delete
    var currency = cur ? ediVal(cur, 2) : 'USD';

    // Find POC loop start
    var pocIdx = segments.length;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'POC') { pocIdx = i; break; }
    }

    // Header N1 addresses
    var n1Start = 0;
    for (var i = 0; i < pocIdx; i++) {
      if (segments[i].id === 'N1') { n1Start = i; break; }
    }
    var addresses = buildAddressesFromN1(segments, n1Start, pocIdx);

    // Header REFs
    var headerRefs = [];
    for (var i = 0; i < Math.min(n1Start || pocIdx, pocIdx); i++) {
      if (segments[i].id === 'REF') headerRefs.push(segments[i]);
    }

    // POC line items (similar to PO1 but with change info)
    var lineItems = [];
    var currentLine = null;
    for (var i = pocIdx; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'POC') {
        if (currentLine) lineItems.push(currentLine);
        var changeCode = ediVal(seg, 2); // AI=Add, CA=Changes, DI=Delete, QI=Qty Increase, QD=Qty Decrease
        currentLine = {
          lineNum: ediVal(seg, 1),
          changeCode: changeCode,
          qty: ediVal(seg, 3),
          uom: ediVal(seg, 5),
          price: ediVal(seg, 6),
          partIds: [],
          description: '',
          pid: [],
          refs: []
        };
        // Part IDs from POC (start at position 9 in pairs)
        for (var j = 9; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j];
          var val = seg.elements[j + 1];
          if (qual && val) currentLine.partIds.push({ qualifier: qual, value: val });
        }
      } else if (seg.id === 'PID' && currentLine) {
        currentLine.pid.push(ediVal(seg, 5) || ediVal(seg, 4));
      } else if (seg.id === 'REF' && currentLine) {
        currentLine.refs.push({ qual: ediVal(seg, 1), value: ediVal(seg, 2), desc: ediVal(seg, 3) });
      } else if (seg.id === 'CTT' || seg.id === 'SE') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = null;
        break;
      }
    }
    if (currentLine) lineItems.push(currentLine);

    // Total
    var amt = findSeg(segments, 'AMT');
    var totalAmount = amt ? ediVal(amt, 2) : '0.00';

    // Build cXML
    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppSender) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <OrderRequest>');
    lines.push('      <OrderRequestHeader orderID="' + esc(orderID) + '" orderDate="' + esc(orderDate) + '" type="update">');
    lines.push('        <Total>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </Total>');

    var shipTo = addresses['ST'];
    if (shipTo) {
      lines.push('        <ShipTo>');
      lines.push(renderAddress(shipTo, '          '));
      lines.push('        </ShipTo>');
    }
    var billTo = addresses['BT'];
    if (billTo) {
      lines.push('        <BillTo>');
      lines.push(renderAddress(billTo, '          '));
      lines.push('        </BillTo>');
    }

    headerRefs.forEach(function(ref) {
      lines.push('        <Extrinsic name="' + esc(ediVal(ref, 1) + (ediVal(ref, 3) ? '-' + ediVal(ref, 3) : '')) + '">' + esc(ediVal(ref, 2)) + '</Extrinsic>');
    });

    lines.push('      </OrderRequestHeader>');

    // Line Items with operation attribute
    lineItems.forEach(function(li) {
      var op = 'update';
      if (li.changeCode === 'AI') op = 'new';
      else if (li.changeCode === 'DI') op = 'delete';
      lines.push('      <ItemOut quantity="' + esc(li.qty) + '" lineNumber="' + esc(li.lineNum) + '" operation="' + op + '">');
      lines.push('        <ItemID>');
      var suppPart = '', buyPart = '';
      li.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      if (suppPart) lines.push('          <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
      if (buyPart) lines.push('          <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
      lines.push('        </ItemID>');
      lines.push('        <ItemDetail>');
      lines.push('          <UnitPrice>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(li.price) + '</Money>');
      lines.push('          </UnitPrice>');
      var desc = li.pid.join(' ') || 'Item ' + li.lineNum;
      lines.push('          <Description xml:lang="en">' + esc(desc) + '</Description>');
      lines.push('          <UnitOfMeasure>' + esc(li.uom) + '</UnitOfMeasure>');
      lines.push('        </ItemDetail>');
      lines.push('      </ItemOut>');
    });

    lines.push('    </OrderRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /**
   * Convert 855 OC EDI → cXML ConfirmationRequest
   */
  function convertOcToCxml(segments) {
    var env = buildEnvelope(segments);
    var bak = findSeg(segments, 'BAK');
    var cur = findSeg(segments, 'CUR');
    var confirmID = bak ? ediVal(bak, 3) : '';
    var orderID = bak ? ediVal(bak, 4) || ediVal(bak, 3) : '';
    var confirmDate = bak ? ediDateToIso(ediVal(bak, 5)) : '';
    var currency = cur ? ediVal(cur, 2) : 'USD';
    var purposeCode = bak ? ediVal(bak, 1) : '00';

    // Find PO1/ACK loop
    var po1Idx = segments.length;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'PO1') { po1Idx = i; break; }
    }

    // Line items with ACK
    var lineItems = [];
    var currentLine = null;
    for (var i = po1Idx; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'PO1') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = {
          lineNum: ediVal(seg, 1),
          qty: ediVal(seg, 2),
          uom: ediVal(seg, 3),
          price: ediVal(seg, 4),
          partIds: [],
          acks: [],
          pid: []
        };
        for (var j = 6; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j], val = seg.elements[j + 1];
          if (qual && val) currentLine.partIds.push({ qualifier: qual, value: val });
        }
      } else if (seg.id === 'ACK' && currentLine) {
        currentLine.acks.push({
          statusCode: ediVal(seg, 1), // IA=Accept, IQ=Qty change, IR=Reject, IC=Change
          qty: ediVal(seg, 2),
          uom: ediVal(seg, 3),
          dateQual: ediVal(seg, 4),
          date: ediVal(seg, 5)
        });
      } else if (seg.id === 'PID' && currentLine) {
        currentLine.pid.push(ediVal(seg, 5) || ediVal(seg, 4));
      } else if (seg.id === 'CTT' || seg.id === 'SE') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = null;
        break;
      }
    }
    if (currentLine) lineItems.push(currentLine);

    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppReceiver) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <ConfirmationRequest>');
    lines.push('      <ConfirmationHeader confirmID="' + esc(confirmID) + '" noticeDate="' + esc(confirmDate) + '" type="detail" operation="new">');
    lines.push('        <OrderReference orderID="' + esc(orderID) + '"/>');
    lines.push('      </ConfirmationHeader>');

    lineItems.forEach(function(li) {
      lines.push('      <ConfirmationItem lineNumber="' + esc(li.lineNum) + '" quantity="' + esc(li.qty) + '">');
      var suppPart = '', buyPart = '';
      li.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      if (suppPart || buyPart) {
        lines.push('        <ItemID>');
        if (suppPart) lines.push('          <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
        if (buyPart) lines.push('          <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
        lines.push('        </ItemID>');
      }
      // ACK statuses
      li.acks.forEach(function(ack) {
        var type = 'accept';
        if (ack.statusCode === 'IR') type = 'reject';
        else if (ack.statusCode === 'IQ' || ack.statusCode === 'IC') type = 'detail';
        else if (ack.statusCode === 'IB') type = 'backOrder';
        var delivDate = ack.date ? ediDateToIso(ack.date) : '';
        var attrs = 'type="' + type + '" quantity="' + esc(ack.qty || li.qty) + '"';
        if (delivDate) attrs += ' deliveryDate="' + esc(delivDate) + '"';
        lines.push('        <ConfirmationStatus ' + attrs + '>');
        lines.push('          <UnitPrice>');
        lines.push('            <Money currency="' + esc(currency) + '">' + esc(li.price) + '</Money>');
        lines.push('          </UnitPrice>');
        lines.push('        </ConfirmationStatus>');
      });
      if (li.acks.length === 0) {
        lines.push('        <ConfirmationStatus type="accept" quantity="' + esc(li.qty) + '">');
        lines.push('          <UnitPrice>');
        lines.push('            <Money currency="' + esc(currency) + '">' + esc(li.price) + '</Money>');
        lines.push('          </UnitPrice>');
        lines.push('        </ConfirmationStatus>');
      }
      lines.push('      </ConfirmationItem>');
    });

    lines.push('    </ConfirmationRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /**
   * Convert 856 ASN EDI → cXML ShipNoticeRequest
   */
  function convertAsnToCxml(segments) {
    var env = buildEnvelope(segments);
    var bsn = findSeg(segments, 'BSN');
    var cur = findSeg(segments, 'CUR');
    var shipmentID = bsn ? ediVal(bsn, 2) : '';
    var shipDate = bsn ? ediDateToIso(ediVal(bsn, 3)) : '';
    var shipTime = bsn ? ediVal(bsn, 4) : '';
    var currency = cur ? ediVal(cur, 2) : 'USD';

    // Find HL segments and build hierarchy
    var hlSegs = [];
    var td5 = findSeg(segments, 'TD5');
    var td1 = findSeg(segments, 'TD1');

    // Collect items from HL loops
    var items = [];
    var currentItem = null;
    var orderRef = '';
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'PRF') {
        orderRef = ediVal(seg, 1);
      } else if (seg.id === 'LIN') {
        if (currentItem) items.push(currentItem);
        currentItem = { partIds: [], qty: '', uom: '', lineNum: ediVal(seg, 1) };
        // LIN format: LIN*lineNum*qual*value*qual*value... — pairs start at position 2
        for (var j = 2; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j], val = seg.elements[j + 1];
          if (qual && val) currentItem.partIds.push({ qualifier: qual, value: val });
        }
      } else if (seg.id === 'SN1' && currentItem) {
        currentItem.qty = ediVal(seg, 2);
        currentItem.uom = ediVal(seg, 3);
        currentItem.lineNum = ediVal(seg, 1) || (items.length + 1).toString();
      } else if (seg.id === 'PRF' && currentItem) {
        currentItem.orderRef = ediVal(seg, 1);
      } else if (seg.id === 'MAN') {
        if (currentItem) currentItem.packageId = ediVal(seg, 2);
      } else if (seg.id === 'CTT' || seg.id === 'SE') {
        if (currentItem) items.push(currentItem);
        currentItem = null;
        break;
      }
    }
    if (currentItem) items.push(currentItem);

    // N1 addresses
    var n1Start = 0;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'N1') { n1Start = i; break; }
    }
    var n1End = segments.length;
    for (var i = n1Start; i < segments.length; i++) {
      if (segments[i].id === 'HL' || segments[i].id === 'LIN' || segments[i].id === 'PRF') { n1End = i; break; }
    }
    var addresses = buildAddressesFromN1(segments, n1Start, n1End);

    var carrier = td5 ? ediVal(td5, 3) : '';
    var carrierName = td5 ? ediVal(td5, 5) : '';
    var trackingNum = '';
    var refSegs = findSegs(segments, 'REF');
    refSegs.forEach(function(r) {
      if (ediVal(r, 1) === 'CN' || ediVal(r, 1) === 'BM') trackingNum = ediVal(r, 2);
    });

    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppReceiver) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <ShipNoticeRequest>');
    lines.push('      <ShipNoticeHeader shipmentID="' + esc(shipmentID) + '" noticeDate="' + esc(shipDate) + '" shipDate="' + esc(shipDate) + '">');

    // ShipTo/ShipFrom
    var shipTo = addresses['ST'];
    if (shipTo) {
      lines.push('        <ShipTo>');
      lines.push(renderAddress(shipTo, '          '));
      lines.push('        </ShipTo>');
    }
    var shipFrom = addresses['SF'] || addresses['SE'];
    if (shipFrom) {
      lines.push('        <ShipFrom>');
      lines.push(renderAddress(shipFrom, '          '));
      lines.push('        </ShipFrom>');
    }

    // ShipControl
    if (carrier || trackingNum) {
      lines.push('        <ShipControl>');
      lines.push('          <CarrierIdentifier domain="SCAC">' + esc(carrier) + '</CarrierIdentifier>');
      if (trackingNum) lines.push('          <ShipmentIdentifier>' + esc(trackingNum) + '</ShipmentIdentifier>');
      lines.push('        </ShipControl>');
    }

    lines.push('      </ShipNoticeHeader>');

    // ShipNoticePortion
    lines.push('      <ShipNoticePortion>');
    if (orderRef) {
      lines.push('        <OrderReference orderID="' + esc(orderRef) + '"/>');
    }
    items.forEach(function(item) {
      var suppPart = '', buyPart = '';
      item.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      lines.push('        <ShipNoticeItem quantity="' + esc(item.qty) + '" lineNumber="' + esc(item.lineNum) + '">');
      lines.push('          <ItemID>');
      if (suppPart) lines.push('            <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
      if (buyPart) lines.push('            <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
      lines.push('          </ItemID>');
      if (item.packageId) lines.push('          <Packaging><PackageID>' + esc(item.packageId) + '</PackageID></Packaging>');
      lines.push('          <UnitOfMeasure>' + esc(item.uom || 'EA') + '</UnitOfMeasure>');
      lines.push('        </ShipNoticeItem>');
    });
    lines.push('      </ShipNoticePortion>');

    lines.push('    </ShipNoticeRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /**
   * Convert 861 GR EDI → cXML ReceiptRequest
   */
  function convertGrToCxml(segments) {
    var env = buildEnvelope(segments);
    var bra = findSeg(segments, 'BRA') || findSeg(segments, 'BTI');
    var cur = findSeg(segments, 'CUR');
    var receiptID = bra ? ediVal(bra, 1) : '';
    var receiptDate = bra ? ediDateToIso(ediVal(bra, 3) || ediVal(bra, 2)) : '';
    var currency = cur ? ediVal(cur, 2) : 'USD';

    // REF for order reference
    var orderRef = '';
    var refSegs = findSegs(segments, 'REF');
    refSegs.forEach(function(r) {
      if (ediVal(r, 1) === 'PO' || ediVal(r, 1) === 'CO') orderRef = ediVal(r, 2);
    });

    // RCD/LIN items
    var items = [];
    var currentItem = null;
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'RCD') {
        if (currentItem) items.push(currentItem);
        currentItem = { qty: ediVal(seg, 2) || ediVal(seg, 1), uom: ediVal(seg, 3) || 'EA', lineNum: '', partIds: [], desc: '' };
      } else if (seg.id === 'LIN' && currentItem) {
        currentItem.lineNum = ediVal(seg, 1);
        for (var j = 2; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j], val = seg.elements[j + 1];
          if (qual && val) currentItem.partIds.push({ qualifier: qual, value: val });
        }
      } else if (seg.id === 'SN1' && currentItem) {
        currentItem.qty = ediVal(seg, 2);
        currentItem.uom = ediVal(seg, 3) || currentItem.uom;
      } else if (seg.id === 'PID' && currentItem) {
        currentItem.desc = ediVal(seg, 5) || ediVal(seg, 4);
      } else if (seg.id === 'CTT' || seg.id === 'SE') {
        if (currentItem) items.push(currentItem);
        currentItem = null;
        break;
      }
    }
    if (currentItem) items.push(currentItem);

    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppSender) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <ReceiptRequest>');
    lines.push('      <ReceiptRequestHeader receiptDate="' + esc(receiptDate) + '">');
    if (orderRef) lines.push('        <OrderReference orderID="' + esc(orderRef) + '"/>');
    lines.push('      </ReceiptRequestHeader>');

    items.forEach(function(item, idx) {
      var suppPart = '', buyPart = '';
      item.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      lines.push('      <ReceiptItem lineNumber="' + esc(item.lineNum || (idx + 1).toString()) + '" quantity="' + esc(item.qty) + '">');
      if (suppPart || buyPart) {
        lines.push('        <ItemID>');
        if (suppPart) lines.push('          <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
        if (buyPart) lines.push('          <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
        lines.push('        </ItemID>');
      }
      lines.push('        <UnitOfMeasure>' + esc(item.uom) + '</UnitOfMeasure>');
      if (item.desc) lines.push('        <Description xml:lang="en">' + esc(item.desc) + '</Description>');
      if (orderRef) lines.push('        <OrderReference orderID="' + esc(orderRef) + '"/>');
      lines.push('      </ReceiptItem>');
    });

    lines.push('    </ReceiptRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /**
   * Convert 810 INV EDI → cXML InvoiceDetailRequest
   */
  function convertInvToCxml(segments) {
    var env = buildEnvelope(segments);
    var big = findSeg(segments, 'BIG');
    var cur = findSeg(segments, 'CUR');
    var invoiceID = big ? ediVal(big, 2) : '';
    var invoiceDate = big ? ediDateToIso(ediVal(big, 1)) : '';
    var poNumber = big ? ediVal(big, 4) : '';
    var currency = cur ? ediVal(cur, 2) : 'USD';

    // Header-level refs
    var headerRefs = [];
    var it1Idx = segments.length;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'IT1') { it1Idx = i; break; }
    }
    for (var i = 0; i < it1Idx; i++) {
      if (segments[i].id === 'REF') headerRefs.push(segments[i]);
    }

    // N1 addresses (header level)
    var n1Start = 0;
    for (var i = 0; i < it1Idx; i++) {
      if (segments[i].id === 'N1') { n1Start = i; break; }
    }
    var addresses = buildAddressesFromN1(segments, n1Start, it1Idx);

    // ITD terms
    var itd = findSeg(segments, 'ITD');

    // IT1 line items
    var lineItems = [];
    var currentLine = null;
    for (var i = it1Idx; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.id === 'IT1') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = {
          lineNum: ediVal(seg, 1),
          qty: ediVal(seg, 2),
          uom: ediVal(seg, 3),
          price: ediVal(seg, 4),
          partIds: [],
          pid: [],
          tax: [],
          sac: []
        };
        for (var j = 6; j < seg.elements.length - 1; j += 2) {
          var qual = seg.elements[j], val = seg.elements[j + 1];
          if (qual && val) currentLine.partIds.push({ qualifier: qual, value: val });
        }
      } else if (seg.id === 'PID' && currentLine) {
        currentLine.pid.push(ediVal(seg, 5) || ediVal(seg, 4));
      } else if (seg.id === 'TXI' && currentLine) {
        currentLine.tax.push({ type: ediVal(seg, 1), amount: ediVal(seg, 2), rate: ediVal(seg, 6) });
      } else if (seg.id === 'SAC' && currentLine) {
        currentLine.sac.push({ indicator: ediVal(seg, 1), code: ediVal(seg, 2), amount: ediVal(seg, 5) });
      } else if (seg.id === 'TDS' || seg.id === 'CTT' || seg.id === 'SE') {
        if (currentLine) lineItems.push(currentLine);
        currentLine = null;
        if (seg.id !== 'TDS') break;
      }
    }

    // Summary totals
    var tds = findSeg(segments, 'TDS');
    var totalAmount = tds ? (parseFloat(ediVal(tds, 1)) / 100).toFixed(2) : '0.00';

    // Summary tax
    var summaryTax = [];
    var foundTds = false;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].id === 'TDS') foundTds = true;
      if (foundTds && segments[i].id === 'TXI') {
        summaryTax.push({ type: ediVal(segments[i], 1), amount: ediVal(segments[i], 2), rate: ediVal(segments[i], 6) });
      }
      if (foundTds && segments[i].id === 'CTT') break;
    }

    var lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.050/cXML.dtd">');
    lines.push('<cXML version="1.2.050" payloadID="' + esc(env.payloadId) + '" timestamp="' + esc(env.timestamp) + '">');
    lines.push('  <Header>');
    lines.push('    <From>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </From>');
    lines.push('    <To>');
    lines.push('      <Credential domain="' + esc(env.senderQual) + '">');
    lines.push('        <Identity>' + esc(env.senderId) + '</Identity>');
    lines.push('      </Credential>');
    lines.push('    </To>');
    lines.push('    <Sender>');
    lines.push('      <Credential domain="' + esc(env.receiverQual) + '">');
    lines.push('        <Identity>' + esc(env.receiverId) + '</Identity>');
    lines.push('        <SharedSecret>' + esc(env.gsAppReceiver) + '</SharedSecret>');
    lines.push('      </Credential>');
    lines.push('      <UserAgent>AIA cXML Guide Engine</UserAgent>');
    lines.push('    </Sender>');
    lines.push('  </Header>');
    lines.push('  <Request>');
    lines.push('    <InvoiceDetailRequest>');
    lines.push('      <InvoiceDetailRequestHeader invoiceID="' + esc(invoiceID) + '" invoiceDate="' + esc(invoiceDate) + '" purpose="standard" operation="new">');
    lines.push('        <InvoiceDetailHeaderIndicator/>');

    // InvoicePartners
    var remitTo = addresses['RE'] || addresses['SE'];
    if (remitTo) {
      lines.push('        <InvoicePartner>');
      lines.push('          <Contact role="remitTo">');
      lines.push('            <Name xml:lang="en">' + esc(remitTo.name) + '</Name>');
      lines.push('            <PostalAddress>');
      remitTo.street.forEach(function(s) { lines.push('              <Street>' + esc(s) + '</Street>'); });
      if (remitTo.city) lines.push('              <City>' + esc(remitTo.city) + '</City>');
      if (remitTo.state) lines.push('              <State>' + esc(remitTo.state) + '</State>');
      if (remitTo.zip) lines.push('              <PostalCode>' + esc(remitTo.zip) + '</PostalCode>');
      lines.push('              <Country isoCountryCode="' + esc(remitTo.country || 'US') + '">' + esc(remitTo.country || 'US') + '</Country>');
      lines.push('            </PostalAddress>');
      lines.push('          </Contact>');
      lines.push('        </InvoicePartner>');
    }

    // Payment terms
    if (itd) {
      lines.push('        <PaymentTerm payInNumberOfDays="' + esc(ediVal(itd, 7) || ediVal(itd, 5) || '30') + '"/>');
    }

    headerRefs.forEach(function(ref) {
      lines.push('        <Extrinsic name="' + esc(ediVal(ref, 1)) + '">' + esc(ediVal(ref, 2)) + '</Extrinsic>');
    });

    lines.push('      </InvoiceDetailRequestHeader>');

    // InvoiceDetailOrder
    lines.push('      <InvoiceDetailOrder>');
    lines.push('        <InvoiceDetailOrderInfo>');
    lines.push('          <OrderReference orderID="' + esc(poNumber) + '"/>');
    lines.push('        </InvoiceDetailOrderInfo>');

    lineItems.forEach(function(li) {
      var suppPart = '', buyPart = '';
      li.partIds.forEach(function(p) {
        if (p.qualifier === 'VP' || p.qualifier === 'VN') suppPart = p.value;
        else if (p.qualifier === 'BP' || p.qualifier === 'IN') buyPart = p.value;
      });
      var lineTotal = ((parseFloat(li.qty) || 0) * (parseFloat(li.price) || 0)).toFixed(2);
      lines.push('        <InvoiceDetailItem invoiceLineNumber="' + esc(li.lineNum) + '" quantity="' + esc(li.qty) + '">');
      lines.push('          <UnitPrice>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(li.price) + '</Money>');
      lines.push('          </UnitPrice>');
      lines.push('          <ItemID>');
      if (suppPart) lines.push('            <SupplierPartID>' + esc(suppPart) + '</SupplierPartID>');
      if (buyPart) lines.push('            <BuyerPartID>' + esc(buyPart) + '</BuyerPartID>');
      lines.push('          </ItemID>');
      var desc = li.pid.join(' ') || 'Item ' + li.lineNum;
      lines.push('          <Description xml:lang="en">' + esc(desc) + '</Description>');
      lines.push('          <UnitOfMeasure>' + esc(li.uom) + '</UnitOfMeasure>');
      lines.push('          <SubtotalAmount>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(lineTotal) + '</Money>');
      lines.push('          </SubtotalAmount>');
      // Line tax
      if (li.tax.length > 0) {
        lines.push('          <Tax>');
        li.tax.forEach(function(t) {
          lines.push('            <TaxDetail category="' + esc(t.type) + '" percentageRate="' + esc(t.rate || '0') + '">');
          lines.push('              <TaxAmount>');
          lines.push('                <Money currency="' + esc(currency) + '">' + esc(t.amount) + '</Money>');
          lines.push('              </TaxAmount>');
          lines.push('            </TaxDetail>');
        });
        lines.push('          </Tax>');
      }
      lines.push('          <GrossAmount>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(lineTotal) + '</Money>');
      lines.push('          </GrossAmount>');
      lines.push('          <NetAmount>');
      lines.push('            <Money currency="' + esc(currency) + '">' + esc(lineTotal) + '</Money>');
      lines.push('          </NetAmount>');
      lines.push('        </InvoiceDetailItem>');
    });

    lines.push('      </InvoiceDetailOrder>');

    // Summary
    lines.push('      <InvoiceDetailSummary>');
    if (summaryTax.length > 0) {
      lines.push('        <Tax>');
      summaryTax.forEach(function(t) {
        lines.push('          <TaxDetail category="' + esc(t.type) + '" percentageRate="' + esc(t.rate || '0') + '">');
        lines.push('            <TaxAmount>');
        lines.push('              <Money currency="' + esc(currency) + '">' + esc(t.amount) + '</Money>');
        lines.push('            </TaxAmount>');
        lines.push('          </TaxDetail>');
      });
      lines.push('        </Tax>');
    }
    lines.push('        <SubtotalAmount>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </SubtotalAmount>');
    lines.push('        <GrossAmount>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </GrossAmount>');
    lines.push('        <NetAmount>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </NetAmount>');
    lines.push('        <DueAmount>');
    lines.push('          <Money currency="' + esc(currency) + '">' + esc(totalAmount) + '</Money>');
    lines.push('        </DueAmount>');
    lines.push('      </InvoiceDetailSummary>');

    lines.push('    </InvoiceDetailRequest>');
    lines.push('  </Request>');
    lines.push('</cXML>');

    return lines.join('\n');
  }

  /* ===== MAIN CONVERSION DISPATCHER ===== */

  /**
   * Convert EDI to cXML. Detects doc type and dispatches to the correct converter.
   * @param {string} ediText - Raw EDI X12 content
   * @returns {{ cxml: string, docType: string }}
   */
  function convertEdiToCxml(ediText) {
    var segments = parseEdiSegments(ediText);
    var docType = detectDocTypeFromEdi(segments);

    var cxml;
    switch (docType) {
      case 'po':  cxml = convertPoToCxml(segments); break;
      case 'poc': cxml = convertPocToCxml(segments); break;
      case 'oc':  cxml = convertOcToCxml(segments); break;
      case 'asn': cxml = convertAsnToCxml(segments); break;
      case 'gr':  cxml = convertGrToCxml(segments); break;
      case 'inv': cxml = convertInvToCxml(segments); break;
      default:    cxml = convertPoToCxml(segments); break;
    }

    return { cxml: cxml, docType: docType };
  }

  /* ===== cXML → GUIDE ROWS ===== */

  /**
   * Generate guide rows from cXML text.
   * Each row = [cXML line (as-is), explanation]
   * @param {string} xmlText - cXML content (original or converted from EDI)
   * @returns {Array<[string, string]>}
   */
  function generateGuideRows(xmlText) {
    var rows = [];
    var xmlLines = xmlText.split('\n');

    xmlLines.forEach(function(line) {
      var trimmed = line.trimEnd();
      if (!trimmed) return; // skip blank lines

      var explanation = generateExplanation(trimmed);
      rows.push([trimmed, explanation]);
    });

    return rows;
  }

  /**
   * Generate explanation for a single cXML line
   */
  function generateExplanation(line) {
    var trimmed = line.trim();

    // XML declaration
    if (trimmed.startsWith('<?xml')) {
      return 'XML declaration — specifies version 1.0 and UTF-8 encoding';
    }
    // DOCTYPE
    if (trimmed.startsWith('<!DOCTYPE')) {
      return 'Document type declaration — references the cXML DTD at xml.cxml.org';
    }
    // Comment
    if (trimmed.startsWith('<!--')) {
      return 'XML comment — informational note in the document';
    }

    // Extract element name and attributes from opening tag
    var tagMatch = trimmed.match(/^<\/?([A-Za-z][A-Za-z0-9]*)/);
    if (!tagMatch) {
      // Text content node or other
      return 'Text content value';
    }

    var tagName = tagMatch[1];
    var isClosing = trimmed.startsWith('</');

    if (isClosing) {
      var baseDesc = ELEMENT_DESC[tagName] || '';
      return 'End of ' + tagName + (baseDesc ? ' — ' + baseDesc : '');
    }

    // Opening tag — build explanation from element + attributes
    var parts = [];

    // Element description
    var elemDesc = ELEMENT_DESC[tagName];
    if (elemDesc) {
      parts.push(elemDesc);
    } else {
      parts.push(tagName + ' element');
    }

    // Extract attributes and their values
    var attrRegex = /([a-zA-Z:_][a-zA-Z0-9:._-]*)\s*=\s*"([^"]*)"/g;
    var attrMatch;
    var attrParts = [];
    while ((attrMatch = attrRegex.exec(trimmed)) !== null) {
      var attrName = attrMatch[1];
      var attrValue = attrMatch[2];
      var attrExpl = ATTR_DESC[attrName];
      if (attrExpl) {
        attrParts.push(attrName + '="' + attrValue + '" (' + attrExpl + ')');
      } else {
        attrParts.push(attrName + '="' + attrValue + '"');
      }
    }
    if (attrParts.length > 0) {
      parts.push('Attributes: ' + attrParts.join('; '));
    }

    // Extract text content if self-contained (e.g., <Money currency="USD">100.00</Money>)
    var contentMatch = trimmed.match(/>([^<]+)<\//);
    if (contentMatch) {
      var content = contentMatch[1].trim();
      if (content) {
        parts.push('Value: "' + content + '"');
      }
    }

    return parts.join(' — ');
  }

  /* ===== DETECT INPUT TYPE ===== */

  /**
   * Detect if input is cXML or EDI
   * @param {string} content - File content
   * @returns {'cxml'|'edi'}
   */
  function detectInputType(content) {
    var trimmed = content.trim();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<cXML') || trimmed.startsWith('<')) {
      // Check if it looks like XML
      if (/<[a-zA-Z]/.test(trimmed)) return 'cxml';
    }
    if (/^ISA[*|]/.test(trimmed) || /^ST[*|]/.test(trimmed) || /^GS[*|]/.test(trimmed)) {
      return 'edi';
    }
    // Fallback: if has < and > it's probably XML
    if (trimmed.indexOf('<') !== -1 && trimmed.indexOf('>') !== -1) return 'cxml';
    return 'edi';
  }

  /* ===== PUBLIC API ===== */
  return {
    convertEdiToCxml: convertEdiToCxml,
    generateGuideRows: generateGuideRows,
    detectInputType: detectInputType,
    detectDocTypeFromCxml: detectDocTypeFromCxml,
    detectDocTypeFromEdi: detectDocTypeFromEdi,
    parseEdiSegments: parseEdiSegments,
    ELEMENT_DESC: ELEMENT_DESC,
    ATTR_DESC: ATTR_DESC
  };
})();
