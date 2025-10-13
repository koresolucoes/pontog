import React, { useEffect, useRef, useMemo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import * as L from 'leaflet';
import { User } from '../types';

const createUserIcon = (avatarUrl: string, isOnline: boolean) => {
    const onlineClass = isOnline ? 'border-green-400' : 'border-pink-500';
    return new L.Icon({
        iconUrl: avatarUrl,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -52],
        className: `rounded-full object-cover shadow-lg border-4 ${onlineClass}`
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

  const filteredUsers = useMemo(() => {
    if (!filters.onlineOnly) {
        return users;
    }
    return users.filter(user => onlineUsers.includes(user.id));
  }, [users, onlineUsers, filters.onlineOnly]);

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
    if (mapInstanceRef.current && myLocation) {
        mapInstanceRef.current.setView(myLocation, 14);
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

  // Gerencia os marcadores de outros usuários (adição, remoção, atualização)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markers = userMarkersRef.current;
    if (!map) return;

    const currentUsersIds = new Set(filteredUsers.map(u => u.id));

    // Remove marcadores de usuários que não estão mais na lista filtrada
    markers.forEach((marker, userId) => {
        if (!currentUsersIds.has(userId)) {
            marker.remove();
            markers.delete(userId);
        }
    });
    
    // Adiciona ou atualiza marcadores dos usuários filtrados
    filteredUsers.forEach(user => {
        const isOnline = onlineUsers.includes(user.id);
        const existingMarker = markers.get(user.id);

        if (existingMarker) {
            // Atualiza posição e ícone (para status online)
            existingMarker.setLatLng([user.lat, user.lng]);
            existingMarker.setIcon(createUserIcon(user.avatar_url, isOnline));
        } else {
            // Cria novo marcador
            const marker = L.marker([user.lat, user.lng], {
                icon: createUserIcon(user.avatar_url, isOnline)
            });

            // FIX: Attach a direct click handler to open the modal, avoiding popup complexities.
            marker.on('click', () => {
              setSelectedUser(user);
            });
            
            marker.addTo(map);
            markers.set(user.id, marker);
        }
    });

  }, [filteredUsers, onlineUsers, setSelectedUser]);


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