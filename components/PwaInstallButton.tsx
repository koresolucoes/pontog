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
      className="fixed bottom-24 right-4 z-30 flex items-center justify-center w-14 h-14 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-transform hover:scale-105 active:scale-95 animate-fade-in-up"
      aria-label="Instalar aplicativo na tela de início"
    >
      <span className="material-symbols-outlined text-3xl">install_mobile</span>
    </button>
  );
};