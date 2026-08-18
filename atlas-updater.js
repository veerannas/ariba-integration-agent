/* atlas-updater.js — Atlas field updater, no DOM dependency */
(function(global) {
  'use strict';

  var BASE    = 'https://atlas.ariba.com/Atlas/api/data/v9.1';
  var SI_SET  = 'atlas_supplierintegrations';
  var BRP_SET = 'atlas_buyerregionalplaybooks';

  /* Optionset values — TCIS on SI */
  var OPT = { Yes: 670130001, No: 670130000 };

  /* BRP Order Type in Test Central optionset values */
  var BRP_ORDER_TYPE = {
    'Material PO': 670130000,
    'Service PO':  670130001,
    'Blanket PO':  670130002,
    'Other':       670130003
  };

  var HEADERS = {
    'Accept':           'application/json',
    'Content-Type':     'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version':    '4.0'
  };

  function apiGet(path) {
    return fetch(BASE + path, { credentials: 'include', headers: HEADERS })
      .then(function(r) {
        if (r.status === 401) throw { code: 401, message: 'Auth — open Atlas tab first' };
        if (!r.ok) throw { code: r.status, message: 'HTTP ' + r.status };
        return r.json();
      });
  }

  function apiPatch(path, body) {
    return fetch(BASE + path, {
      method:      'PATCH',
      credentials: 'include',
      headers:     HEADERS,
      body:        JSON.stringify(body)
    }).then(function(r) {
      if (r.status === 401) throw { code: 401, message: 'Auth — open Atlas tab first' };
      return r.status;
    });
  }

  /* Determine entity set and id field from record number prefix */
  function recordMeta(record) {
    if (/^SI-/i.test(record))  return { set: SI_SET,  idField: 'atlas_supplierintegrationid',       numField: 'atlas_projectnumber' };
    if (/^BRP-/i.test(record)) return { set: BRP_SET, idField: 'atlas_buyerregionalplaybookid',      numField: 'atlas_brprecordnumber' };
    return null;
  }

  /* Build PATCH body.
     SI  → atlas_testcentralinscope (optionset)
     BRP → atlas_ordertypeintestcentral (optionset) + atlas_cigtestcaseupload (boolean) */
  function buildPatchBody(record, fields) {
    var body = {};
    if (/^SI-/i.test(record)) {
      if (fields.tcis && OPT[fields.tcis] !== undefined)
        body.atlas_testcentralinscope = OPT[fields.tcis];
    }
    if (/^BRP-/i.test(record)) {
      if (fields.tce && BRP_ORDER_TYPE[fields.tce] !== undefined)
        body.atlas_ordertypeintestcentral = BRP_ORDER_TYPE[fields.tce];
      if (fields.tceEnabled === 'Yes')
        body.atlas_cigtestcaseupload = true;
      else if (fields.tceEnabled === 'No')
        body.atlas_cigtestcaseupload = false;
    }
    return body;
  }

  /* Resolve record number → GUID */
  function resolveGuid(record, meta) {
    var filter = encodeURIComponent(meta.numField + " eq '" + record + "'");
    return apiGet('/' + meta.set + '?$select=' + meta.idField + '&$filter=' + filter)
      .then(function(data) {
        var rows = data && data.value;
        return rows && rows.length ? rows[0][meta.idField] : null;
      });
  }

  /* Read back current field values after patch */
  function readBack(guid, meta, record) {
    var select = /^BRP-/i.test(record)
      ? 'atlas_ordertypeintestcentral,atlas_cigtestcaseupload'
      : 'atlas_testcentralinscope';
    return apiGet('/' + meta.set + '(' + guid + ')?$select=' + select)
      .then(function(data) {
        return {
          tcis:       data.atlas_testcentralinscope,
          tce:        data.atlas_ordertypeintestcentral,
          tceEnabled: /^BRP-/i.test(record) ? !!data.atlas_cigtestcaseupload : undefined
        };
      });
  }

  /* Update one record. fields = {tcis:'Yes'|'No'|'', tce:'Yes'|'No'|''} */
  function updateRecord(record, fields) {
    var meta = recordMeta(record);
    if (!meta) return Promise.resolve({ si: record, ok: false, error: 'Unknown record format' });

    var body = buildPatchBody(record, fields);
    if (!Object.keys(body).length) {
      return Promise.resolve({ si: record, ok: false, error: 'No fields to update' });
    }

    return resolveGuid(record, meta)
      .then(function(guid) {
        if (!guid) return { si: record, guid: null, ok: false, error: 'Not found' };
        return apiPatch('/' + meta.set + '(' + guid + ')', body)
          .then(function(code) {
            return readBack(guid, meta, record).then(function(actual) {
              return { si: record, guid: guid, code: code, readBack: actual, ok: code === 204 };
            });
          });
      })
      .catch(function(err) {
        return { si: record, ok: false, error: err.message || String(err), code: err.code };
      });
  }

  /* Bulk update, sequential, calls onProgress({done,total,result}) after each */
  function bulkUpdate(recordList, fields, onProgress) {
    var results = [];
    var total = recordList.length;
    return recordList.reduce(function(chain, record, i) {
      return chain.then(function() {
        return updateRecord(record, fields).then(function(result) {
          results.push(result);
          if (typeof onProgress === 'function') {
            onProgress({ done: i + 1, total: total, result: result });
          }
        });
      });
    }, Promise.resolve()).then(function() { return results; });
  }

  global.AtlasUpdater = { updateRecord: updateRecord, bulkUpdate: bulkUpdate, OPT: OPT };

}(typeof globalThis !== 'undefined' ? globalThis : self));
