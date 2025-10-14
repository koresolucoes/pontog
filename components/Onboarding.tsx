import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAlbumStore } from '../stores/albumStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const Onboarding: React.FC = () => {
    const { profile, completeOnboarding, fetchProfile } = useAuthStore();
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
          toast.success('Foto de perfil atualizada!', { id: toastId });
          setAvatarUrl(data.avatar_url);
          await fetchProfile(profile as any); // Refresh profile data
      }
    }

    const handleSaveProfile = async () => {
        if (!profile) return;
        
        // Validação
        if (!formData.username.trim()) {
            toast.error('O nome de usuário é obrigatório.');
            return;
        }
         if (!formData.date_of_birth) {
            toast.error('A data de nascimento é obrigatória.');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Salvando perfil...');
        const { error } = await supabase.from('profiles').update({ ...formData }).eq('id', profile.id);

        if (error) {
            toast.error('Erro ao salvar o perfil.', { id: toastId });
            console.error(error);
        } else {
            toast.success('Perfil salvo!', { id: toastId });
            await fetchProfile(profile as any);
            setStep(3);
        }
        setLoading(false);
    };

    const renderStep = () => {
        switch(step) {
            case 1: return <WelcomeStep onNext={() => setStep(2)} />;
            case 2: return (
                <ProfileStep
                    formData={formData}
                    avatarUrl={avatarUrl}
                    loading={loading}
                    onChange={handleChange}
                    onAvatarClick={() => avatarInputRef.current?.click()}
                    onSave={handleSaveProfile}
                />
            );
            case 3: return <GuideStep onFinish={completeOnboarding} />;
            default: return <WelcomeStep onNext={() => setStep(2)} />;
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-900 text-white">
            <div className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/10 animate-fade-in-up">
                <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <StepIndicator currentStep={step} stepNumber={1} />
                        <StepIndicator currentStep={step} stepNumber={2} />
                        <StepIndicator currentStep={step} stepNumber={3} />
                    </div>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

const StepIndicator: React.FC<{currentStep: number, stepNumber: number}> = ({ currentStep, stepNumber }) => (
    <div className={`w-10 h-2 rounded-full transition-colors ${currentStep >= stepNumber ? 'bg-pink-500' : 'bg-slate-600'}`}></div>
);

const WelcomeStep: React.FC<{onNext: () => void}> = ({ onNext }) => (
    <div className="text-center">
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Bem-vindo ao Ponto G!
        </h1>
        <p className="text-slate-300 mt-4">Encontros gays, sem enrolação.</p>
        <p className="text-slate-400 mt-4 text-sm">Vamos configurar seu perfil rapidamente para você começar a se conectar.</p>
        <button onClick={onNext} className="w-full mt-8 bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors">
            Começar
        </button>
    </div>
);

interface ProfileStepProps {
    formData: { username: string; date_of_birth: string; status_text: string };
    avatarUrl: string;
    loading: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onAvatarClick: () => void;
    onSave: () => void;
}
const ProfileStep: React.FC<ProfileStepProps> = ({ formData, avatarUrl, loading, onChange, onAvatarClick, onSave }) => (
    <div>
        <h2 className="text-2xl font-bold text-center mb-6">Configure seu Perfil</h2>
        <div className="flex justify-center mb-6">
            <div className="relative">
                <img src={avatarUrl} alt="Seu perfil" className="w-28 h-28 rounded-full object-cover border-4 border-slate-700" />
                <button onClick={onAvatarClick} className="absolute bottom-0 right-0 bg-pink-600 p-2 rounded-full text-white hover:bg-pink-700">
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                </button>
            </div>
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300">Nome de usuário</label>
                <input type="text" name="username" id="username" value={formData.username} onChange={onChange} className="mt-1 w-full bg-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-300">Data de Nascimento</label>
                <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth} onChange={onChange} className="mt-1 w-full bg-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
             <div>
                <label htmlFor="status_text" className="block text-sm font-medium text-slate-300">Bio (opcional)</label>
                <textarea name="status_text" id="status_text" rows={2} value={formData.status_text} onChange={onChange} placeholder="O que você procura?" className="mt-1 w-full bg-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
        </div>
         <button onClick={onSave} disabled={loading} className="w-full mt-8 bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
        </button>
    </div>
);

const GuideStep: React.FC<{onFinish: () => void}> = ({ onFinish }) => (
    <div>
        <h2 className="text-2xl font-bold text-center mb-6">Como Funciona</h2>
        <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
                <span className="material-symbols-outlined text-3xl text-pink-400">travel_explore</span>
                <div>
                    <h3 className="font-bold text-white">Mapa</h3>
                    <p className="text-slate-300">Veja quem está online e perto de você em tempo real.</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
                <span className="material-symbols-outlined text-3xl text-pink-400">grid_view</span>
                <div>
                    <h3 className="font-bold text-white">Grade</h3>
                    <p className="text-slate-300">Explore uma grade de perfis próximos a você.</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
                <span className="material-symbols-outlined text-3xl text-red-500">local_fire_department</span>
                <div>
                    <h3 className="font-bold text-white">Agora</h3>
                    <p className="text-slate-300">Ative para se destacar e mostrar que busca algo pra já!</p>
                </div>
            </div>
        </div>
        <button onClick={onFinish} className="w-full mt-8 bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors">
            Vamos lá!
        </button>
    </div>
);