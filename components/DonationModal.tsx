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
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-4" 
            onClick={() => setDonationModalOpen(false)}
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-auto animate-fade-in-up flex flex-col border border-pink-500/30" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center border-b border-gray-700 relative">
                    <span className="material-symbols-outlined text-5xl text-pink-400">volunteer_activism</span>
                    <h2 className="text-2xl font-bold text-white mt-2">Apoie o Ponto G</h2>
                    <p className="text-gray-400 mt-2 text-sm">Sua contribuição ajuda a manter o app funcionando e a desenvolver novas funcionalidades!</p>
                    <button onClick={() => setDonationModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 text-center mb-2">Escolha ou digite um valor (BRL)</label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {presetAmounts.map(val => (
                                <button key={val} onClick={() => handleAmountClick(val)} className={`py-2 rounded-lg font-bold transition-colors ${amount === val.toString() ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                                    R${val}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">R$</span>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="Outro valor"
                                className="w-full bg-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 text-center font-bold"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                          Deixe uma mensagem ou sugestão (opcional)
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          maxLength={300}
                          placeholder="Sua mensagem aqui..."
                          className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                         <p className="text-right text-xs text-gray-500 mt-1">{message.length}/300</p>
                      </div>
                </div>

                <div className="p-6 border-t border-gray-700">
                     <button 
                        onClick={handleDonate}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoading ? 'Aguarde...' : 'Apoiar com Mercado Pago'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">Pagamento único e seguro.</p>
                </div>
            </div>
        </div>
    );
};