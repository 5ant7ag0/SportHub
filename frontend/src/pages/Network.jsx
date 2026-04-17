import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Users, Check, X, MessageSquare, TrendingUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import { formatAuthorMetadata } from '../components/PostCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#A3E635', '#06B6D4', '#c084fc', '#fbbf24', '#f87171', '#34d399'];

export const Network = () => {
    const { user: authUser, updateUser } = useAuth();
    const [connections, setConnections] = useState([]);
    const [myConnections, setMyConnections] = useState([]);
    const [analytics, setAnalytics] = useState(null);
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

        // 2. POLLING: Datos vivos (Presencia, Conexiones, Analítica) - Cada 2.5s
        const fetchLiveUpdates = async (isPolling = false) => {
            try {
                const [profileRes, analyticsRes, connectionsRes] = await Promise.all([
                    api.get('/profile/'),
                    api.get('/analytics/summary/').catch(() => ({ data: null })),
                    api.get('/network/connections/')
                ]);
                
                setMyConnections(connectionsRes.data || []);
                if (analyticsRes.data) {
                    setAnalytics(analyticsRes.data);
                }
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

    // Datos Analíticos replicados
    const engagementRate = "8.7"; 
    const impresiones = "15.2k";
    const reach = "9.8k";
    const barData = analytics?.demographics?.length > 0 
        ? analytics.demographics.map(d => ({ name: `${d.age_group_start}-${d.age_group_start+10}`, value: d.count }))
        : [
            { name: "18-24", value: 300 },
            { name: "25-34", value: 480 },
            { name: "35-44", value: 200 },
            { name: "45+", value: 120 }
        ];

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
                            <Users className="w-4 h-4" /> 5 Conexiones
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
                                // Default mock images if no media
                                const dummys = [
                                    "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=400&fit=crop",
                                    "https://images.unsplash.com/photo-1510566337590-2fc1f21100ab?q=80&w=400&fit=crop",
                                    "https://images.unsplash.com/photo-1575361204481-4d162ffa89a6?q=80&w=400&fit=crop",
                                    "https://images.unsplash.com/photo-1526676037598-3938ea5f309a?q=80&w=400&fit=crop",
                                    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&fit=crop",
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&fit=crop"
                                ];
                                const bannerUrl = dummys[idx % dummys.length];
                                
                                return (
                                <div key={user.id || idx} className="bg-[#151b28] rounded-2xl border border-[rgba(255,255,255,0.05)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform">
                                    <div className="h-24 w-full relative">
                                        <img src={bannerUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Banner" />
                                        <div className="absolute top-2 right-2 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                                            {user.sport}
                                        </div>
                                    </div>
                                    <div className="p-5 relative flex-1 flex flex-col">
                                        <div className="absolute -top-10 left-4">
                                            <img 
                                                src={getMediaUrl(user.avatar_url)} 
                                                className="w-16 h-16 rounded-full border-4 border-[#151b28] bg-[#0B0F19] object-cover" 
                                                alt={user.name} 
                                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                            />
                                        </div>
                                        <div className="mt-8 mb-2">
                                            <h4 className="text-white font-bold text-sm tracking-wide truncate pr-2">{user.name}</h4>
                                            <p className="text-gray-400 text-xs truncate mt-0.5">{formatAuthorMetadata(user)}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] mb-4">
                                            <span className="text-sporthub-neon font-bold flex items-center gap-1">★ 4.{8 - (idx%3)}</span>
                                            <span className="text-gray-400 flex items-center gap-1">📍 {user.city}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mb-4 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                                            {Math.floor(Math.random() * 20) + 1} conexiones mutuas
                                        </div>
                                        <div className="mt-auto flex gap-2">
                                            <Link to={`/profile?id=${user.id}`} className="flex-1 bg-[rgba(163,230,53,0.1)] border border-[rgba(163,230,53,0.2)] text-sporthub-neon text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[rgba(163,230,53,0.2)] transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                Ver Perfil
                                            </Link>
                                            <button 
                                                onClick={() => handleFollow(user.id)}
                                                className="w-10 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center justify-center hover:bg-sporthub-neon hover:border-sporthub-neon group/btn transition-all"
                                                title="Seguir Atleta"
                                            >
                                                <UserPlus className="w-4 h-4 text-gray-400 group-hover/btn:text-black" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                </div>

                {/* COLUMNA DERECHA (Side Panel) IDÉNTICA AL PERFIL */}
                <div className="w-full lg:w-80 xl:w-[350px] flex flex-col gap-6 shrink-0">
                    
                    {/* Visitas al Perfil (Donut) */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white font-bold text-sm">Visitas al Perfil</h3>
                                <p className="text-[10px] text-gray-500">vs. mes anterior</p>
                            </div>
                            <div className="bg-sporthub-neon/10 text-sporthub-neon text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +14.0%
                            </div>
                        </div>
                        <div className="h-44 relative flex items-center justify-center mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[{value: 68}, {value: 32}]} dataKey="value" innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} stroke="none">
                                        <Cell fill="#A3E635" />
                                        <Cell fill="#1a2130" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-bold text-white">68%</span>
                                <span className="text-[9px] text-gray-400">2,847 visitas</span>
                            </div>
                        </div>
                    </div>

                    {/* Distribución de Edad (Bar Chart) */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-white font-bold text-sm">Distribución de Edad</h3>
                                <p className="text-[10px] text-gray-500">Audiencia principal</p>
                            </div>
                            <div className="bg-sporthub-cyan/10 text-sporthub-cyan text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                👨‍👩‍👧 {analytics?.average_age ? analytics.average_age.toFixed(1) : 'S/N'} años
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2130" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                    <Tooltip cursor={{ fill: '#1a2130' }} contentStyle={{ backgroundColor: '#0B0F19', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 1 ? '#06B6D4' : '#1e5f72'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Métricas Rápidas */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <h3 className="text-white font-bold text-sm mb-5">Métricas Rápidas</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-3 border-b border-[rgba(255,255,255,0.05)]">
                                <span className="text-sm text-gray-400">Engagement Rate</span>
                                <span className="text-sm font-bold text-sporthub-neon">{engagementRate}%</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-[rgba(255,255,255,0.05)]">
                                <span className="text-sm text-gray-400">Impresiones</span>
                                <span className="text-sm font-bold text-sporthub-cyan">{impresiones}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Reach</span>
                                <span className="text-sm font-bold text-[#c084fc]">{reach}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};
