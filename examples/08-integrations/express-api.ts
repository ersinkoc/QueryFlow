import express from 'express';
import { createClient } from '@oxog/queryflow';

const app = express();

const client = createClient({ baseUrl: 'https://external-api.com' });

app.get('/api/users', async (req, res) => {
  const users = await client.query('/users').fetch();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const createUser = client.mutation('/users', { method: 'POST' });
  const user = await createUser.mutate(req.body);
  res.json(user);
});

app.listen(3000);
