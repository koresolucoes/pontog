import React, { useState, useEffect } from 'react';
import { User, PrivateAlbum } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { useAlbumStore } from '../stores/albumStore';
import { useAgoraStore } from '../stores/agoraStore'; // Import do novo store
import { XIcon, MessageCircleIcon, HeartIcon, RulerIcon, ScaleIcon, UsersIcon, ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon, LockIcon, FlameIcon } from './icons';
import toast from 'react-hot-toast';
import { formatLastSeen } from '../lib/utils';
import { AlbumGalleryModal } from './AlbumGalleryModal';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useMapStore((state) => state.onlineUsers);
  // Fix: The state in `useAgoraStore` is named `posts`, not `agoraPosts`.
  const { posts, fetchAgoraPosts } = useAgoraStore();
  const { 
    viewedUserAlbums, 
    viewedUserAccessStatus, 
    isFetchingViewedUserAlbums,
    fetchAlbumsAndAccessStatusForUser,
    requestAccess,
    clearViewedUserData
  } = useAlbumStore();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [viewingAlbum, setViewingAlbum] = useState<PrivateAlbum | null>(null);
  
  const agoraPost = posts.find(p => p.user_id === user.id);

  useEffect(() => {
    fetchAgoraPosts();
    if (user) {
        fetchAlbumsAndAccessStatusForUser(user.id);
    }
    return () => {
        clearViewedUserData();
    }
  }, [user, fetchAlbumsAndAccessStatusForUser, clearViewedUserData, fetchAgoraPosts]);

  const isOnline = onlineUsers.includes(user.id);
  const statusText = isOnline ? 'Online' : formatLastSeen(user.last_seen);

  const handleWink = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('winks').insert({
      sender_id: currentUser.id,
      receiver_id: user.id
    });

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        toast('Você já chamou este perfil!', { icon: '😉' });
      } else {
        toast.error('Erro ao chamar o perfil.');
        console.error("Error sending wink:", error);
      }
    } else {
      toast.success('Chamado enviado com sucesso!');
    }
  };
  
  const handleChatClick = () => {
    onStartChat(user);
    onClose(); // Close modal after starting chat
  }
  
  const handleRequestAccess = () => {
      toast.promise(requestAccess(user.id), {
          loading: 'Enviando solicitação...',
          success: 'Solicitação enviada!',
          error: 'Não foi possível enviar a solicitação.',
      });
  }

  const allPhotos = [user.avatar_url, ...(user.public_photos || [])];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + allPhotos.length) % allPhotos.length);
  };

  const renderAccessButton = () => {
      switch (viewedUserAccessStatus) {
          case 'pending':
              return <button disabled className="w-full bg-gray-600 text-gray-400 font-bold py-3 rounded-lg text-sm">Solicitação Enviada</button>;
          case 'denied':
              return <p className="text-sm text-center text-gray-400">Seu pedido de acesso foi recusado.</p>;
          case null:
              return <button onClick={handleRequestAccess} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors text-sm">Solicitar Acesso</button>;
          default:
              return null;
      }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Photo Carousel */}
        <div className={`relative w-full aspect-square flex-shrink-0 ${agoraPost ? 'border-b-4 border-red-600 animate-pulse-fire' : ''}`}>
          <img src={allPhotos[currentPhotoIndex]} alt={user.username} className="w-full h-full object-cover sm:rounded-t-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
            <XIcon className="w-6 h-6" />
          </button>
          
          {allPhotos.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
                <ChevronRightIcon className="w-6 h-6" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                {allPhotos.map((_, index) => (
                  <div key={index} className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-3xl font-bold">{user.username}, {user.age}</h2>
            <div className="flex items-center space-x-2 mt-1">
              {isOnline && <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>}
              <p className="text-sm text-gray-300">{statusText}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {agoraPost && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-2">
                <FlameIcon className="w-5 h-5"/>
                <span>AGORA</span>
              </div>
              <img src={agoraPost.photo_url} alt="Status Agora" className="w-full rounded-lg mb-3 max-h-60 object-cover" />
              {agoraPost.status_text && <p className="text-white italic">"{agoraPost.status_text}"</p>}
            </div>
          )}

          {user.status_text && (
            <p className="text-gray-300 italic">"{user.status_text}"</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.height_cm && <InfoItem icon={<RulerIcon className="w-5 h-5 text-pink-400" />} label="Altura" value={`${user.height_cm} cm`} />}
            {user.weight_kg && <InfoItem icon={<ScaleIcon className="w-5 h-5 text-pink-400" />} label="Peso" value={`${user.weight_kg} kg`} />}
            {user.position && <InfoItem icon={<HeartIcon className="w-5 h-5 text-pink-400" />} label="Posição" value={user.position} />}
            {user.hiv_status && <InfoItem icon={<ShieldCheckIcon className="w-5 h-5 text-pink-400" />} label="Status HIV" value={user.hiv_status} />}
          </div>
          
          {user.tribes && user.tribes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-200 mb-2 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Tribos</h3>
              <div className="flex flex-wrap gap-2">
                {user.tribes.map(tribe => (
                  <span key={tribe} className="bg-gray-700 text-pink-300 text-xs font-bold px-2.5 py-1 rounded-full">{tribe}</span>
                ))}
              </div>
            </div>
          )}

            {/* Private Albums Section */}
            <div>
                <h3 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                    <LockIcon className="w-5 h-5" /> Álbuns Privados
                </h3>
                {isFetchingViewedUserAlbums ? (
                    <p className="text-sm text-gray-400">Verificando acesso...</p>
                ) : viewedUserAccessStatus === 'granted' ? (
                    viewedUserAlbums.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {viewedUserAlbums.map(album => (
                                <div key={album.id} className="relative aspect-square group cursor-pointer" onClick={() => setViewingAlbum(album)}>
                                    <div className="absolute inset-0 bg-gray-700 rounded-lg flex items-center justify-center text-center p-1">
                                        <span className="font-bold text-white text-xs">{album.name}</span>
                                    </div>
                                    {album.private_album_photos.length > 0 && (
                                        <img src={album.private_album_photos[0].photo_path} className="w-full h-full object-cover rounded-lg" alt={`Capa do álbum ${album.name}`} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-bold">Ver Álbum</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-gray-400 p-4 bg-gray-700 rounded-lg">Este usuário não possui álbuns privados.</p>
                    )
                ) : (
                    <div className="p-4 bg-gray-700 rounded-lg text-center">
                        <p className="text-sm text-gray-300 mb-3">Peça para ver as fotos privadas de {user.username}.</p>
                        {renderAccessButton()}
                    </div>
                )}
            </div>

        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0 flex gap-4">
          <button onClick={handleWink} className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors">
            <HeartIcon className="w-5 h-5 text-pink-400" />
            <span>Chamar</span>
          </button>
          <button onClick={handleChatClick} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors">
            <MessageCircleIcon className="w-5 h-5" />
            <span>Mensagem</span>
          </button>
        </div>
      </div>
    </div>
    {viewingAlbum && (
        <AlbumGalleryModal album={viewingAlbum} onClose={() => setViewingAlbum(null)} />
    )}
    </>
  );
};

// Sub-component for info items
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-center space-x-2">
        {icon}
        <div>
            <p className="text-gray-400">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);