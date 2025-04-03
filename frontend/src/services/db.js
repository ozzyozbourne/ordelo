// src/services/db.js
// IndexedDB database setup and operations

const DB_NAME = 'ordelo-recipe-cache';
const DB_VERSION = 1;
const RECIPES_STORE = 'recipes';
const SEARCH_STORE = 'searches';
const CUISINE_STORE = 'cuisines';

// Open database connection
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(RECIPES_STORE)) {
        const recipeStore = db.createObjectStore(RECIPES_STORE, { keyPath: 'id' });
        recipeStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(SEARCH_STORE)) {
        const searchStore = db.createObjectStore(SEARCH_STORE, { keyPath: 'query' });
        searchStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(CUISINE_STORE)) {
        const cuisineStore = db.createObjectStore(CUISINE_STORE, { keyPath: 'cuisine' });
        cuisineStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Generic function to add an item to a store
export const addItem = async (storeName, item) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Add timestamp for cache invalidation
    item.timestamp = Date.now();
    
    const request = store.put(item);
    
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => {
      console.error(`Error adding to ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => db.close();
  });
};

// Generic function to get an item from a store
export const getItem = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error(`Error getting from ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => db.close();
  });
};

// Generic function to get all items from a store
export const getAllItems = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error(`Error getting all from ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => db.close();
  });
};

// Delete items older than a certain time
export const deleteOldItems = async (storeName, maxAgeMs) => {
  const db = await openDB();
  const cutoffTime = Date.now() - maxAgeMs;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    const request = index.openCursor(range);
    let deletedCount = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        deletedCount++;
        cursor.continue();
      }
    };
    
    transaction.oncomplete = () => {
      db.close();
      resolve(deletedCount);
    };
    
    transaction.onerror = (event) => {
      console.error(`Error deleting old items from ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
  });
};

// Export store names for easy access
export const STORES = {
  RECIPES: RECIPES_STORE,
  SEARCHES: SEARCH_STORE,
  CUISINES: CUISINE_STORE
};
