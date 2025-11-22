
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Video Control
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const agoraPost = posts.find(p => p.user_id === user.id);

  useEffect(() => {
    fetchAgoraPosts();
    if (user && currentUser && user.id !== currentUser.id) {
        fetchAlbumsAndAccessStatusForUser(user.id);
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
  const statusText = isOnline ? 'Online Agora' : formatLastSeen(user.last_seen);

  const handleWink = async () => {
    if (!currentUser) return;

    const { data: result, error } = await supabase.rpc('send_wink', { 
        p_receiver_id: user.id 
    });

    if (error) {
      toast.error('Erro ao chamar o perfil.');
      return;
    }

    switch (result) {
      case 'success_plus':
      case 'success_free':
        toast.success('Chamado enviado com sucesso!', { icon: '😉' });
        if (result === 'success_free') setWinkCount(count => (count !== null ? count + 1 : 1));
        break;
      case 'limit_reached':
        toast.error('Limite diário atingido.');
        setSubscriptionModalOpen(true);
        break;
      case 'already_winked':
        toast('Você já chamou este perfil!', { icon: '😉' });
        break;
    }
    
    if (result && result.startsWith('success')) {
        const { session } = (await supabase.auth.getSession()).data;
        if (session) {
          fetch('/api/send-wink-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ receiver_id: user.id })
          }).catch(err => console.error("Error sending wink push:", err));
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
          error: 'Erro ao solicitar.',
      });
  }

  const handleBlockUser = () => {
      setBlockConfirmOpen(false);
      blockUser({ id: user.id, username: user.username });
      onClose();
  };

  const allPhotos = [user.avatar_url, ...(user.public_photos || [])];
  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  const toggleVideo = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlayingVideo(true);
          } else {
              videoRef.current.pause();
              setIsPlayingVideo(false);
          }
      }
  }

  const renderAccessButton = () => {
      switch (viewedUserAccessStatus) {
          case 'pending':
              return <button disabled className="w-full bg-slate-700/50 text-slate-400 font-medium py-3 rounded-xl text-sm border border-slate-600">Solicitação Enviada</button>;
          case 'denied':
              return <p className="text-sm text-center text-red-400/80 bg-red-900/10 py-2 rounded-lg">Acesso recusado.</p>;
          case null:
              return <button onClick={handleRequestAccess} className="w-full bg-pink-600/20 text-pink-400 border border-pink-500/50 hover:bg-pink-600/30 font-bold py-3 rounded-xl transition-colors text-sm">Solicitar Acesso</button>;
          default: return null;
      }
  }

  return (
    <>
    {/* Backdrop with blur */}
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
    
    {/* Modal Content - Bottom Sheet style on Mobile, Centered Card on Desktop */}
    <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none">
      <div className="bg-slate-800/95 backdrop-blur-xl sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-md mx-auto pointer-events-auto overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] animate-slide-in-up border-t border-x border-white/10 sm:border-b">
        
        {/* Drag Handle for Mobile aesthetic */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        {/* Options Button (Moved up for z-index safety) */}
        <div className="absolute top-4 right-4 z-30 flex gap-2">
             <button onClick={() => setOptionsMenuOpen(true)} className="text-white bg-black/20 backdrop-blur-md p-2.5 rounded-full hover:bg-black/40 transition-colors border border-white/10">
                <span className="material-symbols-rounded">more_vert</span>
            </button>
            <button onClick={onClose} className="text-white bg-black/20 backdrop-blur-md p-2.5 rounded-full hover:bg-black/40 transition-colors border border-white/10">
                <span className="material-symbols-rounded">close</span>
            </button>
        </div>

        {isOptionsMenuOpen && (
            <>
            <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-40 w-48 overflow-hidden animate-fade-in">
                <button 
                    onClick={() => { setBlockConfirmOpen(true); setOptionsMenuOpen(false); }} 
                    className="w-full flex items-center gap-3 p-3.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-rounded text-xl">block</span>
                    Bloquear
                </button>
                <div className="h-px bg-white/5"></div>
                <button 
                    onClick={() => { setReportModalOpen(true); setOptionsMenuOpen(false); }} 
                    className="w-full flex items-center gap-3 p-3.5 text-sm text-yellow-400 hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-rounded text-xl">flag</span>
                    Denunciar
                </button>
            </div>
            <div className="fixed inset-0 z-20" onClick={() => setOptionsMenuOpen(false)}></div>
            </>
        )}

        {/* Media Area: Video or Carousel */}
        <div className={`relative w-full aspect-[4/5] sm:aspect-square flex-shrink-0 group bg-black`}>
          {user.video_url && currentPhotoIndex === 0 ? (
              <div className="w-full h-full relative" onClick={toggleVideo}>
                  <video 
                    ref={videoRef}
                    src={user.video_url} 
                    className="w-full h-full object-cover" 
                    loop 
                    muted={!isPlayingVideo} // Start muted for autoplay policies
                    playsInline
                    autoPlay
                  />
                  {!isPlayingVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <span className="material-symbols-rounded text-white text-5xl opacity-80 shadow-lg">play_circle</span>
                      </div>
                  )}
                  <div className="absolute bottom-24 right-4 bg-black/50 p-2 rounded-full text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                      <span className="material-symbols-rounded filled text-sm">videocam</span>
                      Vídeo
                  </div>
              </div>
          ) : (
              <img src={allPhotos[currentPhotoIndex]} alt={user.username} className="w-full h-full object-cover" />
          )}
          
          {!user.video_url || currentPhotoIndex > 0 ? (
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90 pointer-events-none"></div>
          ) : null}

          {/* Carousel Controls */}
          {allPhotos.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 transition-colors z-10 sm:opacity-0 sm:group-hover:opacity-100">
                <span className="material-symbols-rounded text-4xl shadow-black drop-shadow-lg">chevron_left</span>
              </button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 transition-colors z-10 sm:opacity-0 sm:group-hover:opacity-100">
                <span className="material-symbols-rounded text-4xl shadow-black drop-shadow-lg">chevron_right</span>
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute top-4 left-4 flex space-x-1.5 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {user.video_url && (
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${currentPhotoIndex === 0 ? 'bg-pink-500 scale-125' : 'bg-white/40'}`}></div>
                )}
                {allPhotos.map((_, index) => (
                  <div key={index} className={`w-1.5 h-1.5 rounded-full transition-all ${(user.video_url ? index + 1 : index) === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/40'}`}></div>
                ))}
              </div>
            </>
          )}

          {/* Header Info Over Photo */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2 flex-wrap leading-none mb-2 drop-shadow-lg">
                    <span>{user.username}, {user.age}</span>
                    {user.subscription_tier === 'plus' && (
                        <span className="bg-yellow-500/90 text-black p-1 rounded-full shadow-lg flex items-center justify-center">
                            <span className="material-symbols-rounded filled !text-[14px]">auto_awesome</span>
                        </span>
                    )}
                    </h2>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm shadow-sm ${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-500/20 text-slate-300 border border-white/10'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                            {statusText}
                        </span>
                         {user.distance_km != null && (
                             <span className="text-xs text-slate-300 font-medium drop-shadow-md">
                                {user.distance_km < 1 ? `${Math.round(user.distance_km * 1000)}m de você` : `${user.distance_km.toFixed(0)}km de você`}
                             </span>
                         )}
                         
                         {/* Hoster Badge */}
                         {user.can_host && (
                             <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-green-600 text-white shadow-lg border border-green-400">
                                 <span className="material-symbols-rounded filled !text-[14px]">home</span>
                                 TEM LOCAL
                             </span>
                         )}
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900">
          
          {agoraPost && (
            <div className="relative overflow-hidden rounded-2xl p-1 bg-gradient-to-r from-red-600 to-orange-600 shadow-lg shadow-red-900/30">
              <div className="bg-slate-900 rounded-xl p-4 relative">
                 <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none"></div>
                  <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-3">
                    <span className="material-symbols-rounded filled animate-bounce">local_fire_department</span>
                    <span className="tracking-widest text-sm">MODO AGORA</span>
                  </div>
                  <div className="flex gap-4 items-start">
                      <img src={agoraPost.photo_url} className="w-20 h-20 rounded-lg object-cover bg-slate-800" />
                      <div className="flex-1">
                          <p className="text-white italic text-lg leading-relaxed">"{agoraPost.status_text}"</p>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {user.status_text && (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-200 text-lg font-light leading-relaxed">"{user.status_text}"</p>
              </div>
          )}
          
          {/* Kinks Display */}
          {user.kinks && user.kinks.length > 0 && (
            <div>
                <h3 className="text-xs font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <span className="material-symbols-rounded filled text-base">interests</span> O que curto
                </h3>
                <div className="flex flex-wrap gap-2">
                    {user.kinks.map(kink => (
                        <span key={kink} className="bg-purple-900/30 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold">
                            {kink}
                        </span>
                    ))}
                </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {user.height_cm && <InfoItem icon="height" label="Altura" value={`${user.height_cm} cm`} />}
            {user.weight_kg && <InfoItem icon="monitor_weight" label="Peso" value={`${user.weight_kg} kg`} />}
            {user.position && <InfoItem icon="transgender" label="Posição" value={user.position} />}
            {user.hiv_status && <InfoItem icon="health_and_safety" label="Status HIV" value={user.hiv_status} />}
          </div>
          
          {user.tribes && user.tribes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Tribos</h3>
              <div className="flex flex-wrap gap-2">
                {user.tribes.map(tribe => (
                  <span key={tribe} className="bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold">{tribe}</span>
                ))}
              </div>
            </div>
          )}
          
          {user.has_private_albums && (
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <span className="material-symbols-rounded filled text-base">lock</span> Álbuns Privados
                </h3>
                {isFetchingViewedUserAlbums ? (
                    <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : viewedUserAccessStatus === 'granted' ? (
                    viewedUserAlbums.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {viewedUserAlbums.map(album => (
                                <div key={album.id} className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl" onClick={() => setViewingAlbum(album)}>
                                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-center p-1">
                                        <span className="font-bold text-white text-xs">{album.name}</span>
                                    </div>
                                    {album.private_album_photos.length > 0 && (
                                        <img src={album.private_album_photos[0].photo_path} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt={`Capa do álbum ${album.name}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-slate-500 py-4 border border-dashed border-slate-700 rounded-xl">Álbuns vazios.</p>
                    )
                ) : (
                    <div className="p-5 bg-slate-800/50 rounded-2xl text-center border border-white/5">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-rounded text-slate-400 text-2xl">lock</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-4">O conteúdo é privado.</p>
                        {renderAccessButton()}
                    </div>
                )}
            </div>
          )}
        </div>
        
        {/* Action Bar */}
        <div className="p-4 border-t border-white/10 bg-slate-900 flex-shrink-0 flex flex-col gap-3 pb-8 sm:pb-4">
          {currentUser?.subscription_tier === 'free' && winkCount !== null && (
              <div className="text-center text-xs text-slate-500">
                  {10 - winkCount > 0 ? (
                      <p>Você tem <span className="font-bold text-slate-300">{10 - winkCount}</span> chamados hoje.</p>
                  ) : (
                      <p>Acabaram os chamados. <button onClick={() => { onClose(); setSubscriptionModalOpen(true); }} className="text-pink-400 hover:underline font-semibold">Vire Plus</button></p>
                  )}
              </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleWink} 
              disabled={currentUser?.subscription_tier === 'free' && winkCount !== null && winkCount >= 10}
              className="flex-1 bg-slate-800 border border-white/10 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <span className="material-symbols-rounded text-xl text-pink-500 filled">favorite</span>
              <span>Chamar</span>
            </button>
            <button onClick={handleChatClick} className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-900/30 transition-all active:scale-95">
              <span className="material-symbols-rounded text-xl filled">chat_bubble</span>
              <span>Mensagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    {viewingAlbum && <AlbumGalleryModal album={viewingAlbum} onClose={() => setViewingAlbum(null)} />}
    {isReportModalOpen && <ReportUserModal user={user} onClose={() => setReportModalOpen(false)} />}
    {isBlockConfirmOpen && (
        <ConfirmationModal
            isOpen={isBlockConfirmOpen}
            title={`Bloquear ${user.username}`}
            message={`Você não verá mais o perfil de ${user.username}.`}
            onConfirm={handleBlockUser}
            onCancel={() => setBlockConfirmOpen(false)}
            confirmText="Bloquear"
        />
    )}
    </>
  );
};

const InfoItem = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
    <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-xl border border-white/5">
        <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-rounded text-lg text-pink-400">{icon}</span>
        </div>
        <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{label}</p>
            <p className="font-semibold text-slate-100 truncate">{value}</p>
        </div>
    </div>
);
