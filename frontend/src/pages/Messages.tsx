import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, Message } from '../types';
import { Send } from 'lucide-react';

export default function Messages() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  
  const [me, setMe] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  useEffect(() => {
    fetchMe();
    fetchMessages();
    
    // Pequeño polling simple para mensajes
    const interval = setInterval(() => {
       fetchMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('users/me/');
      setMe(res.data);
    } catch {
       navigate('/login');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('messages/');
      setMessages(res.data);
    } catch {}
  };

  const contactsMap = new Map<number, { user: User, lastMessage: Message }>();
  
  if (me) {
     messages.forEach(msg => {
       const otherUser = msg.sender.id === me.id ? msg.reciver : msg.sender;
       if (!contactsMap.has(otherUser.id) || new Date(msg.time).getTime() > new Date(contactsMap.get(otherUser.id)!.lastMessage.time).getTime()) {
          contactsMap.set(otherUser.id, { user: otherUser, lastMessage: msg });
       }
     });
  }
  
  const contactsList = Array.from(contactsMap.values()).sort((a, b) => new Date(b.lastMessage.time).getTime() - new Date(a.lastMessage.time).getTime());
  
  const activeContactId = parseInt(contactId || '0');
  const activeConversation = messages.filter(msg => 
    (msg.sender.id === me?.id && msg.reciver.id === activeContactId) || 
    (msg.reciver.id === me?.id && msg.sender.id === activeContactId)
  ).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Resolver el contacto activo por si iniciamos el chat desde el header y aun no hay mensajes
  const [activeContact, setActiveContact] = useState<User | null>(null);

  useEffect(() => {
     if (activeContactId) {
        const found = contactsMap.get(activeContactId)?.user;
        if (found) {
           setActiveContact(found);
        } else {
           // Traer de API si contactId es valido pero sin historial
           api.get(`users/${activeContactId}/`).then(res => setActiveContact(res.data)).catch(() => {});
        }
     } else {
        setActiveContact(null);
     }
  }, [activeContactId, messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeContactId) return;
    try {
       await api.post('messages/', { reciver_id: activeContactId, content: inputText });
       setInputText('');
       fetchMessages();
    } catch (e) {
       alert("Error enviando mensaje");
    }
  };

  if (!me) return <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando historial...</div>;

  return (
    <div className="glass-panel" style={{ display: 'flex', maxWidth: '900px', margin: '0 auto', height: '70vh', overflow: 'hidden' }}>
      
      {/* Panel Izquierdo Inbox */}
      <div style={{ width: '300px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0 }}>Mensajes</h3>
         </div>
         <div style={{ flex: 1, overflowY: 'auto' }}>
            {contactsList.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Bandeja vacía</div>}
            
            {contactsList.map(item => (
               <div 
                  key={item.user.id} 
                  onClick={() => navigate(`/messages/${item.user.id}`)}
                  style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: activeContactId === item.user.id ? 'var(--color-primary)' : 'transparent', color: activeContactId === item.user.id ? '#111827' : 'var(--color-text-base)', display: 'flex', gap: '1rem', alignItems: 'center' }}
               >
                  {item.user.avatar_url ? (
                     <img src={item.user.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                     <div style={{ width: '40px', height: '40px', background: activeContactId === item.user.id ? '#111827' : 'var(--color-primary)', color: activeContactId === item.user.id ? 'var(--color-primary)' : '#111827', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                        {item.user.username[0].toUpperCase()}
                     </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                     <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.user.username}</h4>
                     <p style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: activeContactId === item.user.id ? '#374151' : 'var(--color-text-muted)' }}>
                        {item.lastMessage.sender.id === me.id ? 'Tú: ' : ''}{item.lastMessage.content}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Panel Derecho Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
         {!activeContactId ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-muted)' }}>
               Selecciona un contacto en la bandeja para chatear.
            </div>
         ) : (
            <>
               <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {activeContact ? (
                     <h3 style={{ margin: 0 }}>Asistiendo chat con {activeContact.username}</h3>
                  ) : (
                     <h3 style={{ margin: 0 }}>Cargando hilo...</h3>
                  )}
               </div>
               
               <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg-base)', position: 'relative' }}>
                  {activeConversation.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Escribe tu primer mensaje para romper el hielo.</div>}
                  {activeConversation.map(msg => {
                     const isMenu = msg.sender.id === me.id;
                     return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMenu ? 'flex-end' : 'flex-start' }}>
                           <div style={{ maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '1rem', background: isMenu ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: isMenu ? '#111827' : 'var(--color-text-base)', border: isMenu ? 'none' : '1px solid var(--color-border)' }}>
                              <span style={{ display: 'block', wordBreak: 'break-word', fontFamily: 'Inter' }}>{msg.content}</span>
                              <span style={{ fontSize: '0.7rem', display: 'block', textAlign: 'right', marginTop: '0.25rem', color: isMenu ? '#374151' : 'var(--color-text-muted)' }}>{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                     )
                  })}
               </div>

               <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
                  <input 
                     type="text" 
                     placeholder="Inicia con tu nuevo mensaje..." 
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
