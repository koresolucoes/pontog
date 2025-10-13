import React, { useState } from 'react';
import { User } from '../types';
import { useMapStore } from '../stores/mapStore';
import { XIcon, RulerIcon, ScaleIcon, HeartIcon, ShieldCheckIcon, UsersIcon } from './icons';
import { toast } from 'react-hot-toast';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const { sendWink } = useMapStore();
  const [isWinking, setIsWinking] = useState(false);

  const handleWink = async () => {
    setIsWinking(true);
    const result = await sendWink(user.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsWinking(false);
  };
  
  const handleStartChat = () => {
    onStartChat(user);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={user.avatar_url} alt={user.username} className="w-full h-64 object-cover rounded-t-2xl sm:rounded-t-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75">
            <XIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-3xl font-bold">{user.username}, {user.age}</h2>
            <p className="text-gray-300">{user.status_text || 'Olá!'}</p>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.height && <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg"><RulerIcon className="w-5 h-5 text-pink-400"/><p>{user.height} cm</p></div>}
            {user.weight && <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg"><ScaleIcon className="w-5 h-5 text-pink-400"/><p>{user.weight} kg</p></div>}
            {user.tribe && <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg"><UsersIcon className="w-5 h-5 text-pink-400"/><p>{user.tribe}</p></div>}
            {user.position && <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg"><HeartIcon className="w-5 h-5 text-pink-400"/><p>{user.position}</p></div>}
          </div>
          {user.hiv_status && (
            <div className="mt-4 flex items-center space-x-2 bg-gray-700 p-3 rounded-lg text-sm">
              <ShieldCheckIcon className="w-5 h-5 text-green-400"/>
              <p>Status HIV: {user.hiv_status}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700 flex space-x-3">
          <button 
            onClick={handleWink}
            disabled={isWinking}
            className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {isWinking ? 'Enviando...' : 'Chamar'}
          </button>
          <button 
            onClick={handleStartChat}
            className="flex-1 bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Mensagem
          </button>
        </div>
      </div>
    </div>
  );
};
