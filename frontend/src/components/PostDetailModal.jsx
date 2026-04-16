import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Share2, Send, Loader2, Bookmark, UserPlus, UserMinus, Clock, TrendingUp, Trash2, AlertTriangle, Check, Tag, DollarSign, Star, StarHalf, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl, isVideo } from '../utils/media';
import { Link, useNavigate } from 'react-router-dom';
import { LikesListModal } from './LikesListModal';

export const PostDetailModal = ({ postId, onClose, onUpdatePost }) => {
    const { user: authUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareConfirm, setShowShareConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const followStatusRef = useRef(false); // Ref para proteger el estado optimista de reflejos de red

    // Sincronizar Ref con State
    useEffect(() => {
        followStatusRef.current = isProcessingFollow;
    }, [isProcessingFollow]);

    const [shareError, setShareError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                const { data } = await api.get(`/posts/${postId}/`);
                
                // Protección: No sobreescribir el estado de seguimiento si hay una petición en curso
                let finalPost = data;
                if (followStatusRef.current && post) {
                    finalPost = {
                        ...data,
                        author: {
                            ...data.author,
                            is_following: post.author.is_following
                        }
                    };
                }
                
                setPost(finalPost);
                setEditContent(finalPost.content);
                if (onUpdatePost) onUpdatePost(finalPost);
            } catch (err) {
                console.error("Error al cargar detalle del post:", err);
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        if (postId) {
            fetchPostDetail();
            document.body.style.overflow = 'hidden';
            
            // Polling cada 5s para comentarios y likes
            const pollId = setInterval(() => fetchPostDetail(true), 5000);
            return () => {
                clearInterval(pollId);
                document.body.style.overflow = 'unset';
            };
        }
    }, [postId]);

    // Manejar cierre con Esc fuera del polling para estabilidad
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleLike = async () => {
        if (!post) return;
        const originallyLiked = post.is_liked_by_user;
        const updatedPost = {
            ...post,
            is_liked_by_user: !originallyLiked,
            likes_count: post.likes_count + (originallyLiked ? -1 : 1)
        };
        setPost(updatedPost);
        if (onUpdatePost) onUpdatePost(updatedPost);

        try {
            await api.post('/social/like/', { post_id: post.id });
        } catch (e) {
            // Revert on error
            const revertedPost = {
                ...post,
                is_liked_by_user: post.is_liked_by_user,
                likes_count: post.likes_count
            };
            setPost(revertedPost);
            if (onUpdatePost) onUpdatePost(revertedPost);
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || isSendingComment) return;

        setIsSendingComment(true);
        try {
            await api.post('/posts/comment/', { 
                post_id: post.id, 
                text: commentText 
            });
            
            // Refrescar para ver el nuevo comentario
            const { data } = await api.get(`/posts/${postId}/`);
            
            let finalPost = data;
            // Protección idéntica para el refresco tras comentar
            if (followStatusRef.current) {
                finalPost = {
                    ...data,
                    author: {
                        ...data.author,
                        is_following: post.author.is_following
                    }
                };
            }
            
            setPost(finalPost);
            if (onUpdatePost) onUpdatePost(finalPost);
            setCommentText('');
            
            // Scroll al final (opcional)
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        } catch (err) {
            console.error("Error comentando:", err);
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleEditPost = async () => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/posts/edit/${post.id}/`, { content: editContent });
            setPost(prev => ({ ...prev, content: editContent, is_edited: true }));
            setIsEditing(false);
        } catch (e) {
            console.error("Error editando post", e);
        }
    };

    const handleRateSubmit = async (score) => {
        setIsSubmittingRating(true);
        try {
            const { data } = await api.post(`/posts/rate/${post.id}/`, { score });
            const updatedPost = {
                ...post,
                average_rating: data.average_rating,
                ratings_count: data.ratings_count,
                user_has_rated: true
            };
            setPost(updatedPost);
            if (onUpdatePost) onUpdatePost(updatedPost);
            setIsRatingModalOpen(false);
        } catch (error) {
            console.error("Error calificado servicio:", error);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleFollow = async () => {
        if (!post?.author) return;
        
        const originallyFollowing = post.author.is_following;

        const updatedPost = {
            ...post,
            author: {
                ...post.author,
                is_following: !originallyFollowing
            }
        };
        
        // 1. Acción Instantánea (UI)
        setPost(updatedPost);
        if (onUpdatePost) onUpdatePost(updatedPost);
        
        // 2. Bloqueo de Background Polling
        setIsProcessingFollow(true);
        followStatusRef.current = true;

        // Update global AuthContext following count
        updateUser({
            following_count: (authUser.following_count || 0) + (originallyFollowing ? -1 : 1)
        });

        try {
            await api.post('/social/follow/', { target_id: post.author.id });
        } catch (err) {
            // Revert state ONLY on real error
            setPost(prev => ({
                ...prev,
                author: {
                    ...prev.author,
                    is_following: originallyFollowing
                }
            }));
            updateUser({
                following_count: authUser.following_count
            });
            console.error("Error siguiendo al autor:", err);
        } finally {
            setIsProcessingFollow(false);
            // Cooldown de 3 segundos para el polling:
            // Asegura que no se sobrescriba el estado visual hasta que el backend se estabilice
            setTimeout(() => {
                followStatusRef.current = false;
            }, 3000);
        }
    };

    const handleConfirmShare = async () => {
        setIsSharing(true);
        setShareError(null);
        try {
            await api.post('/posts/share/', { post_id: post.id });
            setPost(prev => ({ ...prev, shares_count: (prev.shares_count || 0) + 1 }));
            setShowShareConfirm(false);
        } catch (err) {
            setShareError("Error al compartir. Es posible que ya hayas compartido este post.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDeletePost = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${post.id}/`);
            onClose(); 
            window.location.reload(); 
        } catch (e) {
            console.error("Error eliminando post:", e);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!postId) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 lg:p-10 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            
            {/* Botón Cierre (X) */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-[210] p-3 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
            >
                <X className="w-6 h-6" />
            </button>
            {/* Modal Container */}
            <div className="relative w-full max-w-6xl h-full md:h-[90vh] bg-sporthub-card border border-sporthub-border rounded-none md:rounded-[2.5rem] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,0,0,0.8)] scrollbar-hide animate-in zoom-in duration-300">
                
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center p-20">
                        <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* 1. Multimedia (order-1 en móvil, 60% en PC) */}
                        <div className="w-full md:w-[60%] bg-[#05070a] flex items-center justify-center overflow-hidden relative order-1 h-[80vh] md:h-full group shrink-0">
                            {isVideo(post.media_url) ? (
                                <video 
                                    src={getMediaUrl(post.media_url)} 
                                    controls autoPlay loop muted playsInline
                                    className="w-full h-full object-contain shadow-2xl transition-transform group-hover:scale-[1.02] duration-700"
                                />
                            ) : (
                                <img 
                                    src={getMediaUrl(post.media_url)} 
                                    className="w-full h-full object-contain shadow-2xl transition-transform group-hover:scale-[1.02] duration-700" 
                                    alt="Service" 
                                    onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </div>

                        {/* 2. Panel de Información (order-2 en móvil, 40% en PC) */}
                        <div className="w-full md:w-[40%] flex flex-col md:h-full border-l border-white/5 bg-sporthub-card order-2 shrink-0">
                            
                            {/* Scrollable Area (Solo en PC, en móvil fluye con el modal) */}
                            <div className="flex-1 flex flex-col md:overflow-y-auto scrollbar-hide py-2">
                                
                                {/* A. Header (Autor) */}
                                <div className="p-6 border-b border-sporthub-border/30 flex items-center justify-between bg-sporthub-card/50 backdrop-blur-md sticky top-0 z-20 w-full shrink-0">
                                    <Link to={`/profile?id=${post.author?.id}`} className="flex items-center gap-4 group/author">
                                        <img 
                                            src={getMediaUrl(post.author?.avatar_url)} 
                                            className="w-12 h-12 rounded-full border-2 border-sporthub-border object-cover bg-[#0B0F19] transition-all group-hover/author:border-sporthub-neon/50 shadow-lg" 
                                            alt={post.author?.name || 'Usuario'}
                                            onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                        />
                                        <div>
                                            <h3 className="text-white font-black text-base leading-tight group-hover/author:text-sporthub-neon transition-colors tracking-tight">{post.author?.name || 'Cargando...'}</h3>
                                            <p className="text-[10px] text-sporthub-muted uppercase font-bold tracking-[0.2em] mt-0.5">{post.author?.sport || 'Atleta Profesional'}</p>
                                        </div>
                                    </Link>
                                    
                                    <div className="flex items-center gap-3">
                                        {authUser?.id === post.author?.id ? (
                                            <>
                                                <button 
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    className={`text-[10px] font-black uppercase tracking-[0.15em] border px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${isEditing ? 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_20px_rgba(163,230,53,0.4)]' : 'text-sporthub-neon border-sporthub-neon/20 hover:bg-sporthub-neon/10'}`}
                                                >
                                                    <TrendingUp className={`w-3.5 h-3.5 ${isEditing ? 'animate-pulse' : ''}`} />
                                                    {isEditing ? 'LISTO' : 'EDITAR'}
                                                </button>
                                                {!isEditing && (
                                                    <button 
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="p-2.5 text-gray-500 hover:text-red-500 transition-all bg-white/5 hover:bg-red-500/10 rounded-xl"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => navigate(`/messages?contactId=${post.author.id}`)}
                                                    className={`p-2.5 text-sporthub-cyan bg-sporthub-cyan/5 border border-sporthub-cyan/20 rounded-xl hover:bg-sporthub-cyan/10 transition-all ${post.author?.is_following ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={handleFollow}
                                                    className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all border ${post.author?.is_following ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_30px_rgba(163,230,53,0.3)]'}`}
                                                >
                                                    {post.author?.is_following ? 'SIGUIENDO' : 'SEGUIR'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* B. Service Hero (Título, Precio, Rating) */}
                                {!isEditing && post.post_type === 'service' && (
                                    <div className="px-8 pt-6 pb-2 w-full">
                                        <div className="flex flex-col gap-4 mb-4">
                                            <h1 className="text-white font-black text-3xl leading-none uppercase italic tracking-tighter drop-shadow-2xl">
                                                {post.service_title}
                                            </h1>
                                            
                                            <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-0.5 cursor-pointer group/rate" onClick={() => (post.author.id !== authUser?.id && !post.user_has_rated) && setIsRatingModalOpen(true)}>
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={16} 
                                                                    className={`${(post.average_rating || 0) >= i + 1 ? 'fill-[#facc15] text-[#facc15]' : 'text-gray-700'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-white font-black text-sm ml-1.5">{post.average_rating?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{post.ratings_count} Valoraciones</span>
                                                </div>

                                                <div className="bg-sporthub-neon/10 border border-sporthub-neon/20 px-5 py-2.5 rounded-xl">
                                                    <p className="text-sporthub-neon font-black text-2xl leading-none tracking-tighter">${post.service_price}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* C. Acción Principal (Solo Servicios) */}
                                {post.post_type === 'service' && !isEditing && (
                                    <div className="px-8 py-2">
                                        <button 
                                            onClick={() => navigate(`/messages?contactId=${post.author.id}&prefill=${encodeURIComponent(`Hola, me interesa tu servicio de ${post.service_title}`)}`)}
                                            className="w-full bg-sporthub-neon text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            SOLICITAR INFORMACIÓN
                                            <TrendingUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* D. Descripción */}
                                <div className="px-8 py-4">
                                    {isEditing ? (
                                        <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                            <textarea 
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-black/40 border border-sporthub-border/50 rounded-2xl p-5 text-sm text-white outline-none min-h-[150px] resize-none focus:border-sporthub-neon transition-all"
                                                placeholder="Edita tu servicio..."
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => { setIsEditing(false); setEditContent(post.content); }} className="px-4 py-2 text-[10px] font-black uppercase text-gray-500">CANCELAR</button>
                                                <button onClick={handleEditPost} className="px-6 py-2 bg-sporthub-neon text-black text-[10px] font-black uppercase rounded-xl">GUARDAR</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                                            <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] pt-2">
                                                <Clock className="w-3.5 h-3.5 text-sporthub-neon/30" />
                                                <span>{new Date(post.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* E. Interacciones Social */}
                                <div className="px-8 py-4 flex items-center justify-between border-y border-white/5 my-4">
                                    <div className="flex items-center gap-8">
                                        <button onClick={handleLike} className={`flex items-center gap-2.5 transition-all ${post.is_liked_by_user ? 'text-red-500 scale-105' : 'text-gray-400 hover:text-white'}`}>
                                            <Heart className={`w-5 h-5 ${post.is_liked_by_user ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-black">{post.likes_count}</span>
                                        </button>
                                        <div className="flex items-center gap-2.5 text-gray-400">
                                            <MessageCircle className="w-5 h-5" />
                                            <span className="text-xs font-black">{post.comments?.length || 0}</span>
                                        </div>
                                        <button onClick={() => setShowShareConfirm(true)} className="text-gray-400 hover:text-sporthub-neon transition-all">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setShowLikesModal(true)}
                                        className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all hover:bg-white/5 group/likelist shadow-sm"
                                        title="Ver quiénes dieron like"
                                    >
                                        <Heart className="w-5 h-5 group-hover/likelist:scale-110 transition-transform" />
                                    </button>
                                </div>

                                {/* F. Chat & Comentarios */}
                                <div className="px-8 pb-8 space-y-6">
                                    <form onSubmit={handleSendComment} className="relative">
                                        <input 
                                            type="text" 
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Añade un comentario..."
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:border-sporthub-neon outline-none transition-all placeholder:text-gray-600"
                                        />
                                        <button type="submit" disabled={!commentText.trim() || isSendingComment} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-sporthub-neon disabled:opacity-20 transition-all hover:scale-110">
                                            {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </form>

                                    <div className="space-y-4">
                                        {post.comments?.length > 0 ? (
                                            post.comments.map((comment, i) => (
                                                <div key={i} className="flex gap-4 group/comm animate-in slide-in-from-bottom-2 duration-300">
                                                    <img src={getMediaUrl(comment.author.avatar_url)} className="w-10 h-10 rounded-full object-cover border border-white/5 bg-[#0B0F19]" alt={comment.author.name} />
                                                    <div className="flex-1 bg-white/[0.03] rounded-2xl p-4 border border-white/5 group-hover/comm:bg-white/5 transition-all">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[11px] font-black text-white">{comment.author.name}</span>
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 leading-tight">{comment.text}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Sé el primero en comentar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Overlay (Custom UI) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
                    <div className="bg-sporthub-card border border-white/10 w-full max-w-sm rounded-[2rem] p-8 relative z-[310] shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-white text-xl font-black text-center mb-2 uppercase italic tracking-tighter">¿Eliminar contenido?</h3>
                        <p className="text-gray-400 text-center text-xs mb-8 leading-relaxed">
                            Al confirmar, este post y todos sus <span className="text-red-400 font-bold">reposts</span> desaparecerán de SportHub permanentemente.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDeletePost}
                                disabled={isDeleting}
                                className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                            >
                                {isDeleting ? 'Eliminando...' : 'Borrar ahora'}
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="w-full bg-white/5 text-gray-500 font-bold py-4 rounded-xl hover:text-white transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Share Confirmation Overlay */}
            {showShareConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isSharing && setShowShareConfirm(false)} />
                    <div className="bg-sporthub-card border border-white/10 w-full max-w-sm rounded-[2rem] p-8 relative z-[310] shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className="w-16 h-16 bg-sporthub-neon/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Share2 className="w-8 h-8 text-sporthub-neon" />
                        </div>
                        <h3 className="text-white text-xl font-black mb-2 uppercase italic tracking-tighter">¿Viralizar Post?</h3>
                        <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                            Esta publicación de <span className="text-sporthub-neon font-bold">{post.author.name}</span> aparecerá en tu muro.
                        </p>
                        
                        {shareError && <p className="text-red-400 text-[10px] font-bold mb-4 uppercase">{shareError}</p>}
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleConfirmShare}
                                disabled={isSharing}
                                className="w-full bg-sporthub-neon text-black font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                            >
                                {isSharing ? 'Viralizando...' : 'Confirmar Repost'}
                            </button>
                            <button 
                                onClick={() => setShowShareConfirm(false)}
                                disabled={isSharing}
                                className="w-full bg-white/5 text-gray-500 font-bold py-4 rounded-xl hover:text-white transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Likes List Modal */}
            {showLikesModal && (
                <LikesListModal 
                    postId={post.id} 
                    onClose={() => setShowLikesModal(false)} 
                />
            )}

            {/* MINI-MODAL DE CALIFICACIÓN */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsRatingModalOpen(false)}>
                    <div className="bg-[#1e293b] p-8 rounded-[32px] border border-white/10 max-w-sm w-full shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-[#facc15]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Star className="w-8 h-8 text-[#facc15] fill-[#facc15]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center leading-tight">¿Cómo calificarías este servicio?</h3>
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
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
