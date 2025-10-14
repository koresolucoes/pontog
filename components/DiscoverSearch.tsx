import React from 'react';
import { SearchIcon } from './icons';

export const DiscoverSearch: React.FC = () => {
    return (
        <div className="p-4 bg-gray-800">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full bg-gray-700 border border-transparent rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent sm:text-sm"
                    placeholder="Buscar usuários..."
                />
            </div>
        </div>
    );
};
