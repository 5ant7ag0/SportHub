import React from 'react';
import { Link } from 'react-router-dom';
import { 
    TrendingUp, Heart, MessageCircle, Activity, MapPin, 
    ArrowRight, CheckCircle2, Globe, Users, Shield, 
    Zap, Target, PieChart as PieIcon, BarChart2,
    UserX, ShieldAlert, User
} from 'lucide-react';
import { 
    LineChart, Line, ResponsiveContainer, RadarChart, 
    PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell 
} from 'recharts';

// --- MOCK DATA PARA LA LANDING ---
const SKILLS_DATA = [
    { subject: 'Velocidad', A: 85, fullMark: 100 },
    { subject: 'Táctica', A: 70, fullMark: 100 },
    { subject: 'Resistencia', A: 90, fullMark: 100 },
    { subject: 'Remate', A: 75, fullMark: 100 },
    { subject: 'Control', A: 80, fullMark: 100 },
    { subject: 'Visión', A: 65, fullMark: 100 },
];

const TREND_DATA = [
    { day: 'Lun', likes: 120, comments: 45 },
    { day: 'Mar', likes: 210, comments: 80 },
    { day: 'Mié', likes: 290, comments: 120 },
    { day: 'Jue', likes: 450, comments: 180 },
    { day: 'Vie', likes: 580, comments: 220 },
    { day: 'Sáb', likes: 850, comments: 340 },
    { day: 'Dom', likes: 1100, comments: 450 },
];

const COLORS = {
    neon: '#A3E635',
    cyan: '#22D3EE',
    bg: '#0B0F19',
    card: '#151A23',
    muted: '#64748B',
    border: '#1E293B',
};

