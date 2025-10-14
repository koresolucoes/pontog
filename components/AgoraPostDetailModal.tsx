import React, { useState, useEffect, useRef } from 'react';
import { AgoraPost, AgoraComment } from '../types';
import { useAgoraStore } from '../stores/agoraStore';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';
// Fix: Correctly import the pt-BR locale from its specific module path.
import { ptBR } from 'date-fns/locale/pt-BR';

interface AgoraPostDetailModalProps {
  post: AgoraPost;
  onClose: () => void;
}

export const AgoraPostDetailModal: React.FC<AgoraPostDetailModalProps> = ({ post, onClose }) => {
  const { addComment, fetchCommentsForPost, toggleLikePost, toggleLikeComment } = useAgoraStore();
  const currentPost = useAgoraStore(state => state.posts.find(p => p.id === post.id)) || post;
  
  const currentUser = useAuthStore(state => state.user);
  const [comments, setComments] = useState<AgoraComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadComments = async () => {
      setIsLoadingComments(true);
      const fetchedComments = await fetchCommentsForPost(post.id);
      setComments(fetchedComments);
      setIsLoadingComments(false);
    };
    loadComments();
  }, [post.id, fetchCommentsForPost]);
  
  useEffect(() => {
    if (!isLoadingComments) {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isLoadingComments]);


  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '' || !currentUser) return;
    
    const tempContent = newComment.trim();
    setNewComment('');

    const tempComment: AgoraComment = {
        id: Date.now(), post_id: post.id, user_id: currentUser.id,
        content: tempContent, created_at: new Date().toISOString(),
        profiles: { username: currentUser.username, avatar_url: currentUser.avatar_url },
        likes_count: 0, user_has_liked: false,
    };
    setComments(prev => [...prev, tempComment]);

    await addComment(post.id, tempContent);
    const updatedComments = await fetchCommentsForPost(post.id);
    setComments(updatedComments);
  };

  const handleToggleCommentLike = async (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const hasLiked = comment.user_has_liked;
    setComments(prevComments =>
      prevComments.map(c =>
        c.id === commentId ? { ...c, user_has_liked: !hasLiked, likes_count: hasLiked ? c.likes_count - 1 : c.likes_count + 1 } : c
      )
    );
    await toggleLikeComment(commentId, hasLiked);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in pb-20 sm:pb-0" onClick={onClose}>
      <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-full sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img src={currentPost.avatar_url} alt={currentPost.username} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h2 className="font-bold text-white">{currentPost.username}</h2>
              <p className="text-sm text-slate-400">Post Agora</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
        </header>

        <div className="flex-shrink-0">
            <img src={currentPost.photo_url} alt={`Post de ${currentPost.username}`} className="w-full h-auto max-h-[40vh] object-contain bg-black" />
            {currentPost.status_text && <p className="p-4 text-slate-300 italic">"{currentPost.status_text}"</p>}
            
            <div className="p-4 flex items-center gap-4 border-b border-t border-slate-700">
                <button onClick={() => toggleLikePost(currentPost.id)} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                    <span className={`material-symbols-outlined ${currentPost.user_has_liked ? 'text-pink-500' : ''}`} style={currentPost.user_has_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        favorite
                    </span>
                    <span className="font-semibold text-sm">{currentPost.likes_count} likes</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="font-bold text-slate-300 flex-shrink-0">Comentários ({currentPost.comments_count})</h3>
             {isLoadingComments ? (
                <p className="text-slate-500 text-center">Carregando comentários...</p>
             ) : comments.length === 0 ? (
                <p className="text-slate-500 text-center text-sm py-4">Seja o primeiro a comentar!</p>
             ) : (
                comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3 group">
                        <img src={comment.profiles.avatar_url} alt={comment.profiles.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"/>
                        <div className="flex-1">
                            <div className="bg-slate-700 rounded-lg px-3 py-2">
                                <div className="flex items-baseline space-x-2">
                                    <span className="font-bold text-white text-sm">{comment.profiles.username}</span>
                                    <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}</span>
                                </div>
                                <p className="text-slate-300 text-sm break-words">{comment.content}</p>
                            </div>
                            <div className="px-2 py-1 flex items-center">
                                <button onClick={() => handleToggleCommentLike(comment.id)} className="flex items-center gap-1 text-slate-500 hover:text-pink-400 transition-colors">
                                    <span className={`material-symbols-outlined !text-[12px] ${comment.user_has_liked ? 'text-pink-500' : ''}`} style={comment.user_has_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        favorite
                                    </span>
                                    <span className={`text-xs font-semibold ${comment.user_has_liked ? 'text-pink-400' : ''}`}>{comment.likes_count > 0 ? comment.likes_count : 'Curtir'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
             )}
             <div ref={commentsEndRef} />
        </div>

        <form onSubmit={handleAddComment} className="p-2 border-t border-slate-700 bg-slate-800 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="w-full bg-slate-700 rounded-full py-2.5 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-600 text-white rounded-full p-2 hover:bg-pink-700 transition-colors">
                <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};