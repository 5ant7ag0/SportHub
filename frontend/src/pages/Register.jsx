import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Loader2, UserPlus, Briefcase, Trophy, ChevronRight } from 'lucide-react';

const SPORTS_DATA = {
    'Fútbol': ['Arquero', 'Defensa', 'Mediocampista', 'Delantero'],
    'Básquet': ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
    'Ecuavoley': ['Colocador', 'Servidor', 'Volador']
};

export const Register = () => {
    const [role, setRole] = useState('athlete'); // athlete | recruiter
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [city, setCity] = useState('');
    const birthDateRef = useRef(null);
    // Athlete fields
    const [sport, setSport] = useState('');
    const [position, setPosition] = useState('');
    // Recruiter fields
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');

    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // Reset fields when role changes
    useEffect(() => {
        setSport('');
        setPosition('');
        setCompany('');
        setJobTitle('');
    }, [role]);

    // Reset position when sport changes
    useEffect(() => {
        setPosition('');
    }, [sport]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append('role', role);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('birth_date', birthDate);
        formData.append('city', city);
        
        if (role === 'athlete') {
            formData.append('sport', sport);
            formData.append('position', position);
        } else {
            formData.append('company', company);
            formData.append('job_title', jobTitle);
        }

        if (avatar) formData.append('file', avatar);

        try {
            const { data } = await api.post('/register/', formData);
            if (data.tokens && data.tokens.access) {
                login(data.tokens.access);
                navigate('/dashboard');
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Error al registrar usuario.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sporthub-bg flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-sporthub-card p-8 md:p-10 rounded-3xl border border-sporthub-border shadow-2xl relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-sporthub-neon/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="text-center mb-8 relative">
                    <div className="w-16 h-16 bg-sporthub-neon/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sporthub-neon/20 shadow-inner">
                        <UserPlus className="w-8 h-8 text-sporthub-neon" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crea tu cuenta</h1>
                    <p className="text-sporthub-muted text-sm">Forma parte de la élite deportiva de SportHub</p>
                </div>

                {/* Role Selector */}
                <div className="flex p-1 bg-[#0B0F19] rounded-2xl border border-sporthub-border mb-8 max-w-sm mx-auto">
                    <button 
                        onClick={() => setRole('athlete')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${role === 'athlete' ? 'bg-sporthub-neon text-black shadow-lg' : 'text-sporthub-muted hover:text-white'}`}
                    >
                        <Trophy size={16} /> Deportista
                    </button>
                    <button 
                        onClick={() => setRole('recruiter')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${role === 'recruiter' ? 'bg-sporthub-neon text-black shadow-lg' : 'text-sporthub-muted hover:text-white'}`}
                    >
                        <Briefcase size={16} /> Reclutador
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-sporthub-muted flex items-center justify-center overflow-hidden bg-[#0B0F19] group-hover:border-sporthub-neon transition-all duration-300">
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="text-center">
                                        <div className="text-[10px] text-sporthub-muted group-hover:text-sporthub-neon uppercase tracking-widest font-bold">Subir Foto</div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Cambiar</span>
                            </div>
                        </div>
                        <input id="avatar-input" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Common Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                    placeholder="Ej. Santiago Pro"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Email Corporativo</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div 
                                    className="cursor-pointer group/date"
                                    onClick={() => birthDateRef.current?.showPicker()}
                                >
                                    <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest group-hover/date:text-sporthub-neon transition-colors">Fecha de nacimiento</label>
                                    <input 
                                        type="date" 
                                        ref={birthDateRef}
                                        className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 h-[45px] appearance-none focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                        style={{ WebkitAppearance: 'none', margin: 0 }}
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Ciudad</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 h-[45px] focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                        placeholder="Quito"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role Specific Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Contraseña</label>
                                <input 
                                    type="password" 
                                    className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {role === 'athlete' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Deporte</label>
                                        <select 
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors appearance-none"
                                            value={sport}
                                            onChange={(e) => setSport(e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccionar deporte</option>
                                            {Object.keys(SPORTS_DATA).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Posición / Especialidad</label>
                                        <select 
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors appearance-none disabled:opacity-50"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            disabled={!sport}
                                            required
                                        >
                                            <option value="">Seleccionar posición</option>
                                            {sport && SPORTS_DATA[sport].map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Empresa / Club</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                            placeholder="Ej. Real Madrid CF"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-sporthub-muted mb-2 uppercase tracking-widest">Cargo</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                                            placeholder="Ej. Scout Principal"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs text-center border border-red-400/20 bg-red-400/10 p-3 rounded-xl animate-pulse">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-sporthub-neon text-black font-extrabold py-4 rounded-xl hover:bg-lime-400 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] active:scale-95 group"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                        ) : (
                            <>
                                Finalizar Registro <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-sporthub-muted pt-2">
                        ¿Ya tienes una cuenta? <Link to="/login" className="text-sporthub-cyan hover:text-[#00e5ff] transition-colors font-bold">Inicia Sesión aquí</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
