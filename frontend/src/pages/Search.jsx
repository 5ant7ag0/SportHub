import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Search as SearchIcon, Filter, MapPin, UserPlus, Check, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import { formatAuthorMetadata } from '../components/PostCard';

const SPORTS_DATA = {
    'Fútbol': ['Arquero', 'Defensa', 'Mediocampista', 'Delantero'],
    'Básquet': ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
    'Ecuavoley': ['Colocador', 'Servidor', 'Volador']
};

export const Search = () => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [sport, setSport] = useState('');
    const [position, setPosition] = useState('');
    const [role, setRole] = useState('');
    const [city, setCity] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingIds, setPendingIds] = useState(new Set());

    // Búsqueda Inteligente Debounced
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query, sport, role, city, position]);

    // Reset position when sport changes
    useEffect(() => {
        setPosition('');
    }, [sport]);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (sport) params.append('sport', sport);
            if (role) params.append('role', role);
            if (city) params.append('city', city);
            if (position) params.append('position', position);
            
            const { data } = await api.get(`/search/?${params.toString()}`);
            setResults(data);
        } catch (error) {
            console.error("Error en búsqueda:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollow = async (targetId) => {
        const targetUser = results.find(u => u.id === targetId);
        if (!targetUser) return;

        const newState = !targetUser.is_following;
        const originalResults = [...results];

        // Optimistic UI update
        setResults(prev => prev.map(u => 
            u.id === targetId ? { ...u, is_following: newState } : u
        ));
        
        setPendingIds(prev => new Set(prev).add(targetId));
        try {
            await api.post('/social/follow/', { target_id: targetId });
        } catch (e) {
            console.error("Error al seguir:", e);
            setResults(originalResults);
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-sporthub-bg pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 px-2 md:px-0">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 uppercase italic">Buscador Universal</h2>
                    <p className="text-sm text-sporthub-muted">Conecta con atletas, scouts y profesionales deportivos.</p>
                </div>

                {/* Filtros Inteligentes */}
                <div className="bg-sporthub-card p-4 md:p-6 rounded-[2rem] border border-sporthub-border shadow-2xl mb-8 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                        <div className="flex-1 bg-[#151b28] rounded-2xl flex items-center px-4 border border-[rgba(255,255,255,0.05)] focus-within:border-sporthub-cyan transition-colors">
                            <SearchIcon className="w-5 h-5 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Escribe un nombre..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-white text-sm px-4 py-3 outline-none"
                            />
                        </div>
                        <button className="bg-sporthub-neon text-black font-black px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs">
                            <Filter className="w-4 h-4" /> Buscar
                        </button>
                    </div>

                    <div className={`grid grid-cols-1 ${sport ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 sm:gap-4`}>
                        <select 
                            value={sport} 
                            onChange={(e) => setSport(e.target.value)}
                            className="bg-[#151b28] text-xs text-white px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none"
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
                                className="bg-[#151b28] text-xs text-white px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none animate-in slide-in-from-left-2 duration-300"
                            >
                                <option value="">Cualquier Posición</option>
                                {SPORTS_DATA[sport]?.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        )}

                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-[#151b28] text-xs text-white px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full appearance-none transition-all hover:border-white/20"
                        >
                            <option value="">Cualquier Rol</option>
                            <option value="athlete">Deportista</option>
                            <option value="recruiter">Reclutador</option>
                        </select>
                        <div className="relative sm:col-span-1">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-sporthub-muted" />
                            <input 
                                type="text" 
                                placeholder="Ciudad..." 
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="bg-[#151b28] text-xs text-white pl-10 pr-4 py-3 rounded-xl border border-[rgba(255,255,255,0.05)] focus:border-sporthub-cyan outline-none w-full"
                            />
                        </div>
                        
                        {(sport || role || city || position) && (
                            <button 
                                onClick={() => {
                                    setSport('');
                                    setRole('');
                                    setCity('');
                                    setPosition('');
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
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-10 h-10 text-sporthub-cyan animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.length === 0 && (
                            <div className="col-span-full text-center p-12 text-gray-500">
                                No se encontraron resultados que coincidan exacto con tus filtros.
                            </div>
                        )}
                        {results.map(user => (
                            <div key={user.id} className="bg-sporthub-card border border-[rgba(255,255,255,0.05)] rounded-3xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                                <Link to={`/profile?id=${user.id}`}>
                                    <div className="flex flex-col items-center gap-0">
                                        <div className="relative p-1">
                                            <img 
                                                src={getMediaUrl(user.avatar_url)} 
                                                className="w-20 h-20 rounded-full border-2 border-sporthub-border shadow-lg object-cover" 
                                                alt={user.name}
                                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                            />
                                        </div>
                                        <span className={`-mt-3 z-10 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : user.role === 'athlete' ? 'bg-sporthub-neon/10 text-sporthub-neon border-sporthub-neon/30' : 'bg-sporthub-cyan/10 text-sporthub-cyan border-sporthub-cyan/30'}`}>
                                            {user.role === 'admin' ? 'Admin' : user.role === 'athlete' ? 'Deportista' : 'Reclutador'}
                                        </span>
                                    </div>
                                </Link>
                                <Link to={`/profile?id=${user.id}`} className="hover:underline text-white font-bold mb-1">
                                    {user.name}
                                </Link>
                                <p className="text-xs text-sporthub-muted mb-4 truncate w-full px-2">
                                    {formatAuthorMetadata(user)}
                                </p>
                                
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-6">
                                    <MapPin className="w-3 h-3 text-sporthub-cyan" /> {user.city}
                                </div>
                                
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => handleFollow(user.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all ${user.is_following ? 'bg-sporthub-neon/10 border border-sporthub-neon/20 text-sporthub-neon hover:bg-sporthub-neon/20' : 'bg-sporthub-neon text-black hover:shadow-[0_0_15px_rgba(163,230,53,0.5)]'}`}
                                    >
                                        {user.is_following ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                        {user.is_following ? 'Siguiendo' : 'Seguir'}
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/messages?contactId=${user.id}`)}
                                        className="bg-sporthub-cyan/20 border border-sporthub-cyan/30 text-sporthub-cyan p-2.5 rounded-xl hover:bg-sporthub-cyan hover:text-black transition-all"
                                        title="Enviar Mensaje"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};
