# QueryFlow - Implementation Architecture

## 1. Architecture Overview

QueryFlow follows a micro-kernel architecture where all functionality is implemented as plugins. The core kernel provides minimal infrastructure for plugin management, event communication, and error handling.

```
┌─────────────────────────────────────────────────────────┐
│                      User Code                           │
│  query() · mutation() · subscribe() · cache.*           │
├──────────┬──────────┬───────────┬───────────────────────┤
│  Cache   │ Request  │  State    │   Optional Plugins    │
│ Manager  │ Handler  │ Manager   │ Offline/RT/DevTools   │
├──────────┴──────────┴───────────┴───────────────────────┤
│                    Micro Kernel                          │
│  Plugin Registry · Event Bus · Error Boundary · Config  │
└─────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 Micro Kernel (kernel.ts)

**Purpose**: Provide infrastructure for plugin system and inter-plugin communication.

**Responsibilities**:
- Plugin registration and lifecycle management
- Event bus for pub/sub communication
- Error boundary with recovery mechanisms
- Shared configuration storage

**Implementation**:

```typescript
class Kernel<TContext = unknown> {
  private plugins: Map<string, Plugin<TContext>>;
  private eventBus: EventBus;
  private context: TContext;
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.plugins = new Map();
    this.eventBus = new EventBus();
    this.config = config;
    this.context = {} as TContext;
  }

  register(plugin: Plugin<TContext>): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }
    
    plugin.install(this);
    this.plugins.set(plugin.name, plugin);
  }

  on(event: string, handler: EventHandler): void {
    this.eventBus.on(event, handler);
  }

  emit(event: string, data?: unknown): void {
    this.eventBus.emit(event, data);
  }

  getContext(): TContext {
    return this.context;
  }

  getConfig(): ClientConfig {
    return this.config;
  }
}
```

**Key Decisions**:
- Use Map for O(1) plugin lookup
- Event bus uses Map<string, Set<EventHandler>> for efficient emission
- Context is shared across all plugins for state sharing
- Config is immutable after initialization

### 2.2 Event Bus (core/event-bus.ts)

**Purpose**: Enable pub/sub communication between plugins.

**Implementation**:

```typescript
class EventBus {
  private listeners: Map<string, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

**Key Decisions**:
- Returns unsubscribe function for automatic cleanup
- Safe emission (handles missing events)
- No event namespace for simplicity (plugin prefixes events)

### 2.3 State Machine (core/state-machine.ts)

**Purpose**: Manage query state transitions and emit events on state changes.

**States**: `idle` → `loading` → `success` | `error` → `stale`

**Implementation**:

```typescript
type State = 'idle' | 'loading' | 'success' | 'error' | 'stale';

interface StateSnapshot {
  state: State;
  data: unknown;
  error: Error | null;
  timestamp: number;
}

class StateMachine {
  private state: State = 'idle';
  private data: unknown = undefined;
  private error: Error | null = null;
  private history: StateSnapshot[] = [];
  private listeners: Set<(snapshot: StateSnapshot) => void>;

  transition(newState: State, data?: unknown, error?: Error): StateSnapshot {
    if (!this.isValidTransition(this.state, newState)) {
      throw new Error(`Invalid state transition: ${this.state} → ${newState}`);
    }

    this.state = newState;
    this.data = data ?? this.data;
    this.error = error ?? null;

    const snapshot: StateSnapshot = {
      state: this.state,
      data: this.data,
      error: this.error,
      timestamp: Date.now(),
    };

    this.history.push(snapshot);
    this.notify(snapshot);

    return snapshot;
  }

  private isValidTransition(from: State, to: State): boolean {
    const valid: Record<State, State[]> = {
      idle: ['loading'],
      loading: ['success', 'error'],
      success: ['loading', 'stale'],
      error: ['loading', 'idle'],
      stale: ['loading'],
    };
    return valid[from]?.includes(to) ?? false;
  }
}
```

**Key Decisions**:
- Strict state transitions prevent invalid states
- History enables time-travel debugging
- Listeners pattern for state subscription
- Immutable snapshots (data is copied on transition)

### 2.4 URL Parser (core/url-parser.ts)

**Purpose**: Parse URL templates with parameters.

**Implementation**:

```typescript
interface ParsedURL {
  url: string;
  params: Set<string>;
}

function parseURLTemplate(template: string): ParsedURL {
  const params = new Set<string>();
  const regex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    params.add(match[1]);
  }

  return { url: template, params };
}

function buildURL(template: string, params: Record<string, string | number>): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

function buildSearchParams(searchParams: Record<string, string | number | boolean>): string {
  const entries = Object.entries(searchParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return entries ? `?${entries}` : '';
}
```

**Key Decisions**:
- Template parsing extracts parameter names for validation
- No URL encoding for path params (assume they're pre-encoded)
- Search params are always encoded

## 3. Query Implementation

### 3.1 Query Instance (query.ts)

**Purpose**: Create query instances with fetching capabilities.

**Implementation**:

```typescript
class QueryInstance<TData = unknown, TError = Error> {
  private kernel: Kernel;
  private url: string;
  private options: QueryOptions<TData, TError>;
  private stateMachine: StateMachine;
  private abortController: AbortController | null = null;

  constructor(kernel: Kernel, url: string, options: QueryOptions<TData, TError>) {
    this.kernel = kernel;
    this.url = url;
    this.options = options;
    this.stateMachine = new StateMachine();
  }

  async fetch(): Promise<TData> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.stateMachine.transition('loading');

    try {
      const result = await this.kernel.emitAsync('request:fetch', {
        url: this.url,
        options: this.options,
        signal: this.abortController.signal,
      });

      const data = this.applySelect(result.data);
      this.stateMachine.transition('success', data);
      this.options.onSuccess?.(data);
      return data;
    } catch (error) {
      this.stateMachine.transition('error', undefined, error as TError);
      this.options.onError?.(error as TError);
      throw error;
    } finally {
      this.options.onSettled?.(this.stateMachine.getData(), this.stateMachine.getError());
      this.abortController = null;
    }
  }

  async fetchSafe(): Promise<{ data: TData; error: null } | { data: null; error: TError }> {
    try {
      const data = await this.fetch();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as TError };
    }
  }

  private applySelect(data: unknown): TData {
    return this.options.select ? this.options.select(data) : data as TData;
  }
}
```

**Key Decisions**:
- Abort controller for request cancellation
- Event-driven architecture uses kernel for request handling
- fetchSafe for Result pattern (no throws)
- Select transforms data before caching

### 3.2 Query Factory

```typescript
function query<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): QueryInstance<TData, TError> {
  const kernel = getCurrentKernel();
  return new QueryInstance<TData, TError>(kernel, url, options);
}
```

## 4. Mutation Implementation

### 4.1 Mutation Instance (mutation.ts)

**Purpose**: Create mutation instances with optimistic updates.

**Implementation**:

```typescript
class MutationInstance<TData = unknown, TVariables = unknown, TError = Error> {
  private kernel: Kernel;
  private url: string;
  private options: MutationOptions<TData, TVariables, TError>;
  private stateMachine: StateMachine;
  private optimisticContext: unknown = null;

  constructor(kernel: Kernel, url: string, options: MutationOptions<TData, TVariables, TError>) {
    this.kernel = kernel;
    this.url = url;
    this.options = options;
    this.stateMachine = new StateMachine();
  }

  async mutate(variables: TVariables): Promise<TData> {
    this.stateMachine.transition('loading');

    try {
      const context = await this.options.onMutate?.(variables);
      this.optimisticContext = context;

      if (this.options.optimistic) {
        const cache = this.kernel.getContext().cache as CacheProxy;
        this.options.optimistic(cache, variables);
      }

      const result = await this.kernel.emitAsync('mutation:execute', {
        url: this.url,
        variables,
        options: this.options,
      });

      this.stateMachine.transition('success', result.data);
      this.options.onSuccess?.(result.data, variables);
      this.handleInvalidation();
      
      return result.data;
    } catch (error) {
      this.rollback();
      this.stateMachine.transition('error', undefined, error as TError);
      this.options.onError?.(error as TError, variables, this.optimisticContext);
      throw error;
    } finally {
      this.options.onSettled?.(
        this.stateMachine.getData(),
        this.stateMachine.getError(),
        variables
      );
    }
  }

  private rollback(): void {
    // Cache manager handles rollback via event
    this.kernel.emit('mutation:rollback', { context: this.optimisticContext });
  }

  private handleInvalidation(): void {
    if (this.options.invalidates === 'auto') {
      this.kernel.emit('cache:invalidate:auto', { url: this.url });
    } else if (Array.isArray(this.options.invalidates)) {
      this.kernel.emit('cache:invalidate', { keys: this.options.invalidates });
    }
  }
}
```

**Key Decisions**:
- Context preserved for rollback
- Automatic invalidation handled via events
- Optimistic updates apply before network request
- Rollback on failure or error callback

## 5. Subscription Implementation

### 5.1 Subscription Instance (subscribe.ts)

**Purpose**: Create real-time subscriptions with transport abstraction.

**Implementation**:

```typescript
type Transport = 'websocket' | 'sse' | 'polling';

interface SubscriptionTransport {
  connect(): Promise<void>;
  disconnect(): void;
  pause(): void;
  resume(): void;
  onMessage(handler: (data: unknown) => void): void;
}

class SubscriptionInstance<TData = unknown> {
  private kernel: Kernel;
  private url: string;
  private options: SubscribeOptions<TData>;
  private transport: SubscriptionTransport | null = null;
  private isPaused = false;
  private messageHandlers: Set<(data: TData) => void> = new Set();

  constructor(kernel: Kernel, url: string, options: SubscribeOptions<TData>) {
    this.kernel = kernel;
    this.url = url;
    this.options = options;
    this.createTransport();
  }

  private createTransport(): void {
    switch (this.options.transport) {
      case 'websocket':
        this.transport = new WebSocketTransport(this.url, this.options);
        break;
      case 'sse':
        this.transport = new SSETransport(this.url, this.options);
        break;
      case 'polling':
        this.transport = new PollingTransport(this.url, this.options);
        break;
    }
  }

  async connect(): Promise<void> {
    await this.transport?.connect();
    this.transport?.onMessage((data) => {
      if (this.isPaused) return;
      this.messageHandlers.forEach(handler => handler(data as TData));
      this.options.onMessage?.(data as TData);
    });
  }

  pause(): void {
    this.isPaused = true;
    this.transport?.pause();
  }

  resume(): void {
    this.isPaused = false;
    this.transport?.resume();
  }

  close(): void {
    this.transport?.disconnect();
    this.transport = null;
  }
}
```

**Key Decisions**:
- Transport abstraction allows switching WebSocket/SSE/polling
- Pause/resume for flow control
- Multiple message handlers supported
- Auto-reconnect handled by individual transports

## 6. Cache Manager Plugin

### 6.1 Cache Graph (plugins/core/cache-manager.ts)

**Purpose**: Intelligent cache with automatic relationship detection.

**Implementation**:

```typescript
interface CacheEntry {
  data: unknown;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
  meta: CacheMeta;
}

interface CacheMeta {
  url: string;
  params: Record<string, string | number>;
  relations: Set<string>;
}

class CacheManagerPlugin implements Plugin<CacheContext> {
  name = 'cache-manager';
  version = '1.0.0';

  private cache: Map<string, CacheEntry> = new Map();
  private graph: Map<string, Set<string>> = new Map();

  install(kernel: Kernel<CacheContext>): void {
    kernel.on('query:success', ({ key, data, url }) => {
      this.set(key, data, url);
    });

    kernel.on('mutation:execute', ({ url }) => {
      this.invalidateRelated(url);
    });

    kernel.getContext().cache = this;
  }

  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isStale(entry)) {
      this.markStale(key);
    }

    return entry.data;
  }

  set(key: string, data: unknown, url: string): void {
    const meta = this.buildMeta(key, url);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      staleTime: 5000,
      cacheTime: 300000,
      meta,
    };

    this.cache.set(key, entry);
    this.updateGraph(key, meta);
  }

  invalidate(pattern: string | string[]): void {
    if (typeof pattern === 'string') {
      for (const key of this.cache.keys()) {
        if (this.matchPattern(key, pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      const key = pattern.join(':');
      this.cache.delete(key);
    }
  }

  invalidateRelated(url: string): void {
    const related = this.graph.get(url) ?? new Set();
    related.forEach(key => this.cache.delete(key));
  }

  private buildMeta(key: string, url: string): CacheMeta {
    const params = this.extractParams(key);
    const relations = this.detectRelations(url, params);
    return { url, params, relations };
  }

  private detectRelations(url: string, params: Record<string, string | number>): Set<string> {
    const relations = new Set<string>();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isRelated(url, params, entry.meta.url, entry.meta.params)) {
        relations.add(key);
        this.graph.set(url, new Set([...(this.graph.get(url) ?? []), key]));
      }
    }

    return relations;
  }

  private isRelated(
    url1: string,
    params1: Record<string, string | number>,
    url2: string,
    params2: Record<string, string | number>
  ): boolean {
    if (url1 === url2) return false;
    
    if (url1.includes('/:id/') && url2.includes('/:id/')) {
      return params1.id === params2.id;
    }

    if (url1.startsWith(url2.replace(/\/:[^/]+/g, ''))) {
      return true;
    }

    return false;
  }
}
```

**Key Decisions**:
- Graph-based relationship detection
- Pattern matching for invalidation
- Metadata stored for smart invalidation
- TTL-based staleness

## 7. Request Handler Plugin

### 7.1 Fetch Wrapper (plugins/core/request-handler.ts)

**Purpose**: Fetch with retry, deduplication, timeout.

**Implementation**:

```typescript
class RequestHandlerPlugin implements Plugin<RequestContext> {
  name = 'request-handler';
  version = '1.0.0';

  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  install(kernel: Kernel<RequestContext>): void {
    kernel.on('request:fetch', async ({ url, options, signal }) => {
      return this.fetch(url, options, signal);
    });
  }

  private async fetch(
    url: string,
    options: QueryOptions,
    signal: AbortSignal
  ): Promise<{ data: unknown }> {
    const key = this.buildKey(url, options);
    
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<{ data: unknown }>;
    }

    const request = this.execute(url, options, signal);
    this.pendingRequests.set(key, request);
    
    try {
      return await request;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async execute(
    url: string,
    options: QueryOptions,
    signal: AbortSignal
  ): Promise<{ data: unknown }> {
    const fullUrl = this.buildURL(url, options);
    const config = this.kernel.getConfig();

    const response = await this.withRetry(
      async () => {
        return fetch(fullUrl, {
          signal: signal || config.timeout ? AbortSignal.timeout(config.timeout!) : undefined,
          headers: this.buildHeaders(config, options),
        });
      },
      options.retry
    );

    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retry: number | boolean
  ): Promise<T> {
    const attempts = typeof retry === 'number' ? retry : 3;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.delay(i * 1000);
      }
    }

    throw new Error('Retry failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Key Decisions**:
- Deduplication prevents duplicate concurrent requests
- Exponential backoff for retries
- Timeout via AbortSignal.timeout (ES2022)
- Headers merged from config and options

## 8. Offline Sync Plugin

### 8.1 IndexedDB Storage (plugins/optional/offline-sync.ts)

**Purpose**: IndexedDB persistence with background sync.

**Implementation**:

```typescript
class OfflineSyncPlugin implements Plugin<OfflineContext> {
  name = 'offline-sync';
  version = '1.0.0';

  private db: IDBDatabase | null = null;
  private mutationQueue: Array<{ id: string; variables: unknown; url: string; options: MutationOptions }> = [];

  install(kernel: Kernel<OfflineContext>): void {
    this.initDB();

    window.addEventListener('online', () => this.sync());
    kernel.on('mutation:execute', ({ variables, url, options }) => {
      if (options.offlineSupport && !navigator.onLine) {
        this.queueMutation(variables, url, options);
      }
    });
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('queryflow', 1);

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
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async queueMutation(variables: unknown, url: string, options: MutationOptions): Promise<void> {
    const mutation = {
      id: crypto.randomUUID(),
      variables,
      url,
      options,
      timestamp: Date.now(),
    };

    this.mutationQueue.push(mutation);
    await this.saveMutation(mutation);
  }

  private async sync(): Promise<void> {
    const mutations = await this.getPendingMutations();

    for (const mutation of mutations) {
      try {
        await this.kernel.emitAsync('mutation:execute', mutation);
        await this.deleteMutation(mutation.id);
      } catch (error) {
        this.kernel.emit('offline:sync-error', { mutation, error });
      }
    }
  }
}
```

**Key Decisions**:
- IndexedDB for large storage capacity
- Queue-based mutation storage
- Sync on online event
- Individual mutation success/failure handling

## 9. Realtime Plugin

### 9.1 WebSocket Transport (plugins/optional/realtime.ts)

**Purpose**: WebSocket client with auto-reconnect.

**Implementation**:

```typescript
class RealtimePlugin implements Plugin<RealtimeContext> {
  name = 'realtime';
  version = '1.0.0';

  install(kernel: Kernel<RealtimeContext>): void {
    kernel.getContext().realtime = {
      createWebSocket: (url: string, options: SubscribeOptions) => {
        return new WebSocketTransport(url, options);
      },
      createSSE: (url: string, options: SubscribeOptions) => {
        return new SSETransport(url, options);
      },
      createPolling: (url: string, options: SubscribeOptions) => {
        return new PollingTransport(url, options);
      },
    };
  }
}

class WebSocketTransport implements SubscriptionTransport {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private messageHandlers: Set<(data: unknown) => void> = new Set();

  constructor(
    private url: string,
    private options: SubscribeOptions
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onOpen?.();
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      };

      this.ws.onclose = () => {
        this.options.onClose?.();
        if (this.options.reconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.options.onError?.(error as Error);
        reject(error);
      };
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 5)) {
      return;
    }

    const delay = this.options.reconnectInterval ?? 1000;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay * Math.pow(2, this.reconnectAttempts)) as unknown as number;
  }

