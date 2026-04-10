import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Image as ImageIcon } from 'lucide-react';
import type { User, Post, PaginatedResponse } from '../types';
import PostCard from '../components/PostCard';
import { useToast } from '../components/Toast';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const { showToast } = useToast();
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

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
    } catch (e) {
      // Not logged in
    }
  };

  const fetchPosts = async (pageNumber: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Post>>(`posts/?page=${pageNumber}`);
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

  const ensureGuestAccount = async () => {
    if (me || localStorage.getItem('access_token')) return true;
    try {
      const rnd = Math.floor(Math.random() * 1000000);
      const username = `Invitado_${rnd}`;
      const password = `pass_${rnd}`;
      await api.post('register/', { username, email: `${username}@invitado.com`, password });
      const tokenRes = await api.post('token/', { username, password });
      localStorage.setItem('access_token', tokenRes.data.access);
      window.dispatchEvent(new Event('authChange'));
      await fetchMe();
      return true;
    } catch {
      return false;
    }
  };

  const handlePublish = async () => {
    if (!titulo || !contenido) return;
    try {
      await ensureGuestAccount();

      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('contenido', contenido);
      if (imagen) {
        formData.append('imagen', imagen);
      }

      await api.post('posts/', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTitulo('');
      setContenido('');
      setImagen(null);
      
      // Reiniciar el feed al publicar
      setPage(1);
      setHasMore(true);
      fetchPosts(1);
    } catch (e: any) {
      showToast('Error al publicar. ' + (e.response?.data?.imagen?.[0] || 'Verifica tu inicio de sesión.'), 'error');
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      await ensureGuestAccount();
      
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
    } catch (e) {
      showToast('Error al dar like. ¿Aún no iniciaste sesión?', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>¿Qué está pasando?</h3>
        <input 
          placeholder="Título corto..." 
          value={titulo} onChange={e => setTitulo(e.target.value)}
          style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '0.75rem', marginBottom: '0.5rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-base)', fontFamily: 'Inter' }}
        />
        <textarea 
          placeholder="Escribe tu contenido aquí..." 
          value={contenido} onChange={e => setContenido(e.target.value)}
          style={{ width: '100%', minHeight: '80px', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '0.75rem', marginBottom: '1rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-base)', fontFamily: 'Inter', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
           <input type="file" id="imagen-upload" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={e => setImagen(e.target.files?.[0] || null)} />
           <label htmlFor="imagen-upload" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-primary)' }}>
              <ImageIcon size={20} />
              <span style={{ fontSize: '0.875rem' }}>{imagen ? imagen.name : 'Adjuntar Imagen (Opcional)'}</span>
           </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {me ? (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Escribiendo como <strong>{me.username}</strong>
            </span>
          ) : (
            <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
              Se creará una cuenta de invitado
            </span>
          )}
          <button onClick={handlePublish}>Publicar</button>
        </div>
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLikeToggle={toggleLike} />
      ))}
      
      {loading && (
         <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-primary)' }}>
            Cargando el historial...
         </div>
      )}
      
      {!hasMore && posts.length > 0 && (
         <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
            No hay más publicaciones para mostrar.
         </div>
      )}

      {posts.length === 0 && !loading && (
         <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
            Aún no hay posts publicados. ¡Sé el primero en aportar!
         </div>
      )}
    </div>
  );
}
