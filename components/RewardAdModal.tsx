import React, { useState, useEffect } from 'react';

interface RewardAdModalProps {
  onClose: () => void;
  onReward: () => void;
}

export const RewardAdModal: React.FC<RewardAdModalProps> = ({ onClose, onReward }) => {
  const [countdown, setCountdown] = useState(30);
  const isFinished = countdown === 0;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleReward = () => {
    onReward();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] animate-fade-in p-4">
      <div className="relative w-full max-w-md aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-4">
        <p className="text-slate-400">Sua recompensa estará disponível em...</p>
        <p className="text-7xl font-bold my-4">
          {`00:${countdown.toString().padStart(2, '0')}`}
        </p>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleReward}
            disabled={!isFinished}
            className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinished ? 'Receber Recompensa' : 'Aguarde...'}
          </button>
        </div>
        
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-slate-400 bg-black/30 p-1.5 rounded-full hover:bg-black/50"
            disabled={!isFinished}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  );
};
