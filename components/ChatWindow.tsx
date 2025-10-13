import React, { useState, useRef, useEffect } from 'react';
import { User, Message as MessageType } from '../types';
import { SendIcon, XIcon } from './icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// O componente de chat espera um `User` com `imageUrl` e `name`
// que são diferentes do nosso novo tipo `User` (usa avatar_url e username)
// Então criamos um tipo específico para a prop
interface ChatUser {
  id: string;
  name: string;
  imageUrl: string;
  online?: boolean;
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
      }
    };

    setupConversation();
  }, [user.id, currentUser]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on<MessageType>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);


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

  return (
    <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-96 h-full sm:h-[500px] bg-gray-800 shadow-2xl rounded-t-2xl sm:rounded-2xl z-40 flex flex-col animate-slide-in-up">
      <header className="flex items-center justify-between p-4 bg-gray-900 rounded-t-2xl sm:rounded-t-lg">
        <div className="flex items-center space-x-3">
          <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-bold">{user.name}</h3>
            <div className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              <span className="text-xs text-gray-400">{user.online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : ''}`}>
               {msg.sender_id !== currentUser.id && <img src={user.imageUrl} className="w-6 h-6 rounded-full" />}
               <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-pink-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="w-full bg-gray-700 rounded-full py-3 pl-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-600 text-white rounded-full p-2 hover:bg-pink-700 transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
