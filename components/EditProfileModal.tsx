import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useAlbumStore } from '../stores/albumStore';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { XIcon, CameraIcon, UploadCloudIcon, TrashIcon } from './icons';
import { POSITIONS, HIV_STATUSES } from '../lib/constants';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  onClose: () => void;
}

// Helper to get storage path from public URL
const getPathFromUrl = (url: string): string => {
    try {
        const urlObject = new URL(url);
        // Pathname is like /storage/v1/object/public/user_uploads/user_id/file.jpg
        // We want the part after bucket name
        const parts = urlObject.pathname.split('/user_uploads/');
        if (parts.length > 1) {
            return parts[1];
        }
    } catch (e) {
        // Not a full URL, might already be a path
    }
    return url;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, fetchProfile } = useAuthStore();
  const { tribes, fetchTribes } = useDataStore();
  const { uploadPhoto } = useAlbumStore();
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const publicPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
          ...profile,
          tribes: profile.tribes || []
      });
    }
    if (tribes.length === 0) {
        fetchTribes();
    }
  }, [profile, tribes.length, fetchTribes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Handle number inputs that might be cleared
    if (e.target.type === 'number') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTribeToggle = (tribeName: string) => {
    const currentTribes = formData.tribes || [];
    const newTribes = currentTribes.includes(tribeName)
      ? currentTribes.filter(t => t !== tribeName)
      : [...currentTribes, tribeName];
    setFormData(prev => ({ ...prev, tribes: newTribes }));
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;
      
      setLoading(true);
      const toastId = toast.loading('Enviando nova foto de perfil...');
      
      const newAvatarPath = await uploadPhoto(file);

      if (!newAvatarPath) {
          toast.error('Falha ao enviar a foto.', { id: toastId });
          setLoading(false);
          return;
      }
      
      const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarPath })
          .eq('id', profile.id);

      if (updateError) {
          toast.error('Falha ao atualizar o perfil.', { id: toastId });
      } else {
          toast.success('Foto de perfil atualizada!', { id: toastId });
          await fetchProfile(profile as any);
      }
      setLoading(false);
  }

  const handlePublicPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    const toastId = toast.loading('Enviando foto pública...');
    
    const photoPath = await uploadPhoto(file);
    if (!photoPath) {
        toast.error('Falha ao enviar a foto.', { id: toastId });
        setLoading(false);
        return;
    }

    const currentPhotoPaths = (profile.public_photos || []).map(getPathFromUrl);
    const newPublicPhotos = [...currentPhotoPaths, photoPath];
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ public_photos: newPublicPhotos })
      .eq('id', profile.id);

    if (updateError) {
        toast.error('Falha ao adicionar a foto.', { id: toastId });
    } else {
        toast.success('Foto adicionada!', { id: toastId });
        await fetchProfile(profile as any);
    }
    setLoading(false);
  };
  
  const handleRemovePublicPhoto = async (photoUrlToRemove: string) => {
    if (!profile) return;
    setLoading(true);
    const toastId = toast.loading('Removendo foto...');
    
    const photoPathToRemove = getPathFromUrl(photoUrlToRemove);
    const newPublicPhotos = (profile.public_photos || [])
        .map(getPathFromUrl)
        .filter(path => path !== photoPathToRemove);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ public_photos: newPublicPhotos })
      .eq('id', profile.id);
    
    if (updateError) {
        toast.error('Falha ao remover a foto.', { id: toastId });
    } else {
        toast.success('Foto removida!', { id: toastId });
        await fetchProfile(profile as any);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    const toastId = toast.loading('Atualizando perfil...');
    
    // 1. Prepare profile data (exclude non-db fields)
    // FIX: Destructure and remove calculated fields (distance_km, lat, lng) 
    // that do not exist in the 'profiles' table schema. This prevents the API
    // from trying to update non-existent columns, resolving the 400 error.
    const { 
      tribes: formTribes,
      distance_km,
      lat,
      lng,
      ...profileUpdates 
    } = formData;

    const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profile.id);
        
    if (profileError) {
        toast.error('Erro ao atualizar perfil.', { id: toastId });
        console.error(profileError);
        setLoading(false);
        return;
    }
    
    // 2. Update tribes (delete all, then insert new ones)
    const { error: deleteTribesError } = await supabase
        .from('profile_tribes')
        .delete()
        .eq('profile_id', profile.id);
        
    if (deleteTribesError) {
        toast.error('Erro ao atualizar tribos.', { id: toastId });
        setLoading(false);
        return;
    }

    if (formTribes && formTribes.length > 0) {
        const selectedTribeIds = tribes.filter(t => formTribes.includes(t.name)).map(t => t.id);
        const newProfileTribes = selectedTribeIds.map(tribeId => ({
            profile_id: profile.id,
            tribe_id: tribeId,
        }));
        
        const { error: insertTribesError } = await supabase
            .from('profile_tribes')
            .insert(newProfileTribes);
            
        if (insertTribesError) {
            toast.error('Erro ao salvar tribos.', { id: toastId });
            setLoading(false);
            return;
        }
    }
    
    toast.success('Perfil salvo com sucesso!', { id: toastId });
    await fetchProfile(profile as any);
    setLoading(false);
    onClose();
  };

  if (!profile || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img src={profile.avatar_url} alt="Seu perfil" className="w-24 h-24 rounded-full object-cover" />
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-pink-600 p-2 rounded-full text-white hover:bg-pink-700">
                <CameraIcon className="w-5 h-5" />
                <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
              </button>
            </div>
            <div className="flex-1">
               <label htmlFor="username" className="block text-sm font-medium text-gray-300">Nome de usuário</label>
               <input
                 type="text"
                 name="username"
                 id="username"
                 value={formData.username || ''}
                 onChange={handleChange}
                 className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
               />
            </div>
          </div>
          
          <div>
            <label htmlFor="status_text" className="block text-sm font-medium text-gray-300">Texto de status (bio)</label>
            <textarea
              name="status_text"
              id="status_text"
              rows={2}
              value={formData.status_text || ''}
              onChange={handleChange}
              className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-300">Data de Nascimento</label>
              <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth?.split('T')[0] || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
             <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-300">Posição</label>
                <select name="position" id="position" value={formData.position || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option value="">Não informado</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
              <label htmlFor="height_cm" className="block text-sm font-medium text-gray-300">Altura (cm)</label>
              <input type="number" name="height_cm" id="height_cm" value={formData.height_cm || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-300">Peso (kg)</label>
              <input type="number" name="weight_kg" id="weight_kg" value={formData.weight_kg || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="hiv_status" className="block text-sm font-medium text-gray-300">Status HIV</label>
                <select name="hiv_status" id="hiv_status" value={formData.hiv_status || ''} onChange={handleChange} className="mt-1 w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                    {HIV_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-300">Fotos Públicas</h3>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {formData.public_photos?.map(photoUrl => (
                    <div key={photoUrl} className="relative group aspect-square">
                        <img src={photoUrl} alt="Foto pública" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={() => handleRemovePublicPhoto(photoUrl)} className="absolute top-1 right-1 bg-red-600/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                 <button type="button" onClick={() => publicPhotoInputRef.current?.click()} className="flex flex-col items-center justify-center w-full aspect-square bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 text-gray-400 hover:bg-gray-600 hover:border-pink-500 transition-colors">
                    <UploadCloudIcon className="w-8 h-8"/>
                    <input type="file" accept="image/*" ref={publicPhotoInputRef} onChange={handlePublicPhotoUpload} className="hidden" />
                </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300">Minhas Tribos</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {tribes.map(tribe => (
                <button
                  key={tribe.id}
                  type="button"
                  onClick={() => handleTribeToggle(tribe.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    formData.tribes?.includes(tribe.name)
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tribe.name}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end">
          <button onClick={onClose} type="button" className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-600 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} type="submit" disabled={loading} className="bg-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};