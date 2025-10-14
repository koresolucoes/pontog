import React, { useState, useEffect } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useUiStore } from '../stores/uiStore';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationPreview, User, WinkWithProfile, AlbumAccessRequest } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckIcon, XIcon, TrashIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

type ActiveTab = 'messages' | 'winks' | 'requests';

interface InboxProps {
    initialTab?: ActiveTab;
}

export const Inbox: React.FC<InboxProps> = ({ initialTab = 'messages' }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const { 
        conversations, winks, accessRequests,
        loadingConversations, loadingWinks, loadingRequests,
        fetchConversations, fetchWinks, fetchAccessRequests,
        respondToRequest, deleteConversation
    } = useInboxStore();
    const { setChatUser } = useUiStore();
    const { setSelectedUser } = useMapStore();
    const { profile } = useAuthStore();
    const [confirmDelete, setConfirmDelete] = useState<ConversationPreview | null>(null);

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
        const chatPartner: User = {
            id: convo.other_participant_id,
            username: convo.other_participant_username,
            avatar_url: convo.other_participant_avatar_url,
            last_seen: convo.other_participant_last_seen,
            display_name: null, public_photos: [], status_text: null, date_of_birth: null,
            height_cm: null, weight_kg: null, tribes: [], position: null, hiv_status: null,
            updated_at: '', lat: 0, lng: 0, age: 0 
        };
        setChatUser(chatPartner);
    };

    const handleWinkClick = (wink: WinkWithProfile) => {
        setSelectedUser(wink);
    }
    
    const handleDeleteConfirm = () => {
        if (confirmDelete) {
            deleteConversation(confirmDelete.conversation_id);
            setConfirmDelete(null);
        }
    };
    
    const TabButton = ({ label, tabName }: { label: string, tabName: ActiveTab }) => (
         <button 
            onClick={() => setActiveTab(tabName)}
            className={`py-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === tabName ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent hover:text-white'}`}
        >
            {label}
        </button>
    );

    return (
        <>
        <div className="flex flex-col h-full bg-gray-900 text-white">
            <header className="p-4">
                <h1 className="text-xl font-bold">Caixa de Entrada</h1>
                <div className="mt-4 flex space-x-6 border-b border-gray-700">
                    <TabButton label="Mensagens" tabName="messages" />
                    <TabButton label="Chamados" tabName="winks" />
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

interface ConversationListProps {
    conversations: ConversationPreview[];
    loading: boolean;
    onConversationClick: (convo: ConversationPreview) => void;
    onDeleteClick: (convo: ConversationPreview) => void;
    currentUserId?: string;
}
const ConversationList: React.FC<ConversationListProps> = ({ conversations, loading, onConversationClick, onDeleteClick, currentUserId }) => {
    const onlineUsers = useMapStore((state) => state.onlineUsers);

    if (loading) return <p className="text-center p-8 text-gray-400">Carregando conversas...</p>;
    if (conversations.length === 0) return <p className="text-center p-8 text-gray-400">Nenhuma conversa iniciada.</p>;
    
    return (
        <div className="divide-y divide-gray-800">
            {conversations.map(convo => {
                const isOnline = onlineUsers.includes(convo.other_participant_id);
                return (
                    <div key={convo.conversation_id} className="p-4 flex items-center space-x-3 group hover:bg-gray-800">
                        <div onClick={() => onConversationClick(convo)} className="flex-1 flex items-center space-x-3 cursor-pointer">
                            <div className="relative flex-shrink-0">
                                <img src={convo.other_participant_avatar_url} alt={convo.other_participant_username} className="w-12 h-12 rounded-full object-cover" />
                                {convo.unread_count > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-gray-900">
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
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: true, locale: ptBR })}</span>
                                </div>
                                <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-white' : 'text-gray-400'}`}>
                                    {convo.last_message_sender_id === currentUserId && "Você: "}
                                    {convo.last_message_content}
                                </p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(convo); }} className="p-2 text-gray-500 rounded-full hover:bg-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

interface WinkListProps {
    winks: WinkWithProfile[];
    loading: boolean;
    onWinkClick: (wink: WinkWithProfile) => void;
}
const WinkList: React.FC<WinkListProps> = ({ winks, loading, onWinkClick }) => {
    if (loading) return <p className="text-center p-8 text-gray-400">Carregando chamados...</p>;
    if (winks.length === 0) return <p className="text-center p-8 text-gray-400">Ninguém te chamou ainda.</p>;

    return (
        <div className="p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {winks.map(wink => (
                <div key={wink.id} onClick={() => onWinkClick(wink)} className="relative aspect-square cursor-pointer group">
                     <img src={wink.avatar_url} alt={wink.username} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-semibold text-sm truncate">{wink.username}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface RequestListProps {
    requests: AlbumAccessRequest[];
    loading: boolean;
    onRespond: (requestId: number, status: 'granted' | 'denied') => void;
}
const RequestList: React.FC<RequestListProps> = ({ requests, loading, onRespond }) => {
    if (loading) return <p className="text-center p-8 text-gray-400">Carregando solicitações...</p>;
    if (requests.length === 0) return <p className="text-center p-8 text-gray-400">Nenhuma solicitação pendente.</p>;

    return (
        <div className="divide-y divide-gray-800">
            {requests.map(req => (
                <div key={req.id} className="p-4 flex items-center space-x-4">
                    <img src={req.avatar_url} alt={req.username} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm">
                            <span className="font-bold">{req.username}</span> solicitou acesso aos seus álbuns.
                        </p>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onRespond(req.id, 'denied')} className="p-2.5 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600"><XIcon className="w-5 h-5"/></button>
                        <button onClick={() => onRespond(req.id, 'granted')} className="p-2.5 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600"><CheckIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};