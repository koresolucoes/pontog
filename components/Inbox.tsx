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

// Helper para formatar a pré-visualização de mensagens especiais
const formatLastMessageContent = (content: string | null | undefined): string => {
    if (content === null) return '📷 Foto';
    if (!content) return '';

    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && parsed.type) {
            switch (parsed.type) {
                case 'location':
                    return '📍 Localização compartilhada';
                case 'album':
                    return '📷 Álbum compartilhado';
                default:
                    return content; // JSON com tipo desconhecido
            }
        }
        return content; // JSON válido, mas sem a propriedade 'type'
    } catch (e) {
        return content; // Não é JSON, então é texto normal
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
        if (activeTab === 'winks') {
            fetchWinks();
        }
        if (activeTab === 'requests') {
            fetchAccessRequests();
        }
        if (activeTab === 'views') {
            fetchProfileViews();
        }
    }, [activeTab, fetchWinks, fetchAccessRequests, fetchProfileViews]);
    
    useEffect(() => {
        if (activeTab === 'winks' && winks.length > 0) {
            clearWinks();
        }
    }, [activeTab, winks, clearWinks]);

    useEffect(() => {
        if (activeTab === 'requests' && accessRequests.length > 0) {
            clearAccessRequests();
        }
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

    const TabButton = ({ label, tabName, isPremium = false }: { label: string, tabName: ActiveTab, isPremium?: boolean }) => (
         <button 
            onClick={() => isPremium ? handlePremiumFeatureClick(tabName as 'winks' | 'views') : setActiveTab(tabName)}
            className={`flex items-center gap-1.5 py-2 px-3 text-sm font-semibold transition-colors border-b-2 flex-shrink-0 ${activeTab === tabName ? 'text-pink-500 border-pink-500' : 'text-slate-400 border-transparent hover:text-white'}`}
        >
            {label}
            {isPremium && <span className="material-symbols-outlined !text-[16px] text-yellow-400">auto_awesome</span>}
        </button>
    );

    return (
        <>
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <header className="p-4">
                <h1 className="text-xl font-bold">Caixa de Entrada</h1>
                <div className="mt-4 border-b border-slate-700">
                    <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                        <TabButton label="Mensagens" tabName="messages" />
                        <TabButton label="Te Chamaram" tabName="winks" isPremium />
                        <TabButton label="Quem Me Viu" tabName="views" isPremium />
                        <TabButton label="Solicitações" tabName="requests" />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
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

    if (loading) return <p className="text-center p-8 text-slate-400">Carregando conversas...</p>;
    if (conversations.length === 0) return <p className="text-center p-8 text-slate-400">Nenhuma conversa iniciada.</p>;
    
    return (
        <div className="divide-y divide-slate-800">
            {itemsWithAd.map(item => {
                 if ('type' in item && item.type === 'ad') {
                    return (
                        <div key="ad-inbox" className="p-1">
                            <AdSenseUnit
                                client="ca-pub-9015745232467355"
                                slot="3561488011"
                                format="fluid"
                            />
                        </div>
                    );
                }
                const convo = item as ConversationPreview;
                const isOnline = onlineUsers.includes(convo.other_participant_id);
                return (
                    <div key={convo.conversation_id} className="p-4 flex items-center space-x-3 group hover:bg-slate-800">
                        <div onClick={() => onConversationClick(convo)} className="flex-1 flex items-center space-x-3 cursor-pointer">
                            <div className="relative flex-shrink-0">
                                <img src={convo.other_participant_avatar_url} alt={convo.other_participant_username} className="w-12 h-12 rounded-full object-cover" />
                                {convo.unread_count > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-slate-900">
                                        {convo.unread_count > 9 ? '9+' : convo.unread_count}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        {isOnline && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
                                        <h3 className="font-bold truncate text-base">{convo.other_participant_username}</h3>
                                    </div>
                                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: true, locale: ptBR } as any)}</span>
                                </div>
                                <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-white' : 'text-slate-400'}`}>
                                    {convo.last_message_sender_id === currentUserId && "Você: "}
                                    {formatLastMessageContent(convo.last_message_content)}
                                </p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(convo); }} className="p-2 text-slate-500 rounded-full hover:bg-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-xl">delete</span>
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

    if (loading) return <p className="text-center p-8 text-slate-400">Carregando chamados...</p>;
    if (!canView && winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    if (!canView) {
        return (
            <div className="relative p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {winks.slice(0, 10).map(wink => (
                    <div key={wink.id} className="relative aspect-square">
                        <img src={wink.avatar_url} alt="Perfil ofuscado" className="w-full h-full object-cover filter blur-md" />
                    </div>
                ))}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-5xl text-pink-400 mb-4">lock</span>
                    <h3 className="text-lg font-bold text-white">Veja quem te chamou</h3>
                    <p className="text-slate-300 my-2">Assine o Ponto G Plus para desbloquear ou veja um anúncio.</p>
                    <button onClick={onUpgradeClick} className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-2 px-6 rounded-lg">
                        Desbloquear Opções
                    </button>
                </div>
            </div>
        );
    }
    
    if (winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    return (
        <div className="p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
            {winks.map(wink => (
                <div key={wink.id} onClick={() => onWinkClick(wink)} className="relative aspect-square cursor-pointer group">
                     <img src={wink.avatar_url} alt={wink.username} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-sm truncate">{wink.username}</h3>
                        <p className="text-xs text-slate-300">{formatDistanceToNow(new Date(wink.wink_created_at), { addSuffix: true, locale: ptBR } as any)}</p>
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

    if (loading) return <p className="text-center p-8 text-slate-400">Carregando visitantes...</p>;
    if (!canView && views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    if (!canView) {
        return (
            <div className="relative p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {views.slice(0, 10).map(view => (
                    <div key={view.id} className="relative aspect-square">
                        <img src={view.avatar_url} alt="Perfil ofuscado" className="w-full h-full object-cover filter blur-md" />
                    </div>
                ))}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-5xl text-pink-400 mb-4">visibility</span>
                    <h3 className="text-lg font-bold text-white">Descubra quem te viu</h3>
                    <p className="text-slate-300 my-2">Veja quem visitou seu perfil com o Plus ou assistindo a um anúncio.</p>
                    <button onClick={onUpgradeClick} className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-2 px-6 rounded-lg">
                        Desbloquear Opções
                    </button>
                </div>
            </div>
        );
    }
    
    if (views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    return (
        <div className="p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
            {views.map(view => (
                <div key={view.id} onClick={() => onViewClick(view)} className="relative aspect-square cursor-pointer group">
                     <img src={view.avatar_url} alt={view.username} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-sm truncate">{view.username}</h3>
                         <p className="text-xs text-slate-300">{formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true, locale: ptBR } as any)}</p>
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
    if (loading) return <p className="text-center p-8 text-slate-400">Carregando solicitações...</p>;
    if (requests.length === 0) return <p className="text-center p-8 text-slate-400">Nenhuma solicitação pendente.</p>;

    return (
        <div className="divide-y divide-slate-800">
            {requests.map(req => (
                <div key={req.id} className="p-4 flex items-center space-x-4">
                    <img src={req.avatar_url} alt={req.username} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm">
                            <span className="font-bold">{req.username}</span> solicitou acesso aos seus álbuns.
                        </p>
                        <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR } as any)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onRespond(req.id, 'denied')} className="p-2.5 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600"><span className="material-symbols-outlined">close</span></button>
                        <button onClick={() => onRespond(req.id, 'granted')} className="p-2.5 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600"><span className="material-symbols-outlined">check</span></button>
                    </div>
                </div>
            ))}
        </div>
    );
};