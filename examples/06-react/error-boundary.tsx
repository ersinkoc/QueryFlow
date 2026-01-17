import { createClient, useQuery, QueryFlowProvider } from '@oxog/queryflow/react';
import { ErrorBoundary } from 'react-error-boundary';

const client = createClient({ baseUrl: 'https://api.example.com' });

function ErrorFallback({ error }: { error: Error }) {
  return <div className="error">Error: {error.message}</div>;
}

function DataComponent() {
  const { data, error, isLoading } = useQuery('/data');

  if (isLoading) return <div>Loading...</div>;
  if (error) throw error;

  return <div>{JSON.stringify(data)}</div>;
}

export default function App() {
  return (
    <QueryFlowProvider client={client}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DataComponent />
      </ErrorBoundary>
    </QueryFlowProvider>
  );
}
