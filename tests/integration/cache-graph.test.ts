import { describe, it, beforeEach, afterEach } from 'vitest';
import { createClient, query, setQueryContext } from '../../src/index.js';

describe('Cache Graph Integration', () => {
  let client: any;

  beforeEach(() => {
    client = createClient({ baseUrl: 'https://api.example.com' });
    setQueryContext(client.getKernel());
  });

  afterEach(() => {
    client.destroy();
    setQueryContext(null as any);
  });

  it('should detect relationships between queries', async () => {
    const userQuery = query('/users/:id');
    const postsQuery = query('/users/:id/posts');

    expect(userQuery).toBeDefined();
    expect(postsQuery).toBeDefined();
  });

  it('should invalidate related queries', () => {
    client.cache.set('/users/123', { id: 123, name: 'User' });
    client.cache.set('/users/123/posts', [{ id: 1, title: 'Post' }]);

    client.cache.invalidate('/users/*');

    expect(client.cache.get('/users/123')).toBeUndefined();
    expect(client.cache.get('/users/123/posts')).toBeUndefined();
  });
});
