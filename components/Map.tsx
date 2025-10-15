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
  const { users, myLocation, onlineUsers, loading, error, filters, setSelectedUser } = useMapStore();
  const { profile } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);

  // Efeito de Inicialização e Centralização do Mapa
  // A inicialização agora depende da existência de `myLocation` para evitar erros.
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
        // FIX: Adiciona uma verificação mais robusta para garantir que o usuário tenha coordenadas válidas.
        // Isso impede que o Leaflet trave ao tentar criar um marcador com lat/lng nulos, indefinidos ou NaN.
        if (!Number.isFinite(user.lat) || !Number.isFinite(user.lng)) {
            console.warn(`Ignorando marcador para o usuário ${user.username} por coordenadas inválidas.`);
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

  // Renderização condicional: Mostra status enquanto espera a localização.
  // O container do mapa só é renderizado quando a localização está disponível.
  if (!myLocation) {
    if (loading) {
      return <div className="flex items-center justify-center h-full text-gray-400">Obtendo sua localização...</div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-center text-red-400 p-4">{error}</div>;
    }
    return <div className="flex items-center justify-center h-full text-center text-gray-400 p-4">Aguardando permissão de localização para exibir o mapa.</div>;
  }

  return (
      <div ref={mapContainerRef} className="w-full h-full" />
  );
};