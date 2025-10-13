import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useMapStore } from './stores/mapStore';
import { useUiStore, View } from './stores/uiStore';
import { Auth } from './components/Auth';
import { Map } from './components/Map';
import { UserGrid } from './components/UserGrid';
import { ProfileModal } from './components/ProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { MapPinIcon, UsersIcon, MessageCircleIcon } from './components/icons';
import { User } from './types';

function App() {
  const { session, loading, profile, signOut } = useAuthStore();
  const { selectedUser, setSelectedUser, requestLocationPermission, stopLocationWatch, cleanupRealtime } = useMapStore();
  const { activeView, setActiveView, chatUser, setChatUser } = useUiStore();
  
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    if (session) {
      requestLocationPermission();
    } else {
      stopLocationWatch();
      cleanupRealtime();
    }
    
    return () => {
        stopLocationWatch();
        cleanupRealtime();
    };
  }, [session, requestLocationPermission, stopLocationWatch, cleanupRealtime]);

  const handleStartChat = (user: User) => {
    setChatUser(user);
  }
  
  const handleSignOut = () => {
    stopLocationWatch();
    cleanupRealtime();
    signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-80 bg-gray-900 border-r border-gray-800 p-4">
        <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-2xl">G</div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Ponto G</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-1 flex space-x-1 mb-4">
          <button onClick={() => setActiveView('map')} className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'map' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <MapPinIcon className="w-5 h-5" />
            <span>Mapa</span>
          </button>
          <button onClick={() => setActiveView('grid')} className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'grid' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <UsersIcon className="w-5 h-5" />
            <span>Grid</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {/* Aqui poderia entrar uma lista de usuários ou conversas */}
        </div>

        <div className="mt-auto">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => setEditProfileOpen(true)}>
                <img src={profile?.avatar_url || `https://picsum.photos/seed/${profile?.id}/40`} alt="Seu perfil" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                    <p className="font-semibold text-white truncate">{profile?.username}</p>
                    <p className="text-xs text-gray-400">Editar Perfil</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-gray-400">
                <MessageCircleIcon className="w-5 h-5 ml-2.5" />
                <div className="flex-1">
                    <p className="font-semibold text-gray-300 truncate">Meus Álbuns</p>
                </div>
            </div>
             <button onClick={handleSignOut} className="w-full mt-2 text-sm text-center font-semibold text-gray-400 hover:text-pink-400 transition-colors py-2">Sair</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 shadow-md z-10">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">G</div>
            </div>
            <div className="flex items-center space-x-3">
                <img src={profile?.avatar_url || `https://picsum.photos/seed/${profile?.id}/40`} alt="Seu perfil" className="w-8 h-8 rounded-full object-cover" onClick={() => setEditProfileOpen(true)} />
                <button onClick={handleSignOut} className="text-sm font-semibold text-gray-400 hover:text-pink-400">Sair</button>
            </div>
        </header>

        <main className="flex-1 relative bg-gray-800">
            {activeView === 'map' ? <Map /> : <UserGrid />}
        </main>
        
        {/* Mobile Navbar */}
        <nav className="md:hidden bg-gray-900 border-t border-gray-800 grid grid-cols-2">
             <button onClick={() => setActiveView('map')} className={`flex flex-col items-center justify-center space-y-1 py-3 text-sm font-semibold transition-colors ${activeView === 'map' ? 'text-pink-500' : 'text-gray-400 hover:bg-gray-800'}`}>
                <MapPinIcon className="w-6 h-6" />
                <span>Mapa</span>
            </button>
            <button onClick={() => setActiveView('grid')} className={`flex flex-col items-center justify-center space-y-1 py-3 text-sm font-semibold transition-colors ${activeView === 'grid' ? 'text-pink-500' : 'text-gray-400 hover:bg-gray-800'}`}>
                <UsersIcon className="w-6 h-6" />
                <span>Grid</span>
            </button>
        </nav>
      </div>


      {selectedUser && (
        <ProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onStartChat={handleStartChat}
        />
      )}

      {isEditProfileOpen && (
        <EditProfileModal onClose={() => setEditProfileOpen(false)} />
      )}

      {chatUser && (
        <ChatWindow 
            user={{...chatUser, imageUrl: chatUser.avatar_url, name: chatUser.username}}
            onClose={() => setChatUser(null)}
        />
      )}
    </div>
  );
}

export default App;