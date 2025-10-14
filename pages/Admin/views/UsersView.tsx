// pages/Admin/views/UsersView.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '../../../stores/adminStore';
import { Profile } from '../../../types';
import { format } from 'date-fns';

export const UsersView: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const token = useAdminStore((state) => state.getToken());
    
    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 15;


    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha ao buscar usuários');
                }
                const data = await response.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [token]);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    // Lógica da paginação
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading) return <div className="text-center">Carregando usuários...</div>;
    if (error) return <div className="text-center text-red-500">Erro: {error}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gerenciamento de Usuários</h1>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nome de usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm bg-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Assinatura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Última Atualização</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {currentUsers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt={user.username} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-white">{user.username}</div>
                                            <div className="text-sm text-gray-400">{user.display_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscription_tier === 'plus' ? 'bg-green-100 text-green-800' : 'bg-gray-600 text-gray-200'}`}>
                                        {user.subscription_tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {format(new Date(user.updated_at), 'dd/MM/yyyy HH:mm')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

             <div className="py-4 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                    Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">
                        Anterior
                    </button>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};
