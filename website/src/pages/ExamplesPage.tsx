import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, Copy, Check } from 'lucide-react';
import CodeBlock from '../components/code/CodeBlock';
import { cn } from '../lib/utils';

const categories = [
  { id: 'basic', name: 'Basic' },
  { id: 'mutations', name: 'Mutations' },
  { id: 'cache', name: 'Cache' },
  { id: 'realtime', name: 'Real-time' },
  { id: 'offline', name: 'Offline' },
  { id: 'react', name: 'React' },
];

const examples: Record<string, { title: string; description: string; code: string }[]> = {
  basic: [
    {
      title: 'Simple Query',
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
    {
      title: 'Query with Parameters',
      description: 'Using URL and search parameters',
      code: `import { query } from '@oxog/queryflow';

// URL parameters
const user = query('/users/:id', {
  params: { id: '123' },
});
// Fetches: /users/123

// Search parameters
const users = query('/users', {
  searchParams: {
    page: 1,
    limit: 10,
    sort: 'name',
  },
});
// Fetches: /users?page=1&limit=10&sort=name`,
    },
  ],
  mutations: [
    {
      title: 'Simple Mutation',
      description: 'Creating and updating data',
      code: `import { mutation } from '@oxog/queryflow';

const createUser = mutation('/users', {
  method: 'POST',
});

await createUser.mutate({
  name: 'John',
  email: 'john@example.com'
});`,
    },
    {
      title: 'Optimistic Update',
      description: 'Instant UI updates with rollback',
      code: `import { mutation } from '@oxog/queryflow';

const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', (draft) =>
      Object.assign(draft, input)
    );
  },
  onError: (error) => {
    console.error('Update failed, rolled back:', error);
  },
});

await updateUser.mutate({ name: 'Updated Name' });`,
    },
  ],
  cache: [
    {
      title: 'Cache Access',
      description: 'Direct cache manipulation',
      code: `import { createClient } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Get/Set
const users = client.cache.get('/users');
client.cache.set('/users', [...users, newUser]);

// Update with callback
client.cache.update('/users', (draft) => {
  draft.push({ id: '4', name: 'New User' });
});

// Invalidation
client.cache.invalidate('/users/*');
client.cache.clear();`,
    },
  ],
  realtime: [
    {
      title: 'WebSocket Subscription',
      description: 'Real-time updates via WebSocket',
      code: `import { subscribe } from '@oxog/queryflow';

const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  reconnect: true,
  reconnectInterval: 1000,

  onMessage: (message) => {
    console.log('New message:', message);
  },
  onOpen: () => console.log('Connected'),
  onClose: () => console.log('Disconnected'),
});

// Control
messages.pause();
messages.resume();
messages.close();`,
    },
  ],
  offline: [
    {
      title: 'Offline Mutations',
      description: 'Queue mutations while offline',
      code: `import { createClient, mutation } from '@oxog/queryflow';
import { offlineSync } from '@oxog/queryflow/plugins';

const client = createClient({ baseUrl: '/api' });

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,
}));

const createPost = mutation('/posts', {
  method: 'POST',
  offlineSupport: true,
});

// Works offline, syncs when online
await createPost.mutate({ title: 'My Post' });`,
    },
  ],
  react: [
    {
      title: 'Basic Hooks',
      description: 'useQuery and useMutation',
      code: `import { useQuery, useMutation } from '@oxog/queryflow/react';

function UserList() {
  const { data, isLoading, error } = useQuery('/users');

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

function CreateUser() {
  const { mutate, isPending } = useMutation('/users', {
    method: 'POST'
  });

  return (
    <button
      onClick={() => mutate({ name: 'John' })}
      disabled={isPending}
    >
      {isPending ? 'Creating...' : 'Create User'}
    </button>
  );
}`,
    },
  ],
};

export default function ExamplesPage() {
  const [activeCategory, setActiveCategory] = useState('basic');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Examples</h1>
          <p className="text-lg text-muted-foreground">
            Learn QueryFlow through practical, real-world examples.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Examples */}
        <div className="space-y-8">
          {examples[activeCategory]?.map((example, index) => (
            <div key={index} className="rounded-xl border bg-card overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold mb-2">{example.title}</h2>
                <p className="text-muted-foreground">{example.description}</p>
              </div>
              <CodeBlock
                code={example.code}
                language="typescript"
                className="border-0 rounded-none"
              />
            </div>
          ))}
        </div>

        {/* View more */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Want more examples? Check out the full examples directory on GitHub.
          </p>
          <a
            href="https://github.com/ersinkoc/queryflow/tree/main/examples"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <Code className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
