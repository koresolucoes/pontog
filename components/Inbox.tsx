import React, { useState, useEffect, useMemo } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useUiStore } from '../stores/uiStore';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { useAdStore } from '../stores/adStore';
import { ConversationPreview, User, WinkWithProfile, AlbumAccessRequest, ProfileViewWithProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ConfirmationModal } from './ConfirmationModal';
import { AdSenseUnit } from './AdSenseUnit';
import { UnlockFeatureModal } from './UnlockFeatureModal';
import { RewardAdModal } from './RewardAdModal';


type ActiveTab = 'messages' | 'winks' | 'views' | 'requests';

interface InboxProps {
    initialTab?: ActiveTab;
}

const formatLastMessageContent = (content: string | null | undefined): string => {
    if (content === null) return '📷 Foto';
    if (!content) return '';

    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && parsed.type) {
            switch (parsed.type) {
                case 'location':
                    return '📍 Localização';
                case 'album':
                    return '📷 Álbum';
                default:
                    return content;
            }
        }
        return content;
    } catch (e) {
        return content;
    }
};


export const Inbox: React.FC<InboxProps> = ({ initialTab = 'messages' }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const { 
        conversations, winks, accessRequests, profileViews,
        loadingConversations, loadingWinks, loadingRequests, loadingProfileViews,
        fetchWinks, fetchProfileViews, fetchAccessRequests,
        respondToRequest, deleteConversation, clearWinks, clearAccessRequests
    } = useInboxStore();
    const { setChatUser, setSubscriptionModalOpen } = useUiStore();
    const { setSelectedUser } = useMapStore();
    const { user: currentUser } = useAuthStore();
    const { grantTemporaryPerk } = useAdStore();
    
    const [confirmDelete, setConfirmDelete] = useState<ConversationPreview | null>(null);
    const [unlockModal, setUnlockModal] = useState<'winks' | 'views' | null>(null);
    const [rewardModal, setRewardModal] = useState<'winks' | 'views' | null>(null);

    useEffect(() => {
        if (activeTab === 'winks') fetchWinks();
        if (activeTab === 'requests') fetchAccessRequests();
        if (activeTab === 'views') fetchProfileViews();
    }, [activeTab, fetchWinks, fetchAccessRequests, fetchProfileViews]);
    
    useEffect(() => {
        if (activeTab === 'winks' && winks.length > 0) clearWinks();
    }, [activeTab, winks, clearWinks]);

    useEffect(() => {
        if (activeTab === 'requests' && accessRequests.length > 0) clearAccessRequests();
    }, [activeTab, accessRequests, clearAccessRequests]);

    const handleConversationClick = (convo: ConversationPreview) => {
        const chatPartner: User = {
            id: convo.other_participant_id, username: convo.other_participant_username,
            avatar_url: convo.other_participant_avatar_url, last_seen: convo.other_participant_last_seen,
            display_name: null, public_photos: [], status_text: null, date_of_birth: null,
            height_cm: null, weight_kg: null, tribes: [], position: null, hiv_status: null,
            updated_at: '', lat: 0, lng: 0, age: 0, distance_km: null, 
            subscription_tier: convo.other_participant_subscription_tier,
            subscription_expires_at: null, is_incognito: false,
            has_completed_onboarding: true,
            has_private_albums: false,
            email: '',
            created_at: '',
            status: 'active',
            suspended_until: null,
        };
        setChatUser(chatPartner);
    };
    
    const handleDeleteConfirm = () => {
        if (confirmDelete) {
            deleteConversation(confirmDelete.conversation_id);
            setConfirmDelete(null);
        }
    };
    
    const handlePremiumFeatureClick = (feature: 'winks' | 'views') => {
        if (currentUser?.subscription_tier !== 'plus') {
            setUnlockModal(feature);
        } else {
            setActiveTab(feature);
        }
    };

    const handlePremiumUserClick = (user: WinkWithProfile | ProfileViewWithProfile) => {
        setSelectedUser(user);
    }

    const TabButton = ({ label, tabName, isPremium = false, icon }: { label: string, tabName: ActiveTab, isPremium?: boolean, icon: string }) => {
        const isActive = activeTab === tabName;
        return (
            <button 
                onClick={() => isPremium ? handlePremiumFeatureClick(tabName as 'winks' | 'views') : setActiveTab(tabName)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-300 ${
                    isActive 
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-md border border-white/10' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
            >
                <div className="relative">
                    <span className={`material-symbols-rounded text-2xl ${isActive ? 'filled text-pink-500' : ''}`}>{icon}</span>
                    {isPremium && <span className="absolute -top-1 -right-2 material-symbols-rounded filled text-[10px] text-yellow-400 drop-shadow-sm">auto_awesome</span>}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </button>
        );
    }

    return (
        <>
        <div className="flex flex-col h-full bg-dark-900">
            <header className="p-4 pb-0 flex-shrink-0 z-10 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
                <h1 className="text-2xl font-black tracking-tight mb-4 font-outfit text-white px-2">Inbox</h1>
                <div className="flex justify-between gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-white/5 mb-4">
                    <TabButton label="Chats" tabName="messages" icon="chat_bubble" />
                    <TabButton label="Winks" tabName="winks" isPremium icon="favorite" />
                    <TabButton label="Visitas" tabName="views" isPremium icon="visibility" />
                    <TabButton label="Pedidos" tabName="requests" icon="lock_open" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 space-y-4">
                {activeTab === 'messages' && (
                    <ConversationList 
                        conversations={conversations} 
                        loading={loadingConversations}
                        onConversationClick={handleConversationClick}
                        onDeleteClick={(convo) => setConfirmDelete(convo)}
                        currentUserId={currentUser?.id}
                    />
                )}
                {activeTab === 'winks' && (
                    <WinkList 
                        winks={winks}
                        loading={loadingWinks}
                        isPlus={currentUser?.subscription_tier === 'plus'}
                        onWinkClick={handlePremiumUserClick}
                        onUpgradeClick={() => setUnlockModal('winks')}
                    />
                )}
                 {activeTab === 'views' && (
                    <ProfileViewList 
                        views={profileViews}
                        loading={loadingProfileViews}
                        isPlus={currentUser?.subscription_tier === 'plus'}
                        onViewClick={handlePremiumUserClick}
                        onUpgradeClick={() => setUnlockModal('views')}
                    />
                )}
                {activeTab === 'requests' && (
                    <RequestList
                        requests={accessRequests}
                        loading={loadingRequests}
                        onRespond={respondToRequest}
                    />
                )}
            </div>
        </div>
        {confirmDelete && (
             <ConfirmationModal
                isOpen={!!confirmDelete}
                title="Apagar Conversa"
                message={`Tem certeza que deseja apagar permanentemente a conversa com ${confirmDelete.other_participant_username}?`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDelete(null)}
                confirmText="Apagar"
             />
        )}
        {unlockModal && (
            <UnlockFeatureModal
                title={unlockModal === 'winks' ? 'Veja quem te chamou' : 'Descubra quem te viu'}
                description="Assine o Plus para acesso ilimitado ou veja um anúncio para liberar por 1 hora."
                onClose={() => setUnlockModal(null)}
                onUpgrade={() => { setSubscriptionModalOpen(true); setUnlockModal(null); }}
                onWatchAd={() => { setRewardModal(unlockModal); setUnlockModal(null); }}
            />
        )}
        {rewardModal && (
            <RewardAdModal
                onClose={() => setRewardModal(null)}
                onReward={() => {
                    grantTemporaryPerk(rewardModal === 'winks' ? 'view_winks' : 'view_profile_views', 1);
                    setActiveTab(rewardModal);
                }}
            />
        )}
        </>
    );
};

// ... Sub-componentes ...

interface ConversationListProps {
    conversations: ConversationPreview[]; 
    loading: boolean;
    onConversationClick: (convo: ConversationPreview) => void;
    onDeleteClick: (convo: ConversationPreview) => void;
    currentUserId?: string;
}
const ConversationList: React.FC<ConversationListProps> = ({ conversations, loading, onConversationClick, onDeleteClick, currentUserId }) => {
    const onlineUsers = useMapStore((state) => state.onlineUsers);

    const itemsWithAd = useMemo(() => {
        const items: (ConversationPreview | { type: 'ad' })[] = [...conversations];
        if (items.length > 3) {
            items.splice(3, 0, { type: 'ad' });
        }
        return items;
    }, [conversations]);

    if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (conversations.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-fade-in">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <span className="material-symbols-rounded text-4xl text-slate-600">chat_bubble_outline</span>
            </div>
            <p className="text-slate-400 font-medium">Nenhuma conversa iniciada.</p>
        </div>
    );
    
    return (
        <div className="space-y-3 pb-4">
            {itemsWithAd.map((item, idx) => {
                 if ('type' in item && item.type === 'ad') {
                    return (
                        <div key="ad-inbox" className="my-2 rounded-2xl overflow-hidden border border-white/5 shadow-lg">
                            <AdSenseUnit
                                client="ca-pub-9015745232467355"
                                slot="3561488011"
                                format="auto"
                            />
                        </div>
                    );
                }
                const convo = item as ConversationPreview;
                const isOnline = onlineUsers.includes(convo.other_participant_id);
                return (
                    <div 
                        key={convo.conversation_id} 
                        className="relative p-4 flex items-center gap-4 rounded-3xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 active:scale-[0.98] transition-all cursor-pointer group shadow-sm backdrop-blur-sm" 
                        onClick={() => onConversationClick(convo)}
                    >
                        <div className="relative flex-shrink-0">
                            <img src={convo.other_participant_avatar_url} alt={convo.other_participant_username} className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-700/50 group-hover:ring-pink-500/30 transition-all" />
                            {convo.unread_count > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-dark-900 animate-bounce">
                                    {convo.unread_count > 9 ? '9+' : convo.unread_count}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold truncate text-base text-slate-100 font-outfit">{convo.other_participant_username}</h3>
                                    {isOnline && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>}
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 flex-shrink-0 ml-2 uppercase tracking-wide">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: false, locale: ptBR } as any)}</span>
                            </div>
                            <p className={`text-sm truncate leading-relaxed ${convo.unread_count > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                                {convo.last_message_sender_id === currentUserId && <span className="text-slate-500">Você: </span>}
                                {formatLastMessageContent(convo.last_message_content)}
                            </p>
                        </div>
                        
                        {/* Delete Swipe/Action (Visible on hover for desktop) */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteClick(convo); }} 
                            className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-full shadow-lg border border-white/5"
                        >
                            <span className="material-symbols-rounded text-xl">delete</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

interface WinkListProps {
    winks: WinkWithProfile[]; loading: boolean; isPlus: boolean;
    onWinkClick: (wink: WinkWithProfile) => void;
    onUpgradeClick: () => void;
}
const WinkList: React.FC<WinkListProps> = ({ winks, loading, isPlus, onWinkClick, onUpgradeClick }) => {
    const hasWinkPerk = useAdStore(state => state.hasPerk('view_winks'));
    const canView = isPlus || hasWinkPerk;

    if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!canView && winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    if (!canView) {
        return (
            <div className="relative p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {winks.slice(0, 10).map(wink => (
                    <div key={wink.id} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 opacity-30">
                        <img src={wink.avatar_url} alt="Perfil ofuscado" className="w-full h-full object-cover filter blur-xl" />
                    </div>
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                    <div className="w-16 h-16 bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                        <span className="material-symbols-rounded text-3xl text-pink-500 filled">lock</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-outfit">Quem te chamou?</h3>
                    <p className="text-slate-400 text-sm my-3 max-w-xs">Assine o Plus ou assista a um vídeo para revelar.</p>
                    <button onClick={onUpgradeClick} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-pink-900/30 hover:scale-105 transition-transform active:scale-95">
                        Revelar Agora
                    </button>
                </div>
            </div>
        );
    }
    
    if (winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {winks.map(wink => (
                <div key={wink.id} onClick={() => onWinkClick(wink)} className="relative aspect-[3/4] cursor-pointer group rounded-2xl overflow-hidden bg-slate-800 shadow-lg border border-white/5 transition-transform active:scale-95">
                     <img src={wink.avatar_url} alt={wink.username} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-bold text-xs truncate">{wink.username}, {wink.age}</h3>
                        <p className="text-[9px] text-slate-300 font-medium uppercase tracking-wide">{formatDistanceToNow(new Date(wink.wink_created_at), { addSuffix: false, locale: ptBR } as any)}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-pink-600/90 backdrop-blur-sm p-1 rounded-full shadow-lg">
                        <span className="material-symbols-rounded text-white text-[10px] filled block">favorite</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface ProfileViewListProps {
    views: ProfileViewWithProfile[]; loading: boolean; isPlus: boolean;
    onViewClick: (view: ProfileViewWithProfile) => void;
    onUpgradeClick: () => void;
}
const ProfileViewList: React.FC<ProfileViewListProps> = ({ views, loading, isPlus, onViewClick, onUpgradeClick }) => {
    const hasViewPerk = useAdStore(state => state.hasPerk('view_profile_views'));
    const canView = isPlus || hasViewPerk;

    if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!canView && views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    if (!canView) {
        return (
            <div className="relative p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {views.slice(0, 10).map(view => (
                    <div key={view.id} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 opacity-30">
                        <img src={view.avatar_url} alt="Perfil ofuscado" className="w-full h-full object-cover filter blur-xl" />
                    </div>
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                    <div className="w-16 h-16 bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                        <span className="material-symbols-rounded text-3xl text-pink-500 filled">visibility_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-outfit">Quem te viu?</h3>
                    <p className="text-slate-400 text-sm my-3 max-w-xs">Descubra quem visitou seu perfil com o Plus.</p>
                    <button onClick={onUpgradeClick} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-pink-900/30 hover:scale-105 transition-transform active:scale-95">
                        Desbloquear
                    </button>
                </div>
            </div>
        );
    }
    
    if (views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {views.map(view => (
                <div key={view.id} onClick={() => onViewClick(view)} className="relative aspect-[3/4] cursor-pointer group rounded-2xl overflow-hidden bg-slate-800 shadow-lg border border-white/5 transition-transform active:scale-95">
                     <img src={view.avatar_url} alt={view.username} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-bold text-xs truncate">{view.username}, {view.age}</h3>
                         <p className="text-[9px] text-slate-300 font-medium uppercase tracking-wide">{formatDistanceToNow(new Date(view.viewed_at), { addSuffix: false, locale: ptBR } as any)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface RequestListProps {
    requests: AlbumAccessRequest[]; loading: boolean;
    onRespond: (requestId: number, status: 'granted' | 'denied') => void;
}
const RequestList: React.FC<RequestListProps> = ({ requests, loading, onRespond }) => {
    if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (requests.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-fade-in">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <span className="material-symbols-rounded text-4xl text-slate-600">lock_open_right</span>
            </div>
            <p className="text-slate-400 font-medium">Nenhuma solicitação pendente.</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {requests.map(req => (
                <div key={req.id} className="p-4 flex items-center gap-4 bg-slate-800/60 rounded-2xl border border-white/5 shadow-sm">
                    <img src={req.avatar_url} alt={req.username} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-slate-200 leading-snug">
                            <span className="font-bold text-white">{req.username}</span> pediu para ver seus álbuns privados.
                        </p>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR } as any)}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onRespond(req.id, 'denied')} className="w-10 h-10 flex items-center justify-center bg-slate-700/80 text-red-400 rounded-full hover:bg-red-500/20 transition-colors border border-white/5">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                        <button onClick={() => onRespond(req.id, 'granted')} className="w-10 h-10 flex items-center justify-center bg-green-600/20 text-green-400 border border-green-500/50 rounded-full hover:bg-green-600/30 transition-colors shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                            <span className="material-symbols-rounded text-xl">check</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};