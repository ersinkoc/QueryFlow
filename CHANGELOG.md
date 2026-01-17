# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-17

### Added

#### Core
- `createClient(config?)` - Create a QueryFlow client instance with configuration
- `query(url, options?)` - Declarative data fetching with automatic caching
- `mutation(url, options?)` - Data mutations with optimistic updates and rollback
- `subscribe(url, options)` - Real-time subscriptions (WebSocket, SSE, polling)

#### Architecture
- Micro-kernel plugin architecture with event bus
- Intelligent cache graph with automatic relationship detection
- State machine for query lifecycle management (idle -> loading -> success/error)
- URL template parser with parameter support

#### Plugins
- **cache-manager** - Graph-based caching with TTL and pattern invalidation
- **request-handler** - Fetch wrapper with retry, deduplication, and timeout
- **state-manager** - Query state tracking and transitions
- **offline-sync** - IndexedDB persistence with background sync
- **realtime** - WebSocket, SSE, and polling transports
- **devtools** - Time-travel debugging with state history

#### Framework Bindings
- **React** - `useQuery`, `useMutation`, `useSubscription`, `QueryFlowProvider`
- **Vue** - `useQuery`, `useMutation`, `useSubscription`, `provideQueryFlow`
- **Svelte** - `query`, `mutation`, `subscription` stores
- **Solid** - `createQuery`, `createMutation`, `createSubscription`, `QueryFlowProvider`

#### Error Handling
- `QueryFlowError` - Base error class with error codes
- `NetworkError` - Network request failures
- `TimeoutError` - Request timeout errors
- `ValidationError` - Response validation errors

#### Developer Experience
- Zero runtime dependencies
- ESM and CJS dual package format
- Full TypeScript strict mode support
- Comprehensive JSDoc documentation
- LLM-native design with `llms.txt`

### Documentation
- Complete README with examples
- 20+ code examples organized by category
- API reference documentation

[Unreleased]: https://github.com/ersinkoc/queryflow/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ersinkoc/queryflow/releases/tag/v1.0.0
