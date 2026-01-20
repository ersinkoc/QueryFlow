/**
 * Server-Sent Events (SSE) subscription example
 *
 * @description Demonstrates real-time updates using Server-Sent Events
 * @example
 * ```typescript
 * import { subscribe } from '@oxog/queryflow';
 *
 * const notifications = subscribe('/notifications', {
 *   transport: 'sse',
 *   reconnect: true,
 *   onMessage: (data) => console.log(data),
 * });
 * ```
 */
import { subscribe } from '@oxog/queryflow';

// SSE subscription with auto-reconnection
const notifications = subscribe<{ id: string; message: string; type: string }>('/notifications', {
  transport: 'sse',
  reconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,

  onOpen: () => {
    console.log('SSE connection established');
  },

  onMessage: (notification) => {
    console.log('New notification:', notification);

    // Handle different notification types
    switch (notification.type) {
      case 'info':
        showInfoNotification(notification.message);
        break;
      case 'warning':
        showWarningNotification(notification.message);
        break;
      case 'error':
        showErrorNotification(notification.message);
        break;
      default:
        showDefaultNotification(notification.message);
    }
  },

  onError: (error) => {
    console.error('SSE error:', error);
  },

  onClose: () => {
    console.log('SSE connection closed');
  },
});

// Helper functions for UI (implementation depends on your UI framework)
function showInfoNotification(message: string) {
  console.log('[INFO]', message);
}

function showWarningNotification(message: string) {
  console.warn('[WARNING]', message);
}

function showErrorNotification(message: string) {
  console.error('[ERROR]', message);
}

function showDefaultNotification(message: string) {
  console.log('[NOTIFICATION]', message);
}

// Subscription control
export function pauseNotifications() {
  notifications.pause();
}

export function resumeNotifications() {
  notifications.resume();
}

export function stopNotifications() {
  notifications.close();
}
