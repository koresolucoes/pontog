import React, { useEffect } from 'react';

interface AdBannerProps {
  adUnitPath: string;
  divId: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ adUnitPath, divId }) => {
  useEffect(() => {
    const googletag = window.googletag || { cmd: [] };
    
    googletag.cmd.push(() => {
        // Define o slot do banner, que é responsivo
        const slot = googletag.defineSlot(adUnitPath, ['fluid'], divId)?.addService(googletag.pubads());
        
        // Exibe o anúncio
        googletag.display(divId);

        // Atualiza o slot para preenchê-lo com um anúncio
        if (slot) {
            googletag.pubads().refresh([slot]);
        }
    });

    // Limpeza ao desmontar o componente
    return () => {
        googletag.cmd.push(() => {
            const slot = googletag.pubads().getSlots().find((s: any) => s.getSlotElementId() === divId);
            if (slot) {
                googletag.destroySlots([slot]);
            }
        });
    };
  }, [adUnitPath, divId]);

  return (
    <div className="col-span-full aspect-[2/1] sm:aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1] bg-slate-900 flex items-center justify-center">
        {/* Este é o contêiner onde o Google Ad Manager irá renderizar o banner */}
        <div id={divId}></div>
    </div>
  );
};
