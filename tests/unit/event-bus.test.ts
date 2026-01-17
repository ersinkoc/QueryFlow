import { describe, it, expect, vi } from 'vitest';

describe('EventBus', () => {
  it('should register and emit events', async () => {
    const { EventBus } = await import('../../src/core/event-bus.js');
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.emit('test', { data: 'value' });

    expect(handler).toHaveBeenCalledWith({ data: 'value' });
  });

  it('should return unsubscribe function', async () => {
    const { EventBus } = await import('../../src/core/event-bus.js');
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('test', handler);
    unsubscribe();
    bus.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support multiple handlers', async () => {
    const { EventBus } = await import('../../src/core/event-bus.js');
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('test', handler1);
    bus.on('test', handler2);
    bus.emit('test');

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should clear all listeners', async () => {
    const { EventBus } = await import('../../src/core/event-bus.js');
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.clear();
    bus.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should get listener count', async () => {
    const { EventBus } = await import('../../src/core/event-bus.js');
    const bus = new EventBus();

    bus.on('test', vi.fn());
    bus.on('test', vi.fn());
    bus.on('other', vi.fn());

    expect(bus.getListenerCount('test')).toBe(2);
    expect(bus.getListenerCount('other')).toBe(1);
    expect(bus.getListenerCount('nonexistent')).toBe(0);
  });
});
