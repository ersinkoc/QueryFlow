import { createClient, useQuery } from '@oxog/queryflow/react';

const client = createClient({ baseUrl: 'https://api.example.com' });

export default function InfinitePosts() {
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data, isFetching, hasNextPage } = useQuery('/posts', {
    params: { page, limit },
  });

  const loadMore = () => {
    if (!isFetching && hasNextPage) {
      setPage(p => p + 1);
    }
  };

  return (
    <div>
      <ul>
        {data?.map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={loadMore} disabled={isFetching}>
        {isFetching ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
