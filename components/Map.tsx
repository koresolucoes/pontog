import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
    <MapContainer center={myLocation} zoom={14} scrollWheelZoom={true} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Marcador para o usuário logado */}
      {profile && <Marker position={myLocation} icon={MyLocationMarkerIcon(profile.avatar_url)} >
        <Popup>Você está aqui!</Popup>
      </Marker>}

      {/* Marcadores para outros usuários */}
      {users.map((user) => (
        <Marker 
          key={user.id} 
          position={{ lat: user.lat, lng: user.lng }}
          icon={UserMarkerIcon(user.avatar_url)}
          eventHandlers={{
            click: () => {
              setSelectedUser(user);
            },
          }}
        >
          <Popup>
            <div className="text-center">
                <p className="font-bold">{user.username}, {user.age}</p>
                <p className="text-xs italic">"{user.status_text}"</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};