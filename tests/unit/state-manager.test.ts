import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager, stateManagerPlugin } from '../../src/plugins/core/state-manager.js';
import { Kernel } from '../../src/kernel.js';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(async () => {
    stateManager = new StateManager();
  });

  it('should set and get query state', () => {
    // First transition to loading (required by StateMachine)
    stateManager.setQueryState('query1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    // Then transition to success
    const successSnapshot = {
      state: 'success' as const,
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setQueryState('query1', successSnapshot);
    const retrieved = stateManager.getQueryState('query1');

    expect(retrieved?.state).toBe('success');
    expect(retrieved?.data).toEqual({ value: 123 });
  });

  it('should return undefined for non-existent query state', () => {
    expect(stateManager.getQueryState('nonexistent')).toBeUndefined();
  });

  it('should subscribe to query state changes', () => {
    const listener = vi.fn();
    stateManager.subscribeToQuery('query1', listener);

    // Transition to loading
    stateManager.setQueryState('query1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'loading' })
    );
  });

  it('should return unsubscribe function for queries', () => {
    const listener = vi.fn();
    const unsubscribe = stateManager.subscribeToQuery('query1', listener);

    stateManager.setQueryState('query1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    unsubscribe();

    // This should not trigger the listener since we unsubscribed
    stateManager.setQueryState('query1', {
      state: 'success',
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should set and get mutation state', () => {
    // First transition to loading
    stateManager.setMutationState('mutation1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    // Then transition to success
    const successSnapshot = {
      state: 'success' as const,
      data: { id: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setMutationState('mutation1', successSnapshot);
    const retrieved = stateManager.getMutationState('mutation1');

    expect(retrieved?.state).toBe('success');
    expect(retrieved?.data).toEqual({ id: 123 });
  });

  it('should subscribe to mutation state changes', () => {
    const listener = vi.fn();
    stateManager.subscribeToMutation('mutation1', listener);

    stateManager.setMutationState('mutation1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'loading' })
    );
  });

  it('should clear all queries', () => {
    stateManager.setQueryState('query1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    stateManager.setQueryState('query2', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    stateManager.clearQueries();

    expect(stateManager.getQueryState('query1')).toBeUndefined();
    expect(stateManager.getQueryState('query2')).toBeUndefined();
  });

  it('should clear all mutations', () => {
    stateManager.setMutationState('mutation1', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    stateManager.setMutationState('mutation2', {
      state: 'loading',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    });

    stateManager.clearMutations();

    expect(stateManager.getMutationState('mutation1')).toBeUndefined();
    expect(stateManager.getMutationState('mutation2')).toBeUndefined();
  });
});
