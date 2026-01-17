import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

const postsQuery = query('/posts', {
  searchParams: { page: 1, limit: 10, sort: 'desc' },
});

async function main() {
  const posts = await postsQuery.fetch();
  console.log('Paginated posts:', posts);
}

main().catch(console.error);
