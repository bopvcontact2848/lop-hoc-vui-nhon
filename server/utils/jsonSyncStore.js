'use strict';

const fs = require('fs');
const path = require('path');

const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sanitizeDeletedIds(rawMap) {
  const out = {};
  if (!rawMap || typeof rawMap !== 'object') return out;
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  for (const [k, ts] of Object.entries(rawMap)) {
    const cleanId = String(k || '').trim().slice(0, 120);
    const num = Number(ts);
    if (cleanId && Number.isFinite(num) && num > cutoff) {
      out[cleanId] = num;
    }
  }
  return out;
}

/**
 * Bộ quản lý lưu trữ JSON đồng bộ 2 chiều (Atomic Write + Tombstone Merge) dùng chung cho Server Node.
 */
function createJsonSyncStore(opts) {
  const resolvedPath = path.resolve(opts.filePath);
  const itemsField = opts.itemsField || 'items';
  const maxItems = opts.maxItems || 200;
  const sanitizeItem = opts.sanitizeItem;
  const initExtra = typeof opts.initExtra === 'function' ? opts.initExtra : () => ({});

  function createEmptyStore() {
    return Object.assign(
      {
        version: 1,
        updatedAt: 0,
        [itemsField]: [],
        deletedIds: {}
      },
      initExtra({}, new Set())
    );
  }

  function loadFromDisk() {
    try {
      if (!fs.existsSync(resolvedPath)) return createEmptyStore();
      const rawText = fs.readFileSync(resolvedPath, 'utf8');
      if (!rawText.trim()) return createEmptyStore();
      const parsed = JSON.parse(rawText);
      const rawItems = Array.isArray(parsed[itemsField]) ? parsed[itemsField] : [];
      const items = rawItems.slice(0, maxItems).map(sanitizeItem).filter(Boolean);
      const validIds = new Set(items.map((item) => item.id));
      return Object.assign(
        {
          version: 1,
          updatedAt: Number(parsed.updatedAt) || 0,
          [itemsField]: items,
          deletedIds: sanitizeDeletedIds(parsed.deletedIds)
        },
        initExtra(parsed, validIds)
      );
    } catch (_err) {
      return createEmptyStore();
    }
  }

  const store = loadFromDisk();

  function saveToDisk() {
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
    const serialized = JSON.stringify(store, null, 2);
    const tmpPath = `${resolvedPath}.tmp_${process.pid}_${Date.now()}`;
    try {
      fs.writeFileSync(tmpPath, serialized, 'utf8');
      fs.renameSync(tmpPath, resolvedPath);
    } catch (_err) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (_cleanupErr) {}
      fs.writeFileSync(resolvedPath, serialized, 'utf8');
    }
  }

  function applySync(rawItems, mode) {
    const incoming = Array.isArray(rawItems)
      ? rawItems.slice(0, maxItems).map(sanitizeItem).filter(Boolean)
      : [];
    const deletedMap = sanitizeDeletedIds(store.deletedIds);

    if (mode === 'replace') {
      const nextIds = new Set(incoming.map((s) => s.id));
      store[itemsField].forEach((oldItem) => {
        if (!nextIds.has(oldItem.id)) deletedMap[oldItem.id] = Date.now();
      });
      store[itemsField] = incoming;
      store.deletedIds = deletedMap;
    } else {
      const mergedById = new Map();
      store[itemsField].forEach((existing) => mergedById.set(existing.id, existing));

      incoming.forEach((inc) => {
        const delAt = deletedMap[inc.id] || 0;
        if (delAt >= inc.updatedAt) return;
        if (delAt > 0 && inc.updatedAt > delAt) delete deletedMap[inc.id];
        const prev = mergedById.get(inc.id);
        if (!prev || inc.updatedAt >= prev.updatedAt) {
          mergedById.set(inc.id, inc);
        }
      });

      store[itemsField] = Array.from(mergedById.values())
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, maxItems);
      store.deletedIds = deletedMap;
    }

    store.updatedAt = Date.now();
    return new Set(store[itemsField].map((item) => item.id));
  }

  function deleteById(targetId) {
    store[itemsField] = store[itemsField].filter((item) => item.id !== targetId);
    store.deletedIds = sanitizeDeletedIds(store.deletedIds);
    store.deletedIds[targetId] = Date.now();
    store.updatedAt = Date.now();
  }

  return {
    resolvedPath,
    fileName: path.basename(resolvedPath),
    store,
    saveToDisk,
    applySync,
    deleteById
  };
}

module.exports = { createJsonSyncStore };
