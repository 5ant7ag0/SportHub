import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, ScatterChart, Scatter, ZAxis, Label } from 'recharts';
import { TrendingUp, Users, Heart, MessageCircle, Loader2, ShieldCheck, ShieldAlert, Trash2, UserX, Search, CheckCircle2, UserCheck, X, MapPin, User, Shield, Activity, Calendar, Settings, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../utils/media';

const str = (id) => typeof id === 'object' ? id.$oid || String(id) : String(id);

// Configuración de colores segura y constante
const COLORS = {
    neon: '#A3E635',
    cyan: '#22D3EE',
    cyanDark: '#0891B2',
    bg: '#0B0F19',
    card: '#151A23',
    border: '#1E293B',
    muted: '#64748B',
    text: '#F8FAFC'
};

const DONUT_COLORS = [
    COLORS.neon,      // Neón
    COLORS.cyan,      // Cyan
    '#A855F7',        // Morado
    '#F59E0B',        // Naranja
    '#EC4899',        // Rosa
    '#3B82F6',        // Azul
    '#10B981',        // Esmeralda
    '#F43F5E',        // Rojo
    '#EAB308',        // Amarillo
];

const INITIAL_STATS = {
    total_visits: 0,
    average_age: 0,
    demographics: [],
    total_likes: 0,
    total_comments: 0,
    is_global: false,
    stats_por_deporte: [],
    extra_stats: { total_users: 0, total_posts: 0 },
    user_growth: [],
    city_ranking: [],
    connection_status: { online: 0, offline: 0 },
    trends: [],
    newFollowers: 0,
    totalFollowers: 0,
    totalPosts: 0,
    community_pulse: [],
    talent_growth: []
};

// Regla: Colores fijos por deporte
const getSportColor = (sportName) => {
    const name = String(sportName || '').toUpperCase();
    if (name.includes('FUTBOL') || name.includes('FÚTBOL')) return COLORS.neon;
    if (name.includes('BASQUET') || name.includes('BÁSQUET')) return COLORS.cyan;
    if (name.includes('ECUAVOLEY')) return '#A855F7';
    return '#F59E0B';
};

const SkillBar = ({ skill, value, isNeon }) => (
    <div className="mb-4">
        <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-white font-medium uppercase tracking-wider">{skill}</span>
            <span className={isNeon ? "text-sporthub-neon font-bold" : "text-sporthub-cyan font-bold"}>{value}%</span>
        </div>
        <div className="w-full bg-[#0B0F19] rounded-full h-1 relative overflow-hidden">
            <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    isNeon 
                    ? 'bg-sporthub-neon shadow-[0_0_8px_rgba(163,230,53,0.5)]' 
                    : 'bg-sporthub-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                }`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

export const AnalyticsDashboard = () => {
    const { user: authUser, onlineUserIds, lastNotification, lastAnalyticsUpdate } = useAuth();

    const [stats, setStats] = useState(INITIAL_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null, actionType: '' });

    const fetchAnalytics = async (options = {}) => {
        const { silent = false } = options;
        try {
            if (!silent) setIsLoading(true);
            const { data } = await api.get('/analytics/summary/');

            setStats({
                ...INITIAL_STATS,
                total_visits: data?.total_visits || 0,
                average_age: data?.average_age || 0,
                demographics: Array.isArray(data?.demographics) ? data.demographics : [],
                total_likes: data?.total_likes || 0,
                total_comments: data?.total_comments || 0,
                is_global: !!data?.is_global,
                stats_por_deporte: Array.isArray(data?.stats_por_deporte) ? data.stats_por_deporte : [],
                extra_stats: data?.extra_stats || { total_users: 0, total_posts: 0 },
                user_growth: data?.user_growth || [],
                city_ranking: data?.city_ranking || [],
                connection_status: data?.connection_status || { online: 0, offline: 0 },
                trends: Array.isArray(data?.trends) ? data.trends : [],
                newFollowers: data?.new_followers || 0,
                totalFollowers: authUser?.followers_count || 0,
                totalPosts: authUser?.posts_count || 0,
                community_pulse: data?.community_pulse || [],
                talent_growth: data?.talent_growth || [],
            });

            if (data?.community_pulse?.some(d => d.count > 0)) {
                console.log("🔥 PULSO DETECTADO:", data.community_pulse.filter(d => d.count > 0));
            }
        } catch (error) {
            console.error("Error en analítica:", error);
            setStats({
                ...INITIAL_STATS,
                totalFollowers: authUser?.followers_count || 0,
                totalPosts: authUser?.posts_count || 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users/');
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // 📡 ACTUALIZACIÓN EN TIEMPO REAL (Ej: Nuevos deportistas registrados)
    useEffect(() => {
        if (lastAnalyticsUpdate) {
            console.log("♻️ Refrescando analítica por señal externa...");
            fetchAnalytics({ silent: true });
        }
    }, [lastAnalyticsUpdate]);

    useEffect(() => {
        if (stats.is_global) {
            fetchUsers();
        }
    }, [stats.is_global]);

    // 🟢 CORRECCIÓN: Ahora actualiza gráficas Y la tabla de usuarios
    useEffect(() => {
        if (lastNotification) {
            console.log("WebSocket pulso recibido. Refrescando datos (Silent)...");
            fetchAnalytics({ silent: true });
            if (stats.is_global) {
                fetchUsers(); // Obliga a la tabla a actualizarse
            }
        }
    }, [lastNotification]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleUserAction = (userId, action, userName) => {
        const config = {
            promote: { title: 'Cambiar Privilegios', message: `¿Deseas modificar los permisos de ${userName}?`, actionLabels: 'Cambiar Rango' },
            delete: { title: 'Eliminar Cuenta', message: `¿Desactivar definitivamente la cuenta de ${userName}?`, actionLabels: 'Eliminar' },
            suspend: { title: 'Suspender Usuario', message: `¿Restringir el acceso a ${userName}?`, actionLabels: 'Suspender' },
            reactivate: { title: 'Reactivar Usuario', message: `¿Restaurar el acceso para ${userName}?`, actionLabels: 'Reactivar' }
        };

        const currentConfig = config[action];

        setModal({
            show: true,
            title: currentConfig.title,
            message: currentConfig.message,
            actionType: action,
            onConfirm: async () => {
                try {
                    const { data } = await api.patch('/admin/users/', { user_id: userId, action });
                    setUsers(prev => prev.map(u => str(u.id) === str(userId) ? data.user : u));
                    const resultLabels = { promote: 'Cambio de Rol', delete: 'Cuenta Desactivada', suspend: 'Cuenta Suspendida', reactivate: 'Cuenta Reactivada' };
                    showToast(`${resultLabels[action]}: ${userName}`);
                    fetchUsers();
                    setModal(prev => ({ ...prev, show: false }));
                } catch (error) {
                    showToast(error.response?.data?.detail || "Error al realizar acción", 'error');
                    setModal(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    const str_local = (id) => typeof id === 'object' ? id.$oid || String(id) : String(id);

    const viewData = useMemo(() => {
        const d = stats || INITIAL_STATS;

        const total_v = d.total_visits || 0;
        const total_l = d.total_likes || 0;
        const total_c = d.total_comments || 0;
        const rate = total_v > 0 ? (((total_l + total_c) / total_v) * 100).toFixed(1) : "0.0";
        const completed = Math.min((total_v / 4000) * 100, 100);

        const demo = Array.isArray(d.demographics) ? d.demographics.map(x => ({
            name: `${x.age_group_start || 0}-${(x.age_group_start || 0) + 9}`,
            percentage: x.percentage || 0,
            count: x.count || 0
        })) : [];

        const trendRaw = Array.isArray(d.trends) ? d.trends : [];
        const trend = trendRaw.map(t => {
            const date = t?.day ? new Date(t.day) : new Date();
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const dayIdx = isNaN(date.getDay()) ? 0 : date.getDay();
            return {
                likes: t?.likes || 0,
                comments: t?.comments || 0,
                dayLabel: days[dayIdx]
            };
        });

        const growth = Array.isArray(d.user_growth) ? d.user_growth.map(g => ({
            name: g._id,
            usuarios: g.count || 0
        })) : [];

        // 📊 Sport Distribution Data (Global)
        let sportsDonut = [];
        if (Array.isArray(d.stats_por_deporte) && d.stats_por_deporte.length > 0) {
            sportsDonut = d.stats_por_deporte.map(s => ({ name: s._id || 'Otro', value: s.count || 0 }));
        } else {
            sportsDonut = [{ name: 'Sin datos', value: 1 }];
        }

        // 🎯 Goal Progress Data (Personal)
        const goalDonut = [
            { name: 'Visitas', value: completed },
            { name: 'Meta', value: Math.max(0, 100 - completed) }
        ];

        const currentOnline = onlineUserIds?.size || 0;
        const currentTotal = d.extra_stats?.total_users || users.length || 100;
        const connections = [
            { name: 'Online', value: currentOnline, color: COLORS.neon },
            { name: 'Offline', value: Math.max(0, currentTotal - currentOnline), color: '#1a2130' }
        ];

        const cities = Array.isArray(d.city_ranking) ? d.city_ranking.map(c => ({
            name: c._id || 'Desconocida',
            count: c.count || 0
        })) : [];

        const talent = Array.isArray(d.talent_growth) ? d.talent_growth.map(t => ({
            name: t.name || 'Anónimo',
            posts: t.posts || 0,
            followers: t.followers || 0,
            z: 100 // Tamaño constante para los puntos
        })) : [];

        return { rate, completed, demo, trend, growth, sportsDonut, goalDonut, connections, cities, currentOnline, talent };
    }, [stats, onlineUserIds, users.length]);

    if (isLoading || !stats) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center h-screen bg-sporthub-bg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
                    <p className="text-sporthub-muted text-sm tracking-widest uppercase">Preparando estadísticas...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar bg-[#0B0F19]">
            {/* Main Content Column */}
            <div className="xl:col-span-2 flex flex-col gap-6">

                {/* Header */}
                <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold text-white">
                            {stats.is_global ? 'Analítica Global' : 'Analítica de Rendimiento'}
                        </h2>
                        <span
                            onClick={() => setStats(prev => ({ ...prev, is_global: !prev.is_global }))}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${stats.is_global ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-sporthub-neon/10 text-sporthub-neon border border-sporthub-neon/20'}`}
                        >
                            {stats.is_global ? 'Modo Administrador' : 'Modo Personal'}
                        </span>
                    </div>
                    <p className="text-sm text-sporthub-muted">
                        {stats.is_global
                            ? 'Panel de control global con métricas clave de toda la plataforma.'
                            : 'Resumen detallado de tu rendimiento y métricas de audiencia.'}
                    </p>
                </div>

                {/* Distribución por Edad o Habilidades (Condicional para Deportistas) */}
                {(!stats.is_global && authUser?.role === 'athlete') ? (
                    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    Habilidades Profesionales
                                    <TrendingUp className="w-4 h-4 text-sporthub-neon" />
                                </h3>
                                <p className="text-xs text-sporthub-muted">Desglose técnico de rendimiento actual</p>
                            </div>
                            <span className="text-[10px] text-sporthub-neon bg-sporthub-neon/10 px-2 py-1 rounded font-bold uppercase tracking-widest border border-sporthub-neon/20">
                                Perfil Atleta
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mt-4 min-h-[240px]">
                            {Object.entries(authUser?.skills || {
                                "Velocidad": 80, "Táctica": 75, "Resistencia": 85, 
                                "Remate": 70, "Control": 80, "Visión": 75
                            }).map(([skill, value], idx) => (
                                <SkillBar 
                                    key={skill} 
                                    skill={skill} 
                                    value={value} 
                                    isNeon={idx % 2 === 0} 
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-semibold">Distribución por Edad</h3>
                                <p className="text-xs text-sporthub-muted">Rango demográfico de visitantes</p>
                            </div>
                            <span className="bg-sporthub-cyan/20 text-sporthub-cyan text-[10px] px-2 py-1 rounded">
                                Promedio: {stats?.average_age ? Number(stats.average_age).toFixed(1) : '0.0'} años
                            </span>
                        </div>
                        <div className="h-60 w-full mt-4" key={`bar-${stats?.is_global ? 'admin' : 'user'}`}>
                            {viewData.demo.length > 0 ? (
                                <ResponsiveContainer width="99%" height="99%" minWidth={1} minHeight={1}>
                                    <BarChart data={viewData.demo}>
                                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                        <YAxis
                                            tick={{ fill: COLORS.muted, fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                            domain={[0, 'auto']}
                                            tickFormatter={(value) => `${value}%`}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: COLORS.card, borderColor: '#334155', borderRadius: '12px', padding: '10px', border: '1px solid #334155' }}
                                            itemStyle={{ color: COLORS.cyan, fontSize: '12px' }}
                                            isAnimationActive={false}
                                            formatter={(value, name) => [name === 'count' ? `${value} Usuarios` : `${value}%`, name === 'count' ? 'Total' : 'Porcentaje']}
                                        />
                                        <Bar dataKey="percentage" fill={COLORS.cyan} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-sporthub-muted uppercase tracking-widest italic">Datos demográficos en proceso</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Line Chart Trends */}
                <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-semibold">Interacción Total</h3>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-xs text-sporthub-neon"><Heart className="w-3 h-3 fill-sporthub-neon" /> {(stats?.total_likes || 0).toLocaleString()} globales</span>
                            <span className="flex items-center gap-2 text-xs text-sporthub-cyan"><MessageCircle className="w-3 h-3" /> {(stats?.total_comments || 0).toLocaleString()} globales</span>
                        </div>
                    </div>

                    <div className="h-60 w-full mt-4 overflow-visible" key={`line-${stats?.is_global ? 'admin' : 'user'}`}>
                        {viewData.trend.length > 0 ? (
                            <ResponsiveContainer width="99%" height="99%" minWidth={1} minHeight={1}>
                                <LineChart data={viewData.trend} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                    <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: COLORS.muted, fontSize: 10 }}
                                        domain={['auto', 'auto']}
                                        width={40}
                                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: COLORS.card, borderColor: '#334155', borderRadius: '12px', border: '1px solid #334155' }}
                                        itemStyle={{ color: COLORS.text }}
                                        isAnimationActive={false}
                                    />
                                    <Line type="monotone" dataKey="likes" stroke={COLORS.neon} strokeWidth={5} dot={{ r: 4, fill: COLORS.neon }} activeDot={{ r: 6 }} isAnimationActive={false} connectNulls={true} />
                                    <Line type="monotone" dataKey="comments" stroke={COLORS.cyan} strokeWidth={5} dot={{ r: 4, fill: COLORS.cyan }} activeDot={{ r: 6 }} isAnimationActive={false} connectNulls={true} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-sporthub-muted uppercase tracking-widest italic flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Sin datos de interacción...
                            </div>
                        )}
                    </div>
                </div>

                {/* User Growth Chart (Strategic) - Admin Only */}
                {stats.is_global && (
                    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-white font-semibold">Crecimiento Estratégico</h3>
                                <p className="text-xs text-sporthub-muted">Historial acumulado de registros</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-sporthub-neon" />
                                <span className="text-[10px] text-sporthub-muted uppercase font-bold tracking-tighter">Usuarios</span>
                            </div>
                        </div>

                        <div className="h-64 w-full mt-4" key={`growth-${stats?.is_global}`}>
                            {viewData.growth.length > 0 ? (
                                <ResponsiveContainer width="99%" height="99%" minWidth={1} minHeight={1}>
                                    <AreaChart data={viewData.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.neon} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.neon} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: COLORS.muted, fontSize: 10 }}
                                            domain={[0, 'auto']}
                                            width={40}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: COLORS.card, borderColor: '#334155', borderRadius: '12px', border: '1px solid rgba(163,230,53,0.3)' }}
                                            itemStyle={{ color: COLORS.neon, fontSize: '12px', fontWeight: 'bold' }}
                                            cursor={{ stroke: 'rgba(163,230,53,0.2)', strokeWidth: 2 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="usuarios"
                                            stroke={COLORS.neon}
                                            fillOpacity={1}
                                            fill="url(#colorGrowth)"
                                            strokeWidth={4}
                                            animationDuration={1500}
                                            dot={{ r: 4, fill: '#0B0F19', stroke: COLORS.neon, strokeWidth: 2 }}
                                            activeDot={{ r: 6, fill: COLORS.neon, stroke: '#0B0F19', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-6 h-6 text-sporthub-muted animate-spin" />
                                    <span className="text-[10px] text-sporthub-muted uppercase tracking-widest italic font-bold">Sin datos históricos...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ANALISIS DE CRECIMIENTO DE TALENTO (Scatter Plot) --- */}
                {stats.is_global && (
                    <TalentGrowthScatter data={viewData.talent} />
                )}

                {/* --- PULSO DE LA COMUNIDAD (Heatmap) --- */}
                {stats.is_global && (
                    <CommunityPulse data={stats.community_pulse} />
                )}
            </div>

            <div className="flex flex-col gap-6">
                
                {/* 1. DISTRIBUCIÓN POR DEPORTE (Siempre visible arriba) */}
                <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl flex flex-col items-center">
                    <div className="flex justify-between items-start w-full mb-4">
                        <div>
                            <h3 className="text-white font-bold text-sm">Distribución por Deporte</h3>
                            <p className="text-[10px] text-gray-500">Talentos por categoría</p>
                        </div>
                    </div>

                    <div className="h-44 w-full relative flex items-center justify-center">
                        {viewData.sportsDonut.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={viewData.sportsDonut}
                                        cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                                        dataKey="value" stroke="none" isAnimationActive={false}
                                    >
                                        {viewData.sportsDonut.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getSportColor(entry.name)} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        cursor={false}
                                        contentStyle={{ backgroundColor: 'rgba(11, 15, 25, 0.95)', borderColor: '#A3E635', borderRadius: '12px', border: '1px solid rgba(163,230,53,0.2)' }}
                                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-[10px] text-gray-600 uppercase italic">Análisis en progreso...</div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-white tracking-tighter">{stats?.extra_stats?.total_users || 0}</span>
                            <span className="text-[9px] text-gray-500 uppercase font-black">Talentos</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 w-full border-t border-white/5 pt-4">
                        {['Fútbol', 'Básquet', 'Voley'].map((sport, i) => (
                            <div key={sport} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getSportColor(sport) }} />
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{sport}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. RESUMEN DE MÉTRICAS */}
                <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl">
                    <h3 className="text-white font-bold text-sm mb-5">Resumen de Métricas</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-sporthub-neon font-bold" />
                                <span className="text-xs text-gray-400 font-medium">Engagement</span>
                            </div>
                            <span className="text-sm font-black text-sporthub-neon">{viewData.rate}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5 text-sporthub-cyan fill-sporthub-cyan/10" />
                                <span className="text-xs text-gray-400 font-medium">Total Likes</span>
                            </div>
                            <span className="text-sm font-black text-sporthub-cyan">{(stats?.total_likes || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs text-gray-400 font-medium">Comunidad</span>
                            </div>
                            <span className="text-sm font-black text-purple-400">{(stats?.total_comments || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* 3. PROGRESO HACIA META (Visible para No-Admins) */}
                {!stats.is_global && (
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl flex flex-col items-center">
                        <div className="flex justify-between items-start w-full mb-4">
                            <div>
                                <h3 className="text-white font-bold text-sm">Progreso hacia Meta</h3>
                                <p className="text-[10px] text-gray-500 font-medium">Objetivo de visibilidad</p>
                            </div>
                            <div className="bg-sporthub-neon/10 text-sporthub-neon text-[10px] font-bold px-2 py-1 rounded-md">
                                {Math.round(viewData.completed)}%
                            </div>
                        </div>

                        <div className="h-36 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={viewData.goalDonut}
                                        cx="50%" cy="50%" innerRadius={42} outerRadius={56}
                                        paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}
                                    >
                                        <Cell fill={COLORS.neon} className="drop-shadow-[0_0_8px_rgba(163,230,53,0.4)]" />
                                        <Cell fill="rgba(255,255,255,0.03)" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-white">{(stats.total_visits || 0)}</span>
                                <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Visitas</span>
                            </div>
                        </div>
                        
                        <div className="w-full bg-white/5 rounded-2xl p-4 mt-4 text-center border border-white/5">
                            <p className="text-[10px] text-gray-400 leading-tight">Te faltan <span className="text-sporthub-neon font-bold">{4000 - (stats.total_visits || 0)}</span> visitas para alcanzar el siguiente nivel de perfil verificado.</p>
                        </div>
                    </div>
                )}

                {/* City Ranking (Admin only) */}
                {stats.is_global && (
                    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-semibold text-sm">Top Ciudades</h3>
                                <p className="text-[10px] text-sporthub-muted">Presencia geográfica</p>
                            </div>
                            <MapPin className="w-4 h-4 text-sporthub-cyan" />
                        </div>
                        <div className="space-y-3 mt-4">
                            {viewData.cities && viewData.cities.length > 0 ? viewData.cities.map((city, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-sporthub-muted group-hover:text-white transition-colors">{city.name}</span>
                                        <span className="text-white font-bold">{city.count}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-sporthub-cyan to-blue-500 rounded-full"
                                            style={{ width: `${(city.count / Math.max(...viewData.cities.map(c => c.count), 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-[10px] text-sporthub-muted text-center py-4 italic">Sin datos registrados</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Connection Status (Admin only) */}
                {stats.is_global && (
                    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-semibold text-sm">Estado de Conexión</h3>
                                <p className="text-[10px] text-sporthub-muted">Usuarios en tiempo real</p>
                            </div>
                            <Activity className="w-4 h-4 text-sporthub-neon" />
                        </div>
                        <div className="h-32 w-full relative">
                            <ResponsiveContainer width="99%" height="99%">
                                <PieChart>
                                    <Pie
                                        data={viewData.connections}
                                        innerRadius={35} outerRadius={45}
                                        dataKey="value" stroke="none" startAngle={90} endAngle={450}
                                    >
                                        {viewData.connections.map((entry, index) => (
                                            <Cell key={`cell-conn-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-white">{viewData.currentOnline}</span>
                                <span className="text-[8px] text-sporthub-neon uppercase font-black tracking-tighter shadow-neon-glow">Live</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-sporthub-neon shadow-[0_0_5px_#A3E635]" />
                                <span className="text-[10px] text-sporthub-muted uppercase tracking-tighter">Online</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <span className="text-[10px] text-sporthub-muted uppercase tracking-tighter">Offline</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* User Management Table - Exclusive for Admins */}
            {stats.is_global && (
                <div className="xl:col-span-3 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <UserManagementTable
                        users={users}
                        onlineUserIds={onlineUserIds}
                        onAction={handleUserAction}
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                    />
                </div>
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {modal.show && (
                <ConfirmationModal
                    {...modal}
                    onClose={() => setModal({ ...modal, show: false })}
                />
            )}
        </main>
    );
};

const TalentGrowthScatter = ({ data }) => (
    <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-white font-semibold">Análisis de Crecimiento de Talento</h3>
                <p className="text-xs text-sporthub-muted">Correlación estratégica: Posts vs Seguidores</p>
            </div>
            <TrendingUp className="w-5 h-5 text-sporthub-neon" />
        </div>

        <div className="h-80 w-full mt-4">
            {data.length > 0 ? (
                <ResponsiveContainer width="99%" height="99%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            type="number"
                            dataKey="posts"
                            name="Posts"
                            stroke={COLORS.muted}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: COLORS.muted, fontWeight: 'bold' }}
                            domain={[0, dataMax => Math.ceil(dataMax * 1.1 + 1)]}
                        >
                            <Label
                                value="TOTAL DE PUBLICACIONES"
                                position="bottom"
                                offset={-5}
                                fill={COLORS.muted}
                                fontSize={9}
                                fontWeight="bold"
                                style={{ letterSpacing: '0.1em' }}
                            />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="followers"
                            name="Seguidores"
                            stroke={COLORS.muted}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                            tick={{ fill: COLORS.muted, fontWeight: 'bold' }}
                            domain={[0, dataMax => Math.ceil(dataMax * 1.1 + 1)]}
                        >
                            <Label
                                value="NÚMERO DE SEGUIDORES"
                                angle={-90}
                                position="insideLeft"
                                style={{ textAnchor: 'middle', fill: COLORS.muted, fontSize: 9, fontWeight: 'bold', letterSpacing: '0.1em' }}
                                offset={10}
                            />
                        </YAxis>
                        <ZAxis type="number" range={[100, 100]} />
                        <RechartsTooltip
                            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const info = payload[0].payload;
                                    return (
                                        <div className="bg-[#151A23] border border-sporthub-neon/30 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                            <p className="text-white font-black text-xs uppercase tracking-tight mb-2 italic border-b border-white/10 pb-2">{info.name}</p>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between gap-6 items-center">
                                                    <span className="text-[9px] text-sporthub-muted uppercase font-black tracking-widest">Total Posts:</span>
                                                    <span className="text-xs text-sporthub-neon font-black">{info.posts}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 items-center">
                                                    <span className="text-[9px] text-sporthub-muted uppercase font-black tracking-widest">Seguidores:</span>
                                                    <span className="text-xs text-sporthub-cyan font-black">{info.followers}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter
                            name="Talentos"
                            data={data}
                            fill={COLORS.neon}
                            fillOpacity={0.7}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS.neon}
                                    className="drop-shadow-[0_0_10px_rgba(163,230,53,0.6)] cursor-pointer transition-all duration-300 hover:opacity-100"
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 border border-dashed border-sporthub-border rounded-xl bg-white/[0.02]">
                    <Activity className="w-5 h-5 text-sporthub-muted animate-pulse" />
                    <span className="text-[10px] text-sporthub-muted uppercase tracking-[0.2em] font-black italic">Recolectando correlaciones...</span>
                </div>
            )}
        </div>
    </div>
);

const CommunityPulse = ({ data }) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Encontrar el máximo para normalizar la intensidad
    const maxCount = Math.max(...(data?.map(d => d.count) || [1]), 1);

    const getIntensityColor = (count) => {
        if (count === 0) return '#1A2130'; // Fondo base tenue
        const ratio = count / maxCount;

        // VISUAL FIX: Escala más agresiva para que 1 sola interacción brille
        if (ratio < 0.2) return 'rgba(34, 211, 238, 0.45)'; // Cyan visible al 45% (Subida de 0.2 a 0.45)
        if (ratio < 0.5) return 'rgba(34, 211, 238, 0.7)';  // Cyan fuerte
        if (ratio < 0.8) return '#22D3EE';                 // Cyan sólido
        return '#A3E635';                                  // Neón (Pico máximo)
    };

    return (
        <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-white font-semibold">Pulso de la Comunidad</h3>
                    <p className="text-xs text-sporthub-muted">Intensidad de actividad por horario estructural</p>
                </div>
                <div className="flex items-center gap-4 bg-[#0B0F19] px-4 py-2 rounded-xl border border-sporthub-border">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#1A2130]" />
                        <span className="text-[9px] text-sporthub-muted font-bold uppercase">Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sporthub-neon shadow-[0_0_8px_#A3E635]" />
                        <span className="text-[9px] text-sporthub-neon font-bold uppercase">Pico</span>
                    </div>
                </div>
            </div>

            <div className="relative overflow-x-auto custom-scrollbar pb-4">
                <div className="min-w-[700px]">
                    {/* Header de horas */}
                    <div className="flex mb-2 ml-10">
                        {hours.map(h => (
                            <div key={h} className="flex-1 text-center text-[8px] text-sporthub-muted font-black">
                                {h.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                    {/* Grid principal */}
                    <div className="space-y-1">
                        {days.map((dayName, dayIdx) => (
                            <div key={dayName} className="flex items-center gap-1">
                                <div className="w-10 text-[9px] text-sporthub-muted font-bold uppercase">{dayName}</div>
                                <div className="flex-1 flex gap-1">
                                    {hours.map(hour => {
                                        const cell = data?.find(d => d.day === (dayIdx + 1) && d.hour === hour);
                                        const count = cell?.count || 0;
                                        return (
                                            <div
                                                key={`${dayIdx}-${hour}`}
                                                className="flex-1 aspect-square rounded-sm transition-all duration-500 hover:scale-125 hover:z-10 group relative"
                                                style={{ backgroundColor: getIntensityColor(count) }}
                                            >
                                                {/* Tooltip personalizado CSS */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-sporthub-card border border-sporthub-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                                                        {dayName} - {hour}:00
                                                    </p>
                                                    <p className="text-xs font-bold text-sporthub-cyan">
                                                        {count} {count === 1 ? 'Interacción' : 'Interacciones'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-[#0B0F19]/50 rounded-xl border border-dashed border-sporthub-border flex items-center gap-3">
                <Activity className="w-4 h-4 text-sporthub-neon animate-pulse" />
                <p className="text-[10px] text-sporthub-muted font-medium uppercase tracking-widest leading-relaxed">
                    Visualización basada en <span className="text-white">Engagement Orgánico</span> (Likes + Mensajes + Comentarios).
                    Los datos se sincronizan cada vez que el <span className="text-sporthub-cyan">WebSocket</span> detecta un pulso activo.
                </p>
            </div>
        </div>
    );
};

// --- Subcomponentes de UI ---

const UserManagementTable = ({ users, onlineUserIds, onAction, searchQuery, onSearch }) => {
    const [roleFilter, setRoleFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            const matchesCity = !cityFilter || (u.city && u.city.toLowerCase().includes(cityFilter.toLowerCase()));

            return matchesSearch && matchesRole && matchesCity;
        });
    }, [users, searchQuery, roleFilter, cityFilter]);

    const isFiltered = roleFilter !== 'all' || cityFilter !== '' || searchQuery !== '';

    const handleClearFilters = () => {
        setRoleFilter('all');
        setCityFilter('');
        onSearch('');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const RoleBadge = ({ role }) => {
        const styles = {
            admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            recruiter: 'bg-sporthub-cyan/10 text-sporthub-cyan border-sporthub-cyan/30',
            athlete: 'bg-sporthub-neon/10 text-sporthub-neon border-sporthub-neon/30'
        };
        const labels = { admin: 'Admin', recruiter: 'Reclutador', athlete: 'Deportista' };
        return (
            <span className={`backdrop-blur-md text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm ${styles[role] || styles.athlete}`}>
                {labels[role] || role}
            </span>
        );
    };

    const StatusBadge = ({ user }) => {
        if (!user.is_active) return <span className="text-[8px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold">Eliminado</span>;
        if (user.is_suspended) return <span className="text-[8px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase font-bold">Suspendido</span>;
        return null;
    };

    const str = (id) => typeof id === 'object' ? id.$oid || String(id) : String(id);

    return (
        <div className="bg-sporthub-card rounded-[2rem] border border-sporthub-border overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-sporthub-border flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0B0F19]/40 gap-4">
                <div>
                    <h3 className="text-white font-semibold">Gestión de Usuarios</h3>
                    <p className="text-xs text-sporthub-muted">Control de jerarquía y estados de cuenta ({users.length} usuarios)</p>
                </div>
                <div className="relative flex flex-wrap gap-4 w-full md:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-[#0B0F19] border border-sporthub-border rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-sporthub-neon transition-all"
                    >
                        <option value="all">Todos los Roles</option>
                        <option value="athlete">Deportistas</option>
                        <option value="recruiter">Reclutadores</option>
                        <option value="admin">Administradores</option>
                    </select>

                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sporthub-muted" />
                        <input type="text" placeholder="Ciudad..." className="bg-[#0B0F19] border border-sporthub-border rounded-xl pl-12 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-sporthub-neon w-full md:w-32 transition-all" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
                    </div>

                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sporthub-muted" />
                        <input type="text" placeholder="Nombre o email..." className="w-full bg-[#0B0F19] border border-sporthub-border rounded-xl pl-12 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-sporthub-cyan transition-all" value={searchQuery} onChange={(e) => onSearch(e.target.value)} />
                    </div>

                    {isFiltered && (
                        <button
                            onClick={handleClearFilters}
                            className="text-[10px] text-sporthub-cyan font-bold uppercase tracking-wider hover:opacity-80 transition-all flex items-center gap-1 md:ml-2"
                        >
                            <X className="w-3.5 h-3.5" /> Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] text-sporthub-muted uppercase font-black bg-[#0B0F19]/60">
                        <tr>
                            <th className="px-8 py-5 flex items-center gap-2"><User className="w-3 h-3 text-sporthub-cyan" /> USUARIO</th>
                            <th className="px-8 py-5"><div className="flex items-center gap-2"><Mail className="w-3 h-3 text-sporthub-neon" /> CORREO</div></th>
                            <th className="px-8 py-5"><div className="flex items-center gap-2"><Shield className="w-3 h-3 text-purple-400" /> ROL</div></th>
                            <th className="px-8 py-5 text-center"><div className="flex items-center justify-center gap-2"><Activity className="w-3 h-3 text-sporthub-neon" /> ACTIVIDAD</div></th>
                            <th className="px-8 py-5"><div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-sporthub-cyan" /> UBICACIÓN</div></th>
                            <th className="px-8 py-5"><div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-sporthub-muted" /> REGISTRO</div></th>
                            <th className="px-8 py-5 text-center"><div className="flex items-center justify-center gap-2"><Settings className="w-3 h-3 text-sporthub-muted" /> ACCIONES</div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sporthub-border/50">
                        {filteredUsers.map(u => (
                            <tr key={str(u.id)} className="hover:bg-white/[0.03] transition-all duration-300">
                                <td className="px-8 py-6 flex items-center gap-4">
                                    <Link to={`/profile?id=${str(u.id)}`} className="relative group/avatar">
                                        <div className="w-12 h-12 rounded-full border-2 border-sporthub-border overflow-hidden bg-sporthub-bg shadow-lg transition-all group-hover/avatar:border-sporthub-neon/50">
                                            <img
                                                src={getMediaUrl(u.avatar_url)}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                                alt={u.name}
                                            />
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-sporthub-card ${onlineUserIds?.has(str(u.id)) ? 'bg-sporthub-neon shadow-[0_0_12px_#A3E635] animate-pulse' : 'bg-[#334155]'}`} title={onlineUserIds?.has(str(u.id)) ? "Online" : "Offline"} />
                                    </Link>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link to={`/profile?id=${str(u.id)}`} className="text-sm font-black text-white tracking-tight hover:text-sporthub-neon transition-colors">
                                                {u.name}
                                            </Link>
                                            <StatusBadge user={u} />
                                        </div>
                                        <p className="text-[10px] text-sporthub-muted font-semibold truncate max-w-[150px]">
                                            {u.role === 'athlete'
                                                ? (u.sport ? `${u.sport}${u.position ? ` - ${u.position}` : ''}` : u.email)
                                                : (u.company || u.job_title ? `${u.company || ''}${u.company && u.job_title ? ' - ' : ''}${u.job_title || ''}` : u.email)
                                            }
                                        </p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-sporthub-muted">
                                        <Mail className="w-3.5 h-3.5 text-sporthub-neon/50" />
                                        <span className="text-[11px] font-medium truncate max-w-[150px] lowercase">{u.email}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <RoleBadge role={u.role} />
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-white tracking-tighter">{u.posts_count || 0}</span>
                                            <span className="text-[8px] text-sporthub-muted uppercase font-black tracking-widest">POSTS</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-sporthub-cyan tracking-tighter">{u.services_count || 0}</span>
                                            <span className="text-[8px] text-sporthub-muted uppercase font-black tracking-widest">SERVS</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-1.5 text-sporthub-muted">
                                        <MapPin className="w-3.5 h-3.5 text-sporthub-cyan" />
                                        <span className="text-[11px] font-medium truncate max-w-[100px]">{u.city || 'Quito, EC'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-[11px] text-sporthub-muted font-medium">{formatDate(u.created_at)}</p>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => onAction(str(u.id), 'promote', u.name)} className="p-3 bg-white/5 text-sporthub-muted hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all" title="Promover/Degradar"><ShieldCheck className="w-4 h-4" /></button>
                                        {u.is_active && !u.is_suspended ? (
                                            <button onClick={() => onAction(str(u.id), 'suspend', u.name)} className="p-3 bg-white/5 text-sporthub-muted hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all" title="Suspender"><UserX className="w-4 h-4" /></button>
                                        ) : (
                                            <button onClick={() => onAction(str(u.id), 'reactivate', u.name)} className="p-3 bg-white/5 text-sporthub-muted hover:text-sporthub-neon hover:bg-sporthub-neon/10 rounded-xl transition-all" title="Reactivar"><UserCheck className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => onAction(str(u.id), 'delete', u.name)} className="p-3 bg-white/5 text-sporthub-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-sporthub-muted text-sm italic">
                        No se encontraron usuarios que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

const Toast = ({ message, type, onClose }) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl ${type === 'success'
                ? 'bg-[#151A23] border-sporthub-neon/30 text-sporthub-neon'
                : 'bg-[#151A23] border-red-500/30 text-red-400'
                }`}>
                {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                <p className="text-sm font-bold tracking-tight">{message}</p>
                <button onClick={onClose} className="ml-2 p-1 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-4 h-4 text-sporthub-muted" />
                </button>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ title, message, onConfirm, onClose, actionType }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-sporthub-card border border-sporthub-border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${actionType === 'delete' ? 'bg-red-500/10 text-red-400' :
                        actionType === 'promote' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-orange-500/10 text-orange-400'
                        }`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm text-sporthub-muted">{message}</p>
                </div>
                <div className="flex border-t border-sporthub-border">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-4 text-sm font-bold text-sporthub-muted hover:bg-white/5 transition-colors border-r border-sporthub-border"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-4 text-sm font-black uppercase tracking-wider transition-colors ${actionType === 'delete' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                            'bg-sporthub-neon/10 text-sporthub-neon hover:bg-sporthub-neon/20'
                            }`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;