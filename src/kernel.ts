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

  async emitAsync<T = unknown>(event: string, data?: unknown): Promise<T> {
    // For request:fetch events, we need to actually fetch the data
    if (event === 'request:fetch' && data && typeof data === 'object') {
      const { url, options, signal } = data as { url: string; options?: unknown; signal?: AbortSignal };
      const fullUrl = this.buildUrl(url, options);

      const response = await fetch(fullUrl, {
        signal,
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return { data: responseData } as T;
    }

    this.eventBus.emit(event, data);
    return undefined as T;
  }

  private buildUrl(url: string, options?: unknown): string {
    const baseUrl = this.config.baseUrl ?? '';
    let fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    // Replace path params
    if (options && typeof options === 'object') {
      const opts = options as { params?: Record<string, string | number>; searchParams?: Record<string, string | number | boolean> };
      if (opts.params) {
        for (const [key, value] of Object.entries(opts.params)) {
          fullUrl = fullUrl.replace(`:${key}`, String(value));
        }
      }
      // Add search params
      if (opts.searchParams) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(opts.searchParams)) {
          params.append(key, String(value));
        }
        const queryString = params.toString();
        if (queryString) {
          fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
        }
      }
    }

    return fullUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers = this.config.headers;
    if (!headers) return {};
    return typeof headers === 'function' ? headers() : headers;
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
