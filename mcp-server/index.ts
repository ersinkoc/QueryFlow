import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';

// Documentation content
const docs = `
# QueryFlow Documentation

## Installation
\`\`\`bash
npm install @oxog/queryflow
\`\`\`

## Core Concepts

QueryFlow is a zero-dependency data fetching library with:
- Intelligent cache graph management
- Offline-first sync capabilities
- Real-time subscriptions (WebSocket, SSE, polling)
- Micro-kernel plugin architecture

## Core API

### createClient(config?)
Creates a QueryFlow client instance.

\`\`\`typescript
import { createClient } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  staleTime: 5000,
  cacheTime: 300000,
});
\`\`\`

### query(url, options?)
Creates a query instance for fetching data.

\`\`\`typescript
import { query } from '@oxog/queryflow';

const users = query('/users', {
  params: { id: '123' },
  staleTime: 5000,
});

const data = await users.fetch();
\`\`\`

### mutation(url, options?)
Creates a mutation instance for modifying data.

\`\`\`typescript
import { mutation } from '@oxog/queryflow';

const createUser = mutation('/users', {
  method: 'POST',
  optimistic: (cache, input) => {
    cache.update('/users', (users) => [...users, input]);
  },
});

await createUser.mutate({ name: 'John' });
\`\`\`

### subscribe(url, options?)
Creates a subscription for real-time updates.

\`\`\`typescript
import { subscribe } from '@oxog/queryflow';

const messages = subscribe('/chat', {
  transport: 'websocket',
  onMessage: (data) => console.log(data),
});
\`\`\`

## Cache API

- \`client.cache.get(key)\` - Get cached data
- \`client.cache.set(key, data)\` - Set cached data
- \`client.cache.update(key, updater)\` - Update with Immer-style callback
- \`client.cache.invalidate(pattern)\` - Invalidate queries matching pattern
- \`client.cache.clear()\` - Clear entire cache

## React Hooks

\`\`\`typescript
import { useQuery, useMutation, useSubscription } from '@oxog/queryflow/react';

function Component() {
  const { data, isLoading, error } = useQuery('/users');
  const { mutate, isPending } = useMutation('/users', { method: 'POST' });
  const { data: messages } = useSubscription('/chat', { transport: 'websocket' });
}
\`\`\`

## Plugins

- \`offlineSync\` - IndexedDB persistence with background sync
- \`realtime\` - WebSocket/SSE/polling support
- \`devtools\` - Time-travel debugging

## Error Handling

QueryFlow provides multiple error handling patterns:

1. Try-catch with async/await
2. Result pattern with fetchSafe()
3. Callbacks (onSuccess, onError, onSettled)
`;

