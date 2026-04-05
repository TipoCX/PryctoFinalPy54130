import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, Post, PaginatedResponse } from '../types';
import PostCard from '../components/PostCard';
import { MessageCircle, LogOut, Camera, Trash } from 'lucide-react';

export default function Profile() {
  const { userid } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe();
    fetchUser();
  }, [userid]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPosts([]);
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (user) {
      fetchPosts(page);
    }
  }, [user, page, activeTab]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 150) {
      if (!loading && hasMore) {
        setPage(p => p + 1);
      }
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const fetchMe = async () => {
    try {
      const res = await api.get('users/me/');
      setMe(res.data);
    } catch { }
  };

  const fetchUser = async () => {
    try {
      let targetId = userid;
      if (userid === 'me') {
        const resMe = await api.get('users/me/');
        targetId = resMe.data.id;
      }
      const res = await api.get(`users/${targetId}/`);
      setUser(res.data);
    } catch {
      alert("Usuario no encontrado.");
      navigate('/');
    }
  };

  const fetchPosts = async (pageNumber: number) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const param = activeTab === 'posts' ? `author=${user.id}` : `liked_by=${user.id}`;
      const res = await api.get<PaginatedResponse<Post>>(`posts/?${param}&page=${pageNumber}`);
      if (pageNumber === 1) {
        setPosts(res.data.results);
      } else {
        setPosts(prev => [...prev, ...res.data.results]);
      }
      setHasMore(res.data.next !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const res = await api.post(`posts/${postId}/like/`);
      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            has_liked: res.data.liked,
            likes_count: res.data.likes_count
          };
        }
        return post;
      }));
    } catch {
      alert("Debes iniciar sesión para dar MG.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.post('avatars/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchUser(); // Reload profile visually
    } catch (err) {
      alert("Error subiendo el avatar.");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const avRes = await api.get('avatars/');
      if (avRes.data.length > 0) {
        await api.delete(`avatars/${avRes.data[0].id}/`);
        fetchUser(); // Reload profile
      }
    } catch (err) {
      alert("Error borrando el avatar");
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando perfil...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Cabecera de Perfil */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100px', height: '100px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#111827', fontSize: '2.5rem' }}>
              {user.username[0].toUpperCase()}
            </div>
          )}

          {me && me.id === user.id && (
            <div style={{ position: 'absolute', bottom: '-5px', right: '-15px', display: 'flex', gap: '0.25rem' }}>
              <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
              <label htmlFor="avatar-upload" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', background: 'var(--color-primary)', color: '#111827', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title="Subir Avatar">
                <Camera size={16} />
              </label>
              {user.avatar_url && (
                <button onClick={handleDeleteAvatar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, width: '32px', height: '32px', background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: '50%', border: '1px solid var(--color-danger-border)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Borrar Avatar">
                  <Trash size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <h2 style={{ margin: '0 0 0.5rem 0' }}>{user.username}</h2>
        <p style={{ margin: '0', color: 'var(--color-text-muted)' }}>Unido en: {new Date(user.date_joined || '').toLocaleDateString()}</p>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'var(--color-text-base)', fontWeight: 'bold' }}>
          <span>{user.post_count} Posts Totales</span>
        </div>

        {/* Botón Chat SI no soy yo */}
        {me && me.id !== user.id && (
          <button
            onClick={async () => {
              try {
                const res = await api.post('conversations/', { participants: [user.id] });
                navigate(`/messages/${res.data.id}`);
              } catch {
                alert("Error al iniciar conversación.");
              }
            }}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <MessageCircle size={18} />
            <span>Chatear</span>
          </button>
        )}

        {/* Botón Logout SI soy yo */}
        {me && me.id === user.id && (
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              window.dispatchEvent(new Event('authChange'));
              navigate('/login');
            }}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-text)' }}
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'posts' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'posts' ? 'bold' : 'normal', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'likes' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'likes' ? 'bold' : 'normal', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Me Gustas
        </button>
      </div>

      {/* Posts List */}
      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLikeToggle={toggleLike} />
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-primary)' }}>
            Cargando el historial...
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
            No hay más publicaciones para mostrar en esta sección.
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
            No hay nada para mostrar aquí aún.
          </div>
        )}
      </div>
    </div>
  );
}
