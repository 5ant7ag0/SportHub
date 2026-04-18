import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import { UserCard } from './UserCard';

export const SuggestedUsers = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/network/suggestions/');
            // We take fewer suggestions for the sidebar to keep it clean, 
            // the endpoint returns 9 by default.
            setSuggestions(data.slice(0, 5)); 
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <div className="flex flex-col">
            <div className="sticky top-0 z-20 bg-sporthub-bg/95 backdrop-blur-md pt-4 pb-4 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sporthub-neon" />
                    <h3 className="text-white font-black uppercase tracking-tighter text-lg">Sugerencias</h3>
                </div>
                <button 
                    onClick={fetchSuggestions}
                    disabled={isLoading}
                    className="p-2 text-gray-500 hover:text-sporthub-neon transition-colors disabled:opacity-30"
                    title="Actualizar sugerencias"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-sporthub-neon animate-spin opacity-50" />
                </div>
            ) : (
                <div className="flex flex-col gap-6 px-0 pt-6 pb-20">
                    {suggestions.length === 0 ? (
                        <p className="text-center text-gray-500 text-xs py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            No hay más sugerencias por ahora.
                        </p>
                    ) : (
                        suggestions.map(user => (
                            <UserCard 
                                key={user.id} 
                                user={user} 
                                className="!max-h-[320px]" // Slightly smaller for sidebar
                            />
                        ))
                    )}
                </div>
            )}
            
            <footer className="mt-4 px-4 py-6 border-t border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">
                    © 2024 SportHub • Red Profesional
                </p>
            </footer>
        </div>
    );
};
