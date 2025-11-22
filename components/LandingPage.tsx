
import React, { useEffect, useState } from 'react';
import { AdSenseUnit } from './AdSenseUnit';
import { useMapStore } from '../stores/mapStore';
import { PublicMap } from './PublicMap';
import { Coordinates } from '../types';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const { venues, fetchVenues } = useMapStore();
  const [locating, setLocating] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: -23.5505, lng: -46.6333 }); // Default SP

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
                  const coords = { lat: latitude, lng: longitude };
                  setMapCenter(coords);
                  fetchVenues(coords);
                  fetchCityName(latitude, longitude); 
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
                <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">Dúvidas</a>
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

            {/* Mapa Público */}
            <div className="mb-12 animate-fade-in-up">
                <PublicMap 
                    venues={venues} 
                    center={mapCenter} 
                    cityName={cityName} 
                    onVenueClick={onEnter} 
                />
            </div>

            {venues.length === 0 && !locating ? (
                 <div className="text-center py-12 bg-slate-800/30 rounded-3xl border border-white/5">
                    <span className="material-symbols-rounded text-5xl text-slate-600 mb-4">explore_off</span>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum local cadastrado aqui ainda</h3>
                    <p className="text-slate-400">Seja o primeiro a adicionar um local entrando no app.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues.slice(0, 6).map((venue) => (
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

      {/* NEW SECTION: Features & Safety (Content Rich for SEO/AdSense) */}
      <section className="py-20 px-6 bg-dark-950 relative">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Column 1: Features Text */}
                  <div>
                      <span className="text-pink-500 font-bold tracking-widest uppercase text-xs mb-2 block">Segurança & Comunidade</span>
                      <h2 className="text-3xl md:text-4xl font-black font-outfit text-white mb-6 leading-tight">
                          Encontros reais com <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">total discrição.</span>
                      </h2>
                      <p className="text-slate-400 text-lg leading-relaxed mb-8">
                          O Ponto G foi desenhado para a comunidade gay moderna. Priorizamos sua privacidade e segurança enquanto facilitamos conexões autênticas. Sem algoritmos complicados, apenas pessoas e lugares perto de você.
                      </p>
                      
                      <div className="space-y-6">
                          <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-green-400">
                                  <span className="material-symbols-rounded filled text-2xl">verified_user</span>
                              </div>
                              <div>
                                  <h4 className="text-white font-bold text-lg">Segurança em Primeiro Lugar</h4>
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                      Ferramentas de denúncia, bloqueio e verificação de perfil para garantir que sua experiência seja segura e livre de assédio.
                                  </p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-blue-400">
                                  <span className="material-symbols-rounded filled text-2xl">visibility_off</span>
                              </div>
                              <div>
                                  <h4 className="text-white font-bold text-lg">Modo Fantasma e Álbuns Privados</h4>
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                      Controle total sobre quem vê suas fotos e sua localização. Compartilhe acesso apenas com quem você confiar.
                                  </p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-yellow-400">
                                  <span className="material-symbols-rounded filled text-2xl">health_and_safety</span>
                              </div>
                              <div>
                                  <h4 className="text-white font-bold text-lg">Saúde e Bem-Estar</h4>
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                      Incentivamos práticas de sexo seguro e oferecemos campos no perfil para compartilhar seu status de saúde de forma transparente.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Column 2: Visual/Ad Placeholder */}
                  <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                      <span className="material-symbols-rounded text-6xl text-slate-700 mb-6">mobile_friendly</span>
                      <h3 className="text-2xl font-bold text-white mb-4">Baixe o App (PWA)</h3>
                      <p className="text-slate-400 mb-8 max-w-md">
                          Para a melhor experiência, instale o Ponto G na tela inicial do seu celular. Sem downloads pesados, rápido e seguro.
                      </p>
                      <div className="w-full max-w-sm">
                           {/* AdSense Placeholder for High Value Content Area */}
                           <AdSenseUnit
                                client="ca-pub-9015745232467355"
                                slot="3561488011" // Slot quadrado
                                format="rectangle"
                                responsive={true}
                                className="bg-slate-800/50 min-h-[250px] rounded-xl flex items-center justify-center"
                            />
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* NEW SECTION: FAQ (Great for SEO and AdSense Approval) */}
      <section id="faq" className="py-20 px-6 bg-gradient-to-b from-dark-950 to-slate-900 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-black font-outfit text-white mb-4">Perguntas Frequentes</h2>
                  <p className="text-slate-400">Tudo o que você precisa saber para começar.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                          <span className="text-pink-500 material-symbols-rounded text-sm">help</span>
                          O Ponto G é gratuito?
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Sim! O cadastro, visualização do mapa e chat básico são totalmente gratuitos. Oferecemos um plano "Plus" para funcionalidades extras como ver quem te visitou e modo invisível.
                      </p>
                  </div>
                  
                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                          <span className="text-pink-500 material-symbols-rounded text-sm">help</span>
                          Minha localização é exata?
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Para sua segurança, nunca mostramos sua localização exata. Exibimos apenas a distância aproximada em relação a outros usuários.
                      </p>
                  </div>

                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                          <span className="text-pink-500 material-symbols-rounded text-sm">help</span>
                          Como funcionam os Álbuns Privados?
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Você pode carregar fotos sensíveis em álbuns bloqueados. Eles só ficam visíveis para usuários específicos aos quais você conceder acesso durante uma conversa.
                      </p>
                  </div>

                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                          <span className="text-pink-500 material-symbols-rounded text-sm">help</span>
                          Posso usar em qualquer cidade?
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          O Ponto G funciona globalmente via GPS. Além disso, com o modo Viajante (Plus), você pode explorar outras cidades antes mesmo de chegar lá.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* AdSense Placeholder Area Final */}
      <div className="max-w-5xl mx-auto w-full py-12 px-6">
         <div className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-30"></div>
            <div className="relative z-10 p-8">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Publicidade</p>
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
                        <li><a href="#faq" className="hover:text-pink-500 transition-colors">Perguntas Frequentes</a></li>
                        <li><button onClick={onEnter} className="hover:text-pink-500 transition-colors">Entrar / Cadastro</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">Legal</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Termos de Uso</a></li>
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Política de Privacidade</a></li>
                        <li><a href="#" className="hover:text-pink-500 transition-colors">Diretrizes de Comunidade</a></li>
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