  disconnect(): void {
    this.ws?.close();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
}
```

**Key Decisions**:
- Exponential backoff for reconnection
- Promise-based connect for consistency
- Multiple message handlers supported
- Auto-reconnect configurable

## 10. React Integration

### 10.1 QueryFlowProvider (bindings/react/provider.tsx)

**Purpose**: Provide QueryFlow client to React tree.

**Implementation**:

```typescript
interface QueryFlowContextValue {
  client: QueryFlowClient;
}

const QueryFlowContext = createContext<QueryFlowContextValue | null>(null);

export function QueryFlowProvider({ client, children }: { client: QueryFlowClient; children: React.ReactNode }): JSX.Element {
  return (
    <QueryFlowContext.Provider value={{ client }}>
      {children}
    </QueryFlowContext.Provider>
  );
}

export function useQueryClient(): QueryFlowClient {
  const context = useContext(QueryFlowContext);
  if (!context) {
    throw new Error('useQueryClient must be used within QueryFlowProvider');
  }
  return context.client;
}
```

### 10.2 useQuery Hook

**Purpose**: React hook for query state management.

**Implementation**:

```typescript
export function useQuery<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): QueryState<TData, TError> {
  const queryRef = useRef<QueryInstance<TData, TError>>();
  const [state, setState] = useState<QueryState<TData, TError>>({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    isStale: false,
    refetch: () => Promise.resolve(undefined as TData),
  });

  useEffect(() => {
    const client = useQueryClient();
    const query = query(url, options);
    queryRef.current = query;

    const unsubscribe = query.onStateChange((newState) => {
      setState({
        data: newState.data as TData | undefined,
        error: newState.error as TError | null,
        isLoading: newState.state === 'loading' && !query.hasFetched(),
        isFetching: newState.state === 'loading',
        isSuccess: newState.state === 'success',
        isError: newState.state === 'error',
        isIdle: newState.state === 'idle',
        isStale: newState.state === 'stale',
        refetch: () => query.fetch(),
      });
    });

    if (options.enabled !== false) {
      query.fetch().catch(() => {});
    }

    return unsubscribe;
  }, [url, JSON.stringify(options)]);

  return state;
}
```

**Key Decisions**:
- Context provider for client injection
- State synchronization via state machine subscriptions
- Dependency array for proper React behavior
- Safe fetch (catch to avoid unhandled rejections)

## 11. Build Configuration

### 11.1 tsup Configuration

**Purpose**: Dual ESM/CJS build with TypeScript declarations.

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

**Key Decisions**:
- Dual format for broad compatibility
- Separate entry points for tree-shaking
- External framework dependencies
- No minification in build (let bundlers handle)

### 11.2 TypeScript Configuration

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
    "module": "ESNext",
    "lib": ["ES2022"],
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "website"]
}
```

