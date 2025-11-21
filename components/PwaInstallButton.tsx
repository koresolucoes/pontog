import React from 'react';
import { usePwaStore } from '../stores/pwaStore';

export const PwaInstallButton: React.FC = () => {
  const { installPromptEvent, triggerInstall } = usePwaStore();

  if (!installPromptEvent) {
    return null;
  }

  return (
    <button
      onClick={triggerInstall}
      className="fixed bottom-24 right-4 z-30 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-full shadow-lg shadow-pink-900/30 hover:scale-110 active:scale-95 transition-all animate-fade-in-up group"
      aria-label="Instalar aplicativo"
    >
      <span className="material-symbols-rounded text-2xl group-hover:animate-bounce">install_mobile</span>
      <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900"></span>
    </button>
  );
};