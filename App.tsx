import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useMapStore } from './stores/mapStore';
import { useUiStore } from './stores/uiStore';
import { useDataStore } from './stores/dataStore';
import { useInboxStore } from './stores/inboxStore';
import { Auth } from './components/Auth';
import { Map } from './components/Map';
import { UserGrid } from './components/UserGrid';
import { Inbox } from './components/Inbox';
import { ProfileModal } from './components/ProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ChatWindow } from './components/ChatWindow';
import { MyAlbumsModal } from './components/MyAlbumsModal';
import { MapPinIcon, UsersIcon, InboxIcon, BellIcon } from './components/icons';
import { User } from './types';
import toast, { Toaster } from 'react-hot-toast';

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function App() {
  const { session, loading, profile, signOut } = useAuthStore();
  const { selectedUser, setSelectedUser, requestLocationPermission, stopLocationWatch, cleanupRealtime } = useMapStore();
  const { activeView, setActiveView, chatUser, setChatUser } = useUiStore();
  const { fetchTribes } = useDataStore();
  const { fetchConversations } = useInboxStore();
  
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [isMyAlbumsOpen, setMyAlbumsOpen] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);

  // Core App Logic Effect
  useEffect(() => {
    if (session && profile) {
      requestLocationPermission();
      fetchTribes();
    } else if (!session) {
      stopLocationWatch();
      cleanupRealtime();
    }
    
    return () => {
        stopLocationWatch();
        cleanupRealtime();
    };
  }, [session, profile, requestLocationPermission, stopLocationWatch, cleanupRealtime, fetchTribes]);
  
  // PWA and Notifications Effect
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Register service worker
      navigator.serviceWorker.register('/service-worker.js')
        .then(swReg => {
          console.log('Service Worker is registered', swReg);
          setIsPushLoading(false);
          // Check for existing subscription
          swReg.pushManager.getSubscription()
            .then(subscription => {
              setIsPushSubscribed(!!subscription);
            });
        })
        .catch(error => {
          console.error('Service Worker Error', error);
          setIsPushLoading(false);
        });
    } else {
        setIsPushLoading(false);
    }
  }, []);

  const handleNotificationSubscription = async () => {
    if (isPushLoading || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("Seu navegador não suporta notificações.");
      return;
    }

    if (isPushSubscribed) {
      toast('Você já está inscrito para notificações!', { icon: '🔔' });
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error("Permissão para notificações foi negada.");
      return;
    }

    const swRegistration = await navigator.serviceWorker.ready;
    
    // A chave PÚBLICA VAPID deve ser uma variável de ambiente do frontend
    // FIX: Cast import.meta to any to resolve TypeScript error in environments where `vite/client` types are not loaded.
    const vapidPublicKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        console.error("VAPID public key not found in environment variables.");
        toast.error("Configuração de notificação incompleta.");
        return;
    }
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('User is subscribed:', subscription);
      
      // Pega a sessão atual para obter o token de acesso JWT
      const currentSession = useAuthStore.getState().session;
      if (!currentSession) {
          throw new Error("Usuário não autenticado.");
      }

      // Envia o objeto de inscrição para a Vercel Serverless Function
      const response = await fetch('/api/store-push-subscription', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ subscription_object: subscription }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar a inscrição no servidor.');
      }
      
      toast.success('Inscrito para notificações com sucesso!');
      setIsPushSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe the user or store subscription: ', error);
      toast.error('Falha ao se inscrever para notificações.');
    }
  };

  const handleStartChat = (user: User) => {
    setChatUser(user);
  }
  
  const handleSignOut = () => {
    stopLocationWatch();
    cleanupRealtime();
    signOut();
  }

  const handleCloseChat = () => {
      setChatUser(null);
      fetchConversations();
  }

  const renderActiveView = () => {
    switch(activeView) {
      case 'map': return <Map />;
      case 'grid': return <UserGrid />;
      case 'inbox': return <Inbox />;
      default: return <UserGrid />;
    }
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
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <aside className="hidden md:flex flex-col w-80 bg-gray-900 border-r border-gray-800 p-4">
        <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-2xl">G</div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Ponto G</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-1 flex space-x-1 mb-4">
          <button onClick={() => setActiveView('grid')} className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'grid' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <UsersIcon className="w-5 h-5" />
            <span>Grid</span>
          </button>
          <button onClick={() => setActiveView('map')} className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'map' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <MapPinIcon className="w-5 h-5" />
            <span>Mapa</span>
          </button>
          <button onClick={() => setActiveView('inbox')} className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'inbox' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <InboxIcon className="w-5 h-5" />
            <span>Caixa</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
        </div>

        <div className="mt-auto">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => setEditProfileOpen(true)}>
                <img src={profile?.avatar_url || `https://placehold.co/40x40/1f2937/d1d5db/png?text=G`} alt="Seu perfil" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                    <p className="font-semibold text-white truncate">{profile?.username}</p>
                    <p className="text-xs text-gray-400">Editar Perfil</p>
                </div>
            </div>
            <div onClick={() => setMyAlbumsOpen(true)} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-gray-400">
                <UsersIcon className="w-5 h-5 ml-2.5" />
                <div className="flex-1">
                    <p className="font-semibold text-gray-300 truncate">Meus Álbuns</p>
                </div>
            </div>
            <div onClick={handleNotificationSubscription} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${isPushSubscribed ? 'text-green-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}>
                <BellIcon className="w-5 h-5 ml-2.5" />
                <div className="flex-1">
                    <p className="font-semibold truncate">{isPushSubscribed ? 'Inscrito' : 'Ativar Notificações'}</p>
                </div>
            </div>
             <button onClick={handleSignOut} className="w-full mt-2 text-sm text-center font-semibold text-gray-400 hover:text-pink-400 transition-colors py-2">Sair</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 shadow-md z-10">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">G</div>
            </div>
            <div className="flex items-center space-x-3">
                <img src={profile?.avatar_url || `https://placehold.co/40x40/1f2937/d1d5db/png?text=G`} alt="Seu perfil" className="w-8 h-8 rounded-full object-cover" onClick={() => setEditProfileOpen(true)} />
                <button onClick={handleSignOut} className="text-sm font-semibold text-gray-400 hover:text-pink-400">Sair</button>
            </div>
        </header>

        <main className="flex-1 relative bg-gray-800 z-10">
            {renderActiveView()}
        </main>
        
        <nav className="md:hidden bg-gray-900 border-t border-gray-800 grid grid-cols-3">
             <button onClick={() => setActiveView('grid')} className={`flex flex-col items-center justify-center space-y-1 py-3 text-sm font-semibold transition-colors ${activeView === 'grid' ? 'text-pink-500' : 'text-gray-400 hover:bg-gray-800'}`}>
                <UsersIcon className="w-6 h-6" />
                <span>Grid</span>
            </button>
             <button onClick={() => setActiveView('map')} className={`flex flex-col items-center justify-center space-y-1 py-3 text-sm font-semibold transition-colors ${activeView === 'map' ? 'text-pink-500' : 'text-gray-400 hover:bg-gray-800'}`}>
                <MapPinIcon className="w-6 h-6" />
                <span>Mapa</span>
            </button>
            <button onClick={() => setActiveView('inbox')} className={`flex flex-col items-center justify-center space-y-1 py-3 text-sm font-semibold transition-colors ${activeView === 'inbox' ? 'text-pink-500' : 'text-gray-400 hover:bg-gray-800'}`}>
                <InboxIcon className="w-6 h-6" />
                <span>Caixa</span>
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
      
      {isMyAlbumsOpen && (
        <MyAlbumsModal onClose={() => setMyAlbumsOpen(false)} />
      )}

      {chatUser && (
        <ChatWindow 
            user={{...chatUser, imageUrl: chatUser.avatar_url, name: chatUser.username, last_seen: chatUser.last_seen }}
            onClose={handleCloseChat}
        />
      )}
    </div>
  );
}

export default App;
