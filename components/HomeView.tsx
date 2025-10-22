import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useHomeStore } from '../stores/homeStore';
import { useMapStore } from '../stores/mapStore';
import { useAgoraStore } from '../stores/agoraStore';
import { User } from '../types';
import { geocodeLocation } from '../services/geminiService';
import toast from 'react-hot-toast';


const GridLoader: React.FC = () => (
    <>
        {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="relative aspect-square bg-slate-700 animate-pulse"></div>
        ))}
    </>
);

export const HomeView: React.FC = () => {
    const { popularUsers, loading, error, hasMore, loadingMore, fetchPopularUsers, fetchMorePopularUsers } = useHomeStore();
    const { onlineUsers, setSelectedUser, myLocation, simulatedLocation, setSimulatedLocation } = useMapStore();
    const { agoraUserIds } = useAgoraStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (myLocation && !initialFetchDone.current) {
            fetchPopularUsers();
            initialFetchDone.current = true;
        }
    }, [myLocation, fetchPopularUsers]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || isGeocoding) return;

        setIsGeocoding(true);
        const toastId = toast.loading(`Buscando por "${searchQuery}"...`);

        const coords = await geocodeLocation(searchQuery);
        
        setIsGeocoding(false);

        if (coords) {
            const locationName = searchQuery.trim();
            toast.success(`Mostrando perfis perto de ${locationName}.`, { id: toastId });
            setSimulatedLocation({ name: locationName, coords });
            fetchPopularUsers(); 
        } else {
            toast.error(`Não foi possível encontrar a localização "${searchQuery}".`, { id: toastId });
        }
    };

    const handleResetLocation = () => {
        setSearchQuery('');
        setSimulatedLocation(null);
        fetchPopularUsers();
        toast.success('Mostrando perfis perto de você.');
    };

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
            <header className="p-4 space-y-4 relative">
                <div>
                    <h1 className="text-xl font-bold">Destaques</h1>
                    {simulatedLocation ? (
                        <p className="text-sm text-slate-400">
                            Mostrando perfis perto de <span className="font-bold text-pink-400">{simulatedLocation.name}</span>
                        </p>
                    ) : (
                         <p className="text-sm text-slate-400">Perfis populares na sua região.</p>
                    )}
                </div>
                <div className="relative">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por cidade, estado ou país..."
                            className="w-full bg-slate-800 rounded-lg py-2 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                            travel_explore
                         </span>
                         {isGeocoding && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>}
                    </form>
                    {simulatedLocation && (
                        <button onClick={handleResetLocation} className="absolute mt-2 right-0 text-xs text-pink-400 hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined !text-sm">my_location</span>
                            Voltar à minha localização
                        </button>
                    )}
                </div>
            </header>
            
            <div className={`flex-1 overflow-y-auto bg-slate-800 ${simulatedLocation ? 'pt-8' : 'pt-2'}`}>
                {sortedUsers.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                        <h2 className="text-xl font-bold">Nenhum perfil encontrado.</h2>
                        <p className="mt-2">Tente buscar em outro lugar ou explore o mapa.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px content-start">
                        {sortedUsers.map((user, index) => {
                            const isLast = index === sortedUsers.length - 1;
                            const isAgora = agoraUserIds.includes(user.id);
                            const isPlus = user.subscription_tier === 'plus';
                            return (
                                <div 
                                    ref={isLast ? lastUserElementRef : null}
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
