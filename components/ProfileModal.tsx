import React, { useState } from 'react';
import { User } from '../types';
import { useMapStore } from '../stores/mapStore';
import { XIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, MessageCircleIcon } from './icons';
import { toast } from 'react-hot-toast';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const { sendWink } = useMapStore();
  const [isWinking, setIsWinking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allPhotos = [user.avatar_url, ...(user.public_photos || [])].filter(Boolean);

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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
        {allPhotos.length > 0 ? (
          <img 
            src={allPhotos[currentImageIndex]} 
            alt={user.username} 
            className="w-full h-full object-contain"
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center bg-gray-900">
               <p className="text-gray-500">Este usuário não adicionou fotos.</p>
           </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 z-10">
          <XIcon className="w-6 h-6" />
        </button>

        {allPhotos.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-10">
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 z-10">
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          </>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
          <div className="flex justify-between items-end">
             <div>
                <h2 className="text-4xl font-bold">{user.username}, {user.age}</h2>
                <p className="text-gray-300 mt-1">{user.status_text || 'Olá!'}</p>
                 {user.tribes && user.tribes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {user.tribes.map(tribe => (
                            <span key={tribe} className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">{tribe}</span>
                        ))}
                    </div>
                 )}
             </div>
             <div className="flex flex-col space-y-3 pointer-events-auto">
                <button onClick={handleWink} disabled={isWinking} className="bg-yellow-500 text-black rounded-full p-4 shadow-lg hover:bg-yellow-400 disabled:opacity-60">
                    <HeartIcon className="w-7 h-7" />
                </button>
                 <button onClick={handleStartChat} className="bg-pink-600 text-white rounded-full p-4 shadow-lg hover:bg-pink-500">
                    <MessageCircleIcon className="w-7 h-7" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};