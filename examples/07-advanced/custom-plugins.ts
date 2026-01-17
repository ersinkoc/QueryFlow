import { createClient, query, type Plugin } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://api.example.com' });

const loggerPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  install(kernel) {
    kernel.on('query:success', (data) => {
      console.log('[QueryFlow] Query succeeded:', data);
    });

    kernel.on('query:error', (error) => {
      console.error('[QueryFlow] Query failed:', error);
    });
  },
};

client.use(loggerPlugin);

const posts = await query('/posts');
