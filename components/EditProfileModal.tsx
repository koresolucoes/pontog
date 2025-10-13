import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useAlbumStore } from '../stores/albumStore';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { XIcon, UploadCloudIcon, TrashIcon } from './icons';
import { POSITIONS, HIV_STATUSES } from '../lib/constants';
import { toast } from 'react-hot-toast';

interface EditProfileModalProps {
  onClose: () => void;
}

type ProfileFormData = Partial<Omit<Profile, 'tribes'>>;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, updateProfile, updateAvatar, updatePublicPhotos } = useAuthStore();
  const { tribes, fetchTribes } = useDataStore();
  const { uploadPhoto } = useAlbumStore(); // Reutilizando a lógica de upload

  const [formData, setFormData] = useState<ProfileFormData>({});
  const [selectedTribeIds, setSelectedTribeIds] = useState<Set<number>>(new Set());
  const [publicPhotoPaths, setPublicPhotoPaths] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tribes.length === 0) fetchTribes();
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
      
      setPublicPhotoPaths((profile.public_photos || []).map(url => url.split('/').slice(-2).join('/')));
      
      const initialTribeIds = new Set<number>();
      if (profile.tribes) {
        profile.tribes.forEach(tribeName => {
          const tribe = tribes.find(t => t.name === tribeName);
          if (tribe) initialTribeIds.add(tribe.id);
        });
      }
      setSelectedTribeIds(initialTribeIds);
    }
  }, [profile, tribes]);

  // Limpa object URLs para evitar memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };
  
  const handleTribeChange = (tribeId: number) => {
    setSelectedTribeIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tribeId)) newSet.delete(tribeId);
        else newSet.add(tribeId);
        return newSet;
    });
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value ? parseInt(value) : null }));
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Preview instantâneo
    const previewUrl = URL.createObjectURL(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    const filePath = await uploadPhoto(file); // Usa a função da albumStore
    if (filePath) {
      await updateAvatar(filePath);
      toast.success('Avatar atualizado!');
    } else {
      toast.error('Erro ao enviar avatar.');
      setAvatarPreview(null); // Remove preview em caso de erro
    }
    setUploadingAvatar(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingGallery(true);
    const filePath = await uploadPhoto(file);
    if (filePath) {
        const newPaths = [...publicPhotoPaths, filePath];
        const success = await updatePublicPhotos(newPaths);
        if (success) {
            toast.success('Foto adicionada à galeria!');
        } else {
            toast.error('Erro ao adicionar foto.');
        }
    } else {
        toast.error('Falha no upload da foto.');
    }
    setUploadingGallery(false);
  };
  
  const handleRemoveGalleryPhoto = async (pathToRemove: string) => {
    const newPaths = publicPhotoPaths.filter(p => p !== pathToRemove);
    const success = await updatePublicPhotos(newPaths);
    if(success) {
        toast.success('Foto removida!');
    } else {
        toast.error('Erro ao remover foto.');
    }
    // Opcional: deletar do storage tbm, mas por simplicidade vamos deixar
  }

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
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>
        
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img src={avatarPreview || profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover"/>
              <div onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                {uploadingAvatar ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : <UploadCloudIcon className="w-8 h-8 text-white"/>}
              </div>
              <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
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
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">Galeria de Fotos Públicas</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
               {(profile.public_photos || []).map((photoUrl, index) => (
                   <div key={index} className="relative group aspect-square">
                       <img src={photoUrl} className="w-full h-full object-cover rounded-lg" />
                       <button type="button" onClick={() => handleRemoveGalleryPhoto(publicPhotoPaths[index])} className="absolute top-1 right-1 bg-red-600/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <TrashIcon className="w-4 h-4" />
                       </button>
                   </div>
               ))}
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery} className="flex flex-col items-center justify-center w-full aspect-square bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 text-gray-400 hover:bg-gray-600 hover:border-pink-500 transition-colors">
                    {uploadingGallery ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : <UploadCloudIcon className="w-8 h-8"/>}
                </button>
                <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input type="date" name="date_of_birth" title="Data de Nascimento" value={formData.date_of_birth || ''} onChange={handleChange} className="bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <input type="number" name="height_cm" placeholder="Altura (cm)" value={formData.height_cm || ''} onChange={handleNumberChange} className="bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <input type="number" name="weight_kg" placeholder="Peso (kg)" value={formData.weight_kg || ''} onChange={handleNumberChange} className="bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <select name="position" value={formData.position || ''} onChange={handleChange} className="bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
               <option value="">Posição...</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select name="hiv_status" value={formData.hiv_status || ''} onChange={handleChange} className="col-span-2 bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
              <option value="">Status HIV...</option>
              {HIV_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tribos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tribes.map(tribe => (
                    <label key={tribe.id} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${selectedTribeIds.has(tribe.id) ? 'bg-pink-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <input type="checkbox" checked={selectedTribeIds.has(tribe.id)} onChange={() => handleTribeChange(tribe.id)} className="hidden" />
                        <span className="text-sm font-semibold">{tribe.name}</span>
                    </label>
                ))}
            </div>
          </div>
        </form>
        
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button type="submit" form="edit-profile-form" disabled={loading} className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};