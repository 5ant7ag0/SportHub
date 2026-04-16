import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Heart, MessageCircle, Share2, Image as ImageIcon, Send, Bookmark, Paperclip, Check, Edit2, X, Trash2, AlertTriangle, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl, isVideo } from '../utils/media';
import { PostDetailModal } from '../components/PostDetailModal';

import { PostCard, ShareConfirmModal, DeleteConfirmModal } from '../components/PostCard';
import { CreatePostBox } from '../components/CreatePostBox';

export const Feed = () => {
    // --- ESTADOS ---
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeSport, setActiveSport] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const { user: authUser, lastNotification } = useAuth();
    
    const observer = useRef();
    const lastPostRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setOffset(prev => prev + limit);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    // --- 1. FETCH INICIAL / CAMBIO DE DEPORTE ---
    const fetchPosts = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const currentOffset = isInitial ? 0 : offset;
            const path = activeSport 
                ? `/feed/?sport=${activeSport}&limit=${limit}&offset=${currentOffset}` 
                : `/feed/?limit=${limit}&offset=${currentOffset}`;
            
            const { data } = await api.get(path);
            
            if (isInitial) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }
            setHasMore(data.has_more);
        } catch (error) {
            console.error("Error trayendo feed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeSport, offset]);

    // Efecto para peticiones (Inicial o por Offset)
    useEffect(() => {
        fetchPosts(offset === 0);
    }, [offset, activeSport]);

    // Reiniciar al cambiar de deporte
    useEffect(() => {
        setOffset(0);
        setPosts([]);
        setHasMore(true);
    }, [activeSport]);

    // --- 2. GESTIÓN DE TIEMPO REAL (Centralizado) ---
    useEffect(() => {
        // Buscamos eventos donde el payload interno sea de tipo 'feed_update'
        if (lastNotification?.type === 'feed_update' && lastNotification.post) {
            const newPost = lastNotification.post;
            
            // Filtro por deporte si aplica
            if (activeSport && newPost.sport !== activeSport) return;

            console.log("🚀 Insertando post de otro usuario en tiempo real...");
            setPosts(prev => {
                // Verificamos si ya existe (para no duplicar el que insertamos localmente si somos el autor)
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
            });
        }
    }, [lastNotification, activeSport]); 

    const handleOpenShare = useCallback((post) => {
        if (!post?.id) return;
        setSharingPost(post);
        setShareError(null);
        setIsShareModalOpen(true);
    }, []);

    const handleConfirmShare = useCallback(async () => {
        if (!sharingPost?.id || isSharing) return;

        setIsSharing(true);
        setShareError(null);
        try {
            await api.post('/posts/share/', { post_id: sharingPost.id });
            setIsShareModalOpen(false);
            setSharingPost(null);
            // El propio servidor enviará el broadcast de feed_update, así que caerá en el useEffect de arriba
        } catch (e) {
            console.error("Error crítico compartiendo post:", e);
            setShareError("No se pudo compartir. Inténtalo de nuevo más tarde.");
        } finally {
            setIsSharing(false);
        }
    }, [sharingPost, isSharing]);

    const handleDeletePost = useCallback(async () => {
        if (!postToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${postToDelete}/`);
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
            setPostToDelete(null);
        } catch (e) {
            console.error("Error fatal eliminando post:", e);
            alert("No se pudo eliminar el post. Verifica tu conexión.");
        } finally {
            setIsDeleting(false);
        }
    }, [postToDelete]);

    const handleUpdatePost = useCallback((updatedPost) => {
        setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
    }, []);

    const handleCloseModal = useCallback(() => setSelectedPostId(null), []);

    const SPORTS = [
        { id: 'all', name: 'Todos', value: '' },
        { id: 'futbol', name: 'Fútbol', value: 'Fútbol' },
        { id: 'basquet', name: 'Básquet', value: 'Básquet' },
        { id: 'ecuavoley', name: 'Ecuavoley', value: 'Ecuavoley' }
    ];

    return (
        <div className="p-4 lg:p-8 bg-sporthub-bg pb-40">
            <div className="max-w-2xl mx-auto flex flex-col gap-6">

                <div className="mb-2">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Feed Principal</h2>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {SPORTS.map(sport => (
                            <button
                                key={sport.id}
                                onClick={() => {
                                    setActiveSport(sport.value);
                                }}
                                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeSport === sport.value
                                    ? 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_15px_rgba(163,230,53,0.4)]'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {sport.name}
                            </button>
                        ))}
                    </div>
                </div>

                <CreatePostBox
                    authUser={authUser}
                    onPostCreated={(newPost) => {
                        console.log("📝 Post creado localmente, prepending...");
                        setPosts(prev => {
                            if (prev.some(p => p.id === newPost.id)) return prev;
                            return [newPost, ...prev];
                        });
                    }}
                />

                <div className="flex flex-col gap-6">
                    {posts.length === 0 && !isLoading ? (
                        <div className="py-20 text-center bg-sporthub-card rounded-3xl border border-dashed border-[rgba(255,255,255,0.05)]">
                            <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No hay contenido disponible para este deporte.</p>
                            <button
                                onClick={() => setActiveSport('')}
                                className="text-sporthub-cyan text-xs font-bold mt-2 hover:underline"
                            >
                                Ver todas las publicaciones
                            </button>
                        </div>
                    ) : (
                        <>
                            {posts.map((post, index) => {
                                if (posts.length === index + 1) {
                                    return (
                                        <div ref={lastPostRef} key={post.id}>
                                            <PostCard
                                                post={post}
                                                onShare={handleOpenShare}
                                                onMediaClick={(id) => setSelectedPostId(id)}
                                                onDelete={(id) => setPostToDelete(id)}
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onShare={handleOpenShare}
                                            onMediaClick={(id) => setSelectedPostId(id)}
                                            onDelete={(id) => setPostToDelete(id)}
                                        />
                                    );
                                }
                            })}
                            
                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-sporthub-neon" />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <ShareConfirmModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    onConfirm={handleConfirmShare}
                    postAuthor={sharingPost?.author?.name}
                    isLoading={isSharing}
                    error={shareError}
                />

                <PostDetailModal
                    postId={selectedPostId}
                    onClose={handleCloseModal}
                    onUpdatePost={handleUpdatePost}
                />

                <DeleteConfirmModal
                    isOpen={!!postToDelete}
                    onClose={() => setPostToDelete(null)}
                    onConfirm={handleDeletePost}
                    isDeleting={isDeleting}
                />
            </div>
        </div>
    );
};