import React, { useEffect, useRef } from 'react';
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
  const { users, myLocation, onlineUsers, loading, error, setSelectedUser, startChatWithUser } = useMapStore();
  const { profile } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  // Fix: Used globalThis.Map to resolve name collision with the Map component.
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

    const currentUsersIds = new Set(users.map(u => u.id));

    // Remove marcadores de usuários que não estão mais na lista
    markers.forEach((marker, userId) => {
        if (!currentUsersIds.has(userId)) {
            marker.remove();
            markers.delete(userId);
        }
    });
    
    // Adiciona ou atualiza marcadores dos usuários
    users.forEach(user => {
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

            marker.on('click', () => {
              const popupNode = document.createElement('div');
              popupNode.className = 'w-48';
              
              popupNode.innerHTML = `
                  <div class="text-center">
                      <img src="${user.avatar_url}" alt="${user.username}" class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-gray-600 mb-2"/>
                      <p class="font-bold text-lg">${user.username}, ${user.age}</p>
                      <p class="text-xs italic text-gray-400 mb-3">"${user.status_text || 'Olá!'}"</p>
                      <button id="profile-btn-${user.id}" class="w-full text-sm bg-gray-700 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-gray-600 transition-colors">Ver Perfil</button>
                      <button id="chat-btn-${user.id}" class="w-full text-sm mt-2 bg-pink-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-pink-700 transition-colors">Mensagem</button>
                  </div>
              `;

              marker.bindPopup(popupNode).openPopup();

              // Adiciona listeners após o popup ser criado
              setTimeout(() => {
                const profileBtn = document.getElementById(`profile-btn-${user.id}`);
                const chatBtn = document.getElementById(`chat-btn-${user.id}`);
                profileBtn?.addEventListener('click', () => {
                  setSelectedUser(user);
                  map.closePopup();
                });
                chatBtn?.addEventListener('click', () => {
                  startChatWithUser(user);
                  map.closePopup();
                });
              }, 0);
            });
            marker.addTo(map);
            markers.set(user.id, marker);
        }
    });

  }, [users, onlineUsers, setSelectedUser, startChatWithUser]);


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
