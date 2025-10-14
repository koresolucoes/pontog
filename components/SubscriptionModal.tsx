// components/SubscriptionModal.tsx
import React from 'react';
import { useUiStore } from '../stores/uiStore';
import { XIcon, HeartIcon, SparklesIcon, SearchIcon, CheckIcon } from './icons';

export const SubscriptionModal: React.FC = () => {
    const { setSubscriptionModalOpen } = useUiStore();

    const features = [
        { icon: <HeartIcon className="w-6 h-6 text-pink-400" />, text: "Chamados (Winks) ilimitados" },
        { icon: <SparklesIcon className="w-6 h-6 text-yellow-400" />, text: "Veja quem te chamou" },
        { icon: <SearchIcon className="w-6 h-6 text-blue-400" />, text: "Filtros de busca avançados" },
        { icon: <CheckIcon className="w-6 h-6 text-green-400" />, text: "E muito mais em breve!" },
    ];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-4" 
            onClick={() => setSubscriptionModalOpen(false)}
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-auto animate-fade-in-up flex flex-col border border-pink-500/30" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center border-b border-gray-700 relative">
                     <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-4xl text-white mx-auto shadow-lg">
                        G+
                    </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mt-4">
                        Ponto G Plus
                    </h2>
                    <p className="text-gray-400 mt-2">Desbloqueie o melhor do Ponto G.</p>
                     <button 
                        onClick={() => setSubscriptionModalOpen(false)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <span className="font-semibold text-white">{feature.text}</span>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-700">
                     <button 
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Assine Agora
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        A cobrança será recorrente. Cancele a qualquer momento.
                    </p>
                </div>
            </div>
        </div>
    );
};