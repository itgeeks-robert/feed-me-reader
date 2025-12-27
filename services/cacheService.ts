
const DB_NAME = 'SeeMoreCache';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported by this browser."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
            dbPromise = null; 
        };
        
        request.onblocked = () => {
            console.warn('IndexedDB is blocked. Please close other tabs with this app open.');
            reject(new Error('IndexedDB upgrade blocked by another tab.'));
            dbPromise = null;
        };
    });
    return dbPromise;
};

export const set = async (key: string, value: any): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(value, key);
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to set item in IndexedDB:", error);
    }
};

export const get = async <T>(key: string): Promise<T | undefined> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to get item from IndexedDB:", error);
        return undefined;
    }
};

export const getCacheCount = async (): Promise<number> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    } catch (e) {
        return 0;
    }
};
