/**
 * Mutation lifecycle callbacks example
 *
 * @description Demonstrates all mutation lifecycle callbacks (onMutate, onSuccess, onError, onSettled)
 * @example
 * ```typescript
 * import { mutation } from '@oxog/queryflow';
 *
 * const createPost = mutation('/posts', {
 *   method: 'POST',
 *   onMutate: (variables) => ({ startTime: Date.now() }),
 *   onSuccess: (data) => console.log('Created:', data),
 *   onError: (error, variables, context) => console.error('Failed'),
 *   onSettled: () => console.log('Done'),
 * });
 * ```
 */
import { mutation } from '@oxog/queryflow';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

interface CreatePostInput {
  title: string;
  content: string;
  authorId: string;
}

interface MutationContext {
  startTime: number;
  optimisticId: string;
}

// Full lifecycle callbacks demonstration
const createPost = mutation<Post, CreatePostInput, Error>('/posts', {
  method: 'POST',

  /**
   * onMutate - Called BEFORE the mutation starts
   * Use this to:
   * - Perform optimistic updates
   * - Store data for potential rollback
   * - Track timing or metrics
   * - Return context for other callbacks
   */
  onMutate: async (variables) => {
    console.log('Starting mutation with:', variables);

    // Generate optimistic ID
    const optimisticId = `temp-${Date.now()}`;

    // Return context object - available in onError and onSettled
    return {
      startTime: Date.now(),
      optimisticId,
    } satisfies MutationContext;
  },

  /**
   * onSuccess - Called when mutation succeeds
   * Use this to:
   * - Show success notifications
   * - Update related queries
   * - Navigate to new page
   * - Log analytics
   */
  onSuccess: (data, variables) => {
    console.log('Post created successfully!');
    console.log('Server response:', data);
    console.log('Original input:', variables);

    // Show success notification
    showNotification('success', `Post "${data.title}" created!`);

    // Track analytics
    trackEvent('post_created', {
      postId: data.id,
      authorId: data.authorId,
    });
  },

  /**
   * onError - Called when mutation fails
   * Use this to:
   * - Show error notifications
   * - Rollback optimistic updates
   * - Log errors
   * - Retry logic
   */
  onError: (error, variables, context) => {
    const ctx = context as MutationContext;
    const duration = Date.now() - ctx.startTime;

    console.error(`Mutation failed after ${duration}ms`);
    console.error('Error:', error.message);
    console.error('Variables:', variables);

    // Show error notification
    showNotification('error', `Failed to create post: ${error.message}`);

    // Log error for debugging
    logError('post_creation_failed', {
      error: error.message,
      variables,
      duration,
    });
  },

  /**
   * onSettled - Called after mutation completes (success OR error)
   * Use this to:
   * - Clean up loading states
   * - Invalidate queries
   * - Reset forms
   * - Log final metrics
   */
  onSettled: (data, error, variables) => {
    console.log('Mutation completed');

    if (error) {
      console.log('Result: Failed');
    } else {
      console.log('Result: Success', data?.id);
    }

    // Reset form state
    resetForm();

    // Refetch related data
    invalidateRelatedQueries(variables.authorId);
  },
});

// Mutation with async onMutate (for complex optimistic updates)
const updatePost = mutation<Post, Partial<Post> & { id: string }>('/posts/:id', {
  method: 'PATCH',

  onMutate: async (variables) => {
    // Cancel any outgoing refetches to avoid overwriting optimistic update
    // await cancelQueries('/posts');

    // Snapshot the previous value
    // const previousPost = queryClient.getQueryData(['posts', variables.id]);

    // Return context with snapshot
    return {
      startTime: Date.now(),
      // previousPost,
    };
  },

  onError: (_error, variables, _context) => {
    // Rollback to previous value
    // if (context.previousPost) {
    //   queryClient.setQueryData(['posts', variables.id], context.previousPost);
    // }
    console.error('Failed to update post:', variables.id);
  },

  onSettled: (_data, _error, variables) => {
    // Always refetch after error or success
    console.log('Refetching post:', variables.id);
  },
});

// Helper functions (implement based on your app)
function showNotification(type: 'success' | 'error', message: string) {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function trackEvent(name: string, data: Record<string, unknown>) {
  console.log('Analytics:', name, data);
}

function logError(name: string, data: Record<string, unknown>) {
  console.error('Error Log:', name, data);
}

function resetForm() {
  console.log('Form reset');
}

function invalidateRelatedQueries(authorId: string) {
  console.log('Invalidating queries for author:', authorId);
}

export { createPost, updatePost };
