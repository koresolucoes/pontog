import React, { useState } from 'react';
import { PrivateAlbum } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface AlbumGalleryModalProps {
  album: PrivateAlbum;
  onClose: () => void;
}

export const AlbumGalleryModal: React.FC<AlbumGalleryModalProps> = ({ album, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const photos = album.private_album_photos;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 p-8 rounded-lg text-center" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">{album.name}</h2>
          <p className="text-gray-400">Este álbum está vazio.</p>
           <button onClick={onClose} className="mt-6 bg-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-700">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      
      <div className="w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full max-w-4xl aspect-video">
            <img src={photos[currentIndex].photo_path} alt={`Foto ${currentIndex + 1} do álbum ${album.name}`} className="w-full h-full object-contain" />
        </div>
      </div>

       <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-10">
            <XIcon className="w-6 h-6" />
        </button>

        {photos.length > 1 && (
        <>
            <button onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors z-10">
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-3 rounded-full hover:bg-black/50 transition-colors z-10">
                <ChevronRightIcon className="w-8 h-8" />
            </button>
        </>
        )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white bg-black/30 px-4 py-2 rounded-lg">
          <p className="font-bold">{album.name}</p>
          <p className="text-sm">{currentIndex + 1} / {photos.length}</p>
      </div>
    </div>
  );
};