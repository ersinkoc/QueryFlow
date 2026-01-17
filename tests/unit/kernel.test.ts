import { describe, it, expect, vi } from 'vitest';
import type { Plugin } from '../../src/types.js';

describe('Kernel', () => {
  it('should create kernel with config', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const config = { baseUrl: 'https://api.com', timeout: 5000 };
    const kernel = new Kernel(config);

    expect(kernel.getConfig()).toEqual(config);
  });

  it('should register plugin', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
    } as Plugin;

    const kernel = new Kernel();
    kernel.register(plugin);

    expect(plugin.install).toHaveBeenCalledWith(kernel);
  });

  it('should throw on duplicate plugin registration', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
    } as Plugin;

    const kernel = new Kernel();
    kernel.register(plugin);

    expect(() => kernel.register(plugin)).toThrow('already registered');
  });

  it('should check plugin dependencies', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const depPlugin = {
      name: 'dep-plugin',
      version: '1.0.0',
      install: vi.fn(),
    } as Plugin;

    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      dependencies: ['dep-plugin'],
      install: vi.fn(),
    } as Plugin;

    const kernel = new Kernel();
    expect(() => kernel.register(plugin)).toThrow('requires "dep-plugin"');
    kernel.register(depPlugin);
    kernel.register(plugin);
    expect(plugin.install).toHaveBeenCalled();
  });

  it('should emit events', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const kernel = new Kernel();
    const handler = vi.fn();

    kernel.on('test', handler);
    kernel.emit('test', { data: 'value' });

    expect(handler).toHaveBeenCalledWith({ data: 'value' });
  });

  it('should provide context', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const kernel = new Kernel();
    const context = kernel.getContext();

    expect(context).toBeDefined();
  });

  it('should initialize plugins', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const onInit = vi.fn();
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
      onInit,
    } as Plugin;

    const kernel = new Kernel();
    kernel.register(plugin);
    await kernel.initialize();

    expect(onInit).toHaveBeenCalled();
  });

  it('should destroy kernel', async () => {
    const { Kernel } = await import('../../src/kernel.js');
    const onDestroy = vi.fn();
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
      onDestroy,
    } as Plugin;

    const kernel = new Kernel();
    kernel.register(plugin);
    kernel.destroy();

    expect(onDestroy).toHaveBeenCalled();
  });
});
