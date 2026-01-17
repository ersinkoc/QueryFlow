# QueryFlow - Zero-Dependency NPM Package

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/queryflow` |
| **GitHub Repository** | `https://github.com/ersinkoc/queryflow` |
| **Documentation Site** | `https://queryflow.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç (ersinkoc) |

> **NO social media, Discord, email, or external links allowed.**

---

## Package Description

**One-line:** Intelligent data fetching with predictive caching, offline-first sync, and real-time subscriptions.

QueryFlow is a next-generation data fetching library that surpasses TanStack Query with intelligent cache graph management, built-in offline synchronization, native real-time support, and a micro-kernel plugin architecture. It provides a unified, type-safe API for queries, mutations, and subscriptions across React, Vue, Svelte, and Solid frameworks while maintaining zero runtime dependencies and a bundle size under 4KB gzipped.

---

## NON-NEGOTIABLE RULES

These rules are **ABSOLUTE** and must be followed without exception.

### 1. ZERO RUNTIME DEPENDENCIES

```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```

- Implement EVERYTHING from scratch
- No lodash, no axios, no moment - nothing
- Write your own utilities, parsers, validators
- If you think you need a dependency, you don't

**Allowed devDependencies only:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line of code must be tested
- Every branch must be tested
- Every function must be tested
- **All tests must pass** (100% success rate)
- Use Vitest for testing
- Coverage thresholds enforced in config

### 3. MICRO-KERNEL ARCHITECTURE

All packages MUST use plugin-based architecture:

```
┌─────────────────────────────────────────────────────────┐
│                      User Code                           │
├─────────────────────────────────────────────────────────┤
│    query() · mutation() · subscribe() · cache.*         │
├──────────┬──────────┬───────────┬───────────────────────┤
│  Cache   │ Request  │  State    │      Optional         │
│ Manager  │ Handler  │ Manager   │  Offline/RT/DevTools  │
├──────────┴──────────┴───────────┴───────────────────────┤
│                    Micro Kernel                          │
│      Plugin Registry · Event Bus · Error Boundary        │
└─────────────────────────────────────────────────────────┘
```

**Kernel responsibilities (minimal):**
- Plugin registration and lifecycle
- Event bus for inter-plugin communication
- Error boundary and recovery
- Configuration management

### 4. DEVELOPMENT WORKFLOW

Create these documents **FIRST**, before any code:

1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions  
3. **TASKS.md** - Ordered task list with dependencies

Only after all three documents are complete, implement code following TASKS.md sequentially.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

### 6. LLM-NATIVE DESIGN

Package must be designed for both humans AND AI assistants:

- **llms.txt** file in root (< 2000 tokens)
- **Predictable API** naming (`create`, `get`, `set`, `use`, `remove`)
- **Rich JSDoc** with @example on every public API
- **20+ examples** organized by category
- **README** optimized for LLM consumption

### 7. NO EXTERNAL LINKS

- ✅ GitHub repository URL
- ✅ Custom domain (queryflow.oxog.dev)
- ✅ npm package URL
- ❌ Social media (Twitter, LinkedIn, etc.)
- ❌ Discord/Slack links
- ❌ Email addresses
- ❌ Donation/sponsor links

---

## CORE FEATURES

### 1. Intelligent Cache Graph

Automatic relationship detection and smart cache invalidation. When a mutation affects one entity, related queries are automatically invalidated based on the inferred data graph.

**API Example:**
```typescript
// Relationships are auto-detected from URL patterns and response data
const user = query('/users/:id', { params: { id: '123' } });
const posts = query('/users/:id/posts', { params: { id: '123' } });

// Mutation automatically invalidates both queries
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  // No manual invalidation needed!
});

// Manual control when needed
client.cache.invalidate('/users/*'); // Pattern-based
client.cache.invalidate(['users', '123']); // Key-based
```

### 2. Query Management

Declarative data fetching with automatic deduplication, retry, and state management.

**API Example:**
```typescript
import { query, createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://api.example.com' });

// Simple query
const users = query('/users');
const data = await users.fetch();

// Query with params
const user = query('/users/:id', { 
  params: { id: '123' },
  staleTime: 5000,
  cacheTime: 300000,
});

// Query with transform
const userNames = query('/users', {
  select: (data) => data.map(u => u.name),
});
```

### 3. Mutation Management

Type-safe mutations with declarative optimistic updates and automatic rollback.

**API Example:**
```typescript
import { mutation } from '@oxog/queryflow';

// Simple mutation
const createUser = mutation('/users', {
  method: 'POST',
});

await createUser.mutate({ name: 'John', email: 'john@example.com' });

// With optimistic update (3 lines!)
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', (draft) => Object.assign(draft, input));
  },
  onError: (error, context) => {
    // Automatic rollback happens, but you can add custom logic
    console.error('Update failed:', error);
  },
});
```

### 4. Real-time Subscriptions

First-class WebSocket, SSE, and polling support with automatic reconnection and state recovery.

**API Example:**
```typescript
import { subscribe } from '@oxog/queryflow';

