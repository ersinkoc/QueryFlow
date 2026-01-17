import { createClient, useQuery, QueryFlowProvider, Suspense } from '@oxog/react';

const client = createClient({ baseUrl: 'https://api.example.com' });

const postsQuery = query('/posts');

function PostsList() {
  const { data } = useQuery('/posts');

  return (
    <ul>
      {data?.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

function PostsFallback() {
  return <div>Loading...</div>;
}

export default function App() {
  return (
    <QueryFlowProvider client={client}>
      <Suspense fallback={<PostsFallback />}>
        <PostsList />
      </Suspense>
    </QueryFlowProvider>
  );
}
