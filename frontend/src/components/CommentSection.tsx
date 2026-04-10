import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Heart, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Comment, PaginatedResponse } from '../types';
import { useToast } from './Toast';

interface CommentSectionProps {
  postId: number;
  currentUserId?: number;
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchComments(1);
  }, [postId]);

  const fetchComments = async (pageNum: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Comment>>(`comments/?post=${postId}&page=${pageNum}`);
      if (pageNum === 1) {
        setComments(res.data.results);
      } else {
        setComments(prev => [...prev, ...res.data.results]);
      }
      setHasMore(res.data.next !== null);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post('comments/', { post: postId, content: newComment });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch {
      showToast('Error al comentar. ¿Iniciaste sesión?', 'error');
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await api.delete(`comments/${commentId}/`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      showToast('Error al borrar el comentario.', 'error');
    }
  };

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.patch(`comments/${commentId}/`, { content: editContent });
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: res.data.content } : c));
      setEditingId(null);
      setEditContent('');
    } catch {
      showToast('Error al editar el comentario.', 'error');
    }
  };

  const toggleLike = async (commentId: number) => {
    try {
      const res = await api.post(`comments/${commentId}/like/`);
      setComments(prev => prev.map(c => c.id === commentId ? {
        ...c,
        has_liked: res.data.liked,
        likes_count: res.data.likes_count
      } : c));
    } catch {
      showToast('Error al dar like.', 'error');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
      {/* Input nuevo comentario */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            flex: 1,
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-base)',
            fontFamily: 'Inter',
            fontSize: '0.875rem'
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px'
          }}
          title="Enviar comentario"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Lista de comentarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {comments.map(comment => (
          <div
            key={comment.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to={`/profile/${comment.author.id}`} style={{ textDecoration: 'none' }}>
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#111827', fontSize: '0.75rem' }}>
                    {comment.author.username[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <Link to={`/profile/${comment.author.id}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-base)', textDecoration: 'none' }}>
                {comment.author.username}
              </Link>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {new Date(comment.time).toLocaleString()}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                {currentUserId === comment.author.id && editingId !== comment.id && (
                  <>
                    <button
                      onClick={() => startEdit(comment)}
                      style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      style={{ background: 'transparent', border: 'none', padding: '0.2rem', color: 'var(--color-danger-highlight)', cursor: 'pointer', display: 'flex' }}
                      title="Borrar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content / Edit mode */}
            {editingId === comment.id ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit(comment.id)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-primary)',
                    background: 'var(--color-bg-surface)',
                    color: 'var(--color-text-base)',
                    fontFamily: 'Inter',
                    fontSize: '0.85rem'
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleEdit(comment.id)}
                  style={{ background: 'transparent', border: 'none', padding: '0.3rem', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex' }}
                  title="Guardar"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditContent(''); }}
                  style={{ background: 'transparent', border: 'none', padding: '0.3rem', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
                  title="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-base)' }}>{comment.content}</p>
            )}

            {/* Like */}
            <div>
              <button
                onClick={() => toggleLike(comment.id)}
                style={{
                  background: comment.has_liked ? 'var(--color-danger-bg)' : 'transparent',
                  color: comment.has_liked ? 'var(--color-danger-highlight)' : 'var(--color-text-muted)',
                  border: `1px solid ${comment.has_liked ? 'var(--color-danger-border)' : 'transparent'}`,
                  padding: '0.2rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Heart size={14} fill={comment.has_liked ? 'var(--color-danger-highlight)' : 'none'} />
                <span>{comment.likes_count}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && comments.length > 0 && (
        <button
          onClick={() => fetchComments(page + 1)}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            padding: '0.5rem'
          }}
        >
          {loading ? 'Cargando...' : 'Cargar más comentarios'}
        </button>
      )}

      {comments.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
          Sin comentarios aún. ¡Sé el primero!
        </p>
      )}
    </div>
  );
}
