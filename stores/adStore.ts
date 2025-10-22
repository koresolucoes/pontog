// stores/adStore.ts
import { create } from 'zustand';
import { Ad, TemporaryPerk } from '../types';
import { add } from 'date-fns';
import toast from 'react-hot-toast';

// Adicione esta declaração para que o TypeScript reconheça a variável global googletag
declare global {
  interface Window {
    googletag: any;
  }
}

// Substitua pelo seu código de rede do Ad Manager
const AD_MANAGER_NETWORK_CODE = 'SEU_CODIGO_DE_REDE_AQUI'; 

const AD_UNITS = {
    feed: `/_CODE_/_PontoG_Feed_Nativo`,
    banner: `/CODE_/_PontoG_Grade_Banner`,
    inbox: `/CODE_/_PontoG_Inbox_Nativo`,
    rewarded: `/CODE_/_PontoG_Video_Recompensado`
};

Object.keys(AD_UNITS).forEach(key => {
    AD_UNITS[key as keyof typeof AD_UNITS] = AD_UNITS[key as keyof typeof AD_UNITS].replace('_CODE_', AD_MANAGER_NETWORK_CODE);
});

interface AdState {
  feedAds: Ad[];
  bannerAdUnitPath: string; // O banner será renderizado diretamente, então só precisamos do path
  inboxAd: Ad | null;
  temporaryPerks: TemporaryPerk[];
  isInitialized: boolean;
  initializeAds: () => void;
  grantTemporaryPerk: (perk: TemporaryPerk['perk'], durationHours: number) => void;
  hasPerk: (perk: TemporaryPerk['perk']) => boolean;
}

export const useAdStore = create<AdState>((set, get) => ({
    feedAds: [],
    bannerAdUnitPath: AD_UNITS.banner,
    inboxAd: null,
    temporaryPerks: [],
    isInitialized: false,

    initializeAds: () => {
        if (get().isInitialized || !AD_MANAGER_NETWORK_CODE || AD_MANAGER_NETWORK_CODE === 'SEU_CODIGO_DE_REDE_AQUI') {
             console.warn("Ad Manager não inicializado. Verifique o código de rede.");
            return;
        }
        
        console.log("Inicializando Google Ad Manager...");

        window.googletag = window.googletag || { cmd: [] };
        const googletag = window.googletag;

        googletag.cmd.push(() => {
            // Desativa o carregamento inicial para que possamos controlar quando os anúncios são requisitados
            googletag.pubads().disableInitialLoad();
            
            // Define os blocos de anúncios nativos que precisam de processamento de dados
            googletag.defineSlot(AD_UNITS.feed, ['fluid'], `div-gpt-ad-feed-placeholder`)?.addService(googletag.pubads());
            googletag.defineSlot(AD_UNITS.inbox, ['fluid'], `div-gpt-ad-inbox-placeholder`)?.addService(googletag.pubads());
            
            // O banner e o recompensado serão definidos e exibidos pelos seus próprios componentes

            // Listener para capturar os dados dos anúncios nativos quando eles são renderizados
            googletag.pubads().addEventListener('slotRenderEnded', (event: any) => {
                const slot = event.slot;
                
                // Verifica se o anúncio é do tipo nativo e não está vazio
                if (!event.isEmpty && event.creativeTemplateId) {
                     const nativeAd = event.nativeAd;
                     if (!nativeAd) return;

                     // Mapeia os campos do Ad Manager para o nosso tipo 'Ad'
                     const adData: Ad = {
                         id: new Date().getTime(), // ID único para a chave React
                         title: nativeAd.get('Headline'),
                         description: nativeAd.get('Body'),
                         image_url: nativeAd.get('Image')?.url || '',
                         cta_text: nativeAd.get('CallToAction'),
                         cta_url: nativeAd.getClickUrl(),
                         ad_type: 'feed', // Default
                     };

                     const slotPath = slot.getAdUnitPath();
                     if (slotPath === AD_UNITS.feed) {
                         adData.ad_type = 'feed';
                         set(state => ({ feedAds: [...state.feedAds, adData] }));
                     } else if (slotPath === AD_UNITS.inbox) {
                         adData.ad_type = 'inbox';
                         set({ inboxAd: adData });
                     }
                }
            });

            // Habilita os serviços de anúncios
            googletag.enableServices();
        });

        set({ isInitialized: true });
    },

    grantTemporaryPerk: (perk, durationHours) => {
        const expires_at = add(new Date(), { hours: durationHours }).toISOString();
        const newPerk: TemporaryPerk = { perk, expires_at };
        
        set(state => {
            const otherPerks = state.temporaryPerks.filter(p => p.perk !== perk);
            return { temporaryPerks: [...otherPerks, newPerk] };
        });
        
        toast.success(`Benefício desbloqueado por ${durationHours} hora(s)!`);
    },

    hasPerk: (perk) => {
        const existingPerk = get().temporaryPerks.find(p => p.perk === perk);
        if (existingPerk) {
            if (new Date(existingPerk.expires_at) > new Date()) {
                return true;
            } else {
                set(state => ({
                    temporaryPerks: state.temporaryPerks.filter(p => p.perk !== perk)
                }));
                return false;
            }
        }
        return false;
    }
}));
