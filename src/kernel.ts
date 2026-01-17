import type { ClientConfig, Plugin } from './types.js';
import { EventBus } from './core/event-bus.js';

export class Kernel<TContext = unknown> {
  private plugins = new Map<string, Plugin<TContext>>();
  private eventBus = new EventBus();
  private context: TContext = {} as TContext;
  private config: ClientConfig;

  constructor(config: ClientConfig = {}) {
    this.config = config;
  }

  register(plugin: Plugin<TContext>): void {
    const { name, version, dependencies = [] } = plugin;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin "${name}" requires "${dep}" to be registered first`);
      }
    }

    plugin.install(this);
    this.plugins.set(name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    plugin.onDestroy?.();
    this.plugins.delete(name);
  }

  on(event: string, handler: (data?: unknown) => void): () => void {
    return this.eventBus.on(event, handler);
  }

  emit(event: string, data?: unknown): void {
    this.eventBus.emit(event, data);
  }

  async emitAsync(event: string, data?: unknown): Promise<void> {
    this.eventBus.emit(event, data);
  }

  getContext(): TContext {
    return this.context;
  }

  getConfig(): ClientConfig {
    return this.config;
  }

  async initialize(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.onInit?.(this.context);
    }
  }

  destroy(): void {
    for (const plugin of this.plugins.values()) {
      plugin.onDestroy?.();
    }
    this.plugins.clear();
    this.eventBus.clear();
  }
}
