/**
 * Cache persistence example
 *
 * @description Demonstrates persisting cache to IndexedDB or localStorage
 * @example
 * ```typescript
 * import { createClient } from '@oxog/queryflow';
 * import { offlineSync } from '@oxog/queryflow/plugins';
 *
 * const client = createClient({ baseUrl: '/api' });
 * client.use(offlineSync({
 *   storage: 'indexeddb',
 *   syncOnReconnect: true,
 * }));
 * ```
 */
import { createClient } from '@oxog/queryflow';
import { offlineSyncPlugin } from '@oxog/queryflow/plugins';

// Create client with offline sync enabled
const client = createClient({ baseUrl: '/api' });

// Enable IndexedDB persistence
client.use(
  offlineSyncPlugin({
    storage: 'indexeddb',
    dbName: 'queryflow-app-cache',
    syncOnReconnect: true,
    conflictResolution: 'server-wins',
  })
);

/**
 * With offline sync enabled:
 * 1. All cache data is automatically persisted to IndexedDB
 * 2. Cache survives page reloads and browser restarts
 * 3. App works fully offline with cached data
 * 4. Mutations are queued when offline and synced when online
 */

// Example: Fetch users - data will be cached and persisted
async function loadUsers() {
  const { query } = await import('@oxog/queryflow');
  const users = query('/users');
  const data = await users.fetch();
  console.log('Users loaded and cached:', data);
  return data;
}

// Example: Check cache status
function getCacheStatus() {
  const status = client.offline?.getStatus();
  console.log('Cache status:', {
    isOnline: status?.isOnline,
    pendingMutations: status?.pendingMutations,
    lastSync: status?.lastSync,
  });
  return status;
}

// Example: Manual sync trigger
async function triggerSync() {
  if (client.offline) {
    await client.offline.sync();
    console.log('Manual sync completed');
  }
}

// Example: Clear persisted cache
async function clearPersistedCache() {
  client.cache.clear();
  console.log('Cache cleared');
}

// Alternative: localStorage persistence (simpler, smaller data)
function createLocalStorageClient() {
  const lsClient = createClient({ baseUrl: '/api' });

  lsClient.use(
    offlineSyncPlugin({
      storage: 'localstorage',
      syncOnReconnect: true,
    })
  );

  return lsClient;
}

// Example: Hydrate cache from persisted storage on app start
async function initializeApp() {
  // Cache is automatically hydrated from IndexedDB
  // when the client is created with offlineSync

  // You can check if there's persisted data
  const cachedUsers = client.cache.get('/users');
  if (cachedUsers) {
    console.log('Loaded cached users from IndexedDB');
    // Render immediately with cached data
  }

  // Then fetch fresh data in background
  try {
    await loadUsers();
    console.log('Refreshed with server data');
  } catch (error) {
    console.log('Using cached data (offline or error)');
  }
}

export { client, loadUsers, getCacheStatus, triggerSync, clearPersistedCache, createLocalStorageClient, initializeApp };
