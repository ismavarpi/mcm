import React from 'react';
import { useAuth } from '../hooks/useAuth';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);

  const handle = async () => {
    try {
      await login(username, password);
    } catch {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 400, margin: '2rem auto' }}>
      <Stack spacing={2}>
        <TextField label="Usuario" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <Button variant="contained" onClick={handle}>Login</Button>
      </Stack>
    </Paper>
  );
}