// Examples organized by category
const examples: Record<string, Record<string, { name: string; description: string; code: string }>> = {
  basic: {
    'simple-query': {
      name: 'simple-query',
      description: 'Basic data fetching with query()',
      code: `import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Simple query
const users = query('/users');
const data = await users.fetch();
console.log(data);

// Query with safe error handling
const { data: safeData, error } = await users.fetchSafe();
if (error) {
  console.error('Failed:', error.message);
} else {
  console.log('Users:', safeData);
}`,
    },
    'query-with-params': {
      name: 'query-with-params',
      description: 'Query with URL parameters',
      code: `import { query } from '@oxog/queryflow';

// URL parameters are replaced in the template
const user = query('/users/:id', {
  params: { id: '123' },
});

const userData = await user.fetch();
// Fetches: /users/123`,
    },
    'query-with-search': {
      name: 'query-with-search',
      description: 'Query with search/query parameters',
      code: `import { query } from '@oxog/queryflow';

const users = query('/users', {
  searchParams: {
    page: 1,
    limit: 10,
    sort: 'name',
  },
});

const data = await users.fetch();
// Fetches: /users?page=1&limit=10&sort=name`,
    },
    'error-handling': {
      name: 'error-handling',
      description: 'Multiple error handling patterns',
      code: `import { query, QueryFlowError } from '@oxog/queryflow';

const users = query('/users');

// Pattern 1: Try-catch
try {
  const data = await users.fetch();
} catch (error) {
  if (error instanceof QueryFlowError) {
    console.error(error.code, error.message);
  }
}

// Pattern 2: Result pattern (no throws)
const { data, error } = await users.fetchSafe();
if (error) {
  console.error('Failed:', error.message);
}

// Pattern 3: Callbacks
const usersWithCallbacks = query('/users', {
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  onSettled: () => console.log('Done'),
});`,
    },
  },
  mutations: {
    'simple-mutation': {
      name: 'simple-mutation',
      description: 'Basic mutation for creating/updating data',
      code: `import { mutation } from '@oxog/queryflow';

const createUser = mutation('/users', {
  method: 'POST',
});

await createUser.mutate({ name: 'John', email: 'john@example.com' });

// With callbacks
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  params: { id: '123' },
  onSuccess: (data) => console.log('Updated:', data),
  onError: (error) => console.error('Failed:', error),
});`,
    },
    'optimistic-update': {
      name: 'optimistic-update',
      description: 'Optimistic UI updates with automatic rollback',
      code: `import { mutation } from '@oxog/queryflow';

const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    // Update cache immediately before server response
    cache.update('/users/:id', (draft) => Object.assign(draft, input));
  },
  onError: (error, variables, context) => {
    // Automatic rollback happens, add custom logic if needed
    console.error('Update failed, rolled back:', error);
  },
});

// UI updates instantly, rolls back on error
await updateUser.mutate({ name: 'Updated Name' });`,
    },
    'rollback-on-error': {
      name: 'rollback-on-error',
      description: 'Custom rollback handling on mutation error',
      code: `import { mutation } from '@oxog/queryflow';

const deleteUser = mutation('/users/:id', {
  method: 'DELETE',
  optimistic: (cache, input) => {
    // Store original data for potential rollback
    const original = cache.get('/users');
    cache.set('_rollback_users', original);

    // Optimistically remove from list
    cache.update('/users', (users) =>
      users.filter(u => u.id !== input.id)
    );
  },
  onError: (error, variables, context) => {
    // Manual rollback if needed
    const original = cache.get('_rollback_users');
    if (original) {
      cache.set('/users', original);
      cache.invalidate('_rollback_users');
    }
  },
});`,
    },
    'mutation-callbacks': {
      name: 'mutation-callbacks',
      description: 'Using mutation lifecycle callbacks',
      code: `import { mutation } from '@oxog/queryflow';

const createPost = mutation('/posts', {
  method: 'POST',

  // Called before mutation starts
  onMutate: async (variables) => {
    console.log('Starting mutation with:', variables);
    // Return context for use in other callbacks
    return { startTime: Date.now() };
  },

  // Called on success
  onSuccess: (data, variables) => {
    console.log('Created post:', data);
  },

  // Called on error
  onError: (error, variables, context) => {
    console.error('Failed after', Date.now() - context.startTime, 'ms');
  },

  // Called after success or error
  onSettled: (data, error, variables) => {
    console.log('Mutation finished');
  },
});`,
    },
  },
  cache: {
    'cache-access': {
      name: 'cache-access',
      description: 'Direct cache manipulation patterns',
      code: `import { createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Pattern 1: Get/Set
const users = client.cache.get('/users');
client.cache.set('/users', [...users, newUser]);

// Pattern 2: Update with callback (Immer-style)
client.cache.update('/users', (draft) => {
  draft.push({ id: '4', name: 'New User' });
  draft[0].name = 'Updated Name';
});

// Pattern 3: Invalidation
client.cache.invalidate('/users/*'); // Pattern-based
client.cache.invalidate('/users/123'); // Specific key

// Pattern 4: Clear
client.cache.clear(); // Clear entire cache`,
    },
    'manual-invalidation': {
      name: 'manual-invalidation',
      description: 'Manually invalidating cache entries',
      code: `import { createClient, mutation } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Invalidate specific query
client.cache.invalidate('/users/123');

// Invalidate with pattern
client.cache.invalidate('/users/*'); // All user queries

// Invalidate after mutation
const deleteUser = mutation('/users/:id', {
  method: 'DELETE',
  invalidates: ['/users', '/users/:id'], // Auto-invalidate on success
});

// Or use 'auto' for intelligent invalidation
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  invalidates: 'auto', // QueryFlow detects related queries
});`,
    },
    'cache-persistence': {
      name: 'cache-persistence',
      description: 'Persisting cache to localStorage',
      code: `import { createClient } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

// Enable offline sync with IndexedDB persistence
client.use(offlineSync({
  storage: 'indexeddb', // or 'localstorage'
  dbName: 'queryflow-cache',
  syncOnReconnect: true,
}));

// Cache is now automatically persisted
// Survives page reloads and works offline`,
    },
    'cache-graph': {
      name: 'cache-graph',
      description: 'Automatic relationship detection in cache',
      code: `import { createClient, query, mutation } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// QueryFlow detects relationships from URL patterns
const user = query('/users/:id', { params: { id: '123' } });
const posts = query('/users/:id/posts', { params: { id: '123' } });
const comments = query('/posts/:postId/comments', { params: { postId: '456' } });

// When user is updated, related queries are auto-invalidated
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  invalidates: 'auto',
  // QueryFlow's cache graph knows:
  // - /users/123 is related to /users/123/posts
  // - Both should be invalidated
});`,
    },
  },
  realtime: {
    'websocket-subscription': {
      name: 'websocket-subscription',
      description: 'Real-time updates via WebSocket',
      code: `import { subscribe } from '@oxog/queryflow';

const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,

  onOpen: () => console.log('Connected'),
  onMessage: (message) => console.log('New message:', message),
  onClose: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error),
});

// Control the subscription
messages.pause();
messages.resume();
messages.close();`,
    },
    'sse-subscription': {
      name: 'sse-subscription',
      description: 'Server-Sent Events subscription',
      code: `import { subscribe } from '@oxog/queryflow';

const notifications = subscribe('/notifications', {
  transport: 'sse',
  reconnect: true,
  reconnectInterval: 3000,

  onMessage: (notification) => {
    console.log('Notification:', notification);
    showNotification(notification);
  },
});

// SSE auto-reconnects on disconnect`,
    },
    'polling-fallback': {
      name: 'polling-fallback',
      description: 'Polling as fallback for real-time updates',
      code: `import { subscribe } from '@oxog/queryflow';

const status = subscribe('/status', {
  transport: 'polling',
  interval: 5000, // Poll every 5 seconds

  onMessage: (data) => {
    updateStatusUI(data);
  },
});

// Useful when WebSocket/SSE not available
// or for simple periodic updates`,
    },
    'reconnection': {
      name: 'reconnection',
      description: 'Automatic reconnection handling',
      code: `import { subscribe } from '@oxog/queryflow';

const stream = subscribe('/stream', {
  transport: 'websocket',
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,

  onOpen: () => {
    console.log('Connected');
    // Re-authenticate or re-subscribe to channels
  },

  onClose: () => {
    console.log('Disconnected, will attempt reconnect');
  },

  onError: (error) => {
    if (error.message === 'Max reconnect attempts reached') {
      showReconnectButton();
    }
  },
});

// Manual reconnect
function handleReconnectClick() {
  stream.resume();
}`,
    },
  },
  offline: {
    'offline-mutations': {
      name: 'offline-mutations',
      description: 'Queue mutations while offline',
      code: `import { createClient, mutation } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,
}));

// Mutations work offline
const createPost = mutation('/posts', {
  method: 'POST',
  offlineSupport: true,
});

// Even offline, this queues the mutation
await createPost.mutate({ title: 'My Post' });

// Check pending mutations
const status = client.offline.getStatus();
console.log('Pending mutations:', status.pendingMutations);`,
    },
    'sync-on-reconnect': {
      name: 'sync-on-reconnect',
      description: 'Automatic sync when coming back online',
      code: `import { createClient } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,

  onSyncStart: () => {
    showSyncIndicator();
  },

  onSyncComplete: (results) => {
    hideSyncIndicator();
    console.log('Synced:', results.succeeded, 'Failed:', results.failed);
  },

  onSyncError: (error) => {
    showSyncError(error);
  },
}));

// Monitor connection status
window.addEventListener('online', () => {
  console.log('Back online, sync will start automatically');
});`,
    },
    'conflict-resolution': {
      name: 'conflict-resolution',
      description: 'Handling sync conflicts',
      code: `import { createClient } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,

  // Built-in strategies
  conflictResolution: 'server-wins', // or 'client-wins', 'manual'

  // Or custom resolution
  onConflict: (local, remote) => {
    // Merge strategy: keep remote but preserve local unsaved changes
    return {
      ...remote,
      ...local.unsyncedFields,
      _mergedAt: Date.now(),
    };
  },
}));`,
    },
  },
  react: {
    'basic-hooks': {
      name: 'basic-hooks',
      description: 'Basic React hooks usage',
      code: `import { useQuery, useMutation, useSubscription } from '@oxog/queryflow/react';

function UserList() {
  const { data, isLoading, error, refetch } = useQuery('/users');

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
      <button onClick={refetch}>Refresh</button>
    </ul>
  );
}

function CreateUser() {
  const { mutate, isPending } = useMutation('/users', { method: 'POST' });

  return (
    <button onClick={() => mutate({ name: 'John' })} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create User'}
    </button>
  );
}`,
    },
    'dependent-queries': {
      name: 'dependent-queries',
      description: 'Queries that depend on other queries',
      code: `import { useQuery } from '@oxog/queryflow/react';

function UserPosts({ userId }) {
  // First query
  const user = useQuery('/users/:id', {
    params: { id: userId }
  });

  // Dependent query - only runs when user data is available
  const posts = useQuery('/posts', {
    searchParams: { authorId: user.data?.id },
    enabled: !!user.data, // Only fetch when user is loaded
    dependsOn: [user],
  });

  if (user.isLoading) return <Spinner />;
  if (posts.isLoading) return <Spinner />;

  return (
    <div>
      <h1>{user.data.name}'s Posts</h1>
      {posts.data.map(post => <Post key={post.id} post={post} />)}
    </div>
  );
}`,
    },
    'provider-setup': {
      name: 'provider-setup',
      description: 'Setting up QueryFlowProvider',
      code: `import { createClient } from '@oxog/queryflow';
import { QueryFlowProvider } from '@oxog/queryflow/react';

const client = createClient({
  baseUrl: 'https://api.example.com',
  staleTime: 5000,
});

function App() {
  return (
    <QueryFlowProvider client={client}>
      <YourApp />
    </QueryFlowProvider>
  );
}`,
    },
    'suspense-mode': {
      name: 'suspense-mode',
      description: 'Using React Suspense with queries',
      code: `import { Suspense } from 'react';
import { useQuery } from '@oxog/queryflow/react';

function UserList() {
  // This will suspend until data is loaded
  const { data } = useQuery('/users', { suspense: true });

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserList />
    </Suspense>
  );
}`,
    },
    'error-boundary': {
      name: 'error-boundary',
      description: 'Error boundary integration',
      code: `import { ErrorBoundary } from 'react-error-boundary';
import { useQuery } from '@oxog/queryflow/react';

function UserList() {
  const { data } = useQuery('/users', {
    useErrorBoundary: true, // Errors propagate to boundary
  });

  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <UserList />
    </ErrorBoundary>
  );
}`,
    },
    'infinite-scroll': {
      name: 'infinite-scroll',
      description: 'Implementing infinite scroll pagination',
      code: `import { useInfiniteQuery } from '@oxog/queryflow/react';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery('/posts', {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <div>
      {data.pages.flatMap(page =>
        page.items.map(item => <Item key={item.id} item={item} />)
      )}

      {hasNextPage && (
        <button
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}`,
    },
  },
  advanced: {
    'custom-plugins': {
      name: 'custom-plugins',
      description: 'Creating custom plugins',
      code: `import { createClient } from '@oxog/queryflow';
import type { Plugin } from '@oxog/queryflow';

const loggingPlugin: Plugin = {
  name: 'logging',
  version: '1.0.0',

  install(kernel) {
    kernel.on('query:success', ({ key, data }) => {
      console.log('[Query Success]', key, data);
    });

    kernel.on('query:error', ({ key, error }) => {
      console.error('[Query Error]', key, error);
    });

    kernel.on('mutation:success', ({ key, data }) => {
      console.log('[Mutation Success]', key, data);
    });
  },
};

const client = createClient({ baseUrl: '/api' });
client.use(loggingPlugin);`,
    },
    'auth-integration': {
      name: 'auth-integration',
      description: 'Authentication token handling',
      code: `import { createClient } from '@oxog/queryflow';

const client = createClient({
  baseUrl: '/api',
  headers: () => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: \`Bearer \${token}\` } : {};
  },
});

// Handle auth errors globally
client.on('error', (error) => {
  if (error.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
});`,
    },
    'request-batching': {
      name: 'request-batching',
      description: 'Batching multiple requests',
      code: `import { createClient } from '@oxog/queryflow';

const client = createClient({
  baseUrl: '/api',
  // Enable request batching
  batching: {
    enabled: true,
    maxBatchSize: 10,
    batchInterval: 10, // ms
  },
});

// These queries will be batched into a single request
const [users, posts, comments] = await Promise.all([
  query('/users').fetch(),
  query('/posts').fetch(),
  query('/comments').fetch(),
]);`,
    },
    'middleware': {
      name: 'middleware',
      description: 'Request/response middleware',
      code: `import { createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Request middleware
client.use({
  name: 'request-timing',
  version: '1.0.0',
  install(kernel) {
    kernel.on('request:start', (ctx) => {
      ctx.startTime = performance.now();
    });

    kernel.on('request:end', (ctx) => {
      const duration = performance.now() - ctx.startTime;
      console.log(\`Request took \${duration}ms\`);
    });
  },
});`,
    },
  },
};

