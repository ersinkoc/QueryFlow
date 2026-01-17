import type { Plugin, SubscribeOptions } from '../../types.js';
import type { Kernel } from '../../kernel.js';
import type { SubscriptionTransport, WebSocketTransport, SSETransport, PollingTransport } from '../../subscribe-transports.js';

interface RealtimeContext {
  realtime: {
    createWebSocket: <TData>(url: string, options: SubscribeOptions<TData>) => SubscriptionTransport<TData>;
    createSSE: <TData>(url: string, options: SubscribeOptions<TData>) => SubscriptionTransport<TData>;
    createPolling: <TData>(url: string, options: SubscribeOptions<TData>) => SubscriptionTransport<TData>;
  };
}

export const realtimePlugin: Plugin<RealtimeContext> = {
  name: 'realtime',
  version: '1.0.0',

  install(kernel: Kernel<RealtimeContext>): void {
    const context = kernel.getContext();

    context.realtime = {
      createWebSocket: <TData>(url: string, options: SubscribeOptions<TData>) => {
        const { WebSocketTransport } = require('../../subscribe-transports.js');
        return new WebSocketTransport<TData>(url, options);
      },

      createSSE: <TData>(url: string, options: SubscribeOptions<TData>) => {
        const { SSETransport } = require('../../subscribe-transports.js');
        return new SSETransport<TData>(url, options);
      },

      createPolling: <TData>(url: string, options: SubscribeOptions<TData>) => {
        const { PollingTransport } = require('../../subscribe-transports.js');
        return new PollingTransport<TData>(url, options);
      },
    };
  },
};

export type { RealtimeContext };
