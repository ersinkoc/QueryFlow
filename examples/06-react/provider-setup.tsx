import { createClient, QueryFlowProvider } from '@oxog/queryflow/react';

// Create client
const client = createClient({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 10000,
  staleTime: 5000,
  cacheTime: 300000,
});

export default function App() {
  return (
    <QueryFlowProvider client={client}>
      {/* Your app components */}
      <div>App with QueryFlow</div>
    </QueryFlowProvider>
  );
}
