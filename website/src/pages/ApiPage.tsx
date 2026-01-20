import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import CodeBlock from '../components/code/CodeBlock';

const apiItems = [
  {
    title: 'Core',
    items: [
      { name: 'createClient', href: '/api/create-client' },
      { name: 'query', href: '/api/query' },
      { name: 'mutation', href: '/api/mutation' },
      { name: 'subscribe', href: '/api/subscribe' },
    ],
  },
  {
    title: 'React Hooks',
    items: [
      { name: 'useQuery', href: '/api/use-query' },
      { name: 'useMutation', href: '/api/use-mutation' },
      { name: 'useSubscription', href: '/api/use-subscription' },
    ],
  },
  {
    title: 'Types',
    items: [
      { name: 'QueryOptions', href: '/api/types/query-options' },
      { name: 'MutationOptions', href: '/api/types/mutation-options' },
      { name: 'ClientConfig', href: '/api/types/client-config' },
    ],
  },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-20 space-y-6">
        {apiItems.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'block px-3 py-1.5 text-sm font-mono rounded-md transition-colors',
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function ApiOverview() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>API Reference</h1>
      <p className="lead">Complete API documentation for QueryFlow.</p>

      <h2>Core Functions</h2>
      <ul>
        <li>
          <code>createClient(config)</code> - Create a QueryFlow client instance
        </li>
        <li>
          <code>query(url, options)</code> - Create a query for fetching data
        </li>
        <li>
          <code>mutation(url, options)</code> - Create a mutation for modifying data
        </li>
        <li>
          <code>subscribe(url, options)</code> - Create a real-time subscription
        </li>
      </ul>

      <h2>React Hooks</h2>
      <ul>
        <li>
          <code>useQuery(url, options)</code> - React hook for queries
        </li>
        <li>
          <code>useMutation(url, options)</code> - React hook for mutations
        </li>
        <li>
          <code>useSubscription(url, options)</code> - React hook for subscriptions
        </li>
      </ul>

      <h2>Quick Example</h2>
      <CodeBlock
        code={`import { createClient, query, mutation } from '@oxog/queryflow';

// Create client
const client = createClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
});

// Query
const users = await query('/users').fetch();

// Mutation
const createUser = mutation('/users', { method: 'POST' });
await createUser.mutate({ name: 'John' });`}
        language="typescript"
        filename="example.ts"
      />
    </div>
  );
}

function CreateClientApi() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>createClient</h1>
      <p>Creates a new QueryFlow client instance.</p>

      <h2>Signature</h2>
      <CodeBlock
        code="function createClient(config?: ClientConfig): QueryFlowClient"
        language="typescript"
        showLineNumbers={false}
      />

      <h2>Parameters</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>config.baseUrl</code></td>
            <td><code>string</code></td>
            <td>Base URL for all requests</td>
          </tr>
          <tr>
            <td><code>config.headers</code></td>
            <td><code>Record&lt;string, string&gt; | () =&gt; Record&lt;string, string&gt;</code></td>
            <td>Default headers</td>
          </tr>
          <tr>
            <td><code>config.timeout</code></td>
            <td><code>number</code></td>
            <td>Request timeout in ms</td>
          </tr>
          <tr>
            <td><code>config.staleTime</code></td>
            <td><code>number</code></td>
            <td>Time data is fresh (ms)</td>
          </tr>
          <tr>
            <td><code>config.cacheTime</code></td>
            <td><code>number</code></td>
            <td>Time to keep in cache (ms)</td>
          </tr>
        </tbody>
      </table>

      <h2>Example</h2>
      <CodeBlock
        code={`import { createClient } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  staleTime: 5000,
  cacheTime: 300000,
  headers: () => ({
    Authorization: \`Bearer \${getToken()}\`,
  }),
});

// Access cache
client.cache.get('/users');
client.cache.set('/users', data);
client.cache.invalidate('/users/*');

// Use plugins
client.use(offlineSync({ storage: 'indexeddb' }));`}
        language="typescript"
        filename="client.ts"
      />
    </div>
  );
}

function ApiFallback() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>API Documentation</h1>
      <p>This page is coming soon. Check out the <Link to="/api">API Overview</Link>.</p>
    </div>
  );
}

export default function ApiPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-12">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<ApiOverview />} />
            <Route path="create-client" element={<CreateClientApi />} />
            <Route path="*" element={<ApiFallback />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
