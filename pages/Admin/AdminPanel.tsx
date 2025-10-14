// pages/Admin/AdminPanel.tsx
import React from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { Toaster } from 'react-hot-toast';

export const AdminPanel: React.FC = () => {
    const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated);

    return (
        <div className="bg-gray-900 text-white min-h-screen antialiased">
             <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1f2937', // gray-800
                        color: '#fff',
                        border: '1px solid #374151' // gray-700
                    },
                }}
            />
            {isAdminAuthenticated ? <AdminLayout /> : <AdminLogin />}
        </div>
    );
};
