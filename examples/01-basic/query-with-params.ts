import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

// Query with URL parameters
const postQuery = query('/posts/:id', {
  params: { id: '1' },
});

async function main() {
  const post = await postQuery.fetch();
  console.log('Post:', post);
}

main().catch(console.error);
