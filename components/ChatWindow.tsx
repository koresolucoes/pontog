import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message as MessageType } from '../types';
import { SendIcon, XIcon, CheckIcon, CheckCheckIcon } from './icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { format } from 'date-fns';
import { formatLastSeen } from '../lib/utils';

interface ChatUser {
  id: string;
  name: string;
  imageUrl: string;
  last_seen?: string | null;
}

interface ChatWindowProps {
  user: ChatUser;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ user, onClose }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore(state => state.user);
  const onlineUsers = useMapStore(state => state.onlineUsers);

  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
      if (messageIds.length === 0) return;
      await supabase.rpc('mark_messages_as_read', { message_ids: messageIds });
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      conversation_id: conversationId,
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage('');
    }
  };

  if (!currentUser) return null;
  
  const MessageStatus = ({ msg }: { msg: MessageType }) => {
    if (msg.sender_id !== currentUser.id) return null;
    
    return (
      <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
          {msg.read_at ? (
              <CheckCheckIcon className="w-4 h-4 text-blue-400" />
          ) : (
              <CheckIcon className="w-4 h-4 text-gray-400" />
          )}
      </div>
    );
  };
  
  const isOnline = onlineUsers.includes(user.id);
  const userStatus = isOnline ? 'Online' : formatLastSeen(user.last_seen);

  return (
    <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-96 h-full sm:h-[500px] bg-black shadow-2xl rounded-t-2xl sm:rounded-2xl z-40 flex flex-col animate-slide-in-up border border-zinc-800">
      <header className="flex items-center justify-between p-3 bg-zinc-900 rounded-t-2xl sm:rounded-t-lg border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-bold">{user.name}</h3>
            <div className="flex items-center space-x-1.5">
              {isOnline && (
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
              )}
              <span className="text-xs text-gray-400">{userStatus}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end gap-2 max-w-xs md:max-w-sm ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                 {msg.sender_id !== currentUser.id && <img src={user.imageUrl} className="w-6 h-6 rounded-full self-start" />}
                 <div className={`px-4 py-2 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-yellow-400 text-black rounded-br-none' : 'bg-zinc-800 text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
              <div className={`mt-1 pr-2 ${msg.sender_id === currentUser.id ? 'self-end' : 'self-start ml-8'}`}>
                 <MessageStatus msg={msg} />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="w-full bg-zinc-800 rounded-full py-2.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 text-black rounded-full p-2 hover:bg-yellow-500 transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};