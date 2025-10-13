import React, { useMemo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { User } from '../types';
import { FilterBar } from './FilterBar';

export const UserGrid: React.FC = () => {
    const { users, onlineUsers, filters, setSelectedUser } = useMapStore();

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const filteredUsers = useMemo(() => {
        if (!filters.onlineOnly) {
            return users;
        }
        return users.filter(user => onlineUsers.includes(user.id));
    }, [users, onlineUsers, filters.onlineOnly]);

    return (
        <div className="h-full flex flex-col">
            <FilterBar />
            {filteredUsers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                    <h2 className="text-xl font-bold">Ninguém por perto...</h2>
                    <p className="mt-2">Tente alterar os filtros ou volte mais tarde.</p>
                </div>
            ) : (
                <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 overflow-y-auto flex-1">
                    {filteredUsers.map((user) => (
                        <div 
                            key={user.id} 
                            className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg"
                            onClick={() => handleUserClick(user)}
                        >
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute top-2 right-2">
                                {onlineUsers.includes(user.id) && (
                                    <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                                )}
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                <h3 className="font-bold text-lg truncate">{user.username}, {user.age}</h3>
                                <p className="text-xs text-gray-300 truncate">{user.status_text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
