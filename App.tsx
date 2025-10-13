import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useUiStore, View } from './stores/uiStore';
import { useMapStore } from './stores/mapStore';
import { Auth } from './components/Auth';
import { Map } from './components/Map';
import { UserGrid } from './components/UserGrid';
import { Inbox } from './components/Inbox';
import { ProfileModal } from './components/ProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { MyAlbumsModal } from './components/MyAlbumsModal';
import { ChatWindow } from './components/ChatWindow';
import { MapPinIcon, UsersIcon, InboxIcon, CameraIcon } from './components/icons';

const App: React.FC = () => {
    // State from stores
    const { session, user, loading, signOut } = useAuthStore();
    const { activeView, setActiveView, chatUser, setChatUser } = useUiStore();
    const { 
        selectedUser, 
        setSelectedUser, 
        requestLocationPermission, 
        stopLocationWatch, 
        cleanupRealtime 
    } = useMapStore();

    // Local state for modals
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    // Effect for location and realtime setup/cleanup
    useEffect(() => {
        if (session) {
            requestLocationPermission();
        }

        // Cleanup function
        return () => {
            stopLocationWatch();
            cleanupRealtime();
        };
    }, [session, requestLocationPermission, stopLocationWatch, cleanupRealtime]);

    // Render loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
            </div>
        );
    }
    
    // Render Auth screen if not logged in
    if (!session || !user) {
        return <Auth />;
    }

    // Main app render
    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col antialiased overflow-hidden">
            <Toaster
                position="top-center"
                toastOptions={{
                    className: '',
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
            
            <header className="absolute top-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm z-20 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <img src={user.avatar_url} alt="Seu perfil" className="w-10 h-10 rounded-full object-cover cursor-pointer" onClick={() => setIsEditProfileOpen(true)} />
                    <div>
                        <p className="font-bold text-lg leading-tight">{user.username}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMyAlbumsOpen(true)} className="text-gray-300 hover:text-white">
                        <CameraIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={signOut} className="text-sm bg-pink-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-pink-700">Sair</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-20 pb-20 overflow-y-auto">
                {activeView === 'grid' && <UserGrid />}
                {activeView === 'map' && <Map />}
                {activeView === 'inbox' && <Inbox />}
            </main>
            
            {/* Modals and floating components */}
            {selectedUser && (
                <ProfileModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)}
                    onStartChat={(userToChat) => setChatUser(userToChat)}
                />
            )}

            {chatUser && (
                <ChatWindow 
                    user={{
                        id: chatUser.id,
                        name: chatUser.username,
                        imageUrl: chatUser.avatar_url,
                        last_seen: chatUser.last_seen,
                    }} 
                    onClose={() => setChatUser(null)}
                />
            )}
            
            {isEditProfileOpen && <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 z-20">
                <div className="max-w-md mx-auto grid grid-cols-3 gap-4 p-2">
                   <NavButton 
                        icon={<UsersIcon />} 
                        label="Grade" 
                        isActive={activeView === 'grid'} 
                        onClick={() => setActiveView('grid')}
                    />
                    <NavButton 
                        icon={<MapPinIcon />} 
                        label="Mapa" 
                        isActive={activeView === 'map'} 
                        onClick={() => setActiveView('map')}
                    />
                     <NavButton 
                        icon={<InboxIcon />} 
                        label="Inbox" 
                        isActive={activeView === 'inbox'} 
                        onClick={() => setActiveView('inbox')}
                    />
                </div>
            </nav>
        </div>
    );
};

// Sub-component for navigation buttons
interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive ? 'text-pink-400' : 'text-gray-400 hover:bg-gray-700'
            }`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};

export default App;
