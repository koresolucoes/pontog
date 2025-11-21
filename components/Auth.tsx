import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            if (data.user && !data.session) {
                toast.success("Verifique seu email para confirmar o cadastro.", { duration: 5000 });
            }
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        }
    } catch (err: any) {
        toast.error(err.message || 'Ocorreu um erro.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
            className="w-full h-full object-cover opacity-40"
            alt="Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/80 to-pink-900/20 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-5xl text-white mx-auto shadow-2xl shadow-pink-500/30 mb-4 rotate-3 transform hover:rotate-0 transition-all duration-500">
                G
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg font-outfit">
                Ponto G
            </h1>
            <p className="text-slate-300 mt-1 font-medium text-lg">Direto ao ponto.</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10">
            <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 py-2 px-4 rounded-full text-yellow-400 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-rounded !text-base">18_up_rating</span>
                    <span>Maiores de 18 anos</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3.5 px-4 rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
            >
                <GoogleIcon className="w-6 h-6" />
                <span className="text-base">{loading ? 'Aguarde...' : 'Entrar com Google'}</span>
            </button>

            <div className="my-6 flex items-center w-full">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="px-3 text-xs text-slate-400 font-semibold tracking-widest uppercase">ou email</span>
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Email</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-500 material-symbols-rounded">mail</span>
                        <input 
                            type="email" 
                            placeholder="seu@email.com" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Senha</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-500 material-symbols-rounded">lock</span>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                            required
                            minLength={6}
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-900/30 hover:shadow-pink-600/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                >
                    {loading ? 'Processando...' : (isSignUp ? 'Criar Conta Grátis' : 'Entrar na Conta')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                    {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
                    <span className="text-pink-400 font-bold underline decoration-pink-400/50 hover:decoration-pink-400">
                        {isSignUp ? 'Faça login.' : 'Cadastre-se.'}
                    </span>
                </button>
            </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-500 px-4 leading-relaxed">
          Ao continuar, você confirma que tem mais de 18 anos e concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>

      {/* Features List */}
      <div className="w-full max-w-md mt-8 space-y-3 text-center z-10 animate-fade-in-up hidden sm:block" style={{ animationDelay: '0.2s' }}>
        {features.map((feature, index) => (
            <div key={index} className="flex items-center justify-center gap-3 text-slate-300 bg-slate-900/40 backdrop-blur-md py-2 px-4 rounded-full border border-white/5 inline-flex mx-2 mb-2">
                {/* Fixed: Changed class from material-symbols-outlined to material-symbols-rounded */}
                <span className="material-symbols-rounded text-xl text-pink-400">{feature.icon}</span>
                <span className="font-medium text-sm">{feature.text}</span>
            </div>
        ))}
      </div>
    </div>
  );
};