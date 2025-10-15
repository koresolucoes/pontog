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
  // Este ref agora guardará TODOS os marcadores de usuários, independentemente da visibilidade.
  const userMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const myLocationMarkerRef = useRef<L.Marker | null>(null);

  // Inicialização do mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([-15.7801, -47.9292], 4); // Centro do Brasil

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      mapInstanceRef.current = map;

      // FIX: Força o mapa a recalcular seu tamanho após ser renderizado no DOM.
      // Isso corrige o bug onde os 'tiles' não aparecem na primeira carga.
      setTimeout(() => {
        map.invalidateSize();
      }, 100); 
    }
  }, []);

  // Centraliza o mapa na localização do usuário quando disponível
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && myLocation) {
        // Adicionado para garantir que o tamanho do mapa seja recalculado
        // antes de definir a visualização, o que pode acontecer depois que a UI se estabiliza.
        map.invalidateSize();
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
  // Roda apenas quando a lista principal de `users` muda.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const markers = userMarkersRef.current;
    const userIdsInStore = new Set(users.map(u => u.id));

    // Remove marcadores de usuários que não estão mais na lista
    markers.forEach((marker, userId) => {
        if (!userIdsInStore.has(userId)) {
            marker.remove(); // Remove do mapa se estiver lá
            markers.delete(userId);
        }
    });

    // Adiciona novos marcadores ou atualiza a posição dos existentes
    users.forEach(user => {
        const existingMarker = markers.get(user.id);
        if (existingMarker) {
            // Apenas atualiza a posição. O ícone e a visibilidade são controlados pelo outro efeito.
            existingMarker.setLatLng([user.lat, user.lng]);
        } else {
            // Cria um novo marcador mas NÃO o adiciona ao mapa ainda.
            const newMarker = L.marker([user.lat, user.lng], {
                icon: createUserIcon(user, onlineUsers.includes(user.id))
            });
            
            newMarker.on('click', () => {
              setSelectedUser(user);
            });

            markers.set(user.id, newMarker);
        }
    });
  }, [users, onlineUsers, setSelectedUser]);

  // Efeito 2: Sincroniza a visualização dos marcadores (visibilidade e estilo do ícone).
  // Roda sempre que os filtros, status online ou a lista de usuários mudam.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const markers = userMarkersRef.current;
    
    markers.forEach((marker, userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return; // Não deve acontecer se o Efeito 1 rodou corretamente

        const isOnline = onlineUsers.includes(userId);
        const shouldBeVisible = !filters.onlineOnly || isOnline;

        // Atualiza o ícone para refletir o status online atual
        marker.setIcon(createUserIcon(user, isOnline));

        // Adiciona ou remove o marcador do mapa com base na visibilidade
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

  if (loading && !myLocation) {
    return <div className="flex items-center justify-center h-full text-gray-400">Obtendo sua localização...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-full text-center text-red-400 p-4">{error}</div>;
  }

  return (
      <div ref={mapContainerRef} className="w-full h-full" />
  );
};