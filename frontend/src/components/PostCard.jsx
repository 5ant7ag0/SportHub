import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Heart, MessageCircle, Share2, Send, Bookmark, Paperclip, Edit2, Trash2, AlertTriangle, Play, Tag, DollarSign, Star, StarHalf, MapPin, Briefcase, UserPlus, UserMinus, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

/**
 * Helper para formatear metadatos de autor según su rol
 */
export const formatAuthorMetadata = (author) => {
    if (!author) return "";
    if (author.role === 'athlete') {
        const sport = author.sport || "";
        const pos = author.position || "";
        return `${sport}${sport && pos ? ' - ' : ''}${pos}`;
    } else {
        // Recruiter, Admin, etc.
        const company = author.company || "";
        const job = author.job_title || author.position || "";
        return `${company}${company && job ? ' - ' : ''}${job}`;
    }
};

/**
 * Modal de confirmación para repostear
 */
export const ShareConfirmModal = ({ isOpen, onClose, onConfirm, postAuthor, isLoading, error }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm transition-opacity" onClick={isLoading ? null : onClose} />
            <div className="bg-sporthub-card border border-sporthub-border w-full max-w-sm rounded-[2rem] p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-sporthub-neon/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Share2 className="w-8 h-8 text-sporthub-neon" />
                </div>
                <h3 className="text-white text-xl font-black text-center mb-2 uppercase tracking-tight">¿Viralizar este Post?</h3>
                <p className="text-gray-400 text-center text-sm mb-6 px-2">
                    Esta publicación de <span className="text-sporthub-neon font-bold">{postAuthor}</span> aparecerá en tu muro para que toda tu red la vea.
                </p>
                
                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full bg-sporthub-neon text-black font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Repost"}
                    </button>
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs disabled:opacity-30"
                    >
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Modal de confirmación para eliminar
 */
export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md transition-opacity" onClick={isDeleting ? null : onClose} />
            <div className="bg-sporthub-card border border-white/10 w-full max-w-sm rounded-[2rem] p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-white text-xl font-black text-center mb-2 uppercase tracking-tight">¿Eliminar publicación?</h3>
                <p className="text-gray-400 text-center text-sm mb-8 px-2 font-medium">
                    Esta acción es <span className="text-red-400 font-bold underline">irreversible</span>. Al borrar este post original, desaparecerán todos los reposts realizados por otros usuarios.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Eliminación"}
                    </button>
                    <button 
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs disabled:opacity-30"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Componente principal PostCard (anteriormente FeedPost)
 */
export const PostCard = ({ post: initialPost, onShare, onMediaClick, onDelete, onUpdate }) => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(initialPost);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(initialPost.content);
    const [editServiceTitle, setEditServiceTitle] = useState(initialPost.service_title || '');
    const [editServicePrice, setEditServicePrice] = useState(initialPost.service_price || '');
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [isUploadingComment, setIsUploadingComment] = useState(false);
    const fileInputRef = useRef(null);
    const postRef = useRef(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const targetPostId = searchParams.get('post_id');
        if (targetPostId === post.id) {
            setShowComments(true);
            setTimeout(() => {
                postRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [searchParams, post.id]);

    useEffect(() => {
        setPost(initialPost);
        setEditContent(initialPost.content);
    }, [initialPost]);

    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const [isFollowProcessing, setIsFollowProcessing] = useState(false);

    const handleFollowSharedProfile = async () => {
        if (!post.shared_profile || isFollowProcessing) return;
        setIsFollowProcessing(true);
        const previousState = post.shared_profile.is_following;
        
        const updatedProfile = { 
            ...post.shared_profile, 
            is_following: !previousState,
            followers_count: (post.shared_profile.followers_count || 0) + (previousState ? -1 : 1)
        };
        const updatedPost = { ...post, shared_profile: updatedProfile };
        setPost(updatedPost);
        if (onUpdate) onUpdate(updatedPost);

        try {
            await api.post('/social/follow/', { target_id: post.shared_profile.id });
        } catch(e) {
            const revertedPost = { ...post, shared_profile: { ...post.shared_profile, is_following: previousState } };
            setPost(revertedPost);
            if (onUpdate) onUpdate(revertedPost);
            console.error(e);
        } finally {
            setIsFollowProcessing(false);
        }
    };

    const handleLike = async () => {
        const isLiked = post.is_liked_by_user;
        const updated = {
            ...post,
            is_liked_by_user: !isLiked,
            likes_count: post.likes_count + (isLiked ? -1 : 1)
        };
        setPost(updated);
        if (onUpdate) onUpdate(updated);

        try {
            await api.post('/social/like/', { post_id: post.id });
        } catch (error) {
            const reverted = {
                ...post,
                is_liked_by_user: isLiked,
                likes_count: post.likes_count
            };
            setPost(reverted);
            if (onUpdate) onUpdate(reverted);
            console.error("Error al dar like:", error);
        }
    };

    const handleSave = async () => {
        const isSaved = post.is_saved_by_user;
        const updated = {
            ...post,
            is_saved_by_user: !isSaved
        };
        setPost(updated);
        if (onUpdate) onUpdate(updated);
        try {
            await api.post('/posts/save/', { post_id: post.id });
        } catch (err) {
            setPost(prev => ({
                ...prev,
                is_saved_by_user: isSaved
            }));
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        const file = fileInputRef.current?.files[0];
        if (!commentText.trim() && !file) return;
        
        setIsUploadingComment(true);
        try {
            let res;
            if (file) {
                const formData = new FormData();
                formData.append('post_id', post.id);
                formData.append('text', commentText || "📎 Multimedia adjunta");
                formData.append('file', file);
                
                res = await api.post('/posts/comment/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post('/posts/comment/', { post_id: post.id, text: commentText });
            }

            const newComment = {
                author: { name: "Tú" },
                text: commentText || "📎 Multimedia adjunta",
                media_url: res.data?.comment?.media_url || null
            };

            const updated = {
                ...post,
                comments: [...(post.comments || []), newComment]
            };
            setPost(updated);
            if (onUpdate) onUpdate(updated);
            
            setCommentText('');
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Error enviando comentario", error);
        } finally {
            setIsUploadingComment(false);
        }
    };

    const handleEditPost = async () => {
        if (!editContent.trim()) return;
        try {
            const payload = { content: editContent };
            if (post.post_type === 'service') {
                payload.service_title = editServiceTitle;
                payload.service_price = editServicePrice;
            }
            await api.put(`/posts/edit/${post.id}/`, payload);
            setPost(prev => ({ 
                ...prev, 
                content: editContent, 
                service_title: editServiceTitle,
                service_price: editServicePrice,
                is_edited: true 
            }));
            setIsEditing(false);
        } catch (e) {
            console.error("Error editando post", e);
        }
    };

    const handleRateSubmit = async (score) => {
        setIsSubmittingRating(true);
        try {
            const { data } = await api.post(`/posts/rate/${post.id}/`, { score });
            const updated = {
                ...post,
                average_rating: data.average_rating,
                ratings_count: data.ratings_count,
                user_has_rated: true
            };
            setPost(updated);
            if (onUpdate) onUpdate(updated);
            setIsRatingModalOpen(false);
        } catch (error) {
            console.error("Error calificado servicio:", error);
            alert(error.response?.data?.error || "Error al calificar");
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleShare = () => {
        onShare(post);
    };

    return (
        <div 
            ref={postRef} 
            id={`post-${post.id}`} 
            className={`bg-sporthub-card rounded-2xl border transition-all w-full max-w-full overflow-hidden shadow-lg ${post.post_type === 'service' ? 'border-sporthub-neon/40 shadow-[0_0_20px_rgba(163,230,53,0.1)]' : 'border-sporthub-border'}`}
        >
            {post.is_repost && (
                <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-sporthub-muted border-b border-sporthub-border/30 bg-sporthub-border/10">
                    <Share2 className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {post.author.name} compartió esto
                    </span>
                </div>
            )}

            <div className="p-4 flex items-center justify-between">
                <Link to={`/profile?id=${post.author?.id}`} className="flex items-center gap-3 group/author">
                    <div className="relative">
                        <img 
                            src={getMediaUrl(post.author?.avatar_url)} 
                            className="w-10 h-10 rounded-full border border-sporthub-border bg-[#0B0F19] object-cover transition-transform group-hover/author:scale-105" 
                            alt={post.author?.name} 
                            onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                        />
                        {post.post_type === 'service' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-sporthub-neon rounded-full border-2 border-sporthub-card flex items-center justify-center">
                                <Tag className="w-2 h-2 text-black" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm group-hover/author:text-sporthub-neon transition-colors">{post.author?.name}</h3>
                            {post.post_type === 'service' && (
                                <span className="bg-sporthub-neon/10 text-sporthub-neon text-[8px] font-black px-2 py-1 rounded border border-sporthub-neon/20 tracking-tighter uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-sporthub-neon rounded-full animate-pulse" />
                                    SERVICIO PROFESIONAL
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-sporthub-muted">{formatAuthorMetadata(post.author)}</p>
                    </div>
                </Link>
                {authUser?.id === post.author?.id && !isEditing && (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="text-gray-500 hover:text-sporthub-neon p-2 transition-colors"
                            title="Editar"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onDelete(post.id)} 
                            className="text-gray-500 hover:text-red-500 p-2 transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="px-4 pb-3">
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        {post.post_type === 'service' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input 
                                        type="text"
                                        value={editServiceTitle}
                                        onChange={e => setEditServiceTitle(e.target.value)}
                                        placeholder="Título del Servicio"
                                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-sporthub-neon outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input 
                                        type="number"
                                        value={editServicePrice}
                                        onChange={e => setEditServicePrice(e.target.value)}
                                        placeholder="Precio"
                                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-sporthub-neon outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        <textarea 
                            value={editContent} onChange={e => setEditContent(e.target.value)} 
                            className="w-full bg-[#0B0F19] text-sm text-white rounded-xl p-4 border border-white/10 focus:border-sporthub-cyan outline-none resize-none" rows={3}>
                        </textarea>
                        <div className="flex gap-2 justify-end">
                            <button onClick={handleEditPost} className="bg-sporthub-neon text-black text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-transform hover:shadow-[0_0_15px_rgba(163,230,53,0.3)]">Guardar Cambios</button>
                            <button onClick={() => setIsEditing(false)} className="bg-white/5 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {post.post_type === 'service' && (
                            <div className="mb-4 bg-[#1e293b] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-white font-black text-xl leading-tight uppercase tracking-tight">{post.service_title}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div 
                                                className={`flex items-center gap-1 ${(!post.user_has_rated && post.author.id !== authUser?.id) ? 'cursor-pointer group/rate' : ''}`}
                                                onClick={() => {
                                                    if (!post.user_has_rated && post.author.id !== authUser?.id) {
                                                        setIsRatingModalOpen(true);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => {
                                                        const rating = post.average_rating || 0;
                                                        const isFull = post.ratings_count > 0 && rating >= i + 1;
                                                        const isHalf = post.ratings_count > 0 && !isFull && rating >= i + 0.5;
                                                        
                                                        return (
                                                            <div key={i} className={`relative ${(!post.user_has_rated && post.author.id !== authUser?.id) ? 'group-hover/rate:scale-110 transition-transform' : ''}`}>
                                                                {/* Contorno base siempre visible */}
                                                                <Star size={20} className="text-gray-600/50" />
                                                                
                                                                {/* Capa de color (Llena o Media) */}
                                                                <div className="absolute inset-0 overflow-hidden">
                                                                    {isFull ? (
                                                                        <Star size={20} className="fill-[#facc15] text-[#facc15]" />
                                                                    ) : isHalf ? (
                                                                        <div className="w-1/2 overflow-hidden">
                                                                            <Star size={20} className="fill-[#facc15] text-[#facc15]" />
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {!post.user_has_rated && post.author.id !== authUser?.id && (
                                                    <span className="text-sporthub-cyan text-[10px] font-bold uppercase tracking-widest ml-1 animate-pulse">
                                                        Calificar
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                {post.ratings_count > 0 ? (
                                                    <>
                                                        <span className="text-white font-black text-xs">{post.average_rating.toFixed(1)}</span>
                                                        <span className="opacity-50">({post.ratings_count})</span>
                                                    </>
                                                ) : (
                                                    <span className="opacity-40 italic">Sin valoraciones</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sporthub-neon font-black text-2xl leading-none transition-transform hover:scale-110 cursor-default">${post.service_price}</p>
                                        <p className="text-[8px] text-gray-400 uppercase font-black mt-1">USD</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <p className="text-white text-sm whitespace-pre-line mb-3">
                            {post.content}
                            {post.is_edited && <span className="text-[10px] text-gray-500 italic ml-2">(Editado)</span>}
                        </p>
                    </div>
                )}

                {post.is_repost && post.original_post && (
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 mb-2 transition-all hover:bg-black/40">
                        <div 
                            onClick={() => navigate(`/profile?id=${post.original_post.author.id}`)}
                            className="p-3 flex items-center gap-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            <img 
                                src={getMediaUrl(post.original_post.author.avatar_url)} 
                                className="w-6 h-6 rounded-full border border-white/10 object-cover" 
                                alt={post.original_post.author.name} 
                                onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                            />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white hover:text-sporthub-neon transition-colors">{post.original_post.author.name}</span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{formatAuthorMetadata(post.original_post.author)}</span>
                            </div>
                        </div>
                        <div className="p-3">
                            <p className="text-xs text-gray-300 mb-3">{post.original_post.content}</p>
                            {post.original_post.media_url && post.original_post.media_url !== 'None' && post.original_post.media_url !== '' && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); onMediaClick(post.original_post.id); }}
                                    className="rounded-lg overflow-hidden border border-white/5 max-h-[400px] cursor-pointer group/orig relative"
                                >
                                    {isVideo(post.original_post.media_url) ? (
                                        <>
                                            <video src={getMediaUrl(post.original_post.media_url)} className="w-full h-full object-contain bg-black/40 transition-transform group-hover/orig:scale-[1.02]" muted loop />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-xl transition-transform duration-300 group-hover/orig:scale-110">
                                                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img src={getMediaUrl(post.original_post.media_url)} className="w-full h-full object-contain bg-black/40 transition-transform group-hover/orig:scale-[1.02]" alt="Original" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {post.post_type === 'profile_share' && post.shared_profile && (
                <div className="border border-sporthub-border rounded-3xl overflow-hidden bg-sporthub-card mx-4 mb-4 shadow-xl transition-all group/sharecard">
                    {/* BANNER REPLICA */}
                    <div 
                        className="h-28 md:h-36 w-full relative cursor-pointer"
                        onClick={() => navigate(`/profile?id=${post.shared_profile.id}`)}
                    >
                        <img 
                            src={post.shared_profile.banner_url && post.shared_profile.banner_url !== 'None' ? getMediaUrl(post.shared_profile.banner_url) : "https://images.unsplash.com/photo-1518605368461-1ee7e5302a4e?q=80&w=1200&fit=crop"} 
                            className="w-full h-full object-cover opacity-80 group-hover/sharecard:opacity-100 transition-opacity" 
                            alt="Banner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-sporthub-card via-transparent to-transparent"></div>
                    </div>
                    
                    <div className="px-4 md:px-5 pb-5 flex flex-col gap-4 relative -mt-8 md:-mt-10">
                        {/* Avatar & Role stacked */}
                        <div className="flex flex-row items-center gap-3">
                            <div className="flex flex-col items-center shrink-0 -mt-2">
                                <div 
                                    className="relative ring-4 ring-[#0B0F19] rounded-full cursor-pointer" 
                                    onClick={() => navigate(`/profile?id=${post.shared_profile.id}`)}
                                >
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-sporthub-card overflow-hidden bg-[#0B0F19] shadow-2xl transition-transform hover:scale-105">
                                        <img src={getMediaUrl(post.shared_profile.avatar_url)} className="w-full h-full object-cover" onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }} alt="Avatar" />
                                    </div>
                                </div>
                                <div className={`-mt-4 z-10 px-3 py-1 rounded-full border shadow-[0_5px_15px_rgba(0,0,0,0.3)] backdrop-blur-md ${post.shared_profile.role === 'admin' ? 'bg-purple-500/10 border-purple-500/30' : post.shared_profile.role === 'athlete' ? 'bg-sporthub-neon/10 border-sporthub-neon/30' : 'bg-sporthub-cyan/10 border-sporthub-cyan/30'}`}>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${post.shared_profile.role === 'admin' ? 'text-purple-400' : post.shared_profile.role === 'athlete' ? 'text-sporthub-neon' : 'text-sporthub-cyan'}`}>
                                        {post.shared_profile.role === 'admin' ? 'Admin' : post.shared_profile.role === 'athlete' ? 'Deportista' : 'Reclutador'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Identity Block */}
                            <div className="flex-1 flex flex-col items-start text-left pt-6">
                                <h4 
                                    className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none cursor-pointer hover:text-sporthub-neon transition-colors"
                                    onClick={() => navigate(`/profile?id=${post.shared_profile.id}`)}
                                >
                                    {post.shared_profile.name}
                                </h4>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-2 overflow-hidden w-full">
                                    <div className="flex items-center gap-1 truncate w-full sm:w-auto">
                                        <Briefcase className="w-3 h-3 text-sporthub-neon shrink-0" /> 
                                        <span className="truncate">
                                            {formatAuthorMetadata(post.shared_profile)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <MapPin className="w-3 h-3 text-sporthub-cyan shrink-0" /> 
                                        <span className="truncate">{post.shared_profile.city ? `${post.shared_profile.city}, ${post.shared_profile.country || ''}` : 'Ubicación global'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Redes y Botones en Flexbox Bottom */}
                        <div className="flex flex-col xl:flex-row items-center xl:items-end justify-between gap-4 w-full border-t border-white/5 pt-4">
                            <div className="flex items-center justify-center xl:justify-start gap-4">
                                {post.shared_profile.social_links?.github && <a href={post.shared_profile.social_links.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="GitHub"><SOCIAL_SVGS.github className="w-4 h-4 md:w-5 md:h-5" /></a>}
                                {post.shared_profile.social_links?.linkedin && <a href={post.shared_profile.social_links.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#0a66c2] transition-colors" title="LinkedIn"><SOCIAL_SVGS.linkedin className="w-4 h-4 md:w-5 md:h-5" /></a>}
                                {post.shared_profile.social_links?.twitter && <a href={post.shared_profile.social_links.twitter} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="X"><SOCIAL_SVGS.twitter className="w-4 h-4 md:w-5 md:h-5" /></a>}
                                {post.shared_profile.social_links?.instagram && <a href={post.shared_profile.social_links.instagram} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#e1306c] transition-colors" title="Instagram"><SOCIAL_SVGS.instagram className="w-4 h-4 md:w-5 md:h-5" /></a>}
                                {post.shared_profile.social_links?.facebook && <a href={post.shared_profile.social_links.facebook} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#1877f2] transition-colors" title="Facebook"><SOCIAL_SVGS.facebook className="w-4 h-4 md:w-5 md:h-5" /></a>}
                                {post.shared_profile.social_links?.portfolio && <a href={post.shared_profile.social_links.portfolio} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-sporthub-neon transition-colors" title="Portfolio"><Globe className="w-4 h-4 md:w-5 md:h-5" /></a>}
                            </div>
                            
                            {authUser?.id !== post.shared_profile.id && (
                                <div className="flex items-center justify-center xl:justify-end gap-2 w-full xl:w-auto">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleFollowSharedProfile(); }}
                                        disabled={isFollowProcessing}
                                        className={`flex-1 xl:flex-none min-w-[110px] text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-lg ${post.shared_profile.is_following ? 'bg-white/5 text-white border border-white/10' : 'bg-sporthub-neon text-black hover:scale-105 shadow-sporthub-neon/10'} disabled:opacity-50`}
                                    >
                                        {post.shared_profile.is_following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                        {post.shared_profile.is_following ? 'Siguiendo' : 'Seguir'}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/messages?contactId=${post.shared_profile.id}`); }}
                                        className="flex-1 xl:flex-none min-w-[110px] bg-sporthub-cyan text-black text-sm font-bold px-4 py-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-sporthub-cyan/10"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Mensaje
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {post.media_url && post.media_url !== 'None' && post.media_url !== '' && (
                <div 
                    onClick={() => onMediaClick(post.id)}
                    className="w-full bg-[#0B0F19] border-y border-white/5 overflow-hidden cursor-pointer group/media relative min-h-[250px] flex items-center justify-center"
                >
                    {isMediaLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-sporthub-card/50 z-20">
                            <Loader2 className="w-8 h-8 text-sporthub-neon/40 animate-spin" />
                        </div>
                    )}

                    {isVideo(post.media_url) ? (
                        <div className="relative group/vid w-full h-full z-10">
                            <video 
                                src={getMediaUrl(post.media_url)} 
                                muted 
                                loop 
                                autoPlay
                                playsInline
                                preload="auto"
                                className="w-full max-h-[600px] object-contain transition-transform duration-700 group-hover/media:scale-[1.01] bg-transparent"
                                onLoadedData={() => setIsMediaLoading(false)}
                                onCanPlay={() => setIsMediaLoading(false)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-transform duration-300 group-hover/media:scale-110">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex items-center justify-center min-h-[200px] max-h-[600px] z-10">
                            <img 
                                src={getMediaUrl(post.media_url)} 
                                className="w-full h-full object-contain transition-transform duration-700 group-hover/media:scale-[1.01]" 
                                alt="Post" 
                                onLoad={() => setIsMediaLoading(false)}
                                onError={(e) => { 
                                    e.target.src = "/test_media/sample_atleta.svg";
                                    setIsMediaLoading(false);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {post.post_type === 'service' && (
                <div className="px-4 py-2">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            const msg = encodeURIComponent(`Hola, me interesa tu servicio de ${post.service_title}`);
                            navigate(`/messages?contactId=${post.author.id}&prefill=${msg}`); 
                        }}
                        className="w-full bg-sporthub-neon text-black font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        MÁS INFORMACIÓN
                    </button>
                </div>
            )}

            <div className="p-4 flex gap-6">
                <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 group/like transition-all duration-300 p-2 rounded-xl ${post.is_liked_by_user ? 'bg-sporthub-neon/10 text-sporthub-neon' : 'hover:bg-sporthub-neon/10 text-sporthub-muted hover:text-sporthub-neon'}`}
                >
                    <div className="relative">
                        <Heart className={`w-6 h-6 transition-transform group-active/like:scale-75 ${post.is_liked_by_user ? 'fill-sporthub-neon drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]' : ''}`} />
                        {post.is_liked_by_user && <div className="absolute inset-0 bg-sporthub-neon/30 blur-xl rounded-full" />}
                    </div>
                    <span className={`text-sm font-black tracking-tighter ${post.is_liked_by_user ? 'text-sporthub-neon' : 'text-gray-400'}`}>
                        {post.likes_count}
                    </span>
                </button>
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sporthub-muted hover:text-sporthub-cyan transition-colors"
                >
                    <MessageCircle className="w-5 h-5" /> 
                    <span className="text-xs font-bold">{post.comments_count || 0}</span>
                </button>
                <div className="flex items-center gap-4 ml-auto">
                    <button 
                        onClick={handleShare}
                        className="text-sporthub-muted hover:text-sporthub-neon transition-colors group/share flex items-center gap-2"
                    >
                        <Share2 className="w-5 h-5 group-hover/share:scale-110 transition-transform" /> 
                        <span className="text-xs font-bold">{post.shares_count || 0}</span>
                    </button>
                    <button 
                        onClick={handleSave}
                        className={`transition-colors ${post.is_saved_by_user ? 'text-sporthub-neon font-bold drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'text-sporthub-muted hover:text-white'}`}
                    >
                        <Bookmark className={`w-5 h-5 transition-transform active:scale-75 ${post.is_saved_by_user ? 'fill-sporthub-neon' : ''}`} /> 
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="bg-[#0B0F19] p-4 border-t border-sporthub-border">
                    <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {post.comments_count === 0 && <p className="text-xs text-sporthub-muted italic">Sé el primero en comentar.</p>}
                        {post.comments?.map((comment, idx) => (
                            <div key={idx} className="flex gap-3 text-sm bg-sporthub-card p-3 rounded-2xl flex-col hover:bg-white/[0.02] transition-all group/comm">
                                <div className="flex gap-3">
                                    <Link to={`/profile/${comment.author.id}`} className="shrink-0">
                                        <img 
                                            src={getMediaUrl(comment.author.avatar_url)} 
                                            className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover/comm:border-sporthub-cyan transition-all" 
                                            alt={comment.author.name} 
                                        />
                                    </Link>
                                    <div className="flex flex-col flex-1">
                                        <Link 
                                            to={`/profile/${comment.author.id}`} 
                                            className="font-black text-white hover:text-sporthub-cyan transition-colors text-[10px] uppercase tracking-tighter"
                                        >
                                            {comment.author.name}
                                        </Link>
                                        <p className="text-gray-300 text-[11px] leading-tight">{comment.text}</p>
                                    </div>
                                </div>
                                {comment.media_url && (
                                    <img src={getMediaUrl(comment.media_url)} className="w-full max-h-40 object-cover rounded-xl mt-1 border border-sporthub-border" alt="adjunto" />
                                )}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleComment} className="flex flex-col gap-2 relative">
                        <div className="flex items-center gap-2 bg-sporthub-card border border-sporthub-border rounded-xl pr-2 focus-within:border-sporthub-cyan transition-colors">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-sporthub-neon">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                            <input 
                                type="text" 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder={isUploadingComment ? "Subiendo..." : "Escribe tu observación..."}
                                disabled={isUploadingComment}
                                className="flex-1 bg-transparent py-2.5 text-xs text-white focus:outline-none"
                            />
                            <button type="submit" disabled={isUploadingComment || (!commentText.trim() && !fileInputRef.current?.files[0])} className="text-sporthub-cyan p-2 hover:bg-sporthub-cyan/10 rounded-xl transition-colors disabled:opacity-50">
                                {isUploadingComment ? <Loader2 className="w-4 h-4 animate-spin text-sporthub-neon" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* MINI-MODAL DE CALIFICACIÓN */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsRatingModalOpen(false)}>
                    <div className="bg-[#1e293b] p-8 rounded-[32px] border border-white/10 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-[#facc15]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Star className="w-8 h-8 text-[#facc15] fill-[#facc15]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center text-pretty leading-tight">¿Cómo calificarías este servicio?</h3>
                        <p className="text-gray-400 text-[10px] mb-8 text-center uppercase tracking-tighter">Tu valoración ayuda a otros deportistas a elegir a los mejores profesionales.</p>
                        
                        <div className="flex justify-center gap-3 mb-8">
                            {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                    key={score}
                                    onMouseEnter={() => setHoverRating(score)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => handleRateSubmit(score)}
                                    disabled={isSubmittingRating}
                                    className="transition-transform active:scale-90 hover:scale-125 disabled:opacity-50"
                                >
                                    <Star 
                                        size={20} 
                                        className={`${(hoverRating || 0) >= score ? 'fill-[#facc15] text-[#facc15]' : 'text-gray-600'} transition-colors`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setIsRatingModalOpen(false)}
                            className="w-full py-2 text-gray-500 font-bold hover:text-white transition-colors text-[10px] uppercase tracking-widest"
                        >
                            Pasar por ahora
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
