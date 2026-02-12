import { FoodRecommendation } from "../types";

const DB_NAME = 'GourmetGlobeDB';
const DB_VERSION = 1;
const STORE_NAME = 'favorites';

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create object store with 'name' as keyPath
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
  });
};

// Migrate data from localStorage if it exists
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    const localData = localStorage.getItem('gourmet_favorites');
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          await addFavorite(item);
        }
      }
      // Clear localStorage after successful migration to free up space
      localStorage.removeItem('gourmet_favorites');
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

export const getFavorites = async (): Promise<FoodRecommendation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as FoodRecommendation[]);
    request.onerror = () => reject(request.error);
  });
};

export const addFavorite = async (food: FoodRecommendation): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(food);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const removeFavorite = async (name: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};