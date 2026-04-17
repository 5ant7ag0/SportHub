import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Camera, Save, Loader2, CheckCircle2, User, MapPin, Trophy, Shield, Bell, X, Globe, Link, Share2, LogOut, ShieldCheck, Trash2, AlertTriangle, Pencil, Briefcase } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

const SOCIAL_SVGS = {
// ... (rest of social svgs)
    github: (props) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
    ),
    linkedin: (props) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
        </svg>
    ),
    twitter: (props) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
    ),
    instagram: (props) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    ),
    facebook: (props) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    )
};

const SPORTS_DATA = {
    'Fútbol': ['Arquero', 'Defensa', 'Mediocampista', 'Delantero'],
    'Básquet': ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
    'Ecuavoley': ['Colocador', 'Servidor', 'Volador']
};

export const Settings = () => {
    const { user, updateUser, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [sport, setSport] = useState(user?.sport || '');
    const [position, setPosition] = useState(user?.position || '');
    const [company, setCompany] = useState(user?.company || '');
    const [jobTitle, setJobTitle] = useState(user?.job_title || '');
    const [city, setCity] = useState(user?.city || '');
    const [birthDate, setBirthDate] = useState(user?.birth_date ? user.birth_date.split('T')[0] : '');
    const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled || false);
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [isEditingSocials, setIsEditingSocials] = useState(false);
    
    // Redes Sociales
    const [github, setGithub] = useState(user?.social_links?.github || '');
    const [linkedin, setLinkedin] = useState(user?.social_links?.linkedin || '');
    const [twitter, setTwitter] = useState(user?.social_links?.twitter || '');
    const [instagram, setInstagram] = useState(user?.social_links?.instagram || '');
    const [facebook, setFacebook] = useState(user?.social_links?.facebook || '');

    // Estados de Seguridad
    const [showSecurity, setShowSecurity] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [securityError, setSecurityError] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // Validaciones de seguridad previas
        if ((newEmail || newPassword) && !currentPassword) {
            setSecurityError("Confirmar identidad es obligatorio para cambiar el correo o la contraseña.");
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setSecurityError("Las nuevas contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);
        setSuccess(false);
        setSecurityError('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('sport', sport);
        formData.append('position', position);
        formData.append('company', company);
        formData.append('job_title', jobTitle);
        formData.append('city', city);
        formData.append('birth_date', birthDate);
        formData.append('is_private', isPrivate);
        formData.append('notifications_enabled', notificationsEnabled);
        
        // Datos de Seguridad
        if (newEmail) formData.append('new_email', newEmail);
        if (newPassword) formData.append('new_password', newPassword);
        if (currentPassword) formData.append('current_password', currentPassword);

        // Empaquetar redes sociales
        const socialLinksData = {
            github,
            linkedin,
            twitter,
            instagram,
            facebook
        };
        formData.append('social_links', JSON.stringify(socialLinksData));

        try {
            const { data } = await api.post('/settings/update/', formData);
            updateUser(data.user);
            
            setSuccess(true);
            setIsEditingBasic(false);
            setIsEditingSocials(false);
            // Limpiar campos de seguridad tras éxito
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setNewEmail('');
            setSecurityError('');
            
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error updating profile:", err);
            const msg = err.response?.data?.error || "Error al actualizar perfil.";
            setSecurityError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return;
        setIsDeleting(true);
        try {
            await api.post('/settings/delete-account/', { password: deletePassword });
            logout();
        } catch (err) {
            alert(err.response?.data?.error || "Error al eliminar la cuenta.");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="flex-1 bg-sporthub-bg p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar">
            <div className="max-w-3xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
                    <p className="text-sporthub-muted">Gestiona tu identidad profesional y preferencias</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8 pb-10">

                    {/* BASIC INFO */}
                    <div className="bg-sporthub-card border border-sporthub-border rounded-3xl p-8 shadow-xl space-y-6 relative group/section">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-sporthub-cyan" />
                                <h3 className="text-xl font-bold text-white">Información Básica</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsEditingBasic(!isEditingBasic)}
                                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isEditingBasic ? 'bg-sporthub-neon text-black shadow-lg shadow-sporthub-neon/20' : 'bg-white/5 text-sporthub-muted hover:bg-white/10 hover:text-white'}`}
                            >
                                <Pencil className="w-4 h-4" />
                                {isEditingBasic ? 'Editando...' : 'Editar'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-white font-bold text-sm mb-2">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isEditingBasic}
                                    className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl px-4 py-3 focus:outline-none transition-all ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-white font-bold text-sm mb-2">Fecha de nacimiento</label>
                                <input 
                                    type="date" 
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    disabled={!isEditingBasic}
                                    className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl px-4 py-3 focus:outline-none transition-all ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-white font-bold text-sm mb-2">Biografía Profesional</label>
                            <textarea 
                                rows="3"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                disabled={!isEditingBasic}
                                className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl px-4 py-3 focus:outline-none transition-all resize-none ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                placeholder="Cuéntanos sobre tu trayectoria y objetivos..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {user?.role === 'athlete' ? (
                                <>
                                    <div className="relative">
                                        <label className="block text-white font-bold text-sm mb-2">Deporte Principal</label>
                                        <select 
                                            value={sport}
                                            onChange={(e) => setSport(e.target.value)}
                                            disabled={!isEditingBasic}
                                            className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl px-4 py-3 focus:outline-none transition-all appearance-none ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                        >
                                            <option value="">Seleccionar deporte</option>
                                            {Object.keys(SPORTS_DATA).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-white font-bold text-sm mb-2">Posición / Especialidad</label>
                                        <select 
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            disabled={!isEditingBasic || !sport}
                                            className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl px-4 py-3 focus:outline-none transition-all appearance-none ${(!isEditingBasic || !sport) && 'opacity-80 cursor-default'}`}
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
                                    <div className="relative">
                                        <label className="block text-white font-bold text-sm mb-2">Empresa / Club</label>
                                        <div className="absolute left-4 top-10 pointer-events-none">
                                            <Briefcase className="w-4 h-4 text-sporthub-muted" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            disabled={!isEditingBasic}
                                            className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                            placeholder="Ej. Independiente del Valle"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-white font-bold text-sm mb-2">Cargo Actual</label>
                                        <div className="absolute left-4 top-10 pointer-events-none">
                                            <Shield className="w-4 h-4 text-sporthub-muted" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            disabled={!isEditingBasic}
                                            className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                                            placeholder="Ej. Entrenador Principal"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <label className="block text-white font-bold text-sm mb-2">Ciudad / Ubicación</label>
                            <div className="absolute left-4 top-10 pointer-events-none">
                                <MapPin className="w-4 h-4 text-sporthub-muted" />
                            </div>
                            <input 
                                type="text" 
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                disabled={!isEditingBasic}
                                className={`w-full bg-[#0B0F19] border ${isEditingBasic ? 'border-sporthub-neon/50 focus:border-sporthub-neon' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all ${!isEditingBasic && 'opacity-80 cursor-default'}`}
                            />
                        </div>
                    </div>

                    {/* PRIVACY & NOTIFICATIONS */}
                    <div className="bg-sporthub-card border border-sporthub-border rounded-3xl p-8 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-sporthub-neon" />
                            <h3 className="text-xl font-bold text-white">Privacidad</h3>
                        </div>

                        {/* SECURITY TOGGLE */}
                        <div>
                            <button 
                                type="button"
                                onClick={() => setShowSecurity(!showSecurity)}
                                className={`w-full py-4 px-6 rounded-2xl border flex items-center justify-between transition-all ${showSecurity ? 'bg-sporthub-neon/10 border-sporthub-neon text-sporthub-neon' : 'bg-transparent border-sporthub-border text-white hover:border-sporthub-neon/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="font-bold">Editar Seguridad</span>
                                </div>
                                <X className={`w-4 h-4 transition-transform ${showSecurity ? 'rotate-0' : 'rotate-45'}`} />
                            </button>
                        </div>

                        {/* SECURITY FIELDS (Progressive Disclosure) */}
                        {showSecurity && (
                            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                
                                {/* BLOQUE 1: CONFIRMAR IDENTIDAD (LLAVE MAESTRA) */}
                                <div className="space-y-4">
                                    <h4 className="text-white font-bold text-sm">Confirmar Identidad</h4>
                                    <input 
                                        type="password" 
                                        placeholder="Confirmar Identidad (Contraseña Actual)"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className={`w-full bg-[#0B0F19] border ${securityError && !currentPassword ? 'border-red-500' : 'border-sporthub-neon/30'} text-white rounded-xl px-4 py-3 focus:border-sporthub-neon focus:outline-none transition-colors text-sm`}
                                    />
                                    {securityError && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            {securityError}
                                        </div>
                                    )}
                                </div>

                                {/* BLOQUE 2: ACTUALIZAR CORREO */}
                                <div className="space-y-4 pt-4 border-t border-sporthub-border/20">
                                    <h4 className="text-white font-bold text-sm">Actualizar Correo</h4>
                                    <div className="bg-[#0B0F19] p-4 rounded-xl border border-sporthub-border/50">
                                        <p className="text-[10px] uppercase tracking-wider text-sporthub-muted mb-1">Correo Actual</p>
                                        <p className="text-white font-medium">{user?.email}</p>
                                    </div>
                                    <input 
                                        type="email" 
                                        placeholder="Nuevo Correo Electrónico"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:border-sporthub-neon focus:outline-none transition-colors text-sm"
                                    />
                                </div>

                                {/* BLOQUE 3: CAMBIAR CONTRASEÑA */}
                                <div className="space-y-4 pt-4 border-t border-sporthub-border/20">
                                    <h4 className="text-white font-bold text-sm">Cambiar Contraseña</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input 
                                            type="password" 
                                            placeholder="Nueva Contraseña"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:border-sporthub-neon focus:outline-none transition-colors text-sm"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="Confirmar Nueva Contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:border-sporthub-neon focus:outline-none transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Danger Zone (Inside Security) */}
                                <div className="pt-8 mt-4 border-t border-red-500/20">
                                    <button 
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors mx-auto"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar cuenta permanentemente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SOCIAL NETWORKS */}
                    <div className="bg-sporthub-card border border-sporthub-border rounded-3xl p-8 shadow-xl space-y-6 group/section">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <SOCIAL_SVGS.linkedin className="w-5 h-5 text-sporthub-neon" />
                                <h3 className="text-xl font-bold text-white">Redes Sociales</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsEditingSocials(!isEditingSocials)}
                                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isEditingSocials ? 'bg-sporthub-neon text-black shadow-lg shadow-sporthub-neon/20' : 'bg-white/5 text-sporthub-muted hover:bg-white/10 hover:text-white'}`}
                            >
                                <Pencil className="w-4 h-4" />
                                {isEditingSocials ? 'Editando...' : 'Editar'}
                            </button>
                        </div>
                        <p className="text-sm text-sporthub-muted mb-6">Vincula tus perfiles externos para validar tu identidad profesional.</p>

                        <div className="space-y-4">
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditingSocials ? 'text-gray-400 group-focus-within:text-[#333]' : 'text-gray-600'}`}>
                                    <SOCIAL_SVGS.github className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="URL de Github (ej: https://github.com/...)"
                                    value={github}
                                    onChange={(e) => setGithub(e.target.value)}
                                    disabled={!isEditingSocials}
                                    className={`w-full bg-[#0B0F19] border ${isEditingSocials ? 'border-sporthub-border focus:border-white' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all text-sm ${!isEditingSocials && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditingSocials ? 'text-blue-400 group-focus-within:text-[#0077b5]' : 'text-blue-400/50'}`}>
                                    <SOCIAL_SVGS.linkedin className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="URL de LinkedIn"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    disabled={!isEditingSocials}
                                    className={`w-full bg-[#0B0F19] border ${isEditingSocials ? 'border-sporthub-border focus:border-blue-500' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all text-sm ${!isEditingSocials && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditingSocials ? 'text-white group-focus-within:text-[#000000]' : 'text-white/50'}`}>
                                    <SOCIAL_SVGS.twitter className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="URL de X (Twitter)"
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                    disabled={!isEditingSocials}
                                    className={`w-full bg-[#0B0F19] border ${isEditingSocials ? 'border-sporthub-border focus:border-white' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all text-sm ${!isEditingSocials && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditingSocials ? 'text-pink-500 group-focus-within:text-[#e4405f]' : 'text-pink-500/50'}`}>
                                    <SOCIAL_SVGS.instagram className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="URL de Instagram"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    disabled={!isEditingSocials}
                                    className={`w-full bg-[#0B0F19] border ${isEditingSocials ? 'border-sporthub-border focus:border-pink-500' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all text-sm ${!isEditingSocials && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEditingSocials ? 'text-blue-600 group-focus-within:text-[#1877f2]' : 'text-blue-600/50'}`}>
                                    <SOCIAL_SVGS.facebook className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="URL de Facebook"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                    disabled={!isEditingSocials}
                                    className={`w-full bg-[#0B0F19] border ${isEditingSocials ? 'border-sporthub-border focus:border-blue-600' : 'border-transparent'} text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all text-sm ${!isEditingSocials && 'opacity-80 cursor-default'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="flex items-center justify-end gap-4 sticky bottom-0 p-4 -mx-4 md:p-0 md:bg-transparent z-50">
                        {success && (
                            <div className="flex items-center gap-2 bg-sporthub-card/80 backdrop-blur-xl border border-sporthub-neon/30 text-sporthub-neon px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.15)] animate-in fade-in slide-in-from-right-4 duration-500 transition-all">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-bold">Cambios guardados</span>
                            </div>
                        )}
                        
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-sporthub-neon text-black font-bold px-10 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-lime-400 transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] disabled:opacity-50 active:scale-95"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {isLoading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </form>

                {/* DANGER ZONE: LOGOUT (Outside of form to avoid submission conflicts) */}
                <div className="pt-12 pb-20">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowLogoutConfirm(true);
                        }}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-xl group"
                    >
                        <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        <span className="text-lg">Cerrar Sesión</span>
                    </button>
                    <p className="text-center text-gray-600 text-[10px] mt-4 uppercase tracking-[0.2em] font-black">SportHub v1.0 • Gestión de Cuenta de {user?.name}</p>
                </div>
            </div>

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-sporthub-card border border-sporthub-border w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex flex-col items-center text-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-sporthub-neon/10 flex items-center justify-center text-sporthub-neon">
                                <LogOut className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">¿Cerrar sesión?</h3>
                            <p className="text-sm text-sporthub-muted">Tendrás que volver a ingresar tus credenciales para acceder a SportHub.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={logout}
                                className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg"
                            >
                                SÍ, CERRAR SESIÓN
                            </button>
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full bg-transparent text-white font-bold py-3 hover:bg-white/5 rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE ACCOUNT MODAL (FULL SCREEN BACKDROP) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-sporthub-card border border-red-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <div className="flex flex-col items-center text-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">¿Eliminar cuenta?</h3>
                            <p className="text-sm text-sporthub-muted">Esta acción es irreversible. Se borrarán todos tus logros, mensajes y estadísticas de SportHub.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Confirma con tu contraseña</label>
                                <input 
                                    type="password" 
                                    placeholder="Contraseña Actual"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full bg-[#0B0F19] border border-red-500/20 text-white rounded-2xl px-5 py-4 focus:border-red-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    type="button"
                                    disabled={isDeleting || !deletePassword}
                                    onClick={handleDeleteAccount}
                                    className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ELIMINAR DEFINITIVAMENTE"}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full bg-transparent text-sporthub-muted font-bold py-3 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
