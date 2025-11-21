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
import { ViewOncePhotoModal } from './ViewOncePhotoModal';

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

interface MessageContentProps {
  message: MessageType;
  onViewOnceClick: (message: MessageType) => void;
}


const MessageContent: React.FC<MessageContentProps> = ({ message, onViewOnceClick }) => {
    try {
        const parsedContent = JSON.parse(message.content);
        if (parsedContent.type) {
            switch(parsedContent.type) {
                case 'location':
                    const { lat, lng } = parsedContent;
                    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    return (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block text-left group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="material-symbols-rounded filled text-xl">location_on</span>
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">Localização</span>
                                    <span className="text-xs opacity-80 underline">Ver no mapa</span>
                                </div>
                            </div>
                        </a>
                    );
                case 'album':
                    const { albumName } = parsedContent;
                    return (
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-rounded filled text-xl">photo_album</span>
                            </div>
                            <div>
                                <span className="font-bold text-sm block">Álbum Privado</span>
                                <span className="text-xs opacity-80 italic">"{albumName}"</span>
                            </div>
                        </div>
                    );
            }
        }
    } catch (e) {
        // Not JSON, treat as plain text
    }
    
    if (message.is_view_once) {
        if (message.viewed_at) {
            return (
                <div className="flex items-center gap-2 text-sm italic opacity-60">
                    <span className="material-symbols-rounded text-lg">timer_off</span>
                    <span>Foto expirada</span>
                </div>
            );
        }
        return (
            <button
                onClick={() => onViewOnceClick(message)}
                className="flex items-center gap-2 text-sm font-bold bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
                <span className="material-symbols-rounded filled text-lg animate-pulse">local_fire_department</span>
                <span>Ver Foto (1x)</span>
            </button>
        );
    }


    return (
        <div className="space-y-2">
            {message.image_url && (
                <img src={getPublicImageUrl(message.image_url)} alt="Imagem enviada" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(getPublicImageUrl(message.image_url))}/>
            )}
            {message.content && <p className="text-sm break-words leading-relaxed">{message.content}</p>}
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
  const { deleteConversation, clearUnreadCountForConversation } = useInboxStore();
  const { uploadPhoto, grantAccess } = useAlbumStore();

  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState<MessageType | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState(false);
  
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isAlbumSelectorOpen, setIsAlbumSelectorOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [messageOptions, setMessageOptions] = useState<MessageType | null>(null);

  const [imageToSend, setImageToSend] = useState<{ file: File; preview: string } | null>(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [viewingOncePhoto, setViewingOncePhoto] = useState<MessageType | null>(null);

  const markMessagesAsRead = useCallback(async (messageIds: number[], convId: number | null) => {
      if (messageIds.length === 0 || !convId) return;
      
      const { error } = await supabase.rpc('mark_messages_as_read', { message_ids: messageIds });
      
      if (error) {
          console.error("Error marking messages as read:", error);
      } else {
          const now = new Date().toISOString();
          setMessages(prevMessages =>
              prevMessages.map(msg =>
                  messageIds.includes(msg.id) ? { ...msg, read_at: now } : msg
              )
          );
          clearUnreadCountForConversation(convId);
      }
  }, [clearUnreadCountForConversation]);

  useEffect(() => {
    const setupConversation = async () => {
      if (!currentUser) return;
      
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_one: currentUser.id,
        p_two: user.id
      });

      if (error) {
        console.error("Error setting up conversation:", error);
        toast.error("Erro ao carregar a conversa.");
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
          markMessagesAsRead(unreadIds, convId);
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
                   markMessagesAsRead([newMessagePayload.id], conversationId);
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
  
  const sendMessage = async (content: string | null, imageUrl: string | null = null, isViewOnceFlag: boolean = false) => {
    if ((!content || content.trim() === '') && !imageUrl) return;
    if (!currentUser || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      conversation_id: conversationId,
      content: content,
      image_url: imageUrl,
      is_view_once: isViewOnceFlag,
    });
    
    if (error) {
        toast.error("Não foi possível enviar a mensagem.");
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

  const cancelImageSend = () => {
    if (imageToSend) {
        URL.revokeObjectURL(imageToSend.preview);
    }
    setImageToSend(null);
    setIsViewOnce(false);
    setNewMessage('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageToSend) {
        const toastId = toast.loading('Enviando foto...');
        const imagePath = await uploadPhoto(imageToSend.file);
        if (imagePath) {
            await sendMessage(newMessage || null, imagePath, isViewOnce);
            cancelImageSend();
            toast.success('Foto enviada!', { id: toastId });
        } else {
            toast.error('Erro ao enviar foto. Tente novamente.', { id: toastId });
        }
    } else {
        if (!newMessage.trim()) return;
        await sendMessage(newMessage.trim(), null, false);
        setNewMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('A imagem é muito grande. Máximo 5MB.');
            return;
        }
        const preview = URL.createObjectURL(file);
        setImageToSend({ file, preview });
    }
    setAttachmentMenuOpen(false);
    if (e.target) e.target.value = '';
  };
  
  const handleSendLocation = () => {
    setAttachmentMenuOpen(false);
    toast.loading('Obtendo localização...');
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
        toast.error('Não foi possível acessar sua localização.');
        console.error("Geolocation error:", error);
      }
    );
  };
  
  const handleSelectAlbum = async (album: PrivateAlbum) => {
    setIsAlbumSelectorOpen(false);
    const toastId = toast.loading(`Compartilhando álbum...`);
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
      setMessageOptions(null); // Fecha o menu de opções
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
          toast.error('Erro ao salvar edição.');
      }
      handleCancelEdit();
  };

  const handleDeleteMessage = async () => {
      if (!confirmDeleteMessage) return;
      const { error } = await supabase.from('messages').delete().eq('id', confirmDeleteMessage.id);
      if (error) {
          toast.error('Erro ao apagar mensagem.');
      } else {
          toast.success('Mensagem apagada.');
      }
      setConfirmDeleteMessage(null);
  };

  const handleDeleteConversation = async () => {
      if (!conversationId) return;
      await deleteConversation(conversationId);
      onClose();
  };

  const handleViewOnceClick = async (message: MessageType) => {
    if (!message.viewed_at && message.image_url) {
        setViewingOncePhoto(message);
        const { error } = await supabase
            .from('messages')
            .update({ viewed_at: new Date().toISOString() })
            .eq('id', message.id);
            
        if (error) {
            console.error("Failed to mark photo as viewed", error);
            setViewingOncePhoto(null);
            toast.error("Não foi possível abrir a foto.");
        }
    }
  };

  if (!currentUser) return null;
  
  const MessageStatus = ({ msg }: { msg: MessageType }) => {
    if (msg.sender_id !== currentUser.id) return null;
    
    const isPremiumUser = currentUser?.subscription_tier === 'plus';
    const hasBeenRead = msg.read_at !== null && msg.read_at !== undefined;
    const showReadReceipt = isPremiumUser && hasBeenRead;

    return (
      <div className="flex items-center space-x-1 transition-opacity duration-300">
          {msg.updated_at && <span className="text-[9px] text-slate-400">(editado)</span>}
          <span className="text-[9px] text-slate-400/80">{format(new Date(msg.created_at), 'HH:mm')}</span>
          {showReadReceipt ? (
              <span className="material-symbols-rounded !text-[12px] text-blue-400">done_all</span>
          ) : (
              <span className="material-symbols-rounded !text-[12px] text-slate-500">check</span>
          )}
      </div>
    );
  };
  
  const statusText = formatLastSeen(user.last_seen);
  const isOnline = onlineUsers.includes(user.id) || statusText === 'Online';

  return (
    <>
    <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-[400px] h-full sm:h-[600px] bg-dark-900/95 backdrop-blur-xl shadow-2xl rounded-t-3xl sm:rounded-3xl z-[60] flex flex-col animate-slide-in-up border border-white/10 overflow-hidden">
      <header className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700" />
            {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white leading-none font-outfit text-lg">{user.name}</h3>
              {user.subscription_tier === 'plus' && (
                  <span className="material-symbols-rounded filled !text-[14px] text-yellow-400 drop-shadow-sm">auto_awesome</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">{isOnline ? 'Online Agora' : statusText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setConfirmDeleteConvo(true)} className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/5 active:scale-90">
                <span className="material-symbols-rounded text-xl">delete</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-90">
                <span className="material-symbols-rounded filled">close</span>
            </button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto bg-dark-900 scroll-smooth pb-24">
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                 {/* Avatar for incoming messages */}
                 {msg.sender_id !== currentUser.id && (
                    <img src={user.imageUrl} className="w-6 h-6 rounded-full self-end mb-1 ring-1 ring-white/10" />
                 )}
                 
                 {editingMessage?.id === msg.id ? (
                     <div className="w-full bg-slate-800 rounded-2xl p-3 border border-pink-500/50 shadow-lg animate-fade-in">
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
                            className="w-full bg-slate-900 rounded-xl py-2 px-3 text-white text-sm focus:outline-none resize-none border border-white/10"
                            rows={2}
                        />
                        <div className="flex justify-end gap-3 mt-2 text-xs font-bold">
                            <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white transition-colors">CANCELAR</button>
                            <button onClick={handleSaveEdit} className="text-pink-500 hover:text-pink-400 transition-colors">SALVAR</button>
                        </div>
                     </div>
                 ) : (
                    <div className={`px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm border border-white/5 ${
                        msg.sender_id === currentUser.id 
                        ? 'bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-none'
                    }`}>
                        <MessageContent message={msg} onViewOnceClick={handleViewOnceClick} />
                    </div>
                 )}
                
                 {/* Options Button (3 dots) */}
                 {msg.sender_id === currentUser.id && !editingMessage && !msg.is_view_once && !msg.image_url && !msg.content?.includes('"type":') && (
                    <div className="relative opacity-0 hover:opacity-100 transition-opacity self-center group-hover:opacity-100">
                        <button onClick={() => setMessageOptions(msg)} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                            <span className="material-symbols-rounded text-base">more_vert</span>
                        </button>
                        {messageOptions?.id === msg.id && (
                             <div className="absolute bottom-full right-0 mb-1 w-32 bg-slate-800 rounded-xl shadow-2xl z-30 border border-white/10 overflow-hidden animate-fade-in-up origin-bottom-right">
                                <button onClick={() => handleStartEdit(msg)} className="w-full text-xs font-bold p-3 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded text-base">edit</span> Editar
                                </button>
                                <div className="h-px bg-white/5"></div>
                                <button onClick={() => { setConfirmDeleteMessage(msg); setMessageOptions(null); }} className="w-full text-xs font-bold p-3 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded text-base">delete</span> Apagar
                                </button>
                             </div>
                        )}
                    </div>
                )}

              </div>
              <div className={`mt-1 px-1 ${msg.sender_id === currentUser.id ? 'self-end' : 'self-start ml-9'}`}>
                 <MessageStatus msg={msg} />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Floating Input Area */}
      {!editingMessage && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 via-dark-900/90 to-transparent z-20">
             {isAttachmentMenuOpen && (
                <div className="absolute bottom-20 left-4 w-48 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 animate-fade-in-up border border-white/10 z-30">
                    <button onClick={() => { setAttachmentMenuOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 text-left p-3 rounded-xl hover:bg-white/10 text-white transition-colors">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <span className="material-symbols-rounded text-lg">image</span>
                        </div>
                        <span className="text-sm font-bold">Foto</span>
                    </button>
                     <button onClick={handleSendLocation} className="w-full flex items-center gap-3 text-left p-3 rounded-xl hover:bg-white/10 text-white transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            <span className="material-symbols-rounded text-lg">location_on</span>
                        </div>
                        <span className="text-sm font-bold">Localização</span>
                    </button>
                     <button onClick={() => { setAttachmentMenuOpen(false); setIsAlbumSelectorOpen(true); }} className="w-full flex items-center gap-3 text-left p-3 rounded-xl hover:bg-white/10 text-white transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <span className="material-symbols-rounded text-lg">photo_album</span>
                        </div>
                        <span className="text-sm font-bold">Álbum Privado</span>
                    </button>
                </div>
            )}
            
            {imageToSend ? (
                <div className="p-3 space-y-3 bg-slate-800 rounded-3xl border border-white/10 shadow-xl animate-slide-in-up">
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/5">
                        <img src={imageToSend.preview} alt="Preview" className="w-full h-full object-contain" />
                        <button onClick={cancelImageSend} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={() => setIsViewOnce(!isViewOnce)} 
                            className={`flex-shrink-0 h-12 px-4 rounded-2xl transition-all font-bold text-sm flex items-center gap-2 ${isViewOnce ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-900/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} 
                        >
                            <span className={`material-symbols-rounded text-xl ${isViewOnce ? 'filled animate-pulse' : ''}`}>local_fire_department</span>
                            {isViewOnce ? '1x Ativo' : '1x'}
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Legenda (opcional)..."
                            className="flex-1 bg-slate-900 rounded-2xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm"
                        />
                        <button 
                            type="submit" 
                            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/30"
                        >
                            <span className="material-symbols-rounded text-2xl filled">send</span>
                        </button>
                    </form>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-800/80 backdrop-blur-xl p-1.5 rounded-[28px] border border-white/10 shadow-2xl">
                    <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleFileSelect}/>
                    <button 
                        type="button" 
                        onClick={() => setAttachmentMenuOpen(prev => !prev)} 
                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all mb-0.5 ${isAttachmentMenuOpen ? 'bg-slate-700 text-white rotate-45' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                        <span className="material-symbols-rounded text-2xl">add_circle</span>
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Mensagem..."
                            className="w-full bg-transparent py-3 px-2 text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:shadow-lg hover:shadow-pink-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none mb-0.5"
                    >
                        <span className="material-symbols-rounded text-xl filled">arrow_upward</span>
                    </button>
                </form>
            )}
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
    {messageOptions && (
        <div className="fixed inset-0 z-20" onClick={() => setMessageOptions(null)}></div>
    )}
    {viewingOncePhoto && viewingOncePhoto.image_url && (
        <ViewOncePhotoModal
            imageUrl={getPublicImageUrl(viewingOncePhoto.image_url)}
            onClose={() => setViewingOncePhoto(null)}
        />
    )}
    </>
  );
};