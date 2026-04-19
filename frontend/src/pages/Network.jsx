import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Users, Check, X, MessageSquare, TrendingUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import { formatAuthorMetadata } from '../components/PostCard';

export const Network = () => {
    const { user: authUser, updateUser } = useAuth();
    const [myConnections, setMyConnections] = useState({ followers: [], following: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('following'); // 'followers' o 'following'

    useEffect(() => {
        // POLLING: Datos vivos (Presencia, Conexiones) - Cada 2.5s
        const fetchLiveUpdates = async (isPolling = false) => {
            try {
                const connectionsRes = await api.get('/network/connections/');
                setMyConnections(connectionsRes.data || { followers: [], following: [] });
            } catch (error) {
                console.error("Error en polling de network:", error);
            } finally {
                if (!isPolling) setIsLoading(false);
            }
        };

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

    const currentList = myConnections[activeTab] || [];

    return (
        <main className="flex-1 bg-[#0B0F19] p-6 lg:p-8 pb-32">
            <div className="flex flex-col lg:flex-row gap-6 max-w-[1500px] mx-auto">
                
                {/* COLUMNA PRINCIPAL IZQUIERDA (Red Principal) */}
                <div className="flex-1 flex flex-col gap-8">
                    
                    {/* Header: Mi Red */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sporthub-neon/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic uppercase">Mi Red Profesional</h2>
                            <p className="text-sm text-gray-500 font-medium">Gestiona tus seguidores y a quiénes sigues en tiempo real.</p>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[100px]">
                                <span className="text-sporthub-neon font-black text-xl">{myConnections.followers.length}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Seguidores</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[100px]">
                                <span className="text-sporthub-cyan font-black text-xl">{myConnections.following.length}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Siguiendo</span>
                            </div>
                        </div>
                    </div>

                    {/* Selector de Pestañas */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setActiveTab('following')}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border ${activeTab === 'following' ? 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_20px_rgba(163,230,53,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                        >
                            Siguiendo
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeTab === 'following' ? 'bg-black/20' : 'bg-white/10 text-gray-400'}`}>
                                {myConnections.following.length}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('followers')}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border ${activeTab === 'followers' ? 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_20px_rgba(163,230,53,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                        >
                            Seguidores
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeTab === 'followers' ? 'bg-black/20' : 'bg-white/10 text-gray-400'}`}>
                                {myConnections.followers.length}
                            </span>
                        </button>
                    </div>

                    {/* Listado de Conexiones */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 min-h-[400px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {currentList.length === 0 ? (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-700">
                                        <Users className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2 uppercase italic">Sin Conexiones</h3>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                        {activeTab === 'following' 
                                            ? "Todavía no sigues a ningún atleta o profesional." 
                                            : "Aún no tienes seguidores en tu perfil."}
                                    </p>
                                    {activeTab === 'following' && (
                                        <Link to="/search" className="mt-8 bg-sporthub-neon text-black font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest hover:scale-105 transition-transform">
                                            Descubrir Atletas
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                currentList.map(conn => (
                                    <div key={conn.id} className="bg-[#151b28] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 flex items-center gap-4 group hover:bg-[rgba(255,255,255,0.08)] hover:border-sporthub-neon/30 hover:-translate-y-1 transition-all duration-300">
                                        <Link to={`/profile?id=${conn.id}`} className="relative shrink-0">
                                            <img 
                                                src={getMediaUrl(conn.avatar_url)} 
                                                className="w-16 h-16 rounded-full border-2 border-sporthub-border group-hover:border-sporthub-neon transition-colors object-cover shadow-xl" 
                                                alt={conn.name} 
                                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                            />
                                            <div className={`absolute bottom-0.5 right-0.5 w-4 h-4 ${conn.is_online ? 'bg-sporthub-neon shadow-[0_0_10px_rgba(163,230,53,0.8)]' : 'bg-gray-600'} rounded-full border-2 border-[#151b28]`}></div>
                                        </Link>
                                        <div className="flex-1 overflow-hidden">
                                            <Link to={`/profile?id=${conn.id}`} className="text-white font-bold text-sm truncate hover:text-sporthub-neon transition-colors block tracking-tighter pr-2">{conn.name}</Link>
                                            <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest truncate mb-3 opacity-50">{formatAuthorMetadata(conn)}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${conn.is_online ? 'bg-sporthub-neon/10 text-sporthub-neon border border-sporthub-neon/20' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                                                    {conn.is_online ? 'En Línea' : 'Desconectado'}
                                                </span>
                                                <span className="text-gray-600 text-[9px] font-bold flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                    {conn.city || 'Global'}
                                                </span>
                                            </div>
                                        </div>
                                        <Link to={`/messages?contactId=${conn.id}`} className="w-11 h-11 rounded-2xl bg-sporthub-neon/5 border border-sporthub-neon/10 text-sporthub-neon flex items-center justify-center hover:bg-sporthub-neon hover:text-black hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all shrink-0 active:scale-90">
                                            <MessageSquare className="w-5 h-5" />
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};
