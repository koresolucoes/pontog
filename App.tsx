import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useMapStore } from './stores/mapStore';
import { useUiStore } from './stores/uiStore';
import { Auth } from './components/Auth';
import { Map } from './components/Map';
import { UserGrid } from './components/UserGrid';
import { Inbox } from './components/Inbox';
import { ProfileModal } from './components/ProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { MapPinIcon, UsersIcon, InboxIcon } from './components/icons';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const { session, loading, user } = useAuthStore();
  const { requestLocationPermission, cleanupRealtime, selectedUser, setSelectedUser } = useMapStore();
  const { activeView, setActiveView, chatUser, setChatUser } = useUiStore();
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  useEffect(() => {
    if (session) {
      requestLocationPermission();
    }
    // Cleanup on component unmount or session change
    return () => {
      cleanupRealtime();
    };
  }, [session, requestLocationPermission, cleanupRealtime]);

  if (loading) {
    return (
      <div className="bg-gray-900 w-screen h-screen flex items-center justify-center text-white font-bold">
        Carregando...
      </div>
    );
  }

  if (!session || !user) {
    return <Auth />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'map':
        return <Map />;
      case 'grid':
        return <UserGrid />;
      case 'inbox':
        return <Inbox />;
      default:
        return <UserGrid />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col antialiased md:max-w-7xl md:mx-auto md:shadow-2xl">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'bg-gray-700 text-white shadow-lg rounded-lg',
          style: {
            background: '#374151',
            color: '#fff',
          },
        }}
      />
      
      <header className="hidden md:flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">G</div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                Ponto G
            </h1>
          </div>
          <button 
            onClick={() => setIsEditProfileModalOpen(true)}
            className="flex items-center gap-2 bg-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors z-20"
            aria-label="Editar Perfil"
          >
            <img src={user.avatar_url} alt="Seu perfil" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-semibold text-sm pr-2">{user.username}</span>
          </button>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {renderActiveView()}
         {/* Floating Profile Button for Mobile */}
        <button 
          onClick={() => setIsEditProfileModalOpen(true)}
          className="absolute top-4 left-4 bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-20 md:hidden"
          aria-label="Editar Perfil"
        >
          <img src={user.avatar_url} alt="Seu perfil" className="w-10 h-10 rounded-full object-cover" />
        </button>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="flex-shrink-0 bg-gray-800 border-t border-gray-700 grid grid-cols-3 md:hidden">
        <button
          onClick={() => setActiveView('grid')}
          className={`flex flex-col items-center justify-center p-3 transition-colors ${activeView === 'grid' ? 'text-pink-400' : 'text-gray-400 hover:text-white'}`}
        >
          <UsersIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Grade</span>
        </button>
        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center justify-center p-3 transition-colors ${activeView === 'map' ? 'text-pink-400' : 'text-gray-400 hover:text-white'}`}
        >
          <MapPinIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Mapa</span>
        </button>
        <button
          onClick={() => setActiveView('inbox')}
          className={`flex flex-col items-center justify-center p-3 transition-colors ${activeView === 'inbox' ? 'text-pink-400' : 'text-gray-400 hover:text-white'}`}
        >
          <InboxIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Caixa</span>
        </button>
      </nav>

      {/* Modals and Overlays */}
      {selectedUser && (
        <ProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onStartChat={setChatUser}
        />
      )}

      {isEditProfileModalOpen && (
        <EditProfileModal onClose={() => setIsEditProfileModalOpen(false)} />
      )}

      {chatUser && (
        <ChatWindow 
          user={{
            id: chatUser.id,
            name: chatUser.username,
            imageUrl: chatUser.avatar_url,
            last_seen: chatUser.last_seen
          }} 
          onClose={() => setChatUser(null)} 
        />
      )}
    </div>
  );
};

export default App;
