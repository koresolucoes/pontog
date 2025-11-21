import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import * as L from 'leaflet';
import { User } from '../types';

const createUserIcon = (user: User, isOnline: boolean) => {
    const baseClass = 'rounded-full object-cover shadow-lg border-4';
    let statusClass;
    if (isOnline) {
        statusClass = 'border-green-400';
    } else if (user.subscription_tier === 'plus') {
        statusClass = 'border-yellow-400';
    } else {
        statusClass = 'border-pink-500';
    }
    return new L.Icon({
        iconUrl: user.avatar_url,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -52],
        className: `${baseClass} ${statusClass}`
    });
};

const MyLocationMarkerIcon = (avatarUrl: string) => new L.Icon({
    iconUrl: avatarUrl,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -52],
    className: 'rounded-full border-4 border-blue-400 object-cover shadow-2xl animate-pulse'
});

export const Map: React.FC = () => {
  const { users, myLocation, onlineUsers, loading, error, filters, setSelectedUser, requestLocationPermission } = useMapStore();
  const { profile } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);

  // Efeito de Inicialização e Centralização do Mapa
  useEffect(() => {
    if (!myLocation || !mapContainerRef.current) {
      return;
    }

    const map = mapInstanceRef.current;

    if (!map) {
      const newMap = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(myLocation, 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(newMap);

      mapInstanceRef.current = newMap;
      
      // Garante que o tamanho seja calculado corretamente após a primeira renderização.
      newMap.invalidateSize();
    } else {
      // Se o mapa já existe, apenas atualiza a visão para a nova localização.
      map.setView(myLocation, 14);
    }
  }, [myLocation]);

  // Atualiza o marcador da localização do próprio usuário
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && myLocation && profile) {
        if (!myLocationMarkerRef.current) {
            myLocationMarkerRef.current = L.marker(myLocation, { icon: MyLocationMarkerIcon(profile.avatar_url), zIndexOffset: 1000 })
                .bindPopup('<b>Você está aqui!</b>')
                .addTo(map);
        } else {
            myLocationMarkerRef.current.setLatLng(myLocation);
        }
    }
  }, [myLocation, profile]);

  // Efeito 1: Sincroniza os dados dos marcadores (cria/deleta/atualiza posição).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const markers = userMarkersRef.current;
    const userIdsInStore = new Set(users.map(u => u.id));

    markers.forEach((marker, userId) => {
        if (!userIdsInStore.has(userId)) {
            marker.remove();
            markers.delete(userId);
        }
    });

    users.forEach(user => {
        if (!Number.isFinite(user.lat) || !Number.isFinite(user.lng)) {
            return; // Pula este usuário
        }

        const existingMarker = markers.get(user.id);
        if (existingMarker) {
            existingMarker.setLatLng([user.lat, user.lng]);
        } else {
            const newMarker = L.marker([user.lat, user.lng]);
            newMarker.on('click', () => {
              setSelectedUser(user);
            });
            markers.set(user.id, newMarker);
        }
    });
  }, [users, setSelectedUser]);

  // Efeito 2: Sincroniza a visualização dos marcadores (visibilidade e estilo do ícone).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const markers = userMarkersRef.current;
    
    markers.forEach((marker, userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const isOnline = onlineUsers.includes(userId);
        const shouldBeVisible = !filters.onlineOnly || isOnline;

        marker.setIcon(createUserIcon(user, isOnline));

        if (shouldBeVisible) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                marker.remove();
            }
        }
    });
  }, [users, onlineUsers, filters]);

  // Tela de Carregamento "Scanner" Sci-Fi
  if (!myLocation) {
    const isError = !!error;
    const scanColor = isError ? 'red' : 'pink';
    
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-dark-900 relative overflow-hidden">
            {/* Fundo de mapa sutil para contexto */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                {/* Radar Container */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
                    
                    {/* Outer Glow Ring */}
                    <div className={`absolute inset-0 rounded-full border border-${scanColor}-500/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}></div>
                    
                    {/* Pulsing Rings */}
                    {!isError && (
                        <>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple`}></div>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple delay-75`}></div>
                            <div className={`absolute inset-0 rounded-full border-2 border-${scanColor}-500/10 animate-ripple delay-150`}></div>
                        </>
                    )}

                    {/* Static HUD Rings */}
                    <div className={`absolute w-[80%] h-[80%] rounded-full border border-${scanColor}-500/30 border-dashed`}></div>
                    <div className={`absolute w-[50%] h-[50%] rounded-full border border-${scanColor}-500/40`}></div>
                    
                    {/* Rotating Scanner Beam */}
                    {!isError && (
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-${scanColor}-500/20 to-transparent animate-radar-spin`}></div>
                    )}

                    {/* Center Point */}
                    <div className={`w-4 h-4 bg-${scanColor}-500 rounded-full shadow-[0_0_15px_currentColor] ${!isError ? 'animate-pulse' : ''}`}></div>
                </div>

                {/* Text Status */}
                <div className="text-center space-y-2">
                    <h2 className={`text-2xl font-black tracking-widest font-outfit ${isError ? 'text-red-500' : 'text-white animate-pulse'}`}>
                        {isError ? 'SINAL PERDIDO' : 'ESCANEANDO...'}
                    </h2>
                    <p className={`text-xs font-mono uppercase tracking-wide ${isError ? 'text-red-400/70' : 'text-pink-400/70'}`}>
                        {isError ? 'Não foi possível obter GPS' : 'Triangulando sua posição'}
                    </p>
                </div>

                {/* Error Action */}
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
      <div ref={mapContainerRef} className="w-full h-full" />
  );
};