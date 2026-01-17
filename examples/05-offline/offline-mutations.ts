import { createClient, mutation, offlineSync } from '@oxog/queryflow/plugins';
import { createClient as createBaseClient } from '@oxog/queryflow';

const client = createBaseClient({ baseUrl: 'https://api.example.com' });

// Enable offline support
client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,
  conflictResolution: 'server-wins',
}));

const createPost = mutation('/posts', {
  method: 'POST',
  offlineSupport: true,
});

async function main() {
  // Works even when offline
  await createPost.mutate({
    title: 'Offline Post',
    body: 'This was created offline',
  });

  // Check offline status
  const status = client.offline.getStatus();
  console.log('Offline status:', status);
}

main().catch(console.error);
