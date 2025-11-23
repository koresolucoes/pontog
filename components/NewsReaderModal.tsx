
import React from 'react';
import { NewsArticle } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { AnimatedBackground } from './AnimatedBackground';

interface NewsReaderModalProps {
    article: NewsArticle;
    onClose: () => void;
}

export const NewsReaderModal: React.FC<NewsReaderModalProps> = ({ article, onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] animate-fade-in flex justify-center overflow-y-auto">
            {/* Fundo Animado Fixo - Não rola com o texto */}
            <AnimatedBackground className="z-0" />
            
            {/* Backdrop escuro semi-transparente para focar no conteúdo */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0" onClick={onClose}></div>

            <div className="w-full max-w-2xl min-h-screen bg-slate-900/85 backdrop-blur-xl shadow-2xl relative z-10 border-x border-white/10">
                
                {/* Hero Image */}
                <div className="relative h-72 md:h-96 w-full">
                    <img 
                        src={article.image_url} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-colors border border-white/10 z-20"
                    >
                        <span className="material-symbols-rounded text-2xl">arrow_back</span>
                    </button>
                </div>

                <div className="px-6 md:px-10 -mt-20 relative z-10 pb-20">
                    {/* Tags & Meta */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                            {article.type === 'blog' ? 'Blog Ponto G' : 'Notícia'}
                        </span>
                        {article.tags.map(tag => (
                            <span key={tag} className="bg-slate-800/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white font-outfit leading-tight mb-4 drop-shadow-lg">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                                {article.source.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{article.author || article.source}</p>
                                <p className="text-xs text-slate-400 capitalize">
                                    {format(new Date(article.published_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-pink-500 transition-colors">
                            <span className="material-symbols-rounded">share</span>
                        </button>
                    </div>

                    {/* Content Body */}
                    <div 
                        className="prose prose-invert prose-lg max-w-none prose-headings:font-outfit prose-headings:text-white prose-p:text-slate-300 prose-a:text-pink-400 prose-strong:text-white prose-li:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    
                    {/* Footer CTA */}
                    <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-white/5 text-center">
                        <p className="text-sm text-slate-400 mb-4">Gostou do conteúdo? Compartilhe com seus amigos!</p>
                        <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                            Voltar para o Feed
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
