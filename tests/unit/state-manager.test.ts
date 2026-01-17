import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager, stateManagerPlugin } from '../../src/plugins/core/state-manager.js';
import { Kernel } from '../../src/kernel.js';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(async () => {
    const kernel = new Kernel();
    stateManager = new StateManager();
  });

  it('should set and get query state', () => {
    const snapshot = {
      state: 'success' as const,
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setQueryState('query1', snapshot);
    const retrieved = stateManager.getQueryState('query1');

    expect(retrieved).toEqual(snapshot);
  });

  it('should return undefined for non-existent query state', () => {
    expect(stateManager.getQueryState('nonexistent')).toBeUndefined();
  });

  it('should subscribe to query state changes', () => {
    const snapshot = {
      state: 'success' as const,
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    };

    const listener = vi.fn();
    stateManager.subscribeToQuery('query1', listener);

    stateManager.setQueryState('query1', snapshot);

    expect(listener).toHaveBeenCalledWith(snapshot);
  });

  it('should return unsubscribe function for queries', () => {
    const listener = vi.fn();
    const unsubscribe = stateManager.subscribeToQuery('query1', listener);

    const snapshot = {
      state: 'success' as const,
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setQueryState('query1', snapshot);
    unsubscribe();
    stateManager.setQueryState('query1', snapshot);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should set and get mutation state', () => {
    const snapshot = {
      state: 'success' as const,
      data: { id: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setMutationState('mutation1', snapshot);
    const retrieved = stateManager.getMutationState('mutation1');

    expect(retrieved).toEqual(snapshot);
  });

  it('should subscribe to mutation state changes', () => {
    const snapshot = {
      state: 'success' as const,
      data: { id: 123 },
      error: null,
      timestamp: Date.now(),
    };

    const listener = vi.fn();
    stateManager.subscribeToMutation('mutation1', listener);

    stateManager.setMutationState('mutation1', snapshot);

    expect(listener).toHaveBeenCalledWith(snapshot);
  });

  it('should clear all queries', () => {
    const snapshot = {
      state: 'success' as const,
      data: { value: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setQueryState('query1', snapshot);
    stateManager.setQueryState('query2', snapshot);
    stateManager.clearQueries();

    expect(stateManager.getQueryState('query1')).toBeUndefined();
    expect(stateManager.getQueryState('query2')).toBeUndefined();
  });

  it('should clear all mutations', () => {
    const snapshot = {
      state: 'success' as const,
      data: { id: 123 },
      error: null,
      timestamp: Date.now(),
    };

    stateManager.setMutationState('mutation1', snapshot);
    stateManager.setMutationState('mutation2', snapshot);
    stateManager.clearMutations();

    expect(stateManager.getMutationState('mutation1')).toBeUndefined();
    expect(stateManager.getMutationState('mutation2')).toBeUndefined();
  });
});