// API reference data
const apiReference: Record<string, {
  signature: string;
  description: string;
  params: string;
  returns: string;
  example?: string;
}> = {
  createClient: {
    signature: 'createClient(config?: ClientConfig): QueryFlowClient',
    description: 'Creates a new QueryFlow client instance with the specified configuration.',
    params: `config - Optional configuration object:
  - baseUrl?: string - Base URL for all requests
  - headers?: Record<string, string> | (() => Record<string, string>) - Default headers
  - timeout?: number - Request timeout in milliseconds
  - staleTime?: number - Time data is considered fresh (ms)
  - cacheTime?: number - Time to keep data in cache (ms)
  - retry?: number | boolean - Retry count for failed requests`,
    returns: 'QueryFlowClient instance with cache access and plugin methods',
    example: `const client = createClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  staleTime: 5000,
});`,
  },
  query: {
    signature: 'query<TData, TError>(url: string, options?: QueryOptions<TData, TError>): QueryInstance<TData, TError>',
    description: 'Creates a query instance for fetching data with automatic caching and state management.',
    params: `url - URL template with optional :params (e.g., '/users/:id')
options - Query options:
  - params?: Record<string, string | number> - URL parameters
  - searchParams?: Record<string, string | number | boolean> - Query string parameters
  - staleTime?: number - Override client staleTime
  - enabled?: boolean - Enable/disable query
  - select?: (data: unknown) => TData - Transform response
  - onSuccess/onError/onSettled - Callbacks`,
    returns: 'QueryInstance with fetch(), fetchSafe(), refetch(), and state methods',
    example: `const user = query('/users/:id', {
  params: { id: '123' },
  staleTime: 5000,
});
const data = await user.fetch();`,
  },
  mutation: {
    signature: 'mutation<TData, TVariables, TError>(url: string, options?: MutationOptions): MutationInstance',
    description: 'Creates a mutation instance for modifying data with optimistic updates support.',
    params: `url - URL template
options - Mutation options:
  - method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' - HTTP method
  - optimistic?: (cache, variables) => void - Optimistic update function
  - invalidates?: string[] | 'auto' - Cache keys to invalidate
  - onMutate/onSuccess/onError/onSettled - Lifecycle callbacks`,
    returns: 'MutationInstance with mutate(), mutateAsync(), reset(), and state methods',
    example: `const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', (d) => Object.assign(d, input));
  },
});`,
  },
  subscribe: {
    signature: 'subscribe<TData>(url: string, options: SubscribeOptions<TData>): SubscriptionInstance<TData>',
    description: 'Creates a subscription for real-time updates via WebSocket, SSE, or polling.',
    params: `url - Subscription endpoint URL
options - Subscription options:
  - transport: 'websocket' | 'sse' | 'polling' - Transport mechanism
  - interval?: number - Polling interval (for polling)
  - reconnect?: boolean - Auto-reconnect on disconnect
  - reconnectInterval?: number - Reconnect delay in ms
  - onMessage/onOpen/onClose/onError - Event handlers`,
    returns: 'SubscriptionInstance with connect(), pause(), resume(), close() methods',
    example: `const messages = subscribe('/chat', {
  transport: 'websocket',
  onMessage: (msg) => console.log(msg),
});`,
  },
  useQuery: {
    signature: 'useQuery<TData, TError>(url: string, options?: QueryOptions): QueryState<TData, TError>',
    description: 'React hook for data fetching with automatic state management.',
    params: `url - URL template
options - Same as query() options plus:
  - suspense?: boolean - Enable React Suspense mode
  - useErrorBoundary?: boolean - Propagate errors to error boundary`,
    returns: `QueryState object:
  - data: TData | undefined
  - error: TError | null
  - isLoading, isFetching, isSuccess, isError, isIdle, isStale: boolean
  - refetch: () => Promise<TData>`,
    example: `function UserList() {
  const { data, isLoading, error } = useQuery('/users');
  if (isLoading) return <Spinner />;
  return <ul>{data.map(u => <li>{u.name}</li>)}</ul>;
}`,
  },
  useMutation: {
    signature: 'useMutation<TData, TVariables, TError>(url: string, options?: MutationOptions): MutationState',
    description: 'React hook for mutations with optimistic updates.',
    params: 'url - URL template\noptions - Same as mutation() options',
    returns: `MutationState object:
  - mutate: (variables) => void
  - mutateAsync: (variables) => Promise<TData>
  - data, error, isPending, isSuccess, isError, isIdle
  - variables: last mutation variables
  - reset: () => void`,
    example: `function CreateUser() {
  const { mutate, isPending } = useMutation('/users', { method: 'POST' });
  return <button onClick={() => mutate({ name: 'John' })}>{isPending ? '...' : 'Create'}</button>;
}`,
  },
  useSubscription: {
    signature: 'useSubscription<TData>(url: string, options: SubscribeOptions<TData>): SubscriptionState<TData>',
    description: 'React hook for real-time subscriptions.',
    params: 'url - Subscription endpoint\noptions - Same as subscribe() options',
    returns: 'SubscriptionState with data, isConnected, error, pause(), resume(), close()',
    example: `function Chat() {
  const { data: messages } = useSubscription('/chat', { transport: 'websocket' });
  return <MessageList messages={messages} />;
}`,
  },
  QueryFlowError: {
    signature: 'class QueryFlowError extends Error',
    description: 'Base error class for all QueryFlow errors with error codes.',
    params: `Constructor: new QueryFlowError(code: string, message: string)
Properties:
  - code: string - Error code (NETWORK_ERROR, TIMEOUT_ERROR, etc.)
  - message: string - Human-readable message`,
    returns: 'Error instance with code and message',
    example: `try {
  await query('/users').fetch();
} catch (error) {
  if (error instanceof QueryFlowError) {
    console.log(error.code); // 'NETWORK_ERROR'
  }
}`,
  },
};

