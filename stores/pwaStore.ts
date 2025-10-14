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
  checkPushSupport: () => Promise<void>;
  subscribeToPushNotifications: () => Promise<void>;
  unlinkSubscriptionOnLogout: () => Promise<void>;
  relinkSubscriptionOnLogin: () => Promise<void>;
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

  checkPushSupport: async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      set({ pushState: 'unsupported' });
      return;
    }

    if (Notification.permission === 'denied') {
        set({pushState: 'denied'});
        return;
    }

    if (Notification.permission === 'granted') {
      // Permissão concedida, mas precisamos verificar se uma inscrição realmente existe.
      // É possível que o usuário tenha limpado os dados do site, invalidando a inscrição anterior.
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Se já existe uma inscrição, o estado é 'granted'.
        set({ pushState: 'granted' });
      } else {
        // Se a permissão foi dada mas não há inscrição, o usuário precisa se inscrever de novo.
        set({ pushState: 'prompt' });
      }
    } else {
      // Se a permissão for 'default', mostramos o botão.
      set({ pushState: 'prompt' });
    }
  },

  subscribeToPushNotifications: async () => {
    const vapidPublicKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        console.error('VAPID public key not found.');
        toast.error('Configuração de notificação ausente.');
        return;
    }

    if (get().pushState === 'denied' || get().pushState === 'unsupported') {
        toast('As notificações estão bloqueadas ou não são suportadas neste navegador.');
        return;
    }

    set({ isSubscribing: true });

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permission not granted for Notifications');
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // FIX: Converte explicitamente o objeto PushSubscription para um objeto JSON puro.
        // Isso evita possíveis problemas de serialização ao enviá-lo para o backend.
        const subscriptionObject = subscription.toJSON();

        // Envia a inscrição para o backend
        const { session } = (await supabase.auth.getSession()).data;
        if (!session) throw new Error("User not authenticated");

        const response = await fetch('/api/store-push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ subscription_object: subscriptionObject }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to store push subscription on server.');
        }

        toast.success('Notificações ativadas com sucesso!');
        set({ pushState: 'granted' });

    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        
        if (Notification.permission === 'denied') {
            set({ pushState: 'denied' });
            toast.error('Você bloqueou as notificações. Altere nas configurações do navegador.');
        } else {
            toast.error('Não foi possível ativar as notificações.');
        }
    } finally {
        set({ isSubscribing: false });
    }
  },

  unlinkSubscriptionOnLogout: async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const subscriptionObject = subscription.toJSON();
        // Fire-and-forget request to the backend to set user_id to null
        fetch('/api/unlink-push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_object: subscriptionObject }),
        });
        console.log('Unlinking push subscription from backend.');
      }
    } catch (error) {
      console.error('Error during push subscription unlinking:', error);
    }
  },

  relinkSubscriptionOnLogin: async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      // If a subscription exists on the device, send it to the backend to link it to the new user.
      if (subscription) {
        console.log('Existing subscription found on device. Relinking with current user.');
        const subscriptionObject = subscription.toJSON();
        const { session } = (await supabase.auth.getSession()).data;
        if (!session) return; // Can't re-link if not logged in.

        const response = await fetch('/api/store-push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ subscription_object: subscriptionObject }),
        });

        if (response.ok) {
          console.log('Subscription successfully re-linked.');
          // Silently update state to 'granted' as we now have a valid server link.
          set({ pushState: 'granted' });
        } else {
          console.error('Failed to re-link subscription.');
        }
      }
    } catch (error) {
      console.error('Error during push subscription re-linking:', error);
    }
  },
}));
