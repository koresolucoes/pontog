import React, { useState, useEffect } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useUiStore } from '../stores/uiStore';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationPreview, User, WinkWithProfile, AlbumAccessRequest } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckIcon, XIcon } from './icons';

type ActiveTab = 'messages' | 'winks' | 'requests';

export const Inbox: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
    const { 
        conversations, winks, accessRequests,
        loadingConversations, loadingWinks, loadingRequests,
        fetchConversations, fetchWinks, fetchAccessRequests,
        respondToRequest
    } = useInboxStore();
    const { setChatUser } = useUiStore();
    const { setSelectedUser } = useMapStore();
    const { profile } = useAuthStore();

    useEffect(() => {
        switch (activeTab) {
            case 'messages':
                fetchConversations();
                break;
            case 'winks':
                fetchWinks();
                break;
            case 'requests':
                fetchAccessRequests();
                break;
        }
    }, [activeTab, fetchConversations, fetchWinks, fetchAccessRequests]);
    
    const handleConversationClick = (convo: ConversationPreview) => {
        // Precisamos criar um objeto User parcial para o ChatWindow
        const chatPartner: User = {
            id: convo.other_participant_id,
            username: convo.other_participant_username,
            avatar_url: convo.other_participant_avatar_url,
            last_seen: convo.other_participant_last_seen,
            // Preenchemos com valores padrão pois não temos o perfil completo aqui
            display_name: null, public_photos: [], status_text: null, date_of_birth: null,
            height_cm: null, weight_kg: null, tribes: [], position: null, hiv_status: null,
            updated_at: '', lat: 0, lng: 0, age: 0 
        };
        setChatUser(chatPartner);
    };

    const handleWinkClick = (wink: WinkWithProfile) => {
        setSelectedUser(wink);
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-800 text-white">
            <header className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold">Caixa de Entrada</h1>
                <div className="mt-4 grid grid-cols-3 border border-gray-700 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'messages' ? 'bg-pink-600' : 'hover:bg-gray-700'}`}
                    >
                        Mensagens
                    </button>
                    <button
                        onClick={() => setActiveTab('winks')}
                        className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'winks' ? 'bg-pink-600' : 'hover:bg-gray-700'}`}
                    >
                        Chamados
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'requests' ? 'bg-pink-600' : 'hover:bg-gray-700'}`}
                    >
                        Solicitações
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'messages' && (
                    <ConversationList 
                        conversations={conversations} 
                        loading={loadingConversations}
                        onConversationClick={handleConversationClick}
                        currentUserId={profile?.id}
                    />
                )}
                {activeTab === 'winks' && (
                    <WinkList 
                        winks={winks}
                        loading={loadingWinks}
                        onWinkClick={handleWinkClick}
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
    );
};

// Sub-componente para a lista de conversas
interface ConversationListProps {
    conversations: ConversationPreview[];
    loading: boolean;
    onConversationClick: (convo: ConversationPreview) => void;
    currentUserId?: string;
}
const ConversationList: React.FC<ConversationListProps> = ({ conversations, loading, onConversationClick, currentUserId }) => {
    const onlineUsers = useMapStore((state) => state.onlineUsers);

    if (loading) return <p className="text-center p-8 text-gray-400">Carregando conversas...</p>;
    if (conversations.length === 0) return <p className="text-center p-8 text-gray-400">Nenhuma conversa iniciada.</p>;
    
    return (
        <div className="divide-y divide-gray-700">
            {conversations.map(convo => {
                const isOnline = onlineUsers.includes(convo.other_participant_id);
                return (
                    <div key={convo.conversation_id} onClick={() => onConversationClick(convo)} className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-700/50">
                        <div className="relative">
                            <img src={convo.other_participant_avatar_url} alt={convo.other_participant_username} className="w-14 h-14 rounded-full object-cover" />
                            {isOnline ? (
                                <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-gray-800" />
                            ) : (
                                <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-gray-500 ring-2 ring-gray-800" />
                            )}
                            {convo.unread_count > 0 && (
                                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-gray-800">
                                    {convo.unread_count > 9 ? '9+' : convo.unread_count}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold truncate">{convo.other_participant_username}</h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: true, locale: ptBR })}</span>
                            </div>
                            <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                {convo.last_message_sender_id === currentUserId && "Você: "}
                                {convo.last_message_content}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Sub-componente para a lista de Winks
interface WinkListProps {
    winks: WinkWithProfile[];
    loading: boolean;
    onWinkClick: (wink: WinkWithProfile) => void;
}
const WinkList: React.FC<WinkListProps> = ({ winks, loading, onWinkClick }) => {
    if (loading) return <p className="text-center p-8 text-gray-400">Carregando chamados...</p>;
    if (winks.length === 0) return <p className="text-center p-8 text-gray-400">Ninguém te chamou ainda.</p>;

    return (
        <div className="p-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {winks.map(wink => (
                <div key={wink.id} onClick={() => onWinkClick(wink)} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-lg">
                     <img src={wink.avatar_url} alt={wink.username} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-base truncate">{wink.username}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Sub-componente para a lista de Solicitações
interface RequestListProps {
    requests: AlbumAccessRequest[];
    loading: boolean;
    onRespond: (requestId: number, status: 'granted' | 'denied') => void;
}
const RequestList: React.FC<RequestListProps> = ({ requests, loading, onRespond }) => {
    if (loading) return <p className="text-center p-8 text-gray-400">Carregando solicitações...</p>;
    if (requests.length === 0) return <p className="text-center p-8 text-gray-400">Nenhuma solicitação pendente.</p>;

    return (
        <div className="divide-y divide-gray-700">
            {requests.map(req => (
                <div key={req.id} className="p-4 flex items-center space-x-4">
                    <img src={req.avatar_url} alt={req.username} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm">
                            <span className="font-bold">{req.username}</span> solicitou acesso aos seus álbuns privados.
                        </p>
                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onRespond(req.id, 'denied')} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40"><XIcon className="w-5 h-5"/></button>
                        <button onClick={() => onRespond(req.id, 'granted')} className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/40"><CheckIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};