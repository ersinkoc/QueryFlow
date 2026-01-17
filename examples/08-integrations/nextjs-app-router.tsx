'use client';

import { createClient, QueryFlowProvider, useQuery } from '@oxog/queryflow/react';

const client = createClient({ baseUrl: '/api' });

export function QueryFlowProviderWrapper({ children }: { children: any }) {
  return <QueryFlowProvider client={client}>{children}</QueryFlowProvider>;
}

export default function Page() {
  const { data, isLoading } = useQuery('/posts');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map((post: any) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
