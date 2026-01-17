# QueryFlow - Complete Package Specification

## 1. Package Overview

**Name**: `@oxog/queryflow`  
**Version**: 1.0.0  
**Type**: ESM + CJS dual package  
**License**: MIT  
**Author**: Ersin Koç (ersinkoc)  

### 1.1 Purpose

QueryFlow is a next-generation data fetching library that provides:
- Intelligent cache graph management with automatic relationship detection
- Built-in offline synchronization with IndexedDB
- Native real-time support (WebSocket, SSE, polling)
- Micro-kernel plugin architecture
- Zero runtime dependencies
- Bundle size < 4KB gzipped (core), < 15KB (all plugins)

### 1.2 Target Audience

- Frontend developers building data-driven applications
- Teams requiring offline-first capabilities
- Projects needing real-time data synchronization
- Developers working with React, Vue, Svelte, or Solid
- AI assistants needing predictable, well-documented APIs

## 2. Core Concepts

### 2.1 Micro-Kernel Architecture

```
User Layer
    ↓
Query/Mutation/Subscribe API
    ↓
Plugin System (Core + Optional)
    ↓
Micro Kernel (Event Bus, Error Boundary, Config)
```

**Kernel Responsibilities**:
- Plugin registration lifecycle
- Event bus for inter-plugin communication
- Error boundary and recovery
- Configuration management

### 2.2 Intelligent Cache Graph

Automatically detects relationships between queries based on:
- URL patterns (`/users/:id`, `/users/:id/posts`)
- Response data structure
- Mutation target patterns

Invalidation strategies:
- Automatic: Related queries invalidated on mutation
- Manual: Pattern-based (`/users/*`) or key-based (array)
- TTL-based: Automatic expiration

### 2.3 State Machine

Query lifecycle states:
```
idle → loading → success
  ↘          ↗     ↘
   → error ←       stale
```

States trigger events: `query:start`, `query:success`, `query:error`, `query:settled`

## 3. API Specification

### 3.1 Core Functions

#### 3.1.1 createClient

```typescript
function createClient(config?: ClientConfig): QueryFlowClient
```

Creates and returns a QueryFlow client instance.

**Parameters**:
- `baseUrl?: string` - Base URL for all requests
- `headers?: Record<string, string> | (() => Record<string, string>)` - Default headers
- `timeout?: number` - Default timeout in milliseconds
- `staleTime?: number` - Default stale time for queries
- `cacheTime?: number` - Default cache time for queries
- `retry?: number | boolean` - Default retry count
- `fetch?: typeof fetch` - Custom fetch implementation

**Returns**: QueryFlowClient instance

**Example**:
```typescript
const client = createClient({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 10000,
});
```

#### 3.1.2 query

```typescript
function query<TData = unknown, TError = Error>(
  url: string,
  options?: QueryOptions<TData, TError>
): QueryInstance<TData, TError>
```

Creates a query instance for fetching data.

**Parameters**:
- `url: string` - URL template (supports `:param` syntax)
- `options?: QueryOptions<TData, TError>` - Query options (see type def)

**Returns**: QueryInstance with `fetch()`, `fetchSafe()`, methods

**Example**:
```typescript
const users = query('/users');
const data = await users.fetch();

const user = query('/users/:id', { params: { id: '123' } });
const profile = await user.fetch();
```

#### 3.1.3 mutation

```typescript
function mutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options?: MutationOptions<TData, TVariables, TError>
): MutationInstance<TData, TVariables, TError>
```

Creates a mutation instance for modifying data.

**Parameters**:
- `url: string` - URL template
- `options?: MutationOptions<TData, TVariables, TError>` - Mutation options

**Returns**: MutationInstance with `mutate()`, `mutateAsync()` methods

**Example**:
```typescript
const createUser = mutation('/users', {
  method: 'POST',
  onSuccess: (data) => console.log('Created:', data),
});

await createUser.mutate({ name: 'John', email: 'john@example.com' });
```

#### 3.1.4 subscribe

```typescript
function subscribe<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): SubscriptionInstance<TData>
```

Creates a real-time subscription.

**Parameters**:
- `url: string` - URL template
- `options: SubscribeOptions<TData>` - Subscription options (required)

**Returns**: SubscriptionInstance with control methods

**Example**:
```typescript
const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  onMessage: (msg) => console.log(msg),
});

// Control
messages.pause();
messages.resume();
messages.close();
```

