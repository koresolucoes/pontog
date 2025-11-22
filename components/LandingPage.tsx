
import React, { useEffect, useState } from 'react';
import { AdSenseUnit } from './AdSenseUnit';
import { useMapStore } from '../stores/mapStore';
import { VENUES_DATA } from '../lib/venuesData';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const { venues, fetchVenues } = useMapStore();
  const [locating, setLocating] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState(false);

  // Inicialização: Tenta pegar localização para personalizar a página
  useEffect(() => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  fetchVenues({ lat: latitude, lng: longitude });
                  setLocationAllowed(true);
                  setLocating(false);
              },
              (error) => {
                  console.log("Location for Landing Page denied/error:", error);
                  fetchVenues(); // Busca genérica
                  setLocating(false);
                  setLocationAllowed(false);
              }
          );
      } else {
          fetchVenues();
          setLocating(false);
      }
  }, [fetchVenues]);

  // Use venues do store se disponíveis, senão usa fallback estático para visual imediato
  const displayVenues = venues.length > 0 ? venues : VENUES_DATA.slice(0, 6);

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col font-inter overflow-x-hidden selection:bg-pink-500 selection:text-white">
      
      {/* Navbar Flutuante */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-lg border-b border-white/5 transition-all">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onEnter}>
                <div className="w-9 h-9 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-pink-900/20">
                    G
                </div>
                <span className="font-outfit font-bold text-lg tracking-tight hidden sm:block">Ponto G</span>
            </div>
            <div className="flex items-center gap-4">
                <a href="#guide" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">Guia da Cidade</a>
                <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">Funcionalidades</a>
                <button 
                    onClick={onEnter}
                    className="px-5 py-2 rounded-full bg-white text-dark-950 hover:bg-slate-200 transition-all font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                    Entrar
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section - Portal Style */}
      <header className="relative pt-32 pb-16 px-6 flex flex-col items-center text-center z-10 overflow-hidden min-h-[80vh] justify-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in-up backdrop-blur-md">
            <span className={`w-1.5 h-1.5 rounded-full ${locationAllowed ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
            {locationAllowed ? 'Localizado na sua região' : 'O Guia LGBTQIA+ Definitivo'}
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-outfit tracking-tight mb-6 leading-[1] max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Descubra.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x">Conecte-se.</span><br/>
            Viva.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.2s' }}>
            Muito mais que encontros. O Ponto G é o seu radar para as melhores saunas, bares, festas e pessoas interessantes na sua região.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up w-full justify-center" style={{ animationDelay: '0.3s' }}>
            <button 
                onClick={onEnter}
                className="group relative px-8 py-4 bg-white text-dark-950 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all duration-300 active:scale-95 w-full sm:w-auto shadow-xl shadow-white/10"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    Explorar Mapa
                    <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">map</span>
                </span>
            </button>
            <button 
                onClick={() => document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800/50 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all border border-white/5 w-full sm:w-auto backdrop-blur-md flex items-center justify-center gap-2"
            >
                Ver Guia Local
                <span className="material-symbols-rounded">arrow_downward</span>
            </button>
        </div>
      </header>

      {/* City Guide Section (Location Aware) */}
      <section id="guide" className="py-20 px-6 bg-dark-900 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black font-outfit text-white mb-2 flex items-center gap-3">
                        <span className="material-symbols-rounded text-pink-500 filled text-4xl">place</span>
                        {locationAllowed ? 'Destaques na sua região' : 'Em Destaque Global'}
                    </h2>
                    <p className="text-slate-400 text-lg">
                        {locationAllowed 
                            ? 'Encontramos estes locais incríveis perto de você.' 
                            : 'Explore os locais mais quentes avaliados pela nossa comunidade.'}
                    </p>
                </div>
                {locating && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        Buscando locais próximos...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayVenues.map((venue) => (
                    <div 
                        key={venue.id}
                        className="group relative bg-slate-800 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-pink-900/20 transition-all duration-500 border border-white/5"
                        onClick={onEnter}
                    >
                        <div className="relative aspect-[16/10] overflow-hidden">
                            <img 
                                src={venue.image_url || 'https://placehold.co/600x400/1f2937/ffffff?text=Venue'} 
                                alt={venue.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide border border-white/10">
                                    {venue.type}
                                </span>
                                {venue.is_partner && (
                                    <span className="bg-yellow-500/90 text-black text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-rounded text-[12px] filled">star</span> Destaque
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-6 relative">
                            <h3 className="text-2xl font-bold text-white font-outfit mb-2 group-hover:text-pink-500 transition-colors">{venue.name}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                                {venue.description}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                    <span className="material-symbols-rounded text-sm">location_on</span>
                                    <span className="truncate max-w-[150px]">{venue.address}</span>
                                </div>
                                <span className="text-pink-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Ver Detalhes <span className="material-symbols-rounded text-sm">arrow_forward</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-12 p-8 bg-slate-800/30 rounded-3xl border border-white/5 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Conheça mais lugares</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
                        Temos centenas de saunas, bares e cinemas cadastrados. Entre para ver o mapa completo e quem está lá agora.
                    </p>
                    <button onClick={onEnter} className="px-6 py-3 bg-white text-dark-950 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Acessar Mapa Completo
                    </button>
                </div>
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-dark-950 relative">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2.5rem] opacity-30 blur-xl animate-pulse"></div>
                        <img 
                            src="https://images.pexels.com/photos/6598517/pexels-photo-6598517.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                            alt="App Interface Mockup" 
                            className="relative rounded-[2rem] shadow-2xl border border-white/10 w-full"
                        />
                        {/* Floating Cards UI Mockup */}
                        <div className="absolute -right-4 top-10 bg-slate-900 p-4 rounded-2xl shadow-xl border border-white/10 animate-float hidden sm:block">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-green-500 filled">radar</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Radar</p>
                                    <p className="text-sm font-bold text-white">12 caras próximos</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-8 bottom-20 bg-slate-900 p-4 rounded-2xl shadow-xl border border-white/10 animate-float hidden sm:block" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3">
                                <img src="https://placehold.co/100x100/db2777/fff?text=A" className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-white">Alex te chamou</p>
                                    <p className="text-xs text-pink-500 font-bold uppercase">Agora mesmo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="order-1 md:order-2">
                    <h2 className="text-4xl md:text-5xl font-black font-outfit text-white mb-6">Conexão em tempo real.</h2>
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center flex-shrink-0 text-pink-500">
                                <span className="material-symbols-rounded text-2xl filled">local_fire_department</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Modo Agora</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Sem enrolação. Ative a chama para mostrar que você está buscando encontros imediatos. Ideal para quem não quer perder tempo.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-500">
                                <span className="material-symbols-rounded text-2xl">lock</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Álbuns Privados</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Controle total sobre suas fotos. Compartilhe álbuns específicos apenas com quem você confia e revogue o acesso quando quiser.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500">
                                <span className="material-symbols-rounded text-2xl">travel_explore</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Modo Viajante</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Planejando uma viagem? Mude sua localização antes de chegar e comece a conversar com os locais antecipadamente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* AdSense Placeholder Area */}
      <div className="max-w-4xl mx-auto w-full py-12 px-6">
         <div className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-30"></div>
            <div className="relative z-10 p-6">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Espaço Publicitário</p>
                <AdSenseUnit
                    client="ca-pub-9015745232467355"
                    slot="4962199596"
                    format="auto"
                    responsive={true}
                    className="min-h-[120px] flex items-center justify-center"
                />
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-dark-950 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-outfit font-black text-2xl text-white">Ponto G</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed max-w-xs">
                        A plataforma mais completa para encontros e estilo de vida gay. Conectando pessoas e lugares de forma autêntica e segura.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Mapa do Site</h4>
                    <ul className="space-y-2">
                        <li><a href="#guide" className="hover:text-pink-500 transition-colors">Guia da Cidade</a></li>
                        <li><a href="#features" className="hover:text-pink-500 transition-colors">Funcionalidades</a></li>
                        <li><button onClick={onEnter} className="hover:text-pink-500 transition-colors">Entrar / Cadastro</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Legal</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Termos de Uso</a></li>
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Política de Privacidade</a></li>
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Contato</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs opacity-50">© 2024 Ponto G. Todos os direitos reservados.</p>
                <p className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full border border-white/5 text-slate-300">
                    Proibido para menores de 18 anos
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};
