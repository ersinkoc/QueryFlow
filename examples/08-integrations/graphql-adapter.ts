import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: '/graphql' });

async function graphqlQuery<TData = (
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

const usersQuery = query('users', {
  select: async () => {
    return graphqlQuery<{ users: Array<{ id: string; name: string }>>(`
      query { users { id name } }
    `);
  },
});

const users = await usersQuery.fetch();
console.log('GraphQL users:', users);
