import React, { useState, useEffect } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useUiStore } from '../stores/uiStore';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationPreview, User, WinkWithProfile, AlbumAccessRequest, ProfileViewWithProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
// Fix: Correctly import the pt-BR locale from its specific module path.
import { ptBR } from 'date-fns/locale/pt-BR';
import { ConfirmationModal } from './ConfirmationModal';
import toast from 'react-hot-toast';

type ActiveTab = 'messages' | 'winks' | 'views' | 'requests';

interface InboxProps {
    initialTab?: ActiveTab;
}

export const Inbox: React.FC<InboxProps> = ({ initialTab = 'messages' }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const { 
        conversations, winks, accessRequests, profileViews,
        loadingConversations, loadingWinks, loadingRequests, loadingProfileViews,
        fetchConversations, fetchWinks, fetchAccessRequests, fetchProfileViews,
        respondToRequest, deleteConversation
    } = useInboxStore();
    const { setChatUser, setSubscriptionModalOpen } = useUiStore();
    const { setSelectedUser } = useMapStore();
    const { user: currentUser } = useAuthStore();
    const [confirmDelete, setConfirmDelete] = useState<ConversationPreview | null>(null);

    useEffect(() => {
        switch (activeTab) {
            case 'messages': fetchConversations(); break;
            case 'winks': 
                if (currentUser?.subscription_tier !== 'plus') {
                    // Pre-fetch a small number for the blurred grid for free users
                    fetchWinks(); 
                } else {
                    toast('Benefício Plus: Veja quem te chamou!', { icon: '✨', duration: 4000 });
                    fetchWinks();
                }
                break;
            case 'requests': fetchAccessRequests(); break;
            case 'views':
                 if (currentUser?.subscription_tier !== 'plus') {
                    // Pre-fetch a small number for the blurred grid for free users
                    fetchProfileViews();
                } else {
                    toast('Benefício Plus: Veja quem visitou seu perfil!', { icon: '✨', duration: 4000 });
                    fetchProfileViews();
                }
                break;
        }
    }, [activeTab, fetchConversations, fetchWinks, fetchAccessRequests, fetchProfileViews, currentUser]);
    
    const handleConversationClick = (convo: ConversationPreview) => {
        const chatPartner: User = {
            id: convo.other_participant_id, username: convo.other_participant_username,
            avatar_url: convo.other_participant_avatar_url, last_seen: convo.other_participant_last_seen,
            display_name: null, public_photos: [], status_text: null, date_of_birth: null,
            height_cm: null, weight_kg: null, tribes: [], position: null, hiv_status: null,
            updated_at: '', lat: 0, lng: 0, age: 0, distance_km: null, 
            subscription_tier: convo.other_participant_subscription_tier,
            subscription_expires_at: null, is_incognito: false,
        };
        setChatUser(chatPartner);
    };

    const handlePremiumUserClick = (user: WinkWithProfile | ProfileViewWithProfile) => {
        if (currentUser?.subscription_tier !== 'plus') {
            setSubscriptionModalOpen(true);
            return;
        }
        setSelectedUser(user);
    }
    
    const handleDeleteConfirm = () => {
        if (confirmDelete) {
            deleteConversation(confirmDelete.conversation_id);
            setConfirmDelete(null);
        }
    };
    
    const TabButton = ({ label, tabName, isPremium = false }: { label: string, tabName: ActiveTab, isPremium?: boolean }) => (
         <button 
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-1.5 py-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === tabName ? 'text-pink-500 border-pink-500' : 'text-slate-400 border-transparent hover:text-white'}`}
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
                <div className="mt-4 flex space-x-6 border-b border-slate-700">
                    <TabButton label="Mensagens" tabName="messages" />
                    <TabButton label="Te Chamaram" tabName="winks" isPremium />
                    <TabButton label="Quem Me Viu" tabName="views" isPremium />
                    <TabButton label="Solicitações" tabName="requests" />
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
                        onUpgradeClick={() => setSubscriptionModalOpen(true)}
                    />
                )}
                 {activeTab === 'views' && (
                    <ProfileViewList 
                        views={profileViews}
                        loading={loadingProfileViews}
                        isPlus={currentUser?.subscription_tier === 'plus'}
                        onViewClick={handlePremiumUserClick}
                        onUpgradeClick={() => setSubscriptionModalOpen(true)}
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
        </>
    );
};

// ... Sub-componentes ...

interface ConversationListProps {
    conversations: ConversationPreview[]; loading: boolean;
    onConversationClick: (convo: ConversationPreview) => void;
    onDeleteClick: (convo: ConversationPreview) => void;
    currentUserId?: string;
}
const ConversationList: React.FC<ConversationListProps> = ({ conversations, loading, onConversationClick, onDeleteClick, currentUserId }) => {
    const onlineUsers = useMapStore((state) => state.onlineUsers);

    if (loading) return <p className="text-center p-8 text-slate-400">Carregando conversas...</p>;
    if (conversations.length === 0) return <p className="text-center p-8 text-slate-400">Nenhuma conversa iniciada.</p>;
    
    return (
        <div className="divide-y divide-slate-800">
            {conversations.map(convo => {
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
                                    {/* FIX: Cast options to 'any' to bypass a TypeScript type definition issue where 'locale' is not recognized. */}
                                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: true, locale: ptBR } as any)}</span>
                                </div>
                                <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-white' : 'text-slate-400'}`}>
                                    {convo.last_message_sender_id === currentUserId && "Você: "}
                                    {convo.last_message_content}
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
    if (loading) return <p className="text-center p-8 text-slate-400">Carregando chamados...</p>;
    if (!isPlus && winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    if (!isPlus) {
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
                    <p className="text-slate-300 my-2">Assine o Ponto G Plus para desbloquear esta e outras funcionalidades.</p>
                    <button onClick={onUpgradeClick} className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-2 px-6 rounded-lg">
                        Fazer Upgrade
                    </button>
                </div>
            </div>
        );
    }
    
    if (winks.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém te chamou ainda.</p>;

    return (
        <div className="p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {winks.map(wink => (
                <div key={wink.id} onClick={() => onWinkClick(wink)} className="relative aspect-square cursor-pointer group">
                     <img src={wink.avatar_url} alt={wink.username} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-sm truncate">{wink.username}</h3>
                        {/* FIX: Cast options to 'any' to bypass a TypeScript type definition issue where 'locale' is not recognized. */}
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
    if (loading) return <p className="text-center p-8 text-slate-400">Carregando visitantes...</p>;
    if (!isPlus && views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    if (!isPlus) {
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
                    <p className="text-slate-300 my-2">Veja todos que visitaram seu perfil com o Ponto G Plus.</p>
                    <button onClick={onUpgradeClick} className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-2 px-6 rounded-lg">
                        Fazer Upgrade
                    </button>
                </div>
            </div>
        );
    }
    
    if (views.length === 0) return <p className="text-center p-8 text-slate-400">Ninguém visitou seu perfil ainda.</p>;

    return (
        <div className="p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {views.map(view => (
                <div key={view.id} onClick={() => onViewClick(view)} className="relative aspect-square cursor-pointer group">
                     <img src={view.avatar_url} alt={view.username} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-sm truncate">{view.username}</h3>
                         {/* FIX: Cast options to 'any' to bypass a TypeScript type definition issue where 'locale' is not recognized. */}
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
                        {/* FIX: Cast options to 'any' to bypass a TypeScript type definition issue where 'locale' is not recognized. */}
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