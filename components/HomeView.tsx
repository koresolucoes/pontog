
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useHomeStore } from '../stores/homeStore';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User } from '../types';
import { AdSenseUnit } from './AdSenseUnit';


const GridLoader: React.FC = () => (
    <>
        {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="relative aspect-[3/4] bg-slate-800/50 rounded-3xl animate-pulse border border-white/5"></div>
        ))}
    </>
);

export const HomeView: React.FC = () => {
    const { popularUsers, loading, error, hasMore, loadingMore, fetchPopularUsers, fetchMorePopularUsers } = useHomeStore();
    const { onlineUsers, setSelectedUser, myLocation } = useMapStore();
    const { agoraUserIds } = useAgoraStore();

    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (myLocation && !initialFetchDone.current) {
            fetchPopularUsers();
            initialFetchDone.current = true;
        }
    }, [myLocation, fetchPopularUsers]);

    const observer = useRef<IntersectionObserver | null>(null);
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

        const items: (User | { type: 'ad' })[] = [...sortedUsers];
        // Insert an ad after the 8th item
        if (items.length > 8) {
            items.splice(8, 0, { type: 'ad' });
        }
        return items;
    }, [popularUsers, onlineUsers, agoraUserIds]);


    if (loading && popularUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8 bg-dark-900">
                <div className="w-14 h-14 border-4 border-dashed rounded-full animate-spin border-pink-600 mb-4 opacity-80"></div>
                <h2 className="text-lg font-bold text-slate-300 tracking-wide">Buscando destaques...</h2>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-8 bg-dark-900">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <span className="material-symbols-rounded text-4xl">error_outline</span>
                </div>
                <h2 className="text-xl font-bold text-white">Ops!</h2>
                <p className="mt-2 text-slate-400 max-w-xs">{error}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-dark-900 pb-24">
            <header className="p-5 pb-3 bg-dark-900/90 backdrop-blur-xl sticky top-0 z-10 border-b border-white/5">
                <h1 className="text-2xl font-black text-white tracking-tight font-outfit">Destaques</h1>
                <p className="text-sm text-slate-400 font-medium">Perfis em alta na sua região 🔥</p>
            </header>
            
            <div className="flex-1 overflow-y-auto px-3 pt-3">
                {itemsWithAds.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 p-8">
                        <span className="material-symbols-rounded text-5xl mb-3 text-slate-700">explore_off</span>
                        <h2 className="text-lg font-bold text-slate-300">Nenhum perfil encontrado.</h2>
                        <p className="mt-2 text-sm">Explore o mapa para encontrar mais pessoas.</p>
                    </div>
                ) : (
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
                            const isLastUser = index === itemsWithAds.length - 1;
                            const isAgora = agoraUserIds.includes(user.id);
                            const isPlus = user.subscription_tier === 'plus';
                            
                            return (
                                <div 
                                    ref={isLastUser ? lastUserElementRef : null}
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
                                    
                                    {/* Badges Container - Top Right (z-10 to ensure visibility over overlay) */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                                        {isAgora && (
                                            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full p-1.5 shadow-lg shadow-red-900/50 animate-pulse-fire border border-white/20">
                                                <span className="material-symbols-rounded filled block" style={{ fontSize: '16px' }}>local_fire_department</span>
                                            </div>
                                        )}
                                        {isPlus && !isAgora && (
                                            <div className="bg-yellow-500/90 backdrop-blur-md text-black rounded-full p-1.5 shadow-lg border border-yellow-300/50">
                                                <span className="material-symbols-rounded filled block" style={{ fontSize: '14px' }}>auto_awesome</span>
                                            </div>
                                        )}
                                        {user.can_host && (
                                            <div className="bg-green-600/90 backdrop-blur-md text-white rounded-full p-1.5 shadow-lg border border-green-400/50" title="Tem Local">
                                                <span className="material-symbols-rounded filled block" style={{ fontSize: '14px' }}>home</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-extrabold text-lg truncate leading-none font-outfit drop-shadow-md">{user.username}</h3>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium opacity-90">
                                            {onlineUsers.includes(user.id) && (
                                                <span className="relative flex h-2 w-2 mr-0.5">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            )}
                                            <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">{user.age}</span>
                                            {user.distance_km != null && (
                                                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">
                                                    {user.distance_km < 1 ? `${Math.round(user.distance_km * 1000)}m` : `${user.distance_km.toFixed(0)}km`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
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
