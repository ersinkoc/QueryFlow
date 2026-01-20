/**
 * Automatic sync when coming back online
 *
 * @description Demonstrates background sync functionality when network reconnects
 * @example
 * ```typescript
 * import { createClient } from '@oxog/queryflow';
 * import { offlineSync } from '@oxog/queryflow/plugins';
 *
 * const client = createClient({ baseUrl: '/api' });
 * client.use(offlineSync({
 *   syncOnReconnect: true,
 *   onSyncComplete: (results) => console.log('Synced:', results),
 * }));
 * ```
 */
import { createClient } from '@oxog/queryflow';
import { offlineSyncPlugin } from '@oxog/queryflow/plugins';

interface SyncResult {
  succeeded: number;
  failed: number;
  errors: Error[];
}

// Create client with sync-on-reconnect enabled
const client = createClient({ baseUrl: '/api' });

client.use(
  offlineSyncPlugin({
    storage: 'indexeddb',
    syncOnReconnect: true,

    // Callback when sync starts
    onSyncStart: () => {
      console.log('Sync started...');
      showSyncIndicator();
    },

    // Callback when sync completes
    onSyncComplete: (results: SyncResult) => {
      console.log('Sync complete!');
      console.log(`- Succeeded: ${results.succeeded}`);
      console.log(`- Failed: ${results.failed}`);

      hideSyncIndicator();

      if (results.failed > 0) {
        showSyncWarning(`${results.failed} changes failed to sync`);
      } else {
        showSyncSuccess(`${results.succeeded} changes synced`);
      }
    },

    // Callback on sync error
    onSyncError: (error: Error) => {
      console.error('Sync failed:', error);
      hideSyncIndicator();
      showSyncError(error.message);
    },
  })
);

// Monitor online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online! Sync will start automatically.');
    updateNetworkStatus('online');
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline. Changes will be queued.');
    updateNetworkStatus('offline');
  });
}

// Check current sync status
function checkSyncStatus() {
  const status = client.offline?.getStatus();

  if (status) {
    console.log('Sync Status:');
    console.log(`- Online: ${status.isOnline}`);
    console.log(`- Pending mutations: ${status.pendingMutations}`);
    console.log(`- Last sync: ${status.lastSync?.toISOString() ?? 'Never'}`);
  }

  return status;
}

// Manual sync trigger (if needed)
async function triggerManualSync() {
  if (!client.offline) {
    console.log('Offline sync not enabled');
    return;
  }

  const status = client.offline.getStatus();
  if (!status?.isOnline) {
    console.log('Cannot sync - currently offline');
    return;
  }

  console.log('Triggering manual sync...');
  await client.offline.sync();
}

// Retry failed mutations
async function retryFailedMutations() {
  if (!client.offline) return;

  console.log('Retrying failed mutations...');
  await client.offline.retryFailed();
}

// Clear pending mutations (use with caution)
function clearPendingMutations() {
  if (!client.offline) return;

  console.log('Clearing pending mutations...');
  client.offline.clearPending();
}

// UI helper functions (implement based on your UI framework)
function showSyncIndicator() {
  console.log('[UI] Showing sync spinner');
}

function hideSyncIndicator() {
  console.log('[UI] Hiding sync spinner');
}

function showSyncSuccess(message: string) {
  console.log('[UI] Success:', message);
}

function showSyncWarning(message: string) {
  console.log('[UI] Warning:', message);
}

function showSyncError(message: string) {
  console.log('[UI] Error:', message);
}

function updateNetworkStatus(status: 'online' | 'offline') {
  console.log('[UI] Network status:', status);
}

export { client, checkSyncStatus, triggerManualSync, retryFailedMutations, clearPendingMutations };
