
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useAlbumStore } from '../stores/albumStore';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { POSITIONS, HIV_STATUSES, KINKS } from '../lib/constants';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  onClose: () => void;
}

const getPathFromUrl = (url: string): string => {
    try {
        const urlObject = new URL(url);
        const parts = urlObject.pathname.split('/user_uploads/');
        if (parts.length > 1) return parts[1];
    } catch (e) { /* Not a full URL */ }
    return url;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, fetchProfile } = useAuthStore();
  const { tribes, fetchTribes } = useDataStore();
  const { uploadPhoto } = useAlbumStore(); // Reusing uploadPhoto since it handles generic file upload
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const publicPhotoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({ 
          ...profile, 
          tribes: profile.tribes || [],
          kinks: profile.kinks || [],
          can_host: profile.can_host || false
      });
    }
    if (tribes.length === 0) fetchTribes();
  }, [profile, tribes.length, fetchTribes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

  const handleKinkToggle = (kink: string) => {
    const currentKinks = formData.kinks || [];
    const newKinks = currentKinks.includes(kink)
        ? currentKinks.filter(k => k !== kink)
        : [...currentKinks, kink];
    setFormData(prev => ({ ...prev, kinks: newKinks }));
  }
  
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
      
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: newAvatarPath }).eq('id', profile.id);

      if (updateError) {
          toast.error('Falha ao atualizar o perfil.', { id: toastId });
      } else {
          toast.success('Foto de perfil atualizada!', { id: toastId });
          await fetchProfile(profile as any);
      }
      setLoading(false);
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
          toast.error('Vídeo muito grande (Max 20MB).');
          return;
      }

      setLoading(true);
      const toastId = toast.loading('Enviando vídeo de apresentação...');

      const videoPath = await uploadPhoto(file); // Reuse upload mechanism
      if (!videoPath) {
          toast.error('Falha ao enviar o vídeo.', { id: toastId });
          setLoading(false);
          return;
      }

      const { error: updateError } = await supabase.from('profiles').update({ video_url: videoPath }).eq('id', profile.id);

      if (updateError) {
          toast.error('Falha ao salvar o vídeo.', { id: toastId });
      } else {
          toast.success('Vídeo adicionado!', { id: toastId });
          await fetchProfile(profile as any);
      }
      setLoading(false);
  };

  const handleRemoveVideo = async () => {
      if (!profile) return;
      setLoading(true);
      const { error } = await supabase.from('profiles').update({ video_url: null }).eq('id', profile.id);
      if (error) {
          toast.error('Erro ao remover vídeo.');
      } else {
          toast.success('Vídeo removido.');
          await fetchProfile(profile as any);
      }
      setLoading(false);
  };

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
    
    const { error: updateError } = await supabase.from('profiles').update({ public_photos: newPublicPhotos }).eq('id', profile.id);

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
    const newPublicPhotos = (profile.public_photos || []).map(getPathFromUrl).filter(path => path !== photoPathToRemove);

    const { error: updateError } = await supabase.from('profiles').update({ public_photos: newPublicPhotos }).eq('id', profile.id);
    
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
    
    // Validation: Heuristic #5 (Error Prevention)
    if (formData.height_cm && (formData.height_cm < 50 || formData.height_cm > 250)) {
        toast.error('Altura inválida. Por favor, insira um valor entre 50cm e 250cm.');
        return;
    }
    if (formData.weight_kg && (formData.weight_kg < 30 || formData.weight_kg > 300)) {
        toast.error('Peso inválido. Por favor, insira um valor entre 30kg e 300kg.');
        return;
    }

    setLoading(true);
    const toastId = toast.loading('Atualizando perfil...');
    
    const { tribes: formTribes, distance_km, lat, lng, video_url, is_traveling, ...profileUpdates } = formData;

    const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', profile.id);
        
    if (profileError) {
        toast.error('Erro ao atualizar perfil.', { id: toastId });
        console.error(profileError);
        setLoading(false);
        return;
    }
    
    await supabase.from('profile_tribes').delete().eq('profile_id', profile.id);
        
    if (formTribes && formTribes.length > 0) {
        const selectedTribeIds = tribes.filter(t => formTribes.includes(t.name)).map(t => t.id);
        const newProfileTribes = selectedTribeIds.map(tribeId => ({ profile_id: profile.id, tribe_id: tribeId }));
        
        await supabase.from('profile_tribes').insert(newProfileTribes);
    }
    
    toast.success('Perfil salvo com sucesso!', { id: toastId });
    await fetchProfile(profile as any);
    setLoading(false);
    onClose();
  };

  if (!profile || !formData) return null;

  // Updated InputField to accept generic props like min, max, maxLength etc.
  const InputField = ({ label, name, type = "text", value, onChange, placeholder = "", ...rest }: any) => (
      <div className="space-y-1.5">
          <label htmlFor={name} className="block text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wide">{label}</label>
          <input 
              type={type} 
              name={name} 
              id={name} 
              value={value || ''} 
              onChange={onChange} 
              placeholder={placeholder}
              className="w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-sm text-sm font-medium" 
              {...rest}
          />
      </div>
  );

  const SelectField = ({ label, name, value, onChange, options }: any) => (
      <div className="space-y-1.5">
          <label htmlFor={name} className="block text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wide">{label}</label>
          <div className="relative">
            <select 
                name={name} 
                id={name} 
                value={value || ''} 
                onChange={onChange} 
                className="w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-sm text-sm font-medium"
            >
                {options.map((opt: string) => <option key={opt} value={opt === 'Não informado' ? '' : opt} className="bg-slate-800">{opt}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none material-symbols-rounded text-xl">expand_more</span>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
        <header className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-slate-800/50 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-rounded text-pink-500 filled">edit_square</span>
              Editar Perfil
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <span className="material-symbols-rounded">close</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-600">
                      <img src={profile.avatar_url} alt="Seu perfil" className="w-full h-full rounded-full object-cover border-4 border-slate-800" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-rounded text-white text-3xl">photo_camera</span>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-slate-700 text-white p-1.5 rounded-full shadow-lg border border-slate-600">
                    <span className="material-symbols-rounded text-base block">edit</span>
                  </div>
                  <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
                </div>
                
                <div className="flex-1 w-full space-y-3">
                   <InputField label="Nome de usuário" name="username" value={formData.username} onChange={handleChange} />
                   <div className="space-y-1.5">
                        <label htmlFor="status_text" className="block text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wide">Bio</label>
                        <textarea 
                            name="status_text" 
                            id="status_text" 
                            rows={2} 
                            value={formData.status_text || ''} 
                            onChange={handleChange} 
                            className="w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all resize-none text-sm" 
                        />
                   </div>
                </div>
              </div>

              {/* Video Presentation Section */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <span className="material-symbols-rounded text-pink-500 filled">videocam</span> Vídeo de Apresentação
                      </h3>
                      {profile.video_url && (
                          <button type="button" onClick={handleRemoveVideo} className="text-xs text-red-400 hover:text-red-300 font-bold">
                              Remover Vídeo
                          </button>
                      )}
                  </div>
                  
                  {profile.video_url ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black group">
                          <video src={profile.video_url} className="w-full h-full object-cover" controls />
                          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-bold">
                              Video Ativo
                          </div>
                      </div>
                  ) : (
                      <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:border-pink-500 transition-all gap-2">
                          <span className="material-symbols-rounded text-4xl">upload_file</span>
                          <span className="text-sm font-bold">Carregar Vídeo (Max 15s)</span>
                      </button>
                  )}
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" />
              </div>

              {/* Logistics Switch */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.can_host ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          <span className="material-symbols-rounded filled text-xl">home</span>
                      </div>
                      <div>
                          <span className="font-bold text-white block text-sm">Tenho Local (Hoster)</span>
                          <span className="text-xs text-slate-400">Pode receber visitas?</span>
                      </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.can_host || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, can_host: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Data de Nascimento" name="date_of_birth" type="date" value={formData.date_of_birth?.split('T')[0]} onChange={handleChange} />
                <SelectField label="Posição" name="position" value={formData.position} onChange={handleChange} options={['Não informado', ...POSITIONS]} />
                <InputField label="Altura (cm)" name="height_cm" type="number" value={formData.height_cm} onChange={handleChange} min="50" max="250" />
                <InputField label="Peso (kg)" name="weight_kg" type="number" value={formData.weight_kg} onChange={handleChange} min="30" max="300" />
                <div className="col-span-2">
                    <SelectField label="Status HIV" name="hiv_status" value={formData.hiv_status} onChange={handleChange} options={HIV_STATUSES} />
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center gap-2 tracking-wide ml-1">
                    <span className="material-symbols-rounded text-pink-500 filled text-base">photo_library</span> Fotos Públicas
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {formData.public_photos?.map(photoUrl => (
                        <div key={photoUrl} className="relative group aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-white/10">
                            <img src={photoUrl} alt="Foto pública" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <button type="button" onClick={() => handleRemovePublicPhoto(photoUrl)} className="absolute top-1 right-1 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-rounded text-base block">close</span>
                            </button>
                        </div>
                    ))}
                     <button type="button" onClick={() => publicPhotoInputRef.current?.click()} className="flex flex-col items-center justify-center w-full aspect-[3/4] bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:bg-slate-800 hover:border-pink-500 hover:text-pink-500 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-pink-500/20 flex items-center justify-center mb-1 transition-colors">
                            <span className="material-symbols-rounded text-2xl">add</span>
                        </div>
                        <input type="file" accept="image/*" ref={publicPhotoInputRef} onChange={handlePublicPhotoUpload} className="hidden" />
                    </button>
                </div>
              </div>

              {/* Kinks Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center gap-2 tracking-wide ml-1">
                    <span className="material-symbols-rounded text-purple-500 filled text-base">interests</span> Preferências e Kinks
                </h3>
                <div className="flex flex-wrap gap-2 bg-slate-800/30 p-4 rounded-2xl border border-white/5 max-h-64 overflow-y-auto">
                  {KINKS.map(kink => (
                    <button
                      key={kink}
                      type="button"
                      onClick={() => handleKinkToggle(kink)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                        formData.kinks?.includes(kink)
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {kink}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center gap-2 tracking-wide ml-1">
                    <span className="material-symbols-rounded text-pink-500 filled text-base">groups</span> Minhas Tribos
                </h3>
                <div className="flex flex-wrap gap-2 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  {tribes.map(tribe => (
                    <button
                      key={tribe.id}
                      type="button"
                      onClick={() => handleTribeToggle(tribe.name)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                        formData.tribes?.includes(tribe.name)
                          ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {tribe.name}
                    </button>
                  ))}
                </div>
              </div>
            </form>
        </main>

        <footer className="p-5 border-t border-white/10 bg-slate-800/50 rounded-b-3xl flex-shrink-0 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-6 py-3.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
            Cancelar
          </button>
          <button 
            form="edit-profile-form" 
            type="submit" 
            disabled={loading} 
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-lg hover:shadow-pink-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                </>
            ) : (
                <span>Salvar Alterações</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
