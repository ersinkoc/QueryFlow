import type { ClientConfig, Plugin } from './types.js';
import { Kernel } from './kernel.js';
import { setQueryContext } from './query.js';
import { cacheManagerPlugin, type CacheManager, type CacheManagerContext } from './plugins/core/cache-manager.js';
import { requestHandlerPlugin, type RequestHandler, type RequestContext } from './plugins/core/request-handler.js';
import { stateManagerPlugin, type StateManager, type StateManagerContext } from './plugins/core/state-manager.js';

type ClientContext = CacheManagerContext & RequestContext & StateManagerContext;

export interface QueryFlowClient {
  cache: {
    get(key: string): unknown;
    set(key: string, data: unknown, options?: unknown): void;
    update(key: string, updater: (data: unknown) => unknown): void;
    invalidate(pattern: string | string[]): void;
    clear(): void;
  };
  use<TContext = unknown>(plugin: Plugin<TContext>): void;
  destroy(): void;
}

export class Client implements QueryFlowClient {
  private kernel: Kernel<ClientContext>;
  private cacheManager: CacheManager;
  private requestHandler: RequestHandler;
  private stateManager: StateManager;

  constructor(config: ClientConfig = {}) {
    this.kernel = new Kernel<ClientContext>(config);

    this.kernel.register(cacheManagerPlugin as unknown as Plugin<ClientContext>);
    this.kernel.register(requestHandlerPlugin as unknown as Plugin<ClientContext>);
    this.kernel.register(stateManagerPlugin as unknown as Plugin<ClientContext>);

    const context = this.kernel.getContext();
    this.cacheManager = context.cache;
    this.requestHandler = context.requestHandler;
    this.stateManager = context.stateManager;

    setQueryContext(this.kernel as unknown as Kernel);

    this.kernel.initialize().catch(error => {
      console.error('Failed to initialize QueryFlow client:', error);
    });
  }

  get cache(): QueryFlowClient['cache'] {
    return {
      get: (key: string) => this.cacheManager.get(key),
      set: (key: string, data: unknown, options?: unknown) =>
        this.cacheManager.set(key, data, options as any),
      update: (key: string, updater: (data: unknown) => unknown) =>
        this.cacheManager.update(key, updater),
      invalidate: (pattern: string | string[]) => this.cacheManager.invalidate(pattern),
      clear: () => this.cacheManager.clear(),
    };
  }

  use<TContext = unknown>(plugin: Plugin<TContext>): void {
    this.kernel.register(plugin as unknown as Plugin<ClientContext>);
  }

  destroy(): void {
    this.kernel.destroy();
  }

  getKernel(): Kernel<ClientContext> {
    return this.kernel;
  }
}

export function createClient(config?: ClientConfig): QueryFlowClient {
  return new Client(config);
}
