import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message as MessageType, PrivateAlbum } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { useInboxStore } from '../stores/inboxStore';
import { useAlbumStore } from '../stores/albumStore';
import { useUiStore } from '../stores/uiStore';
import { format } from 'date-fns';
import { formatLastSeen } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { SelectAlbumModal } from './SelectAlbumModal';
import { getPublicImageUrl } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ChatUser {
  id: string;
  name: string;
  imageUrl: string;
  last_seen?: string | null;
  subscription_tier: 'free' | 'plus';
}

interface ChatWindowProps {
  user: ChatUser;
  onClose: () => void;
}

const MessageContent: React.FC<{ message: MessageType }> = ({ message }) => {
    const { setSelectedUser } = useMapStore();
    const { user: currentUser } = useAuthStore();

    try {
        const parsedContent = JSON.parse(message.content);
        if (parsedContent.type) {
            switch(parsedContent.type) {
                case 'location':
                    const { lat, lng } = parsedContent;
                    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    return (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block text-left">
                            <div className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors">
                                <p className="font-bold text-sm text-white">Localização Compartilhada</p>
                                <p className="text-xs text-gray-300">Clique para ver no mapa</p>
                            </div>
                        </a>
                    );
                case 'album':
                    const { albumName } = parsedContent;
                    return (
                         <div className="p-2 rounded-lg bg-gray-600 text-left">
                            <p className="font-bold text-sm text-white">Álbum Compartilhado</p>
                            <p className="text-xs text-gray-300 italic">"{albumName}"</p>
                        </div>
                    );
            }
        }
    } catch (e) {
        // Not JSON, treat as plain text
    }

    return (
        <div className="space-y-2">
            {message.image_url && (
                <img src={getPublicImageUrl(message.image_url)} alt="Imagem enviada" className="max-w-xs rounded-lg cursor-pointer" onClick={() => window.open(getPublicImageUrl(message.image_url))}/>
            )}
            {message.content && <p className="text-sm break-words">{message.content}</p>}
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ user, onClose }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore(state => state.user);
  const onlineUsers = useMapStore(state => state.onlineUsers);
  const { deleteConversation } = useInboxStore();
  const { uploadPhoto, grantAccess } = useAlbumStore();

  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState<MessageType | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState(false);
  
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isAlbumSelectorOpen, setIsAlbumSelectorOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
      if (messageIds.length === 0) return;
      const { error } = await supabase.rpc('mark_messages_as_read', { message_ids: messageIds });
      if (error) console.error("Error marking messages as read:", error);
  }, []);

  useEffect(() => {
    const setupConversation = async () => {
      if (!currentUser) return;
      
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_one: currentUser.id,
        p_two: user.id
      });

      if (error) {
        console.error("Error setting up conversation:", error);
        return;
      }
      const convId = data;
      setConversationId(convId);
      
      const { data: initialMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messagesError) {
          console.error("Error fetching messages:", messagesError);
      } else {
          setMessages(initialMessages || []);
          const unreadIds = initialMessages
            .filter(m => m.sender_id !== currentUser.id && !m.read_at)
            .map(m => m.id);
          markMessagesAsRead(unreadIds);
      }
    };

    setupConversation();
  }, [user.id, currentUser, markMessagesAsRead]);

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
           if (payload.eventType === 'INSERT') {
               const newMessagePayload = payload.new as MessageType;
               setMessages((prevMessages) => [...prevMessages, newMessagePayload]);
               if (newMessagePayload.sender_id !== currentUser.id) {
                   markMessagesAsRead([newMessagePayload.id]);
               }
           } else if (payload.eventType === 'UPDATE') {
               const updatedMessage = payload.new as MessageType;
               setMessages(prevMessages =>
                 prevMessages.map(msg =>
                   msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                 )
               );
           } else if (payload.eventType === 'DELETE') {
               const deletedMessageId = (payload.old as MessageType).id;
               setMessages(prev => prev.filter(m => m.id !== deletedMessageId));
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser, markMessagesAsRead]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const sendMessage = async (content: string | null, imageUrl: string | null = null) => {
    if ((!content || content.trim() === '') && !imageUrl) return;
    if (!currentUser || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      conversation_id: conversationId,
      content: content,
      image_url: imageUrl,
    });
    
    if (error) {
        toast.error("Falha ao enviar mensagem.");
    } else {
        const { session } = (await supabase.auth.getSession()).data;
        if (session && content) {
            fetch('/api/send-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    receiver_id: user.id,
                    message_content: content.length > 50 ? 'Nova mensagem' : content
                })
            }).catch(err => console.error("Error sending push notification:", err));
        }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(newMessage, null);
    setNewMessage('');
  };
  
  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Enviando imagem...');
    const imagePath = await uploadPhoto(file);
    if (imagePath) {
        await sendMessage(newMessage, imagePath);
        setNewMessage('');
        toast.success('Imagem enviada!', { id: toastId });
    } else {
        toast.error('Falha ao enviar imagem.', { id: toastId });
    }
    // Reset file input
    if (e.target) e.target.value = '';
  };

  const handleSendLocation = () => {
    setAttachmentMenuOpen(false);
    toast.loading('Obtendo sua localização...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss();
        const { latitude, longitude } = position.coords;
        const locationContent = JSON.stringify({
          type: 'location',
          lat: latitude,
          lng: longitude,
        });
        sendMessage(locationContent);
      },
      (error) => {
        toast.dismiss();
        toast.error('Não foi possível obter a localização.');
        console.error("Geolocation error:", error);
      }
    );
  };
  
  const handleSelectAlbum = async (album: PrivateAlbum) => {
    setIsAlbumSelectorOpen(false);
    const toastId = toast.loading(`Compartilhando álbum "${album.name}"...`);
    try {
        await grantAccess(album.id, user.id);
        const albumContent = JSON.stringify({
            type: 'album',
            albumId: album.id,
            albumName: album.name,
        });
        await sendMessage(albumContent);
        toast.success('Álbum compartilhado!', { id: toastId });
    } catch (error) {
        toast.error('Falha ao compartilhar o álbum.', { id: toastId });
    }
  };
  
  const handleStartEdit = (msg: MessageType) => {
      setEditingMessage(msg);
      setEditedContent(msg.content ?? '');
  };
  
  const handleCancelEdit = () => {
      setEditingMessage(null);
      setEditedContent('');
  };

  const handleSaveEdit = async () => {
      if (!editingMessage || editedContent.trim() === '') return;

      const { error } = await supabase
        .from('messages')
        .update({ content: editedContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', editingMessage.id);
      
      if (error) {
          toast.error('Erro ao editar mensagem.');
      }
      handleCancelEdit();
  };

  const handleDeleteMessage = async () => {
      if (!confirmDeleteMessage) return;
      const { error } = await supabase.from('messages').delete().eq('id', confirmDeleteMessage.id);
      if (error) {
          toast.error('Erro ao apagar mensagem.');
      }
      setConfirmDeleteMessage(null);
  };

  const handleDeleteConversation = async () => {
      if (!conversationId) return;
      await deleteConversation(conversationId);
      onClose();
  };

  if (!currentUser) return null;
  
  const MessageStatus = ({ msg }: { msg: MessageType }) => {
    if (msg.sender_id !== currentUser.id) return null;
    
    // Premium Feature: Read Receipts. Only Plus users can see them.
    const isRead = msg.read_at && currentUser.subscription_tier === 'plus';

    return (
      <div className="flex items-center space-x-1">
          {msg.updated_at && <span className="text-xs text-gray-500">(editado)</span>}
          <span className="text-xs text-gray-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
          {isRead ? (
              <span className="material-symbols-outlined !text-[16px] text-blue-400">done_all</span>
          ) : (
              <span className="material-symbols-outlined !text-[16px] text-gray-400">check</span>
          )}
      </div>
    );
  };
  
  const statusText = formatLastSeen(user.last_seen);
  const isOnline = onlineUsers.includes(user.id) || statusText === 'Online';

  return (
    <>
    <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-96 h-full sm:h-[500px] bg-gray-900 shadow-2xl rounded-t-2xl sm:rounded-2xl z-40 flex flex-col animate-slide-in-up border border-gray-700">
      <header className="flex items-center justify-between p-3 bg-gray-800 rounded-t-2xl sm:rounded-t-lg border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{user.name}</h3>
              {user.subscription_tier === 'plus' && (
                  <span className="flex items-center text-xs bg-yellow-400/20 text-yellow-300 font-semibold px-1.5 py-0.5 rounded-full">
                      <span className="material-symbols-outlined !text-[12px]">auto_awesome</span>
                  </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              {isOnline && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
              <span className="text-xs text-gray-400">{isOnline ? 'Online' : statusText}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setConfirmDeleteConvo(true)} className="text-gray-400 hover:text-white">
                <span className="material-symbols-outlined text-xl">delete</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col group ${msg.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end gap-2 max-w-xs md:max-w-sm ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                 {msg.sender_id !== currentUser.id && <img src={user.imageUrl} className="w-6 h-6 rounded-full self-start" />}
                 
                 {editingMessage?.id === msg.id ? (
                     <div className="flex-1 space-y-1">
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
                            className="w-full bg-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                            <button onClick={handleCancelEdit} className="hover:underline">Cancelar</button>
                            <button onClick={handleSaveEdit} className="font-bold text-pink-400 hover:underline">Salvar</button>
                        </div>
                     </div>
                 ) : (
                    <div className={`px-4 py-2 rounded-2xl relative ${msg.sender_id === currentUser.id ? 'bg-pink-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                      <MessageContent message={msg} />
                       {msg.sender_id === currentUser.id && !msg.image_url && !msg.content?.includes('"type":') &&(
                           <div className="absolute top-0 -left-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                               <button onClick={() => handleStartEdit(msg)} className="text-xs bg-gray-700 text-white rounded-full px-2 py-0.5">Editar</button>
                               <button onClick={() => setConfirmDeleteMessage(msg)} className="text-xs bg-gray-700 text-white rounded-full px-2 py-0.5">Excluir</button>
                           </div>
                       )}
                    </div>
                 )}
              </div>
              <div className={`mt-1 pr-2 ${msg.sender_id === currentUser.id ? 'self-end' : 'self-start ml-8'}`}>
                 <MessageStatus msg={msg} />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {!editingMessage && (
        <div className="p-2 border-t border-gray-700 bg-gray-800 relative">
             {isAttachmentMenuOpen && (
                <div className="absolute bottom-full left-2 mb-2 w-48 bg-gray-700 rounded-lg shadow-lg p-2 animate-fade-in-up">
                    <button onClick={() => { setAttachmentMenuOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-gray-600 text-white">
                        <span className="material-symbols-outlined text-xl">image</span> Foto
                    </button>
                     <button onClick={handleSendLocation} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-gray-600 text-white">
                        <span className="material-symbols-outlined text-xl">location_on</span> Localização
                    </button>
                     <button onClick={() => { setAttachmentMenuOpen(false); setIsAlbumSelectorOpen(true); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-gray-600 text-white">
                        <span className="material-symbols-outlined text-xl">photo_album</span> Álbum Privado
                    </button>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleSendImage}/>
                 <button type="button" onClick={() => setAttachmentMenuOpen(prev => !prev)} className="text-gray-400 hover:text-white p-2.5 rounded-full hover:bg-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-xl">add_circle</span>
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-gray-700 rounded-full py-2.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button type="submit" className="bg-pink-600 text-white rounded-full p-2.5 hover:bg-pink-700 transition-colors">
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </form>
        </div>
      )}
    </div>
    {confirmDeleteMessage && (
        <ConfirmationModal
            isOpen={!!confirmDeleteMessage}
            title="Apagar Mensagem"
            message="Tem certeza que deseja apagar esta mensagem? Esta ação não pode ser desfeita."
            onConfirm={handleDeleteMessage}
            onCancel={() => setConfirmDeleteMessage(null)}
            confirmText="Apagar"
        />
    )}
     {confirmDeleteConvo && (
        <ConfirmationModal
            isOpen={confirmDeleteConvo}
            title="Apagar Conversa"
            message="Tem certeza que deseja apagar toda a conversa com este usuário? Esta ação é permanente."
            onConfirm={handleDeleteConversation}
            onCancel={() => setConfirmDeleteConvo(false)}
            confirmText="Apagar Conversa"
        />
    )}
    {isAlbumSelectorOpen && (
        <SelectAlbumModal 
            onClose={() => setIsAlbumSelectorOpen(false)}
            onSelect={handleSelectAlbum}
        />
    )}
    </>
  );
};