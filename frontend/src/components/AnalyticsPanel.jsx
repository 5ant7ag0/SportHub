import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const AnalyticsPanel = ({ 
    analytics, 
    barData = [], 
    engagementRate = "0.0", 
    impresiones = "0", 
    reach = "0" 
}) => {
    // Fail-safe: Si no hay analytics o barData no es array, mostrar estado de carga sutil
    const isDataReady = analytics && Array.isArray(barData) && barData.length > 0;

    return (
        <div className="hidden xl:flex w-[350px] flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pb-4 pr-1">
            
            {/* Visitas al Perfil (Donut) */}
            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-sm">
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
                            <Pie 
                                data={[{value: 68}, {value: 32}]} 
                                dataKey="value" 
                                innerRadius={55} 
                                outerRadius={70} 
                                startAngle={90} 
                                endAngle={-270} 
                                stroke="none"
                            >
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
            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-sm">
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
                    {!isDataReady ? (
                        <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/10">
                            <span className="text-[10px] text-gray-500 italic">Cargando demografía...</span>
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 shadow-sm">
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
    );
};

export default AnalyticsPanel;
