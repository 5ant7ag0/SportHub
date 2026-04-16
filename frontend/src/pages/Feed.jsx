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
    const { user: authUser } = useAuth();
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

    // --- 1. MEMOIZAMOS LA FUNCIÓN (Crucial para WebSockets) ---
    const fetchPosts = useCallback(async (sportFilter = activeSport) => {
        try {
            const path = sportFilter ? `/feed/?sport=${sportFilter}` : '/feed/';
            const { data } = await api.get(path);
            setPosts(data);
        } catch (error) {
            console.error("Error trayendo feed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeSport]);

    // --- 2. WEBSOCKET CON PEQUEÑO RETRASO DE SEGURIDAD ---
    useEffect(() => {
        fetchPosts();

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const socket = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.data?.type === 'feed_update') {
                console.log("🚀 ¡Nuevo post detectado! Esperando sincronización...");

                // Esperamos 300ms para que MongoDB Atlas / Local termine de indexar
                setTimeout(() => {
                    console.log("🔄 Refrescando ahora!");
                    fetchPosts();
                }, 300);
            }
        };

        socket.onerror = (err) => console.error("Error WebSocket Feed:", err);

        return () => socket.close();
    }, [fetchPosts]); // fetchPosts es estable gracias a useCallback

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
            fetchPosts();
        } catch (e) {
            console.error("Error crítico compartiendo post:", e);
            setShareError("No se pudo compartir. Inténtalo de nuevo más tarde.");
        } finally {
            setIsSharing(false);
        }
    }, [sharingPost, isSharing, fetchPosts]);

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

    if (isLoading && posts.length === 0) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center bg-sporthub-bg text-sporthub-neon font-black italic tracking-tighter uppercase">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <span className="animate-pulse">Cargando Muro Real-Time...</span>
                </div>
            </main>
        );
    }

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
                                    setIsLoading(true);
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
                    onPostCreated={() => fetchPosts()}
                />

                <div className="flex flex-col gap-6">
                    {posts.length === 0 ? (
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
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onShare={handleOpenShare}
                                onMediaClick={(id) => setSelectedPostId(id)}
                                onDelete={(id) => setPostToDelete(id)}
                            />
                        ))
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