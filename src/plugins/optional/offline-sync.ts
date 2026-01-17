import type { Plugin, MutationOptions } from '../../types.js';
import type { Kernel } from '../../kernel.js';

interface OfflineContext {
  offline: OfflineManager;
}

interface QueuedMutation {
  id: string;
  url: string;
  variables: unknown;
  options: MutationOptions;
  timestamp: number;
}

export class OfflineManager {
  private db: IDBDatabase | null = null;
  private dbReady = false;
  private mutationQueue: QueuedMutation[] = [];

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('queryflow-offline', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('mutations')) {
          db.createObjectStore('mutations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.dbReady = true;
        this.loadQueuedMutations();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async queueMutation(
    url: string,
    variables: unknown,
    options: MutationOptions
  ): Promise<void> {
    await this.waitForDB();

    const mutation: QueuedMutation = {
      id: crypto.randomUUID(),
      url,
      variables,
      options,
      timestamp: Date.now(),
    };

    this.mutationQueue.push(mutation);
    await this.saveMutation(mutation);
  }

  async getQueuedMutations(): Promise<QueuedMutation[]> {
    await this.waitForDB();
    return [...this.mutationQueue];
  }

  async markMutationComplete(id: string): Promise<void> {
    await this.waitForDB();

    this.mutationQueue = this.mutationQueue.filter(m => m.id !== id);

    const tx = this.db!.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    store.delete(id);
  }

  async saveToCache(key: string, data: unknown): Promise<void> {
    await this.waitForDB();

    const tx = this.db!.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.put({ key, data, timestamp: Date.now() });
  }

  async getFromCache(key: string): Promise<unknown | undefined> {
    await this.waitForDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    await this.waitForDB();

    const tx = this.db!.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.clear();
  }

  getStatus(): { isOnline: boolean; pendingMutations: number } {
    return {
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      pendingMutations: this.mutationQueue.length,
    };
  }

  private async waitForDB(): Promise<void> {
    if (this.dbReady) return;

    let attempts = 0;
    const maxAttempts = 50;

    while (!this.dbReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.dbReady) {
      throw new Error('Database initialization timed out');
    }
  }

  private async saveMutation(mutation: QueuedMutation): Promise<void> {
    const tx = this.db!.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    store.put(mutation);
  }

  private async loadQueuedMutations(): Promise<void> {
    const tx = this.db!.transaction('mutations', 'readonly');
    const store = tx.objectStore('mutations');
    const request = store.getAll();

    request.onsuccess = () => {
      this.mutationQueue = request.result ?? [];
    };
  }
}

export const offlineSyncPlugin: Plugin<OfflineContext> = {
  name: 'offline-sync',
  version: '1.0.0',

  install(kernel: Kernel<OfflineContext>): void {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available, offline sync disabled');
      return;
    }

    const offlineManager = new OfflineManager();
    const context = kernel.getContext();

    context.offline = offlineManager;

    kernel.on('mutation:execute', async ({ url, variables, options }) => {
      if (options.offlineSupport && typeof navigator !== 'undefined' && !navigator.onLine) {
        await offlineManager.queueMutation(url, variables, options);
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', async () => {
        const mutations = await offlineManager.getQueuedMutations();

        for (const mutation of mutations) {
          try {
            await kernel.emitAsync('mutation:execute', mutation);
            await offlineManager.markMutationComplete(mutation.id);
          } catch (error) {
            kernel.emit('offline:sync-error', { mutation, error });
          }
        }
      });
    }
  },
};

export type { OfflineContext };