// TanStack Query migration mappings
const tanstackMigrations: Record<string, { from: string; to: string; notes: string }> = {
  QueryClient: {
    from: 'new QueryClient()',
    to: 'createClient(config)',
    notes: 'createClient() returns a pre-configured client. No need to wrap in QueryClientProvider.',
  },
  QueryClientProvider: {
    from: '<QueryClientProvider client={queryClient}>',
    to: '<QueryFlowProvider client={client}>',
    notes: 'Same pattern, different component name.',
  },
  useQuery: {
    from: "useQuery({ queryKey: ['users'], queryFn: fetchUsers })",
    to: "useQuery('/users')",
    notes: 'No queryKey needed - URL is the key. No queryFn needed - automatic fetching.',
  },
  useMutation: {
    from: "useMutation({ mutationFn: createUser })",
    to: "useMutation('/users', { method: 'POST' })",
    notes: 'Specify URL and method instead of mutation function.',
  },
  queryClient_invalidateQueries: {
    from: "queryClient.invalidateQueries({ queryKey: ['users'] })",
    to: "client.cache.invalidate('/users')",
    notes: 'Direct cache access with pattern matching support.',
  },
  queryClient_setQueryData: {
    from: "queryClient.setQueryData(['users'], newData)",
    to: "client.cache.set('/users', newData)",
    notes: 'Or use client.cache.update() for Immer-style updates.',
  },
};

