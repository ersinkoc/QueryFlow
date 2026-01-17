import type { SubscribeOptions } from './types.js';
import type { Kernel } from './kernel.js';
import { QueryFlowError } from './errors.js';
import type { SubscriptionTransport } from './subscribe-transports.js';
import { getQueryContext } from './query.js';

export class SubscriptionInstance<TData = unknown> {
  private kernel: Kernel;
  private url: string;
  private options: SubscribeOptions<TData>;
  private transport: SubscriptionTransport<TData> | null = null;
  private isPaused = false;
  private messageHandlers = new Set<(data: TData) => void>();
  private isConnected = false;
  private error: Error | null = null;

  constructor(kernel: Kernel, url: string, options: SubscribeOptions<TData>) {
    this.kernel = kernel;
    this.url = url;
    this.options = options;

    if (!options.transport) {
      throw new QueryFlowError('INVALID_CONFIG', 'Transport is required for subscriptions');
    }
  }

  async connect(): Promise<void> {
    const { SubscriptionTransport } = await import('./subscribe-transports.js');
    this.transport = SubscriptionTransport.create(this.url, this.options);

    try {
      await this.transport.connect();

      this.isConnected = true;
      this.error = null;
      this.options.onOpen?.();

      this.transport.onMessage((data) => {
        if (this.isPaused) return;
        this.messageHandlers.forEach(handler => handler(data));
        this.options.onMessage?.(data);
      });

      this.transport.onError((error) => {
        this.error = error;
        this.options.onError?.(error);
      });

      this.transport.onClose(() => {
        this.isConnected = false;
        this.options.onClose?.();
      });
    } catch (error) {
      this.isConnected = false;
      this.error = error as Error;
      throw error;
    }
  }

  pause(): void {
    this.isPaused = true;
    this.transport?.pause();
  }

  resume(): void {
    this.isPaused = false;
    this.transport?.resume();
  }

  close(): void {
    this.transport?.disconnect();
    this.transport = null;
    this.isConnected = false;
    this.messageHandlers.clear();
  }

  onMessage(handler: (data: TData) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getError(): Error | null {
    return this.error;
  }

  onOpen(handler: () => void): void {
    this.options.onOpen = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.options.onError = handler;
  }

  onClose(handler: () => void): void {
    this.options.onClose = handler;
  }
}

export function subscribe<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): SubscriptionInstance<TData> {
  const kernel = getQueryContext();
  return new SubscriptionInstance<TData>(kernel, url, options);
}
