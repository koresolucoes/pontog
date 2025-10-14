import { create } from 'zustand';

// Define o tipo do evento, pois ele ainda não é padrão na lib.dom.d.ts do TS
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaState {
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  triggerInstall: () => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  installPromptEvent: null,
  setInstallPromptEvent: (event) => set({ installPromptEvent: event }),
  triggerInstall: async () => {
    const { installPromptEvent } = get();
    if (!installPromptEvent) {
      console.log('O prompt de instalação do PWA não está disponível.');
      return;
    }
    
    // Mostra o prompt de instalação
    installPromptEvent.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`Resposta do usuário ao prompt de instalação: ${outcome}`);
    
    // O prompt só pode ser usado uma vez. Limpa o evento.
    set({ installPromptEvent: null });
  },
}));
