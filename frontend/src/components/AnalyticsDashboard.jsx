import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Heart, MessageCircle, Loader2, ShieldCheck, ShieldAlert, Trash2, UserX, Search, CheckCircle2, UserCheck, X, MapPin, User, Shield, Activity, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

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
    trends: [], // Se inicia vacío, sin mocks
    newFollowers: 0,
    totalFollowers: 0,
    totalPosts: 0,
};

const StatCard = ({ label, value, type }) => (
    <div className={`p-6 rounded-2xl border border-sporthub-border ${type === 'neon' ? 'bg-sporthub-neon/10' : type === 'cyan' ? 'bg-sporthub-cyan/10' : 'bg-sporthub-card'}`}>
        <p className={`text-2xl font-bold mb-1 ${type === 'neon' ? 'text-sporthub-neon' : type === 'cyan' ? 'text-sporthub-cyan' : 'text-white'}`}>{value}</p>
        <p className="text-xs text-sporthub-muted uppercase tracking-wider">{label}</p>
    </div>
);

// NUEVA REGLA: Colores fijos por deporte
const getSportColor = (sportName) => {
    const name = String(sportName || '').toUpperCase();
    if (name.includes('FUTBOL') || name.includes('FÚTBOL')) return COLORS.neon;
    if (name.includes('BASQUET') || name.includes('BÁSQUET')) return COLORS.cyan;
    if (name.includes('ECUAVOLEY')) return '#A855F7'; // Morado brillante
    return '#F59E0B'; // Naranja para cualquier otro que se cuele
};

