
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
    { value: 'cruising', label: 'Cruising / Pegação' },
    { value: 'cinema', label: 'Cinema' },
    { value: 'shop', label: 'Loja / Sex Shop' },
];

export const SuggestVenueModal: React.FC<SuggestVenueModalProps> = ({ onClose }) => {
  const { myLocation, suggestVenue } = useMapStore();
  const [loading, setLoading] = useState(false);
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
      if (myLocation) {
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
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto animate-slide-in-up flex flex-col max-h-[90vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-slate-800/50 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-rounded filled text-pink-500">add_location_alt</span>
            Sugerir Local
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Gamification Banner */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-yellow-600 to-amber-600 shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-md border border-white/20">
                        <span className="material-symbols-rounded filled text-white text-xl">emoji_events</span>
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-wide mb-1">Ganhe Recompensas</h3>
                        <p className="text-xs text-yellow-50 font-medium leading-relaxed">
                            Indique um point que não está no mapa. Se aprovado, você ganha <span className="font-bold text-white underline">10 Winks Extras</span> ou o badge de <span className="font-bold text-white underline">Explorador</span>!
                        </p>
                    </div>
                </div>
            </div>

            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/50 hover:border-pink-500 transition-all overflow-hidden relative group"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm flex items-center gap-2"><span className="material-symbols-rounded">edit</span> Alterar Foto</span>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-rounded text-3xl text-slate-400 mb-2">add_a_photo</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Foto do Local (Aumenta chances de aprovação)</span>
                    </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Local</label>
                <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Ex: Sauna Paradise" 
                    className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm"
                    required 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
                    <div className="relative">
                        <select 
                            name="type" 
                            value={formData.type} 
                            onChange={handleChange}
                            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm appearance-none"
                        >
                            {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none material-symbols-rounded text-lg">expand_more</span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Localização</label>
                    <div className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-3 py-3 text-slate-400 text-xs flex items-center gap-2" title="Preenchido pelo endereço">
                        <span className="material-symbols-rounded text-base text-pink-500">pin_drop</span>
                        {formData.lat !== 0 ? 'Detectada' : 'Pendente'}
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 relative z-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Busca de Endereço</label>
                <AddressAutocomplete 
                    onSelect={handleAddressSelect} 
                    initialValue={formData.address}
                    placeholder="Digite para buscar (Rua, Cidade...)" 
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
                <textarea 
                    name="description" 
                    rows={3} 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="O que tem de bom lá? Preço? Horário?" 
                    className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 border border-white/5 text-sm resize-none"
                />
            </div>
        </form>

        <div className="p-5 border-t border-white/10 bg-slate-800/30 flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">Cancelar</button>
            <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-pink-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span className="material-symbols-rounded filled text-lg">send</span>
                        Enviar para Ganhar
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