### 3.2 Type Definitions

#### 3.2.1 ClientConfig

```typescript
interface ClientConfig {
  baseUrl?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  timeout?: number;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  fetch?: typeof fetch;
}
```

#### 3.2.2 QueryOptions

```typescript
interface QueryOptions<TData = unknown, TError = Error> {
  params?: Record<string, string | number>;
  searchParams?: Record<string, string | number | boolean>;
  key?: string[];
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  retryDelay?: number | ((attempt: number) => number);
  enabled?: boolean;
  select?: (data: unknown) => TData;
  placeholderData?: TData | (() => TData);
  keepPreviousData?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}
```

#### 3.2.3 MutationOptions

```typescript
interface MutationOptions<TData = unknown, TVariables = unknown, TError = Error> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  optimistic?: (cache: CacheProxy, variables: TVariables) => void;
  invalidates?: string[] | 'auto';
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
  onMutate?: (variables: TVariables) => unknown | Promise<unknown>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  offlineSupport?: boolean;
}
```

#### 3.2.4 SubscribeOptions

```typescript
interface SubscribeOptions<TData = unknown> {
  transport: 'websocket' | 'sse' | 'polling';
  interval?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: TData) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}
```

### 3.3 Plugin System

#### 3.3.1 Plugin Interface

```typescript
interface Plugin<TContext = unknown> {
  name: string;
  version: string;
  dependencies?: string[];
  install: (kernel: Kernel<TContext>) => void;
  onInit?: (context: TContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}
```

#### 3.3.2 Core Plugins (Auto-loaded)

**cache-manager**
- Intelligent cache with graph detection
- TTL-based expiration
- Pattern-based invalidation

**request-handler**
- Fetch wrapper with retry
- Request deduplication
- Timeout and abort support

**state-manager**
- Query state machine
- Event emission on state changes
- State subscription support

#### 3.3.3 Optional Plugins

**offline-sync**
- IndexedDB persistence
- Background synchronization
- Conflict resolution strategies
- Offline mutation queuing

**realtime**
- WebSocket client
- SSE client
- Polling fallback
- Auto-reconnection logic

**devtools**
- State history tracking
- Time-travel debugging
- State export/import
- Event replay

### 3.4 Error Classes

```typescript
class QueryFlowError extends Error {
  constructor(code: string, message: string);
  readonly code: string;
}

class NetworkError extends QueryFlowError {
  constructor(message: string, cause?: Error);
  readonly cause?: Error;
}

class TimeoutError extends QueryFlowError {
  constructor(timeout: number);
  readonly timeout: number;
}

class ValidationError extends QueryFlowError {
  constructor(message: string, data: unknown);
  readonly data: unknown;
}
```

## 4. Framework Bindings

### 4.1 React

```typescript
// Provider
function QueryFlowProvider(props: { client: QueryFlowClient; children: React.ReactNode }): JSX.Element

// Hooks
function useQuery<TData, TError>(url: string, options?: QueryOptions<TData, TError>): QueryState<TData, TError>
function useMutation<TData, TVariables, TError>(url: string, options?: MutationOptions<TData, TVariables, TError>): MutationState<TData, TVariables, TError>
function useSubscription<TData>(url: string, options: SubscribeOptions<TData>): SubscriptionState<TData>
function useQueries(queries: QueryDefinition[]): QueryState[]
function useQueryClient(): QueryFlowClient
function useIsFetching(): number
function useIsMutating(): number
```

### 4.2 Vue

```typescript
// Setup
function provideQueryFlow(client: QueryFlowClient): void

// Composables
function useQuery<TData, TError>(url: string, options?: QueryOptions<TData, TError>): Ref<QueryState<TData, TError>>
function useMutation<TData, TVariables, TError>(url: string, options?: MutationOptions<TData, TVariables, TError>): MutationState<TData, TVariables, TError>
function useSubscription<TData>(url: string, options: SubscribeOptions<TData>): SubscriptionState<TData>
```

### 4.3 Svelte

```typescript
// Setup
function setQueryFlowContext(client: QueryFlowClient): void

// Stores
function queryStore<TData, TError>(url: string, options?: QueryOptions<TData, TError>): Readable<QueryState<TData, TError>>
function mutationStore<TData, TVariables, TError>(url: string, options?: MutationOptions<TData, TVariables, TError>): MutationStore<TData, TVariables, TError>
function subscriptionStore<TData>(url: string, options: SubscribeOptions<TData>): Readable<SubscriptionState<TData>>
```