// WebSocket subscription
const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  onMessage: (message) => {
    console.log('New message:', message);
  },
});

// Server-Sent Events
const notifications = subscribe('/notifications', {
  transport: 'sse',
  reconnect: true,
  reconnectInterval: 1000,
});

// Polling fallback
const status = subscribe('/status', {
  transport: 'polling',
  interval: 5000,
});

// Control
messages.pause();
messages.resume();
messages.close();
```

### 5. Offline-First Sync

Built-in IndexedDB persistence with background sync and conflict resolution.

**API Example:**
```typescript
import { createClient } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({
  baseUrl: '/api',
});

// Enable offline sync
client.use(offlineSync({
  storage: 'indexeddb', // or 'localstorage'
  syncOnReconnect: true,
  conflictResolution: 'server-wins', // or 'client-wins', 'manual'
  onConflict: (local, remote) => {
    // Custom resolution
    return { ...remote, ...local.unsyncedChanges };
  },
}));

// Mutations work offline, sync when online
const createPost = mutation('/posts', {
  method: 'POST',
  offlineSupport: true,
});

// Check sync status
const status = client.offline.getStatus();
// { isOnline: false, pendingMutations: 3, lastSync: Date }
```

### 6. Time-Travel DevTools

Built-in debugging with state history, replay, and export capabilities.

**API Example:**
```typescript
import { createClient } from '@oxog/queryflow';
import { devtools } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

// Enable devtools (no separate package!)
client.use(devtools({
  enabled: process.env.NODE_ENV === 'development',
  maxHistory: 100,
}));

// DevTools API
client.devtools.getHistory(); // All state changes
client.devtools.jumpTo(5); // Jump to state #5
client.devtools.export(); // Export as JSON
client.devtools.import(json); // Import state
```

### 7. Multiple Error Handling Patterns

Support for try-catch, Result pattern, and callbacks.

**API Example:**
```typescript
// Pattern 1: Try-catch (async/await)
try {
  const data = await query('/users').fetch();
} catch (error) {
  if (error instanceof QueryFlowError) {
    console.error(error.code, error.message);
  }
}

// Pattern 2: Result pattern (Rust-like, no throws)
const { data, error } = await query('/users').fetchSafe();
if (error) {
  console.error('Failed:', error.message);
} else {
  console.log('Users:', data);
}

// Pattern 3: Callbacks
query('/users', {
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  onSettled: () => console.log('Done'),
});

// Pattern 4: React hooks style
const { data, error, isLoading } = useQuery('/users');
```

### 8. Flexible Cache Access

Three patterns for cache manipulation: Proxy, Immer-style, and explicit get/set.

**API Example:**
```typescript
// Pattern 1: Proxy-based (magic, reactive)
client.cache.data.users[0].name = 'John'; // Auto-updates

// Pattern 2: Immer-style draft
client.cache.update('/users', (draft) => {
  draft.push({ id: '4', name: 'New User' });
  draft[0].name = 'Updated';
});

// Pattern 3: Explicit get/set
const users = client.cache.get('/users');
client.cache.set('/users', [...users, newUser]);

// Pattern 4: Pattern-based operations
client.cache.invalidate('/users/*'); // Invalidate all user queries
client.cache.clear(); // Clear entire cache
```

### 9. React Bindings

Full React integration with hooks, Suspense, and Error Boundaries.

**API Example:**
```typescript
import { 
  useQuery, 
  useMutation, 
  useSubscription,
  QueryFlowProvider,
  Suspense 
} from '@oxog/queryflow/react';

// Provider setup
function App() {
  return (
    <QueryFlowProvider client={client}>
      <UserList />
    </QueryFlowProvider>
  );
}

