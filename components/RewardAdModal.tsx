import React, { useState, useEffect } from 'react';
import { AdSenseUnit } from './AdSenseUnit';

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
      <div className="relative w-full max-w-md aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-4 overflow-hidden">
        
        <div className="absolute inset-0">
          <AdSenseUnit
              client="ca-pub-9015745232467355"
              slot="4962199596" // Using banner slot as requested for interstitial
              format="auto"
              responsive={true}
              className="w-full h-full flex items-center justify-center"
          />
        </div>

        {/* Overlay with countdown */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
            <p className="text-slate-200">Sua recompensa estará disponível em...</p>
            <p className="text-7xl font-bold my-4" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
            {`00:${countdown.toString().padStart(2, '0')}`}
            </p>
        </div>


        <div className="absolute bottom-4 left-4 right-4 z-10">
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
            className="absolute top-2 right-2 text-slate-200 bg-black/40 p-1.5 rounded-full hover:bg-black/60 z-10"
            disabled={!isFinished}
            style={{ opacity: isFinished ? 1 : 0.5 }}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  );
};