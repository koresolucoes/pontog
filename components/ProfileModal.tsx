import React, { useState } from 'react';
import { User } from '../types';
import { FlameIcon, MessageCircleIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, RulerIcon, ScaleIcon, HeartIcon, ShieldCheckIcon, UsersIcon } from './icons';
import { useMapStore } from '../stores/mapStore';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number | null | undefined }> = ({ icon, label, value }) => (
    <div className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center justify-center text-center">
        <div className="text-pink-400 mb-1">{icon}</div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-white">{value || 'N/A'}</p>
    </div>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const [winkStatus, setWinkStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const sendWink = useMapStore((state) => state.sendWink);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const photos = [user.avatar_url, ...(user.public_photos || [])].filter(Boolean);

  const handleWink = async () => {
      const result = await sendWink(user.id);
      setWinkStatus({ message: result.message, type: result.success ? 'success' : 'error' });
      setTimeout(() => setWinkStatus(null), 3000);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
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
        <div className="relative w-full aspect-[4/3] bg-gray-900">
          {photos.length > 0 ? (
            <>
              <img src={photos[currentPhotoIndex]} alt={user.username} className="w-full h-full object-cover" />
              {photos.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white hover:bg-black/75"><ChevronLeftIcon className="w-6 h-6"/></button>
                  <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white hover:bg-black/75"><ChevronRightIcon className="w-6 h-6"/></button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                    {photos.map((_, index) => (
                      <div key={index} className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}/>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Sem foto</div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/75 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-800 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white shadow-lg">{user.display_name || user.username}, {user.age}</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300 italic mb-6">"{user.status_text || 'Olá, seja bem-vindo ao meu perfil!'}"</p>

          {user.tribes && user.tribes.length > 0 && (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center"><UsersIcon className="w-4 h-4 mr-2"/> Tribos</h3>
                <div className="flex flex-wrap gap-2">
                    {user.tribes.map(tribe => (
                        <span key={tribe} className="bg-gray-700 text-gray-200 text-xs font-semibold px-2.5 py-1 rounded-full">{tribe}</span>
                    ))}
                </div>
            </div>
          )}
          
          <div className="mb-6">
             <h3 className="text-sm font-semibold text-gray-400 mb-2">Estatísticas</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={<HeartIcon className="w-5 h-5"/>} label="Posição" value={user.position} />
                <StatCard icon={<RulerIcon className="w-5 h-5"/>} label="Altura" value={user.height_cm ? `${user.height_cm} cm` : null} />
                <StatCard icon={<ScaleIcon className="w-5 h-5"/>} label="Peso" value={user.weight_kg ? `${user.weight_kg} kg` : null} />
                <StatCard icon={<ShieldCheckIcon className="w-5 h-5"/>} label="HIV" value={user.hiv_status} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
