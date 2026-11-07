/* Lớp lưu trữ trên trình duyệt. Thử lần lượt: IndexedDB, localStorage, bộ nhớ tạm (mất khi đóng trang, có cảnh báo).
 * Mọi hàm trả Promise. Có thể truyền môi trường giả (indexedDB, localStorage, navigator) để kiểm thử.
 * Chạy trong trình duyệt (globalThis.VTF_STORE) và Node (require). */
(function (root) {
  'use strict';

  var DB_NAME = 'vtf-tinh-diem';
  var S_HOSO = 'hoso';
  var S_META = 'meta';
  var LS_PREFIX = 'vtfTD.';
  var DRAFT_KEY = 'draft';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- Bộ nhớ tạm ---------- */
  function memoryBackend() {
    var hoso = {}; var meta = {};
    return {
      name: 'memory',
      list: function () { return Promise.resolve(Object.keys(hoso).map(function (k) { return clone(hoso[k]); })); },
      get: function (id) { return Promise.resolve(hoso[id] ? clone(hoso[id]) : null); },
      put: function (rec) { hoso[rec.id] = clone(rec); return Promise.resolve(); },
      remove: function (id) { delete hoso[id]; return Promise.resolve(); },
      clear: function () { hoso = {}; meta = {}; return Promise.resolve(); },
      getMeta: function (k) { return Promise.resolve(meta[k] ? clone(meta[k]) : null); },
      setMeta: function (k, v) { meta[k] = clone(v); return Promise.resolve(); },
      delMeta: function (k) { delete meta[k]; return Promise.resolve(); }
    };
  }

  /* ---------- localStorage ---------- */
  function lsBackend(ls) {
    function keys() {
      var out = [];
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf(LS_PREFIX + 'hoso.') === 0) out.push(k); }
      return out;
    }
    return {
      name: 'localstorage',
      list: function () {
        return Promise.resolve(keys().map(function (k) { try { return JSON.parse(ls.getItem(k)); } catch (e) { return null; } }).filter(Boolean));
      },
      get: function (id) { var s = ls.getItem(LS_PREFIX + 'hoso.' + id); return Promise.resolve(s ? JSON.parse(s) : null); },
      put: function (rec) {
        return new Promise(function (res, rej) {
          try { ls.setItem(LS_PREFIX + 'hoso.' + rec.id, JSON.stringify(rec)); res(); } catch (e) { rej(e); }
        });
      },
      remove: function (id) { ls.removeItem(LS_PREFIX + 'hoso.' + id); return Promise.resolve(); },
      clear: function () {
        keys().forEach(function (k) { ls.removeItem(k); });
        ls.removeItem(LS_PREFIX + 'meta.' + DRAFT_KEY);
        return Promise.resolve();
      },
      getMeta: function (k) { var s = ls.getItem(LS_PREFIX + 'meta.' + k); return Promise.resolve(s ? JSON.parse(s) : null); },
      setMeta: function (k, v) {
        return new Promise(function (res, rej) { try { ls.setItem(LS_PREFIX + 'meta.' + k, JSON.stringify(v)); res(); } catch (e) { rej(e); } });
      },
      delMeta: function (k) { ls.removeItem(LS_PREFIX + 'meta.' + k); return Promise.resolve(); }
    };
  }

  /* ---------- IndexedDB ---------- */
  function idbOpen(idb) {
    return new Promise(function (res, rej) {
      var q;
      try { q = idb.open(DB_NAME, 1); } catch (e) { rej(e); return; }
      q.onupgradeneeded = function () {
        var db = q.result;
        if (!db.objectStoreNames.contains(S_HOSO)) db.createObjectStore(S_HOSO, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(S_META)) db.createObjectStore(S_META, { keyPath: 'key' });
      };
      q.onsuccess = function () { res(q.result); };
      q.onerror = function () { rej(q.error || new Error('Không mở được IndexedDB')); };
      q.onblocked = function () { rej(new Error('IndexedDB bị chặn')); };
    });
  }
  function idbBackend(db) {
    function run(store, mode, fn) {
      return new Promise(function (res, rej) {
        var tx;
        try { tx = db.transaction(store, mode); } catch (e) { rej(e); return; }
        var st = tx.objectStore(store);
        var req = fn(st);
        var out;
        if (req) req.onsuccess = function () { out = req.result; };
        tx.oncomplete = function () { res(out); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error || new Error('Giao dịch bị hủy')); };
      });
    }
    return {
      name: 'indexeddb',
      list: function () { return run(S_HOSO, 'readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }); },
      get: function (id) { return run(S_HOSO, 'readonly', function (s) { return s.get(id); }).then(function (r) { return r || null; }); },
      put: function (rec) { return run(S_HOSO, 'readwrite', function (s) { return s.put(rec); }); },
      remove: function (id) { return run(S_HOSO, 'readwrite', function (s) { return s.delete(id); }); },
      clear: function () {
        return run(S_HOSO, 'readwrite', function (s) { return s.clear(); }).then(function () {
          return run(S_META, 'readwrite', function (s) { return s.clear(); });
        });
      },
      getMeta: function (k) { return run(S_META, 'readonly', function (s) { return s.get(k); }).then(function (r) { return r ? r.value : null; }); },
      setMeta: function (k, v) { return run(S_META, 'readwrite', function (s) { return s.put({ key: k, value: v }); }); },
      delMeta: function (k) { return run(S_META, 'readwrite', function (s) { return s.delete(k); }); }
    };
  }

  /* Ghi thử rồi xóa để chắc chắn lưu được (trình duyệt ẩn danh/chặn dữ liệu có thể mở được nhưng không ghi được). */
  function probe(be) {
    var rec = { id: '__probe__', probe: true };
    return be.put(rec).then(function () { return be.get('__probe__'); }).then(function (r) {
      if (!r) throw new Error('Không đọc lại được dữ liệu thử');
      return be.remove('__probe__');
    });
  }

  function createStore(env) {
    env = env || {};
    var backend = null;
    var info = { backend: 'none', persisted: null, warning: '' };

    function init() {
      var attempts = [];
      if (env.indexedDB) attempts.push(function () { return idbOpen(env.indexedDB).then(idbBackend); });
      if (env.localStorage) attempts.push(function () {
        return new Promise(function (res, rej) {
          try { env.localStorage.setItem(LS_PREFIX + 'probe', '1'); env.localStorage.removeItem(LS_PREFIX + 'probe'); res(lsBackend(env.localStorage)); } catch (e) { rej(e); }
        });
      });
      attempts.push(function () { return Promise.resolve(memoryBackend()); });

      function next(i) {
        return attempts[i]().then(function (be) {
          return probe(be).then(function () { return be; });
        }).catch(function () { return i + 1 < attempts.length ? next(i + 1) : memoryBackend(); });
      }
      return next(0).then(function (be) {
        backend = be;
        info.backend = be.name;
        if (be.name === 'memory') info.warning = 'Trình duyệt không cho lưu dữ liệu trên máy này. Hồ sơ sẽ mất khi đóng trang. Hãy mở công cụ bằng Chrome hoặc Edge bình thường (không dùng chế độ ẩn danh).';
        else if (be.name === 'localstorage') info.warning = 'Đang lưu bằng bộ nhớ dự phòng của trình duyệt (dung lượng nhỏ hơn).';
        var nav = env.navigator;
        if (nav && nav.storage && nav.storage.persist && be.name !== 'memory') {
          return Promise.resolve(nav.storage.persist()).then(function (ok) { info.persisted = !!ok; }, function () { info.persisted = null; });
        }
      }).then(function () { return info; });
    }

    function need() { if (!backend) throw new Error('Chưa gọi init()'); return backend; }
    return {
      init: init,
      info: function () { return info; },
      list: function () { return need().list(); },
      get: function (id) { return need().get(id); },
      put: function (rec) { return need().put(rec); },
      remove: function (id) { return need().remove(id); },
      clear: function () { return need().clear(); },
      getMeta: function (k) { return need().getMeta(k); },
      setMeta: function (k, v) { return need().setMeta(k, v); },
      getDraft: function () { return need().getMeta(DRAFT_KEY); },
      setDraft: function (d) { return need().setMeta(DRAFT_KEY, d); },
      clearDraft: function () { return need().delMeta(DRAFT_KEY); }
    };
  }

  var API = { createStore: createStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.VTF_STORE_API = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
