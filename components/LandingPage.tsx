
import React, { useEffect, useState } from 'react';
import { AdSenseUnit } from './AdSenseUnit';
import { useMapStore } from '../stores/mapStore';
// Removed static data import to rely on store data which comes from DB or fallback
// import { VENUES_DATA } from '../lib/venuesData'; 

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const { venues, fetchVenues } = useMapStore();
  const [locating, setLocating] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);

  // Função auxiliar para descobrir o nome da cidade via API gratuita (OpenStreetMap)
  const fetchCityName = async (lat: number, lng: number) => {
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          // Tenta pegar cidade, vila, município ou estado
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.state;
          if (city) {
              setCityName(city);
          }
      } catch (error) {
          console.error("Erro ao buscar nome da cidade:", error);
      }
  };

  // Inicialização: Tenta pegar localização para personalizar a página
  useEffect(() => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  fetchVenues({ lat: latitude, lng: longitude });
                  fetchCityName(latitude, longitude); // Busca o nome da cidade
                  setLocationAllowed(true);
                  setLocating(false);
              },
              (error) => {
                  console.log("Location for Landing Page denied/error:", error);
                  fetchVenues(); // Busca genérica sem coordenadas
                  setLocating(false);
                  setLocationAllowed(false);
              }
          );
      } else {
          fetchVenues();
          setLocating(false);
      }
  }, [fetchVenues]);

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col font-inter overflow-x-hidden selection:bg-pink-500 selection:text-white">
      
      {/* Navbar Flutuante com Localização */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onEnter}>
                <div className="w-9 h-9 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-pink-900/20">
                    G
                </div>
                <span className="font-outfit font-bold text-lg tracking-tight hidden sm:block">Ponto G</span>
                
                {/* Badge de Localização na Navbar */}
                {cityName && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-white/10 rounded-full animate-fade-in">
                        <span className="material-symbols-rounded text-pink-500 text-sm filled animate-pulse">location_on</span>
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{cityName}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <a href="#guide" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">Guia Local</a>
                <button 
                    onClick={onEnter}
                    className="px-5 py-2 rounded-full bg-white text-dark-950 hover:bg-slate-200 transition-all font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2"
                >
                    Entrar
                    <span className="material-symbols-rounded text-lg">login</span>
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section - Personalizada com a Cidade */}
      <header className="relative pt-32 pb-16 px-6 flex flex-col items-center text-center z-10 overflow-hidden min-h-[85vh] justify-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-8 animate-fade-in-up backdrop-blur-md shadow-xl">
            <span className={`w-2 h-2 rounded-full ${locationAllowed ? 'bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-yellow-500'} animate-pulse`}></span>
            {locationAllowed ? `Localizado: ${cityName || 'Sua Região'}` : 'Ative a localização para ver sua cidade'}
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-outfit tracking-tight mb-6 leading-[1] max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {cityName ? (
                <>
                    A cena gay em<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x">{cityName}.</span>
                </>
            ) : (
                <>
                    Descubra.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x">Conecte-se.</span><br/>
                    Viva.
                </>
            )}
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.2s' }}>
            {cityName 
                ? `Encontros, saunas, festas e os melhores pontos de ${cityName}. Tudo no Ponto G.`
                : "Muito mais que encontros. O Ponto G é o seu radar para as melhores saunas, bares e pessoas interessantes na sua região."
            }
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up w-full justify-center" style={{ animationDelay: '0.3s' }}>
            <button 
                onClick={onEnter}
                className="group relative px-8 py-4 bg-white text-dark-950 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all duration-300 active:scale-95 w-full sm:w-auto shadow-xl shadow-white/10"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    Ver Mapa de {cityName || 'Agora'}
                    <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform filled">map</span>
                </span>
            </button>
            <button 
                onClick={() => document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800/50 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all border border-white/5 w-full sm:w-auto backdrop-blur-md flex items-center justify-center gap-2"
            >
                <span className="material-symbols-rounded text-pink-500">place</span>
                Destaques Locais
            </button>
        </div>
      </header>

      {/* City Guide Section (Location Aware) */}
      <section id="guide" className="py-20 px-6 bg-dark-900 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black font-outfit text-white mb-2 flex items-center gap-3">
                        <span className="material-symbols-rounded text-pink-500 filled text-4xl drop-shadow-lg">hub</span>
                        {locationAllowed ? `Hotspots em ${cityName || 'Sua Área'}` : 'Em Destaque Global'}
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
                        Localizando...
                    </div>
                )}
            </div>

            {venues.length === 0 && !locating ? (
                 <div className="text-center py-12 bg-slate-800/30 rounded-3xl border border-white/5">
                    <span className="material-symbols-rounded text-5xl text-slate-600 mb-4">explore_off</span>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum local cadastrado aqui ainda</h3>
                    <p className="text-slate-400">Seja o primeiro a adicionar um local entrando no app.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues.map((venue) => (
                        <div 
                            key={venue.id}
                            className="group relative bg-slate-800 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-pink-900/20 transition-all duration-500 border border-white/5 transform hover:-translate-y-1"
                            onClick={onEnter}
                        >
                            <div className="relative aspect-[16/10] overflow-hidden">
                                <img 
                                    src={venue.image_url || 'https://placehold.co/600x400/1f2937/ffffff?text=Venue'} 
                                    alt={venue.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wide border border-white/10 shadow-lg">
                                        {venue.type}
                                    </span>
                                    {venue.is_partner && (
                                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1 shadow-lg shadow-yellow-900/20">
                                            <span className="material-symbols-rounded text-[12px] filled">star</span> Top
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 relative">
                                <h3 className="text-2xl font-bold text-white font-outfit mb-2 group-hover:text-pink-500 transition-colors leading-tight">{venue.name}</h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                                    {venue.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <span className="material-symbols-rounded text-pink-500 text-sm">location_on</span>
                                        <span className="truncate max-w-[180px]">{venue.address}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-pink-600 transition-colors text-white">
                                        <span className="material-symbols-rounded text-lg">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-16 p-8 md:p-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] border border-white/5 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4 font-outfit">Sua cidade está no mapa?</h3>
                    <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto leading-relaxed">
                        O Ponto G é construído pela comunidade. Entre agora para cadastrar saunas, bares e pontos de encontro na sua região.
                    </p>
                    <button onClick={onEnter} className="px-8 py-4 bg-white text-dark-950 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg active:scale-95">
                        Adicionar Local
                    </button>
                </div>
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-dark-950 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                        <img 
                            src="https://images.pexels.com/photos/6598517/pexels-photo-6598517.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                            alt="App Interface Mockup" 
                            className="relative rounded-[2rem] shadow-2xl border border-white/10 w-full transform group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        
                        {/* UI Elements Mockup */}
                        <div className="absolute -right-6 top-12 bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 animate-float hidden sm:flex items-center gap-3 max-w-[200px]">
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                                <span className="material-symbols-rounded filled">radar</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Radar</p>
                                <p className="text-sm font-bold text-white">12 pessoas perto</p>
                            </div>
                        </div>

                        <div className="absolute -left-6 bottom-24 bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 animate-float hidden sm:flex items-center gap-3" style={{ animationDelay: '2s' }}>
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                <span className="material-symbols-rounded filled">favorite</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Novo Wink</p>
                                <p className="text-sm font-bold text-white">Alguém te curtiu</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="order-1 md:order-2">
                    <h2 className="text-4xl md:text-5xl font-black font-outfit text-white mb-8 leading-tight">
                        Conexão real.<br/>
                        <span className="text-slate-500">Sem enrolação.</span>
                    </h2>
                    <div className="space-y-8">
                        <div className="flex gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="material-symbols-rounded text-3xl text-red-500 filled">local_fire_department</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Modo Agora</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Ative a chama para mostrar que você está buscando encontros imediatos. Sua foto ganha destaque no topo para quem está perto.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="material-symbols-rounded text-3xl text-purple-500 filled">lock</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Álbuns Privados</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Controle total. Crie galerias secretas e conceda acesso temporário apenas para quem você confia durante o chat.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="material-symbols-rounded text-3xl text-blue-500 filled">flight</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Modo Viajante</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Vai viajar? Mude sua localização para qualquer cidade do mundo e comece a fazer conexões antes mesmo de embarcar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* AdSense Placeholder Area */}
      <div className="max-w-5xl mx-auto w-full py-12 px-6">
         <div className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-30"></div>
            <div className="relative z-10 p-8">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Parceiros</p>
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
                        <div className="w-8 h-8 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-lg flex items-center justify-center font-black text-white text-lg">G</div>
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
                <div className="flex items-center gap-2">
                    <p className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full border border-white/5 text-slate-300">
                        Proibido para menores de 18 anos
                    </p>
                    <span className="material-symbols-rounded text-slate-600 text-lg">18_up_rating</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
