// pages/Admin/AdminLayout.tsx
import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { DashboardView } from './views/DashboardView';
import { UsersView } from './views/UsersView';
import { PlansView } from './views/PlansView';
import { PaymentsView } from './views/PaymentsView';
import { ReportsView } from './views/ReportsView';

type AdminView = 'dashboard' | 'users' | 'plans' | 'payments' | 'reports';

const NavLink: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            isActive ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        <span>{label}</span>
    </button>
);

export const AdminLayout: React.FC = () => {
    const logout = useAdminStore((state) => state.logout);
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView />;
            case 'users': return <UsersView />;
            case 'plans': return <PlansView />;
            case 'payments': return <PaymentsView />;
            case 'reports': return <ReportsView />;
            default: return <DashboardView />;
        }
    };
    
    const SidebarContent = () => (
         <div className="flex flex-col h-full bg-gray-800">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Ponto G Admin</h2>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavLink icon="dashboard" label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} />
                <NavLink icon="group" label="Usuários" isActive={activeView === 'users'} onClick={() => { setActiveView('users'); setSidebarOpen(false); }} />
                <NavLink icon="sell" label="Planos" isActive={activeView === 'plans'} onClick={() => { setActiveView('plans'); setSidebarOpen(false); }} />
                <NavLink icon="receipt_long" label="Pagamentos" isActive={activeView === 'payments'} onClick={() => { setActiveView('payments'); setSidebarOpen(false); }} />
                <NavLink icon="flag" label="Denúncias" isActive={activeView === 'reports'} onClick={() => { setActiveView('reports'); setSidebarOpen(false); }} />
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={logout} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:bg-gray-700 hover:text-red-300">
                    <span className="material-symbols-outlined">logout</span>
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen">
            {/* Sidebar para desktop */}
            <aside className="hidden md:block w-64 flex-shrink-0">
               <SidebarContent />
            </aside>
            
            {/* Sidebar para mobile (overlay) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
                    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-gray-800 z-50 animate-slide-in-up">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden p-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
                    <h2 className="font-bold">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
                    <button onClick={() => setSidebarOpen(true)} className="p-2">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};
