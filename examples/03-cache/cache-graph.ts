/**
 * Cache graph and automatic relationship detection
 *
 * @description Demonstrates how QueryFlow detects relationships between queries
 * and automatically invalidates related cache entries
 * @example
 * ```typescript
 * import { query, mutation } from '@oxog/queryflow';
 *
 * // These queries are automatically related by URL pattern
 * const user = query('/users/:id', { params: { id: '123' } });
 * const posts = query('/users/:id/posts', { params: { id: '123' } });
 *
 * // Mutation with auto-invalidation
 * const updateUser = mutation('/users/:id', {
 *   method: 'PATCH',
 *   invalidates: 'auto', // Automatically invalidates related queries
 * });
 * ```
 */
import { createClient, query, mutation } from '@oxog/queryflow';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  authorId: string;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
}

const client = createClient({ baseUrl: '/api' });

/**
 * QueryFlow's cache graph automatically detects relationships:
 *
 * URL Pattern Analysis:
 * - /users/123 → entity: users, id: 123
 * - /users/123/posts → parent: users/123, entity: posts
 * - /posts/456/comments → parent: posts/456, entity: comments
 *
 * When /users/123 is invalidated, /users/123/posts is also invalidated
 */

// User query
const userQuery = (userId: string) =>
  query<User>(`/users/${userId}`, {
    params: { id: userId },
    staleTime: 5000,
  });

// User's posts query (child of user)
const userPostsQuery = (userId: string) =>
  query<Post[]>(`/users/${userId}/posts`, {
    params: { id: userId },
    staleTime: 5000,
  });

// Post's comments query
const postCommentsQuery = (postId: string) =>
  query<Comment[]>(`/posts/${postId}/comments`, {
    params: { postId },
    staleTime: 5000,
  });

// Update user mutation with auto-invalidation
const updateUser = mutation<User, Partial<User> & { id: string }>('/users/:id', {
  method: 'PATCH',
  /**
   * With invalidates: 'auto', QueryFlow will:
   * 1. Parse the mutation URL pattern
   * 2. Find all cached queries that are related
   * 3. Invalidate: /users/123, /users/123/posts, etc.
   */
  invalidates: 'auto',
});

// Create post mutation
const createPost = mutation<Post, Omit<Post, 'id'>>('/posts', {
  method: 'POST',
  /**
   * Manual invalidation when auto-detection isn't enough
   */
  invalidates: ['/posts', '/users/:authorId/posts'],
});

// Delete post mutation
const deletePost = mutation<void, { id: string; authorId: string }>('/posts/:id', {
  method: 'DELETE',
  invalidates: 'auto',
});

/**
 * Example: Load a user and their related data
 */
async function loadUserProfile(userId: string) {
  const user = await userQuery(userId).fetch();
  const posts = await userPostsQuery(userId).fetch();

  console.log('User:', user);
  console.log('Posts:', posts);

  return { user, posts };
}

/**
 * Example: Update user - related queries auto-invalidate
 */
async function updateUserName(userId: string, name: string) {
  await updateUser.mutate({ id: userId, name });

  // After this mutation, the cache graph will invalidate:
  // - /users/123 (the user entity)
  // - /users/123/posts (child queries)
  // - Any other queries that match the pattern

  console.log('User updated and related cache invalidated');
}

/**
 * Example: Manual cache graph inspection
 */
function inspectCacheRelationships() {
  // You can manually check what's in the cache
  const allCachedKeys = ['user-123', 'user-123-posts', 'posts-456-comments'];

  // QueryFlow internally maintains a relationship graph
  console.log('Cached keys:', allCachedKeys);
}

/**
 * Example: Pattern-based invalidation
 */
function invalidateUserData(userId: string) {
  // Invalidate all queries matching pattern
  client.cache.invalidate(`/users/${userId}*`);

  // This will invalidate:
  // - /users/123
  // - /users/123/posts
  // - /users/123/settings
  // - etc.
}

export {
  userQuery,
  userPostsQuery,
  postCommentsQuery,
  updateUser,
  createPost,
  deletePost,
  loadUserProfile,
  updateUserName,
  inspectCacheRelationships,
  invalidateUserData,
};
