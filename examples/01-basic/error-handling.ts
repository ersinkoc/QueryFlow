import { createClient, query } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://jsonplaceholder.typicode.com' });

// Error handling with try-catch
async function tryCatchExample() {
  const postsQuery = query('/posts');
  try {
    const posts = await postsQuery.fetch();
    console.log('Posts:', posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

// Error handling with safe fetch
async function safeFetchExample() {
  const postsQuery = query('/posts');
  const { data, error } = await postsQuery.fetchSafe();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Data:', data);
  }
}

// Error handling with callbacks
async function callbackExample() {
  const postsQuery = query('/posts', {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
    onSettled: () => console.log('Settled'),
  });

  await postsQuery.fetch();
}

async function main() {
  await tryCatchExample();
  await safeFetchExample();
  await callbackExample();
}

main().catch(console.error);
