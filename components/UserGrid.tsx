import React, { useMemo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { User } from '../types';
import { FlameIcon, FilterIcon } from './icons';

export const UserGrid: React.FC = () => {
    const { users, onlineUsers, filters, setFilters, setSelectedUser } = useMapStore();

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const toggleOnlineOnly = () => {
        setFilters({ onlineOnly: !filters.onlineOnly });
    };

    const filteredUsers = useMemo(() => {
        let sortedUsers = [...users].sort((a, b) => {
            const aOnline = onlineUsers.includes(a.id);
            const bOnline = onlineUsers.includes(b.id);
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;
            return 0; // Manter a ordem original se ambos tiverem o mesmo status
        });

        if (!filters.onlineOnly) {
            return sortedUsers;
        }
        return sortedUsers.filter(user => onlineUsers.includes(user.id));
    }, [users, onlineUsers, filters.onlineOnly]);

    return (
        <div className="h-full flex flex-col bg-black">
            {/* Nova barra de filtros */}
            <div className="p-2 flex items-center space-x-2 overflow-x-auto">
                <button
                    onClick={toggleOnlineOnly}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                        filters.onlineOnly 
                            ? 'bg-yellow-400 text-black' 
                            : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                    }`}
                >
                    Online
                </button>
                 {/* Placeholders para outros filtros */}
                <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 text-gray-300 whitespace-nowrap">Right Now</button>
                <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 text-gray-300 whitespace-nowrap">Idade</button>
                <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 text-gray-300 whitespace-nowrap">Posição</button>
            </div>
            
            {filteredUsers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                    <h2 className="text-xl font-bold">Ninguém por perto...</h2>
                    <p className="mt-2">Tente voltar mais tarde.</p>
                </div>
            ) : (
                <div className="p-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 flex-1">
                    {filteredUsers.map((user) => (
                        <div 
                            key={user.id} 
                            className="relative aspect-square cursor-pointer group"
                            onClick={() => handleUserClick(user)}
                        >
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2 text-white">
                                <div className="flex items-center space-x-1.5">
                                    {onlineUsers.includes(user.id) && (
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    )}
                                    <h3 className="font-bold text-sm truncate">{user.username}</h3>
                                </div>
                                <p className="text-xs text-gray-300 truncate">{user.age} anos</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};