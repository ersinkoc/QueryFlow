import { createClient, subscribe } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'ws://localhost:8080' });

const messages = subscribe('/chat/messages', {
  transport: 'websocket',
  onMessage: (message) => {
    console.log('New message:', message);
  },
  onOpen: () => {
    console.log('WebSocket connected');
  },
  onClose: () => {
    console.log('WebSocket disconnected');
  },
  onError: (error) => {
    console.error('WebSocket error:', error);
  },
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
});

messages.connect().catch(console.error);

// To close: messages.close();
