// components/ReportUserModal.tsx
import React, { useState } from 'react';
import { User } from '../types';
import { useUserActionsStore, reportReasons } from '../stores/userActionsStore';

interface ReportUserModalProps {
  user: User;
  onClose: () => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({ user, onClose }) => {
    const { reportUser } = useUserActionsStore();
    const [reason, setReason] = useState('');
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            alert('Por favor, selecione um motivo.');
            return;
        }
        setLoading(true);
        const success = await reportUser(user.id, reason, comments);
        setLoading(false);
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-white mb-2">Denunciar {user.username}</h2>
                <p className="text-sm text-slate-400 mb-4">Selecione o motivo da denúncia. Seu anonimato é garantido.</p>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        {reportReasons.map(r => (
                            <label key={r.key} className="flex items-center p-3 bg-slate-700 rounded-lg cursor-pointer">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r.key}
                                    checked={reason === r.key}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="h-4 w-4 text-pink-600 bg-slate-600 border-slate-500 focus:ring-pink-500"
                                />
                                <span className="ml-3 text-sm font-medium text-white">{r.label}</span>
                            </label>
                        ))}
                    </div>
                    {reason === 'other' && (
                        <div className="mt-4">
                            <label htmlFor="comments" className="block text-sm font-medium text-slate-300">
                                Comentários (opcional)
                            </label>
                            <textarea
                                id="comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={3}
                                className="mt-1 w-full bg-slate-700 rounded-lg p-2 text-white"
                                placeholder="Forneça mais detalhes aqui..."
                            />
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Denúncia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
