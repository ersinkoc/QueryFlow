import { createClient, QueryFlowProvider, useQuery, useMutation } from '@oxog/queryflow/react';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

function PostsList() {
  const { data: posts, isLoading, error, refetch } = useQuery('/posts');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {posts?.map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

function CreatePost() {
  const { mutate, isPending } = useMutation('/posts', {
    method: 'POST',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    mutate({
      title: form.title.value,
      body: form.body.value,
      userId: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" />
      <textarea name="body" placeholder="Body" />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}

export default function App() {
  return (
    <QueryFlowProvider client={client}>
      <CreatePost />
      <PostsList />
    </QueryFlowProvider>
  );
}