### 4.4 Solid

```typescript
// Provider
function QueryFlowProvider(props: { client: QueryFlowClient; children: JSX.Element }): JSX.Element

// Primitives
function createQuery<TData, TError>(url: string, options?: QueryOptions<TData, TError>): Accessor<QueryState<TData, TError>>
function createMutation<TData, TVariables, TError>(url: string, options?: MutationOptions<TData, TVariables, TError>): MutationState<TData, TVariables, TError>
function createSubscription<TData>(url: string, options: SubscribeOptions<TData>): Accessor<SubscriptionState<TData>>
```

## 5. Performance Requirements

### 5.1 Bundle Size

| Package | Max Size (gzipped) |
|---------|-------------------|
| Core | 4KB |
| Core + All Plugins | 15KB |
| React Binding | 3KB |
| Vue Binding | 2KB |
| Svelte Binding | 2KB |
| Solid Binding | 2KB |

### 5.2 Runtime Performance

- Initial fetch: < 50ms overhead
- Cache hit: < 1ms
- Plugin registration: < 10ms per plugin
- State updates: < 5ms

## 6. Compatibility

### 6.1 Runtimes

- Node.js: 18+
- Browsers: ES2022+ (Chrome 94+, Firefox 93+, Safari 15+, Edge 94+)
- Edge: Cloudflare Workers, Deno Deploy, Vercel Edge, Bun

### 6.2 TypeScript

- Version: 5.0+
- Strict mode enabled
- All exports typed

## 7. Security Considerations

- No XSS vulnerabilities in cache operations
- Safe URL parameter handling
- No eval or Function constructor
- Content Security Policy compatible
- No sensitive data in error messages

## 8. LLM-Native Features

### 8.1 llms.txt

Root file with:
- Quick install instructions
- Basic usage examples
- API summary
- Common patterns
- Error codes reference
- Links to docs and GitHub

### 8.2 JSDoc Coverage

Every public export must have:
- Description
- @param tags
- @returns tag
- @example tag with runnable code

### 8.3 Examples

Minimum 20 organized examples across categories:
- Basic queries (4)
- Mutations (4)
- Cache operations (4)
- Real-time (4)
- Advanced patterns (4)

## 9. Testing Requirements

### 9.1 Coverage

- Lines: 100%
- Functions: 100%
- Branches: 100%
- Statements: 100%

### 9.2 Test Types

- Unit tests: All functions, classes, utilities
- Integration tests: Plugin interactions, full workflows
- Framework binding tests: Hooks, stores, providers

## 10. Documentation Requirements

### 10.1 Website

- Technology: React 19, Vite 6, Tailwind 4, shadcn/ui
- Code highlighting: @oxog/codeshine
- Pages: Home, Docs, API Reference, Examples, Plugins, Playground
- Features: Dark/Light mode, search (Cmd+K), responsive
- Domain: queryflow.oxog.dev

### 10.2 README

- Installation instructions
- Quick start guide
- Feature overview
- Comparison with alternatives
- Contributing guidelines

## 11. MCP Server

### 11.1 Purpose

Enable AI assistants to understand and use QueryFlow effectively.

### 11.2 Tools

1. `queryflow_docs_search` - Search documentation
2. `queryflow_example_fetch` - Fetch code examples by category
3. `queryflow_api_reference` - Get API reference
4. `queryflow_migrate` - Migrate from TanStack Query

## 12. Non-Negotiable Requirements

1. **Zero Runtime Dependencies**: Empty `dependencies` in package.json
2. **100% Test Coverage**: All lines, branches, functions tested
3. **Micro-Kernel Architecture**: All features via plugins
4. **Development Workflow**: SPECIFICATION.md → IMPLEMENTATION.md → TASKS.md → Code
5. **TypeScript Strict Mode**: All strict options enabled
6. **LLM-Native Design**: llms.txt, JSDoc, examples, predictable naming
7. **No External Links**: Only GitHub, npm package, custom domain allowed

## 13. Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] Build succeeds for all entry points
- [ ] Bundle sizes within limits
- [ ] All examples run successfully
- [ ] Website builds and deploys
- [ ] TypeScript strict mode passes
- [ ] No linting errors
- [ ] Documentation complete
- [ ] MCP server functional
