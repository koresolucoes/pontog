import React, { useState, useRef } from 'react';
import { useAgoraStore } from '../stores/agoraStore';
import { XIcon, UploadCloudIcon, FlameIcon } from './icons';
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
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlameIcon className="w-6 h-6 text-red-500" />
            Ativar Modo Agora
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-4">
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
              className="w-full aspect-video flex flex-col items-center justify-center bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 text-gray-400 hover:bg-gray-600 hover:border-pink-500 transition-colors"
            >
              <UploadCloudIcon className="w-10 h-10" />
              <span className="mt-2 text-sm font-semibold">Escolher uma foto</span>
            </button>
          )}

          <div>
            <label htmlFor="status_text" className="block text-sm font-medium text-gray-300 mb-1">
              O que você busca? (opcional)
            </label>
            <textarea
              id="status_text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              rows={2}
              maxLength={140}
              placeholder="Ex: Alguém pra agora..."
              className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
             <p className="text-right text-xs text-gray-500 mt-1">{statusText.length}/140</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex-shrink-0">
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
