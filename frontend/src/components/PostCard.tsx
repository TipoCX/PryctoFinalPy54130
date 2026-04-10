import { useState } from 'react';
import { Heart, MessageCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  currentUserId?: number;
  onLikeToggle: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onEdit?: (postId: number, titulo: string, contenido: string) => void;
}

export default function PostCard({ post, currentUserId, onLikeToggle, onDelete, onEdit }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState(post.titulo);
  const [editContenido, setEditContenido] = useState(post.contenido);

  const isOwner = currentUserId != null && post.author.id === currentUserId;

  const handleSaveEdit = () => {
    if (!editTitulo.trim() || !editContenido.trim()) return;
    onEdit?.(post.id, editTitulo, editContenido);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitulo(post.titulo);
    setEditContenido(post.contenido);
    setEditing(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer', marginBottom: '1.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      {/* Header */}
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Link to={`/profile/${post.author.id}`} style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-text-base)', textDecoration: 'none' }}>
            {post.author.username}
          </Link>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{new Date(post.time).toLocaleString()}</span>
        </div>
        {/* Edit/Delete buttons - owner only */}
        {isOwner && !editing && (
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0.4rem', display: 'flex', color: 'var(--color-text-muted)', borderRadius: '6px' }}
              title="Editar post"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('¿Seguro que querés borrar este post?')) onDelete?.(post.id); }}
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '0.4rem', display: 'flex', color: 'var(--color-danger-highlight)', borderRadius: '6px' }}
              title="Borrar post"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content - Normal or Editing */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            value={editTitulo}
            onChange={e => setEditTitulo(e.target.value)}
            style={{
              width: '100%', borderRadius: '8px', border: '1px solid var(--color-primary)',
              padding: '0.6rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-base)',
              fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '1.1rem'
            }}
          />
          <textarea
            value={editContenido}
            onChange={e => setEditContenido(e.target.value)}
            style={{
              width: '100%', minHeight: '60px', borderRadius: '8px', border: '1px solid var(--color-primary)',
              padding: '0.6rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-base)',
              fontFamily: 'Inter', resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveEdit}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
            >
              <Check size={16} /> Guardar
            </button>
            <button
              onClick={handleCancelEdit}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
      
      {/* Action bar */}
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

         <button
           onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowComments(!showComments); }}
           style={{
             background: showComments ? 'var(--color-bg-surface)' : 'transparent',
             color: 'var(--color-text-muted)',
             border: `1px solid ${showComments ? 'var(--color-border)' : 'transparent'}`,
             padding: '0.4rem 0.8rem',
             display: 'flex',
             alignItems: 'center',
             gap: '0.5rem'
           }}
         >
            <MessageCircle size={18} />
            <span>{post.comments_count ?? 0}</span>
         </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} currentUserId={currentUserId} />
      )}
    </div>
  );
}
