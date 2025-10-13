import React, { useState, useEffect } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useUiStore } from '../stores/uiStore';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationPreview, User, WinkWithProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ActiveTab = 'messages' | 'winks';

export const Inbox: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
    const { conversations, winks, loadingConversations, loadingWinks, fetchConversations, fetchWinks } = useInboxStore();
    const { setChatUser } = useUiStore();
    const { setSelectedUser } = useMapStore();
    const { profile } = useAuthStore();

    useEffect(() => {
        if (activeTab === 'messages') {
            fetchConversations();
        } else {
            fetchWinks();
        }
    }, [activeTab, fetchConversations, fetchWinks]);
    
    const handleConversationClick = (convo: ConversationPreview) => {
        // Precisamos criar um objeto User parcial para o ChatWindow
        const chatPartner: User = {
            id: convo.other_participant_id,
            username: convo.other_participant_username,
            avatar_url: convo.other_participant_avatar_url,
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
                <div className="mt-4 flex border border-gray-700 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'messages' ? 'bg-pink-600' : 'hover:bg-gray-700'}`}
                    >
                        Mensagens
                    </button>
                    <button
                        onClick={() => setActiveTab('winks')}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'winks' ? 'bg-pink-600' : 'hover:bg-gray-700'}`}
                    >
                        Chamados
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
    if (loading) return <p className="text-center p-8 text-gray-400">Carregando conversas...</p>;
    if (conversations.length === 0) return <p className="text-center p-8 text-gray-400">Nenhuma conversa iniciada.</p>;
    
    return (
        <div className="divide-y divide-gray-700">
            {conversations.map(convo => (
                <div key={convo.conversation_id} onClick={() => onConversationClick(convo)} className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-700/50">
                    <img src={convo.other_participant_avatar_url} alt={convo.other_participant_username} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <h3 className="font-bold">{convo.other_participant_username}</h3>
                            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(convo.last_message_created_at), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                        <p className="text-sm text-gray-300 truncate">
                            {convo.last_message_sender_id === currentUserId && "Você: "}
                            {convo.last_message_content}
                        </p>
                    </div>
                </div>
            ))}
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