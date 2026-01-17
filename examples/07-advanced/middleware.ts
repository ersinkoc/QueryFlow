import { createClient, query, mutation } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value',
  },
});

const posts = await query('/posts');

const createPost = mutation('/posts', {
  method: 'POST',
  headers: {
    'X-Request-ID': crypto.randomUUID(),
  },
});

await createPost.mutate({ title: 'Test' });
