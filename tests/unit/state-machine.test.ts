import { describe, it, expect, vi } from 'vitest';

describe('StateMachine', () => {
  it('should transition from idle to loading', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();

    sm.transition('loading');
    expect(sm.getState()).toBe('loading');
  });

  it('should transition from loading to success', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();

    sm.transition('loading');
    sm.transition('success', { data: 'test' });
    expect(sm.getState()).toBe('success');
    expect(sm.getData()).toBe({ data: 'test' });
  });

  it('should transition from loading to error', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const error = new Error('Test error');
    const sm = new StateMachine();

    sm.transition('loading');
    sm.transition('error', undefined, error);
    expect(sm.getState()).toBe('error');
    expect(sm.getError()).toBe(error);
  });

  it('should track history', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();

    sm.transition('loading');
    sm.transition('success', { data: 'test' });

    const history = sm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].state).toBe('loading');
    expect(history[1].state).toBe('success');
  });

  it('should notify subscribers', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();
    const listener = vi.fn();

    sm.subscribe(listener);
    sm.transition('loading');

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'loading' })
    );
  });

  it('should return unsubscribe function', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();
    const listener = vi.fn();

    const unsubscribe = sm.subscribe(listener);
    unsubscribe();
    sm.transition('loading');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should prevent invalid transitions', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();

    expect(() => sm.transition('success')).toThrow('Invalid state transition');
  });

  it('should reset state', async () => {
    const { StateMachine } = await import('../../src/core/state-machine.js');
    const sm = new StateMachine();

    sm.transition('loading');
    sm.transition('success', { data: 'test' });
    sm.reset();

    expect(sm.getState()).toBe('idle');
    expect(sm.getData()).toBeUndefined();
    expect(sm.getError()).toBeNull();
    expect(sm.getHistory()).toHaveLength(0);
  });
});
