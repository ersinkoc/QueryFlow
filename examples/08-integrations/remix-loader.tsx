import { createClient } from '@oxog/queryflow';
import { json } from '@remix-run/node';

const client = createClient({ baseUrl: 'https://api.example.com' });

export async function loader() {
  const posts = await client.query('/posts').fetch();
  return json(posts);
}

export default function Posts() {
  return <div>Posts loaded</div>;
}
