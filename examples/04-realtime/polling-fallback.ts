import { createClient, subscribe } from '@oxog/queryflow';

const client = createClient({ baseUrl: 'https://api.example.com' });

// Polling transport (useful as fallback)
const status = subscribe('/status', {
  transport: 'polling',
  interval: 5000,
  onMessage: (status) => {
    console.log('Current status:', status);
  },
});

status.connect().catch(console.error);

// To pause/resume:
// status.pause();
// status.resume();
