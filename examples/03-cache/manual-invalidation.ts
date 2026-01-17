import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

async function main() {
  const postsQuery = query('/posts');
  await postsQuery.fetch();

  console.log('Initial posts:', await postsQuery.fetch());

  // Invalidate pattern
  client.cache.invalidate('/posts/*');

  console.log('After invalidation:', await postsQuery.fetch());

  // Invalidate by key
  client.cache.invalidate(['posts']);

  console.log('After key invalidation:', await postsQuery.fetch());
}

main().catch(console.error);