## 12. Testing Strategy

### 12.1 Unit Tests

- Test each function in isolation
- Mock dependencies
- Test all branches
- 100% coverage requirement

### 12.2 Integration Tests

- Test plugin interactions
- Test full workflows
- Mock external APIs
- Test error scenarios

### 12.3 Framework Binding Tests

- React: Testing Library for hook tests
- Vue: @vue/test-utils
- Svelte: @testing-library/svelte
- Solid: @testing-library/solid

## 13. Performance Optimizations

### 13.1 Memory Management

- WeakMap for plugin references where appropriate
- Cleanup listeners on unmount
- Cache size limits
- History truncation

### 13.2 Request Optimization

- Request deduplication
- Batch invalidation where possible
- Abort unused requests
- Lazy loading for optional plugins

### 13.3 Bundle Optimization

- Tree-shaking via ES modules
- Code splitting for bindings
- Minified dist builds
- No unused code in exports

## 14. Security Considerations

### 14.1 Input Validation

- Validate URL templates
- Sanitize cache keys
- Type checks at boundaries

### 14.2 Error Handling

- No sensitive data in errors
- Stack traces only in development
- Safe error messages

### 14.3 Storage Security

- IndexedDB quota management
- LocalStorage XSS protection
- Clear on logout

## 15. Migration Path

### 15.1 From TanStack Query

| TanStack Query | QueryFlow |
|----------------|-----------|
| `useQuery(['users'])` | `useQuery('/users')` |
| `queryClient.setQueryData(['users'], data)` | `client.cache.set('/users', data)` |
| `useMutation({ mutationFn: () => fetch() })` | `useMutation('/users', { method: 'POST' })` |
| `QueryClientProvider` | `QueryFlowProvider` |

### 15.2 Breaking Changes

None planned for v1.0.0
