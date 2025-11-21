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
      <header className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-slate-800/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-rounded text-pink-500">photo_library</span>
            Meus Álbuns
        </h2>
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <span className="material-symbols-rounded">close</span>
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-5 space-y-6">
        <form onSubmit={handleCreateAlbum} className="flex gap-2">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Nome do novo álbum"
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
          />
          <button type="submit" className="bg-pink-600 text-white font-bold p-3 rounded-xl hover:bg-pink-700 transition-colors hover:scale-105 active:scale-95">
            <span className="material-symbols-rounded">add</span>
          </button>
        </form>
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : myAlbums.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
                <span className="material-symbols-rounded text-4xl mb-2 opacity-50">folder_open</span>
                <p>Nenhum álbum criado.</p>
            </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {myAlbums.map(album => (
              <div key={album.id} className="relative aspect-square group cursor-pointer rounded-2xl overflow-hidden bg-slate-800 shadow-md hover:shadow-xl transition-all border border-white/5" onClick={() => setSelectedAlbum(album)}>
                {album.private_album_photos && album.private_album_photos.length > 0 ? (
                   <img src={album.private_album_photos[0].photo_path} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                        <span className="material-symbols-rounded text-4xl">image</span>
                    </div>
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                 <div className="absolute bottom-3 left-3 right-3">
                    <span className="font-bold text-white block truncate text-lg leading-tight">{album.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{album.private_album_photos?.length || 0} fotos</span>
                 </div>
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
      <header className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-slate-800/50">
        <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAlbum(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{selectedAlbum.name}</h2>
        </div>
        <button type="button" onClick={() => deleteAlbum(selectedAlbum.id).then(() => setSelectedAlbum(null))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
            <span className="material-symbols-rounded">delete</span>
        </button>
      </header>
       <main className="flex-1 overflow-y-auto p-5">
           <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} className="hidden" disabled={isUploading} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center w-full aspect-square bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-600 text-slate-400 hover:bg-slate-800 hover:border-pink-500 hover:text-pink-500 transition-all group"
                >
                    {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-xs font-bold">Enviando...</span>
                        </>
                    ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-pink-500/20 flex items-center justify-center mb-2 transition-colors">
                             <span className="material-symbols-rounded text-3xl">add_a_photo</span>
                          </div>
                          <span className="text-xs font-bold uppercase">Adicionar</span>
                        </>
                    )}
                </button>
                {selectedAlbum.private_album_photos?.map(photo => (
                    <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm">
                        <img src={photo.photo_path} alt="foto do álbum" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => deletePhotoFromAlbum(photo.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <span className="material-symbols-rounded text-xl block">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
       </main>
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl mx-auto animate-slide-in-up sm:animate-fade-in-up flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] border border-white/10" 
        onClick={(e) => e.stopPropagation()}
      >
        {selectedAlbum ? <AlbumDetailView /> : <MainView />}
      </div>
    </div>
  );
};