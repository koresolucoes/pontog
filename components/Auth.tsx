import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GoogleIcon } from './icons';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let authResponse;
      if (isLogin) {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      } else {
        authResponse = await supabase.auth.signUp({ email, password });
        if (!authResponse.error) {
           setMessage('Cadastro realizado! Verifique seu e-mail para confirmação.');
        }
      }
      
      const { error } = authResponse;
      if (error) throw error;

    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redireciona o usuário de volta para a página principal após o login
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Se o login for bem-sucedido, o Supabase cuida do redirecionamento,
    // então não precisamos desativar o 'loading' aqui.
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-4xl text-white mx-auto">
                G
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mt-4">
                Ponto G
            </h1>
            <p className="text-gray-400 mt-2">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}</p>
        </div>
        
        <form onSubmit={handleAuth}>
          <div className="space-y-4">
            <input
              className="w-full bg-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-500"
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full bg-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-500"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mt-6">
            <button
              className="w-full bg-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        {message && <p className="mt-4 text-center text-green-400">{message}</p>}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-500">OU</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <GoogleIcon className="w-5 h-5" />
            <span>Entrar com Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
            }}
            className="font-semibold text-pink-500 hover:underline ml-1"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
};