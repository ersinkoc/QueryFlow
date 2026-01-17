import { createClient, query, mutation } from '@oxog/queryflow';

const getToken = () => localStorage.getItem('token');

const client = createClient({
  baseUrl: 'https://api.example.com',
  headers: () => ({
    'Authorization': `Bearer ${getToken()}`,
  }),
});

const login = mutation('/auth/login', {
  method: 'POST',
  onSuccess: (data: any) => {
    localStorage.setItem('token', data.token);
  },
});

await login.mutate({ username: 'user', password: 'pass' });
const user = await query('/me').fetch();