// Tool handlers
function handleDocsSearch(args: { query: string }): { content: string; matches: boolean } {
  const searchQuery = args.query.toLowerCase();
  const results: string[] = [];

  if (searchQuery.includes('install')) {
    results.push('Installation: npm install @oxog/queryflow');
  }
  if (searchQuery.includes('cache')) {
    results.push('Cache API: client.cache.get(), set(), update(), invalidate(), clear()');
  }
  if (searchQuery.includes('query')) {
    results.push('Query API: query(url, options) - fetch data with caching');
  }
  if (searchQuery.includes('mutation')) {
    results.push('Mutation API: mutation(url, options) - modify data with optimistic updates');
  }
  if (searchQuery.includes('subscribe') || searchQuery.includes('realtime') || searchQuery.includes('websocket')) {
    results.push('Realtime API: subscribe(url, options) - WebSocket, SSE, or polling');
  }
  if (searchQuery.includes('offline')) {
    results.push('Offline: Use offlineSync plugin for IndexedDB persistence');
  }
  if (searchQuery.includes('react') || searchQuery.includes('hook')) {
    results.push('React: useQuery, useMutation, useSubscription hooks');
  }
  if (searchQuery.includes('plugin')) {
    results.push('Plugins: offlineSync, realtime, devtools - or create custom plugins');
  }

  return {
    content: docs + (results.length > 0 ? '\n\n## Search Results\n' + results.map(r => `- ${r}`).join('\n') : ''),
    matches: results.length > 0,
  };
}

