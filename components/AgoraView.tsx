import React, { useState } from 'react';
import { useAgoraStore } from '../stores/agoraStore';
import { useAuthStore } from '../stores/authStore';
import { AgoraPost } from '../types';
import { ActivateAgoraModal } from './ActivateAgoraModal';
import { AgoraPostDetailModal } from './AgoraPostDetailModal';
import { ConfirmationModal } from './ConfirmationModal';

export const AgoraView: React.FC = () => {
    const { posts, isLoading, agoraUserIds, deactivateAgoraMode, toggleLikePost } = useAgoraStore();
    const { user } = useAuthStore();
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<AgoraPost | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const userIsAgora = user ? agoraUserIds.includes(user.id) : false;

    const handleDeactivateClick = () => setIsConfirmModalOpen(true);
    const handleConfirmDeactivate = async () => {
        await deactivateAgoraMode();
        setIsConfirmModalOpen(false);
    };

    const renderHeader = () => (
        <div className="p-4 bg-slate-900 border-b border-slate-700">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-red-500">local_fire_department</span>
                    <span>Agora</span>
                </h1>
                {userIsAgora ? (
                    <button onClick={handleDeactivateClick} className="bg-slate-700 text-sm text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                        Desativar
                    </button>
                ) : (
                    <button onClick={() => setIsActivateModalOpen(true)} className="bg-red-600 text-sm text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                        Ativar Modo Agora
                    </button>
                )}
            </div>
            <p className="text-sm text-slate-400 mt-2">
                Publique uma foto e apareça aqui por 1 hora para encontrar alguém pra agora.
            </p>
        </div>
    );
    
    if (isLoading && posts.length === 0) {
        return (
            <div className="h-full flex flex-col">
                {renderHeader()}
                <div className="flex-1 flex items-center justify-center text-slate-400">Carregando...</div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <>
                <div className="h-full flex flex-col">
                    {renderHeader()}
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
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
            <div className="h-full flex flex-col bg-slate-800">
                {renderHeader()}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 flex items-center space-x-3">
                                <img src={post.avatar_url} alt={post.username} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-bold text-white">{post.username}, {post.age}</h3>
                                    <p className="text-sm text-slate-400">buscando agora</p>
                                </div>
                            </div>
                            <img 
                                src={post.photo_url} 
                                alt={`Post de ${post.username}`} 
                                className="w-full h-auto max-h-[70vh] object-contain cursor-pointer"
                                onClick={() => setSelectedPost(post)}
                            />
                            {post.status_text && (
                                <p className="p-4 text-slate-300 italic">"{post.status_text}"</p>
                            )}
                            <div className="p-4 flex items-center justify-between text-slate-400 border-t border-slate-700">
                                <button onClick={() => toggleLikePost(post.id)} className="flex items-center gap-2 hover:text-white transition-colors">
                                    <span className={`material-symbols-outlined ${post.user_has_liked ? 'text-pink-500' : ''}`} style={post.user_has_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        favorite
                                    </span>
                                    <span className="text-sm font-semibold">{post.likes_count}</span>
                                </button>
                                <button onClick={() => setSelectedPost(post)} className="flex items-center gap-2 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">chat_bubble</span>
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
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    title="Desativar Modo Agora"
                    message="Tem certeza que deseja desativar o modo Agora? Seu post será removido permanentemente."
                    onConfirm={handleConfirmDeactivate}
                    onCancel={() => setIsConfirmModalOpen(false)}
                    confirmText="Desativar"
                />
            )}
        </>
    );
};