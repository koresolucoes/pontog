import React, { useMemo, useEffect, useState } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User, Ad } from '../types';
import { FilterModal } from './FilterModal';
import { useAdStore } from '../stores/adStore';
import { FeedAdCard } from './FeedAdCard';
import { AdBanner } from './AdBanner';

export const UserGrid: React.FC = () => {
    const { users, onlineUsers, filters, setFilters, setSelectedUser } = useMapStore();
    const { agoraUserIds, fetchAgoraPosts } = useAgoraStore();
    const { feedAds, bannerAds, fetchAds } = useAdStore();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => {
        fetchAgoraPosts();
        fetchAds();
    }, [fetchAgoraPosts, fetchAds]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const toggleOnlineOnly = () => {
        setFilters({ ...filters, onlineOnly: !filters.onlineOnly });
    };

    const handleFilterClick = () => {
        setIsFilterModalOpen(true);
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
        
        return finalUsers;
    }, [users, onlineUsers, filters, agoraUserIds]);
    
    const itemsWithAds = useMemo(() => {
        const items: (User | Ad)[] = [];
        let feedAdIndex = 0;
        let bannerAdIndex = 0;

        filteredUsers.forEach((user, index) => {
            items.push(user);
            // Insert a banner ad every 15 users (5 rows of 3)
            if ((index + 1) % 15 === 0 && bannerAds.length > 0) {
                items.push(bannerAds[bannerAdIndex++ % bannerAds.length]);
            }
            // Insert a feed ad every 8 users
            if ((index + 1) % 8 === 0 && feedAds.length > 0) {
                items.push(feedAds[feedAdIndex++ % feedAds.length]);
            }
        });

        return items;
    }, [filteredUsers, feedAds, bannerAds]);

    // Check if any filter is active to highlight the button
    const isAgeFilterActive = filters.minAge !== 18 || filters.maxAge !== 99;
    const arePositionsFiltered = filters.positions.length > 0;
    const areTribesFiltered = filters.tribes.length > 0;
    const areAnyFiltersActive = isAgeFilterActive || arePositionsFiltered || areTribesFiltered;

    const FilterButton = ({ label, isActive }: { label: string, isActive: boolean }) => (
        <button 
            onClick={handleFilterClick} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <>
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
                 <FilterButton label="Filtros" isActive={areAnyFiltersActive} />
            </div>
            
            {itemsWithAds.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                    <h2 className="text-xl font-bold">Ninguém encontrado</h2>
                    <p className="mt-2">Tente ajustar seus filtros ou volte mais tarde.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-slate-800">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px">
                        {itemsWithAds.map((item, index) => {
                             if ('ad_type' in item) {
                                if (item.ad_type === 'feed') {
                                    return <FeedAdCard key={`ad-feed-${item.id}-${index}`} ad={item} />;
                                }
                                if (item.ad_type === 'banner') {
                                    return <AdBanner key={`ad-banner-${item.id}-${index}`} ad={item} />;
                                }
                                return null;
                            }
                            const user = item as User;
                            const isAgora = agoraUserIds.includes(user.id);
                            const isPlus = user.subscription_tier === 'plus';
                            return (
                                <div 
                                    key={user.id} 
                                    className={`isolate relative aspect-square cursor-pointer group overflow-hidden bg-slate-900 ${isAgora ? 'border-2 border-red-600 animate-pulse-fire' : ''} ${isPlus && !isAgora ? 'border-2 border-yellow-400/80' : ''}`}
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
                </div>
            )}
        </div>
        {isFilterModalOpen && <FilterModal onClose={() => setIsFilterModalOpen(false)} />}
        </>
    );
};