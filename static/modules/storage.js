/**
 * OmniStudy Dual-Persistence Engine
 * Combines localStorage (instant sync state) + IndexedDB (binary blobs) + Server Sync
 * Protects against sudden window close or browser crash.
 */

const DB_NAME = 'omnistudy_db';
const DB_VERSION = 1;
const BLOB_STORE = 'media_blobs';

let dbInstance = null;

export async function initStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB initialization fallback:', e);
      resolve(null);
    };
  });
}

/**
 * Save state synchronously into localStorage and trigger async cloud/server sync
 */
export function saveState(key, data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(`omnistudy_${key}`, serialized);
    
    // Background sync to backend if available
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: data })
    }).catch(() => {}); // silent fail for offline
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

/**
 * Load state from localStorage
 */
export function loadState(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(`omnistudy_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error('Storage load error:', err);
    return defaultValue;
  }
}

/**
 * Store heavy binary data (Audio blobs, Passport photos, Compiled PDFs) into IndexedDB
 */
export async function storeBlob(id, blob, meta = {}) {
  if (!dbInstance) await initStorage();
  if (!dbInstance) return null;

  return new Promise((resolve, reject) => {
    try {
      const tx = dbInstance.transaction(BLOB_STORE, 'readwrite');
      const store = tx.objectStore(BLOB_STORE);
      const record = {
        id,
        blob,
        meta,
        timestamp: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(id);
      req.onerror = (e) => reject(e);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Retrieve binary data from IndexedDB
 */
export async function getBlob(id) {
  if (!dbInstance) await initStorage();
  if (!dbInstance) return null;

  return new Promise((resolve) => {
    try {
      const tx = dbInstance.transaction(BLOB_STORE, 'readonly');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.get(id);
      req.onsuccess = (e) => resolve(e.target.result ? e.target.result.blob : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Delete binary data
 */
export async function deleteBlob(id) {
  if (!dbInstance) await initStorage();
  if (!dbInstance) return;

  return new Promise((resolve) => {
    try {
      const tx = dbInstance.transaction(BLOB_STORE, 'readwrite');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Setup sudden-close hook
 */
export function setupSuddenCloseProtection(collectStateFn) {
  const handleSave = () => {
    try {
      const liveSnapshot = collectStateFn();
      if (liveSnapshot) {
        localStorage.setItem('omnistudy_last_live_snapshot', JSON.stringify({
          data: liveSnapshot,
          savedAt: Date.now()
        }));
      }
    } catch (e) {
      console.warn('Sudden close snapshot capture failed', e);
    }
  };

  window.addEventListener('beforeunload', handleSave);
  window.addEventListener('pagehide', handleSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleSave();
    }
  });
}

/**
 * Get last saved live snapshot for instant state restoration
 */
export function getLastLiveSnapshot() {
  try {
    const raw = localStorage.getItem('omnistudy_last_live_snapshot');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
