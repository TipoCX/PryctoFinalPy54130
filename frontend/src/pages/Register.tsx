import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('register/', { username, email, password });
      alert('Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      alert('Error en el registro. Quizas el usuario ya existe.');
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Crear Cuenta</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          placeholder="Usuario" 
          value={username} onChange={e => setUsername(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'Inter' }}
        />
        <input 
          type="email"
          placeholder="Email" 
          value={email} onChange={e => setEmail(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'Inter' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'Inter' }}
        />
        <button type="submit" style={{ marginTop: '1rem' }}>Registrarse</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
      </div>
    </div>
  );
}