// useQuery hook
function UserList() {
  const { data, isLoading, error, refetch } = useQuery('/users', {
    staleTime: 5000,
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

// useMutation hook
function CreateUser() {
  const { mutate, isPending } = useMutation('/users', {
    method: 'POST',
    onSuccess: () => toast('User created!'),
  });

  return (
    <button onClick={() => mutate({ name: 'John' })} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create User'}
    </button>
  );
}

// useSubscription hook
function Chat() {
  const { data: messages } = useSubscription('/chat', {
    transport: 'websocket',
  });

  return <MessageList messages={messages} />;
}
```

### 10. Dependent Queries

Automatic execution order with parallel optimization where possible.

**API Example:**
```typescript
// Queries with dependencies
const user = useQuery('/users/:id', { 
  params: { id: userId } 
});

const posts = useQuery('/posts', {
  params: { authorId: user.data?.id },
  enabled: !!user.data, // Only run when user is loaded
  dependsOn: [user], // Explicit dependency
});

const comments = useQuery('/comments', {
  params: { postIds: posts.data?.map(p => p.id) },
  enabled: !!posts.data?.length,
  dependsOn: [posts],
});

// Parallel queries (no dependencies)
const [users, products, orders] = useQueries([
  { url: '/users' },
  { url: '/products' },
  { url: '/orders' },
]); // All fetch in parallel
```

---

## PLUGIN SYSTEM

### Plugin Interface

```typescript
/**
 * Plugin interface for extending QueryFlow functionality.
 * 
 * @typeParam TContext - Shared context type between plugins
 * 
 * @example
 * ```typescript
 * const myPlugin: Plugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install: (kernel) => {
 *     kernel.on('query:success', (data) => {
 *       console.log('Query succeeded:', data);
 *     });
 *   },
 * };
 * 
 * client.use(myPlugin);
 * ```
 */
export interface Plugin<TContext = unknown> {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Other plugins this plugin depends on */
  dependencies?: string[];
  
  /**
   * Called when plugin is registered.
   * @param kernel - The kernel instance
   */
  install: (kernel: Kernel<TContext>) => void;
  
  /**
   * Called after all plugins are installed.
   * @param context - Shared context object
   */
  onInit?: (context: TContext) => void | Promise<void>;
  
  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;
  
  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}
```

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `cache-manager` | Intelligent cache graph with automatic relationship detection, TTL, and invalidation patterns |
| `request-handler` | Fetch wrapper with retry, deduplication, timeout, and abort controller support |
| `state-manager` | Query state machine (idle → loading → success/error) with transitions and subscriptions |

### Optional Plugins (Opt-in)

| Plugin | Description | Enable |
|--------|-------------|--------|
| `offline-sync` | IndexedDB persistence with background sync and conflict resolution | `client.use(offlineSync())` |
| `realtime` | WebSocket, SSE, and polling support with auto-reconnection | `client.use(realtime())` |
| `devtools` | Time-travel debugging with state history and export | `client.use(devtools())` |

---

## API DESIGN

### Main Export

```typescript
import { 
  // Client
  createClient,
  
  // Core functions
  query,
  mutation,
  subscribe,
  
  // Types
  type QueryOptions,
  type MutationOptions,
  type SubscribeOptions,
  type Plugin,
  type QueryFlowClient,
  
  // Errors
  QueryFlowError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from '@oxog/queryflow';

// React bindings
import {
  QueryFlowProvider,
  useQuery,
  useMutation,
  useSubscription,
  useQueries,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@oxog/queryflow/react';

// Vue bindings
import {
  useQuery,
  useMutation,
  useSubscription,
  provideQueryFlow,
} from '@oxog/queryflow/vue';

// Svelte bindings
import {
  query as queryStore,
  mutation as mutationStore,
  subscription as subscriptionStore,
  setQueryFlowContext,
} from '@oxog/queryflow/svelte';

// Solid bindings
import {
  createQuery,
  createMutation,
  createSubscription,
  QueryFlowProvider,
} from '@oxog/queryflow/solid';

// Plugins
import {
  offlineSync,
  realtime,
  devtools,
} from '@oxog/queryflow/plugins';
```

### Type Definitions

```typescript
/**
 * Configuration options for creating a QueryFlow client.
 */
export interface ClientConfig {
  /** Base URL for all requests */
  baseUrl?: string;
  
  /** Default headers for all requests */
  headers?: Record<string, string> | (() => Record<string, string>);
  
  /** Default request timeout in milliseconds */
  timeout?: number;
  
  /** Default stale time for queries (ms) */
  staleTime?: number;
  
  /** Default cache time for queries (ms) */
  cacheTime?: number;
  
  /** Default retry count for failed requests */
  retry?: number | boolean;
  
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Options for query operations.
 */
export interface QueryOptions<TData = unknown, TError = Error> {
  /** URL parameters (e.g., { id: '123' } for /users/:id) */
  params?: Record<string, string | number>;
  
  /** Query string parameters */
  searchParams?: Record<string, string | number | boolean>;
  
  /** Custom cache key (defaults to URL-based) */
  key?: string[];
  
  /** Time data is considered fresh (ms) */
  staleTime?: number;
  
  /** Time to keep data in cache (ms) */
  cacheTime?: number;
  
  /** Number of retries on failure */
  retry?: number | boolean;
  
  /** Retry delay in ms or function */
  retryDelay?: number | ((attempt: number) => number);
  
  /** Enable/disable query */
  enabled?: boolean;
  
  /** Transform response data */
  select?: (data: unknown) => TData;
  
  /** Placeholder data while loading */
  placeholderData?: TData | (() => TData);
  
  /** Keep previous data while refetching */
  keepPreviousData?: boolean;
  
  /** Refetch interval in ms */
  refetchInterval?: number | false;
  
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean;
  
  /** Success callback */
  onSuccess?: (data: TData) => void;
  
  /** Error callback */
  onError?: (error: TError) => void;
  
  /** Settled callback (success or error) */
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

/**
 * Options for mutation operations.
 */
export interface MutationOptions<TData = unknown, TVariables = unknown, TError = Error> {
  /** HTTP method */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  /** URL parameters */
  params?: Record<string, string | number>;
  
  /** Custom headers */
  headers?: Record<string, string>;
  
  /** Optimistic update function */
  optimistic?: (cache: CacheProxy, variables: TVariables) => void;
  
  /** Cache keys to invalidate on success */
  invalidates?: string[] | 'auto';
  
  /** Success callback */
  onSuccess?: (data: TData, variables: TVariables) => void;
  
  /** Error callback */
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
  
  /** Mutation start callback */
  onMutate?: (variables: TVariables) => unknown | Promise<unknown>;
  
  /** Settled callback */
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  
  /** Enable offline support */
  offlineSupport?: boolean;
}

/**
 * Options for subscription operations.
 */
export interface SubscribeOptions<TData = unknown> {
  /** Transport mechanism */
  transport: 'websocket' | 'sse' | 'polling';
  
  /** Polling interval (for polling transport) */
  interval?: number;
  
  /** Auto-reconnect on disconnect */
  reconnect?: boolean;
  
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  
  /** Message handler */
  onMessage?: (data: TData) => void;
  
  /** Connection opened handler */
  onOpen?: () => void;
  
  /** Connection closed handler */
  onClose?: () => void;
  
  /** Error handler */
  onError?: (error: Error) => void;
}

/**
 * Query state object returned by hooks.
 */
export interface QueryState<TData = unknown, TError = Error> {
  /** Query data */
  data: TData | undefined;
  
  /** Error if query failed */
  error: TError | null;
  
  /** True when fetching for the first time */
  isLoading: boolean;
  
  /** True when fetching (including refetch) */
  isFetching: boolean;
  
  /** True if query succeeded at least once */
  isSuccess: boolean;
  
  /** True if query failed */
  isError: boolean;
  
  /** True if query hasn't been fetched yet */
  isIdle: boolean;
  
  /** True if data is stale */
  isStale: boolean;
  
  /** Refetch function */
  refetch: () => Promise<TData>;
}

/**
 * Mutation state object returned by hooks.
 */
export interface MutationState<TData = unknown, TVariables = unknown, TError = Error> {
  /** Mutation result data */
  data: TData | undefined;
  
  /** Error if mutation failed */
  error: TError | null;
  
  /** True when mutation is in progress */
  isPending: boolean;
  
  /** True if mutation succeeded */
  isSuccess: boolean;
  
  /** True if mutation failed */
  isError: boolean;
  
  /** True if mutation hasn't been called */
  isIdle: boolean;
  
  /** Variables from last mutation call */
  variables: TVariables | undefined;
  
  /** Execute mutation */
  mutate: (variables: TVariables) => void;
  
  /** Execute mutation with promise */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  
  /** Reset mutation state */
  reset: () => void;
}
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Node.js + Browser + Edge) |
| Module Format | ESM + CJS |
| Node.js Version | >= 18 |
| TypeScript Version | >= 5.0 |
| Bundle Size (core) | < 4KB gzipped |
| Bundle Size (all plugins) | < 15KB gzipped |

### Platform Support

- **Node.js**: 18+
- **Browsers**: ES2022+ (Chrome 94+, Firefox 93+, Safari 15+, Edge 94+)
- **Edge Runtimes**: Cloudflare Workers, Deno Deploy, Vercel Edge, Bun

---

## LLM-NATIVE REQUIREMENTS

### 1. llms.txt File

Create `/llms.txt` in project root (< 2000 tokens):

```markdown
# QueryFlow

> Intelligent data fetching with predictive caching, offline-first sync, and real-time subscriptions.

## Install

```bash
npm install @oxog/queryflow
```

## Basic Usage

```typescript
import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });
const users = await query('/users').fetch();
```

## API Summary

### Core
- `createClient(config?)` - Create client instance
- `query(url, options?)` - Fetch data
- `mutation(url, options?)` - Modify data
- `subscribe(url, options?)` - Real-time updates

### Cache
- `client.cache.get(key)` - Get cached data
- `client.cache.set(key, data)` - Set cached data
- `client.cache.update(key, updater)` - Update with Immer-style
- `client.cache.invalidate(pattern)` - Invalidate queries

### React Hooks
- `useQuery(url, options?)` - Query hook
- `useMutation(url, options?)` - Mutation hook
- `useSubscription(url, options?)` - Subscription hook

### Plugins
- `offlineSync` - IndexedDB + background sync
- `realtime` - WebSocket/SSE native support
- `devtools` - Time-travel debugging

## Common Patterns

### Query with Params
```typescript
const user = useQuery('/users/:id', { params: { id: '123' } });
```

### Optimistic Update
```typescript
const update = useMutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => cache.update('/users/:id', d => Object.assign(d, input)),
});
```

### Real-time Subscription
```typescript
const messages = useSubscription('/chat', { transport: 'websocket' });
```

## Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `NETWORK_ERROR` | Network request failed | Check connection, retry |
| `TIMEOUT_ERROR` | Request timed out | Increase timeout or retry |
| `VALIDATION_ERROR` | Invalid response data | Check API response format |
| `CACHE_ERROR` | Cache operation failed | Clear cache and retry |

## Links

- Docs: https://queryflow.oxog.dev
- GitHub: https://github.com/ersinkoc/queryflow
```

### 2. API Naming Standards

Use predictable patterns LLMs can infer:

```typescript
// ✅ GOOD - Predictable
createClient()      // Factory function
query()             // Fetch data
mutation()          // Modify data
subscribe()         // Real-time updates
useQuery()          // React hook for queries
useMutation()       // React hook for mutations
cache.get()         // Read from cache
cache.set()         // Write to cache
cache.update()      // Update cache with callback
cache.invalidate()  // Mark cache as stale
cache.clear()       // Remove all cache

// ❌ BAD - Unpredictable
qf()                // Abbreviation
proc()              // Unclear
handle()            // Vague
mgr()               // Abbreviation
```

### 3. Examples Structure (20+ examples)

```
examples/
├── 01-basic/
│   ├── simple-query.ts           # Basic query
│   ├── query-with-params.ts      # URL parameters
│   ├── query-with-search.ts      # Search params
│   └── error-handling.ts         # Error patterns
├── 02-mutations/
│   ├── simple-mutation.ts        # Basic mutation
│   ├── optimistic-update.ts      # Optimistic UI
│   ├── rollback-on-error.ts      # Error recovery
│   └── mutation-callbacks.ts     # Success/error handlers
├── 03-cache/
│   ├── cache-access.ts           # Get/set/update
│   ├── manual-invalidation.ts    # Invalidate patterns
│   ├── cache-persistence.ts      # LocalStorage
│   └── cache-graph.ts            # Relationship detection
├── 04-realtime/
│   ├── websocket-subscription.ts # WebSocket
│   ├── sse-subscription.ts       # Server-Sent Events
│   ├── polling-fallback.ts       # Polling transport
│   └── reconnection.ts           # Auto-reconnect
├── 05-offline/
│   ├── offline-mutations.ts      # Queue mutations offline
│   ├── sync-on-reconnect.ts      # Background sync
│   └── conflict-resolution.ts    # Resolve conflicts
├── 06-react/
│   ├── basic-hooks.ts            # useQuery, useMutation
│   ├── provider-setup.tsx        # QueryFlowProvider
│   ├── dependent-queries.tsx     # Query dependencies
│   ├── infinite-scroll.tsx       # Pagination
│   ├── suspense-mode.tsx         # React Suspense
│   └── error-boundary.tsx        # Error handling
├── 07-advanced/
│   ├── custom-plugins.ts         # Create plugins
│   ├── request-batching.ts       # Batch requests
│   ├── auth-integration.ts       # Authentication
│   └── middleware.ts             # Request middleware
└── 08-integrations/
    ├── nextjs-app-router.tsx     # Next.js 14+ App Router
    ├── remix-loader.tsx          # Remix integration
    ├── express-api.ts            # Express backend
    └── graphql-adapter.ts        # GraphQL support
```

---

## PROJECT STRUCTURE

```
queryflow/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Website deploy ONLY
├── src/
│   ├── index.ts                    # Main entry, public exports
│   ├── kernel.ts                   # Micro kernel core
│   ├── types.ts                    # All type definitions
│   ├── errors.ts                   # Custom error classes
│   ├── client.ts                   # Client factory
│   ├── query.ts                    # Query implementation
│   ├── mutation.ts                 # Mutation implementation
│   ├── subscribe.ts                # Subscription implementation
│   ├── core/
│   │   ├── event-bus.ts            # Event emitter
│   │   ├── state-machine.ts        # Query states
│   │   └── url-parser.ts           # URL template parser
│   ├── plugins/
│   │   ├── index.ts                # Plugin exports
│   │   ├── core/
│   │   │   ├── cache-manager.ts    # Cache with graph
│   │   │   ├── request-handler.ts  # Fetch wrapper
│   │   │   └── state-manager.ts    # State machine
│   │   └── optional/
│   │       ├── offline-sync.ts     # IndexedDB sync
│   │       ├── realtime.ts         # WS/SSE/polling
│   │       └── devtools.ts         # Time-travel debug
│   ├── bindings/
│   │   ├── react/
│   │   │   ├── index.ts            # React exports
│   │   │   ├── provider.tsx        # QueryFlowProvider
│   │   │   ├── use-query.ts        # useQuery hook
│   │   │   ├── use-mutation.ts     # useMutation hook
│   │   │   ├── use-subscription.ts # useSubscription hook
│   │   │   └── use-queries.ts      # useQueries hook
│   │   ├── vue/
│   │   │   ├── index.ts            # Vue exports
│   │   │   ├── use-query.ts
│   │   │   ├── use-mutation.ts
│   │   │   └── use-subscription.ts
│   │   ├── svelte/
│   │   │   ├── index.ts            # Svelte exports
│   │   │   ├── query-store.ts
│   │   │   ├── mutation-store.ts
│   │   │   └── subscription-store.ts
│   │   └── solid/
│   │       ├── index.ts            # Solid exports
│   │       ├── create-query.ts
│   │       ├── create-mutation.ts
│   │       └── create-subscription.ts
│   └── utils/
│       ├── deep-equal.ts           # Deep equality check
│       ├── hash.ts                 # Cache key hashing
│       ├── retry.ts                # Retry logic
│       ├── dedup.ts                # Request deduplication
│       └── serialize.ts            # Data serialization
├── mcp-server/
│   ├── index.ts                    # MCP server entry
│   ├── tools/
│   │   ├── docs-search.ts          # Search documentation
│   │   ├── example-fetch.ts        # Fetch examples
│   │   ├── api-reference.ts        # API lookup
│   │   └── migrate.ts              # TanStack migration
│   └── package.json
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── query.test.ts
│   │   ├── mutation.test.ts
│   │   ├── subscribe.test.ts
│   │   ├── cache-manager.test.ts
│   │   ├── request-handler.test.ts
│   │   ├── state-manager.test.ts
│   │   ├── offline-sync.test.ts
│   │   ├── realtime.test.ts
│   │   ├── devtools.test.ts
│   │   └── bindings/
│   │       ├── react.test.tsx
│   │       ├── vue.test.ts
│   │       ├── svelte.test.ts
│   │       └── solid.test.ts
│   ├── integration/
│   │   ├── client.test.ts
│   │   ├── cache-graph.test.ts
│   │   ├── offline-sync.test.ts
│   │   └── realtime.test.ts
│   └── fixtures/
│       ├── mock-server.ts
│       ├── test-data.ts
│       └── mock-websocket.ts
├── examples/                       # 20+ organized examples (see above)
├── website/                        # React 19 + Vite 6 + Tailwind 4
│   ├── public/
│   │   ├── CNAME                   # queryflow.oxog.dev
│   │   ├── llms.txt                # Copied from root
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui
│   │   │   ├── layout/
│   │   │   ├── code/               # @oxog/codeshine wrapper
│   │   │   └── common/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   └── vite.config.ts
├── llms.txt                        # LLM reference (< 2000 tokens)
├── SPECIFICATION.md                # Package spec
├── IMPLEMENTATION.md               # Architecture
├── TASKS.md                        # Task breakdown
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## WEBSITE REQUIREMENTS

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| Vite | 6.x | Build Tool |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI Components |
| @oxog/codeshine | latest | Syntax Highlighting |
| Lucide React | latest | Icons |
| React Router | 7.x | Routing |

### @oxog/codeshine Integration

Use @oxog/codeshine for ALL code blocks:

```tsx
import { CodeBlock } from '@oxog/codeshine/react';

// Theme must sync with app theme
const codeTheme = isDarkMode ? 'github-dark' : 'github-light';

<CodeBlock 
  code={code} 
  language="typescript" 
  theme={codeTheme}
  lineNumbers
  copyButton
/>
```

### Required Features

- IDE-style code blocks with macOS traffic lights
- Dark/Light theme toggle (synced with codeshine)
- GitHub star button with real count
- Footer: "Made with ❤️ by Ersin KOÇ"
- Links to github.com/ersinkoc/queryflow
- npm package link
- CNAME: queryflow.oxog.dev
- Search with Cmd+K
- Mobile responsive

### Required Pages

1. **Home** - Hero, features, quick start, stats
2. **Docs** - Introduction, Installation, Quick Start, Guides
3. **API Reference** - All functions and types documented
4. **Examples** - Categorized with runnable code
5. **Plugins** - Core + Optional plugin documentation
6. **Playground** - Live code editor

---

## GITHUB ACTIONS

Single workflow file: `.github/workflows/deploy.yml`

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Build package
        run: npm run build
      
      - name: Build website
        working-directory: ./website
        run: |
          npm ci
          npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## CONFIG FILES

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/plugins/index.ts',
    'src/bindings/react/index.ts',
    'src/bindings/vue/index.ts',
    'src/bindings/svelte/index.ts',
    'src/bindings/solid/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'vue', 'svelte', 'solid-js'],
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        'mcp-server/',
        '*.config.*',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

### package.json

```json
{
  "name": "@oxog/queryflow",
  "version": "1.0.0",
  "description": "Intelligent data fetching with predictive caching, offline-first sync, and real-time subscriptions",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./plugins": {
      "import": {
        "types": "./dist/plugins/index.d.ts",
        "default": "./dist/plugins/index.js"
      },
      "require": {
        "types": "./dist/plugins/index.d.cts",
        "default": "./dist/plugins/index.cjs"
      }
    },
    "./react": {
      "import": {
        "types": "./dist/bindings/react/index.d.ts",
        "default": "./dist/bindings/react/index.js"
      },
      "require": {
        "types": "./dist/bindings/react/index.d.cts",
        "default": "./dist/bindings/react/index.cjs"
      }
    },
    "./vue": {
      "import": {
        "types": "./dist/bindings/vue/index.d.ts",
        "default": "./dist/bindings/vue/index.js"
      },
      "require": {
        "types": "./dist/bindings/vue/index.d.cts",
        "default": "./dist/bindings/vue/index.cjs"
      }
    },
    "./svelte": {
      "import": {
        "types": "./dist/bindings/svelte/index.d.ts",
        "default": "./dist/bindings/svelte/index.js"
      },
      "require": {
        "types": "./dist/bindings/svelte/index.d.cts",
        "default": "./dist/bindings/svelte/index.cjs"
      }
    },
    "./solid": {
      "import": {
        "types": "./dist/bindings/solid/index.d.ts",
        "default": "./dist/bindings/solid/index.js"
      },
      "require": {
        "types": "./dist/bindings/solid/index.d.cts",
        "default": "./dist/bindings/solid/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:coverage"
  },
  "keywords": [
    "query",
    "fetch",
    "cache",
    "data-fetching",
    "react-query",
    "tanstack-query",
    "offline-first",
    "real-time",
    "websocket",
    "state-management",
    "typescript",
    "react"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/queryflow.git"
  },
  "bugs": {
    "url": "https://github.com/ersinkoc/queryflow/issues"
  },
  "homepage": "https://queryflow.oxog.dev",
  "engines": {
    "node": ">=18"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "vue": ">=3.0.0",
    "svelte": ">=4.0.0",
    "solid-js": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true },
    "vue": { "optional": true },
    "svelte": { "optional": true },
    "solid-js": { "optional": true }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

---

## MCP SERVER SPECIFICATION

### Purpose

MCP server to help LLMs better understand and use QueryFlow.

### Tools

#### 1. queryflow_docs_search

Search QueryFlow documentation.

```typescript
{
  name: 'queryflow_docs_search',
  description: 'Search QueryFlow documentation',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  }
}
```

#### 2. queryflow_example_fetch

Fetch code examples by category.

```typescript
{
  name: 'queryflow_example_fetch',
  description: 'Fetch QueryFlow code examples',
  parameters: {
    category: { 
      type: 'string', 
      enum: ['basic', 'mutations', 'cache', 'realtime', 'offline', 'react', 'advanced']
    },
    name: { type: 'string', description: 'Example name (optional)' }
  }
}
```

#### 3. queryflow_api_reference

Get API reference for specific functions/types.

```typescript
{
  name: 'queryflow_api_reference',
  description: 'Get QueryFlow API reference',
  parameters: {
    symbol: { type: 'string', description: 'Function or type name (e.g., useQuery, QueryOptions)' }
  }
}
```

#### 4. queryflow_migrate

Help migrate from TanStack Query.

```typescript
{
  name: 'queryflow_migrate',
  description: 'Get migration guide from TanStack Query',
  parameters: {
    code: { type: 'string', description: 'TanStack Query code to migrate' }
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md with complete spec
- [ ] Create IMPLEMENTATION.md with architecture
- [ ] Create TASKS.md with ordered task list
- [ ] All three documents reviewed and complete

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests before or with each feature
- [ ] Maintain 100% coverage throughout
- [ ] JSDoc on every public API with @example
- [ ] Create examples as features are built

### Core Package
- [ ] Micro kernel with plugin system
- [ ] Event bus implementation
- [ ] State machine (idle → loading → success/error)
- [ ] Query function with all features
- [ ] Mutation function with optimistic updates
- [ ] Subscribe function for real-time
- [ ] Cache manager with graph detection
- [ ] Request handler with retry/dedup
- [ ] All error classes defined

### Plugins (V1)
- [ ] offline-sync plugin (IndexedDB)
- [ ] realtime plugin (WS/SSE/polling)
- [ ] devtools plugin (time-travel)

### Framework Bindings (V1)
- [ ] React: useQuery, useMutation, useSubscription, Provider
- [ ] Vue: useQuery, useMutation, useSubscription, provide
- [ ] Svelte: query store, mutation store, subscription store
- [ ] Solid: createQuery, createMutation, createSubscription

### LLM-Native
- [ ] llms.txt created (< 2000 tokens)
- [ ] llms.txt copied to website/public/
- [ ] README optimized for LLM consumption
- [ ] All public APIs have JSDoc + @example
- [ ] 20+ examples in organized folders
- [ ] package.json has 12 keywords

### MCP Server
- [ ] docs_search tool
- [ ] example_fetch tool
- [ ] api_reference tool
- [ ] migrate tool
- [ ] Server tested and working

### Website
- [ ] All pages implemented
- [ ] @oxog/codeshine integrated with theme sync
- [ ] Dark/Light theme toggle
- [ ] CNAME file: queryflow.oxog.dev
- [ ] Mobile responsive
- [ ] Footer with Ersin KOÇ, MIT, GitHub

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] All examples run successfully
- [ ] Website builds without errors
- [ ] README is complete and accurate
- [ ] Bundle size < 4KB core, < 15KB total

---

## TanStack Query vs QueryFlow Comparison

| Feature | TanStack Query | QueryFlow |
|---------|---------------|-----------|
| Bundle Size | ~12KB | < 4KB core |
| Dependencies | Several | Zero |
| Cache Invalidation | Manual | Intelligent Graph |
| Offline Support | Addon/Limited | Built-in IndexedDB |
| Real-time | Wrapper needed | Native WS/SSE |
| DevTools | Separate package | Built-in |
| Optimistic Updates | 20+ lines | 3 lines |
| Framework Support | React-first | True Agnostic |
| TypeScript | Good | Strict mode + JSDoc |
| Plugin System | Limited | Micro-kernel |
| LLM-Native | No | Yes (llms.txt, MCP) |

---

## BEGIN IMPLEMENTATION

Start by creating **SPECIFICATION.md** with the complete package specification based on everything above.

Then create **IMPLEMENTATION.md** with architecture decisions.

Then create **TASKS.md** with ordered, numbered tasks.

Only after all three documents are complete, begin implementing code by following TASKS.md sequentially.

**Remember:**
- This package will be published to npm
- It must be production-ready
- Zero runtime dependencies
- 100% test coverage
- Professionally documented
- LLM-native design
- Beautiful documentation website
- MCP server for AI integration
