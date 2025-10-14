import React, { useMemo, useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { User } from '../types';

export const UserGrid: React.FC = () => {
    const { users, onlineUsers, filters, setFilters, setSelectedUser } = useMapStore();
    const { agoraUserIds, fetchAgoraPosts } = useAgoraStore();
    const { user: currentUser } = useAuthStore();
    const { setSubscriptionModalOpen } = useUiStore();

    useEffect(() => {
        fetchAgoraPosts();
    }, [fetchAgoraPosts]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const toggleOnlineOnly = () => {
        setFilters({ onlineOnly: !filters.onlineOnly });
    };

    const handlePremiumFilterClick = () => {
        if (currentUser?.subscription_tier === 'plus') {
            // TODO: Implementar a lógica de filtro real (ex: abrir um modal de filtro)
            alert('Filtro premium em breve!');
        } else {
            setSubscriptionModalOpen(true);
        }
    }

    const filteredUsers = useMemo(() => {
        let sortedUsers = [...users].sort((a, b) => {
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

        if (!filters.onlineOnly) {
            return sortedUsers;
        }
        return sortedUsers.filter(user => onlineUsers.includes(user.id));
    }, [users, onlineUsers, filters.onlineOnly, agoraUserIds]);

    const PremiumFilterButton = ({ label }: { label: string }) => (
        <button onClick={handlePremiumFilterClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 whitespace-nowrap hover:bg-slate-600 transition-colors">
            {label}
            <span className="material-symbols-outlined !text-[14px] text-yellow-400">auto_awesome</span>
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-slate-900">
            <div className="p-2 flex items-center space-x-2 overflow-x-auto">
                <button
                    onClick={toggleOnlineOnly}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                        filters.onlineOnly 
                            ? 'bg-pink-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    Online
                </button>
                 <PremiumFilterButton label="Idade" />
                 <PremiumFilterButton label="Posição" />
                 <PremiumFilterButton label="Tribo" />
            </div>
            
            {filteredUsers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                    <h2 className="text-xl font-bold">Ninguém por perto...</h2>
                    <p className="mt-2">Tente voltar mais tarde.</p>
                </div>
            ) : (
                <div className="p-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 flex-1 overflow-y-auto content-start">
                    {filteredUsers.map((user) => {
                        const isAgora = agoraUserIds.includes(user.id);
                        const isPlus = user.subscription_tier === 'plus';
                        return (
                            <div 
                                key={user.id} 
                                className={`isolate relative aspect-square cursor-pointer group rounded-lg overflow-hidden ${isAgora ? 'border-2 border-red-600 animate-pulse-fire' : ''} ${isPlus && !isAgora ? 'border-2 border-yellow-400/80' : ''}`}
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
                                    <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
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
                                        <span className="material-symbols-outlined text-white !text-[16px]">local_fire_department</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};