const SportDistribution = () => {
    const data = [
        { name: 'Fútbol', value: 45, color: COLORS.neon },
        { name: 'Básquet', value: 30, color: COLORS.cyan },
        { name: 'Voley', value: 25, color: '#A855F7' },
    ];

    return (
        <div className="bg-sporthub-card border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-sporthub-neon/30 flex flex-col items-center">
            <div className="w-full mb-4">
                <h3 className="text-white font-bold text-sm italic">Distribución por Deporte</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Talentos por categoría</p>
            </div>
            <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%" cy="50%" 
                            innerRadius={50} outerRadius={70}
                            dataKey="value" stroke="none" paddingAngle={5}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white italic tracking-tighter">114</span>
                    <span className="text-[8px] text-gray-500 uppercase font-black">Talentos</span>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4 w-full border-t border-white/5 pt-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MetricsSummary = () => (
    <div className="bg-sporthub-card border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl h-full transition-all hover:border-sporthub-cyan/30">
        <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2 italic">
            Resumen de Métricas <Activity className="w-4 h-4 text-sporthub-neon" />
        </h3>
        <div className="space-y-5">
            {[
                { label: 'Engagement', value: '14.2%', icon: TrendingUp, color: 'text-sporthub-neon' },
                { label: 'Total Likes', value: '8.4k', icon: Heart, color: 'text-sporthub-cyan' },
                { label: 'Comentarios', value: '1.2k', icon: MessageCircle, color: 'text-purple-400' },
            ].map((m, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <m.icon className={`w-4 h-4 ${m.color}`} />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{m.label}</span>
                    </div>
                    <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                </div>
            ))}
        </div>
    </div>
);

const InteractionChart = () => (
    <div className="bg-sporthub-card border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-sporthub-neon/20">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-white font-bold text-sm italic">Interacción Total</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Crecimiento Orgánico</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sporthub-neon" />
                    <span className="text-[10px] text-gray-400">Likes</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sporthub-cyan" />
                    <span className="text-[10px] text-gray-400">Comentarios</span>
                </div>
            </div>
        </div>
        <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                    <Line 
                        type="monotone" 
                        dataKey="likes" 
                        stroke={COLORS.neon} 
                        strokeWidth={4} 
                        dot={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="comments" 
                        stroke={COLORS.cyan} 
                        strokeWidth={4} 
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const Landing = () => {
    return (
        <div className="bg-sporthub-bg min-h-screen text-white font-outfit selection:bg-sporthub-neon selection:text-black">
            
            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 left-0 w-full z-[100] backdrop-blur-md bg-[#0B0F19]/80 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Activity className="text-sporthub-neon w-8 h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="text-2xl font-black tracking-tighter text-sporthub-neon italic">SportHub</span>
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8 px-8 py-2 bg-white/5 rounded-full border border-white/10">
                        <a href="#problema" className="text-[10px] font-black text-gray-400 hover:text-sporthub-neon transition-colors uppercase tracking-[0.2em]">Problema</a>
                        <a href="#caracteristicas" className="text-[10px] font-black text-gray-400 hover:text-sporthub-cyan transition-colors uppercase tracking-[0.2em]">Datos</a>
                        <a href="#roles" className="text-[10px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-[0.2em]">Ecosistema</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors">Iniciar sesión</Link>
                        <Link 
                            to="/register" 
                            className="bg-sporthub-neon text-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-full hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            Unirse ahora
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sporthub-neon/10 via-transparent to-transparent pointer-events-none blur-3xl opacity-50"></div>
                <div className="absolute -left-20 top-40 w-64 h-64 bg-sporthub-cyan/10 blur-[100px] rounded-full"></div>
                
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-sporthub-cyan/10 border border-sporthub-cyan/20 px-4 py-1.5 rounded-full mb-8">
                        <Globe className="w-3.5 h-3.5 text-sporthub-cyan" />
                        <span className="text-[10px] font-black text-sporthub-cyan uppercase tracking-[0.2em]">La Red de Scouting de Nueva Generación</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tight text-white uppercase italic">
                        Tu talento merece ser <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sporthub-neon via-green-400 to-sporthub-cyan animate-pulse drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">descubierto.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-14 font-medium leading-relaxed">
                        Conectamos atletas de Quito y Latinoamérica con reclutadores internacionales. 
                        Profesionaliza tu carrera usando <span className="text-white font-bold">estadísticas reales</span> y dashboards de rendimiento de élite.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link 
                            to="/register" 
                            className="w-full sm:w-auto bg-sporthub-neon text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(163,230,53,0.3)] transform hover:-translate-y-1 transition-all"
                        >
                            Registrarme como Atleta <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link 
                            to="/login" 
                            className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                        >
                            Buscar Talento <Users className="w-5 h-5 text-sporthub-cyan" />
                        </Link>
                    </div>

                    {/* SOCIAL PROOF COUNTER */}
                    <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-12">
                        <div className="flex flex-col items-center md:items-start transition-transform hover:scale-105 duration-500">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-4xl font-black text-white italic">+114</span>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-sporthub-bg bg-white/5 flex items-center justify-center backdrop-blur-sm hover:bg-sporthub-neon/20 transition-colors">
                                            <User className="w-5 h-5 text-sporthub-neon/60" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Talentos registrados</span>
                        </div>
                        
                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-4 transition-transform hover:scale-105 duration-500">
                            <div className="p-3 bg-sporthub-neon/10 rounded-2xl border border-sporthub-neon/10">
                                <MapPin className="w-6 h-6 text-sporthub-neon" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Presencia Global</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Quito, Bogotá, CDMX y Madrid</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN PROBLEMA --- */}
            <section id="problema" className="py-32 px-6 bg-[#0E121D]/50 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-black text-sporthub-muted uppercase tracking-[0.3em] mb-4">El Escenario Crítico</div>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic mb-6 leading-tight">El vacío en el sistema <span className="text-sporthub-neon">actual</span></h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-sm font-medium uppercase tracking-widest leading-relaxed">
                            El talento abunda, pero las oportunidades no. Hemos identificado las tres barreras principales que frenan a las promesas del deporte.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Scouting tradicional limitado', desc: 'Los ojeadores no pueden estar en todas partes. Miles de atletas talentosos nunca son vistos por los cazatalentos correctos.', icon: UserX },
                            { title: 'Falta de perfil profesional', desc: 'Los videos caseros en redes sociales no son suficientes. Los clubes necesitan datos, analítica y un portafolio estructurado.', icon: ShieldAlert },
                            { title: 'Fuera de las grandes ligas', desc: 'Es difícil destacar si no estás en academias de élite o ciudades principales. El talento regional queda oculto en ligas menores.', icon: Globe },
                        ].map((item, i) => (
                            <div key={i} className="group bg-sporthub-card border border-white/5 p-10 rounded-[40px] hover:bg-sporthub-card-hover transition-all duration-500 hover:-translate-y-2 border-b-4 hover:border-b-sporthub-neon shadow-xl">
                                <div className="p-4 bg-white/5 rounded-2xl w-fit mb-8 group-hover:bg-sporthub-neon/10 transition-colors">
                                    <item.icon className="w-10 h-10 text-sporthub-cyan opacity-50 group-hover:opacity-100 group-hover:text-sporthub-neon transition-all" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4 leading-tight tracking-tight uppercase italic group-hover:text-sporthub-neon transition-colors">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium group-hover:text-gray-400 transition-colors">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN CARACTERÍSTICAS (DATA-DRIVEN) --- */}
            <section id="caracteristicas" className="py-32 px-6 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sporthub-cyan/5 blur-[150px] rounded-full pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-sporthub-neon/10 border border-sporthub-neon/20 px-3 py-1 rounded-lg mb-6">
                            <PieIcon className="w-3.5 h-3.5 text-sporthub-neon" />
                            <span className="text-[10px] font-black text-sporthub-neon uppercase tracking-widest">Estadística Descriptiva & NoSQL</span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white italic leading-[0.95] mb-10 uppercase tracking-tighter">
                            Datos que <span className="text-sporthub-cyan">hablan</span> <br /> por ti
                        </h2>
                        <p className="text-gray-400 text-lg mb-12 leading-relaxed font-medium">
                            Dejamos atrás las suposiciones. SportHub procesa miles de puntos de datos de tu rendimiento para generar un perfil hiper-preciso que enamora a cualquier director deportivo.
                        </p>

                        <div className="space-y-10">
                            {[
                                { title: 'Dashboards en Tiempo Real', desc: 'Evolución de métricas físicas y tácticas con gráficas comparativas automáticas.', icon: BarChart2 },
                                { title: 'Rastreador de Habilidades', desc: 'Mapeo radar de velocidad, resistencia, técnica y capacidad de toma de decisiones.', icon: Zap },
                                { title: 'Mapas de Calor y Actividad', desc: 'Visualizaciones avanzadas de tu zona de influencia en el campo de juego.', icon: MapPin },
                            ].map((feat, i) => (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="mt-1 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-sporthub-neon/30 transition-all shadow-xl group-hover:bg-sporthub-neon/5">
                                        <feat.icon className="w-5 h-5 text-sporthub-neon" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1 group-hover:text-sporthub-neon transition-colors tracking-tight uppercase italic">{feat.title}</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative perspective-1000">
                        {/* Gráficos de Ejemplo (Inyectados desde componentes mock) */}
                        <div className="md:col-span-2 transform hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
                            <InteractionChart />
                        </div>
                        <div className="transform hover:scale-[1.05] transition-transform duration-700 shadow-2xl">
                            <SportDistribution />
                        </div>
                        <div className="transform hover:scale-[1.05] transition-transform duration-700 shadow-2xl">
                            <MetricsSummary />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN ROLES --- */}
            <section id="roles" className="py-32 px-6 bg-[#0E121D]/50 border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="text-[10px] font-black text-sporthub-cyan uppercase tracking-[0.4em] mb-4 italic">El Ecosistema</div>
                        <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase mb-4 tracking-tight">Un Ecosistema de Dos Lados</h2>
                        <div className="w-20 h-1 bg-sporthub-neon mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* PARA ATLETAS */}
                        <div className="bg-sporthub-card border border-sporthub-neon/20 p-12 rounded-[60px] relative overflow-hidden group hover:bg-sporthub-neon/[0.02] transition-colors border-b-8">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 group-hover:scale-125 transition-all duration-1000 grayscale group-hover:grayscale-0">
                                <Users className="w-64 h-64 text-sporthub-neon" />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <h3 className="text-4xl font-black text-white uppercase mb-2 italic tracking-tighter">Para Atletas</h3>
                                <p className="text-sporthub-neon font-black text-[10px] uppercase tracking-[0.3em] mb-10">Tu carrera necesita visibilidad</p>
                                <ul className="space-y-6 mb-12 flex-1">
                                    {[
                                        'Portafolio digital centralizado y profesional',
                                        'Estadísticas de rendimiento validadas (Reales)',
                                        'Mayor visibilidad ante clubes internacionales',
                                        'Red de contactos y networking directo',
                                    ].map(txt => (
                                        <li key={txt} className="flex items-center gap-4 text-sm text-gray-400 font-bold group-hover:text-gray-200 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-sporthub-neon shrink-0" />
                                            {txt}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/register" className="inline-flex items-center justify-center gap-3 bg-sporthub-neon text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-sporthub-neon/20">
                                    Crear mi Perfil <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* PARA RECLUTADORES */}
                        <div className="bg-sporthub-card border border-sporthub-cyan/20 p-12 rounded-[60px] relative overflow-hidden group hover:bg-sporthub-cyan/[0.02] transition-colors border-b-8">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:-rotate-12 group-hover:scale-125 transition-all duration-1000 grayscale group-hover:grayscale-0">
                                <Target className="w-64 h-64 text-sporthub-cyan" />
                            </div>
                            <div className="relative z-10 h-full flex flex-col">
                                <h3 className="text-4xl font-black text-white uppercase mb-2 italic tracking-tighter">Para Scouts</h3>
                                <p className="text-sporthub-cyan font-black text-[10px] uppercase tracking-[0.3em] mb-10">Encuentra la próxima estrella</p>
                                <ul className="space-y-6 mb-12 flex-1">
                                    {[
                                        'Filtros avanzados por ciudad y métricas',
                                        'Comparativa directa de jugadores lado a lado',
                                        'Sin intermediarios: Contacto directo',
                                        'Organización de portafolios favoritos ilimitados',
                                    ].map(txt => (
                                        <li key={txt} className="flex items-center gap-4 text-sm text-gray-400 font-bold group-hover:text-gray-200 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-sporthub-cyan shrink-0" />
                                            {txt}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/login" className="inline-flex items-center justify-center gap-3 bg-sporthub-cyan text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-sporthub-cyan/20">
                                    Acceder a la Red <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-48 px-6 relative text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-sporthub-neon/10 to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sporthub-neon/10 blur-[120px] rounded-full"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <h2 className="text-6xl md:text-8xl font-black text-white italic uppercase mb-10 leading-tight tracking-tight">
                        ¿Listo para <br /> 
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-sporthub-neon to-sporthub-cyan animate-pulse pr-10 -mr-10">
                            subir de nivel?
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl mb-14 font-medium leading-relaxed max-w-2xl mx-auto">
                        Únete a la plataforma que está revolucionando la forma en que el talento deportivo es descubierto en Latinoamérica y el mundo.
                    </p>
                    <Link 
                        to="/register" 
                        className="bg-white text-black px-16 py-7 rounded-full font-black uppercase tracking-[0.3em] text-sm hover:scale-110 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center mx-auto group shadow-2xl"
                    >
                        Comenzar Ahora - Es Gratis <Zap className="w-5 h-5 ml-3 fill-black animate-bounce" />
                    </Link>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-16 px-6 border-t border-white/5 bg-[#0B0F19] relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
                    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8">
                        <div className="flex items-center gap-2">
                            <Activity className="w-8 h-8 text-sporthub-neon" strokeWidth={2.5} />
                            <span className="text-2xl font-black tracking-tighter italic text-sporthub-neon">SportHub</span>
                        </div>
                        
                        <div className="flex gap-6">
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-sporthub-neon/20 transition-colors"><Globe className="w-4 h-4 text-gray-500 hover:text-sporthub-neon" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-sporthub-cyan/20 transition-colors"><Users className="w-4 h-4 text-gray-500 hover:text-sporthub-cyan" /></a>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center opacity-50 pt-8 border-t border-white/5 w-full">
                        © 2026 SportHub. Revolucionando el scouting deportivo en Latinoamérica.
                    </p>
                </div>
            </footer>
        </div>
    );
};
