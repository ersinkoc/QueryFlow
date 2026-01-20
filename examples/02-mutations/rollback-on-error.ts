/**
 * Custom rollback handling on mutation error
 *
 * @description Demonstrates manual rollback strategies when mutations fail
 * @example
 * ```typescript
 * import { mutation } from '@oxog/queryflow';
 *
 * const deleteUser = mutation('/users/:id', {
 *   method: 'DELETE',
 *   optimistic: (cache, input) => {
 *     // Store original for rollback
 *     const original = cache.get('/users');
 *     cache.set('_rollback', original);
 *     cache.update('/users', (users) => users.filter(u => u.id !== input.id));
 *   },
 *   onError: () => {
 *     // Restore original data
 *     const original = cache.get('_rollback');
 *     cache.set('/users', original);
 *   },
 * });
 * ```
 */
import { createClient, mutation } from '@oxog/queryflow';

interface User {
  id: string;
  name: string;
  email: string;
}

const client = createClient({ baseUrl: '/api' });

// Delete mutation with manual rollback
const deleteUser = mutation<void, { id: string }>('/users/:id', {
  method: 'DELETE',

  optimistic: (cache, input) => {
    // Store original data for potential rollback
    const originalUsers = cache.get('/users') as User[];
    const deletedUser = originalUsers.find((u) => u.id === input.id);

    // Store rollback data
    cache.set('_rollback_users', originalUsers);
    cache.set('_rollback_deleted_user', deletedUser);

    // Optimistically remove from list
    cache.update('/users', (users: User[]) => users.filter((u) => u.id !== input.id));
  },

  onError: (_error, _variables, _context) => {
    // Restore original data on error
    const originalUsers = client.cache.get('_rollback_users');
    if (originalUsers) {
      client.cache.set('/users', originalUsers);
    }

    // Clean up rollback data
    client.cache.invalidate('_rollback_users');
    client.cache.invalidate('_rollback_deleted_user');

    // Show error to user
    console.error('Failed to delete user. Changes have been reverted.');
  },

  onSuccess: () => {
    // Clean up rollback data on success
    client.cache.invalidate('_rollback_users');
    client.cache.invalidate('_rollback_deleted_user');
  },
});

// Update mutation with field-level rollback
const updateUser = mutation<User, Partial<User> & { id: string }>('/users/:id', {
  method: 'PATCH',

  optimistic: (cache, input) => {
    // Store only the changed fields for more granular rollback
    const currentUser = cache.get(`/users/${input.id}`) as User;
    const changedFields: Partial<User> = {};

    for (const key of Object.keys(input) as (keyof User)[]) {
      if (key !== 'id' && input[key] !== undefined) {
        changedFields[key] = currentUser[key];
      }
    }

    cache.set(`_rollback_user_${input.id}`, changedFields);

    // Apply optimistic update
    cache.update(`/users/${input.id}`, (user: User) => ({
      ...user,
      ...input,
    }));
  },

  onError: (_error, variables, _context) => {
    // Restore only the changed fields
    const rollbackData = client.cache.get(`_rollback_user_${variables.id}`);
    if (rollbackData) {
      client.cache.update(`/users/${variables.id}`, (user: User) => ({
        ...user,
        ...rollbackData,
      }));
    }

    // Clean up
    client.cache.invalidate(`_rollback_user_${variables.id}`);
  },

  onSuccess: (_data, variables) => {
    // Clean up rollback data
    client.cache.invalidate(`_rollback_user_${variables.id}`);
  },
});

// Batch operation with transaction-like rollback
const batchDeleteUsers = async (userIds: string[]) => {
  // Store all original data before starting
  const originalUsers = client.cache.get('/users') as User[];
  client.cache.set('_transaction_backup', originalUsers);

  const results: { success: string[]; failed: string[] } = {
    success: [],
    failed: [],
  };

  for (const id of userIds) {
    try {
      await deleteUser.mutate({ id });
      results.success.push(id);
    } catch {
      results.failed.push(id);
    }
  }

  // If any failed, rollback everything
  if (results.failed.length > 0) {
    const backup = client.cache.get('_transaction_backup');
    if (backup) {
      client.cache.set('/users', backup);
      console.log('Transaction rolled back due to failures:', results.failed);
    }
  }

  client.cache.invalidate('_transaction_backup');
  return results;
};

export { deleteUser, updateUser, batchDeleteUsers };
