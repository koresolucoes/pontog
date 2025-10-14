import React from 'react';
import { useMapStore } from '../stores/mapStore';
import { User } from '../types';

export const Map: React.FC = () => {
    const { users, onlineUsers, currentLocation, setSelectedUser } = useMapStore();

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    // A very basic projection to place users on the map view
    const projectCoordinates = (lat: number, lng: number) => {
        if (!currentLocation) return { top: '50%', left: '50%', opacity: 0 };

        // Very rough scaling factor for a "local" view. This is not a real map projection.
        const latDiff = currentLocation.lat - lat;
        const lngDiff = lng - currentLocation.lng;
        
        const yOffset = latDiff * 2000; // pixels per degree latitude
        const xOffset = lngDiff * 2000; // pixels per degree longitude

        return {
            top: `calc(50% - ${yOffset}px)`,
            left: `calc(50% + ${xOffset}px)`,
            opacity: 1,
        };
    };

    return (
        <div className="w-full h-full bg-gray-800 relative overflow-hidden">
            
            {!currentLocation && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Obtendo sua localização para carregar o mapa...</p>
                </div>
            )}
            
            {users.map(user => {
                const isOnline = onlineUsers.includes(user.id);
                const style = projectCoordinates(user.lat, user.lng);

                return (
                    <div
                        key={user.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500"
                        style={style}
                        onClick={() => handleUserClick(user)}
                    >
                        <div className="relative group">
                            <img 
                                src={user.avatar_url} 
                                alt={user.username} 
                                className={`w-12 h-12 rounded-full object-cover border-4 transition-all duration-300 group-hover:scale-110 ${isOnline ? 'border-green-400' : 'border-gray-500'}`}
                            />
                             {isOnline && <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>}
                        </div>
                    </div>
                );
            })}

             {currentLocation && (
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    title="Sua Posição"
                >
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
            )}
        </div>
    );
};
