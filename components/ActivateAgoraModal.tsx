import React, { useState, useRef } from 'react';
import { useAgoraStore } from '../stores/agoraStore';
import toast from 'react-hot-toast';

interface ActivateAgoraModalProps {
  onClose: () => void;
}

export const ActivateAgoraModal: React.FC<ActivateAgoraModalProps> = ({ onClose }) => {
  const { activateAgoraMode, isActivating } = useAgoraStore();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('A imagem não pode ter mais de 5MB.');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photoFile) {
      toast.error('Por favor, selecione uma foto.');
      return;
    }
    await activateAgoraMode(photoFile, statusText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in p-4 pb-20 sm:pb-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-red-500">local_fire_department</span>
            Ativar Modo Agora
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          
          {photoPreview ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
              <img src={photoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Trocar Foto
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video flex flex-col items-center justify-center bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 text-slate-400 hover:bg-slate-600 hover:border-pink-500 transition-colors"
            >
              <span className="material-symbols-outlined text-5xl">cloud_upload</span>
              <span className="mt-2 text-sm font-semibold">Escolher uma foto</span>
            </button>
          )}

          <div>
            <label htmlFor="status_text" className="block text-sm font-medium text-slate-300 mb-1">
              O que você busca? (opcional)
            </label>
            <textarea
              id="status_text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              rows={2}
              maxLength={140}
              placeholder="Ex: Alguém pra agora..."
              className="w-full bg-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
             <p className="text-right text-xs text-slate-500 mt-1">{statusText.length}/140</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <button 
            onClick={handleSubmit} 
            disabled={isActivating || !photoFile} 
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isActivating ? (
              <>
                <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                Ativando...
              </>
            ) : (
              'Publicar por 1 Hora'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};