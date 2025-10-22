import React from 'react';

interface UnlockFeatureModalProps {
  title: string;
  description: string;
  onClose: () => void;
  onUpgrade: () => void;
  onWatchAd: () => void;
}

export const UnlockFeatureModal: React.FC<UnlockFeatureModalProps> = ({ title, description, onClose, onUpgrade, onWatchAd }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center animate-fade-in-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-symbols-outlined text-5xl text-pink-400 mb-4">lock_open</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Fazer Upgrade para o Plus
          </button>
          <button
            onClick={onWatchAd}
            className="w-full bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Ver Anúncio (Acesso por 1h)
          </button>
        </div>
      </div>
    </div>
  );
};
