import React, { useState, useEffect, useRef } from 'react';
import { useAlbumStore } from '../stores/albumStore';
import { PrivateAlbum } from '../types';

interface MyAlbumsModalProps {
  onClose: () => void;
}

export const MyAlbumsModal: React.FC<MyAlbumsModalProps> = ({ onClose }) => {
  const { myAlbums, isLoading, fetchMyAlbums, createAlbum, deleteAlbum, uploadPhoto, addPhotoToAlbum, deletePhotoFromAlbum, isUploading } = useAlbumStore();
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<PrivateAlbum | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyAlbums();
  }, [fetchMyAlbums]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlbumName.trim()) {
      await createAlbum(newAlbumName.trim());
      setNewAlbumName('');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const newPath = await uploadPhoto(file);
    if (newPath) {
        await addPhotoToAlbum(selectedAlbum.id, newPath);
    } else {
        alert('Falha no upload da foto.');
    }
  };
  
  const MainView = () => (
    <>
      <header className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Meus Álbuns Privados</h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <form onSubmit={handleCreateAlbum} className="flex gap-2">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Nome do novo álbum"
            className="flex-1 bg-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button type="submit" className="bg-pink-600 text-white font-semibold p-2 rounded-lg hover:bg-pink-700"><span className="material-symbols-outlined">add_circle</span></button>
        </form>
        {isLoading ? (
          <p className="text-slate-400 text-center">Carregando álbuns...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {myAlbums.map(album => (
              <div key={album.id} className="relative aspect-square group cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                <div className="absolute inset-0 bg-slate-700 rounded-lg flex items-center justify-center text-center p-2">
                  <span className="font-bold text-white">{album.name}</span>
                </div>
                {album.private_album_photos && album.private_album_photos.length > 0 && (
                   <img src={album.private_album_photos[0].photo_path} className="w-full h-full object-cover rounded-lg"/>
                )}
                 <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
                 <div className="absolute bottom-2 left-2 text-white text-xs font-semibold">{album.private_album_photos?.length || 0} fotos</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );

  const AlbumDetailView = () => {
    if (!selectedAlbum) return null;
    return (
     <>
      <header className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => setSelectedAlbum(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
            <h2 className="text-xl font-bold text-white">{selectedAlbum.name}</h2>
        </div>
        <button type="button" onClick={() => deleteAlbum(selectedAlbum.id).then(() => setSelectedAlbum(null))} className="text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-xl">delete</span></button>
      </header>
       <main className="flex-1 overflow-y-auto p-6">
           <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} className="hidden" disabled={isUploading} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedAlbum.private_album_photos?.map(photo => (
                    <div key={photo.id} className="relative group aspect-square">
                        <img src={photo.photo_path} alt="foto do álbum" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={() => deletePhotoFromAlbum(photo.id)} className="absolute top-1 right-1 bg-red-600/70 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined !text-sm">delete</span>
                        </button>
                    </div>
                ))}
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center w-full aspect-square bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 text-slate-400 hover:bg-slate-600 hover:border-pink-500 transition-colors"
                >
                    {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-white"></div>
                          <span className="text-xs mt-2">Enviando...</span>
                        </>
                    ) : (
                        <>
                          <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                          <span className="text-sm mt-2">Adicionar Foto</span>
                        </>
                    )}
                </button>
            </div>
       </main>
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-full sm:h-auto sm:max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {selectedAlbum ? <AlbumDetailView /> : <MainView />}
      </div>
    </div>
  );
};