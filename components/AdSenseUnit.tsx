// components/AdSenseUnit.tsx
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

interface AdSenseUnitProps {
  client: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  client,
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' }
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isAdPushed, setIsAdPushed] = useState(false);

  useEffect(() => {
    const element = adRef.current;
    // Se o elemento não existe ou o anúncio já foi solicitado, não faz nada
    if (!element || isAdPushed) return;

    const loadAd = () => {
      try {
        // Check if element has width before pushing
        if (element.offsetWidth > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsAdPushed(true);
          return true;
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
      return false;
    };

    // Tenta carregar imediatamente (caso já esteja visível)
    if (loadAd()) return;

    // Se não tiver largura (ex: em uma aba oculta ou carregando), observa o redimensionamento
    const observer = new ResizeObserver(() => {
      // Assim que ganhar largura, carrega o anúncio e desconecta o observador
      if (element.offsetWidth > 0) {
        if (loadAd()) {
          observer.disconnect();
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isAdPushed, slot]);

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      ></ins>
    </div>
  );
};