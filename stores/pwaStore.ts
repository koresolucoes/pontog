import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Define o tipo do evento, pois ele ainda não é padrão na lib.dom.d.ts do TS
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Helper para converter a VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


interface PwaState {
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  triggerInstall: () => void;
  // Novas propriedades de estado para Push Notifications
  pushState: 'unsupported' | 'denied' | 'prompt' | 'granted';
  isSubscribing: boolean;
  checkPushSupport: () => void;
  subscribeToPushNotifications: () => Promise<void>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  installPromptEvent: null,
  pushState: 'prompt',
  isSubscribing: false,
  
  setInstallPromptEvent: (event) => set({ installPromptEvent: event }),

  triggerInstall: async () => {
    const { installPromptEvent } = get();
    if (!installPromptEvent) {
      console.log('O prompt de instalação do PWA não está disponível.');
      return;
    }
    
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`Resposta do usuário ao prompt de instalação: ${outcome}`);
    set({ installPromptEvent: null });
  },

  checkPushSupport: () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      set({ pushState: 'unsupported' });
      return;
    }
    set({ pushState: Notification.permission === 'granted' ? 'granted' : 'prompt' });
    if (Notification.permission === 'denied') {
        set({pushState: 'denied'});
    }
  },

  subscribeToPushNotifications: async () => {
    const vapidPublicKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        console.error('VAPID public key not found.');
        toast.error('Configuração de notificação ausente.');
        return;
    }

    if (get().pushState !== 'prompt') {
        // Fix: Changed toast.info to the default toast() function, as .info does not exist.
        toast('As notificações já estão ativadas ou bloqueadas.');
        return;
    }

    set({ isSubscribing: true });

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // Envia a inscrição para o backend
        const { session } = (await supabase.auth.getSession()).data;
        if (!session) throw new Error("User not authenticated");

        const response = await fetch('/api/store-push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ subscription_object: subscription }),
        });

        if (!response.ok) {
            throw new Error('Failed to store push subscription on server.');
        }

        toast.success('Notificações ativadas com sucesso!');
        set({ pushState: 'granted' });

    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        toast.error('Não foi possível ativar as notificações.');
        // Se o usuário negou a permissão
        if (Notification.permission === 'denied') {
            set({ pushState: 'denied' });
        }
    } finally {
        set({ isSubscribing: false });
    }
  },
}));