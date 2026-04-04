import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLikeToggle: (postId: number) => void;
}

export default function PostCard({ post, onLikeToggle }: PostCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer', marginBottom: '1.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to={`/profile/${post.author.id}`} style={{ textDecoration: 'none' }}>
           {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
           ) : (
              <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#111827' }}>
                 {post.author.username[0].toUpperCase()}
              </div>
           )}
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to={`/profile/${post.author.id}`} style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-text-base)', textDecoration: 'none' }}>
            {post.author.username}
          </Link>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{new Date(post.time).toLocaleString()}</span>
        </div>
      </div>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{post.titulo}</h3>
      
      {post.imagen && !post.imagen_borrada && (
         <img src={post.imagen} alt={post.titulo} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
      )}
      {post.imagen_borrada && (
         <div style={{ width: '100%', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border)', borderRadius: '8px', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            🖼️ Esta imagen excedía la cuota del servidor y fue expurgada.
         </div>
      )}

      <p style={{ color: 'var(--color-text-base)', margin: '0 0 1rem 0' }}>{post.contenido}</p>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
         <button 
           onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLikeToggle(post.id); }}
           style={{
             background: post.has_liked ? 'var(--color-danger-bg)' : 'transparent',
             color: post.has_liked ? 'var(--color-danger-highlight)' : 'var(--color-text-muted)',
             border: `1px solid ${post.has_liked ? 'var(--color-danger-border)' : 'transparent'}`,
             padding: '0.4rem 0.8rem',
             display: 'flex',
             alignItems: 'center',
             gap: '0.5rem'
           }}
         >
            <Heart size={18} fill={post.has_liked ? 'var(--color-danger-highlight)' : 'none'} />
            <span>{post.likes_count}</span>
         </button>
      </div>
    </div>
  );
}
