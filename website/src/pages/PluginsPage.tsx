import { Link } from 'react-router-dom';
import { Wifi, WifiOff, Bug, Puzzle, ArrowRight } from 'lucide-react';
import CodeBlock from '../components/code/CodeBlock';

const corePlugins = [
  {
    name: 'cache-manager',
    description: 'Intelligent cache graph with automatic relationship detection, TTL, and invalidation patterns.',
    included: true,
  },
  {
    name: 'request-handler',
    description: 'Fetch wrapper with retry, deduplication, timeout, and abort controller support.',
    included: true,
  },
  {
    name: 'state-manager',
    description: 'Query state machine (idle → loading → success/error) with transitions and subscriptions.',
    included: true,
  },
];

const optionalPlugins = [
  {
    icon: WifiOff,
    name: 'offlineSync',
    description: 'IndexedDB persistence with background sync and conflict resolution.',
    code: `import { offlineSync } from '@oxog/queryflow/plugins';

client.use(offlineSync({
  storage: 'indexeddb',
  syncOnReconnect: true,
  conflictResolution: 'server-wins',
  onConflict: (local, remote) => ({
    ...remote,
    ...local.unsyncedChanges,
  }),
}));`,
  },
  {
    icon: Wifi,
    name: 'realtime',
    description: 'WebSocket, SSE, and polling support with automatic reconnection.',
    code: `import { realtime } from '@oxog/queryflow/plugins';

client.use(realtime());

// Now use subscribe()
const messages = subscribe('/chat', {
  transport: 'websocket',
  reconnect: true,
});`,
  },
  {
    icon: Bug,
    name: 'devtools',
    description: 'Time-travel debugging with state history, replay, and export capabilities.',
    code: `import { devtools } from '@oxog/queryflow/plugins';

client.use(devtools({
  enabled: process.env.NODE_ENV === 'development',
  maxHistory: 100,
}));

// DevTools API
client.devtools.getHistory();
client.devtools.jumpTo(5);
client.devtools.export();`,
  },
];

export default function PluginsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Plugins</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            QueryFlow uses a micro-kernel architecture. Core functionality is minimal,
            extend with plugins as needed.
          </p>
        </div>

        {/* Core Plugins */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Core Plugins (Always Loaded)</h2>
          <div className="grid gap-4">
            {corePlugins.map((plugin) => (
              <div
                key={plugin.name}
                className="p-6 rounded-xl border bg-card flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Puzzle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold font-mono">{plugin.name}</h3>
                  <p className="text-muted-foreground mt-1">{plugin.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded">
                    Included by default
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Optional Plugins */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Optional Plugins</h2>
          <div className="space-y-8">
            {optionalPlugins.map((plugin) => (
              <div
                key={plugin.name}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="p-6 border-b">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <plugin.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold font-mono">{plugin.name}</h3>
                      <p className="text-muted-foreground mt-1">{plugin.description}</p>
                    </div>
                  </div>
                </div>
                <CodeBlock
                  code={plugin.code}
                  language="typescript"
                  className="border-0 rounded-none"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Create Custom Plugin */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Create Your Own Plugin</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Plugin Interface</h3>
              <p className="text-muted-foreground mt-1">
                Plugins are simple objects with lifecycle hooks.
              </p>
            </div>
            <CodeBlock
              code={`import type { Plugin } from '@oxog/queryflow';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: [], // Other plugins this depends on

  install(kernel) {
    // Called when plugin is registered
    kernel.on('query:success', ({ key, data }) => {
      console.log('Query succeeded:', key);
    });

    kernel.on('mutation:success', ({ key, data }) => {
      console.log('Mutation succeeded:', key);
    });
  },

  onInit(context) {
    // Called after all plugins are installed
  },

  onDestroy() {
    // Called when plugin is unregistered
  },

  onError(error) {
    // Called on error in this plugin
  },
};

// Use the plugin
client.use(myPlugin);`}
              language="typescript"
              filename="my-plugin.ts"
              className="border-0 rounded-none"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
