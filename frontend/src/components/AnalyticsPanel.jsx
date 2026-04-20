// Componente que muestra las estadísticas de la plataforma
// Se encarga de mostrar las estadísticas de la plataforma
// Utiliza gráficos de Recharts para mostrar las estadísticas
import React, { useMemo } from 'react';
import { Activity, Heart, Users, TrendingUp, MessageCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

const getSportColor = (sportName) => {
    const name = String(sportName || '').toUpperCase();
    if (name.includes('FUTBOL') || name.includes('FÚTBOL')) return COLORS.neon;
    if (name.includes('BASQUET') || name.includes('BÁSQUET')) return COLORS.cyan;
    if (name.includes('VOLEY')) return '#A855F7';
    return '#F59E0B';
};

const AnalyticsPanel = ({
    analytics
}) => {
    const stats = analytics || {};

    // 1. DATA PROCESSING FOR SPORT DONUT
    const sportsDonut = useMemo(() => {
        if (!stats.stats_por_deporte) return [];
        return stats.stats_por_deporte.map(s => ({
            name: s._id,
            value: s.count
        })).slice(0, 5); // Top 5
    }, [stats.stats_por_deporte]);

    // 2. METRICS DATA
    const engagementRate = useMemo(() => {
        if (!stats.total_visits || stats.total_visits === 0) return "8.5"; // Fallback aesthetic
        const rate = ((stats.total_likes + stats.total_comments) / stats.total_visits) * 100;
        return rate.toFixed(1);
    }, [stats.total_visits, stats.total_likes, stats.total_comments]);

    // 3. GOAL PROGRESS
    const goalDonut = useMemo(() => {
        const goal = 4000;
        const current = stats.total_visits || 0;
        const percent = Math.min(Math.round((current / goal) * 100), 100);
        return [
            { name: 'Completed', value: percent },
            { name: 'Remaining', value: 100 - percent }
        ];
    }, [stats.total_visits]);

    return (
        <div className="hidden xl:flex w-[350px] flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pb-4 pr-1">

            {/* WIDGET 1: DISTRIBUCIÓN POR DEPORTE */}
            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl flex flex-col items-center">
                <div className="flex justify-between items-start w-full mb-4">
                    <div>
                        <h3 className="text-white font-bold text-sm">Distribución por Deporte</h3>
                        <p className="text-[10px] text-gray-500">Talentos por categoría</p>
                    </div>
                </div>

                <div className="h-44 w-full relative flex items-center justify-center">
                    {sportsDonut.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sportsDonut}
                                    cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                                    dataKey="value" stroke="none" isAnimationActive={false}
                                >
                                    {sportsDonut.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getSportColor(entry.name)} />
                                    ))}
                                </Pie>
                                <Tooltip
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

            {/* WIDGET 2: RESUMEN DE MÉTRICAS */}
            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl">
                <h3 className="text-white font-bold text-sm mb-5">Resumen de Métricas</h3>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-sporthub-neon" />
                            <span className="text-xs text-gray-400">Engagement</span>
                        </div>
                        <span className="text-sm font-black text-sporthub-neon">{engagementRate}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-sporthub-cyan fill-sporthub-cyan/10" />
                            <span className="text-xs text-gray-400">Likes Totales</span>
                        </div>
                        <span className="text-sm font-black text-sporthub-cyan">{(stats?.total_likes || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs text-gray-400 font-medium">Comentarios</span>
                        </div>
                        <span className="text-sm font-black text-purple-400">{(stats?.total_comments || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* WIDGET 3: PROGRESO HACIA META (Visible para Deportistas/Reclutadores) */}
            {!stats.is_global && (
                <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-xl flex flex-col items-center">
                    <div className="flex justify-between items-start w-full mb-4">
                        <div>
                            <h3 className="text-white font-bold text-sm">Progreso hacia Meta</h3>
                            <p className="text-[10px] text-gray-500">Objetivo de visibilidad</p>
                        </div>
                        <div className="bg-sporthub-neon/10 text-sporthub-neon text-[10px] font-bold px-2 py-1 rounded-md">
                            {(goalDonut[0].value)}%
                        </div>
                    </div>

                    <div className="h-32 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={goalDonut}
                                    cx="50%" cy="50%" innerRadius={40} outerRadius={52}
                                    paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}
                                >
                                    <Cell fill={COLORS.neon} className="drop-shadow-[0_0_8px_rgba(163,230,53,0.4)]" />
                                    <Cell fill="rgba(255,255,255,0.03)" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-black text-white">{(stats.total_visits || 0)}</span>
                            <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Visitas</span>
                        </div>
                    </div>

                    <div className="w-full bg-white/5 rounded-2xl p-3 mt-4 text-center">
                        <p className="text-[9px] text-gray-400 leading-tight">Te faltan <span className="text-sporthub-neon font-bold">{4000 - (stats.total_visits || 0)}</span> visitas para alcanzar el siguiente nivel de perfil verificado.</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AnalyticsPanel;
