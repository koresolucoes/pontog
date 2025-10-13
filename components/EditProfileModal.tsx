import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { XIcon, UploadCloudIcon } from './icons';
import { POSITIONS, HIV_STATUSES } from '../lib/constants';
import { toast } from 'react-hot-toast';

interface EditProfileModalProps {
  onClose: () => void;
}

// Omitindo 'tribes' pois vamos gerenciá-lo como um array de IDs separado
type ProfileFormData = Partial<Omit<Profile, 'tribes'>>;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, updateProfile, updateAvatar } = useAuthStore();
  const { tribes, fetchTribes } = useDataStore();
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [selectedTribeIds, setSelectedTribeIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (tribes.length === 0) {
      fetchTribes();
    }
  }, [tribes, fetchTribes]);

  useEffect(() => {
    if (profile && tribes.length > 0) {
      setFormData({
        username: profile.username || '',
        status_text: profile.status_text || '',
        date_of_birth: profile.date_of_birth || '',
        height_cm: profile.height_cm || undefined,
        weight_kg: profile.weight_kg || undefined,
        position: profile.position || '',
        hiv_status: profile.hiv_status || '',
      });

      // Mapeia os nomes das tribos do perfil para seus IDs correspondentes
      const initialTribeIds = new Set<number>();
      if (profile.tribes) {
        profile.tribes.forEach(tribeName => {
          const tribe = tribes.find(t => t.name === tribeName);
          if (tribe) {
            initialTribeIds.add(tribe.id);
          }
        });
      }
      setSelectedTribeIds(initialTribeIds);
    }
  }, [profile, tribes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };
  
  const handleTribeChange = (tribeId: number) => {
    setSelectedTribeIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tribeId)) {
            newSet.delete(tribeId);
        } else {
            newSet.add(tribeId);
        }
        return newSet;
    });
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value ? parseInt(value) : null }));
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!profile) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('user_uploads')
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast.error('Erro ao enviar avatar.');
      console.error(error);
    } else {
      const updated = await updateAvatar(filePath);
      if (updated) {
        toast.success('Avatar atualizado!');
      }
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateProfile({
        ...formData,
        tribe_ids: Array.from(selectedTribeIds)
    });
    if (success) {
      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } else {
      toast.error('Erro ao atualizar o perfil.');
    }
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>
        
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img src={profile.avatar_url || `https://picsum.photos/seed/${profile.id}/80`} alt="Avatar" className="w-20 h-20 rounded-full object-cover"/>
              <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                {uploading ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : <UploadCloudIcon className="w-8 h-8 text-white"/>}
              </label>
              <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </div>
            <div className="flex-1">
              <label htmlFor="username" className="block text-sm font-medium text-gray-400">Nome de usuário</label>
              <input type="text" name="username" id="username" value={formData.username || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" required />
            </div>
          </div>
          
          <div>
            <label htmlFor="status_text" className="block text-sm font-medium text-gray-400">Texto de status</label>
            <textarea name="status_text" id="status_text" value={formData.status_text || ''} onChange={handleChange} rows={2} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-400">Data de Nascimento</label>
              <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
             <div>
              <label htmlFor="height_cm" className="block text-sm font-medium text-gray-400">Altura (cm)</label>
              <input type="number" name="height_cm" id="height_cm" value={formData.height_cm || ''} onChange={handleNumberChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-400">Peso (kg)</label>
              <input type="number" name="weight_kg" id="weight_kg" value={formData.weight_kg || ''} onChange={handleNumberChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-400">Posição</label>
              <select name="position" id="position" value={formData.position || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                 <option value="">Selecione...</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="hiv_status" className="block text-sm font-medium text-gray-400">Status HIV</label>
              <select name="hiv_status" id="hiv_status" value={formData.hiv_status || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                {HIV_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tribos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tribes.map(tribe => (
                    <label key={tribe.id} className="flex items-center space-x-2 bg-gray-700 p-2 rounded-md cursor-pointer hover:bg-gray-600">
                        <input
                            type="checkbox"
                            checked={selectedTribeIds.has(tribe.id)}
                            onChange={() => handleTribeChange(tribe.id)}
                            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm text-white">{tribe.name}</span>
                    </label>
                ))}
            </div>
          </div>

        </form>
        
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button 
            type="submit"
            form="edit-profile-form"
            disabled={loading}
            className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};