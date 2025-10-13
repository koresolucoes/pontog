import React, { useState } from 'react';
import { User } from '../types';
import { FlameIcon, MessageCircleIcon, XIcon } from './icons';
import { useMapStore } from '../stores/mapStore';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const [winkStatus, setWinkStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const sendWink = useMapStore((state) => state.sendWink);

  const handleWink = async () => {
      const result = await sendWink(user.id);
      setWinkStatus({ message: result.message, type: result.success ? 'success' : 'error' });
      setTimeout(() => setWinkStatus(null), 3000); // Limpa a mensagem após 3 segundos
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={`https://picsum.photos/seed/${user.username}/400/300`} alt={user.username} className="w-full h-48 object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/75 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-800 to-transparent"></div>
          <div className="absolute bottom-4 left-4 flex items-center space-x-3">
            <img src={user.avatar_url} alt={user.username} className="w-20 h-20 rounded-full border-4 border-gray-800 object-cover"/>
            <div>
              <h2 className="text-2xl font-bold text-white shadow-lg">{user.username}, {user.age}</h2>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-300 italic">"{user.status_text}"</p>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button 
                onClick={handleWink}
                className="flex items-center justify-center w-full bg-yellow-500/20 text-yellow-300 font-semibold py-3 px-4 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                disabled={!!winkStatus}
            >
              <FlameIcon className="w-5 h-5 mr-2" />
              Chamar
            </button>
            <button 
              onClick={() => onStartChat(user)}
              className="flex items-center justify-center w-full bg-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors"
            >
              <MessageCircleIcon className="w-5 h-5 mr-2" />
              Mensagem
            </button>
          </div>
          {winkStatus && (
              <p className={`mt-4 text-center text-sm ${winkStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {winkStatus.message}
              </p>
          )}
        </div>
      </div>
    </div>
  );
};
