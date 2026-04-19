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

import { PostCard, ShareConfirmModal, DeleteConfirmModal, formatAuthorMetadata } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { CreatePostBox } from '../components/CreatePostBox';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { useToast } from '../context/ToastContext';

const COLORS = ['#A3E635', '#06B6D4', '#c084fc', '#fbbf24', '#f87171', '#34d399'];

const CompactUserRow = ({ user, onClick }) => (
    <div 
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
    >
        <img 
            src={getMediaUrl(user.avatar_url)} 
            className="w-10 h-10 rounded-full object-cover border-2 border-sporthub-card" 
            alt={user.name} 
        />
        <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm truncate group-hover:text-sporthub-neon transition-colors">{user.name}</h4>
            <p className="text-sporthub-muted text-[10px] truncate">
                {formatAuthorMetadata(user) || (user.role === 'recruiter' ? 'Reclutador' : 'Deportista')}
            </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="w-4 h-4 text-sporthub-neon" />
        </div>
    </div>
);

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
    const { user: authUser, updateUser, lastProfileUpdate, lastAnalyticsUpdate, lastNotification, sendJsonMessage } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState(null);
    const [shareError, setShareError] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

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
    const [isSharingProfile, setIsSharingProfile] = useState(false);
    const [shareProfileModalOpen, setShareProfileModalOpen] = useState(false);
    const [shareProfileMessage, setShareProfileMessage] = useState('');
    const [hasAnimatedRing, setHasAnimatedRing] = useState(false);
    const followingLockRef = useRef(false); // Bloqueo para evitar colisiones durante Follow
    
    // Estados para Listas Expandibles
    const [expandedList, setExpandedList] = useState(null); // 'followers' | 'following' | null
    const [listData, setListData] = useState([]);
    const [isFetchingList, setIsFetchingList] = useState(false);

    const fetchListData = async (type) => {
        if (!profile?.id) return;
        setIsFetchingList(true);
        try {
            const endpoint = `/social/${type}/?user_id=${profile.id}`;
            const { data } = await api.get(endpoint);
            setListData(data);
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setListData([]);
        } finally {
            setIsFetchingList(false);
        }
    };

    const toggleList = (type) => {
        if (expandedList === type) {
            setExpandedList(null);
        } else {
            setExpandedList(type);
            fetchListData(type);
        }
    };

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

    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [previewBanner, setPreviewBanner] = useState(null);
    const [selectedBannerFile, setSelectedBannerFile] = useState(null);
    const bannerInputRef = useRef(null);

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (previewBanner) URL.revokeObjectURL(previewBanner);
        const url = URL.createObjectURL(file);
        setPreviewBanner(url);
        setSelectedBannerFile(file);
    };

    const handleSaveBanner = async () => {
        if (!selectedBannerFile) return;
        setIsUploadingBanner(true);
        const formData = new FormData();
        formData.append('banner', selectedBannerFile);
        try {
            const { data } = await api.post('/settings/update/', formData);
            updateUser(data.user);
            setProfile(prev => ({ ...prev, banner_url: data.user.banner_url }));
            if (previewBanner) URL.revokeObjectURL(previewBanner);
            setPreviewBanner(null);
            setSelectedBannerFile(null);
        } catch (err) {
            console.error("Error saving banner:", err);
            setError("No se pudo guardar la imagen del banner. Reintenta.");
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handleCancelBanner = () => {
        if (previewBanner) URL.revokeObjectURL(previewBanner);
        setPreviewBanner(null);
        setSelectedBannerFile(null);
        if (bannerInputRef.current) bannerInputRef.current.value = "";
    };
    
    const targetId = searchParams.get('id');
    const isOwner = !targetId || targetId === authUser?.id;

    const fetchProfileData = async () => {
        try {
            if (!profile) setIsLoading(true);
            const tid = targetId;
            // Añadimos _t para evitar caché de navegador
            const path = tid ? `/profile/?id=${tid}&_t=${Date.now()}` : `/profile/?_t=${Date.now()}`;
            const analyticsPath = tid ? `/analytics/summary/?profile_id=${tid}` : '/analytics/summary/';

            const [profileRes, analyticsRes] = await Promise.all([
                api.get(path),
                api.get(analyticsPath).catch(() => ({ data: null }))
            ]);
            
            const baseSkills = { Velocidad: 0, Táctica: 0, Resistencia: 0, Remate: 0, Control: 0, "Visión de Juego": 0 };
            const initialSkills = profileRes.data.skills && Object.keys(profileRes.data.skills).length > 0 
                ? profileRes.data.skills 
                : baseSkills;

            setProfile(profileRes.data);
            setEditedSkills(initialSkills);
            setEditedAchievements(profileRes.data.achievements || []);

            if (analyticsRes.data) {
                setAnalytics(analyticsRes.data);
                if (!hasAnimatedRing) {
                    setHasAnimatedRing(true);
                }
            }
            setError(null);
        } catch (err) {
            if (followingLockRef.current) return; // Si estamos en medio de un follow, ignoramos errores de carga
            console.error("Error trayendo perfil:", err);
            setError("No se pudo cargar el perfil.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Limpiamos estados previos para evitar "flashes" de info vieja
        setProfile(null);
        setAnalytics(null);
        setHasAnimatedRing(false);
        fetchProfileData();
    }, [targetId]);

    // 📡 ACTUALIZACIÓN EN TIEMPO REAL (WebSockets)
    useEffect(() => {
        if (lastAnalyticsUpdate || lastNotification) {
            console.log("♻️ Perfil: Refrescando analítica/datos por señal externa...");
            fetchProfileData();
        }
    }, [lastAnalyticsUpdate, lastNotification]);

    const handleFollow = async () => {
        if (!profile) return;
        
        const originallyFollowing = profile.is_following;
        const originalFollowersCount = profile.followers_count;
        
        // 1. Acción Instantánea (UI Optimista)
        setProfile(prev => ({
            ...prev,
            is_following: !originallyFollowing,
            followers_count: (prev.followers_count || 0) + (originallyFollowing ? -1 : 1)
        }));
        
        updateUser({
            following_count: (authUser.following_count || 0) + (originallyFollowing ? -1 : 1)
        });

        // 2. Bloqueo de Estado
        followingLockRef.current = true;
        
        try {
            const { data } = await api.post('/social/follow/', { target_id: profile.id });
            
            // 3. Sincronización con la "Fuente de la Verdad" del Servidor
            setProfile(prev => ({
                ...prev,
                is_following: data.is_following,
                followers_count: data.followers_count
            }));

            // Actualizar también al usuario autenticado (siguiendo)
            updateUser({
                following_count: data.following_count
            });

        } catch (err) {
            console.error("Error al seguir:", err);
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
            // 🕒 GRACE PERIOD: Mantenemos el bloqueo 2 segundos más para dar tiempo a DB
            setTimeout(() => {
                followingLockRef.current = false;
            }, 2000);
        }
    };

    const handleMessage = () => navigate(`/messages?contactId=${profile.id}`);

    const handleOpenShareProfile = () => {
        setShareProfileMessage(`¡Les recomiendo echar un vistazo al perfil de ${profile.name}!`);
        setShareProfileModalOpen(true);
    };

    const handleConfirmShareProfile = async () => {
        setIsSharingProfile(true);
        try {
            const formData = new FormData();
            formData.append('content', shareProfileMessage || `¡Les recomiendo echar un vistazo al perfil de ${profile.name}!`);
            formData.append('post_type', 'profile_share');
            formData.append('shared_profile_id', profile.id);
            
            await api.post('/posts/create/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            showToast('Publicado');
            setShareProfileModalOpen(false);
        } catch (e) {
            console.error(e);
            showToast('Error al compartir el perfil', 'error');
        } finally {
            setIsSharingProfile(false);
        }
    };

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
            showToast("Error al eliminar", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // 📡 GESTIÓN DE WEBSOCKETS (Sincronización Multi-Usuario)
    useEffect(() => {
        if (profile?.id) {
            console.log("🔗 Uniendo a sala de perfil:", profile.id);
            sendJsonMessage({ action: 'join_profile', profile_id: profile.id });
        }
    }, [profile?.id, sendJsonMessage]);

    useEffect(() => {
        if (lastProfileUpdate && profile?.id) {
            // Solo actualizamos si el ID del perfil que cambió coincide con el que estamos viendo
            // Nota: El backend envía IDs como ObjectId o string, normalizamos
            const updateId = lastProfileUpdate.profile_id || lastProfileUpdate.user_id;
            if (String(updateId) === String(profile.id)) {
                console.log("⚡ Actualización de estadísticas recibida:", lastProfileUpdate);
                setProfile(prev => ({
                    ...prev,
                    ...lastProfileUpdate
                }));
            }
        }
    }, [lastProfileUpdate, profile?.id]);

    const handleUpdatePost = useCallback((updatedPost) => {
        setProfile(prev => {
            if (!prev) return prev;
            const oldPost = (prev.posts || []).find(p => p.id === updatedPost.id);
            const likeDiff = (updatedPost.likes_count || 0) - (oldPost?.likes_count || 0);
            
            // Sincronización proactiva de estadísticas de cabecera
            return {
                ...prev,
                total_likes: (prev.total_likes || 0) + likeDiff,
                average_rating: updatedPost.post_type === 'service' ? updatedPost.average_rating : prev.average_rating,
                posts: (prev.posts || []).map(p => p.id === updatedPost.id ? updatedPost : p)
            };
        });
    }, []);

    const handleCloseDetail = useCallback(() => setSelectedPostId(null), []);

    const renderSkills = () => {
        const baseSkills = { Velocidad: 0, Táctica: 0, Resistencia: 0, Remate: 0, Control: 0, "Visión de Juego": 0 };
        const activeSkills = profile.skills && Object.keys(profile.skills).length > 0 ? profile.skills : baseSkills;
        
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

    // Cálculos de analítica eliminados para usar AnalyticsPanel

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
                        className={`flex-none min-w-[110px] text-sm font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg ${profile.is_following ? 'bg-white/5 text-white border border-white/10' : 'bg-sporthub-neon text-black hover:scale-105 shadow-sporthub-neon/10'}`}
                    >
                        {profile.is_following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {profile.is_following ? 'Siguiendo' : 'Seguir'}
                    </button>
                    <button 
                        onClick={handleMessage} 
                        className="flex-none min-w-[110px] bg-sporthub-cyan text-black text-sm font-bold px-5 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sporthub-cyan/10"
                    >
                        <MessageSquare className="w-4 h-4" /> 
                        Mensaje
                    </button>
                    <button 
                        onClick={handleOpenShareProfile} 
                        disabled={isSharingProfile}
                        className="bg-white/5 text-white p-3 rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 group/share"
                        title="Compartir perfil en el Muro"
                    >
                        <Share2 className="w-5 h-5 group-hover/share:text-sporthub-neon transition-colors" />
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="bg-[#0B0F19] p-4 md:p-8">
            <div className="flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto items-start">
                <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
                    {/* HEADER CARD */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border overflow-hidden w-full">
                        <div 
                            className={`h-48 md:h-60 w-full relative group ${isOwner && !previewBanner ? 'cursor-pointer' : ''}`}
                            onClick={() => { if(isOwner && !isUploadingBanner && !previewBanner) bannerInputRef.current?.click(); }}
                        >
                            <img 
                                src={previewBanner || (profile.banner_url && profile.banner_url !== 'None' ? getMediaUrl(profile.banner_url) : "https://images.unsplash.com/photo-1518605368461-1ee7e5302a4e?q=80&w=1200&fit=crop")} 
                                className={`w-full h-full object-cover transition-all ${isUploadingBanner ? 'opacity-30 grayscale' : 'opacity-60'}`} 
                                alt="Banner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-sporthub-card via-transparent to-transparent"></div>
                            
                            {isOwner && (
                                <>
                                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                                    
                                    {!previewBanner && !isUploadingBanner && (
                                        <div className="absolute top-4 right-4 bg-black/40 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/10 z-20">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    {isUploadingBanner && (
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <Loader2 className="w-10 h-10 text-sporthub-neon animate-spin" />
                                        </div>
                                    )}
                                    
                                    {previewBanner && !isUploadingBanner && (
                                        <div className="absolute top-4 right-4 flex items-center gap-3 z-30">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleCancelBanner(); }}
                                                className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                                                title="Cancelar"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleSaveBanner(); }}
                                                className="bg-green-500 hover:bg-green-400 text-white p-2.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-transform hover:scale-110 active:scale-95"
                                                title="Guardar Banner"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <div className="px-5 md:px-8 pb-8 flex flex-col gap-6 relative -mt-12 md:-mt-16">
                            {/* TOP LAYER: Identity Row */}
                            <div className="flex flex-row items-center gap-4 md:gap-7 w-full md:w-auto">
                                {/* Avatar and Role Label - STACKED with subtle overlap */}
                                <div className="flex flex-col items-center gap-0 shrink-0 -mt-4 md:-mt-10 relative">
                                    <div 
                                        className={`relative group ${isOwner && !previewAvatar ? 'cursor-pointer' : ''} ring-4 ring-[#0B0F19] rounded-full`} 
                                        onClick={() => { if(isOwner && !isUploadingAvatar && !previewAvatar) avatarInputRef.current?.click(); }}
                                    >
                                        <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-sporthub-card overflow-hidden bg-[#0B0F19] shadow-2xl transition-all ${isUploadingAvatar ? 'opacity-50 grayscale' : (isOwner ? 'group-hover:ring-4 group-hover:ring-sporthub-neon/30' : '')}`}>
                                            <img src={previewAvatar || getMediaUrl(profile.avatar_url)} className="w-full h-full object-cover" onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }} alt="Avatar" />
                                        </div>

                                        {isOwner && (
                                            <>
                                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                                
                                                {!previewAvatar && !isUploadingAvatar && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                                                        <Camera className="w-8 h-8 text-white/90" />
                                                    </div>
                                                )}

                                                {isUploadingAvatar && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-20">
                                                        <Loader2 className="w-10 h-10 text-sporthub-neon animate-spin" />
                                                    </div>
                                                )}
                                                
                                                {previewAvatar && !isUploadingAvatar && (
                                                    <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleCancelAvatar(); }}
                                                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                                                            title="Cancelar"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleSaveAvatar(); }}
                                                            className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-transform hover:scale-110 active:scale-95"
                                                            title="Guardar Foto"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Role Badge - Glassmorphism TOUCHING bottom edge */}
                                    <div className={`-mt-5 md:-mt-6 z-10 px-5 py-1.5 rounded-full border shadow-[0_5px_15px_rgba(0,0,0,0.3)] backdrop-blur-md ${profile.role === 'admin' ? 'bg-purple-500/10 border-purple-500/30' : profile.role === 'athlete' ? 'bg-sporthub-neon/10 border-sporthub-neon/30' : 'bg-sporthub-cyan/10 border-sporthub-cyan/30'}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${profile.role === 'admin' ? 'text-purple-400' : profile.role === 'athlete' ? 'text-sporthub-neon' : 'text-sporthub-cyan'}`}>
                                            {profile.role === 'admin' ? 'Admin' : profile.role === 'athlete' ? 'Deportista' : 'Reclutador'}
                                        </p>
                                    </div>


                                </div>

                                {/* Identity Block */}
                                <div className="flex-1 flex flex-col items-start text-left gap-1 md:gap-2 md:pt-12 w-full">
                                    <h1 className="text-2xl md:text-5xl font-bold text-white tracking-tight truncate">
                                        {profile.name}
                                    </h1>
                                    
                                    {/* Metadata */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-2 sm:gap-4 md:gap-5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                        {(profile?.sport || profile?.company || profile?.job_title) && (
                                            <div className="flex items-center gap-1.5 break-words">
                                                <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-sporthub-neon" /> 
                                                <span className="truncate">
                                                    {formatAuthorMetadata(profile)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-sporthub-cyan" /> 
                                            <span className="truncate">{profile.city || 'Quito'}</span>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div 
                            onClick={() => toggleList('followers')}
                            className={`bg-sporthub-card rounded-3xl border p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${expandedList === 'followers' ? 'border-sporthub-neon scale-95' : 'border-sporthub-border hover:border-sporthub-neon/50 shadow-lg shadow-black/20'}`}
                        >
                            <span className="text-2xl font-bold text-sporthub-neon mb-1">{profile.followers_count || "0"}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Seguidores</span>
                        </div>
                        <div 
                            onClick={() => toggleList('following')}
                            className={`bg-sporthub-card rounded-3xl border p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${expandedList === 'following' ? 'border-sporthub-cyan scale-95' : 'border-sporthub-border hover:border-sporthub-cyan/50 shadow-lg shadow-black/20'}`}
                        >
                            <span className="text-2xl font-bold text-sporthub-cyan mb-1">{profile.following_count || "0"}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Siguiendo</span>
                        </div>
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1"><span className="text-2xl font-bold text-red-500">{profile.total_likes || "0"}</span><Heart className="w-4 h-4 text-red-500 fill-red-500" /></div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Likes</span>
                        </div>
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1"><span className="text-2xl font-bold text-[#c084fc]">{profile.average_rating ? profile.average_rating.toFixed(1) : "0.0"}</span><Star className="w-4 h-4 text-[#c084fc] fill-[#c084fc]" /></div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rating</span>
                        </div>
                    </div>

                    {/* Expandable User Lists (Followers/Following) */}
                    <div 
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedList ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}
                    >
                        <div className="bg-sporthub-card/50 backdrop-blur-xl rounded-[2.5rem] border border-sporthub-border p-2 shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${expandedList === 'followers' ? 'bg-sporthub-neon' : 'bg-sporthub-cyan'}`}></div>
                                    {expandedList === 'followers' ? 'Explorando Seguidores' : 'Explorando Siguiendo'}
                                </h3>
                                <button 
                                    onClick={() => setExpandedList(null)}
                                    className="p-1 px-3 rounded-full bg-white/5 text-[10px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Cerrar
                                </button>
                            </div>
                            
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                                {isFetchingList ? (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 text-sporthub-neon animate-spin opacity-50" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Sincronizando comunidad...</span>
                                    </div>
                                ) : listData.length > 0 ? (
                                    listData.map(u => (
                                        <CompactUserRow 
                                            key={u.id} 
                                            user={u} 
                                            onClick={() => {
                                                navigate(`/profile?id=${u.id}`);
                                                setExpandedList(null);
                                            }}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center">
                                        <p className="text-gray-500 text-xs font-medium italic">No se encontraron deportistas en esta lista.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio & Bio Content */}
                    <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6"><h3 className="text-white font-bold mb-3">Biografía</h3><p className="text-gray-400 leading-relaxed text-sm">{profile.bio || "Deportista profesional apasionado por el rendimiento y el trabajo en equipo."}</p></div>

                    {/* Pro Info for Recruiters */}
                    {profile.role === 'recruiter' && (
                        <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                            <h3 className="text-white font-bold mb-5 flex items-center gap-2"><Briefcase className="w-5 h-5 text-sporthub-cyan" /> Información Profesional</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 text-xs"><p className="text-gray-500 font-bold mb-1 uppercase tracking-widest">Empresa / Club</p><p className="text-white font-semibold">{profile.company || 'No especificado'}</p></div>
                                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 text-xs"><p className="text-gray-500 font-bold mb-1 uppercase tracking-widest">Cargo Actual</p><p className="text-white font-semibold">{profile.job_title || 'No especificado'}</p></div>
                            </div>
                        </div>
                    )}

                    {/* Skills & Achievements for Athletes */}
                    {profile.role === 'athlete' && (
                        <>
                            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                                <div className="flex justify-between items-center mb-5"><h3 className="text-white font-bold">Habilidades</h3>{isOwner && !isEditingSkills && <button onClick={() => setIsEditingSkills(true)} className="text-[10px] text-sporthub-neon font-bold uppercase border border-sporthub-neon/30 px-3 py-1 rounded-full">Editar</button>}</div>
                                {renderSkills()}
                            </div>
                            <div className="bg-sporthub-card rounded-3xl border border-sporthub-border p-6">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-white font-bold">Logros Destacados</h3>{isOwner && !isEditingAchievements && <button onClick={() => setIsEditingAchievements(true)} className="text-[10px] text-sporthub-cyan font-bold uppercase border border-sporthub-cyan/30 px-3 py-1 rounded-full">Editar</button>}</div>
                                {renderAchievements()}
                            </div>
                        </>
                    )}

                    {/* TABS & FEED */}
                    <div className="flex flex-col">
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
                                    {(profile.posts || []).map((post, idx) => <PostCard key={post.id || idx} post={post} onUpdate={handleUpdatePost} onShare={handleOpenShare} onMediaClick={(id) => setSelectedPostId(id)} onDelete={(id) => setPostToDelete(id)} />)}
                                </div>
                            ) : activeTab === 'Servicios' ? (
                                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                    {(profile.posts || []).filter(p => p.post_type === 'service').map((post, idx) => <PostCard key={post.id || idx} post={post} onUpdate={handleUpdatePost} onShare={handleOpenShare} onMediaClick={(id) => setSelectedPostId(id)} onDelete={(id) => setPostToDelete(id)} />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                                    {(activeTab === 'Videos' ? (profile.posts || []).filter(p => isVideo(p.media_url)) : (profile.posts || []).filter(p => !isVideo(p.media_url) && p.media_url && p.media_url !== 'None')).map((post, idx) => <PostThumbnail key={post.id || idx} post={post} onClick={(id) => setSelectedPostId(id)} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIDE COLUMN - Usando componente unificado */}
                <AnalyticsPanel analytics={analytics} />
            </div> {/* Fin de Max-W Container */}

            {/* Modals - Dentro del Root div */}
            <PostDetailModal 
                postId={selectedPostId} 
                onClose={handleCloseDetail} 
                onUpdatePost={handleUpdatePost} 
            />
            <ShareConfirmModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onConfirm={handleConfirmShare} postAuthor={sharingPost?.author?.name} isLoading={isSharing} error={shareError} />
            <DeleteConfirmModal isOpen={!!postToDelete} onClose={() => setPostToDelete(null)} onConfirm={handleDeletePost} isDeleting={isDeleting} />

            {/* Share Profile Modal */}
            {shareProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm transition-opacity" onClick={isSharingProfile ? null : () => setShareProfileModalOpen(false)} />
                    <div className="bg-sporthub-card border border-sporthub-neon/30 w-full max-w-sm rounded-[2rem] p-8 relative z-10 shadow-[0_20px_50px_rgba(163,230,53,0.1)] transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-sporthub-neon/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Share2 className="w-8 h-8 text-sporthub-neon" />
                        </div>
                        <h3 className="text-white text-xl font-black text-center mb-2 uppercase tracking-tight">Recomendar Atleta</h3>
                        <p className="text-gray-400 text-center text-sm mb-6 px-2">
                            Escribe una observación para tu Muro de Feed.
                        </p>
                        
                        <textarea
                            value={shareProfileMessage}
                            onChange={(e) => setShareProfileMessage(e.target.value)}
                            disabled={isSharingProfile}
                            className="bg-[#0B0F19] text-sm text-white rounded-xl p-4 border border-sporthub-border focus:border-sporthub-neon outline-none resize-none w-full min-h-[100px] mb-6 shadow-inner disabled:opacity-50"
                            placeholder="Escribe algo sobre este perfil..."
                        />

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleConfirmShareProfile}
                                disabled={isSharingProfile}
                                className="w-full bg-sporthub-neon text-black font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSharingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar y Compartir"}
                            </button>
                            <button 
                                onClick={() => setShareProfileModalOpen(false)}
                                disabled={isSharingProfile}
                                className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs disabled:opacity-30"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
