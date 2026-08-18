/* tc-test-plan.js — generate Test Central Test Plan Excel using xlsx-js-style */
(function(global) {
  'use strict';

  var DOC_TYPES = ['OC', 'ASN', 'INV', 'Credit Memo'];

  function generate(scenarios, recordNum) {
    var XS = global.XlsxJsStyle;
    if (!XS) throw new Error('xlsx-js-style not loaded');

    var wb = XS.utils.book_new();

    /* ── Test Plan overview sheet ──────────────────────────────── */
    var today = (function() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();

    var aoa = [
      ['SAP Business Network — Test Central Integration Test Plan'],
      ['Record', recordNum || '', 'Generated', today, '', ''],
      [],
      ['#', 'Scenario', 'Description', 'OC', 'ASN', 'INV', 'Credit Memo']
    ];
    scenarios.forEach(function(sc, i) {
      aoa.push([i + 1, sc.name, sc.description, 'Pending', 'Pending', 'Pending', 'Pending']);
    });

    var ws = XS.utils.aoa_to_sheet(aoa);

    /* styles */
    var sTitle = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0070F2' } }, alignment: { horizontal: 'left' } };
    var sHdr   = { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '005DB2' } } };
    var sMeta  = { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: 'EFF6FF' } } };

    if (ws['A1']) ws['A1'].s = sTitle;
    if (ws['A2']) ws['A2'].s = sMeta;
    ['A4','B4','C4','D4','E4','F4','G4'].forEach(function(ref, i) {
      var labels = ['#','Scenario','Description','OC','ASN','INV','Credit Memo'];
      if (ws[ref]) { ws[ref].v = labels[i]; ws[ref].s = sHdr; }
      else { ws[ref] = { v: labels[i], t: 's', s: sHdr }; }
    });

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    ws['!cols'] = [{ wch: 4 }, { wch: 24 }, { wch: 45 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];

    XS.utils.book_append_sheet(wb, ws, 'Test Plan');

    /* ── One sheet per scenario with cXML content ─────────────── */
    scenarios.forEach(function(sc, idx) {
      if (!sc.cxml) return;
      var lines = sc.cxml.split('\n').map(function(l, i) { return [i + 1, l]; });
      var scWs  = XS.utils.aoa_to_sheet(lines);
      scWs['!cols'] = [{ wch: 5 }, { wch: 140 }];
      var name  = sc.name.replace(/[/\\?*[\]:]/g, '_').slice(0, 28);
      XS.utils.book_append_sheet(wb, scWs, (idx + 1) + '. ' + name);
    });

    var buf = XS.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  global.TCTestPlan = { generate: generate, DOC_TYPES: DOC_TYPES };

}(typeof globalThis !== 'undefined' ? globalThis : self));
