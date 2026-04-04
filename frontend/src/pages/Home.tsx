import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Image as ImageIcon } from 'lucide-react';
import type { User, Post } from '../types';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<User | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);

  useEffect(() => {
    fetchMe();
    fetchPosts();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('users/me/');
      setMe(res.data);
    } catch (e) {
      // User not logged in, token missing or invalid
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('posts/');
      setPosts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublish = async () => {
    if (!titulo || !contenido) return;
    try {
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
      fetchPosts(); // Reload feed
    } catch (e: any) {
      alert("Error al publicar. " + (e.response?.data?.imagen?.[0] || 'Verifica tu inicio de sesión.'));
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
    } catch (e) {
      alert("Error al dar like. ¿Aún no iniciaste sesión?");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
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
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Inicia sesión para publicar
            </span>
          )}
          <button onClick={handlePublish} disabled={!me}>Publicar</button>
        </div>
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLikeToggle={toggleLike} />
      ))}
      
      {posts.length === 0 && (
         <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
            Aún no hay posts publicados. ¡Sé el primero en aportar!
         </div>
      )}
    </div>
  );
}
