import React, { useState, useEffect } from 'react';
import { User, PrivateAlbum } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';
import { useAlbumStore } from '../stores/albumStore';
import { useAgoraStore } from '../stores/agoraStore';
import { useUiStore } from '../stores/uiStore';
import toast from 'react-hot-toast';
import { formatLastSeen } from '../lib/utils';
import { AlbumGalleryModal } from './AlbumGalleryModal';
import { useUserActionsStore } from '../stores/userActionsStore';
import { ReportUserModal } from './ReportUserModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onStartChat }) => {
  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useMapStore((state) => state.onlineUsers);
  const { setSubscriptionModalOpen } = useUiStore();
  const { posts, fetchAgoraPosts } = useAgoraStore();
  const { 
    viewedUserAlbums, 
    viewedUserAccessStatus, 
    isFetchingViewedUserAlbums,
    fetchAlbumsAndAccessStatusForUser,
    requestAccess,
    clearViewedUserData
  } = useAlbumStore();
  const { blockUser } = useUserActionsStore();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [viewingAlbum, setViewingAlbum] = useState<PrivateAlbum | null>(null);
  const [winkCount, setWinkCount] = useState<number | null>(null);
  const [isOptionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isBlockConfirmOpen, setBlockConfirmOpen] = useState(false);
  
  const agoraPost = posts.find(p => p.user_id === user.id);

  useEffect(() => {
    fetchAgoraPosts();
    if (user && currentUser && user.id !== currentUser.id) {
        fetchAlbumsAndAccessStatusForUser(user.id);
        // Record profile view for the new "Who Viewed Me" feature
        supabase.rpc('record_profile_view', { p_viewed_id: user.id })
            .then(({ error }) => {
                if(error) console.error("Error recording profile view:", error);
            });
    }
    
    const fetchWinkCount = async () => {
        if (currentUser && currentUser.subscription_tier === 'free') {
            const { data, error } = await supabase.rpc('get_daily_wink_count', { p_sender_id: currentUser.id });
            if (!error) {
                setWinkCount(data);
            }
        }
    };
    fetchWinkCount();

    return () => {
        clearViewedUserData();
    }
  }, [user, currentUser, fetchAlbumsAndAccessStatusForUser, clearViewedUserData, fetchAgoraPosts]);

  const isOnline = onlineUsers.includes(user.id);
  const statusText = isOnline ? 'Online' : formatLastSeen(user.last_seen);

  const handleWink = async () => {
    if (!currentUser) return;

    const { data: result, error } = await supabase.rpc('send_wink', { 
        p_receiver_id: user.id 
    });

    if (error) {
      toast.error('Erro ao chamar o perfil.');
      console.error("Error sending wink:", error);
      return;
    }

    switch (result) {
      case 'success_plus':
        toast.success('Chamado enviado com sucesso!');
        // No need to change count for plus users
        break;
      case 'success_free':
        toast.success('Chamado enviado com sucesso!');
        setWinkCount(count => (count !== null ? count + 1 : 1));
        break;
      case 'limit_reached':
        toast.error('Você atingiu seu limite diário de chamados.');
        setSubscriptionModalOpen(true);
        break;
      case 'already_winked':
        toast('Você já chamou este perfil!', { icon: '😉' });
        break;
      default:
        toast.error('Ocorreu um erro inesperado.');
    }
    
    // Send push notification regardless of success type (if not an error)
    if (result && result.startsWith('success')) {
        const { session } = (await supabase.auth.getSession()).data;
        if (session) {
          fetch('/api/send-wink-push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ receiver_id: user.id })
          }).catch(err => console.error("Error sending wink push notification:", err));
        }
    }
  };
  
  const handleChatClick = () => {
    onStartChat(user);
    onClose();
  }
  
  const handleRequestAccess = () => {
      toast.promise(requestAccess(user.id), {
          loading: 'Enviando solicitação...',
          success: 'Solicitação enviada!',
          error: 'Não foi possível enviar a solicitação.',
      });
  }

  const handleBlockUser = () => {
      setBlockConfirmOpen(false); // close confirmation
      blockUser({ id: user.id, username: user.username });
      onClose(); // Close the profile modal itself
  };

  const allPhotos = [user.avatar_url, ...(user.public_photos || [])];

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  const renderAccessButton = () => {
      switch (viewedUserAccessStatus) {
          case 'pending':
              return <button disabled className="w-full bg-slate-600 text-slate-400 font-bold py-3 rounded-lg text-sm">Solicitação Enviada</button>;
          case 'denied':
              return <p className="text-sm text-center text-slate-400">Seu pedido de acesso foi recusado.</p>;
          case null:
              return <button onClick={handleRequestAccess} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors text-sm">Solicitar Acesso</button>;
          default:
              return null;
      }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className={`relative w-full aspect-square flex-shrink-0 ${agoraPost ? 'border-b-4 border-red-600 animate-pulse-fire' : ''}`}>
          <img src={allPhotos[currentPhotoIndex]} alt={user.username} className="w-full h-full object-cover sm:rounded-t-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          <button onClick={() => setOptionsMenuOpen(true)} className="absolute top-4 left-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
              <span className="material-symbols-outlined">more_vert</span>
          </button>

          {isOptionsMenuOpen && (
              <>
                <div className="absolute top-14 left-4 bg-slate-700 rounded-lg shadow-lg z-20 w-48 text-left animate-fade-in">
                    <button 
                        onClick={() => { setBlockConfirmOpen(true); setOptionsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-3 text-sm text-red-400 hover:bg-slate-600 rounded-t-lg"
                    >
                        <span className="material-symbols-outlined text-xl">block</span>
                        Bloquear {user.username}
                    </button>
                    <button 
                        onClick={() => { setReportModalOpen(true); setOptionsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-3 text-sm text-yellow-400 hover:bg-slate-600 rounded-b-lg"
                    >
                        <span className="material-symbols-outlined text-xl">flag</span>
                        Denunciar
                    </button>
                </div>
                <div className="fixed inset-0 z-10" onClick={() => setOptionsMenuOpen(false)}></div>
              </>
          )}
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
            <span className="material-symbols-outlined">close</span>
          </button>
          
          {allPhotos.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                {allPhotos.map((_, index) => (
                  <div key={index} className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-3xl font-bold flex items-center gap-2 flex-wrap">
              <span>{user.username}, {user.age}</span>
              {user.subscription_tier === 'plus' && (
                  <span className="flex items-center gap-1 text-base bg-yellow-400/20 text-yellow-300 font-semibold px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                      Plus
                  </span>
              )}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              {isOnline && <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>}
              <p className="text-sm text-slate-300">{statusText}</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          {agoraPost && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-2">
                <span className="material-symbols-outlined text-xl">local_fire_department</span>
                <span>AGORA</span>
              </div>
              <img src={agoraPost.photo_url} alt="Status Agora" className="w-full rounded-lg mb-3 max-h-60 object-cover" />
              {agoraPost.status_text && <p className="text-white italic">"{agoraPost.status_text}"</p>}
            </div>
          )}

          {user.status_text && <p className="text-slate-300 italic">"{user.status_text}"</p>}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.height_cm && <InfoItem icon="straighten" label="Altura" value={`${user.height_cm} cm`} />}
            {user.weight_kg && <InfoItem icon="scale" label="Peso" value={`${user.weight_kg} kg`} />}
            {user.position && <InfoItem icon="favorite" label="Posição" value={user.position} />}
            {user.hiv_status && <InfoItem icon="verified_user" label="Status HIV" value={user.hiv_status} />}
          </div>
          
          {user.tribes && user.tribes.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-xl">groups</span> Tribos</h3>
              <div className="flex flex-wrap gap-2">
                {user.tribes.map(tribe => (
                  <span key={tribe} className="bg-slate-700 text-pink-300 text-xs font-bold px-2.5 py-1 rounded-full">{tribe}</span>
                ))}
              </div>
            </div>
          )}
          
          {user.has_private_albums && (
            <div>
                <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">lock</span> Álbuns Privados
                </h3>
                {isFetchingViewedUserAlbums ? (
                    <p className="text-sm text-slate-400">Verificando acesso...</p>
                ) : viewedUserAccessStatus === 'granted' ? (
                    viewedUserAlbums.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {viewedUserAlbums.map(album => (
                                <div key={album.id} className="relative aspect-square group cursor-pointer" onClick={() => setViewingAlbum(album)}>
                                    <div className="absolute inset-0 bg-slate-700 rounded-lg flex items-center justify-center text-center p-1">
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
                        <p className="text-sm text-center text-slate-400 p-4 bg-slate-700 rounded-lg">Este usuário não possui fotos em seus álbuns privados.</p>
                    )
                ) : (
                    <div className="p-4 bg-slate-700 rounded-lg text-center">
                        <p className="text-sm text-slate-300 mb-3">Peça para ver as fotos privadas de {user.username}.</p>
                        {renderAccessButton()}
                    </div>
                )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-700 flex-shrink-0 flex flex-col gap-3">
          {currentUser?.subscription_tier === 'free' && winkCount !== null && (
              <div className="text-center text-sm text-slate-400">
                  {10 - winkCount > 0 ? (
                      <p>Você tem <span className="font-bold text-white">{10 - winkCount} de 10</span> chamados restantes hoje.</p>
                  ) : (
                      <p>Limite diário atingido. <button onClick={() => { onClose(); setSubscriptionModalOpen(true); }} className="text-pink-400 underline font-semibold">Seja Plus</button> para ilimitado.</p>
                  )}
              </div>
          )}
          {currentUser?.subscription_tier === 'plus' && (
                <div className="text-center text-sm text-green-400 font-semibold flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined !text-base">all_inclusive</span>
                  <span>Chamados ilimitados</span>
              </div>
          )}
          <div className="flex gap-4">
            <button 
              onClick={handleWink} 
              disabled={currentUser?.subscription_tier === 'free' && winkCount !== null && winkCount >= 10}
              className="w-full bg-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl text-pink-400">favorite</span>
              <span>Chamar</span>
            </button>
            <button onClick={handleChatClick} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors">
              <span className="material-symbols-outlined text-xl">chat</span>
              <span>Mensagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    {viewingAlbum && (
        <AlbumGalleryModal album={viewingAlbum} onClose={() => setViewingAlbum(null)} />
    )}
    {isReportModalOpen && (
        <ReportUserModal user={user} onClose={() => setReportModalOpen(false)} />
    )}
    {isBlockConfirmOpen && (
        <ConfirmationModal
            isOpen={isBlockConfirmOpen}
            title={`Bloquear ${user.username}`}
            message={`Você não verá mais o perfil de ${user.username} e ele não verá o seu. Ele não será notificado. Tem certeza?`}
            onConfirm={handleBlockUser}
            onCancel={() => setBlockConfirmOpen(false)}
            confirmText="Bloquear"
        />
    )}
    </>
  );
};

const InfoItem = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
    <div className="flex items-center space-x-2">
        <span className="material-symbols-outlined text-xl text-pink-400">{icon}</span>
        <div>
            <p className="text-slate-400">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);
