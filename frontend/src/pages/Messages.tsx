import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, Message, Conversation } from '../types';
import { Send } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const [me, setMe] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const activeConversationId = parseInt(conversationId || '0');
  const { showToast } = useToast();

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!me) return;
    fetchConversations();
    if (activeConversationId) fetchMessages();
    
    // Polling ligero sobre el schema Enterprise
    const interval = setInterval(() => {
       fetchConversations();
       if (activeConversationId) fetchMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [me, activeConversationId]);

  const fetchMe = async () => {
    try {
      const res = await api.get('users/me/');
      setMe(res.data);
    } catch {
       navigate('/login');
    }
  };

  const fetchConversations = async () => {
    try {
      // Pedimos las conversaciones indexadas y paginadas. Nada de descargar mil mensajes.
      const res = await api.get('conversations/');
      setConversations(res.data);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      // Solamente pedimos los textos de ESTE HILO específico.
      const res = await api.get(`messages/?conversation=${activeConversationId}`);
      setMessages(res.data);
    } catch {}
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeConversationId) return;
    try {
       await api.post('messages/', { conversation_id: activeConversationId, content: inputText });
       setInputText('');
       fetchMessages();
       fetchConversations();
    } catch (e) {
       showToast('Error enviando mensaje', 'error');
    }
  };

  if (!me) return <div style={{ textAlign: 'center', padding: '4rem' }}>Conectando a los hilos seguros...</div>;

  const activeConversationInfo = conversations.find(c => c.id === activeConversationId);
  const activeContact = activeConversationInfo?.participants.find(p => p.id !== me.id);
  const isGroup = activeConversationInfo?.participants && activeConversationInfo.participants.length > 2;
  const chatTitle = isGroup 
        ? "Chat de Grupo" 
        : (activeContact?.username || "Cargando contacto...");

  return (
    <div className="glass-panel" style={{ display: 'flex', maxWidth: '900px', margin: '0 auto', height: '70vh', overflow: 'hidden' }}>
      
      {/* Panel Izquierdo Inbox (Hilos) */}
      <div style={{ width: '300px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0 }}>Conversaciones</h3>
         </div>
         <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Bandeja vacía</div>}
            
            {conversations.map(conv => {
               const otherUser = conv.participants.find(p => p.id !== me.id) || conv.participants[0];
               const convIsGroup = conv.participants.length > 2;
               
               return (
               <div 
                  key={conv.id} 
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: activeConversationId === conv.id ? 'var(--color-primary)' : 'transparent', color: activeConversationId === conv.id ? '#111827' : 'var(--color-text-base)', display: 'flex', gap: '1rem', alignItems: 'center' }}
               >
                  {otherUser.avatar_url && !convIsGroup ? (
                     <img src={otherUser.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                     <div style={{ width: '40px', height: '40px', background: activeConversationId === conv.id ? '#111827' : 'var(--color-primary)', color: activeConversationId === conv.id ? 'var(--color-primary)' : '#111827', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                        {convIsGroup ? 'G' : otherUser.username[0].toUpperCase()}
                     </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                     <h4 style={{ margin: '0 0 0.25rem 0' }}>{convIsGroup ? 'Grupo' : otherUser.username}</h4>
                     <p style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: activeConversationId === conv.id ? '#374151' : 'var(--color-text-muted)' }}>
                        {conv.last_message ? (
                           <>{conv.last_message.sender_id === me.id ? 'Tú: ' : ''}{conv.last_message.content}</>
                        ) : 'Sin historial'}
                     </p>
                  </div>
               </div>
            )})}
         </div>
      </div>

      {/* Panel Derecho Chat Central */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
         {!activeConversationId ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-muted)' }}>
               Selecciona un hilo en la bandeja para chatear.
            </div>
         ) : (
            <>
               <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <h3 style={{ margin: 0 }}>Conversación con {chatTitle}</h3>
               </div>
               
               <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg-base)', position: 'relative' }}>
                  {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Escribe tu primer mensaje para romper el hielo.</div>}
                  {messages.map(msg => {
                     const isMe = msg.sender.id === me.id;
                     return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                           <div style={{ maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '1rem', background: isMe ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: isMe ? '#111827' : 'var(--color-text-base)', border: isMe ? 'none' : '1px solid var(--color-border)' }}>
                              {!isMe && isGroup && <strong style={{display: 'block', fontSize: '0.7rem', color: '#111827', fontWeight: 800, marginBottom: '2px'}}>{msg.sender.username}</strong>}
                              <span style={{ display: 'block', wordBreak: 'break-word', fontFamily: 'Inter' }}>{msg.content}</span>
                              <span style={{ fontSize: '0.7rem', display: 'block', textAlign: 'right', marginTop: '0.25rem', color: isMe ? '#374151' : 'var(--color-text-muted)' }}>{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                     )
                  })}
               </div>

               <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
                  <input 
                     type="text" 
                     placeholder={`Escribe un mensaje a ${chatTitle}...`} 
                     value={inputText}
                     onChange={e => setInputText(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSend()}
                     style={{ flex: 1, padding: '0.75rem', borderRadius: '2rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-base)', outline: 'none' }}
                  />
                  <button onClick={handleSend} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', padding: '0', width: '44px', height: '44px', cursor: 'pointer' }}>
                     <Send size={18} />
                  </button>
               </div>
            </>
         )}
      </div>
    </div>
  );
}
