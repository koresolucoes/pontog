import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUiStore } from '../stores/uiStore';
import { supabase } from '../lib/supabase';
import { usePlanStore } from '../stores/planStore';

const features = [
    { icon: "all_inclusive", text: "Chamados (Winks) ilimitados", subtext: "Chame quantos caras quiser", color: "text-pink-400", bg: "bg-pink-500/10" },
    { icon: "visibility", text: "Veja quem te visitou", subtext: "Saiba quem está de olho em você", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: "favorite", text: "Veja quem te curtiu", subtext: "Descubra seus admiradores secretos", color: "text-red-400", bg: "bg-red-500/10" },
    { icon: "done_all", text: "Confirmação de leitura", subtext: "Saiba exatamente quando leram", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: "security", text: "Modo Invisível", subtext: "Navegue sem deixar rastros", color: "text-green-400", bg: "bg-green-500/10" },
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
            if (popularPlan) setSelectedPlanId(popularPlan.id);
        }
    }, [plans, selectedPlanId]);


    const handleSubscribe = async () => {
        if (!selectedPlanId) {
            toast.error("Por favor, selecione um plano.");
            return;
        }
        setIsLoading(true);
        try {
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
            className="fixed inset-0 bg-dark-900/90 backdrop-blur-md flex items-end sm:items-center justify-center z-[80] animate-fade-in p-0 sm:p-4" 
            onClick={() => setSubscriptionModalOpen(false)}
        >
            <div 
                className="bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto animate-slide-in-up flex flex-col border border-white/10 h-[90vh] sm:h-auto sm:max-h-[90vh] relative overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-pink-900/20 to-transparent pointer-events-none"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <header className="p-6 pt-8 text-center relative flex-shrink-0 z-10">
                     <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white mx-auto shadow-2xl shadow-pink-500/30 mb-4 rotate-3">G+</div>
                    <h2 className="text-3xl font-black text-white font-outfit tracking-tight">Ponto G <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Plus</span></h2>
                    <p className="text-slate-400 mt-2 text-sm font-medium">Experiência sem limites. Conexões mais rápidas.</p>
                     <button onClick={() => setSubscriptionModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-sm">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 relative z-10">
                    {/* Plans Grid */}
                    <div className="grid gap-3">
                        {loadingPlans ? (
                            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            plans.map(plan => {
                                const isSelected = selectedPlanId === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                                            isSelected 
                                            ? 'bg-pink-500/10 border-pink-500 shadow-lg shadow-pink-900/20 scale-[1.02]' 
                                            : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                        }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md tracking-wide z-10">
                                                MAIS POPULAR
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col justify-center">
                                                <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-300'}`}>{plan.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Acesso total por {plan.months_duration} {plan.months_duration > 1 ? 'meses' : 'mês'}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end justify-center">
                                                {plan.discount && (
                                                    <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">
                                                        {plan.discount}
                                                    </div>
                                                )}
                                                <p className="text-2xl font-black text-white font-outfit leading-none">
                                                    <span className="text-sm font-normal text-slate-400 mr-0.5">R$</span>
                                                    {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                    {plan.months_duration > 1 ? `R$ ${plan.perMonth.toFixed(2)}/mês` : 'Pagamento único'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Radio Indicator */}
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 -ml-8 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                            <span className="material-symbols-rounded filled text-pink-500">check_circle</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                
                    {/* Features List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Benefícios Exclusivos</h3>
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${feature.bg}`}>
                                    <span className={`material-symbols-rounded text-xl ${feature.color}`}>{feature.icon}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">{feature.text}</p>
                                    <p className="text-xs text-slate-400">{feature.subtext}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="p-6 border-t border-white/10 flex-shrink-0 bg-slate-900 relative z-20">
                     <button 
                        onClick={handleSubscribe}
                        disabled={isLoading || loadingPlans || !selectedPlanId}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-pink-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait disabled:active:scale-100 flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded filled group-hover:animate-pulse">auto_awesome</span>
                                Assinar Agora
                            </>
                        )}
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder icons for payment methods to build trust */}
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-rounded text-sm">lock</span> Pagamento Seguro via Mercado Pago
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
};