/**
 * Automatic reconnection handling example
 *
 * @description Demonstrates reconnection strategies for real-time subscriptions
 * @example
 * ```typescript
 * import { subscribe } from '@oxog/queryflow';
 *
 * const stream = subscribe('/stream', {
 *   transport: 'websocket',
 *   reconnect: true,
 *   reconnectInterval: 1000,
 *   maxReconnectAttempts: 10,
 * });
 * ```
 */
import { subscribe } from '@oxog/queryflow';

interface StreamData {
  timestamp: number;
  payload: unknown;
}

let reconnectAttempts = 0;

// WebSocket subscription with advanced reconnection handling
const stream = subscribe<StreamData>('/stream', {
  transport: 'websocket',
  reconnect: true,
  reconnectInterval: 1000, // Start with 1 second
  maxReconnectAttempts: 10,

  onOpen: () => {
    console.log('Connected to stream');
    reconnectAttempts = 0; // Reset counter on successful connection

    // Re-authenticate or re-subscribe to channels if needed
    sendAuthToken();
    subscribeToChannels(['updates', 'alerts']);
  },

  onMessage: (data) => {
    console.log('Stream data:', data);
    processStreamData(data);
  },

  onClose: () => {
    console.log('Disconnected from stream');

    // Update UI to show disconnected state
    updateConnectionStatus('disconnected');
  },

  onError: (error) => {
    reconnectAttempts++;
    console.error(`Stream error (attempt ${reconnectAttempts}):`, error);

    if (error.message.includes('Max reconnect attempts reached')) {
      // Show manual reconnect option to user
      showReconnectButton();
    }
  },
});

// Helper functions
function sendAuthToken() {
  // Send authentication token after connection
  console.log('Sending auth token...');
}

function subscribeToChannels(channels: string[]) {
  // Subscribe to specific channels after connection
  console.log('Subscribing to channels:', channels);
}

function processStreamData(data: StreamData) {
  // Process incoming stream data
  console.log('Processing:', data.timestamp, data.payload);
}

function updateConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
  console.log('Connection status:', status);
}

function showReconnectButton() {
  console.log('Showing reconnect button to user');
}

// Manual reconnect handler
export function handleManualReconnect() {
  console.log('User triggered manual reconnect');
  reconnectAttempts = 0;
  stream.resume();
  updateConnectionStatus('reconnecting');
}

// Exponential backoff reconnection strategy
export function createExponentialBackoffSubscription(url: string) {
  let baseInterval = 1000;
  let currentInterval = baseInterval;
  const maxInterval = 30000;

  const subscription = subscribe(url, {
    transport: 'websocket',
    reconnect: true,
    reconnectInterval: currentInterval,

    onOpen: () => {
      // Reset interval on successful connection
      currentInterval = baseInterval;
    },

    onError: () => {
      // Increase interval exponentially (with cap)
      currentInterval = Math.min(currentInterval * 2, maxInterval);
      console.log(`Next reconnect in ${currentInterval}ms`);
    },
  });

  return subscription;
}

export { stream };
