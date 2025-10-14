import React, { useState, useEffect } from 'react';
import { useAgoraStore } from '../stores/agoraStore';
import { AgoraPost } from '../types';
import { FlameIcon, HeartIcon, MessageCircleIcon, HeartIconFilled } from './icons';
import { ActivateAgoraModal } from './ActivateAgoraModal';
import { AgoraPostDetailModal } from './AgoraPostDetailModal'; // Importa o novo modal
import { useMapStore } from '../stores/mapStore';

export const AgoraView: React.FC = () => {
    const { posts, isLoading, fetchAgoraPosts, toggleLikePost } = useAgoraStore();
    const { setSelectedUser } = useMapStore();
    const { users } = useMapStore();
    const [isActivateModalOpen, setActivateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<AgoraPost | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchAgoraPosts();
        }, 60000); // Recarrega a cada minuto para limpar posts expirados

        return () => clearInterval(interval);
    }, [fetchAgoraPosts]);
    
    const handleProfileClick = (post: AgoraPost) => {
        const userProfile = users.find(u => u.id === post.user_id);
        if(userProfile) {
            setSelectedUser(userProfile);
        }
    }

    return (
        <>
            <div className="h-full flex flex-col bg-gray-900">
                <header className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                         <h1 className="text-xl font-bold flex items-center gap-2">
                            <FlameIcon className="w-6 h-6 text-red-500" />
                            Agora
                        </h1>
                        <button 
                            onClick={() => setActivateModalOpen(true)}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                            Ativar Modo
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Fique visível aqui por 1 hora e mostre que você está pronto para a ação.</p>
                </header>

                {isLoading && posts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <FlameIcon className="w-16 h-16 text-gray-700 mb-4" />
                        <h2 className="text-xl font-bold text-gray-400">Ninguém no modo Agora.</h2>
                        <p className="text-gray-500 mt-2">Seja o primeiro a se destacar!</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-red-500/30 animate-fade-in">
                                <div className="p-4 flex items-center space-x-3 cursor-pointer" onClick={() => handleProfileClick(post)}>
                                    <img src={post.avatar_url} alt={post.username} className="w-10 h-10 rounded-full object-cover border-2 border-pink-500" />
                                    <div>
                                        <h3 className="font-bold text-white">{post.username}</h3>
                                        <p className="text-sm text-gray-400">{post.age} anos</p>
                                    </div>
                                </div>

                                <div className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                                    <img src={post.photo_url} alt={`Post de ${post.username}`} className="w-full h-auto max-h-[70vh] object-contain bg-black" />
                                </div>
                                
                                {post.status_text && (
                                    <p className="text-gray-300 italic px-4 pt-3">"{post.status_text}"</p>
                                )}

                                <div className="p-4 flex items-center justify-start gap-6">
                                    <button onClick={() => toggleLikePost(post.id)} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                        {post.user_has_liked ? <HeartIconFilled className="w-6 h-6 text-pink-500"/> : <HeartIcon className="w-6 h-6" />}
                                        <span className="font-semibold text-sm">{post.likes_count}</span>
                                    </button>
                                    <button onClick={() => setSelectedPost(post)} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                        <MessageCircleIcon className="w-6 h-6" />
                                        <span className="font-semibold text-sm">{post.comments_count}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isActivateModalOpen && (
                <ActivateAgoraModal onClose={() => setActivateModalOpen(false)} />
            )}
            
            {selectedPost && (
                <AgoraPostDetailModal 
                    post={selectedPost} 
                    onClose={() => setSelectedPost(null)} 
                />
            )}
        </>
    );
};