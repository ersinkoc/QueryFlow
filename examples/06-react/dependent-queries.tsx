import { createClient, useQuery } from '@oxog/queryflow/react';

const client = createClient({ baseUrl: 'https://api.example.com' });

export default function UserPosts() {
  const user = useQuery('/users/:id', {
    params: { id: '123' },
  });

  const posts = useQuery('/posts', {
    params: { authorId: user.data?.id },
    enabled: !!user.data,
  });

  if (!posts.data) return <div>Loading...</div>;

  return (
    <div>
      <h2>User: {user.data?.name}</h2>
      <ul>
        {posts.data.map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
