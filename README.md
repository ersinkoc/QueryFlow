# QueryFlow

> Intelligent data fetching with predictive caching, offline-first sync, and real-time subscriptions.

[![npm version](https://img.shields.io/npm/v/@oxog/queryflow.svg)](https://www.npmjs.com/package/@oxog/queryflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Features

- **Zero Dependencies** - No runtime dependencies, everything built from scratch
- **Intelligent Cache Graph** - Automatic relationship detection and smart invalidation
- **Native Real-time** - WebSocket, SSE, and polling support built-in
- **Offline-First** - IndexedDB persistence with background sync
- **Plugin Architecture** - Micro-kernel design for extensibility
- **Tiny Bundle** - < 4KB gzipped core
- **Framework Agnostic** - React, Vue, Svelte, Solid bindings
- **LLM-Native** - Designed for AI assistants with predictable APIs

## Installation

```bash
npm install @oxog/queryflow
```

## Quick Start

```typescript
import { createClient, query, mutation } from '@oxog/queryflow';

// Create a client
const client = createClient({ baseUrl: '/api' });

// Fetch data
const users = await query('/users').fetch();

// Fetch with parameters
const user = await query('/users/:id', { params: { id: '123' } }).fetch();

// Mutate data
const createUser = mutation('/users', { method: 'POST' });
await createUser.mutate({ name: 'John', email: 'john@example.com' });
```

## React Usage

```tsx
import { QueryFlowProvider, useQuery, useMutation } from '@oxog/queryflow/react';
import { createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

function App() {
  return (
    <QueryFlowProvider client={client}>
      <UserList />
    </QueryFlowProvider>
  );
}

function UserList() {
  const { data, isLoading, error, refetch } = useQuery('/users');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

function CreateUser() {
  const { mutate, isPending } = useMutation('/users', {
    method: 'POST',
    onSuccess: () => console.log('User created!'),
  });

  return (
    <button onClick={() => mutate({ name: 'John' })} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create User'}
    </button>
  );
}
```

## Vue Usage

```vue
<script setup>
import { useQuery, useMutation, provideQueryFlow } from '@oxog/queryflow/vue';
import { createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });
provideQueryFlow(client);

const { data, isLoading, error } = useQuery('/users');
const { mutate } = useMutation('/users', { method: 'POST' });
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in data" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Real-time Subscriptions

```typescript
import { subscribe } from '@oxog/queryflow';

// WebSocket
const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  onMessage: (msg) => console.log('New message:', msg),
});

// Server-Sent Events
const notifications = subscribe('/notifications', {
  transport: 'sse',
  reconnect: true,
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

## Optimistic Updates

```typescript
const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', (draft) => Object.assign(draft, input));
  },
  onError: (error, variables, context) => {
    // Automatic rollback happens
    console.error('Update failed:', error);
  },
});
```

## Plugins

### Offline Sync

```typescript
import { createClient } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,
}));
```

### DevTools

```typescript
import { devtools } from '@oxog/queryflow/plugins';

client.use(devtools({
  enabled: process.env.NODE_ENV === 'development',
  maxHistory: 100,
}));

// Time-travel debugging
client.devtools.getHistory();
client.devtools.jumpTo(5);
client.devtools.export();
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `createClient(config?)` | Create a QueryFlow client instance |
| `query(url, options?)` | Create a query for fetching data |
| `mutation(url, options?)` | Create a mutation for modifying data |
| `subscribe(url, options)` | Create a real-time subscription |

### Query Options

```typescript
interface QueryOptions<TData, TError> {
  params?: Record<string, string | number>;
  searchParams?: Record<string, string | number | boolean>;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  enabled?: boolean;
  select?: (data: unknown) => TData;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}
```

### Mutation Options

```typescript
interface MutationOptions<TData, TVariables, TError> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  optimistic?: (cache: CacheProxy, variables: TVariables) => void;
  invalidates?: string[] | 'auto';
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
}
```

## Framework Bindings

| Framework | Import Path | Hooks/Composables |
|-----------|-------------|-------------------|
| React | `@oxog/queryflow/react` | `useQuery`, `useMutation`, `useSubscription` |
| Vue | `@oxog/queryflow/vue` | `useQuery`, `useMutation`, `useSubscription` |
| Svelte | `@oxog/queryflow/svelte` | `query`, `mutation`, `subscription` stores |
| Solid | `@oxog/queryflow/solid` | `createQuery`, `createMutation`, `createSubscription` |

## Error Handling

```typescript
import { QueryFlowError, NetworkError, TimeoutError } from '@oxog/queryflow';

// Try-catch pattern
try {
  const data = await query('/users').fetch();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network failed:', error.message);
  }
}

// Result pattern (no throws)
const { data, error } = await query('/users').fetchSafe();
if (error) {
  console.error('Failed:', error.message);
}
```

## Requirements

- Node.js >= 18
- TypeScript >= 5.0 (for TypeScript projects)
- ES2022+ compatible browser

## Documentation

For full documentation, visit: [https://queryflow.oxog.dev](https://queryflow.oxog.dev)

## License

MIT © Ersin Koç

## Links

- [GitHub](https://github.com/ersinkoc/queryflow)
- [npm](https://www.npmjs.com/package/@oxog/queryflow)
- [Documentation](https://queryflow.oxog.dev)
