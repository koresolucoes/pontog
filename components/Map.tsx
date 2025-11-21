
import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { useAgoraStore } from '../stores/agoraStore';
import * as L from 'leaflet';
import { User } from '../types';

// Função para gerar o HTML do marcador dinâmico (mantida igual)
const createLiveMarker = (user: User, isOnline: boolean, isAgora: boolean) => {
    const isPlus = user.subscription_tier === 'plus';
    
    let ringHtml = '';
    let badgeHtml = '';
    let hosterBadgeHtml = '';
    let borderClass = 'border-2 border-white';
    let containerClass = '';

    if (isAgora) {
        borderClass = 'border-2 border-red-500';
        containerClass = 'z-20';
        ringHtml = `
            <div class="absolute -inset-3 bg-red-500/30 rounded-full blur-md animate-pulse"></div>
            <div class="absolute -inset-1 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full opacity-70 animate-spin-slow"></div>
        `;
        badgeHtml = `
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border border-white scale-110 z-30">
                <span class="material-symbols-rounded filled animate-pulse" style="font-size: 14px;">local_fire_department</span>
            </div>
        `;
    } else if (isOnline) {
        borderClass = 'border-2 border-green-400';
        ringHtml = `
            <div class="absolute -inset-1 bg-green-500 rounded-full opacity-75 animate-ping"></div>
        `;
        badgeHtml = `
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-30"></div>
        `;
    } else if (isPlus) {
        borderClass = 'border-2 border-yellow-400';
        badgeHtml = `
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-sm border border-white z-30">
                <span class="material-symbols-rounded filled" style="font-size: 10px;">auto_awesome</span>
            </div>
        `;
    }
    
    if (user.can_host) {
         hosterBadgeHtml = `
            <div class="absolute -top-1 -left-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center shadow-sm border border-white z-30">
                <span class="material-symbols-rounded filled" style="font-size: 12px;">home</span>
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
            ${hosterBadgeHtml}
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'bg-transparent',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Cleanup robusto
  useEffect(() => {
    return () => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            userMarkersRef.current.clear();
            myLocationMarkerRef.current = null;
        }
    };
  }, []);

  // Inicialização do Mapa
  useEffect(() => {
    // Só inicializa se tivermos localização e o container
    if (!myLocation || !mapContainerRef.current) return;
    
    // Se já existe, apenas atualiza a view (flyTo para suavidade)
    if (mapInstanceRef.current) {
        return;
    }

    // Delay crítico: Espera o DOM estabilizar e a animação de transição de tela (fade-in) terminar.
    // Isso evita o problema de "tela branca" onde o Leaflet calcula altura 0.
    const initTimer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        // Proteção dupla contra inicialização múltipla
        if (mapInstanceRef.current) return;

        const newMap = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true
        }).setView(myLocation, 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            updateWhenIdle: true, // Performance: carrega tiles apenas quando parar de mover
            keepBuffer: 2 // Performance: mantém tiles na memória
        }).addTo(newMap);

        mapInstanceRef.current = newMap;
        setIsMapReady(true);

        // Observer para corrigir redimensionamento (rotação de tela, abertura de teclado)
        const observer = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        });
        observer.observe(mapContainerRef.current);
        resizeObserverRef.current = observer;

        // Force invalidate logo após a criação para garantir
        setTimeout(() => {
            newMap.invalidateSize();
        }, 100);

    }, 300); // 300ms coincide com a duração da animação 'animate-fade-in' do App.tsx

    return () => clearTimeout(initTimer);
  }, [myLocation]);

  // Atualiza posição do "Você"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && myLocation && profile) {
        if (!myLocationMarkerRef.current) {
            myLocationMarkerRef.current = L.marker(myLocation, { 
                icon: MyLocationMarkerIcon(profile.avatar_url), 
                zIndexOffset: 1000 
            }).addTo(map);
        } else {
            const oldLatLng = myLocationMarkerRef.current.getLatLng();
            // Só move se a diferença for significativa para evitar repintura desnecessária
            if (oldLatLng.distanceTo(myLocation) > 2) {
                myLocationMarkerRef.current.setLatLng(myLocation);
                // Opcional: Centralizar suavemente no usuário se ele sair muito da tela
                // map.panTo(myLocation); 
            }
            myLocationMarkerRef.current.setZIndexOffset(1000);
        }
    }
  }, [myLocation, profile, isMapReady]);

  // Gerenciamento dos Marcadores de Usuários
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;
    
    const markers = userMarkersRef.current;
    const userIdsInStore = new Set(users.map(u => u.id));

    // Remove marcadores antigos
    markers.forEach((marker, userId) => {
        if (!userIdsInStore.has(userId)) {
            marker.remove();
            markers.delete(userId);
        }
    });

    // Adiciona/Atualiza marcadores
    users.forEach(user => {
        if (!Number.isFinite(user.lat) || !Number.isFinite(user.lng)) return;

        const isOnline = onlineUsers.includes(user.id);
        const isAgora = agoraUserIds.includes(user.id);
        const shouldBeVisible = !filters.onlineOnly || isOnline;

        let marker = markers.get(user.id);

        if (shouldBeVisible) {
            if (!marker) {
                marker = L.marker([user.lat!, user.lng!]);
                marker.on('click', () => setSelectedUser(user));
                markers.set(user.id, marker);
                marker.addTo(map);
            } else {
                const oldLatLng = marker.getLatLng();
                if (oldLatLng.lat !== user.lat || oldLatLng.lng !== user.lng) {
                    marker.setLatLng([user.lat!, user.lng!]);
                }
                if (!map.hasLayer(marker)) marker.addTo(map);
            }

            // Atualiza ícone e Z-index sempre
            marker.setIcon(createLiveMarker(user, isOnline, isAgora));
            marker.setZIndexOffset(isAgora ? 800 : isOnline ? 500 : 100);
        } else {
            if (marker && map.hasLayer(marker)) {
                marker.remove();
            }
        }
    });
  }, [users, onlineUsers, agoraUserIds, filters, setSelectedUser, isMapReady]);

  // Lógica de Exibição:
  // O container do mapa existe SEMPRE no DOM (z-0).
  // O Scanner/Loading existe como um OVERLAY (z-50) que desaparece (opacity-0) quando o mapa está pronto.
  
  const isScanning = !myLocation || !isMapReady;
  const isError = !!error;
  const scanColor = isError ? 'red' : 'pink';

  return (
      <div className="w-full h-full relative bg-dark-900 isolate overflow-hidden">
          {/* Container do Mapa (Sempre Renderizado) */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full absolute inset-0 z-0 outline-none focus:outline-none"
            style={{ opacity: isScanning ? 0 : 1, transition: 'opacity 0.5s ease-in' }}
          />

          {/* Overlay de Carregamento / Scanner (Fade Out quando pronto) */}
          <div 
            className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-dark-900 transition-opacity duration-700 ease-in-out ${!isScanning && !isError ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
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

                {isError ? (
                    <button 
                        onClick={() => requestLocationPermission()} 
                        className="mt-8 px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer pointer-events-auto"
                    >
                        <span className="material-symbols-rounded animate-spin">refresh</span>
                        Tentar Novamente
                    </button>
                ) : (
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-white/5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] text-slate-400 font-mono">AGUARDANDO SATÉLITES</span>
                    </div>
                )}
            </div>
          </div>
      </div>
  );
};
