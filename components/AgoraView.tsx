import React, { useState } from 'react';
import { useAgoraStore } from '../stores/agoraStore';
import { useAuthStore } from '../stores/authStore';
import { AgoraPost } from '../types';
import { FlameIcon, HeartIcon, HeartIconFilled, MessageCircleIcon } from './icons';
import { ActivateAgoraModal } from './ActivateAgoraModal';
import { AgoraPostDetailModal } from './AgoraPostDetailModal';

export const AgoraView: React.FC = () => {
    const { posts, isLoading, agoraUserIds, deactivateAgoraMode, toggleLikePost } = useAgoraStore();
    const { user } = useAuthStore();
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<AgoraPost | null>(null);

    const userIsAgora = user ? agoraUserIds.includes(user.id) : false;

    const handleDeactivate = async () => {
        if (window.confirm("Tem certeza que deseja desativar o modo Agora? Seu post será removido.")) {
            await deactivateAgoraMode();
        }
    };

    const renderHeader = () => (
        <div className="p-4 bg-gray-900 border-b border-gray-700">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <FlameIcon className="w-6 h-6 text-red-500"/>
                    <span>Agora</span>
                </h1>
                {userIsAgora ? (
                    <button onClick={handleDeactivate} className="bg-gray-700 text-sm text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                        Desativar
                    </button>
                ) : (
                    <button onClick={() => setIsActivateModalOpen(true)} className="bg-red-600 text-sm text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                        Ativar Modo Agora
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-400 mt-2">
                Publique uma foto e apareça aqui por 1 hora para encontrar alguém pra agora.
            </p>
        </div>
    );
    
    if (isLoading && posts.length === 0) {
        return (
            <div className="h-full flex flex-col">
                {renderHeader()}
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    Carregando...
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <>
                <div className="h-full flex flex-col">
                    {renderHeader()}
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
                        <h2 className="text-xl font-bold">Ninguém no modo Agora.</h2>
                        <p className="mt-2">Seja o primeiro a ativar e se destacar!</p>
                    </div>
                </div>
                {isActivateModalOpen && <ActivateAgoraModal onClose={() => setIsActivateModalOpen(false)} />}
            </>
        );
    }
    
    return (
        <>
            <div className="h-full flex flex-col bg-gray-800">
                {renderHeader()}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 flex items-center space-x-3">
                                <img src={post.avatar_url} alt={post.username} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-bold text-white">{post.username}, {post.age}</h3>
                                    <p className="text-sm text-gray-400">buscando agora</p>
                                </div>
                            </div>
                            <img 
                                src={post.photo_url} 
                                alt={`Post de ${post.username}`} 
                                className="w-full h-auto max-h-[70vh] object-contain cursor-pointer"
                                onClick={() => setSelectedPost(post)}
                            />
                            {post.status_text && (
                                <p className="p-4 text-gray-300 italic">"{post.status_text}"</p>
                            )}
                            <div className="p-4 flex items-center justify-between text-gray-400 border-t border-gray-700">
                                <button onClick={() => toggleLikePost(post.id)} className="flex items-center gap-2 hover:text-white transition-colors">
                                    {post.user_has_liked ? (
                                        <HeartIconFilled className="w-6 h-6 text-pink-500" />
                                    ) : (
                                        <HeartIcon className="w-6 h-6" />
                                    )}
                                    <span className="text-sm font-semibold">{post.likes_count}</span>
                                </button>
                                <button onClick={() => setSelectedPost(post)} className="flex items-center gap-2 hover:text-white transition-colors">
                                    <MessageCircleIcon className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{post.comments_count}</span>
                                </button>
                                <button className="bg-pink-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-pink-700 text-sm">
                                    Chamar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isActivateModalOpen && <ActivateAgoraModal onClose={() => setIsActivateModalOpen(false)} />}
            {selectedPost && <AgoraPostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
        </>
    );
};
