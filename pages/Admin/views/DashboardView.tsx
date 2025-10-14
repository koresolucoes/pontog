// pages/Admin/views/DashboardView.tsx
import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../stores/adminStore';

interface Stats {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    dailySignups: number;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="p-3 bg-pink-600/20 rounded-full">
            <span className="material-symbols-outlined text-3xl text-pink-400">{icon}</span>
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


export const DashboardView: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = useAdminStore((state) => state.getToken());

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar estatísticas');
                const data = await response.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="text-center">Carregando dashboard...</div>;
    if (error) return <div className="text-center text-red-500">Erro: {error}</div>;
    if (!stats) return null;

    const formattedRevenue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Usuários" value={stats.totalUsers} icon="group" />
                <StatCard title="Assinantes Ativos" value={stats.activeSubscriptions} icon="star" />
                <StatCard title="Receita Total" value={formattedRevenue} icon="monetization_on" />
                <StatCard title="Cadastros (24h)" value={stats.dailySignups} icon="person_add" />
            </div>
            {/* Futuramente, pode adicionar gráficos aqui */}
        </div>
    );
};
