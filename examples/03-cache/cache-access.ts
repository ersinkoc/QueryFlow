import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

async function main() {
  // Fetch data
  const postsQuery = query('/posts');
  await postsQuery.fetch();

  // Access cache directly
  const cachedPosts = client.cache.get('/posts');
  console.log('Cached posts:', cachedPosts);

  // Update cache
  client.cache.update('/posts', (posts: any) => {
    return [...posts, { id: 101, title: 'New Post' }];
  });

  // Get updated cache
  const updatedPosts = client.cache.get('/posts');
  console.log('Updated posts:', updatedPosts);
}

main().catch(console.error);
