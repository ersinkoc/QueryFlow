import { Link } from 'react-router-dom';
import {
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Package,
  Code2,
  Layers,
  ArrowRight,
  Github,
  CheckCircle2,
} from 'lucide-react';
import CodeBlock from '../components/code/CodeBlock';

const features = [
  {
    icon: Zap,
    title: 'Zero Dependencies',
    description: 'Completely self-contained with no runtime dependencies. Under 4KB gzipped.',
  },
  {
    icon: Layers,
    title: 'Intelligent Cache Graph',
    description:
      'Automatic relationship detection between queries. Update one entity, related queries invalidate automatically.',
  },
  {
    icon: WifiOff,
    title: 'Offline-First',
    description:
      'Built-in IndexedDB persistence. Works offline, syncs when online with conflict resolution.',
  },
  {
    icon: Wifi,
    title: 'Real-time Native',
    description: 'First-class WebSocket, SSE, and polling support with automatic reconnection.',
  },
  {
    icon: RefreshCw,
    title: 'Optimistic Updates',
    description: 'Declarative optimistic updates in 3 lines. Automatic rollback on error.',
  },
  {
    icon: Package,
    title: 'Plugin Architecture',
    description:
      'Micro-kernel design. Core is minimal, extend with plugins for offline, devtools, and more.',
  },
];

const frameworks = [
  { name: 'React', supported: true },
  { name: 'Vue', supported: true },
  { name: 'Svelte', supported: true },
  { name: 'Solid', supported: true },
];

const quickStartCode = `import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });

// Fetch data
const users = await query('/users').fetch();

// With React
import { useQuery } from '@oxog/queryflow/react';

function UserList() {
  const { data, isLoading, error } = useQuery('/users');

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}`;

const optimisticCode = `const updateUser = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', (d) => Object.assign(d, input));
  },
});

// UI updates instantly, rolls back on error
await updateUser.mutate({ name: 'New Name' });`;

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Zero dependencies, under 4KB
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Intelligent Data Fetching for{' '}
              <span className="gradient-text">Modern Apps</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              QueryFlow is a next-generation data fetching library with predictive caching,
              offline-first sync, and real-time subscriptions. True framework agnostic.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://github.com/ersinkoc/queryflow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Framework badges */}
            <div className="flex items-center justify-center gap-6 mt-12">
              {frameworks.map((fw) => (
                <div key={fw.name} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {fw.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Code */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Quick Start</h2>
            <CodeBlock code={quickStartCode} language="typescript" filename="app.tsx" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              QueryFlow provides powerful features while maintaining a minimal footprint.
              No bloat, just smart data management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimistic Updates Highlight */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Optimistic Updates in 3 Lines
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Declarative optimistic updates with automatic rollback. No boilerplate,
                no manual cache management. Just fast, responsive UIs.
              </p>
              <ul className="space-y-3">
                {[
                  'Instant UI feedback',
                  'Automatic rollback on error',
                  'Type-safe cache updates',
                  'Works offline',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <CodeBlock code={optimisticCode} language="typescript" filename="mutation.ts" />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why QueryFlow?
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">TanStack Query</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">QueryFlow</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Bundle Size', '~12KB', '< 4KB'],
                    ['Dependencies', 'Several', 'Zero'],
                    ['Cache Invalidation', 'Manual', 'Intelligent Graph'],
                    ['Offline Support', 'Addon', 'Built-in'],
                    ['Real-time', 'Wrapper', 'Native'],
                    ['DevTools', 'Separate Package', 'Built-in'],
                    ['Optimistic Updates', '20+ lines', '3 lines'],
                  ].map(([feature, tanstack, queryflow]) => (
                    <tr key={feature} className="border-b">
                      <td className="py-4 px-4">{feature}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{tanstack}</td>
                      <td className="text-center py-4 px-4 font-medium text-primary">{queryflow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Code2 className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Install QueryFlow and experience intelligent data fetching.
            </p>
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-card rounded-lg border font-mono text-sm">
              npm install @oxog/queryflow
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
