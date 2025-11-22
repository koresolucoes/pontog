
import React from 'react';
import { Venue } from '../types';

interface VenueDetailModalProps {
  venue: Venue;
  onClose: () => void;
}

export const VenueDetailModal: React.FC<VenueDetailModalProps> = ({ venue, onClose }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] animate-fade-in p-0 sm:p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto animate-slide-in-up flex flex-col max-h-[90vh] border border-white/10 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Image */}
        <div className="relative h-56 w-full flex-shrink-0">
            <img 
                src={venue.image_url || 'https://placehold.co/600x400/1f2937/ffffff?text=Local'} 
                alt={venue.name} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors border border-white/10">
                <span className="material-symbols-rounded">close</span>
            </button>

            <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase border border-white/10 shadow-lg">
                        {venue.type}
                    </span>
                    {venue.is_partner && (
                        <span className="px-2 py-1 rounded-md bg-yellow-500 text-black text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg">
                            <span className="material-symbols-rounded filled text-[12px]">star</span>
                            Parceiro
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white font-outfit leading-tight shadow-black drop-shadow-lg">{venue.name}</h2>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-900">
            <div className="space-y-6">
                {/* Actions */}
                <div className="flex gap-3">
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-white/10"
                    >
                        <span className="material-symbols-rounded text-pink-500">map</span>
                        Ver Rota
                    </a>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: venue.name,
                                    text: `Confira ${venue.name} no Ponto G!`,
                                    url: window.location.href
                                }).catch(console.error);
                            }
                        }}
                        className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-white/10"
                    >
                        <span className="material-symbols-rounded text-yellow-400">share</span>
                        Compartilhar
                    </button>
                </div>

                {/* Info */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-rounded text-slate-300 text-lg">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Endereço</p>
                            <p className="text-sm text-slate-200 leading-snug">{venue.address}</p>
                        </div>
                    </div>

                    {venue.opening_hours && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-rounded text-slate-300 text-lg">schedule</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Horário</p>
                                <p className="text-sm text-slate-200 leading-snug">{venue.opening_hours}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-rounded text-pink-500">info</span> Sobre
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/30 p-3 rounded-xl border border-white/5">
                        {venue.description || 'Sem descrição disponível.'}
                    </p>
                </div>

                {/* Tags */}
                {venue.tags && venue.tags.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-white mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {venue.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-xs text-slate-300 font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Footer Brand */}
                <div className="pt-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Guia Ponto G</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
