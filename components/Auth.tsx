import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.356-11.303-7.918l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.856 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const features = [
    { icon: "location_on", text: "Encontre caras perto de você" },
    { icon: "bolt", text: "Conexões rápidas e diretas" },
    { icon: "admin_panel_settings", text: "Discreto e 100% anônimo" }
];

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 auth-background text-white">
      <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 animate-fade-in-up">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                Ponto G
            </h1>
            <p className="text-slate-300 mt-2 font-semibold">Encontros gays. Sem enrolação.</p>
        </div>
        
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            <GoogleIcon className="w-6 h-6" />
            <span className="text-base">{loading ? 'Aguarde...' : 'Entrar com Google'}</span>
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        
        <p className="mt-8 text-center text-xs text-slate-400">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>

      <div className="w-full max-w-md mt-8 space-y-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {features.map((feature, index) => (
            <div key={index} className="flex items-center justify-center gap-3 text-slate-300">
                <span className="material-symbols-outlined text-xl text-pink-400">{feature.icon}</span>
                <span className="font-medium">{feature.text}</span>
            </div>
        ))}
      </div>
    </div>
  );
};
