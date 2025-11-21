
import React, { useMemo, useEffect, useState } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User } from '../types';
import { FilterModal } from './FilterModal';
import { AdSenseUnit } from './AdSenseUnit';

export const UserGrid: React.FC = () => {
    const { users, onlineUsers, filters, setFilters, setSelectedUser } = useMapStore();
    const { agoraUserIds, fetchAgoraPosts } = useAgoraStore();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => {
        fetchAgoraPosts();
    }, [fetchAgoraPosts]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const toggleOnlineOnly = () => {
        setFilters({ ...filters, onlineOnly: !filters.onlineOnly });
    };

    const handleFilterClick = () => {
        setIsFilterModalOpen(true);
    }

    const itemsWithAds = useMemo(() => {
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

        const { onlineOnly, minAge, maxAge, positions, tribes } = filters;

        // Apply filters
        let finalUsers = sortedUsers;
        if (onlineOnly) {
            finalUsers = finalUsers.filter(user => onlineUsers.includes(user.id));
        }
        if (minAge) {
            finalUsers = finalUsers.filter(user => user.age >= minAge);
        }
        if (maxAge) {
            finalUsers = finalUsers.filter(user => user.age <= maxAge);
        }
        if (positions.length > 0) {
            finalUsers = finalUsers.filter(user => user.position && positions.includes(user.position));
        }
        if (tribes.length > 0) {
            finalUsers = finalUsers.filter(user =>
                user.tribes && user.tribes.some(t => tribes.includes(t))
            );
        }
        
        const items: (User | { type: 'ad' })[] = [...finalUsers];
        if (items.length > 8) {
            items.splice(8, 0, { type: 'ad' });
        }
        return items;
    }, [users, onlineUsers, filters, agoraUserIds]);

    const isAgeFilterActive = filters.minAge !== 18 || filters.maxAge !== 99;
    const arePositionsFiltered = filters.positions.length > 0;
    const areTribesFiltered = filters.tribes.length > 0;
    const areAnyFiltersActive = isAgeFilterActive || arePositionsFiltered || areTribesFiltered;

    const FilterButton = ({ label, isActive }: { label: string, isActive: boolean }) => (
        <button 
            onClick={handleFilterClick} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg backdrop-blur-md ${
                isActive 
                    ? 'bg-pink-600/90 text-white shadow-pink-900/30 border border-pink-500/50' 
                    : 'bg-slate-800/60 text-slate-300 border border-white/10 hover:bg-slate-700/80'
            }`}
        >
            <span className="material-symbols-rounded !text-[18px]">tune</span>
            {label}
        </button>
    );

    return (
        <>
        <div className="h-full flex flex-col pb-24 bg-dark-900"> {/* Background mais profundo */}
            {/* Header Flutuante com Glassmorphism */}
            <div className="px-4 py-3 flex items-center space-x-3 overflow-x-auto sticky top-0 z-20 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 mask-image-b">
                <button
                    onClick={toggleOnlineOnly}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg backdrop-blur-md ${
                        filters.onlineOnly 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.15)]' 
                            : 'bg-slate-800/60 text-slate-300 border border-white/10 hover:bg-slate-700/80'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filters.onlineOnly ? 'bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]' : 'bg-slate-400'}`}></div>
                    Online
                </button>
                 <FilterButton label="Filtros" isActive={areAnyFiltersActive} />
            </div>
            
            {itemsWithAds.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8 animate-fade-in">
                    <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <span className="material-symbols-rounded text-5xl text-slate-600">search_off</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight">Ninguém por aqui</h2>
                    <p className="mt-3 text-slate-400 max-w-xs mx-auto leading-relaxed">Tente ajustar seus filtros ou expanda a busca para encontrar alguém.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-3 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                        {itemsWithAds.map((item, index) => {
                            if ('type' in item && item.type === 'ad') {
                                return (
                                    <div key={`ad-${index}`} className="relative aspect-[3/4] bg-slate-800/50 rounded-3xl overflow-hidden flex items-center justify-center border border-white/5">
                                        <AdSenseUnit
                                            client="ca-pub-9015745232467355"
                                            slot="8953415490"
                                            format="auto"
                                            className="w-full h-full"
                                        />
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold text-white/50 tracking-widest border border-white/5">ADS</div>
                                    </div>
                                );
                            }
                            const user = item as User;
                            const isAgora = agoraUserIds.includes(user.id);
                            const isPlus = user.subscription_tier === 'plus';
                            const isOnline = onlineUsers.includes(user.id);

                            return (
                                <div 
                                    key={user.id} 
                                    className={`relative aspect-[3/4] cursor-pointer group rounded-3xl overflow-hidden transition-all duration-500 bg-slate-800 ${isAgora ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'hover:shadow-2xl hover:shadow-black/50'}`}
                                    onClick={() => handleUserClick(user)}
                                >
                                    <img 
                                        src={user.avatar_url} 
                                        alt={user.username} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                                    />
                                    
                                    {/* Cinematic Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>
                                    
                                    {/* Badges Container - Top Right */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                        {isAgora && (
                                            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full p-1.5 shadow-lg shadow-red-900/50 animate-pulse-fire border border-white/20">
                                                <span className="material-symbols-rounded filled !text-[16px] block">local_fire_department</span>
                                            </div>
                                        )}
                                        {isPlus && !isAgora && (
                                            <div className="bg-yellow-500/90 backdrop-blur-md text-black rounded-full p-1.5 shadow-lg border border-yellow-300/50">
                                                <span className="material-symbols-rounded filled !text-[14px] block">auto_awesome</span>
                                            </div>
                                        )}
                                        {user.can_host && (
                                            <div className="bg-green-600/90 backdrop-blur-md text-white rounded-full p-1.5 shadow-lg border border-green-400/50" title="Tem Local">
                                                <span className="material-symbols-rounded filled !text-[14px] block">home</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Online Indicator - Top Left */}
                                    {isOnline && (
                                        <div className="absolute top-4 left-4">
                                            <span className="relative flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)] border border-white/20"></span>
                                            </span>
                                        </div>
                                    )}

                                    {/* User Info - Bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="font-extrabold text-lg truncate leading-none drop-shadow-lg tracking-tight font-outfit">{user.username}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mt-1.5 opacity-90">
                                            <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">{user.age}</span>
                                            {user.distance_km != null && (
                                                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
                                                    <span className="material-symbols-rounded !text-[10px]">location_on</span>
                                                    {user.distance_km < 1 ? `${Math.round(user.distance_km * 1000)}m` : `${user.distance_km.toFixed(0)}km`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
        {isFilterModalOpen && <FilterModal onClose={() => setIsFilterModalOpen(false)} />}
        </>
    );
};
