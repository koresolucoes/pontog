import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import * as L from 'leaflet';

const UserMarkerIcon = (avatarUrl: string) => new L.Icon({
    iconUrl: avatarUrl,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
    className: 'rounded-full border-2 border-pink-500 object-cover shadow-lg'
});

const MyLocationMarkerIcon = (avatarUrl: string) => new L.Icon({
    iconUrl: avatarUrl,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -52],
    className: 'rounded-full border-4 border-blue-400 object-cover shadow-2xl animate-pulse'
});

export const Map: React.FC = () => {
  const { users, myLocation, loading, error, setSelectedUser } = useMapStore();
  const { profile } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current && myLocation) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, // Opcional: desativa o controle de zoom padrão
      }).setView(myLocation, 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
      userMarkersLayerRef.current = L.layerGroup().addTo(map);

      if (profile) {
        L.marker(myLocation, { icon: MyLocationMarkerIcon(profile.avatar_url) })
          .bindPopup('<b>Você está aqui!</b>')
          .addTo(map);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [myLocation, profile]);

  useEffect(() => {
    const layerGroup = userMarkersLayerRef.current;
    if (mapInstanceRef.current && layerGroup) {
      layerGroup.clearLayers();

      users.forEach(user => {
        const marker = L.marker([user.lat, user.lng], {
          icon: UserMarkerIcon(user.avatar_url)
        });

        const popupContent = `
          <div class="text-center">
            <p class="font-bold">${user.username}, ${user.age}</p>
            <p class="text-xs italic">"${user.status_text || ''}"</p>
          </div>
        `;
        
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedUser(user);
        });

        marker.addTo(layerGroup);
      });
    }
  }, [users, setSelectedUser]);


  if (loading && !myLocation) {
    return <div className="flex items-center justify-center h-full text-gray-400">Obtendo sua localização...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-full text-center text-red-400 p-4">{error}</div>;
  }

  if (!myLocation) {
    return <div className="flex items-center justify-center h-full text-gray-400">Não foi possível obter sua localização.</div>;
  }

  return (
      <div ref={mapContainerRef} className="w-full h-full" />
  );
};