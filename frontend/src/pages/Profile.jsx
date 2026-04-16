import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { Loader2, Camera, MapPin, Calendar, CheckCircle2, TrendingUp, Trophy, Medal, Star, Goal, UserPlus, UserMinus, MessageSquare, Heart, Play, Image as ImageIcon, Layout, Briefcase, Building2, Link, Globe, X, Share2, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMediaUrl, isVideo } from '../utils/media';

const SOCIAL_SVGS = {
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

import { PostCard, ShareConfirmModal, DeleteConfirmModal } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { CreatePostBox } from '../components/CreatePostBox';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#A3E635', '#06B6D4', '#c084fc', '#fbbf24', '#f87171', '#34d399'];

const SkillBar = ({ skill, value, isNeon }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white font-medium">{skill}</span>
            <span className={isNeon ? "text-sporthub-neon" : "text-sporthub-cyan"}>{value}%</span>
        </div>
        <div className="w-full bg-[#151b28] rounded-full h-1.5 relative overflow-hidden">
            <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isNeon ? 'bg-sporthub-neon shadow-[0_0_8px_rgba(163,230,53,0.5)]' : 'bg-sporthub-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

const PostThumbnail = ({ post, idx, onClick = () => {} }) => {
    const [hasError, setHasError] = useState(false);
    const isVid = isVideo(post?.media_url);
    const imageUrl = (post?.media_url && post.media_url !== 'None') ? getMediaUrl(post.media_url) : null;

    if (hasError || !imageUrl) {
        return (
            <div className="aspect-square bg-gradient-to-br from-[#151b28] to-[#0B0F19] rounded-2xl flex flex-col items-center justify-center border border-sporthub-border group overflow-hidden relative" onClick={() => onClick(post?.id)}>
                <div className="w-12 h-12 bg-sporthub-neon/10 rounded-full flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-sporthub-neon opacity-40" />
                </div>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">SportHub Feed</span>
            </div>
        );
    }

    return (
        <div 
            onClick={() => onClick(post.id)}
            className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-sporthub-border group cursor-pointer relative"
        >
            {isVid ? (
                <div className="relative w-full h-full">
                    <video src={imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                    </div>
                </div>
            ) : (
                <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Post view" onError={() => setHasError(true)} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-sm">Ver Detalle</span>
            </div>
        </div>
    );
};

export const Profile = () => {
    const { user: authUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState(null);
    const [shareError, setShareError] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const followStatusRef = useRef(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Publicaciones');
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [isEditingAchievements, setIsEditingAchievements] = useState(false);
    const [editedSkills, setEditedSkills] = useState({});
    const [editedAchievements, setEditedAchievements] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        followStatusRef.current = isProcessingFollow;
    }, [isProcessingFollow]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (previewAvatar) URL.revokeObjectURL(previewAvatar);
        const url = URL.createObjectURL(file);
        setPreviewAvatar(url);
        setSelectedAvatarFile(file);
    };

    const handleSaveAvatar = async () => {
        if (!selectedAvatarFile) return;
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', selectedAvatarFile);
        try {
            const { data } = await api.post('/settings/update/', formData);
            updateUser(data.user);
            setProfile(prev => ({ ...prev, avatar_url: data.user.avatar_url }));
            if (previewAvatar) URL.revokeObjectURL(previewAvatar);
            setPreviewAvatar(null);
            setSelectedAvatarFile(null);
        } catch (err) {
            console.error("Error saving avatar:", err);
            setError("No se pudo guardar la imagen. Reintenta.");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCancelAvatar = () => {
        if (previewAvatar) URL.revokeObjectURL(previewAvatar);
        setPreviewAvatar(null);
        setSelectedAvatarFile(null);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
    };
    
    const targetId = searchParams.get('id');
    const isOwner = !targetId || targetId === authUser?.id;

    const fetchProfileData = async (isPolling = false) => {
        try {
            if (!isPolling && !profile) setIsLoading(true);
            const tid = targetId;
            const path = tid ? `/profile/?id=${tid}` : '/profile/';
            const analyticsPath = tid ? `/analytics/summary/?profile_id=${tid}` : '/analytics/summary/';

            const [profileRes, analyticsRes] = await Promise.all([
                api.get(path),
                api.get(analyticsPath).catch(() => ({ data: null }))
            ]);
            
            if (followStatusRef.current) {
                setProfile(prev => ({
                    ...profileRes.data,
                    is_following: prev.is_following,
                    followers_count: prev.followers_count
                }));
            } else {
                setProfile(profileRes.data);
            }

            if (!isPolling) {
                setEditedSkills(profileRes.data.skills || {});
                setEditedAchievements(profileRes.data.achievements || []);
            }
            if (analyticsRes.data) setAnalytics(analyticsRes.data);
            setError(null);
        } catch (err) {
            if (!isPolling) {
                console.error("Error trayendo perfil:", err);
                setError("No se pudo cargar el perfil.");
            }
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
        const pollId = setInterval(() => fetchProfileData(true), 5000);
        return () => clearInterval(pollId);
    }, [targetId]);

    const handleFollow = async () => {
        if (!profile) return;
        
        const originallyFollowing = profile.is_following;
        const originalFollowersCount = profile.followers_count;
        
        // 1. Acción Instantánea
        setProfile(prev => ({
            ...prev,
            is_following: !originallyFollowing,
            followers_count: (prev.followers_count || 0) + (originallyFollowing ? -1 : 1)
        }));
        
        updateUser({
            following_count: (authUser.following_count || 0) + (originallyFollowing ? -1 : 1)
        });

        // 2. Estado de procesamiento (Background)
        setIsProcessingFollow(true);
        followStatusRef.current = true;

        try {
            await api.post('/social/follow/', { target_id: profile.id });
        } catch (err) {
            // Revertir solo en caso de error real
            setProfile(prev => ({
                ...prev,
                is_following: originallyFollowing,
                followers_count: originalFollowersCount
            }));
            updateUser({
                following_count: authUser.following_count
            });
        } finally {
            setIsProcessingFollow(false);
            followStatusRef.current = false;
        }
    };

    const handleMessage = () => navigate(`/messages?contactId=${profile.id}`);

    const handleOpenShare = (post) => {
        if (!post?.id) return;
        setSharingPost(post);
        setShareError(null);
        setIsShareModalOpen(true);
    };

    const handleConfirmShare = async () => {
        if (!sharingPost?.id || isSharing) return;
        setIsSharing(true);
        try {
            await api.post('/posts/share/', { post_id: sharingPost.id });
            setIsShareModalOpen(false);
            setSharingPost(null);
            window.location.reload(); 
        } catch (e) {
            setShareError("No se pudo compartir.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDeletePost = async () => {
        if (!postToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${postToDelete}/`);
            setProfile(prev => ({
                ...prev,
                posts: prev.posts.filter(p => p.id !== postToDelete)
            }));
            setPostToDelete(null);
        } catch (e) {
            alert("Error al eliminar.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdatePost = useCallback((updatedPost) => {
        setProfile(prev => ({
            ...prev,
            posts: (prev.posts || []).map(post => post.id === updatedPost.id ? updatedPost : post)
        }));
    }, []);

    const handleCloseDetail = useCallback(() => setSelectedPostId(null), []);

    const renderSkills = () => {
        const defaultSkills = { Velocidad: 80, Táctica: 75, Resistencia: 85, Remate: 70, Control: 80, "Visión de Juego": 75 };
        const activeSkills = profile.skills && Object.keys(profile.skills).length > 0 ? profile.skills : defaultSkills;
        
        if (isEditingSkills) {
            return (
                <div className="flex flex-col gap-4 w-full">
                    {Object.entries(editedSkills).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-4">
                            <span className="text-xs text-white w-24 truncate">{k}</span>
                            <input 
                                type="range" min="0" max="100" value={v} 
                                onChange={(e) => setEditedSkills(prev => ({ ...prev, [k]: parseInt(e.target.value) }))}
                                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-sporthub-neon"
                            />
                            <span className="text-xs text-sporthub-neon w-8">{v}%</span>
                        </div>
                    ))}
                    <button onClick={handleSaveSkills} disabled={isSaving} className="mt-2 bg-sporthub-neon text-black text-[10px] font-bold py-2 rounded-lg hover:bg-lime-400 transition-all flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle2 className="w-3 h-3"/>} Guardar
                    </button>
                </div>
            )
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 w-full">
                {Object.entries(activeSkills).map(([k, v], idx) => (
                    <SkillBar key={k} skill={k} value={v} isNeon={idx % 2 === 0} />
                ))}
            </div>
        );
    };

    const handleSaveSkills = async () => {
        setIsSaving(true);
        try {
            await api.put('/settings/update/', { skills: JSON.stringify(editedSkills) });
            setProfile(prev => ({ ...prev, skills: editedSkills }));
            setIsEditingSkills(false);
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleSaveAchievements = async () => {
        setIsSaving(true);
        try {
            await api.put('/settings/update/', { achievements: JSON.stringify(editedAchievements) });
            setProfile(prev => ({ ...prev, achievements: editedAchievements }));
            setIsEditingAchievements(false);
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const renderAchievements = () => {
        const defaultAches = ["Nuevo Miembro de SportHub"];
        const activeAches = profile.achievements || defaultAches;
        if (isEditingAchievements) {
            return (
                <div className="flex flex-col gap-3 w-full">
                    {editedAchievements.map((ach, i) => (
                        <div key={i} className="flex gap-2">
                            <input value={ach} onChange={(e) => {
                                const newAch = [...editedAchievements];
                                newAch[i] = e.target.value;
                                setEditedAchievements(newAch);
                            }} className="flex-1 bg-[#0B0F19] border border-sporthub-border rounded-xl px-4 py-2 text-xs text-white" />
                            <button onClick={() => setEditedAchievements(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><UserMinus className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => setEditedAchievements(prev => [...prev, "Nuevo Logro"])} className="text-[10px] text-sporthub-cyan font-bold">+ Añadir</button>
                    <button onClick={handleSaveAchievements} disabled={isSaving} className="bg-sporthub-cyan text-black text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle2 className="w-3 h-3"/>} Guardar
                    </button>
                </div>
            )
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {activeAches.map((ach, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] p-3 rounded-2xl border border-[rgba(255,255,255,0.05)] text-left">
                        {i % 2 === 0 ? <Trophy className="w-4 h-4 text-[#fbbf24]" /> : <Medal className="w-4 h-4 text-sporthub-neon" />}
                        <span className="text-xs text-gray-200 font-medium truncate">{ach}</span>
                    </div>
                ))}
            </div>
        );
    };

    const engagementRate = analytics?.total_visits > 0 ? (((analytics.total_likes + analytics.total_comments) / analytics.total_visits) * 100).toFixed(1) : "8.7";
    const impresiones = "15.2k";
    const reach = "9.8k";
    const barData = analytics?.demographics?.length > 0 ? analytics.demographics.map(d => ({ name: `${d.age_group_start}-${d.age_group_start+10}`, value: d.count })) : [{ name: "18-24", value: 300 }, { name: "25-34", value: 480 }, { name: "35-44", value: 200 }, { name: "45+", value: 120 }];

    if (isLoading || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-screen bg-[#0B0F19]">
                <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin mb-4" />
                <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Cargando perfil profesional...</p>
            </div>
        );
    }

    const socialIcons = (
        <div className="flex items-center gap-1">
            {profile?.social_links?.github && <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><SOCIAL_SVGS.github className="w-4 h-4" /></a>}
            {profile?.social_links?.linkedin && <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#0077b5] transition-colors"><SOCIAL_SVGS.linkedin className="w-4 h-4" /></a>}
            {profile?.social_links?.twitter && <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><SOCIAL_SVGS.twitter className="w-4 h-4" /></a>}
            {profile?.social_links?.instagram && <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#e4405f] transition-colors"><SOCIAL_SVGS.instagram className="w-4 h-4" /></a>}
            {profile?.social_links?.facebook && <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1877f2] transition-colors"><SOCIAL_SVGS.facebook className="w-4 h-4" /></a>}
        </div>
    );

    const actionButtons = (
        <div className="flex items-center gap-3">
            {isOwner ? (
                <>
                    <button 
                        onClick={() => navigate('/settings')} 
                        className="flex-none bg-sporthub-neon text-black text-sm font-bold px-8 md:px-10 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-sporthub-neon/10"
                    >
                        <Layout className="w-5 h-5" /> 
                        <span className="tracking-tight">Editar Perfil</span>
                    </button>
                    <button 
                        onClick={() => {}} 
                        className="bg-white/5 text-white p-3 rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={handleFollow} 
                        className={`flex-none min-w-[130px] text-sm font-bold px-8 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg ${profile.is_following ? 'bg-white/5 text-white border border-white/10' : 'bg-sporthub-neon text-black hover:scale-105 shadow-sporthub-neon/10'}`}
                    >
                        {profile.is_following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {profile.is_following ? 'Siguiendo' : 'Seguir'}
                    </button>
                    <button 
                        onClick={handleMessage} 
                        className="flex-none min-w-[130px] bg-sporthub-cyan text-black text-sm font-bold px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sporthub-cyan/10"
                    >
                        <MessageSquare className="w-4 h-4" /> 
                        Mensaje
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="bg-[#0B0F19] p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto items-start">
                <div className="flex-1 flex flex-col gap-6 w-full">
                    {/* HEADER CARD */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border overflow-hidden w-full">
                        <div className="h-48 md:h-60 w-full relative">
                            <img src="https://images.unsplash.com/photo-1518605368461-1ee7e5302a4e?q=80&w=1200&fit=crop" className="w-full h-full object-cover opacity-60" alt="Banner"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-sporthub-card via-transparent to-transparent"></div>
                        </div>
                        
                        <div className="px-5 md:px-8 pb-8 flex flex-col gap-6 relative -mt-12 md:-mt-16">
                            {/* TOP LAYER: Identity Row */}
                            <div className="flex flex-row items-center gap-4 md:gap-7 w-full md:w-auto">
                                {/* Avatar */}
                                <div className={`relative group ${isOwner ? 'cursor-pointer' : ''} shrink-0`} onClick={() => isOwner && !isUploadingAvatar && avatarInputRef.current?.click()}>
                                    <div className={`w-28 h-28 md:w-44 md:h-44 rounded-full border-4 border-sporthub-card overflow-hidden bg-[#0B0F19] shadow-2xl transition-all ${isUploadingAvatar ? 'opacity-50 grayscale' : (isOwner ? 'group-hover:ring-4 group-hover:ring-sporthub-neon/30' : '')}`}>
                                        <img src={previewAvatar || getMediaUrl(profile.avatar_url)} className="w-full h-full object-cover" onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }} alt="Avatar" />
                                    </div>
                                    
                                    {/* Role Badge Overlay */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sporthub-cyan text-black text-[9px] md:text-[10px] font-black px-4 py-1 rounded-full border-2 border-[#0B0F19] uppercase tracking-widest shadow-xl whitespace-nowrap z-10">
                                        {profile.role === 'athlete' ? 'Deportista' : profile.role === 'scout' ? 'Reclutador' : profile.role === 'admin' ? 'Administrador' : 'Usuario'}
                                    </div>

                                    {isOwner && (
                                        <>
                                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                            {(isUploadingAvatar || (previewAvatar && !isUploadingAvatar)) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full z-20">
                                                    {isUploadingAvatar ? <Loader2 className="w-8 h-8 text-sporthub-neon animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Identity Block */}
                                <div className="flex-1 flex flex-col items-start text-left gap-1 md:gap-2 md:pt-12 w-full">
                                    <h1 className="text-2xl md:text-5xl font-bold text-white tracking-tight truncate">
                                        {profile.name}
                                    </h1>
                                    
                                    {/* Metadata */}
                                    <div className="flex flex-row items-center justify-start gap-4 md:gap-5 text-[9px] md:text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em] opacity-60">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <MapPin className="w-3.5 h-3.5 text-sporthub-cyan" /> {profile.city || 'Quito'}
                                        </div>
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Calendar className="w-3.5 h-3.5" /> {profile.date_joined ? `Miembro ${new Date(profile.date_joined).getFullYear()}` : 'Miembro 2022'}
                                        </div>
                                    </div>

                                    {/* Socials - Mobile Only (Next to Avatar) */}
                                    <div className="md:hidden mt-1 opacity-80">
                                        {socialIcons}
                                    </div>

                                    {/* PC Actions (Socials + Buttons) */}
                                    <div className="hidden md:flex items-center gap-4 mt-4">
                                        <div className="opacity-80">{socialIcons}</div>
                                        {actionButtons}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Actions - Centered below Identity Row */}
                            <div className="flex md:hidden items-center justify-center w-full mt-2">
                                {actionButtons}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-sporthub-neon mb-1">{profile.followers_count || "0"}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Seguidores</span>
                        </div>
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-sporthub-cyan mb-1">{profile.following_count || "0"}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Siguiendo</span>
                        </div>
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1"><span className="text-2xl font-bold text-red-500">124</span><Heart className="w-4 h-4 text-red-500 fill-red-500" /></div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Likes</span>
                        </div>
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1"><span className="text-2xl font-bold text-[#c084fc]">4.8</span><Star className="w-4 h-4 text-[#c084fc] fill-[#c084fc]" /></div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rating</span>
                        </div>
                    </div>

                    {/* Bio & Bio Content */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 mt-6"><h3 className="text-white font-bold mb-3">Biografía</h3><p className="text-gray-400 leading-relaxed text-sm">{profile.bio || "Deportista profesional apasionado por el rendimiento y el trabajo en equipo."}</p></div>

                    {/* Pro Info for Recruiters */}
                    {profile.role === 'recruiter' && (
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 mt-6">
                            <h3 className="text-white font-bold mb-5 flex items-center gap-2"><Briefcase className="w-5 h-5 text-sporthub-cyan" /> Información Profesional</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 text-xs"><p className="text-gray-500 font-bold mb-1 uppercase tracking-widest">Empresa / Club</p><p className="text-white font-semibold">{profile.empresa_club || 'Independiente'}</p></div>
                                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 text-xs"><p className="text-gray-500 font-bold mb-1 uppercase tracking-widest">Cargo Actual</p><p className="text-white font-semibold">{profile.cargo || 'Investigador de Talentos'}</p></div>
                            </div>
                        </div>
                    )}

                    {/* Skills & Achievements for Athletes */}
                    {profile.role === 'athlete' && (
                        <>
                            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 mt-6">
                                <div className="flex justify-between items-center mb-5"><h3 className="text-white font-bold">Habilidades</h3>{isOwner && !isEditingSkills && <button onClick={() => setIsEditingSkills(true)} className="text-[10px] text-sporthub-neon font-bold uppercase border border-sporthub-neon/30 px-3 py-1 rounded-full">Editar</button>}</div>
                                {renderSkills()}
                            </div>
                            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6 mt-6">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-white font-bold">Logros Destacados</h3>{isOwner && !isEditingAchievements && <button onClick={() => setIsEditingAchievements(true)} className="text-[10px] text-sporthub-cyan font-bold uppercase border border-sporthub-cyan/30 px-3 py-1 rounded-full">Editar</button>}</div>
                                {renderAchievements()}
                            </div>
                        </>
                    )}

                    {/* TABS & FEED */}
                    <div className="flex flex-col mt-6">
                        <div className="flex gap-8 border-b border-white/5 px-2 mb-6 overflow-x-auto">
                            {[{ name: 'Publicaciones', icon: Layout }, { name: 'Servicios', icon: Briefcase }, { name: 'Fotos', icon: ImageIcon }, { name: 'Videos', icon: Play }].map(tab => (
                                <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.name ? 'text-sporthub-neon' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <tab.icon className="w-4 h-4" /> {tab.name}
                                    {activeTab === tab.name && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-sporthub-neon rounded-t-full shadow-[0_0_8px_rgba(163,230,53,0.8)]"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="w-full">
                            {activeTab === 'Publicaciones' ? (
                                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                    {isOwner && <CreatePostBox authUser={authUser} onPostCreated={fetchProfileData} />}
                                    {(profile.posts || []).map((post, idx) => <PostCard key={post.id || idx} post={post} onShare={handleOpenShare} onMediaClick={(id) => setSelectedPostId(id)} onDelete={(id) => setPostToDelete(id)} />)}
                                </div>
                            ) : activeTab === 'Servicios' ? (
                                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                    {(profile.posts || []).filter(p => p.post_type === 'service').map((post, idx) => <PostCard key={post.id || idx} post={post} onShare={handleOpenShare} onMediaClick={(id) => setSelectedPostId(id)} onDelete={(id) => setPostToDelete(id)} />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                                    {(activeTab === 'Videos' ? (profile.posts || []).filter(p => isVideo(p.media_url)) : (profile.posts || []).filter(p => !isVideo(p.media_url) && p.media_url && p.media_url !== 'None')).map((post, idx) => <PostThumbnail key={post.id || idx} post={post} onClick={(id) => setSelectedPostId(id)} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIDE COLUMN */}
                <div className="w-full lg:w-80 xl:w-[350px] flex flex-col gap-6 shrink-0 mt-6 lg:mt-0">
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="flex justify-between items-start mb-2"><div><h3 className="text-white font-bold text-sm">Visitas al Perfil</h3><p className="text-[10px] text-gray-500">vs. mes anterior</p></div><div className="bg-sporthub-neon/10 text-sporthub-neon text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +14.0%</div></div>
                        <div className="h-44 relative flex items-center justify-center mt-4">
                            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{value: 68}, {value: 32}]} dataKey="value" innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} stroke="none"><Cell fill="#A3E635" /><Cell fill="#1a2130" /></Pie></PieChart></ResponsiveContainer>
                            <div className="absolute flex flex-col items-center"><span className="text-3xl font-bold text-white">68%</span><span className="text-[9px] text-gray-400">2,847 visitas</span></div>
                        </div>
                    </div>
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <div className="flex justify-between items-start mb-6"><div><h3 className="text-white font-bold text-sm">Distribución de Edad</h3><p className="text-[10px] text-gray-500">Audiencia principal</p></div><div className="bg-sporthub-cyan/10 text-sporthub-cyan text-[10px] font-bold px-2 py-1 rounded-md">👨‍👩‍👧 {analytics?.average_age ? analytics.average_age.toFixed(1) : '24'} años</div></div>
                        <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2130" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} /><Tooltip cursor={{ fill: '#1a2130' }} contentStyle={{ backgroundColor: '#0B0F19', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{barData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 1 ? '#06B6D4' : '#1e5f72'} />)}</Bar></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                        <h3 className="text-white font-bold text-sm mb-5">Métricas Rápidas</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5"><span className="text-sm text-gray-400">Engagement</span><span className="text-sm font-bold text-sporthub-neon">{engagementRate}%</span></div>
                            <div className="flex justify-between items-center pb-3 border-b border-white/5"><span className="text-sm text-gray-400">Impresiones</span><span className="text-sm font-bold text-sporthub-cyan">{impresiones}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-400">Reach</span><span className="text-sm font-bold text-[#c084fc]">{reach}</span></div>
                        </div>
                    </div>
                </div> {/* Fin de Side Column */}
            </div> {/* Fin de Max-W Container */}

            {/* Modals - Dentro del Root div */}
            <PostDetailModal 
                postId={selectedPostId} 
                onClose={handleCloseDetail} 
                onUpdatePost={handleUpdatePost} 
            />
            <ShareConfirmModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onConfirm={handleConfirmShare} postAuthor={sharingPost?.author?.name} isLoading={isSharing} error={shareError} />
            <DeleteConfirmModal isOpen={!!postToDelete} onClose={() => setPostToDelete(null)} onConfirm={handleDeletePost} isDeleting={isDeleting} />
        </div>
    );
};
