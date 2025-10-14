import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUiStore } from '../stores/uiStore';
import { supabase } from '../lib/supabase';
import { usePlanStore } from '../stores/planStore';

const features = [
    { icon: "all_inclusive", text: "Chamados (Winks) ilimitados", color: "text-pink-400" },
    { icon: "visibility", text: "Veja quem te chamou e visitou seu perfil", color: "text-yellow-400" },
    { icon: "done_all", text: "Confirmação de leitura de mensagens", color: "text-blue-400" },
    { icon: "security", text: "Navegue com o Modo Invisível", color: "text-green-400" },
    { icon: "filter_alt", text: "Filtros de busca avançados (em breve)", color: "text-purple-400" },
];

export const SubscriptionModal: React.FC = () => {
    const { setSubscriptionModalOpen } = useUiStore();
    const { plans, loading: loadingPlans, fetchPlans } = usePlanStore();
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    useEffect(() => {
        if (plans.length > 0 && !selectedPlanId) {
            const popularPlan = plans.find(p => p.popular) || plans[1] || plans[0];
            setSelectedPlanId(popularPlan.id);
        }
    }, [plans, selectedPlanId]);


    const handleSubscribe = async () => {
        if (!selectedPlanId) {
            toast.error("Por favor, selecione um plano.");
            return;
        }
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("Sessão inválida. Por favor, faça login novamente.");
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
            }

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
            toast.error(error.message || "Ocorreu um erro. Verifique sua conexão e tente novamente.");
            setIsLoading(false);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-0 sm:p-4" 
            onClick={() => setSubscriptionModalOpen(false)}
        >
            <div 
                className="bg-slate-800 sm:rounded-2xl shadow-xl w-full max-w-sm mx-auto animate-slide-in-up flex flex-col border border-pink-500/30 h-full sm:h-auto sm:max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 text-center border-b border-slate-700 relative flex-shrink-0">
                     <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-4xl text-white mx-auto shadow-lg">G+</div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mt-4">Ponto G Plus</h2>
                    <p className="text-slate-400 mt-2">Desbloqueie o melhor do Ponto G.</p>
                     <button onClick={() => setSubscriptionModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="space-y-3">
                        {loadingPlans ? (
                            <div className="text-center text-slate-400">Carregando planos...</div>
                        ) : (
                            plans.map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlanId === plan.id ? 'border-pink-500' : 'border-slate-500'}`}>
                                                {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{plan.name}</p>
                                                <p className="text-sm text-slate-400">
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
                            ))
                        )}
                    </div>
                
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 text-center">O que está incluso:</h3>
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                    <span className={`material-symbols-outlined ${feature.color}`}>{feature.icon}</span>
                                </div>
                                <span className="font-semibold text-sm text-white">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="p-6 border-t border-slate-700 flex-shrink-0">
                     <button 
                        onClick={handleSubscribe}
                        disabled={isLoading || loadingPlans || !selectedPlanId}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? 'Aguarde...' : 'Assinar Agora'}
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-3">Pagamento seguro via Mercado Pago. A cobrança não é recorrente.</p>
                </footer>
            </div>
        </div>
    );
};