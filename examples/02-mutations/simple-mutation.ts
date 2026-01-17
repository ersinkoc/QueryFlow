import { createClient, mutation } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

// Simple mutation
const createPost = mutation('/posts', {
  method: 'POST',
});

async function main() {
  const newPost = await createPost.mutate({
    title: 'Test Post',
    body: 'This is a test post',
    userId: 1,
  });

  console.log('Created post:', newPost);
}

main().catch(console.error);