function handleExampleFetch(args: { category: string; name?: string }): { content: string; name: string; description?: string } {
  const categoryData = examples[args.category];
  if (!categoryData) {
    const availableCategories = Object.keys(examples).join(', ');
    throw new Error(`Unknown category: ${args.category}. Available: ${availableCategories}`);
  }

  if (args.name) {
    const example = categoryData[args.name];
    if (!example) {
      const availableExamples = Object.keys(categoryData).join(', ');
      throw new Error(`Unknown example: ${args.name}. Available in ${args.category}: ${availableExamples}`);
    }
    return {
      content: example.code,
      name: example.name,
      description: example.description,
    };
  }

  // Return all examples in category
  const allExamples = Object.values(categoryData)
    .map(ex => `### ${ex.name}\n${ex.description}\n\n\`\`\`typescript\n${ex.code}\n\`\`\``)
    .join('\n\n');

  return {
    content: allExamples,
    name: args.category,
    description: `All examples in ${args.category} category`,
  };
}

function handleApiReference(args: { symbol: string }): {
  symbol: string;
  signature: string;
  description: string;
  params: string;
  returns: string;
  example?: string;
} {
  const symbolLower = args.symbol.toLowerCase();

  // Find matching API
  const api = Object.entries(apiReference).find(
    ([key]) => key.toLowerCase() === symbolLower
  );

  if (!api) {
    const availableSymbols = Object.keys(apiReference).join(', ');
    throw new Error(`Unknown API: ${args.symbol}. Available: ${availableSymbols}`);
  }

  return {
    symbol: api[0],
    ...api[1],
  };
}

