import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useHomeStore } from '../stores/homeStore';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User, Ad } from '../types';
import { useAdStore } from '../stores/adStore';
import { FeedAdCard } from './FeedAdCard';
import { AdBanner } from './AdBanner';


const GridLoader: React.FC = () => (
    <>
        {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="relative aspect-square bg-slate-700 animate-pulse"></div>
        ))}
    </>
);

export const HomeView: React.FC = () => {
    const { popularUsers, loading, error, hasMore, loadingMore, fetchPopularUsers, fetchMorePopularUsers } = useHomeStore();
    const { onlineUsers, setSelectedUser, myLocation } = useMapStore();
    const { agoraUserIds } = useAgoraStore();
    const { feedAds, bannerAds, fetchAds } = useAdStore();

    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (myLocation && !initialFetchDone.current) {
            fetchPopularUsers();
            fetchAds();
            initialFetchDone.current = true;
        }
    }, [myLocation, fetchPopularUsers, fetchAds]);

    const observer = useRef<IntersectionObserver>();
    const lastUserElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMorePopularUsers();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, fetchMorePopularUsers]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };
    
    const itemsWithAds = useMemo(() => {
        const sortedUsers = [...popularUsers].sort((a, b) => {
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

        const items: (User | Ad)[] = [];
        let feedAdIndex = 0;
        let bannerAdIndex = 0;

        sortedUsers.forEach((user, index) => {
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
    }, [popularUsers, onlineUsers, agoraUserIds, feedAds, bannerAds]);


    if (loading && popularUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
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

    return (
        <div className="h-full flex flex-col bg-slate-900">
            <header className="p-4">
                <h1 className="text-xl font-bold">Destaques</h1>
                <p className="text-sm text-slate-400">Perfis populares na sua região.</p>
            </header>
            
            <div className="flex-1 overflow-y-auto bg-slate-800">
                {itemsWithAds.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                        <h2 className="text-xl font-bold">Nenhum perfil encontrado.</h2>
                        <p className="mt-2">Explore o mapa ou a grade para encontrar mais pessoas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px content-start">
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
                            const isLastUser = index === itemsWithAds.length - 1 && 'username' in item;
                            const isAgora = agoraUserIds.includes(user.id);
                            const isPlus = user.subscription_tier === 'plus';
                            
                            return (
                                <div 
                                    ref={isLastUser ? lastUserElementRef : null}
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
                        {loadingMore && <GridLoader />}
                    </div>
                )}
            </div>
        </div>
    );
};