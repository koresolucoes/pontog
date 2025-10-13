import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { XIcon, TrashIcon } from './icons';
import { Profile } from '../types';
import { TRIBES, POSITIONS, HIV_STATUSES } from '../lib/constants';

interface EditProfileModalProps {
  onClose: () => void;
}

const InputField: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        {children}
    </div>
);

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for all profile fields
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [position, setPosition] = useState('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [hivStatus, setHivStatus] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setStatus(profile.status_text || '');
      setDateOfBirth(profile.date_of_birth || '');
      setSelectedTribes(profile.tribes || []);
      setPosition(profile.position || '');
      setHeight(profile.height_cm || '');
      setWeight(profile.weight_kg || '');
      setHivStatus(profile.hiv_status || '');
      setPhotos(profile.public_photos || []);
    }
  }, [profile]);

  const handleTribeChange = (tribe: string) => {
    setSelectedTribes(prev => 
      prev.includes(tribe) ? prev.filter(t => t !== tribe) : [...prev, tribe]
    );
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim() && !photos.includes(newPhotoUrl.trim())) {
      // Basic URL validation
      try {
        new URL(newPhotoUrl.trim());
        setPhotos([...photos, newPhotoUrl.trim()]);
        setNewPhotoUrl('');
      } catch (_) {
        alert('Por favor, insira uma URL válida.');
      }
    }
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setPhotos(photos.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const updates: Partial<Profile> = {
      display_name: displayName,
      status_text: status,
      date_of_birth: dateOfBirth,
      tribes: selectedTribes,
      position: position,
      height_cm: height === '' ? null : Number(height),
      weight_kg: weight === '' ? null : Number(weight),
      hiv_status: hivStatus,
      public_photos: photos,
      updated_at: new Date().toISOString(),
    };

    const success = await updateProfile(updates);
    if (success) {
      setMessage('Perfil atualizado com sucesso!');
      setTimeout(() => onClose(), 1500);
    } else {
      setMessage('Erro ao atualizar o perfil.');
    }
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Seção Sobre Mim */}
            <section>
              <h3 className="text-lg font-semibold text-pink-400 mb-4 border-b border-gray-700 pb-2">Sobre Mim</h3>
              <div className="space-y-4">
                <InputField label="Nome de Exibição" id="displayName">
                    <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </InputField>
                 <InputField label="Status" id="status">
                    <textarea id="status" value={status} onChange={(e) => setStatus(e.target.value)} rows={2} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </InputField>
                <InputField label="Data de Nascimento" id="dob">
                    <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </InputField>
                <InputField label="Tribos" id="tribes">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {TRIBES.map(tribe => (
                      <label key={tribe} className="flex items-center space-x-2 bg-gray-700 p-2 rounded-lg cursor-pointer hover:bg-gray-600">
                        <input type="checkbox" checked={selectedTribes.includes(tribe)} onChange={() => handleTribeChange(tribe)} className="form-checkbox h-5 w-5 rounded bg-gray-800 border-gray-600 text-pink-500 focus:ring-pink-600"/>
                        <span className="text-sm text-gray-200">{tribe}</span>
                      </label>
                    ))}
                  </div>
                </InputField>
              </div>
            </section>
            
            {/* Seção Meu Corpo & Saúde */}
            <section>
                <h3 className="text-lg font-semibold text-pink-400 mb-4 border-b border-gray-700 pb-2">Meu Corpo & Saúde</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Posição" id="position">
                        <select id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="">Não especificado</option>
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </InputField>
                    <InputField label="Status de HIV" id="hivStatus">
                        <select id="hivStatus" value={hivStatus} onChange={(e) => setHivStatus(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                           <option value="">Não especificado</option>
                           {HIV_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </InputField>
                    <InputField label="Altura (cm)" id="height">
                        <input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Ex: 180" className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </InputField>
                    <InputField label="Peso (kg)" id="weight">
                        <input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Ex: 75" className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </InputField>
                </div>
            </section>
            
            {/* Seção Minhas Fotos */}
            <section>
                <h3 className="text-lg font-semibold text-pink-400 mb-4 border-b border-gray-700 pb-2">Minhas Fotos</h3>
                <div className="space-y-3">
                    <p className="text-xs text-gray-400">Adicione URLs para suas fotos públicas. A primeira foto da lista será a sua principal depois do avatar.</p>
                    <div className="flex gap-2">
                        <input type="url" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" className="flex-1 bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                        <button type="button" onClick={handleAddPhoto} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Adicionar</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map(url => (
                            <div key={url} className="relative group">
                                <img src={url} alt="foto do perfil" className="w-full h-24 object-cover rounded-lg" />
                                <button type="button" onClick={() => handleRemovePhoto(url)} className="absolute top-1 right-1 bg-red-600/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </form>
        
        <div className="bg-gray-700/50 px-6 py-4 flex-shrink-0 rounded-b-none sm:rounded-b-2xl flex justify-end items-center space-x-4">
            {message && <p className={`text-sm flex-1 truncate pr-4 ${message.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
            <button
              type="submit"
              form="edit-profile-form"
              disabled={loading}
              className="bg-pink-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </div>
    </div>
  );
};