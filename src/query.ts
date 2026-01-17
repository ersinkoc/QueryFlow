import type { QueryOptions } from './types.js';
import type { Kernel } from './kernel.js';
import type { StateSnapshot } from './core/state-machine.js';
import { StateMachine } from './core/state-machine.js';
import { buildFullURL, generateCacheKey } from './core/url-parser.js';
import { QueryFlowError } from './errors.js';

interface QueryContext {
  kernel: Kernel;
  currentKernel: Kernel | null;
}

let queryContext: QueryContext | null = null;

export function setQueryContext(kernel: Kernel): void {
  queryContext = { kernel, currentKernel: kernel };
}

export function getQueryContext(): Kernel {
  if (!queryContext?.currentKernel) {
    throw new QueryFlowError('NO_CLIENT', 'No QueryFlow client available. Use createClient() first.');
  }
  return queryContext.currentKernel;
}

export class QueryInstance<TData = unknown, TError = Error> {
  private kernel: Kernel;
  private urlTemplate: string;
  private options: QueryOptions<TData, TError>;
  private stateMachine: StateMachine;
  private abortController: AbortController | null = null;
  private key: string;
  private hasFetched = false;

  constructor(kernel: Kernel, urlTemplate: string, options: QueryOptions<TData, TError> = {}) {
    this.kernel = kernel;
    this.urlTemplate = urlTemplate;
    this.options = options;
    this.stateMachine = new StateMachine();
    this.key = this.buildKey();

    this.stateMachine.subscribe(this.handleStateChange.bind(this));
  }

  async fetch(): Promise<TData> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    if (this.options.enabled === false) {
      return this.getPlaceholderOrUndefined();
    }

    this.stateMachine.transition('loading');

    try {
      const cache = this.kernel.getContext().cache;
      const cachedData = cache?.get(this.key);

      if (cachedData !== undefined) {
        const data = this.applySelect(cachedData);
        this.stateMachine.transition('success', data);
        this.hasFetched = true;
        this.options.onSuccess?.(data);
        return data;
      }

      const result = await this.kernel.emitAsync('request:fetch', {
        url: this.urlTemplate,
        options: this.options,
        signal: this.abortController.signal,
      });

      const data = this.applySelect(result.data);
      this.stateMachine.transition('success', data);
      this.hasFetched = true;

      this.kernel.emit('query:success', {
        key: this.key,
        data: result.data,
        options: this.options,
        url: this.urlTemplate,
      });

      this.options.onSuccess?.(data);
      return data;
    } catch (error) {
      const typedError = error as TError;
      this.stateMachine.transition('error', undefined, typedError as Error);
      this.options.onError?.(typedError);
      throw typedError;
    } finally {
      this.options.onSettled?.(
        this.stateMachine.getData() as TData,
        this.stateMachine.getError() as TError | null
      );
      this.abortController = null;
    }
  }

  async fetchSafe(): Promise<{ data: TData; error: null } | { data: null; error: TError }> {
    try {
      const data = await this.fetch();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as TError };
    }
  }

  refetch(): Promise<TData> {
    return this.fetch();
  }

  onStateChange(listener: (snapshot: StateSnapshot) => void): () => void {
    return this.stateMachine.subscribe(listener);
  }

  getState(): StateSnapshot {
    return this.stateMachine.getHistory().at(-1) ?? {
      state: 'idle',
      data: undefined,
      error: null,
      timestamp: Date.now(),
    };
  }

  getData(): TData | undefined {
    return this.stateMachine.getData() as TData | undefined;
  }

  getError(): TError | null {
    return this.stateMachine.getError() as TError | null;
  }

  isLoading(): boolean {
    return this.stateMachine.getState() === 'loading' && !this.hasFetched;
  }

  isFetching(): boolean {
    return this.stateMachine.getState() === 'loading';
  }

  isSuccess(): boolean {
    return this.stateMachine.getState() === 'success';
  }

  isError(): boolean {
    return this.stateMachine.getState() === 'error';
  }

  isIdle(): boolean {
    return this.stateMachine.getState() === 'idle';
  }

  isStale(): boolean {
    return this.stateMachine.getState() === 'stale';
  }

  private buildKey(): string {
    const params = this.options.params ?? {};
    const searchParams = this.options.searchParams ?? {};
    return generateCacheKey(this.urlTemplate, { ...params, ...searchParams });
  }

  private applySelect(data: unknown): TData {
    return this.options.select ? this.options.select(data) : (data as TData);
  }

  private getPlaceholderOrUndefined(): TData | undefined {
    if (this.options.placeholderData !== undefined) {
      const placeholder =
        typeof this.options.placeholderData === 'function'
          ? (this.options.placeholderData as () => TData)()
          : this.options.placeholderData;
      return placeholder;
    }
    return undefined;
  }

  private handleStateChange(snapshot: StateSnapshot): void {
    this.kernel.emit('query:state', { key: this.key, snapshot });
  }
}

export function query<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): QueryInstance<TData, TError> {
  const kernel = getQueryContext();
  return new QueryInstance<TData, TError>(kernel, url, options);
}
