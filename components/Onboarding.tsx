import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAlbumStore } from '../stores/albumStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { calculateAge } from '../lib/utils';

export const Onboarding: React.FC = () => {
    const { profile, completeOnboarding, fetchProfile, signOut } = useAuthStore();
    const { uploadPhoto } = useAlbumStore();
    
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: profile?.username || '',
        date_of_birth: profile?.date_of_birth?.split('T')[0] || '',
        status_text: profile?.status_text || '',
    });
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(profile) {
            setFormData({
                username: profile.username,
                date_of_birth: profile.date_of_birth?.split('T')[0] || '',
                status_text: profile.status_text || '',
            });
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;
      
      const toastId = toast.loading('Enviando foto...');
      const newAvatarPath = await uploadPhoto(file);

      if (!newAvatarPath) {
          toast.error('Falha ao enviar a foto.', { id: toastId });
          return;
      }
      
      const { data, error } = await supabase.from('profiles').update({ avatar_url: newAvatarPath }).eq('id', profile.id).select().single();

      if (error) {
          toast.error('Falha ao atualizar o perfil.', { id: toastId });
      } else {
          toast.success('Ficou ótimo!', { id: toastId });
          setAvatarUrl(data.avatar_url);
          await fetchProfile(profile as any); // Refresh profile data
      }
    }

    const handleSaveProfile = async () => {
        if (!profile) return;
        
        // Validação
        if (!formData.username.trim()) {
            toast.error('Como devemos te chamar?');
            return;
        }
         if (!formData.date_of_birth) {
            toast.error('Qual sua data de nascimento?');
            return;
        }

        // Verificação de Idade (Bloqueio de Menores)
        const age = calculateAge(formData.date_of_birth);
        if (age < 18) {
            toast.error('Acesso bloqueado. O Ponto G é exclusivo para maiores de 18 anos.', {
                icon: '🚫',
                duration: 4000,
                style: {
                    background: '#450a0a',
                    color: '#fecaca',
                    border: '1px solid #ef4444'
                }
            });
            
            // Desconecta o usuário após um breve delay para leitura da mensagem
            setTimeout(() => {
                signOut();
            }, 2000);
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('profiles').update({ ...formData }).eq('id', profile.id);

        if (error) {
            toast.error('Erro ao salvar. Tente novamente.');
            console.error(error);
        } else {
            await fetchProfile(profile as any);
            setStep(4); // Vai para o Guia
        }
        setLoading(false);
    };

    const renderStep = () => {
        switch(step) {
            case 1: return <WelcomeStep onNext={() => setStep(2)} />;
            case 2: return (
                <IdentityStep
                    formData={formData}
                    avatarUrl={avatarUrl}
                    onChange={handleChange}
                    onAvatarClick={() => avatarInputRef.current?.click()}
                    onNext={() => {
                        if (!formData.username.trim()) return toast.error("Escolha um nome.");
                        setStep(3);
                    }}
                />
            );
            case 3: return (
                <DetailsStep 
                    formData={formData}
                    onChange={handleChange}
                    loading={loading}
                    onSave={handleSaveProfile}
                    onBack={() => setStep(2)}
                />
            );
            case 4: return <GuideStep onFinish={completeOnboarding} />;
            default: return <WelcomeStep onNext={() => setStep(2)} />;
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-dark-900 text-white overflow-hidden relative">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
                
                {step > 1 && step < 4 && (
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-2">
                            {[2, 3].map((s) => (
                                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-pink-500' : 'w-4 bg-slate-700'}`}></div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="animate-fade-in-up">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

const WelcomeStep: React.FC<{onNext: () => void}> = ({ onNext }) => (
    <div className="text-center space-y-8">
        <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-500/30 rotate-3 animate-float">
                <span className="font-black text-5xl text-white">G</span>
            </div>
            <div className="absolute -bottom-4 -right-4 text-3xl animate-bounce">👋</div>
        </div>
        
        <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white font-outfit">
                Bem-vindo!
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xs mx-auto">
                Encontros reais, rápidos e diretos. Vamos configurar seu perfil?
            </p>
        </div>

        <button onClick={onNext} className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-transform active:scale-95 shadow-xl">
            Começar
        </button>
    </div>
);

interface IdentityStepProps {
    formData: { username: string };
    avatarUrl: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onAvatarClick: () => void;
    onNext: () => void;
}
const IdentityStep: React.FC<IdentityStepProps> = ({ formData, avatarUrl, onChange, onAvatarClick, onNext }) => (
    <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white font-outfit mb-2">Primeiro, uma foto.</h2>
            <p className="text-slate-400 text-sm">Escolha sua melhor foto de rosto.</p>
        </div>

        <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={onAvatarClick}>
                <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-600 shadow-2xl">
                    <img src={avatarUrl} alt="Seu perfil" className="w-full h-full rounded-full object-cover border-4 border-dark-900 bg-slate-800" />
                </div>
                <div className="absolute bottom-2 right-2 bg-white text-pink-600 p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded text-xl block">photo_camera</span>
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <label htmlFor="username" className="block text-xs font-bold text-slate-500 uppercase ml-2 tracking-wide">Seu Nome / Apelido</label>
            <input 
                type="text" 
                name="username" 
                id="username" 
                value={formData.username} 
                onChange={onChange} 
                placeholder="Ex: Alex"
                className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-lg font-bold text-center" 
            />
        </div>

        <button onClick={onNext} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-900/30 hover:shadow-pink-600/40 transition-all active:scale-95">
            Continuar
        </button>
    </div>
);

interface DetailsStepProps {
    formData: { date_of_birth: string; status_text: string };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    loading: boolean;
    onSave: () => void;
    onBack: () => void;
}
const DetailsStep: React.FC<DetailsStepProps> = ({ formData, onChange, loading, onSave, onBack }) => (
    <div className="space-y-6">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white font-outfit mb-2">Quase lá!</h2>
            <p className="text-slate-400 text-sm">Só mais alguns detalhes.</p>
        </div>

        <div className="space-y-4">
            <div>
                <label htmlFor="date_of_birth" className="block text-xs font-bold text-slate-500 uppercase ml-2 tracking-wide mb-1">Data de Nascimento</label>
                <input 
                    type="date" 
                    name="date_of_birth" 
                    id="date_of_birth" 
                    value={formData.date_of_birth} 
                    onChange={onChange} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-center font-medium appearance-none" 
                />
                <p className="text-[10px] text-slate-500 text-center mt-2">Sua idade será exibida publicamente.</p>
            </div>
            
            <div>
                <label htmlFor="status_text" className="block text-xs font-bold text-slate-500 uppercase ml-2 tracking-wide mb-1">Bio (Opcional)</label>
                <textarea 
                    name="status_text" 
                    id="status_text" 
                    rows={3} 
                    value={formData.status_text} 
                    onChange={onChange} 
                    placeholder="O que você curte? O que procura?" 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none text-sm" 
                />
            </div>
        </div>

        <div className="flex gap-3 pt-4">
            <button onClick={onBack} className="flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-700 transition-colors">
                Voltar
            </button>
            <button onClick={onSave} disabled={loading} className="flex-[2] bg-white text-pink-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Finalizar'}
            </button>
        </div>
    </div>
);

const GuideStep: React.FC<{onFinish: () => void}> = ({ onFinish }) => (
    <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
            <h2 className="text-3xl font-black text-white font-outfit mb-2">Tudo pronto!</h2>
            <p className="text-slate-400">Veja o que você pode fazer:</p>
        </div>

        <div className="space-y-3 flex-1">
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-pink-400 flex-shrink-0">
                    <span className="material-symbols-rounded filled">location_on</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">Radar</h3>
                    <p className="text-xs text-slate-400 leading-snug">Encontre caras próximos no mapa ou na grade.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
                    <span className="material-symbols-rounded filled">local_fire_department</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">Modo Agora</h3>
                    <p className="text-xs text-slate-400 leading-snug">Ative para mostrar que está buscando algo pra já.</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-yellow-400 flex-shrink-0">
                    <span className="material-symbols-rounded filled">auto_awesome</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">Seja Plus</h3>
                    <p className="text-xs text-slate-400 leading-snug">Descubra quem te viu e navegue invisível.</p>
                </div>
            </div>
        </div>

        <button onClick={onFinish} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-900/30 hover:scale-105 transition-transform active:scale-95 text-lg">
            Entrar no Ponto G
        </button>
    </div>
);