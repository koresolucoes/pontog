// stores/adStore.ts
import { create } from 'zustand';
import { Ad, TemporaryPerk } from '../types';
import { add } from 'date-fns';
import toast from 'react-hot-toast';

// Mock data, as we cannot create a new DB table
const MOCK_ADS: Ad[] = [
    {
        id: 1,
        ad_type: 'feed',
        title: 'Nova Balada Under',
        description: 'Música, gente e drinks. A noite perfeita te espera. Siga-nos!',
        image_url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=600',
        cta_text: 'Saiba Mais',
        cta_url: 'https://example.com',
    },
    {
        id: 2,
        ad_type: 'inbox',
        title: 'PrEP e Saúde em Dia',
        description: 'Cuide-se! Informações e suporte sobre saúde sexual. Discreto e seguro.',
        image_url: 'https://images.pexels.com/photos/4021779/pexels-photo-4021779.jpeg?auto=compress&cs=tinysrgb&w=600',
        cta_text: 'Ver Agora',
        cta_url: 'https://example.com',
    },
];

interface AdState {
  feedAd: Ad | null;
  inboxAd: Ad | null;
  temporaryPerks: TemporaryPerk[];
  fetchAds: () => void;
  grantTemporaryPerk: (perk: TemporaryPerk['perk'], durationHours: number) => void;
  hasPerk: (perk: TemporaryPerk['perk']) => boolean;
}

export const useAdStore = create<AdState>((set, get) => ({
    feedAd: null,
    inboxAd: null,
    temporaryPerks: [],
    fetchAds: () => {
        // In a real app, this would be a network request.
        // Here we just pull from the mock data.
        const feedAd = MOCK_ADS.find(ad => ad.ad_type === 'feed') || null;
        const inboxAd = MOCK_ADS.find(ad => ad.ad_type === 'inbox') || null;
        set({ feedAd, inboxAd });
    },

    grantTemporaryPerk: (perk, durationHours) => {
        const expires_at = add(new Date(), { hours: durationHours }).toISOString();
        const newPerk: TemporaryPerk = { perk, expires_at };
        
        set(state => {
            // Remove any existing perk of the same type and add the new one
            const otherPerks = state.temporaryPerks.filter(p => p.perk !== perk);
            return { temporaryPerks: [...otherPerks, newPerk] };
        });
        
        toast.success(`Benefício desbloqueado por ${durationHours} hora(s)!`);
    },

    hasPerk: (perk) => {
        const existingPerk = get().temporaryPerks.find(p => p.perk === perk);
        if (existingPerk) {
            // Check if it's expired
            if (new Date(existingPerk.expires_at) > new Date()) {
                return true;
            } else {
                // Clean up expired perk
                set(state => ({
                    temporaryPerks: state.temporaryPerks.filter(p => p.perk !== perk)
                }));
                return false;
            }
        }
        return false;
    }
}));
