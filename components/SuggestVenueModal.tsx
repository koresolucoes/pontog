
import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import toast from 'react-hot-toast';
import { VenueType } from '../types';
import { AddressAutocomplete } from './AddressAutocomplete';

interface SuggestVenueModalProps {
  onClose: () => void;
}

const VENUE_TYPES: { value: VenueType; label: string }[] = [
    { value: 'sauna', label: 'Sauna' },
    { value: 'bar', label: 'Bar / Balada' },
    { value: 'club', label: 'Boate' },
    { value: 'cruising', label: 'Cruising' },
    { value: 'cinema', label: 'Cinema' },
    { value: 'shop', label: 'Loja' },
];

export const SuggestVenueModal: React.FC<SuggestVenueModalProps> = ({ onClose }) => {
  const { myLocation, suggestVenue } = useMapStore();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
      name: '',
      type: 'bar' as VenueType,
      address: '',
      description: '',
      lat: myLocation?.lat || 0,
      lng: myLocation?.lng || 0,
  });

  // Se tiver localização inicial, preenche lat/lng (mas não o endereço texto)
  useEffect(() => {
      if (myLocation && formData.lat === 0) {
          setFormData(prev => ({ ...prev, lat: myLocation.lat, lng: myLocation.lng }));
      }
  }, [myLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setPhotoFile(file);
          setPreview(URL.createObjectURL(file));
      }
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
      setFormData(prev => ({
          ...prev,
          address,
          lat,
          lng
      }));
      toast.success('Localização atualizada pelo endereço!');
  };

  const handleUseCurrentLocation = () => {
      setGpsLoading(true);
      if (!navigator.geolocation) {
          toast.error('Geolocalização não suportada.');
          setGpsLoading(false);
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (position) => {
              setFormData(prev => ({
                  ...prev,
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  address: "Minha localização atual (GPS)" // Visual feedback
              }));
              setGpsLoading(false);
              toast.success('Ponto marcado na sua posição atual!');
          },
          (error) => {
              console.error(error);
              toast.error('Erro ao obter GPS. Verifique as permissões.');
              setGpsLoading(false);
          },
          { enableHighAccuracy: true }
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.address) {
          toast.error('Nome e endereço são obrigatórios.');
          return;
      }
      setLoading(true);
      const success = await suggestVenue({
          name: formData.name,
          type: formData.type,
          address: formData.address,
          description: formData.description,
          lat: formData.lat,
          lng: formData.lng,
          tags: [], 
      }, photoFile);

      setLoading(false);
      if (success) {
          toast.success('Enviado! Se aprovado, você ganha recompensas.', { icon: '🏆' });
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-dark-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] animate-fade-in p-0 sm:p-4" onClick={onClose}>
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto animate-slide-in-up flex flex-col h-[90vh] sm:max-h-[85vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-slate-800/50 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-rounded filled text-pink-500">add_location_alt</span>
            Sugerir Local
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Gamification Banner Compact */}
            <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-yellow-600 to-amber-600 shadow-lg flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-md border border-white/20">
                    <span className="material-symbols-rounded filled text-white text-lg">emoji_events</span>
                </div>
                <div>
                    <h3 className="font-black text-white text-xs uppercase tracking-wide">Ganhe Recompensas</h3>
                    <p className="text-[10px] text-yellow-100 leading-tight">
                        Indique um point novo. Se aprovado, ganhe <span className="font-bold text-white">3 Dias de Ponto G Plus (acumulativo)</span>!
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Local</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Ex: Sauna Paradise" 
                        className="w-full bg-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm"
                        required 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
                    <div className="relative">
                        <select 
                            name="type" 
                            value={formData.type} 
                            onChange={handleChange}
                            className="w-full bg-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm appearance-none"
                        >
                            {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none material-symbols-rounded text-lg">expand_more</span>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço / Localização</label>
                <div className="flex gap-2">
                    <div className="flex-1 relative z-20">
                        <AddressAutocomplete 
                            onSelect={handleAddressSelect} 
                            initialValue={formData.address}
                            placeholder="Busque o endereço..." 
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleUseCurrentLocation}
                        disabled={gpsLoading}
                        className="w-12 flex items-center justify-center bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-colors"
                        title="Usar localização atual"
                    >
                        {gpsLoading ? (
                            <span className="material-symbols-rounded text-lg animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-rounded text-lg filled">my_location</span>
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-2 ml-1 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${formData.lat !== 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] text-slate-500">
                        {formData.lat !== 0 ? `Pino marcado: ${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : 'Pino não marcado no mapa'}
                    </span>
                </div>
            </div>

            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[21/9] bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/50 hover:border-pink-500 transition-all overflow-hidden relative group"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm flex items-center gap-2"><span className="material-symbols-rounded">edit</span> Alterar</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-rounded text-2xl text-slate-400">add_a_photo</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tirar Foto ou Galeria</span>
                    </div>
                )}
                {/* accept="image/*" allows choosing between Camera and Gallery on mobile */}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
                <textarea 
                    name="description" 
                    rows={2} 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Detalhes: preço, público, horário..." 
                    className="w-full bg-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm resize-none"
                />
            </div>
        </form>

        <div className="p-5 border-t border-white/10 bg-slate-800/30 flex gap-3 flex-shrink-0 pb-6 sm:pb-5">
            <button onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-600 transition-colors text-sm">Cancelar</button>
            <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-pink-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span className="material-symbols-rounded filled text-base">send</span>
                        Enviar Sugestão
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
