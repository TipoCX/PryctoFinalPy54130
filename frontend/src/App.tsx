import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home as HomeIcon, User, MessageCircle, Moon } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import './index.css';

function Navbar() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('access_token'));
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const checkAuth = () => setIsAuth(!!localStorage.getItem('access_token'));
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className="glass-panel" style={{ 
      display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', marginBottom: '2rem', alignItems: 'center',
      position: 'sticky', top: '1rem', zIndex: 50,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: showNavbar ? 'translateY(0)' : 'translateY(-150%)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ background: 'var(--color-primary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#111827' }}>
          <span style={{ fontWeight: 'bold' }}>G</span>
        </div>
        <h2 style={{ margin: 0, fontFamily: 'Outfit' }}>Gensen</h2>
      </div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-base)' }}>
          <HomeIcon size={20} />
          <span>Inicio</span>
        </Link>
        {isAuth ? (
           <>
             <Link to="/messages" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-base)' }}>
               <MessageCircle size={20} />
               <span>Mensajes</span>
             </Link>
             <Link to="/profile/me" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-base)' }}>
               <User size={20} />
               <span>Perfil</span>
             </Link>
           </>
        ) : (
             <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
               <User size={20} />
               <span>Iniciar Sesión</span>
             </Link>
        )}
        
        <button style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '50%', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-base)' }} onClick={() => {
          document.documentElement.classList.toggle('dark-mode');
          localStorage.setItem('theme', document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light');
        }} title="Alternar Tema">
          <Moon size={20} />
        </button>
      </div>
    </nav>
  );
}

function App() {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  return (
    <Router basename="/Social-Network-Generic-Portfolio">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:userid" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<Messages />} />
      </Routes>
    </Router>
  );
}

export default App;
