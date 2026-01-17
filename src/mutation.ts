import type { MutationOptions } from './types.js';
import type { Kernel } from './kernel.js';
import type { StateSnapshot } from './core/state-machine.js';
import { StateMachine } from './core/state-machine.js';
import { buildFullURL } from './core/url-parser.js';
import { QueryFlowError } from './errors.js';

export class MutationInstance<TData = unknown, TVariables = unknown, TError = Error> {
  private kernel: Kernel;
  private urlTemplate: string;
  private options: MutationOptions<TData, TVariables, TError>;
  private stateMachine: StateMachine;
  private optimisticContext: unknown = null;
  private key: string;

  constructor(kernel: Kernel, urlTemplate: string, options: MutationOptions<TData, TVariables, TError> = {}) {
    this.kernel = kernel;
    this.urlTemplate = urlTemplate;
    this.options = options;
    this.stateMachine = new StateMachine();
    this.key = this.buildKey();

    this.stateMachine.subscribe(this.handleStateChange.bind(this));
  }

  async mutate(variables: TVariables): Promise<TData> {
    this.stateMachine.transition('loading');

    let context: unknown = undefined;

    try {
      if (this.options.onMutate) {
        context = await this.options.onMutate(variables);
        this.optimisticContext = context;
      }

      const cache = this.kernel.getContext().cache;

      if (this.options.optimistic && cache) {
        try {
          this.options.optimistic(cache, variables);
        } catch (error) {
          this.optimisticContext = context;
        }
      }

      const result = await this.executeMutation(variables);

      this.stateMachine.transition('success', result.data);
      this.options.onSuccess?.(result.data, variables);

      this.handleInvalidation();

      return result.data;
    } catch (error) {
      const typedError = error as TError;
      this.rollback();
      this.stateMachine.transition('error', undefined, typedError as Error);
      this.options.onError?.(typedError, variables, this.optimisticContext);
      throw typedError;
    } finally {
      this.optimisticContext = null;
      this.options.onSettled?.(
        this.stateMachine.getData() as TData | undefined,
        this.stateMachine.getError() as TError | null,
        variables
      );
    }
  }

  async mutateAsync(variables: TVariables): Promise<TData> {
    return this.mutate(variables);
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

  getVariables(): TVariables | undefined {
    return this.optimisticContext as TVariables | undefined;
  }

  isPending(): boolean {
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

  reset(): void {
    this.stateMachine.reset();
    this.optimisticContext = null;
  }

  private async executeMutation(variables: TVariables): Promise<{ data: TData }> {
    const fullUrl = buildFullURL(
      this.kernel.getConfig().baseUrl,
      this.urlTemplate,
      this.options.params ?? {}
    );

    const configHeaders = this.kernel.getConfig().headers;
    const baseHeaders =
      typeof configHeaders === 'function' ? configHeaders() : configHeaders ?? {};

    const response = await fetch(fullUrl, {
      method: this.options.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...baseHeaders,
        ...this.options.headers,
      },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const error = new QueryFlowError('NETWORK_ERROR', `HTTP ${response.status}: ${response.statusText}`);
      throw error;
    }

    const data = await response.json();
    return { data };
  }

  private rollback(): void {
    this.kernel.emit('mutation:rollback', { context: this.optimisticContext });
  }

  private handleInvalidation(): void {
    if (this.options.invalidates === 'auto') {
      this.kernel.emit('cache:invalidate:auto', { url: this.urlTemplate });
    } else if (Array.isArray(this.options.invalidates)) {
      this.kernel.emit('cache:invalidate', { pattern: this.options.invalidates });
    }
  }

  private buildKey(): string {
    return `${this.urlTemplate}:${this.options.method ?? 'POST'}`;
  }

  private handleStateChange(snapshot: StateSnapshot): void {
    this.kernel.emit('mutation:state', { key: this.key, snapshot });
  }
}

export function mutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options: MutationOptions<TData, TVariables, TError> = {}
): MutationInstance<TData, TVariables, TError> {
  const kernel = getQueryContext();
  return new MutationInstance<TData, TVariables, TError>(kernel, url, options);
}
