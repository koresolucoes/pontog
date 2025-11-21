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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                isActive 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-900/20 border border-pink-500/50' 
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
        >
            <span className="material-symbols-rounded !text-[16px]">tune</span>
            {label}
        </button>
    );

    return (
        <>
        <div className="h-full flex flex-col pb-20"> {/* Added padding bottom for floating nav */}
            <div className="p-4 flex items-center space-x-3 overflow-x-auto sticky top-0 z-10 bg-dark-900/90 backdrop-blur-md border-b border-white/5">
                <button
                    onClick={toggleOnlineOnly}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        filters.onlineOnly 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]' 
                            : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filters.onlineOnly ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                    Online
                </button>
                 <FilterButton label="Filtros" isActive={areAnyFiltersActive} />
            </div>
            
            {itemsWithAds.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-rounded text-4xl text-slate-600">search_off</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-300">Ninguém encontrado</h2>
                    <p className="mt-2 text-slate-400">Tente ajustar seus filtros ou volte mais tarde.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 pt-2">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                        {itemsWithAds.map((item, index) => {
                            if ('type' in item && item.type === 'ad') {
                                return (
                                    <div key={`ad-${index}`} className="relative aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                                        <AdSenseUnit
                                            client="ca-pub-9015745232467355"
                                            slot="8953415490"
                                            format="auto"
                                            className="w-full h-full"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/50 px-1.5 rounded text-[10px] text-white/70">Ad</div>
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
                                    className={`relative aspect-[3/4] cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${isAgora ? 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : ''}`}
                                    onClick={() => handleUserClick(user)}
                                >
                                    <img 
                                        src={user.avatar_url} 
                                        alt={user.username} 
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                    
                                    {/* Status Badge Top Right */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                        {isAgora && (
                                            <div className="bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-pulse-fire">
                                                <span className="material-symbols-rounded filled !text-[14px] block">local_fire_department</span>
                                            </div>
                                        )}
                                        {isPlus && !isAgora && (
                                            <div className="bg-yellow-500/90 backdrop-blur-sm text-black rounded-full p-1 shadow-lg">
                                                <span className="material-symbols-rounded filled !text-[12px] block">auto_awesome</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Online Indicator Top Left */}
                                    {isOnline && (
                                        <div className="absolute top-3 left-3 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-sm"></div>
                                    )}

                                    {/* User Info Bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                        <h3 className="font-bold text-sm truncate leading-tight drop-shadow-md">{user.username}</h3>
                                        <div className="flex items-center gap-1 text-xs text-slate-300 font-medium mt-0.5">
                                            <span>{user.age}</span>
                                            {user.distance_km != null && (
                                                <>
                                                    <span className="text-slate-500">•</span>
                                                    <span>{user.distance_km < 1 ? `${Math.round(user.distance_km * 1000)}m` : `${user.distance_km.toFixed(0)}km`}</span>
                                                </>
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