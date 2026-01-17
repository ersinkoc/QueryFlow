import { createClient, mutation, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

// Optimistic update
const updatePost = mutation('/posts/:id', {
  method: 'PATCH',
  optimistic: (cache, variables) => {
    cache.update('/posts', (posts: any) => {
      return posts.map((p: any) =>
        p.id === variables.id ? { ...p, ...variables } : p
      );
    });
  },
});

async function main() {
  const postsQuery = query('/posts');
  await postsQuery.fetch();

  const updated = await updatePost.mutate({
    id: 1,
    title: 'Updated Title',
  });

  console.log('Updated post:', updated);
}

main().catch(console.error);
