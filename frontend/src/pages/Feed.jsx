// Obtiene datos de /api/feed/. Muestra publicaciones, servicios y notificaciones en tiempo real.
// Utiliza WebSockets para recibir notificaciones en tiempo real.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Heart, MessageCircle, Share2, Image as ImageIcon, Send, Bookmark, Paperclip, Check, Edit2, X, Trash2, AlertTriangle, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl, isVideo } from '../utils/media';
import { PostDetailModal } from '../components/PostDetailModal';

import { PostCard, ShareConfirmModal, DeleteConfirmModal } from '../components/PostCard';
import { CreatePostBox } from '../components/CreatePostBox';
import { SuggestedUsers } from '../components/SuggestedUsers';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const activeFilter = searchParams.get('post_type') || '';
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

    // --- 1. FETCH INICIAL / CAMBIO DE FILTRO ---
    const fetchPosts = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const currentOffset = isInitial ? 0 : offset;
            const path = activeFilter
                ? `/feed/?post_type=${activeFilter}&limit=${limit}&offset=${currentOffset}`
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
    }, [activeFilter, offset]);

    // Efecto para peticiones (Inicial o por Offset)
    useEffect(() => {
        fetchPosts(offset === 0);
    }, [offset, activeFilter]);

    // Reiniciar al cambiar de filtro
    useEffect(() => {
        setOffset(0);
        setPosts([]);
        setHasMore(true);
    }, [activeFilter]);

    // --- 2. GESTIÓN DE TIEMPO REAL ---
    useEffect(() => {
        if (!lastNotification) return;

        console.log("🔔 Signal:", lastNotification.type, lastNotification);

        // A. Nuevo Post en el Feed
        if (lastNotification.type === 'feed_update' && lastNotification.post) {
            const newPost = lastNotification.post;

            // Filtrado por tipo (Servicios vs Todos)
            if (activeFilter === 'service' && newPost.post_type !== 'service') {
                return;
            }

            setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
            });
        }

        // B. Actualización de Post existente
        if (lastNotification.type === 'post_update' && lastNotification.post) {
            const updatedPost = lastNotification.post;
            setPosts(prev => prev.map(p => {
                if (p.id === updatedPost.id) {
                    return {
                        ...p,
                        ...updatedPost,
                        is_liked_by_user: p.is_liked_by_user,
                        is_saved_by_user: p.is_saved_by_user,
                        user_has_rated: p.user_has_rated
                    };
                }
                return p;
            }));
        }

        // C. Acción de Compartir Atómica
        if (lastNotification.type === 'share_action') {
            const { original_post: updatedPost, new_repost: newPost } = lastNotification;
            console.log("⚡ Processing Share Action...", { orig: updatedPost.id, new: newPost.id });

            setPosts(prev => {
                // 1. Actualizar el contador en el post original
                let intermediatePosts = prev.map(p => {
                    if (p.id === updatedPost.id) {
                        return {
                            ...p, ...updatedPost,
                            is_liked_by_user: p.is_liked_by_user,
                            is_saved_by_user: p.is_saved_by_user,
                            user_has_rated: p.user_has_rated
                        };
                    }
                    return p;
                });

                // 2. Añadir el nuevo repost (si cumple filtro de tipo)
                if (activeFilter === 'service' && newPost.post_type !== 'service') {
                    return intermediatePosts;
                }

                if (intermediatePosts.some(p => p.id === newPost.id)) return intermediatePosts;
                return [newPost, ...intermediatePosts];
            });
        }
    }, [lastNotification, activeFilter]);

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
        } catch (e) {
            console.error("Error compartiendo post:", e);
            setShareError("No se pudo compartir.");
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
            console.error("Error eliminando post:", e);
        } finally {
            setIsDeleting(false);
        }
    }, [postToDelete]);

    const handleUpdatePost = useCallback((updatedPost) => {
        setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
    }, []);

    const handleCloseModal = useCallback(() => setSelectedPostId(null), []);

    const FILTERS = [
        { id: 'all', name: 'Todos', value: '' },
        { id: 'services', name: 'Servicios', value: 'service' }
    ];

    return (
        <div className="p-0 bg-sporthub-bg h-[calc(100vh-6rem)] lg:h-screen overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-full items-start overflow-hidden">

                {/* Columna Principal - Feed con scroll independiente */}
                <div className="xl:col-span-8 flex flex-col h-full overflow-y-auto no-scrollbar p-4 lg:p-0">
                    {/* Filtros de Escritorio (Ocultos en móvil porque se mueven al Header) */}
                    <div className="sticky top-0 z-20 bg-sporthub-bg/95 backdrop-blur-md pt-4 pb-2 mb-2 px-4 lg:px-0 hidden lg:block">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                            {FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        if (filter.value) {
                                            params.set('post_type', filter.value);
                                        } else {
                                            params.delete('post_type');
                                        }
                                        setSearchParams(params);
                                    }}
                                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeFilter === filter.value
                                        ? 'bg-sporthub-neon text-black border-sporthub-neon shadow-[0_0_15px_rgba(163,230,53,0.4)]'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 p-1 pt-4">
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
                                                        onUpdate={handleUpdatePost}
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
                                                    onUpdate={handleUpdatePost}
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
                    </div>
                </div>

                {/* Columna Lateral - Sugerencias con scroll independiente */}
                <aside className="hidden xl:flex xl:col-span-4 h-full overflow-y-auto no-scrollbar pb-20">
                    <div className="w-full">
                        <SuggestedUsers />
                    </div>
                </aside>
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
    );
};