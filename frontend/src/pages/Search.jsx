import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Loader2, Search as SearchIcon, Filter, MapPin, UserPlus, Check, X, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import { UserCard } from '../components/UserCard';
import { formatAuthorMetadata } from '../components/PostCard';

const SPORTS_DATA = {
    'Fútbol': ['Arquero', 'Defensa', 'Mediocampista', 'Delantero'],
    'Básquet': ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
    'Ecuavoley': ['Colocador', 'Servidor', 'Volador']
};

export const Search = () => {
    const { user: authUser, lastNotification } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [sport, setSport] = useState('');
    const [position, setPosition] = useState('');
    const [role, setRole] = useState('');
    const [city, setCity] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const pendingIdsRef = useRef(new Set());

    useEffect(() => {
        if (lastNotification?.type === 'follow' || lastNotification?.type === 'count_update') {
            fetchResults(true);
        }
    }, [lastNotification]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query, sport, role, city, position]);

    useEffect(() => {
        setPosition('');
    }, [sport]);

    const fetchResults = async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (sport) params.append('sport', sport);
            if (role) params.append('role', role);
            if (city) params.append('city', city);
            if (position) params.append('position', position);

            const { data } = await api.get(`/search/?${params.toString()}`);

            setResults(prev => {
                return data.map(newUser => {
                    if (pendingIdsRef.current.has(newUser.id)) {
                        const existingUser = prev.find(u => u.id === newUser.id);
                        return existingUser || newUser;
                    }
                    return newUser;
                });
            });
        } catch (error) {
            console.error("Error en búsqueda:", error);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    };
    const handleFollow = async (targetId) => {
        // Marcamos como pendiente para bloquear sobrescrituras del fetchResults
        pendingIdsRef.current.add(targetId);

        // El estado visual lo maneja UserCard, nosotros solo protegemos el ID
        // Liberamos después de un tiempo prudencial para sincronizar con el server
        setTimeout(() => {
            pendingIdsRef.current.delete(targetId);
        }, 1500);
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-sporthub-bg pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 px-2 md:px-0">
                    <h2 className="text-3xl font-bold text-white mb-2">Buscar</h2>
                    <p className="text-sm text-sporthub-muted">Conecta con atletas, scouts y profesionales deportivos.</p>
                </div>

                {/* Filtros */}
                <div className="bg-sporthub-card p-4 md:p-6 rounded-[2.5rem] border border-sporthub-border shadow-2xl mb-8 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="flex-1 bg-[#151b28] rounded-2xl flex items-center px-4 border border-[rgba(255,255,255,0.05)] focus-within:border-sporthub-cyan transition-colors">
                            <SearchIcon className="w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Escribe un nombre..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-white text-sm px-4 py-3.5 outline-none"
                            />
                        </div>
                        <button className="bg-sporthub-neon text-black font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(163,230,53,0.3)] active:scale-95 transition-all uppercase tracking-widest text-xs">
                            <Filter className="w-4 h-4" /> Buscar
                        </button>
                    </div>

                    <div className={`grid grid-cols-1 ${sport ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 sm:gap-4`}>
                        <select
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                            className="bg-[#151b28] text-xs text-white px-4 py-3.5 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none"
                        >
                            <option value="">Filtro: Deporte</option>
                            <option value="Fútbol">Fútbol</option>
                            <option value="Básquet">Básquet</option>
                            <option value="Ecuavoley">Ecuavoley</option>
                        </select>

                        {sport && (
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="bg-[#151b28] text-xs text-white px-4 py-3.5 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none animate-in fade-in duration-300"
                            >
                                <option value="">Cualquier Posición</option>
                                {SPORTS_DATA[sport]?.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                        )}

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-[#151b28] text-xs text-white px-4 py-3.5 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none"
                        >
                            <option value="">Cualquier Rol</option>
                            <option value="athlete">Deportista</option>
                            <option value="recruiter">Reclutador</option>
                        </select>

                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sporthub-muted" />
                            <input
                                type="text"
                                placeholder="Ciudad..."
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="bg-[#151b28] text-xs text-white pl-10 pr-4 py-3.5 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full"
                            />
                        </div>

                        {(sport || role || city || position || query) && (
                            <button
                                onClick={() => {
                                    setSport('');
                                    setRole('');
                                    setCity('');
                                    setPosition('');
                                    setQuery('');
                                }}
                                className="sm:col-span-full text-center text-[10px] text-sporthub-cyan font-bold uppercase tracking-wider hover:opacity-80 transition-opacity flex items-center justify-center gap-1 mt-1"
                            >
                                <X className="w-3 h-3" /> Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Resultados */}
                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {results.length === 0 && (
                            <div className="col-span-full text-center p-20 text-gray-500 font-medium">
                                No se encontraron resultados que coincidan con tus filtros.
                            </div>
                        )}
                        {results.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onAction={() => handleFollow(user.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};
