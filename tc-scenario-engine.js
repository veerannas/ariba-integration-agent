/* tc-scenario-engine.js — DOM-based cXML PO variant generator for Test Central */
(function(global) {
  'use strict';

  var SCENARIOS = [
    { id: 'sc1', name: 'Multi-Line Split',  description: 'First line item split into 3 equal lines — tests multi-line PO handling' },
    { id: 'sc2', name: 'No SupplierPartID', description: 'All SupplierPartID elements removed — buyer-only catalog reference' },
    { id: 'sc3', name: 'Ad-hoc Ship-To',   description: 'Ship-To name prefixed ADBUYER- — non-standard delivery address' }
  ];

  /* ── helpers ─────────────────────────────────────────────────── */
  function clone(xmlString) {
    return new DOMParser().parseFromString(xmlString, 'text/xml');
  }
  function serial(doc) {
    return new XMLSerializer().serializeToString(doc);
  }

  /* ── Scenario 1: split first ItemOut into 3 equal lines ──────── */
  function applyMultiLineSplit(doc) {
    var items = Array.from(doc.querySelectorAll('ItemOut'));
    if (!items.length) return doc;
    var first   = items[0];
    var qty     = parseFloat(first.getAttribute('quantity') || '3') || 3;
    var split   = Math.max(1, Math.floor(qty / 3));
    var parent  = first.parentNode;
    /* remove everything after first temporarily */
    var rest = items.slice(1);
    rest.forEach(function(it) { parent.removeChild(it); });
    /* replace first with three clones */
    var clones = [first.cloneNode(true), first.cloneNode(true), first.cloneNode(true)];
    clones.forEach(function(c, i) {
      c.setAttribute('quantity', String(split));
      c.setAttribute('lineNumber', String(i + 1));
    });
    parent.removeChild(first);
    clones.forEach(function(c) { parent.appendChild(c); });
    /* restore rest with incremented line numbers */
    rest.forEach(function(it, i) {
      it.setAttribute('lineNumber', String(clones.length + i + 1));
      parent.appendChild(it);
    });
    return doc;
  }

  /* ── Scenario 2: remove all SupplierPartID elements ─────────── */
  function applyNoSupplierPart(doc) {
    doc.querySelectorAll('SupplierPartID').forEach(function(el) {
      el.parentNode.removeChild(el);
    });
    return doc;
  }

  /* ── Scenario 3: prefix Ship-To address with ADBUYER- ────────── */
  function applyAdhocShipTo(doc) {
    var nameEl = doc.querySelector('ShipTo Address Name');
    if (nameEl && !nameEl.textContent.startsWith('ADBUYER-')) {
      nameEl.textContent = 'ADBUYER-' + nameEl.textContent;
    }
    var addrEl = doc.querySelector('ShipTo Address');
    if (addrEl) {
      var id = addrEl.getAttribute('addressID');
      if (id && !id.startsWith('ADBUYER-')) addrEl.setAttribute('addressID', 'ADBUYER-' + id);
    }
    return doc;
  }

  var APPLIERS = { sc1: applyMultiLineSplit, sc2: applyNoSupplierPart, sc3: applyAdhocShipTo };

  /* ── Public API ─────────────────────────────────────────────── */
  function build(baseXml, selectedIds) {
    var ids = selectedIds || ['sc1','sc2','sc3'];
    return ids.map(function(id) {
      var meta = SCENARIOS.find(function(s) { return s.id === id; });
      if (!meta) return null;
      try {
        var doc     = clone(baseXml);
        var applier = APPLIERS[id];
        if (applier) doc = applier(doc);
        return { id: id, name: meta.name, description: meta.description, cxml: serial(doc), ok: true };
      } catch(e) {
        return { id: id, name: meta.name, description: meta.description, ok: false, error: e.message };
      }
    }).filter(Boolean);
  }

  global.TCScenarioEngine = { build: build, SCENARIOS: SCENARIOS };

}(typeof globalThis !== 'undefined' ? globalThis : self));
