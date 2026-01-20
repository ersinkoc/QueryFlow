/**
 * Conflict resolution strategies for offline sync
 *
 * @description Demonstrates handling data conflicts when syncing offline changes
 * @example
 * ```typescript
 * import { createClient } from '@oxog/queryflow';
 * import { offlineSync } from '@oxog/queryflow/plugins';
 *
 * client.use(offlineSync({
 *   conflictResolution: 'server-wins', // or 'client-wins', 'manual'
 *   onConflict: (local, remote) => {
 *     // Custom merge strategy
 *     return { ...remote, ...local.unsyncedFields };
 *   },
 * }));
 * ```
 */
import { createClient } from '@oxog/queryflow';
import { offlineSyncPlugin } from '@oxog/queryflow/plugins';

interface DataRecord {
  id: string;
  version: number;
  updatedAt: string;
  [key: string]: unknown;
}

interface ConflictData {
  local: DataRecord;
  remote: DataRecord;
  unsyncedFields: string[];
}

// Strategy 1: Server Wins (default, safest)
function createServerWinsClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,
      conflictResolution: 'server-wins',
    })
  );

  // When conflict detected:
  // - Server data overwrites local data
  // - Local changes are lost
  // - Best for: read-heavy apps, when server is source of truth

  return client;
}

// Strategy 2: Client Wins
function createClientWinsClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,
      conflictResolution: 'client-wins',
    })
  );

  // When conflict detected:
  // - Local data overwrites server data
  // - Server changes are lost
  // - Best for: single-user apps, when offline changes are important

  return client;
}

// Strategy 3: Last Write Wins (timestamp-based)
function createLastWriteWinsClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,

      onConflict: (local: DataRecord, remote: DataRecord) => {
        const localTime = new Date(local.updatedAt).getTime();
        const remoteTime = new Date(remote.updatedAt).getTime();

        // Keep whichever was updated more recently
        if (localTime > remoteTime) {
          console.log('Using local (newer)');
          return local;
        } else {
          console.log('Using remote (newer)');
          return remote;
        }
      },
    })
  );

  return client;
}

// Strategy 4: Field-level Merge
function createMergeClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,

      onConflict: (local: DataRecord, remote: DataRecord, conflict: ConflictData) => {
        // Start with remote data (server truth)
        const merged = { ...remote };

        // Overlay local changes for fields that were modified offline
        for (const field of conflict.unsyncedFields) {
          merged[field] = local[field];
        }

        // Update metadata
        merged.version = Math.max(local.version, remote.version) + 1;
        merged.updatedAt = new Date().toISOString();

        console.log('Merged result:', merged);
        return merged;
      },
    })
  );

  return client;
}

// Strategy 5: Manual Resolution (UI prompt)
function createManualResolutionClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,
      conflictResolution: 'manual',

      onConflict: async (local: DataRecord, remote: DataRecord) => {
        // Show UI to user and wait for their choice
        const choice = await showConflictResolutionDialog(local, remote);

        switch (choice) {
          case 'keep-local':
            return local;
          case 'keep-remote':
            return remote;
          case 'merge':
            return {
              ...remote,
              ...local,
              version: Math.max(local.version, remote.version) + 1,
              _mergedAt: new Date().toISOString(),
            };
          default:
            // Default to server wins
            return remote;
        }
      },
    })
  );

  return client;
}

// Example conflict resolution dialog
async function showConflictResolutionDialog(
  local: DataRecord,
  remote: DataRecord
): Promise<'keep-local' | 'keep-remote' | 'merge'> {
  console.log('Conflict detected!');
  console.log('Local version:', local);
  console.log('Remote version:', remote);

  // In a real app, this would show a modal/dialog
  // For this example, we'll just return a default
  return 'merge';
}

// Strategy 6: Version-based Resolution
function createVersionBasedClient() {
  const client = createClient({ baseUrl: '/api' });

  client.use(
    offlineSyncPlugin({
      storage: 'indexeddb',
      syncOnReconnect: true,

      onConflict: (local: DataRecord, remote: DataRecord) => {
        // If versions match, it's a true conflict
        if (local.version === remote.version) {
          console.log('True conflict - versions match');
          // Use timestamp as tiebreaker
          const localTime = new Date(local.updatedAt).getTime();
          const remoteTime = new Date(remote.updatedAt).getTime();
          return localTime > remoteTime ? local : remote;
        }

        // If versions differ, server is ahead - reject local changes
        if (remote.version > local.version) {
          console.log('Server is ahead - using remote');
          return remote;
        }

        // Local is somehow ahead (shouldn't happen normally)
        console.log('Local is ahead - using local');
        return local;
      },
    })
  );

  return client;
}

export {
  createServerWinsClient,
  createClientWinsClient,
  createLastWriteWinsClient,
  createMergeClient,
  createManualResolutionClient,
  createVersionBasedClient,
};
