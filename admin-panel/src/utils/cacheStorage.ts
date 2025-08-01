// Cache Storage Utility - localStorage ve IndexedDB desteği

interface CacheData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

class CacheStorage {
  private dbName = 'WoontegraCache';
  private dbVersion = 1;
  private storeName = 'cache';

  // localStorage ile cache kaydet
  async setLocalStorage(key: string, data: any): Promise<boolean> {
    try {
      const cacheData: CacheData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 saat
      };
      
      localStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('localStorage kaydetme hatası:', error);
      return false;
    }
  }

  // localStorage'dan cache oku
  async getLocalStorage(key: string): Promise<any | null> {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      
      // Cache süresi kontrolü
      if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('localStorage okuma hatası:', error);
      return null;
    }
  }

  // IndexedDB ile cache kaydet
  async setIndexedDB(key: string, data: any): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const cacheData: CacheData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 saat
      };

      return new Promise((resolve, reject) => {
        const request = store.put(cacheData);
        
        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.warn('IndexedDB kaydetme hatası:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('IndexedDB kaydetme hatası:', error);
      return false;
    }
  }

  // IndexedDB'den cache oku
  async getIndexedDB(key: string): Promise<any | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const cacheData = request.result as CacheData;
          
          if (!cacheData) {
            resolve(null);
            return;
          }

          // Cache süresi kontrolü
          if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
            this.deleteIndexedDB(key);
            resolve(null);
            return;
          }

          resolve(cacheData.data);
        };

        request.onerror = () => {
          console.warn('IndexedDB okuma hatası:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('IndexedDB okuma hatası:', error);
      return null;
    }
  }

  // IndexedDB'den cache sil
  async deleteIndexedDB(key: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.warn('IndexedDB silme hatası:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('IndexedDB silme hatası:', error);
      return false;
    }
  }

  // IndexedDB veritabanını aç
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Akıllı cache kaydetme - önce localStorage, başarısız olursa IndexedDB
  async set(key: string, data: any): Promise<boolean> {
    // Önce localStorage dene
    const localStorageSuccess = await this.setLocalStorage(key, data);
    
    if (localStorageSuccess) {
      return true;
    }

    // localStorage başarısız olursa IndexedDB dene
    console.log('localStorage dolu, IndexedDB kullanılıyor...');
    return await this.setIndexedDB(key, data);
  }

  // Akıllı cache okuma - önce localStorage, yoksa IndexedDB
  async get(key: string): Promise<any | null> {
    // Önce localStorage dene
    let data = await this.getLocalStorage(key);
    
    if (data !== null) {
      return data;
    }

    // localStorage'da yoksa IndexedDB dene
    console.log('localStorage\'da veri yok, IndexedDB kontrol ediliyor...');
    return await this.getIndexedDB(key);
  }

  // Cache temizle
  async delete(key: string): Promise<boolean> {
    localStorage.removeItem(key);
    await this.deleteIndexedDB(key);
    return true;
  }

  // Tüm cache'i temizle
  async clear(): Promise<boolean> {
    try {
      // localStorage temizle
      localStorage.clear();
      
      // IndexedDB temizle
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.warn('IndexedDB temizleme hatası:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('Cache temizleme hatası:', error);
      return false;
    }
  }
}

export const cacheStorage = new CacheStorage(); 