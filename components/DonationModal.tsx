// components/DonationModal.tsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useUiStore } from '../stores/uiStore';
import { supabase } from '../lib/supabase';

const presetAmounts = [5, 10, 25, 50];

export const DonationModal: React.FC = () => {
    const { setDonationModalOpen } = useUiStore();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAmountClick = (value: number) => {
        setAmount(value.toString());
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Permite apenas números e um ponto decimal
        const value = e.target.value;
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setAmount(value);
        }
    };

    const handleDonate = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 1) {
            toast.error("Por favor, insira um valor de pelo menos R$1,00.");
            return;
        }
        
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
            }

            const res = await fetch('/api/create-donation-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ amount: numericAmount, message }),
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
            className="fixed inset-0 bg-dark-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] animate-fade-in p-0 sm:p-4" 
            onClick={() => setDonationModalOpen(false)}
        >
            <div 
                className="bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm mx-auto animate-slide-in-up flex flex-col border border-white/10 h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden relative" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>

                <header className="p-6 text-center relative flex-shrink-0 z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-xl relative">
                        <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-pulse"></div>
                        <span className="material-symbols-rounded text-4xl text-pink-500 filled relative z-10">volunteer_activism</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-outfit">Apoie o Ponto G</h2>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-[250px] mx-auto">Ajude a manter os servidores online e o app livre de anúncios invasivos.</p>
                    <button onClick={() => setDonationModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 text-center tracking-wide">Escolha um valor</label>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {presetAmounts.map(val => (
                                <button 
                                    key={val} 
                                    onClick={() => handleAmountClick(val)} 
                                    className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                                        amount === val.toString() 
                                        ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30 scale-105' 
                                        : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    R${val}
                                </button>
                            ))}
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className={`font-bold text-lg transition-colors ${amount ? 'text-pink-500' : 'text-slate-500'}`}>R$</span>
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="Outro valor"
                                className="w-full bg-slate-800/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/10 text-lg font-bold transition-all text-left"
                            />
                        </div>
                    </div>
                    
                     <div>
                        <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                          Deixe um recado (opcional)
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          maxLength={300}
                          placeholder="O que você mais gosta no app?"
                          className="w-full bg-slate-800/50 rounded-2xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/10 transition-all resize-none text-sm font-medium"
                        />
                         <p className="text-right text-[10px] text-slate-500 mt-1 font-mono">{message.length}/300</p>
                      </div>
                </main>

                <footer className="p-6 border-t border-white/10 flex-shrink-0 bg-slate-900 relative z-20">
                     <button 
                        onClick={handleDonate}
                        disabled={isLoading || !amount}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-pink-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded filled">favorite</span>
                                Doar {amount ? `R$${amount}` : ''}
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                        <span className="material-symbols-rounded text-sm">lock</span>
                        Pagamento seguro processado pelo Mercado Pago.
                    </p>
                </footer>
            </div>
        </div>
    );
};