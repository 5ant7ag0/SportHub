import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Users, Check, X, MessageSquare, TrendingUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import { formatAuthorMetadata } from '../components/PostCard';

export const Network = () => {
    const { user: authUser, updateUser } = useAuth();
    const [connections, setConnections] = useState([]);
    const [myConnections, setMyConnections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. CARGA INICIAL: Datos de descubrimiento (Sugerencias) - Solo una vez por visita
        const fetchInitialData = async () => {
            try {
                const suggestRes = await api.get('/network/suggestions/');
                setConnections(suggestRes.data || []);
            } catch (error) {
                console.error("Error cargando sugerencias:", error);
            }
        };

        // 2. POLLING: Datos vivos (Presencia, Conexiones) - Cada 2.5s
        const fetchLiveUpdates = async (isPolling = false) => {
            try {
                const [profileRes, connectionsRes] = await Promise.all([
                    api.get('/profile/'),
                    api.get('/network/connections/')
                ]);
                
                setMyConnections(connectionsRes.data || []);
            } catch (error) {
                console.error("Error en polling de network:", error);
            } finally {
                if (!isPolling) setIsLoading(false);
            }
        };

        fetchInitialData();
        fetchLiveUpdates();
        const intervalId = setInterval(() => fetchLiveUpdates(true), 2500);
        return () => clearInterval(intervalId);
    }, []);

    if (isLoading) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center bg-sporthub-bg">
                <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
            </main>
        );
    }

    const handleFollow = async (targetId) => {
        const originalConnections = [...connections];
        const originalFollowingCount = authUser.following_count;

        // 1. Acción Instantánea: Remover de sugerencias y actualizar contador
        setConnections(prev => prev.filter(c => c.id !== targetId));
        updateUser({
            following_count: (authUser.following_count || 0) + 1
        });

        try {
            const { data } = await api.post('/social/follow/', { target_id: targetId });
            // 2. Sincronización final con datos reales del servidor si es necesario
            if (data.following_count !== undefined) {
                updateUser({
                    following_count: data.following_count
                });
            }
        } catch (e) {
            console.error("Error siguiendo usuario desde sugerencias:", e);
            // Revertir en caso de error
            setConnections(originalConnections);
            updateUser({
                following_count: originalFollowingCount
            });
        }
    };

    // Eliminamos myConnections hardcodeado por el estado dinámico

    return (
        <main className="flex-1 bg-[#0B0F19] p-6 lg:p-8 pb-32">
            <div className="flex flex-col lg:flex-row gap-6 max-w-[1500px] mx-auto">
                
                {/* COLUMNA PRINCIPAL IZQUIERDA (Red Principal) */}
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Header: Mi Red */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Mi Red</h2>
                            <p className="text-sm text-gray-500">Gestiona tus conexiones profesionales</p>
                        </div>
                        <button className="bg-[rgba(163,230,53,0.1)] border border-[rgba(163,230,53,0.2)] text-sporthub-neon font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[rgba(163,230,53,0.2)] transition-colors">
                            <Users className="w-4 h-4" /> {myConnections.length} Conexiones
                        </button>
                    </div>

                    {/* Mis Conexiones */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-sm">Mis Conexiones</h3>
                            <span className="text-sporthub-neon text-xs font-bold font-medium cursor-pointer hover:underline">Ver todas</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myConnections.length === 0 ? (
                                <p className="text-gray-500 text-xs py-4 col-span-2 text-center italic">Aún no tienes conexiones activas.</p>
                            ) : (
                                myConnections.map(conn => (
                                    <div key={conn.id} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 flex items-center gap-4 group hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                                        <div className="relative">
                                            <img 
                                                src={getMediaUrl(conn.avatar_url)} 
                                                className="w-12 h-12 rounded-full border border-sporthub-neon object-cover" 
                                                alt={conn.name} 
                                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                            />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 ${conn.is_online ? 'bg-sporthub-neon shadow-[0_0_8px_rgba(163,230,53,0.5)]' : 'bg-gray-600'} rounded-full border-2 border-sporthub-card`}></div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <Link to={`/profile?id=${conn.id}`} className="text-white font-bold text-sm truncate hover:text-sporthub-neon transition-colors block">{conn.name}</Link>
                                            <p className="text-gray-400 text-xs truncate mb-1.5">{formatAuthorMetadata(conn)}</p>
                                            <div className="flex gap-2">
                                                <span className={`${conn.is_online ? 'bg-[rgba(163,230,53,0.1)] text-sporthub-neon' : 'bg-gray-800 text-gray-500'} px-2 py-0.5 rounded-md text-[10px] font-bold`}>
                                                    {conn.is_online ? 'ACTIVO' : 'OFFLINE'}
                                                </span>
                                                <span className="text-gray-500 text-[10px] flex items-center gap-0.5">{conn.city}</span>
                                            </div>
                                        </div>
                                        <Link to={`/messages?contactId=${conn.id}`} className="w-10 h-10 rounded-xl bg-[rgba(163,230,53,0.1)] border border-[rgba(163,230,53,0.2)] text-sporthub-neon flex items-center justify-center hover:bg-sporthub-neon hover:text-black hover:shadow-[0_0_10px_rgba(163,230,53,0.5)] transition-all shrink-0">
                                            <MessageSquare className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Personas que Quizás Conozcas */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="mb-6">
                            <h3 className="text-white font-bold text-lg">Personas que Quizás Conozcas</h3>
                            <p className="text-sm text-gray-500">Basado en tus conexiones y actividad</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {connections.slice(0, 9).map((user, idx) => {
                                const hasBanner = user.banner_url && user.banner_url !== 'None' && user.banner_url !== '';
                                
                                return (
                                <div key={user.id || idx} className="bg-[#151b28] rounded-2xl border border-[rgba(255,255,255,0.05)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                                    <div className="h-24 w-full relative">
                                        {hasBanner ? (
                                            <img 
                                                src={getMediaUrl(user.banner_url)} 
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                                alt="Banner" 
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0B0F19] via-[#1a2235] to-[#0B0F19] relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-sporthub-neon/5 to-transparent"></div>
                                            </div>
                                        )}
                                        {user.sport && (
                                            <div className="absolute top-2 right-2 bg-[rgba(0,0,0,0.6)] backdrop-blur-md border border-white/10 text-sporthub-neon text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                                                {user.sport}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 relative flex-1 flex flex-col">
                                        <div className="absolute -top-10 left-4">
                                            <div className="relative group/avatar">
                                                <img 
                                                    src={getMediaUrl(user.avatar_url)} 
                                                    className="w-16 h-16 rounded-full border-4 border-[#151b28] bg-[#0B0F19] object-cover shadow-2xl transition-transform group-hover/avatar:scale-105" 
                                                    alt={user.name} 
                                                    onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                                />
                                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#151b28] ${user.is_online ? 'bg-sporthub-neon shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'bg-gray-600'}`}></div>
                                            </div>
                                        </div>
                                        <div className="mt-8 mb-4">
                                            <h4 className="text-white font-bold text-sm tracking-wide truncate pr-2 group-hover:text-sporthub-neon transition-colors">{user.name}</h4>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider truncate mt-1 opacity-70">
                                                {formatAuthorMetadata(user)}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-[10px] mb-5">
                                            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                                <svg className="w-3 h-3 text-sporthub-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {user.city || 'Global'}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                            <div className="text-sporthub-neon/80 font-bold uppercase tracking-tighter">
                                                {user.followers_count || 0} seguidores
                                            </div>
                                        </div>

                                        <div className="mt-auto flex gap-2">
                                            <Link to={`/profile?id=${user.id}`} className="flex-1 bg-white/5 border border-white/10 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-sporthub-neon hover:text-black hover:border-sporthub-neon transition-all uppercase tracking-widest active:scale-95">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                Ver Perfil
                                            </Link>
                                            <button 
                                                onClick={() => handleFollow(user.id)}
                                                className="w-11 bg-sporthub-neon/10 border border-sporthub-neon/20 rounded-xl flex items-center justify-center hover:bg-sporthub-neon hover:border-sporthub-neon group/btn transition-all active:scale-90"
                                                title="Seguir Atleta"
                                            >
                                                <UserPlus className="w-4 h-4 text-sporthub-neon group-hover/btn:text-black" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};
