import React, { useEffect, useMemo } from 'react';
import { useHomeStore } from '../stores/homeStore';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User } from '../types';

export const HomeView: React.FC = () => {
    const { popularUsers, loading, error, fetchPopularUsers } = useHomeStore();
    const { onlineUsers, setSelectedUser, myLocation } = useMapStore();
    const { agoraUserIds } = useAgoraStore();

    useEffect(() => {
        if (myLocation) {
            fetchPopularUsers();
        }
    }, [myLocation, fetchPopularUsers]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };
    
    const sortedUsers = useMemo(() => {
        return [...popularUsers].sort((a, b) => {
            const aIsAgora = agoraUserIds.includes(a.id);
            const bIsAgora = agoraUserIds.includes(b.id);
            if (aIsAgora && !bIsAgora) return -1;
            if (!aIsAgora && bIsAgora) return 1;

            const aOnline = onlineUsers.includes(a.id);
            const bOnline = onlineUsers.includes(b.id);
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;
            
            return 0;
        });
    }, [popularUsers, onlineUsers, agoraUserIds]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
                <h2 className="text-lg font-bold mt-4">Buscando perfis...</h2>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-8">
                <h2 className="text-xl font-bold">Ocorreu um erro</h2>
                <p className="mt-2">{error}</p>
            </div>
        );
    }

    if (sortedUsers.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <h2 className="text-xl font-bold">Nenhum perfil popular encontrado.</h2>
                <p className="mt-2">Explore o mapa ou a busca para encontrar pessoas perto de você.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <header className="p-4">
                <h1 className="text-xl font-bold">Destaques</h1>
                <p className="text-sm text-gray-400">Perfis populares na sua região.</p>
            </header>
            
            <div className="p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 flex-1 overflow-y-auto">
                {sortedUsers.map((user) => {
                    const isAgora = agoraUserIds.includes(user.id);
                    const isPlus = user.subscription_tier === 'plus';
                    return (
                        <div 
                            key={user.id} 
                            className={`relative aspect-square cursor-pointer group rounded-lg overflow-hidden ${isAgora ? 'border-2 border-red-600 animate-pulse-fire' : ''} ${isPlus && !isAgora ? 'border-2 border-yellow-400/80' : ''}`}
                            onClick={() => handleUserClick(user)}
                        >
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2 text-white">
                                <div className="flex items-center space-x-1.5">
                                    {isPlus && <span className="material-symbols-outlined !text-[14px] text-yellow-400">auto_awesome</span>}
                                    {onlineUsers.includes(user.id) && (
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    )}
                                    <h3 className="font-bold text-sm truncate">{user.username}</h3>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300 truncate">
                                    <span>{user.age} anos</span>
                                    {user.distance_km != null && (
                                        <>
                                            <span>&middot;</span>
                                            <span>{user.distance_km < 1 ? `${Math.round(user.distance_km * 1000)} m` : `${user.distance_km.toFixed(1)} km`}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {isAgora && (
                                <div className="absolute top-1 right-1 bg-red-600/80 rounded-full p-1 shadow-lg">
                                    <span className="material-symbols-outlined !text-[16px] text-white">local_fire_department</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};