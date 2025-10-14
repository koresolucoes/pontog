import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useUiStore } from '../stores/uiStore';
import { supabase } from '../lib/supabase';

const plans = [
    { id: 'monthly', name: '1 Mês', price: 29.90, perMonth: 29.90, popular: false, discount: null },
    { id: 'quarterly', name: '3 Meses', price: 79.90, perMonth: 26.63, popular: true, discount: '11% OFF' },
    { id: 'yearly', name: '12 Meses', price: 239.90, perMonth: 19.99, popular: false, discount: '33% OFF' },
];

const features = [
    { icon: "favorite", text: "Chamados (Winks) ilimitados", color: "text-pink-400" },
    { icon: "visibility", text: "Veja quem te chamou", color: "text-yellow-400" },
    { icon: "filter_alt", text: "Filtros de busca avançados", color: "text-blue-400" },
    { icon: "more_horiz", text: "E muito mais em breve!", color: "text-green-400" },
];

export const SubscriptionModal: React.FC = () => {
    const { setSubscriptionModalOpen } = useUiStore();
    const [selectedPlanId, setSelectedPlanId] = useState('quarterly');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão não encontrada. Por favor, faça login novamente.");

            const res = await fetch('/api/create-mercadopago-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ planId: selectedPlanId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Falha ao iniciar o pagamento.');
            }

            const { init_point } = await res.json();
            window.location.href = init_point;

        } catch (error: any) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };
    
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
                     <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-4xl text-white mx-auto shadow-lg">G+</div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mt-4">Ponto G Plus</h2>
                    <p className="text-gray-400 mt-2">Desbloqueie o melhor do Ponto G.</p>
                     <button onClick={() => setSubscriptionModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-3">
                    {plans.map(plan => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 hover:border-gray-600'}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlanId === plan.id ? 'border-pink-500' : 'border-gray-500'}`}>
                                        {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{plan.name}</p>
                                        <p className="text-sm text-gray-400">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.perMonth)}/mês
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}</p>
                                    {plan.discount && <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-md">{plan.discount}</span>}
                                </div>
                            </div>
                            {plan.popular && <div className="text-center text-xs font-bold text-pink-400 pt-2">MAIS POPULAR</div>}
                        </div>
                    ))}
                </div>
                
                <div className="p-6 space-y-4 border-t border-gray-700">
                    <h3 className="text-sm font-bold text-gray-300 text-center">O que está incluso:</h3>
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className={`material-symbols-outlined ${feature.color}`}>{feature.icon}</span>
                            </div>
                            <span className="font-semibold text-sm text-white">{feature.text}</span>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-700">
                     <button 
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? 'Aguarde...' : 'Assinar Agora'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">Pagamento seguro via Mercado Pago. A cobrança não é recorrente.</p>
                </div>
            </div>
        </div>
    );
};