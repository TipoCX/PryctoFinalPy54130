import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      showToast('¡Login exitoso!', 'success');
      navigate('/');
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      showToast('Credenciales incorrectas', 'error');
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Iniciar Sesión</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          placeholder="Usuario"
          value={username} onChange={e => setUsername(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%', fontFamily: 'Inter' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%', fontFamily: 'Inter' }}
        />
        <button type="submit" style={{ marginTop: '1rem' }}>Ingresar</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </div>
    </div>
  );
}
