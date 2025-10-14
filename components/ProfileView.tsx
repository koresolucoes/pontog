import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePwaStore } from '../stores/pwaStore';
import { useUiStore } from '../stores/uiStore';
import { useNotificationStore } from '../stores/notificationStore';
import { EditProfileModal } from './EditProfileModal';
import { MyAlbumsModal } from './MyAlbumsModal';
import { NotificationType } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ToggleSwitch: React.FC<{
    label: string;
    isChecked: boolean;
    onChange: (enabled: boolean) => void;
    isPremiumFeature?: boolean;
}> = ({ label, isChecked, onChange, isPremiumFeature = false }) => {
    const { user } = useAuthStore();
    const { setSubscriptionModalOpen } = useUiStore();
    const isPlus = user?.subscription_tier === 'plus';

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent click propagation to avoid double-triggering
        e.stopPropagation(); 
        if (isPremiumFeature && !isPlus) {
            setSubscriptionModalOpen(true);
        }
    };

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (isPremiumFeature && !isPlus) {
            setSubscriptionModalOpen(true);
            // prevent the visual switch from toggling
            e.preventDefault(); 
            return;
        }
        onChange(e.target.checked);
    };
    
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 cursor-pointer" onClick={handleContainerClick}>
             <div className="flex items-center gap-2">
                <span className="font-semibold">{label}</span>
                {isPremiumFeature && !isPlus && <span className="material-symbols-outlined !text-sm text-yellow-400">auto_awesome</span>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                    disabled={isPremiumFeature && !isPlus}
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
        </div>
    );
};

export const ProfileView: React.FC = () => {
    const { user, signOut, toggleIncognitoMode } = useAuthStore();
    const { setSubscriptionModalOpen, setDonationModalOpen } = useUiStore();
    const { 
        pushState, 
        checkPushSupport, 
        subscribeToPushNotifications,
        isSubscribing 
    } = usePwaStore();
    const {
        preferences,
        loading: loadingPreferences,
        fetchPreferences,
        updatePreference
    } = useNotificationStore();

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isMyAlbumsOpen, setIsMyAlbumsOpen] = useState(false);

    useEffect(() => {
        checkPushSupport();
    }, [checkPushSupport]);

    useEffect(() => {
        if (pushState === 'granted') {
            fetchPreferences();
        }
    }, [pushState, fetchPreferences]);

    if (!user) return null;

    const renderSubscriptionSection = () => {
        if (user.subscription_tier === 'plus') {
            return (
                <div className="p-4 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 border border-yellow-400/30 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                        <span className="font-bold">Ponto G Plus Ativo</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">Sua assinatura está ativa e você tem acesso a todos os benefícios.</p>
                    {user.subscription_expires_at && (
                        <p className="text-xs text-slate-500 mt-2">Válida até: {format(new Date(user.subscription_expires_at), 'dd/MM/yyyy')}</p>
                    )}
                </div>
            );
        }
        return (
             <div onClick={() => setSubscriptionModalOpen(true)} className="p-4 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">G+</div>
                    <div>
                        <h4 className="font-bold text-white">Upgrade para o Ponto G Plus</h4>
                        <p className="text-sm text-slate-300">Chamados ilimitados, veja quem te chamou e mais!</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderPushSection = () => {
        switch (pushState) {
            case 'granted':
                return (
                    <>
                        <div className="p-3 rounded-lg bg-slate-800">
                           <p className="text-sm text-green-400">Notificações gerais ativadas no seu navegador.</p>
                        </div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-4">Preferências de Notificação</h3>
                        {loadingPreferences ? <p className="text-slate-400 px-3">Carregando...</p> : (
                            <>
                                <ToggleSwitch 
                                    label="Novas Mensagens"
                                    isChecked={preferences.find(p => p.notification_type === 'new_message')?.enabled ?? true}
                                    onChange={(enabled) => updatePreference('new_message', enabled)}
                                />
                                <ToggleSwitch 
                                    label="Novos Chamados (Winks)"
                                    isChecked={preferences.find(p => p.notification_type === 'new_wink')?.enabled ?? true}
                                    onChange={(enabled) => updatePreference('new_wink', enabled)}
                                />
                                <ToggleSwitch 
                                    label="Solicitações de Acesso a Álbuns"
                                    isChecked={preferences.find(p => p.notification_type === 'new_album_request')?.enabled ?? true}
                                    onChange={(enabled) => updatePreference('new_album_request', enabled)}
                                />
                            </>
                        )}
                    </>
                );
            case 'denied':
                return <div className="p-3 rounded-lg bg-slate-800"><p className="text-sm text-red-400">Notificações bloqueadas. Altere nas configurações do seu navegador para gerenciar as preferências.</p></div>;
            case 'unsupported':
                return <div className="p-3 rounded-lg bg-slate-800"><p className="text-sm text-slate-500">Seu navegador não suporta notificações.</p></div>;
            case 'prompt':
            default:
                return (
                    <button 
                        onClick={subscribeToPushNotifications}
                        disabled={isSubscribing}
                        className="w-full text-left p-3 rounded-lg bg-slate-700 text-white font-semibold flex items-center gap-3 hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        {isSubscribing ? 'Ativando...' : 'Ativar Notificações Push'}
                    </button>
                );
        }
    }

    return (
        <>
            <div className="bg-slate-900 min-h-full">
                <div className="p-4 space-y-6">
                    <div className="flex items-center space-x-4">
                        <img src={user.avatar_url} alt={user.username} className="w-16 h-16 rounded-full object-cover" />
                        <div>
                            <p className="text-xl font-bold">{user.username}</p>
                            <p className="text-sm text-slate-400">{user.status_text || 'Sem status'}</p>
                        </div>
                    </div>

                     <div className="space-y-1 pt-4 border-t border-slate-700">
                         <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-2">Assinatura</h3>
                            <div className="p-1">{renderSubscriptionSection()}</div>
                        </div>

                        <div className="space-y-2">
                             <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-4">Conta</h3>
                             <button onClick={() => setIsEditProfileOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-slate-800 font-semibold">Editar Perfil</button>
                            <button onClick={() => setIsMyAlbumsOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-slate-800 font-semibold">Meus Álbuns</button>
                        </div>
                        
                         <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-4">Privacidade</h3>
                            <ToggleSwitch
                                label="Modo Invisível"
                                isChecked={user.is_incognito}
                                onChange={toggleIncognitoMode}
                                isPremiumFeature={true}
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-4">Notificações</h3>
                            <div className="p-1 space-y-2">{renderPushSection()}</div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-slate-500 px-3 pt-4">Sistema</h3>
                             <button onClick={() => setDonationModalOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-slate-800 font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-pink-400">volunteer_activism</span>
                                Apoie o Desenvolvedor
                            </button>
                            <button onClick={signOut} className="w-full text-left p-3 rounded-lg hover:bg-slate-800 font-semibold text-red-400">Sair</button>
                        </div>
                    </div>
                </div>
            </div>
            {isEditProfileOpen && <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}
        </>
    );
};