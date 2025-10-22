import React from 'react';

interface ViewOncePhotoModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ViewOncePhotoModal: React.FC<ViewOncePhotoModalProps> = ({ imageUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70] animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Foto de visualização única" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
    )
};