function handleMigrate(args: { code: string }): {
  original: string;
  migrated: string;
  changes: string[];
} {
  let migrated = args.code;
  const changes: string[] = [];

  // Apply migrations
  for (const [key, migration] of Object.entries(tanstackMigrations)) {
    if (args.code.includes(key) || args.code.includes(migration.from.split('(')[0] ?? '')) {
      changes.push(`${key}: ${migration.notes}`);
    }
  }

  // Common replacements
  const replacements: [RegExp, string, string][] = [
    [/new QueryClient\(\)/g, 'createClient()', 'QueryClient → createClient'],
    [/QueryClientProvider/g, 'QueryFlowProvider', 'Provider component'],
    [/queryKey:\s*\[([^\]]+)\]/g, '', 'Remove queryKey (URL is the key)'],
    [/queryFn:\s*[^,}]+,?/g, '', 'Remove queryFn (automatic fetching)'],
    [/mutationFn:\s*[^,}]+,?/g, '', 'Remove mutationFn'],
    [/@tanstack\/react-query/g, '@oxog/queryflow/react', 'Import path'],
  ];

  for (const [pattern, replacement, description] of replacements) {
    if (pattern.test(migrated)) {
      migrated = migrated.replace(pattern, replacement);
      if (!changes.includes(description)) {
        changes.push(description);
      }
    }
  }

  // Clean up empty options objects
  migrated = migrated.replace(/,\s*\{\s*\}/g, '');
  migrated = migrated.replace(/\(\s*\{\s*\}\s*\)/g, '()');

  return {
    original: args.code,
    migrated: migrated.trim(),
    changes,
  };
}

