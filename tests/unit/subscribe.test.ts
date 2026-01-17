import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribe, SubscriptionInstance } from '../../src/subscribe.js';
import { setQueryContext } from '../../src/query.js';
import { Kernel } from '../../src/kernel.js';
import type { SubscribeOptions } from '../../src/types.js';

describe('SubscriptionInstance', () => {
  let kernel: Kernel;

  beforeEach(async () => {
    kernel = new Kernel({ baseUrl: 'https://api.com' });
    await kernel.initialize();
    setQueryContext(kernel);
  });

  afterEach(() => {
    kernel.destroy();
    setQueryContext(null as any);
  });

  it('should create subscription instance', () => {
    const s = subscribe('/chat', { transport: 'polling' });
    expect(s).toBeInstanceOf(SubscriptionInstance);
  });

  it('should connect with polling transport', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    const s = subscribe('/chat', { transport: 'polling', interval: 100 });
    await s.connect();

    expect(s.getIsConnected()).toBe(true);
    s.close();
  });

  it('should pause and resume', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    const s = subscribe('/chat', { transport: 'polling', interval: 100 });
    await s.connect();
    s.pause();
    s.resume();

    expect(s.getIsConnected()).toBe(true);
    s.close();
  });

  it('should close subscription', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    const s = subscribe('/chat', { transport: 'polling', interval: 100 });
    await s.connect();
    s.close();

    expect(s.getIsConnected()).toBe(false);
  });

  it('should call message handlers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'hello' }),
    });

    const s = subscribe('/chat', { transport: 'polling', interval: 100 });
    const handler = vi.fn();
    s.onMessage(handler);
    await s.connect();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(handler).toHaveBeenCalledWith({ message: 'hello' });
    s.close();
  });

  it('should call onOpen', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const onOpen = vi.fn();
    const s = subscribe('/chat', { transport: 'polling', interval: 100, onOpen });
    await s.connect();

    expect(onOpen).toHaveBeenCalled();
    s.close();
  });

  it('should call onClose', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const onClose = vi.fn();
    const s = subscribe('/chat', { transport: 'polling', interval: 100, onClose });
    await s.connect();
    s.close();

    expect(onClose).toHaveBeenCalled();
  });
});