export const AnalyticsDashboard = () => {
    // CORRECCIÓN: Importamos onlineUserIds y lastNotification del AuthContext
    const { user: authUser, onlineUserIds, lastNotification } = useAuth();

    const [stats, setStats] = useState(INITIAL_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null, actionType: '' });

    // Función para obtener las estadísticas globales
    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
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
                trends: Array.isArray(data?.trends) ? data.trends : [], // Sin fallback a mocks
                newFollowers: data?.new_followers || 0, // Sin fallback a mocks
                totalFollowers: authUser?.followers_count || 0,
                totalPosts: authUser?.posts_count || 0,
            });
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

    useEffect(() => {
        if (stats.is_global) {
            fetchUsers();
        }
    }, [stats.is_global]);

    // 🟢 CORRECCIÓN: Se eliminó el new WebSocket() interno.
    // Ahora escuchamos lastNotification del AuthContext para refrescar.
    useEffect(() => {
        if (lastNotification?.type === 'feed_update' || lastNotification?.type === 'data_refresh' || lastNotification?.type === 'new_notification') {
            console.log("Actualizando métricas globales desde contexto...");
            fetchAnalytics();
        }
    }, [lastNotification]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleUserAction = (userId, action, userName) => {
        const config = {
            promote: {
                title: 'Cambiar Privilegios',
                message: `¿Deseas modificar los permisos administrativos de ${userName}?`,
                actionLabels: 'Cambiar Rango'
            },
            delete: {
                title: 'Eliminar Cuenta',
                message: `¿Estás seguro de desactivar definitivamente la cuenta de ${userName}? Esta acción es irreversible.`,
                actionLabels: 'Eliminar'
            },
            suspend: {
                title: 'Suspender Usuario',
                message: `¿Deseas restringir el acceso a la plataforma para ${userName}?`,
                actionLabels: 'Suspender'
            },
            reactivate: {
                title: 'Reactivar Usuario',
                message: `¿Restaurar el acceso completo para ${userName}?`,
                actionLabels: 'Reactivar'
            }
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

    const str = (id) => typeof id === 'object' ? id.$oid || String(id) : String(id);

    // Lógica consolidada y blindada (Atomic Analytics Logic)
    const viewData = useMemo(() => {
        const d = stats || INITIAL_STATS;

        // 1. Engagement & Meta
        const total_v = d.total_visits || 0;
        const total_l = d.total_likes || 0;
        const total_c = d.total_comments || 0;
        const rate = total_v > 0 ? (((total_l + total_c) / total_v) * 100).toFixed(1) : "0.0";
        const completed = Math.min((total_v / 4000) * 100, 100);

        // 2. Demografía (Main Bar)
        const demo = Array.isArray(d.demographics) ? d.demographics.map(x => ({
            name: `${x.age_group_start || 0}-${(x.age_group_start || 0) + 9}`,
            percentage: x.percentage || 0,
            count: x.count || 0
        })) : [];

        // 3. Tendencias de Interacción (Main Line) - Ya no usa MOCKS
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

        // 4. Crecimiento de Usuarios (Area Chart)
        const growth = Array.isArray(d.user_growth) ? d.user_growth.map(g => ({
            name: g._id, // YYYY-MM
            usuarios: g.count || 0
        })) : [];

        // 5. Deportes (Pie Chart)
        let donut = [];
        if (d.is_global && Array.isArray(d.stats_por_deporte) && d.stats_por_deporte.length > 0) {
            donut = d.stats_por_deporte.map(s => ({ name: s._id || 'Otro', value: s.count || 0 }));
        } else if (d.is_global) {
            donut = [{ name: 'Sin datos', value: 1 }];
        } else {
            donut = [{ name: 'Visitas', value: completed }, { name: 'Meta', value: Math.max(0, 100 - completed) }];
        }

        // 6. Conectividad (Donut Chart) - CORRECCIÓN: Usa onlineUserIds del Contexto
        const currentOnline = onlineUserIds?.size || 0;
        const currentTotal = d.extra_stats?.total_users || users.length || 100;
        const connections = [
            { name: 'Online', value: currentOnline, color: COLORS.neon },
            { name: 'Offline', value: Math.max(0, currentTotal - currentOnline), color: '#1a2130' }
        ];

        // 7. Ciudades (Horizontal Bar)
        const cities = Array.isArray(d.city_ranking) ? d.city_ranking.map(c => ({
            name: c._id || 'Desconocida',
            count: c.count || 0
        })) : [];

        return { rate, completed, demo, trend, growth, donut, connections, cities, currentOnline };
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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${stats.is_global ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-sporthub-neon/10 text-sporthub-neon border border-sporthub-neon/20'}`}>
                            {stats.is_global ? 'Modo Administrador' : 'Modo Personal'}
                        </span>
                    </div>
                    <p className="text-sm text-sporthub-muted">
                        {stats.is_global
                            ? 'Panel de control global con métricas clave de toda la plataforma.'
                            : 'Resumen detallado de tu rendimiento y métricas de audiencia.'}
                    </p>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-3 gap-6">
                    {stats?.is_global ? (
                        <>
                            <StatCard label="Usuarios Totales" value={(stats?.extra_stats?.total_users || 0).toLocaleString()} type="neon" />
                            <StatCard label="Contenido Global" value={(stats?.extra_stats?.total_posts || 0).toLocaleString()} type="cyan" />
                            <StatCard label="Engagement Medio" value={`${viewData.rate}%`} type="normal" />
                        </>
                    ) : (
                        <>
                            <StatCard label="Rating" value="4.8" type="neon" />
                            <StatCard label="Seguidores" value={(stats?.totalFollowers || 0).toLocaleString()} type="cyan" />
                            <StatCard label="Posts" value={(stats?.totalPosts || 0).toLocaleString()} type="normal" />
                        </>
                    )}
                </div>

                {/* Two large summary cards */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-sporthub-card rounded-[1.5rem] border border-sporthub-border relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                {/* Cambiamos el Título */}
                                <h3 className="text-white font-bold text-lg leading-tight">
                                    {stats.is_global ? 'Crecimiento de la Red' : 'Impacto en el Perfil'}
                                </h3>
                                <p className="text-[10px] text-sporthub-muted uppercase font-bold tracking-widest mt-1">Sincronizado vía WebSocket</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-sporthub-neon" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                {/* Cambiamos el Subtítulo Izquierdo */}
                                <p className="text-xs text-sporthub-muted mb-1 uppercase font-bold">
                                    {stats?.is_global ? 'Usuarios Registrados' : 'Visitas Totales'}
                                </p>
                                <p className="text-4xl font-black text-white tracking-tighter">{(stats.total_visits || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                {/* Cambiamos el Subtítulo Derecho */}
                                <p className="text-[10px] text-sporthub-muted mb-1 uppercase font-bold">
                                    {stats?.is_global ? 'Nuevos Hoy' : 'Nuevos Fans'}
                                </p>
                                <p className="text-2xl font-black text-sporthub-cyan">+{stats.new_followers || 0}</p>
                            </div>
                        </div>
                    </div>

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
                        <div className="h-40 w-full mt-4" key={`bar-${stats?.is_global ? 'admin' : 'user'}`}>
                            {viewData.demo.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={viewData.demo}>
                                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                        <YAxis tick={false} axisLine={false} width={35} domain={[0, 'auto']} stroke="rgba(255,255,255,0.1)" />
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
                </div>

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
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <LineChart data={viewData.trend} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                    <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                    {/* 🟢 EJE Y ACTIVADO CON ESTILOS */}
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
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart data={viewData.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.neon} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.neon} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} dy={10} />
                                        {/* 🟢 EJE Y ACTIVADO CON ESTILOS */}
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
            </div>

            {/* Right Sidebar Column */}
            <div className="flex flex-col gap-6">

                {/* Circular Donut Widget (Adapted for Sports) */}
                <div className="p-6 bg-sporthub-card rounded-2xl border border-sporthub-border flex flex-col items-center">
                    <div className="flex justify-between items-start w-full mb-4">
                        <div>
                            <h3 className="text-white font-semibold text-sm">
                                {stats.is_global ? 'Distribución por Deporte' : 'Progreso hacia Meta'}
                            </h3>
                            <p className="text-[10px] text-sporthub-muted">
                                {stats.is_global ? 'Talentos por categoría' : 'Objetivo de visibilidad'}
                            </p>
                        </div>
                    </div>

                    <div className="h-44 w-full relative flex items-center justify-center" key={`pie-${stats?.is_global ? 'admin' : 'user'}`}>
                        {viewData.donut.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={viewData.donut}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        dataKey="value"
                                        stroke="none"
                                        isAnimationActive={false}
                                    >
                                        {viewData.donut.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                // USAMOS LA REGLA FIJA DE COLORES AQUÍ
                                                fill={stats.is_global
                                                    ? getSportColor(entry.name)
                                                    : (index === 0 ? COLORS.neon : '#1a2130')}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        cursor={false}
                                        offset={40}
                                        wrapperStyle={{ zIndex: 100 }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: '#22D3EE',
                                            borderRadius: '12px',
                                            padding: '10px 15px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                        }}
                                        itemStyle={{
                                            color: '#F8FAFC',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-[10px] text-sporthub-muted uppercase tracking-widest italic">Visitas insuficientes</div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {stats?.is_global ? (
                                <>
                                    <span className="text-xl font-bold text-white">{stats?.extra_stats?.total_users || 0}</span>
                                    <span className="text-[9px] text-sporthub-muted uppercase font-black">Talentos</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-white">{Number(viewData.completed).toFixed(1)}%</span>
                                    <span className="text-[9px] text-sporthub-muted">{(stats?.total_visits || 0).toLocaleString()} de 4000</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* NUEVO: LEYENDA INFERIOR FIJA */}
                    {stats?.is_global && (
                        <div className="flex justify-center gap-4 mt-6 w-full border-t border-sporthub-border/50 pt-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_#A3E635]" style={{ backgroundColor: COLORS.neon }} />
                                <span className="text-[9px] text-white font-bold uppercase tracking-widest">Fútbol</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_#22D3EE]" style={{ backgroundColor: COLORS.cyan }} />
                                <span className="text-[9px] text-white font-bold uppercase tracking-widest">Básquet</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_5px_#A855F7]" style={{ backgroundColor: '#A855F7' }} />
                                <span className="text-[9px] text-white font-bold uppercase tracking-widest">Ecuavoley</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* City Ranking Widget */}
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
                                            className="h-full bg-gradient-to-r from-sporthub-cyan to-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(city.count / Math.max(...viewData.cities.map(c => c.count), 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-[10px] text-sporthub-muted text-center py-4 italic">Sin datos geográficos registrados</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Connection Status Widget */}
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
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={viewData.connections}
                                        innerRadius={35}
                                        outerRadius={45}
                                        dataKey="value"
                                        stroke="none"
                                        startAngle={90}
                                        endAngle={450}
                                    >
                                        {viewData.connections.map((entry, index) => (
                                            <Cell key={`cell-conn-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-white leading-none">{viewData.currentOnline}</span>
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
                        onlineUserIds={onlineUserIds} // 🟢 PASAMOS EL SET DEL CONTEXTO
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

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const RoleBadge = ({ role }) => {
        const styles = {
            admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            scout: 'bg-sporthub-cyan/10 text-sporthub-cyan border-sporthub-cyan/20',
            athlete: 'bg-sporthub-neon/10 text-sporthub-neon border-sporthub-neon/20'
        };
        const labels = { admin: 'Administrador', scout: 'Reclutador', athlete: 'Deportista' };
        return (
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles[role] || styles.athlete}`}>
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
        <div className="bg-sporthub-card rounded-2xl border border-sporthub-border overflow-hidden">
            <div className="p-6 border-b border-sporthub-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-white font-bold text-lg">Gestión de Usuarios</h3>
                    <p className="text-xs text-sporthub-muted">Control de jerarquía y estados de cuenta ({users.length} usuarios)</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Filtro de Rol */}
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="appearance-none bg-[#0B0F19] border border-sporthub-border rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                            <option value="all">Todos los Roles</option>
                            <option value="athlete">Deportistas</option>
                            <option value="scout">Reclutadores</option>
                            <option value="admin">Administradores</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sporthub-muted">
                            <TrendingUp className="w-3 h-3 rotate-90" />
                        </div>
                    </div>

                    {/* Filtro de Ciudad */}
                    <div className="relative w-full md:w-40">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sporthub-muted" />
                        <input
                            type="text"
                            placeholder="Ciudad..."
                            className="w-full bg-[#0B0F19] border border-sporthub-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sporthub-neon transition-colors"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        />
                    </div>

                    {/* Búsqueda Principal */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sporthub-muted" />
                        <input
                            type="text"
                            placeholder="Nombre o email..."
                            className="w-full bg-[#0B0F19] border border-sporthub-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sporthub-cyan transition-colors"
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0B0F19]/50">
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-sporthub-cyan" />
                                    <span>Usuario</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3 text-purple-400" />
                                    <span>Rol</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest">
                                <div className="flex items-center justify-center gap-2 text-center">
                                    <Activity className="w-3 h-3 text-sporthub-neon" />
                                    <span>Actividad</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest">
                                <div className="flex items-center justify-center gap-2 text-center">
                                    <MapPin className="w-3 h-3 text-sporthub-cyan" />
                                    <span>Ubicación</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-sporthub-muted" />
                                    <span>Registro</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-sporthub-muted uppercase tracking-widest text-right">
                                <div className="flex items-center justify-end gap-2 text-right">
                                    <Settings className="w-3 h-3 text-sporthub-muted" />
                                    <span>Acciones</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sporthub-border">
                        {filteredUsers.map((u) => (
                            <tr key={str(u.id)} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 relative">
                                            <div className="w-full h-full rounded-full border-2 border-sporthub-border overflow-hidden bg-sporthub-bg">
                                                <img src={u.avatar_url || "/test_media/sample_atleta.svg"} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            {/* Punto verde basado en onlineUserIds del Contexto */}
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sporthub-card ${onlineUserIds?.has(str(u.id)) ? 'bg-sporthub-neon shadow-[0_0_10px_rgba(163,230,53,0.9)] animate-pulse' : 'bg-[#334155]'}`} title={onlineUserIds?.has(str(u.id)) ? "Online" : "Offline"} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white">{u.name}</p>
                                                <StatusBadge user={u} />
                                            </div>
                                            <p className="text-[11px] text-sporthub-muted">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <RoleBadge role={u.role} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center" title="Publicaciones">
                                            <span className="text-xs font-bold text-white">{u.posts_count || 0}</span>
                                            <span className="text-[9px] text-sporthub-muted uppercase">Posts</span>
                                        </div>
                                        <div className="flex flex-col items-center" title="Servicios">
                                            <span className="text-xs font-bold text-sporthub-cyan">{u.services_count || 0}</span>
                                            <span className="text-[9px] text-sporthub-muted uppercase">Servs</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-sporthub-muted">
                                        <MapPin className="w-3.5 h-3.5 text-sporthub-cyan" />
                                        <span className="text-[11px] font-medium truncate max-w-[100px]">{u.city || 'Quito, EC'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[11px] text-sporthub-muted font-medium">{formatDate(u.created_at)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end items-center gap-1">
                                        <button
                                            onClick={() => onAction(str(u.id), 'promote', u.name)}
                                            className={`p-2 rounded-lg transition-all ${u.role === 'admin' ? 'text-purple-400 hover:bg-purple-500/10' : 'text-sporthub-muted hover:text-purple-400 hover:bg-purple-500/10'}`}
                                            title={u.role === 'admin' ? "Bajar Rango a Atleta" : "Promover a Admin"}
                                        >
                                            {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </button>
                                        {u.is_active && !u.is_suspended ? (
                                            <button
                                                onClick={() => onAction(str(u.id), 'suspend', u.name)}
                                                className="p-2 text-sporthub-muted hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                                                title="Suspender Cuenta"
                                            >
                                                <UserX className="w-4 h-4" />
                                            </button>
                                        ) : !u.is_active || u.is_suspended ? (
                                            <button
                                                onClick={() => onAction(str(u.id), 'reactivate', u.name)}
                                                className="p-2 text-sporthub-muted hover:text-sporthub-neon hover:bg-sporthub-neon/10 rounded-lg transition-all"
                                                title="Reactivar Cuenta"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                            </button>
                                        ) : null}
                                        {u.is_active && (
                                            <button
                                                onClick={() => onAction(str(u.id), 'delete', u.name)}
                                                className="p-2 text-sporthub-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Eliminar (Soft Delete)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-sporthub-muted text-sm italic">No se encontraron usuarios que coincidan con la búsqueda.</p>
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