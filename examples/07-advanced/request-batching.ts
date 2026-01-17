import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://api.example.com' });

const usersQuery = query('/users');
const postsQuery = query('/posts');
const commentsQuery = query('/comments');

const [users, posts, comments] = await Promise.all([
  usersQuery.fetch(),
  postsQuery.fetch(),
  commentsQuery.fetch(),
]);

console.log('Batch results:', { users, posts, comments });
