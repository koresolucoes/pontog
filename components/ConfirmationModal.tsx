import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onCancel}>
      <div 
        className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center animate-fade-in-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-pink-900/50 mb-4">
          <span className="material-symbols-outlined text-pink-400">warning</span>
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="mt-2">
          <p className="text-sm text-slate-400">{message}</p>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg px-4 py-2 bg-slate-700 text-base font-medium text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:w-auto sm:text-sm transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:w-auto sm:text-sm transition-colors"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};