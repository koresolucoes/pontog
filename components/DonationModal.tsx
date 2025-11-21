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
            className="fixed inset-0 bg-dark-900/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-0 sm:p-4" 
            onClick={() => setDonationModalOpen(false)}
        >
            <div 
                className="bg-slate-800 sm:rounded-3xl shadow-2xl w-full max-w-sm mx-auto animate-slide-in-up flex flex-col border border-white/10 h-full sm:h-auto sm:max-h-[90vh] overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 text-center border-b border-white/5 relative flex-shrink-0 bg-slate-800/50">
                    <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
                        <span className="material-symbols-rounded text-4xl text-pink-500">volunteer_activism</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-outfit">Apoie o Ponto G</h2>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed">Sua contribuição ajuda a manter os servidores e o desenvolvimento!</p>
                    <button onClick={() => setDonationModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label htmlFor="amount" className="block text-xs font-bold text-slate-400 uppercase mb-3 text-center tracking-wide">Selecione um valor (BRL)</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {presetAmounts.map(val => (
                                <button key={val} onClick={() => handleAmountClick(val)} className={`py-3 rounded-xl font-bold transition-all border ${amount === val.toString() ? 'bg-pink-600 text-white border-pink-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-transparent hover:bg-slate-600'}`}>
                                    R${val}
                                </button>
                            ))}
                        </div>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold pointer-events-none group-focus-within:text-pink-500 transition-colors">R$</span>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="Outro valor"
                                className="w-full bg-slate-900 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-center font-bold text-lg transition-all"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                          Mensagem (opcional)
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          maxLength={300}
                          placeholder="Deixe uma sugestão ou recado..."
                          className="w-full bg-slate-900 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 transition-all resize-none"
                        />
                         <p className="text-right text-[10px] text-slate-500 mt-1 font-mono">{message.length}/300</p>
                      </div>
                </main>

                <footer className="p-6 border-t border-white/5 flex-shrink-0 bg-slate-800/30">
                     <button 
                        onClick={handleDonate}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-pink-900/20 transition-all disabled:opacity-50 disabled:cursor-wait active:scale-98 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded text-lg">payments</span>
                                Apoiar com Mercado Pago
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                        <span className="material-symbols-rounded text-sm">lock</span>
                        Pagamento seguro e criptografado.
                    </p>
                </footer>
            </div>
        </div>
    );
};