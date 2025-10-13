import React from 'react';
import { useMapStore } from '../stores/mapStore';
import { User } from '../types';

export const UserGrid: React.FC = () => {
    const users = useMapStore((state) => state.users);
    const setSelectedUser = useMapStore((state) => state.setSelectedUser);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    if (!users || users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                <h2 className="text-xl font-bold">Ninguém por perto...</h2>
                <p className="mt-2">Tente aumentar seu raio de busca ou volte mais tarde.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 overflow-y-auto h-full">
            {users.map((user) => (
                <div 
                    key={user.id} 
                    className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg"
                    onClick={() => handleUserClick(user)}
                >
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-bold text-lg truncate">{user.username}, {user.age}</h3>
                        <p className="text-xs text-gray-300 truncate">{user.status_text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
