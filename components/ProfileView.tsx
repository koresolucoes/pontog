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
import { BlockedUsersModal } from './BlockedUsersModal';
import { AdSenseUnit } from './AdSenseUnit';

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
        e.stopPropagation(); 
        if (isPremiumFeature && !isPlus) {
            setSubscriptionModalOpen(true);
        }
    };

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (isPremiumFeature && !isPlus) {
            setSubscriptionModalOpen(true);
            e.preventDefault(); 
            return;
        }
        onChange(e.target.checked);
    };
    
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-white/5 cursor-pointer transition-all hover:bg-slate-800/50" onClick={handleContainerClick}>
             <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-200">{label}</span>
                {isPremiumFeature && !isPlus && <span className="material-symbols-rounded filled !text-[16px] text-yellow-400 drop-shadow-sm">auto_awesome</span>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                    disabled={isPremiumFeature && !isPlus}
                />
                <div className="w-12 h-7 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-500/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
        </div>
    );
};

const ActionButton: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'premium';
    subtitle?: string;
}> = ({ icon, label, onClick, variant = 'default', subtitle }) => {
    const baseClasses = "w-full p-4 rounded-2xl border flex items-center justify-between group transition-all active:scale-98";
    const variantClasses = {
        default: "bg-slate-800/30 border-white/5 hover:bg-slate-800/50 text-slate-200",
        danger: "bg-red-500/5 border-red-500/10 hover:bg-red-500/10 text-red-400",
        premium: "bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-yellow-500/20 hover:border-yellow-500/40 text-yellow-400"
    };

    return (
        <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10' : 'bg-slate-700/50'}`}>
                    <span className={`material-symbols-rounded text-2xl ${variant === 'premium' ? 'filled' : ''}`}>{icon}</span>
                </div>
                <div className="text-left">
                    <span className={`font-bold block ${variant === 'default' ? 'text-slate-100' : ''}`}>{label}</span>
                    {subtitle && <span className="text-xs text-slate-500 font-medium">{subtitle}</span>}
                </div>
            </div>
            <span className="material-symbols-rounded text-slate-600 group-hover:text-slate-400 transition-colors">chevron_right</span>
        </button>
    );
}

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
    const [isBlockedUsersModalOpen, setIsBlockedUsersModalOpen] = useState(false);

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
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-3 text-yellow-400 mb-3">
                        <span className="material-symbols-rounded filled text-2xl">auto_awesome</span>
                        <span className="font-black text-lg tracking-wide">PONTO G PLUS</span>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Sua assinatura está ativa. Aproveite todos os benefícios.</p>
                    {user.subscription_expires_at && (
                        <div className="mt-3 inline-block bg-yellow-500/10 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/20">
                            Válida até: {format(new Date(user.subscription_expires_at), 'dd/MM/yyyy')}
                        </div>
                    )}
                </div>
            );
        }
        return (
             <div onClick={() => setSubscriptionModalOpen(true)} className="p-1 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg shadow-pink-900/20 group">
                <div className="bg-slate-900/90 rounded-xl p-4 flex items-center gap-4 h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-lg group-hover:rotate-3 transition-transform">G+</div>
                    <div>
                        <h4 className="font-bold text-white text-lg">Upgrade para Plus</h4>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">Chamados ilimitados, ver quem te viu e mais!</p>
                    </div>
                    <div className="ml-auto text-pink-500">
                        <span className="material-symbols-rounded filled">arrow_forward</span>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderPushSection = () => {
        switch (pushState) {
            case 'granted':
                return (
                    <div className="space-y-3">
                        {loadingPreferences ? <p className="text-slate-400 text-sm p-2">Carregando...</p> : (
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
                                    label="Solicitações de Álbuns"
                                    isChecked={preferences.find(p => p.notification_type === 'new_album_request')?.enabled ?? true}
                                    onChange={(enabled) => updatePreference('new_album_request', enabled)}
                                />
                            </>
                        )}
                    </div>
                );
            case 'denied':
                return <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">Notificações bloqueadas no navegador.</div>;
            case 'unsupported':
                return <div className="p-4 rounded-2xl bg-slate-800/50 text-slate-500 text-sm font-medium text-center">Navegador não suportado.</div>;
            case 'prompt':
            default:
                return (
                    <ActionButton 
                        icon="notifications" 
                        label="Ativar Notificações" 
                        onClick={subscribeToPushNotifications} 
                        subtitle={isSubscribing ? 'Ativando...' : 'Não perca nenhuma mensagem'}
                    />
                );
        }
    }

    return (
        <>
            <div className="bg-dark-900 h-full overflow-y-auto pb-24">
                <header className="relative pb-8 pt-8 px-6 bg-gradient-to-b from-slate-800/50 to-transparent">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-600 shadow-2xl shadow-pink-900/30">
                                <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover border-4 border-dark-900" />
                            </div>
                            <button 
                                onClick={() => setIsEditProfileOpen(true)}
                                className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full border border-white/10 shadow-lg hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-symbols-rounded text-xl block">edit</span>
                            </button>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight font-outfit">{user.username}</h1>
                        <p className="text-slate-400 font-medium mt-1 max-w-xs truncate">{user.status_text || 'Toque para adicionar status'}</p>
                    </div>
                </header>

                <div className="px-4 space-y-8 -mt-4">
                     <section>
                        {renderSubscriptionSection()}
                    </section>

                    <section className="space-y-3">
                         <h3 className="text-xs font-bold uppercase text-slate-500 ml-2 tracking-widest">Conta</h3>
                         <div className="space-y-2">
                            <ActionButton icon="person" label="Editar Perfil" onClick={() => setIsEditProfileOpen(true)} />
                            <ActionButton icon="photo_library" label="Meus Álbuns Privados" onClick={() => setIsMyAlbumsOpen(true)} />
                         </div>
                    </section>
                    
                     <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase text-slate-500 ml-2 tracking-widest">Privacidade</h3>
                        <div className="space-y-2">
                            <ToggleSwitch
                                label="Modo Invisível"
                                isChecked={user.is_incognito}
                                onChange={toggleIncognitoMode}
                                isPremiumFeature={true}
                            />
                            <ActionButton icon="block" label="Usuários Bloqueados" onClick={() => setIsBlockedUsersModalOpen(true)} />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase text-slate-500 ml-2 tracking-widest">Notificações</h3>
                        {renderPushSection()}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase text-slate-500 ml-2 tracking-widest">Sobre</h3>
                         <div className="space-y-2">
                             <ActionButton icon="volunteer_activism" label="Apoie o Projeto" onClick={() => setDonationModalOpen(true)} subtitle="Ajude a manter o app no ar" />
                             
                             <div className="my-4">
                                <AdSenseUnit
                                    client="ca-pub-9015745232467355"
                                    slot="4962199596"
                                    format="auto"
                                    responsive={true}
                                    className="rounded-xl overflow-hidden bg-slate-800/30 min-h-[100px] flex items-center justify-center"
                                />
                            </div>

                            <ActionButton icon="logout" label="Sair da Conta" onClick={signOut} variant="danger" />
                        </div>
                    </section>
                    
                    <div className="text-center pb-8 pt-4">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Ponto G v1.2.0 (Beta)</p>
                    </div>
                </div>
            </div>
            {isEditProfileOpen && <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />}
            {isMyAlbumsOpen && <MyAlbumsModal onClose={() => setIsMyAlbumsOpen(false)} />}
            {isBlockedUsersModalOpen && <BlockedUsersModal onClose={() => setIsBlockedUsersModalOpen(false)} />}
        </>
    );
};