/**
 * TransactionStore — IndexedDB primary + chrome.storage.local metadata index
 * Stores retrieved cXML transactions with full payloads in IDB, lightweight index in chrome.storage.
 * Supports: PurchaseOrder, Invoice, ShipNotice (ASN), OrderConfirmation
 */
var TransactionStore = (function() {
  'use strict';

  var DB_NAME = 'AIA_Transactions';
  var DB_VERSION = 1;
  var STORE_NAME = 'transactions';
  var META_KEY = 'txn_index';
  var db = null;

  // Transaction types recognized by the system
  var TRANSACTION_TYPES = ['PurchaseOrder', 'Invoice', 'ShipNotice', 'OrderConfirmation'];

  function openDB() {
    return new Promise(function(resolve, reject) {
      if (db) return resolve(db);
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var idb = e.target.result;
        if (!idb.objectStoreNames.contains(STORE_NAME)) {
          var store = idb.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('docNumber', 'docNumber', { unique: false });
        }
      };
      req.onsuccess = function(e) { db = e.target.result; resolve(db); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  /**
   * Detect transaction type from cXML content
   * @param {string} cxmlContent - Raw cXML string
   * @returns {string} Transaction type
   */
  function detectType(cxmlContent) {
    if (!cxmlContent) return 'Unknown';
    if (/<OrderRequest/i.test(cxmlContent) || /<PurchaseOrder/i.test(cxmlContent)) return 'PurchaseOrder';
    if (/<InvoiceDetailRequest/i.test(cxmlContent) || /<InvoiceRequest/i.test(cxmlContent)) return 'Invoice';
    if (/<ShipNoticeRequest/i.test(cxmlContent) || /<ASNHeader/i.test(cxmlContent)) return 'ShipNotice';
    if (/<ConfirmationRequest/i.test(cxmlContent) || /<OrderConfirmation/i.test(cxmlContent)) return 'OrderConfirmation';
    if (/<cXML/i.test(cxmlContent)) return 'cXML-Other';
    return 'Unknown';
  }

  /**
   * Extract document number from cXML
   * @param {string} cxmlContent - Raw cXML string
   * @param {string} type - Transaction type
   * @returns {string} Document number or 'N/A'
   */
  function extractDocNumber(cxmlContent, type) {
    if (!cxmlContent) return 'N/A';
    var patterns = {
      'PurchaseOrder': [/orderID="([^"]+)"/, /<OrderRequestHeader[^>]*orderID="([^"]+)"/, /<BuyerOrderInfo><OrderNumber>([^<]+)</, /orderID="([^"]+)"/],
      'Invoice': [/invoiceID="([^"]+)"/, /<InvoiceDetailRequestHeader[^>]*invoiceID="([^"]+)"/],
      'ShipNotice': [/shipmentID="([^"]+)"/, /<ShipNoticeHeader[^>]*shipmentID="([^"]+)"/],
      'OrderConfirmation': [/confirmID="([^"]+)"/, /<ConfirmationHeader[^>]*confirmID="([^"]+)"/]
    };
    var tryPatterns = patterns[type] || [/payloadID="([^"]+)"/];
    for (var i = 0; i < tryPatterns.length; i++) {
      var m = cxmlContent.match(tryPatterns[i]);
      if (m && m[1]) return m[1];
    }
    // Fallback: payloadID
    var pid = cxmlContent.match(/payloadID="([^"]+)"/);
    return pid ? pid[1].substring(0, 20) : 'N/A';
  }

  /**
   * Extract date from cXML
   */
  function extractDate(cxmlContent) {
    var m = cxmlContent.match(/orderDate="([^"]+)"/) ||
            cxmlContent.match(/invoiceDate="([^"]+)"/) ||
            cxmlContent.match(/shipmentDate="([^"]+)"/) ||
            cxmlContent.match(/timestamp="([^"]+)"/) ||
            cxmlContent.match(/<Timestamp>([^<]+)</);
    if (m && m[1]) {
      try { return new Date(m[1]).toISOString(); } catch(e) { return m[1]; }
    }
    return new Date().toISOString();
  }

  /**
   * Extract amount/total from cXML
   */
  function extractAmount(cxmlContent, type) {
    var patterns = {
      'PurchaseOrder': /<Total><Money[^>]*>([^<]+)</,
      'Invoice': /<SubtotalAmount><Money[^>]*>([^<]+)</,
      'ShipNotice': null,
      'OrderConfirmation': /<Total><Money[^>]*>([^<]+)</
    };
    var p = patterns[type];
    if (!p) return null;
    var m = cxmlContent.match(p);
    return m ? parseFloat(m[1]) : null;
  }

  /**
   * Extract line item count
   */
  function extractLineCount(cxmlContent) {
    var lines = cxmlContent.match(/<ItemOut/g) || cxmlContent.match(/<InvoiceDetailItem/g) || cxmlContent.match(/<ShipNoticeItem/g) || [];
    return lines.length;
  }

  /**
   * Generate unique transaction ID
   */
  function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Save a transaction
   * @param {object} params
   * @param {string} params.cxml - Raw cXML content
   * @param {string} params.source - 'portal_scrape' | 'network_capture' | 'manual_upload' | 'webhook' | 'api'
   * @param {string} [params.filename] - Original filename (for uploads)
   * @param {object} [params.metadata] - Additional metadata
   * @returns {Promise<object>} Saved transaction metadata
   */
  function save(params) {
    var cxml = params.cxml;
    var source = params.source || 'unknown';
    var type = detectType(cxml);
    var docNumber = extractDocNumber(cxml, type);
    var date = extractDate(cxml);
    var amount = extractAmount(cxml, type);
    var lineCount = extractLineCount(cxml);

    var txn = {
      id: generateId(),
      type: type,
      docNumber: docNumber,
      date: date,
      amount: amount,
      lineCount: lineCount,
      source: source,
      filename: params.filename || null,
      timestamp: new Date().toISOString(),
      size: cxml.length,
      cxml: cxml,
      metadata: params.metadata || {}
    };

    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.put(txn);
        tx.oncomplete = function() { resolve(txn); };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    }).then(function(saved) {
      // Update chrome.storage metadata index (without cxml payload for fast access)
      return updateMetaIndex(saved);
    });
  }

  /**
   * Save multiple transactions at once
   */
  function saveMultiple(items) {
    return Promise.all(items.map(function(item) { return save(item); }));
  }

  /**
   * Update the lightweight metadata index in chrome.storage.local
   */
  function updateMetaIndex(txn) {
    return new Promise(function(resolve) {
      chrome.storage.local.get(META_KEY, function(data) {
        var index = data[META_KEY] || [];
        // Store metadata only (no cxml payload)
        index.push({
          id: txn.id,
          type: txn.type,
          docNumber: txn.docNumber,
          date: txn.date,
          amount: txn.amount,
          lineCount: txn.lineCount,
          source: txn.source,
          filename: txn.filename,
          timestamp: txn.timestamp,
          size: txn.size
        });
        var obj = {};
        obj[META_KEY] = index;
        chrome.storage.local.set(obj, function() { resolve(txn); });
      });
    });
  }

  /**
   * Get all transaction metadata (fast, from chrome.storage)
   */
  function getIndex() {
    return new Promise(function(resolve) {
      chrome.storage.local.get(META_KEY, function(data) {
        resolve(data[META_KEY] || []);
      });
    });
  }

  /**
   * Get full transaction with cXML content (from IndexedDB)
   * @param {string} id - Transaction ID
   */
  function getById(id) {
    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(id);
        req.onsuccess = function() { resolve(req.result || null); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Get all transactions of a specific type
   * @param {string} type - Transaction type
   */
  function getByType(type) {
    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var index = store.index('type');
        var req = index.getAll(type);
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Get all transactions (full payload)
   */
  function getAll() {
    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Delete a transaction by ID
   */
  function deleteById(id) {
    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = function() {
          // Remove from metadata index
          chrome.storage.local.get(META_KEY, function(data) {
            var index = (data[META_KEY] || []).filter(function(t) { return t.id !== id; });
            var obj = {};
            obj[META_KEY] = index;
            chrome.storage.local.set(obj, function() { resolve(true); });
          });
        };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Clear all transactions
   */
  function clearAll() {
    return openDB().then(function(idb) {
      return new Promise(function(resolve, reject) {
        var tx = idb.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = function() {
          var obj = {};
          obj[META_KEY] = [];
          chrome.storage.local.set(obj, function() { resolve(true); });
        };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Get storage stats
   */
  function getStats() {
    return getIndex().then(function(index) {
      var stats = { total: index.length, byType: {}, bySource: {}, totalSize: 0 };
      index.forEach(function(t) {
        stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
        stats.bySource[t.source] = (stats.bySource[t.source] || 0) + 1;
        stats.totalSize += t.size || 0;
      });
      return stats;
    });
  }

  // Public API
  return {
    save: save,
    saveMultiple: saveMultiple,
    getIndex: getIndex,
    getById: getById,
    getByType: getByType,
    getAll: getAll,
    deleteById: deleteById,
    clearAll: clearAll,
    getStats: getStats,
    detectType: detectType,
    extractDocNumber: extractDocNumber,
    extractDate: extractDate,
    TRANSACTION_TYPES: TRANSACTION_TYPES
  };
})();
