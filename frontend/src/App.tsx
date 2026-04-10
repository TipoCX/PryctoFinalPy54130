import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, User, MessageCircle, Moon, Search as SearchIcon } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Search from './pages/Search';
import { ToastProvider } from './components/Toast';
import { api } from './lib/api';
import type { Post, User as UserType, PaginatedResponse } from './types';
import './index.css';

function Navbar() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('access_token'));
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: Post[]; users: UserType[] }>({ posts: [], users: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSearchResults({ posts: [], users: [] });
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [postRes, userRes] = await Promise.all([
          api.get<PaginatedResponse<Post>>(`posts/?search=${encodeURIComponent(value)}&page_size=5`),
          api.get<PaginatedResponse<UserType>>(`users/?search=${encodeURIComponent(value)}&page_size=5`)
        ]);
        setSearchResults({ posts: postRes.data.results, users: userRes.data.results });
        setShowDropdown(true);
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  return (
    <nav className="glass-panel" style={{
      display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.5rem', marginBottom: '2rem', alignItems: 'center',
      position: 'sticky', top: '1rem', zIndex: 50,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: showNavbar ? 'translateY(0)' : 'translateY(-150%)',
      flexWrap: 'wrap', gap: '0.5rem'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ background: 'var(--color-primary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#111827' }}>
          <span style={{ fontWeight: 'bold' }}>G</span>
        </div>
        <h2 style={{ margin: 0, fontFamily: 'Outfit' }}>Gensen</h2>
      </div>

      {/* Search bar */}
      <div ref={searchRef} style={{ position: 'relative', flex: '1 1 200px', maxWidth: '360px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar posts o usuarios..."
            value={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            onFocus={() => { if (searchQuery.trim() && (searchResults.posts.length > 0 || searchResults.users.length > 0)) setShowDropdown(true); }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-base)',
              fontFamily: 'Inter',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </form>

        {/* Dropdown */}
        {showDropdown && (
          <div className="glass-panel" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
            maxHeight: '360px', overflowY: 'auto', zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            {searchLoading && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Buscando...</div>}

            {!searchLoading && searchResults.users.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuarios</div>
                {searchResults.users.map(u => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.id}`}
                    onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem',
                      textDecoration: 'none', color: 'var(--color-text-base)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#111827', fontSize: '0.75rem' }}>
                        {u.username[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.username}</span>
                  </Link>
                ))}
              </div>
            )}

            {!searchLoading && searchResults.posts.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: searchResults.users.length > 0 ? '1px solid var(--color-border)' : 'none' }}>Posts</div>
                {searchResults.posts.map(p => (
                  <Link
                    key={p.id}
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setShowDropdown(false); }}
                    style={{
                      display: 'block', padding: '0.6rem 1rem',
                      textDecoration: 'none', color: 'var(--color-text-base)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.titulo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.contenido.substring(0, 80)}{p.contenido.length > 80 ? '...' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!searchLoading && searchResults.posts.length === 0 && searchResults.users.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Sin resultados para "{searchQuery}"
              </div>
            )}

            {/* Ver todos */}
            {!searchLoading && (searchResults.posts.length > 0 || searchResults.users.length > 0) && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.5rem 1rem' }}>
                <button
                  onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowDropdown(false); }}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem',
                    padding: '0.4rem', cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  Ver todos los resultados →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
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
    <ToastProvider>
      <Router basename="/Gensen-RS">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:userid" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
