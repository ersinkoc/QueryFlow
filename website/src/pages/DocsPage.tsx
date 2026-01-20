import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import CodeBlock from '../components/code/CodeBlock';

const sidebarItems = [
  {
    title: 'Getting Started',
    items: [
      { name: 'Introduction', href: '/docs' },
      { name: 'Installation', href: '/docs/installation' },
      { name: 'Quick Start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { name: 'Queries', href: '/docs/queries' },
      { name: 'Mutations', href: '/docs/mutations' },
      { name: 'Subscriptions', href: '/docs/subscriptions' },
      { name: 'Cache', href: '/docs/cache' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { name: 'React Integration', href: '/docs/react' },
      { name: 'Offline Support', href: '/docs/offline' },
      { name: 'Real-time Updates', href: '/docs/realtime' },
      { name: 'Error Handling', href: '/docs/errors' },
    ],
  },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-20 space-y-6">
        {sidebarItems.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'block px-3 py-1.5 text-sm rounded-md transition-colors',
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

function Introduction() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Introduction to QueryFlow</h1>
      <p className="lead">
        QueryFlow is a zero-dependency data fetching library that provides intelligent caching,
        offline-first synchronization, and real-time subscriptions out of the box.
      </p>

      <h2>Why QueryFlow?</h2>
      <p>
        Modern applications need more than just data fetching. They need intelligent cache management,
        offline support, and real-time capabilities. QueryFlow provides all of this in a single,
        lightweight package.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li><strong>Zero Dependencies</strong> - No runtime dependencies, under 4KB gzipped</li>
        <li><strong>Intelligent Cache Graph</strong> - Automatic relationship detection and invalidation</li>
        <li><strong>Offline-First</strong> - Built-in IndexedDB persistence with background sync</li>
        <li><strong>Real-time Native</strong> - WebSocket, SSE, and polling support</li>
        <li><strong>Framework Agnostic</strong> - React, Vue, Svelte, Solid, or vanilla JS</li>
        <li><strong>Type-Safe</strong> - Full TypeScript support with strict mode</li>
      </ul>

      <h2>Getting Started</h2>
      <p>
        The fastest way to get started is to install QueryFlow and create your first query.
      </p>

      <CodeBlock
        code={`npm install @oxog/queryflow`}
        language="bash"
        filename="terminal"
        showLineNumbers={false}
      />

      <p>Then create a client and start fetching data:</p>

      <CodeBlock
        code={`import { createClient, query } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://api.example.com',
});

// Fetch users
const users = await query('/users').fetch();
console.log(users);`}
        language="typescript"
        filename="app.ts"
      />

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/docs/installation">Installation Guide</Link> - Detailed installation instructions</li>
        <li><Link to="/docs/quick-start">Quick Start</Link> - Build your first QueryFlow app</li>
        <li><Link to="/api">API Reference</Link> - Complete API documentation</li>
        <li><Link to="/examples">Examples</Link> - Real-world usage examples</li>
      </ul>
    </div>
  );
}

function Installation() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Installation</h1>
      <p>Install QueryFlow using your preferred package manager.</p>

      <h2>npm</h2>
      <CodeBlock code="npm install @oxog/queryflow" language="bash" showLineNumbers={false} />

      <h2>yarn</h2>
      <CodeBlock code="yarn add @oxog/queryflow" language="bash" showLineNumbers={false} />

      <h2>pnpm</h2>
      <CodeBlock code="pnpm add @oxog/queryflow" language="bash" showLineNumbers={false} />

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 18 or later</li>
        <li>TypeScript 5.0+ (optional but recommended)</li>
        <li>React 18+ (for React bindings)</li>
      </ul>

      <h2>Browser Support</h2>
      <p>QueryFlow supports all modern browsers:</p>
      <ul>
        <li>Chrome 94+</li>
        <li>Firefox 93+</li>
        <li>Safari 15+</li>
        <li>Edge 94+</li>
      </ul>
    </div>
  );
}

function QuickStart() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Quick Start</h1>
      <p>Get up and running with QueryFlow in minutes.</p>

      <h2>1. Create a Client</h2>
      <CodeBlock
        code={`import { createClient } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://api.example.com',
  staleTime: 5000,
  cacheTime: 300000,
});`}
        language="typescript"
        filename="client.ts"
      />

      <h2>2. Fetch Data</h2>
      <CodeBlock
        code={`import { query } from '@oxog/queryflow';

// Simple query
const users = await query('/users').fetch();

// Query with parameters
const user = await query('/users/:id', {
  params: { id: '123' }
}).fetch();`}
        language="typescript"
        filename="queries.ts"
      />

      <h2>3. Use with React</h2>
      <CodeBlock
        code={`import { QueryFlowProvider, useQuery } from '@oxog/queryflow/react';

function App() {
  return (
    <QueryFlowProvider client={client}>
      <UserList />
    </QueryFlowProvider>
  );
}

function UserList() {
  const { data, isLoading, error } = useQuery('/users');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`}
        language="tsx"
        filename="App.tsx"
      />

      <h2>Next Steps</h2>
      <p>Now that you have the basics, explore more features:</p>
      <ul>
        <li><Link to="/docs/mutations">Learn about mutations</Link></li>
        <li><Link to="/docs/cache">Understand the cache</Link></li>
        <li><Link to="/docs/offline">Enable offline support</Link></li>
      </ul>
    </div>
  );
}

function DocsFallback() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Documentation</h1>
      <p>This page is coming soon. In the meantime, check out:</p>
      <ul>
        <li><Link to="/docs">Introduction</Link></li>
        <li><Link to="/docs/installation">Installation</Link></li>
        <li><Link to="/docs/quick-start">Quick Start</Link></li>
      </ul>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-12">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Introduction />} />
            <Route path="installation" element={<Installation />} />
            <Route path="quick-start" element={<QuickStart />} />
            <Route path="*" element={<DocsFallback />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