// MCP Server setup
const tools = [
  {
    name: 'queryflow_docs_search',
    description: 'Search QueryFlow documentation for information about APIs, patterns, and usage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "cache", "react hooks", "offline")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'queryflow_example_fetch',
    description: 'Fetch QueryFlow code examples by category. Returns working code samples.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['basic', 'mutations', 'cache', 'realtime', 'offline', 'react', 'advanced'],
          description: 'Example category',
        },
        name: {
          type: 'string',
          description: 'Specific example name (optional, returns all if not specified)',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'queryflow_api_reference',
    description: 'Get detailed API reference for QueryFlow functions and types.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symbol: {
          type: 'string',
          description: 'API function or type name (e.g., "useQuery", "createClient", "QueryFlowError")',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'queryflow_migrate',
    description: 'Help migrate code from TanStack Query to QueryFlow. Provides transformed code and migration notes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'TanStack Query code to migrate',
        },
      },
      required: ['code'],
    },
  },
];

async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'queryflow-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'queryflow_docs_search':
          result = handleDocsSearch(args as { query: string });
          break;
        case 'queryflow_example_fetch':
          result = handleExampleFetch(args as { category: string; name?: string });
          break;
        case 'queryflow_api_reference':
          result = handleApiReference(args as { symbol: string });
          break;
        case 'queryflow_migrate':
          result = handleMigrate(args as { code: string });
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }),
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('QueryFlow MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
