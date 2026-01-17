import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const docs = `
# QueryFlow Documentation

## Installation
npm install @oxog/queryflow

## Core API
- createClient(config): Create QueryFlow client
- query(url, options): Fetch data
- mutation(url, options): Modify data
- subscribe(url, options): Real-time updates

## Cache API
- client.cache.get(key): Get cached data
- client.cache.set(key, data): Set cached data
- client.cache.invalidate(pattern): Invalidate queries
`;

const examples = {
  basic: {
    name: 'simple-query',
    code: `import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/api' });
const users = await query('/users').fetch();`,
  },
  mutations: {
    name: 'optimistic-update',
    code: `const update = mutation('/users/:id', {
  method: 'PATCH',
  optimistic: (cache, input) => {
    cache.update('/users/:id', draft => Object.assign(draft, input));
  },
});`,
  },
};

const apiReference = {
  createClient: {
    signature: 'createClient(config?: ClientConfig): QueryFlowClient',
    description: 'Creates a new QueryFlow client instance',
    params: 'config - Optional configuration object with baseUrl, headers, timeout, etc.',
    returns: 'QueryFlowClient instance with cache access',
  },
  query: {
    signature: 'query<TData>(url: string, options?: QueryOptions): QueryInstance<TData>',
    description: 'Creates a query instance for fetching data',
    params: 'url - URL template with optional :params, options - Query options',
    returns: 'QueryInstance with fetch(), fetchSafe(), and state methods',
  },
};

async function handleDocsSearch(args: { query: string }) {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  if (lowerQuery.includes('install')) {
    results.push('npm install @oxog/queryflow');
  }
  if (lowerQuery.includes('cache')) {
    results.push('Use client.cache.get() to access cache');
  }
  if (lowerQuery.includes('query')) {
    results.push('Use query(url, options) to fetch data');
  }

  return {
    content: docs,
    matches: results.length > 0,
  };
}

async function handleExampleFetch(args: { category: string, name?: string }) {
  const categoryData = examples[category as keyof typeof examples];
  if (!categoryData) {
    throw new Error(\`Unknown category: ${category}\`);
  }

  return {
    content: categoryData.code,
    name: categoryData.name,
  };
}

async function handleApiReference(args: { symbol: string }) {
  const api = apiReference[symbol as keyof typeof apiReference];
  if (!api) {
    throw new Error(\`Unknown API: ${symbol}\`);
  }

  return {
    ...api,
    symbol,
  };
}

async function handleMigrate(args: { code: string }) {
  const migrations: Record<string, string> = {
    'useQuery': 'useQuery',
    'QueryClient': 'createClient',
  };

  for (const [from, to] of Object.entries(migrations)) {
    if (code.includes(from)) {
      return {
        original: code,
        migrated: code.replace(new RegExp(from, 'g'), to),
      };
    }
  }

  return { original: code, migrated: code };
}

const TOOLS: Tool[] = [
  {
    name: 'queryflow_docs_search',
    description: 'Search QueryFlow documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
    },
  },
  },
  {
    name: 'queryflow_example_fetch',
    description: 'Fetch QueryFlow code examples by category',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['basic', 'mutations', 'cache', 'realtime', 'offline', 'react', 'advanced'],
        },
        name: { type: 'string' },
      },
    },
  },
  {
    name: 'queryflow_api_reference',
    description: 'Get QueryFlow API reference',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'API function or type name' },
      },
    },
  },
  {
    name: 'queryflow_migrate',
    description: 'Migrate from TanStack Query',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'TanStack Query code to migrate' },
      },
    },
  },
];

async function main() {
  const server = new Server(
    {
      name: 'queryflow-mcp-server',
      version: '1.0.0',
    },
    {
      transport: new StdioServerTransport(),
    },
  );

  server.setRequestHandler(ListToolsHandler(TOOLS));

  await server.start();
}

main().catch(console.error);
