import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Loader2, Search as SearchIcon, Filter, MapPin, UserPlus, Check, X, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
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

    const handleFollow = async (e, targetId) => {
        e.stopPropagation();
        const targetUser = results.find(u => u.id === targetId);
        if (!targetUser) return;

        const newState = !targetUser.is_following;
        const originalResults = [...results];

        setResults(prev => prev.map(u => 
            u.id === targetId ? { ...u, is_following: newState } : u
        ));
        
        pendingIdsRef.current.add(targetId);
        
        try {
            await api.post('/social/follow/', { target_id: targetId });
        } catch (e) {
            console.error("Error al seguir:", e);
            setResults(originalResults);
        } finally {
            setTimeout(() => {
                pendingIdsRef.current.delete(targetId);
            }, 3000);
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8 bg-sporthub-bg pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 px-2 md:px-0">
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2 uppercase">Buscador Universal</h2>
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
                        {results.map(user => {
                            const hasBanner = user.banner_url && user.banner_url !== 'None' && user.banner_url !== '';

                            return (
                                <div 
                                    key={user.id} 
                                    onClick={() => navigate(`/profile?id=${user.id}`)}
                                    className="bg-sporthub-card border border-sporthub-border rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] group cursor-pointer aspect-square max-h-[380px] relative"
                                >
                                    {/* Fondo de Banner con Máscara de Degradado (Consistencia con App) */}
                                    <div className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden">
                                        <div 
                                            className="w-full h-full relative"
                                            style={{
                                                maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)',
                                                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)'
                                            }}
                                        >
                                            {hasBanner ? (
                                                <img 
                                                    src={getMediaUrl(user.banner_url)} 
                                                    className="w-full h-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-80" 
                                                    alt="" 
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#1a2235] to-sporthub-card opacity-30"></div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col items-center h-full relative z-10">
                                        {/* Avatar con Badge superpuesto */}
                                        <div className="relative mb-3 flex flex-col items-center pt-1">
                                            <div className="p-1 rounded-full bg-sporthub-card/20 backdrop-blur-xl ring-2 ring-white/5 shadow-2xl">
                                                <img 
                                                    src={getMediaUrl(user.avatar_url)} 
                                                    className="w-24 h-24 rounded-full object-cover border-4 border-sporthub-card shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                                                    alt={user.name} 
                                                    onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                                />
                                            </div>
                                            {/* Badge de Rol - Estilo consistente */}
                                            <div className={`absolute -bottom-2 z-10 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${user.role === 'recruiter' ? 'bg-sporthub-cyan/20 border-sporthub-cyan/40 text-sporthub-cyan' : 'bg-sporthub-neon/20 border-sporthub-neon/40 text-sporthub-neon'}`}>
                                                {user.role === 'recruiter' ? 'Reclutador' : 'Deportista'}
                                            </div>
                                            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-sporthub-card z-20 ${user.is_online ? 'bg-sporthub-neon shadow-[0_0_10px_rgba(163,230,53,0.8)]' : 'bg-gray-600'}`}></div>
                                        </div>

                                        {/* Información Central */}
                                        <div className="text-center w-full mb-6">
                                            <h4 className="text-white font-bold text-xl tracking-tight truncate mb-1">
                                                {user.name}
                                            </h4>
                                            <p className="text-gray-400 text-[11px] font-medium leading-tight opacity-90">
                                                {formatAuthorMetadata(user)}
                                            </p>
                                            <div className="mt-2 text-gray-400 text-[10px] font-medium flex items-center justify-center gap-1 opacity-80">
                                                <MapPin className="w-3 h-3 text-sporthub-cyan" />
                                                <span>{user.city || 'Quito'}</span>
                                            </div>
                                        </div>

                                        {/* Botones Estilo Referencia - Al final de la tarjeta */}
                                        <div className="w-full flex gap-2 mt-auto">
                                            <button 
                                                onClick={(e) => handleFollow(e, user.id)}
                                                className={`flex-1 py-3.5 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all active:scale-95 border font-black text-xs uppercase tracking-widest ${user.is_following ? 'bg-white/5 border-white/10 text-white' : 'bg-sporthub-neon border-sporthub-neon text-black hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]'}`}
                                            >
                                                {user.is_following ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                                {user.is_following ? 'Siguiendo' : 'Seguir'}
                                            </button>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/messages?contactId=${user.id}`);
                                                }}
                                                className="w-12 bg-white/5 border border-white/10 rounded-[1.25rem] flex items-center justify-center hover:bg-sporthub-cyan hover:text-black hover:border-sporthub-cyan transition-all active:scale-95 group/msg"
                                            >
                                                <MessageSquare className="w-5 h-5 text-gray-400 group-hover/msg:text-black transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};
