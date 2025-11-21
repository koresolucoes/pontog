
import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { useAgoraStore } from '../stores/agoraStore';
import * as L from 'leaflet';
import { User } from '../types';

// Função para gerar o HTML do marcador dinâmico
const createLiveMarker = (user: User, isOnline: boolean, isAgora: boolean) => {
    const isPlus = user.subscription_tier === 'plus';
    
    // Base classes
    let ringHtml = '';
    let badgeHtml = '';
    let borderClass = 'border-2 border-white';
    let containerClass = '';

    // Lógica Visual
    if (isAgora) {
        // Efeito de Fogo/Brasa para Modo Agora
        borderClass = 'border-2 border-red-500';
        containerClass = 'z-20'; // Fica acima dos outros
        ringHtml = `
            <div class="absolute -inset-3 bg-red-500/30 rounded-full blur-md animate-pulse"></div>
            <div class="absolute -inset-1 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full opacity-70 animate-spin-slow"></div>
        `;
        badgeHtml = `
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border border-white scale-110 z-30">
                <span class="material-symbols-rounded filled text-[14px] animate-pulse">local_fire_department</span>
            </div>
        `;
    } else if (isOnline) {
        // Efeito de Ping para Online
        borderClass = 'border-2 border-green-400';
        ringHtml = `
            <div class="absolute -inset-1 bg-green-500 rounded-full opacity-75 animate-ping"></div>
        `;
        badgeHtml = `
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-30"></div>
        `;
    } else if (isPlus) {
        // Borda Dourada para Plus
        borderClass = 'border-2 border-yellow-400';
        badgeHtml = `
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-sm border border-white z-30">
                <span class="material-symbols-rounded filled text-[10px]">auto_awesome</span>
            </div>
        `;
    }
    
    // Hoster Badge no mapa (prioridade menor que Agora)
    if (user.can_host && !isAgora) {
         badgeHtml = `
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center shadow-sm border border-white z-30">
                <span class="material-symbols-rounded filled text-[12px]">home</span>
            </div>
        `;
    }

    const html = `
        <div class="relative w-12 h-12 transition-transform duration-300 hover:scale-110 ${containerClass}">
            ${ringHtml}
            <div class="relative w-full h-full rounded-full overflow-hidden ${borderClass} shadow-lg bg-slate-800">
                <img src="${user.avatar_url}" class="w-full h-full object-cover" alt="${user.username}" />
            </div>
            ${badgeHtml}
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'bg-transparent', // Remove estilos padrão do Leaflet
        iconSize: [48, 48],
        iconAnchor: [24, 24], // Centraliza
        popupAnchor: [0, -28]
    });
};

const MyLocationMarkerIcon = (avatarUrl: string) => {
    const html = `
        <div class="relative w-14 h-14">
            <div class="absolute -inset-4 bg-blue-500/20 rounded-full animate-pulse"></div>
            <div class="absolute -inset-1 bg-blue-500/40 rounded-full blur-sm"></div>
            <div class="relative w-full h-full rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl bg-slate-900 z-10">
                <img src="${avatarUrl}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white shadow-md z-20 whitespace-nowrap">
                VOCÊ
            </div>
        </div>
    `;
    return L.divIcon({
        html: html,
        className: 'bg-transparent',
        iconSize: [56, 56],
        iconAnchor: [28, 28]
    });
};

export const Map: React.FC = () => {
  const { users, myLocation, onlineUsers, loading, error, filters, setSelectedUser, requestLocationPermission } = useMapStore();
  const { profile } = useAuthStore();
  const { agoraUserIds } = useAgoraStore();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  
  // Ref para controlar o intervalo de invalidação
  const invalidationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup geral ao desmontar o componente
  useEffect(() => {
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
        if (invalidationIntervalRef.current) {
            clearInterval(invalidationIntervalRef.current);
        }
    };
  }, []);

  // Inicialização Robusta do Mapa
  useEffect(() => {
    if (!myLocation || !mapContainerRef.current) {
      return;
    }

    if (!mapInstanceRef.current) {
      const newMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView(myLocation, 15);

      // Dark Mode Map Tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(newMap);

      mapInstanceRef.current = newMap;

      // ESTRATÉGIA DE CORREÇÃO DE TELA BRANCA:
      // Força o redesenho do mapa repetidamente durante os primeiros segundos.
      // Isso garante que o mapa se ajuste ao container mesmo se houver animações CSS (slide-in)
      // ou atrasos na renderização do layout.
      let count = 0;
      if (invalidationIntervalRef.current) clearInterval(invalidationIntervalRef.current);
      
      invalidationIntervalRef.current = setInterval(() => {
          if (newMap) {
              newMap.invalidateSize();
          }
          count++;
          // Para após 2 segundos (20 * 100ms)
          if (count > 20 && invalidationIntervalRef.current) {
              clearInterval(invalidationIntervalRef.current);
          }
      }, 100);

    } else {
        // Se o mapa já existe, apenas atualiza a visão suavemente e invalida o tamanho
        // para garantir que está correto caso o usuário tenha trocado de aba.
        mapInstanceRef.current.panTo(myLocation);
        mapInstanceRef.current.invalidateSize();
    }
  }, [myLocation]);

  // Atualiza o marcador do próprio usuário
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && myLocation && profile) {
        if (!myLocationMarkerRef.current) {
            myLocationMarkerRef.current = L.marker(myLocation, { 
                icon: MyLocationMarkerIcon(profile.avatar_url), 
                zIndexOffset: 1000 
            }).addTo(map);
        } else {
            myLocationMarkerRef.current.setLatLng(myLocation);
            myLocationMarkerRef.current.setZIndexOffset(1000);
        }
    }
  }, [myLocation, profile]);

  // Gerenciamento dos Marcadores de Outros Usuários
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const markers = userMarkersRef.current;
    const userIdsInStore = new Set(users.map(u => u.id));

    // Remove marcadores de usuários que não estão mais na lista
    markers.forEach((marker, userId) => {
        if (!userIdsInStore.has(userId)) {
            marker.remove();
            markers.delete(userId);
        }
    });

    users.forEach(user => {
        if (!Number.isFinite(user.lat) || !Number.isFinite(user.lng)) return;

        const isOnline = onlineUsers.includes(user.id);
        const isAgora = agoraUserIds.includes(user.id);
        const shouldBeVisible = !filters.onlineOnly || isOnline;

        // Cria ou atualiza marcador
        let marker = markers.get(user.id);

        if (!marker) {
            marker = L.marker([user.lat, user.lng]);
            marker.on('click', () => {
              setSelectedUser(user);
            });
            markers.set(user.id, marker);
        } else {
            // Animação suave de movimento se a posição mudar
            const oldLatLng = marker.getLatLng();
            if (oldLatLng.lat !== user.lat || oldLatLng.lng !== user.lng) {
                marker.setLatLng([user.lat, user.lng]);
            }
        }

        // Atualiza o ícone (Live Marker HTML)
        marker.setIcon(createLiveMarker(user, isOnline, isAgora));
        
        // Ajusta Z-Index: Agora > Online > Offline
        marker.setZIndexOffset(isAgora ? 800 : isOnline ? 500 : 100);

        // Controle de visibilidade baseado em filtros
        if (shouldBeVisible) {
            if (!map.hasLayer(marker)) marker.addTo(map);
        } else {
            if (map.hasLayer(marker)) marker.remove();
        }
    });
  }, [users, onlineUsers, agoraUserIds, filters, setSelectedUser]);

  // Tela de Carregamento / Scanner
  if (!myLocation) {
    const isError = !!error;
    const scanColor = isError ? 'red' : 'pink';
    
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-dark-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
                    <div className={`absolute inset-0 rounded-full border border-${scanColor}-500/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}></div>
                    {!isError && (
                        <>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple`}></div>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple delay-75`}></div>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple delay-150`}></div>
                        </>
                    )}
                    <div className={`absolute w-[80%] h-[80%] rounded-full border border-${scanColor}-500/30 border-dashed`}></div>
                    <div className={`absolute w-[50%] h-[50%] rounded-full border border-${scanColor}-500/40`}></div>
                    {!isError && (
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-${scanColor}-500/20 to-transparent animate-radar-spin`}></div>
                    )}
                    <div className={`w-4 h-4 bg-${scanColor}-500 rounded-full shadow-[0_0_15px_currentColor] ${!isError ? 'animate-pulse' : ''}`}></div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className={`text-2xl font-black tracking-widest font-outfit ${isError ? 'text-red-500' : 'text-white animate-pulse'}`}>
                        {isError ? 'SINAL PERDIDO' : 'ESCANEANDO...'}
                    </h2>
                    <p className={`text-xs font-mono uppercase tracking-wide ${isError ? 'text-red-400/70' : 'text-pink-400/70'}`}>
                        {isError ? 'Não foi possível obter GPS' : 'Triangulando sua posição'}
                    </p>
                </div>

                {isError && (
                    <button 
                        onClick={() => requestLocationPermission()} 
                        className="mt-8 px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded animate-spin">refresh</span>
                        Tentar Novamente
                    </button>
                )}
                
                {!isError && (
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-white/5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] text-slate-400 font-mono">AGUARDANDO SATÉLITES</span>
                    </div>
                )}
            </div>
        </div>
    );
  }

  return (
      // Define width e height explicitamente para evitar colapso
      <div className="w-full h-full relative z-0 bg-dark-900" style={{ minHeight: '100%' }}>
          <div ref={mapContainerRef} className="w-full h-full absolute inset-0" style={{ minHeight: '100%' }} />
      </div>
  );
};
