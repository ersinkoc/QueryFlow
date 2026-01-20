import type { SubscribeOptions } from './types.js';

export interface SubscriptionTransport<TData = unknown> {
  connect(): Promise<void>;
  disconnect(): void;
  pause(): void;
  resume(): void;
  onMessage(handler: (data: TData) => void): void;
  onError(handler: (error: Error) => void): void;
  onClose(handler: () => void): void;
}

export class SubscriptionTransportFactory {
  static create<TData>(url: string, options: SubscribeOptions<TData>): SubscriptionTransport<TData> {
    switch (options.transport) {
      case 'websocket':
        return new WebSocketTransport<TData>(url, options);
      case 'sse':
        return new SSETransport<TData>(url, options);
      case 'polling':
        return new PollingTransport<TData>(url, options);
      default:
        throw new Error(`Unsupported transport: ${options.transport}`);
    }
  }
}

class WebSocketTransport<TData = unknown> implements SubscriptionTransport<TData> {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private messageHandlers = new Set<(data: TData) => void>();
  private errorHandlers = new Set<(error: Error) => void>();
  private closeHandlers = new Set<() => void>();

  constructor(
    private url: string,
    private options: SubscribeOptions<TData>
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as TData;
            this.messageHandlers.forEach(handler => handler(data));
          } catch (error) {
            this.errorHandlers.forEach(handler => handler(error as Error));
          }
        };

        this.ws.onerror = (error) => {
          const typedError = new Error('WebSocket error');
          this.errorHandlers.forEach(handler => handler(typedError));
          reject(typedError);
        };

        this.ws.onclose = () => {
          this.closeHandlers.forEach(handler => handler());
          if (this.options.reconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  pause(): void {
    this.disconnect();
  }

  resume(): void {
    this.connect().catch(() => {});
  }

  onMessage(handler: (data: TData) => void): void {
    this.messageHandlers.add(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.add(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.add(handler);
  }

  private scheduleReconnect(): void {
    const maxAttempts = this.options.maxReconnectAttempts ?? 5;
    if (this.reconnectAttempts >= maxAttempts) {
      return;
    }

    const delay = this.options.reconnectInterval ?? 1000;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {});
    }, delay * Math.pow(2, this.reconnectAttempts)) as unknown as number;
  }
}

class SSETransport<TData = unknown> implements SubscriptionTransport<TData> {
  private eventSource: EventSource | null = null;
  private messageHandlers = new Set<(data: TData) => void>();
  private errorHandlers = new Set<(error: Error) => void>();
  private closeHandlers = new Set<() => void>();

  constructor(
    private url: string,
    private options: SubscribeOptions<TData>
  ) {}

  async connect(): Promise<void> {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TData;
        this.messageHandlers.forEach(handler => handler(data));
      } catch (error) {
        this.errorHandlers.forEach(handler => handler(error as Error));
      }
    };

    this.eventSource.onerror = () => {
      const error = new Error('SSE connection error');
      this.errorHandlers.forEach(handler => handler(error));
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.closeHandlers.forEach(handler => handler());
  }

  pause(): void {
    this.disconnect();
  }

  resume(): void {
    this.connect().catch(() => {});
  }

  onMessage(handler: (data: TData) => void): void {
    this.messageHandlers.add(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.add(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.add(handler);
  }
}

class PollingTransport<TData = unknown> implements SubscriptionTransport<TData> {
  private intervalId: number | null = null;
  private messageHandlers = new Set<(data: TData) => void>();
  private errorHandlers = new Set<(error: Error) => void>();
  private closeHandlers = new Set<() => void>();
  private isPaused = false;

  constructor(
    private url: string,
    private options: SubscribeOptions<TData>
  ) {}

  async connect(): Promise<void> {
    this.isPaused = false;
    await this.poll();
    const interval = this.options.interval ?? 5000;
    this.intervalId = setInterval(() => this.poll(), interval) as unknown as number;
  }

  disconnect(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (!this.isPaused) {
      this.closeHandlers.forEach(handler => handler());
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(): void {
    this.connect().catch(() => {});
  }

  onMessage(handler: (data: TData) => void): void {
    this.messageHandlers.add(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.add(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.add(handler);
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.messageHandlers.forEach(handler => handler(data));
    } catch (error) {
      this.errorHandlers.forEach(handler => handler(error as Error));
    }
  }
}

export { WebSocketTransport, SSETransport, PollingTransport };
