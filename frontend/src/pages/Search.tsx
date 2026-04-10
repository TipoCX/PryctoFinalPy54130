import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import type { User, Post, PaginatedResponse } from '../types';
import PostCard from '../components/PostCard';
import { useToast } from '../components/Toast';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (query) {
      searchAll(query);
    } else {
      setPosts([]);
      setUsers([]);
    }
  }, [query]);

  const fetchMe = async () => {
    try {
      const res = await api.get('users/me/');
      setMe(res.data);
    } catch { }
  };

  const searchAll = async (q: string) => {
    setLoading(true);
    try {
      const [postRes, userRes] = await Promise.all([
        api.get<PaginatedResponse<Post>>(`posts/?search=${encodeURIComponent(q)}`),
        api.get<PaginatedResponse<User>>(`users/?search=${encodeURIComponent(q)}`)
      ]);
      setPosts(postRes.data.results);
      setUsers(userRes.data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const res = await api.post(`posts/${postId}/like/`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, has_liked: res.data.liked, likes_count: res.data.likes_count } : p));
    } catch {
      showToast('Error al dar like.', 'error');
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await api.delete(`posts/${postId}/`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post eliminado.', 'success');
    } catch {
      showToast('Error al borrar el post.', 'error');
    }
  };

  const handleEditPost = async (postId: number, titulo: string, contenido: string) => {
    try {
      const res = await api.patch(`posts/${postId}/`, { titulo, contenido });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, titulo: res.data.titulo, contenido: res.data.contenido } : p));
      showToast('Post actualizado.', 'success');
    } catch {
      showToast('Error al editar el post.', 'error');
    }
  };

  if (!query) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ color: 'var(--color-text-muted)' }}>Escribí algo en la barra de búsqueda para empezar</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Resultados para "<span style={{ color: 'var(--color-primary)' }}>{query}</span>"</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'posts' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'posts' ? 'bold' : 'normal', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'users' ? 'bold' : 'normal', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Usuarios ({users.length})
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-primary)' }}>Buscando...</div>
      )}

      {!loading && activeTab === 'posts' && (
        <div>
          {posts.length > 0 ? posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={me?.id} onLikeToggle={toggleLike} onDelete={handleDeletePost} onEdit={handleEditPost} />
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              No se encontraron posts.
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.length > 0 ? users.map(user => (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              className="glass-panel"
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textDecoration: 'none',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#111827', fontSize: '1.1rem' }}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--color-text-base)' }}>{user.username}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user.post_count ?? 0} posts</div>
              </div>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
              No se encontraron usuarios.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
