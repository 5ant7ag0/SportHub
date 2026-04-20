import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { Loader2, Bookmark, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PostDetailModal } from '../components/PostDetailModal';
import { PostCard, ShareConfirmModal, DeleteConfirmModal } from '../components/PostCard';
import { SuggestedUsers } from '../components/SuggestedUsers';

export const Saved = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const { user: authUser } = useAuth();

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

    const fetchSavedPosts = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const currentOffset = isInitial ? 0 : offset;
            const { data } = await api.get(`/posts/saved/?limit=${limit}&offset=${currentOffset}`);

            if (isInitial) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }
            setHasMore(data.has_more);
        } catch (error) {
            console.error("Error trayendo guardados:", error);
        } finally {
            setIsLoading(false);
        }
    }, [offset]);

    useEffect(() => {
        fetchSavedPosts(offset === 0);
    }, [offset, fetchSavedPosts]);

    const handleOpenShare = useCallback((post) => {
        if (!post?.id) return;
        setSharingPost(post);
        setShareError(null);
        setIsShareModalOpen(true);
    }, []);

    const handleConfirmShare = useCallback(async () => {
        if (!sharingPost?.id || isSharing) return;
        setIsSharing(true);
        try {
            await api.post('/posts/share/', { post_id: sharingPost.id });
            setIsShareModalOpen(false);
            setSharingPost(null);
        } catch (e) {
            setShareError("Error al compartir.");
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
        // Lógica de "Tiempo Real" solicitada: si deja de estar guardado, se va de la lista
        if (updatedPost.is_saved_by_user === false) {
            setPosts(prev => prev.filter(p => p.id !== updatedPost.id));
        } else {
            setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        }
    }, []);

    const handleCloseModal = useCallback(() => setSelectedPostId(null), []);

    return (
        <div className="p-0 bg-sporthub-bg h-[calc(100vh-6rem)] lg:h-screen overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-full items-start overflow-hidden px-4 md:px-0">

                {/* Columna Principal */}
                <div className="xl:col-span-8 flex flex-col h-full overflow-y-auto no-scrollbar pt-6 pb-20">

                    {/* Header de Sección */}
                    <div className="flex items-center gap-4 mb-8 bg-sporthub-card/50 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                        <div className="w-12 h-12 bg-sporthub-steel/10 rounded-2xl flex items-center justify-center border border-sporthub-steel/20 shadow-lg">
                            <Bookmark className="w-6 h-6 text-sporthub-steel fill-sporthub-steel" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Guardados</h2>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Tu colección personal de inspiración</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {posts.length === 0 && !isLoading ? (
                            <div className="py-24 text-center bg-sporthub-card rounded-3xl border border-dashed border-white/5 animate-in fade-in duration-700">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bookmark className="w-10 h-10 text-gray-700" />
                                </div>
                                <h3 className="text-white font-black text-xl mb-2 uppercase tracking-tight">Nada guardado aún</h3>
                                <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Cuando encuentres algo que te inspire, guárdalo para verlo aquí más tarde.</p>
                                <button
                                    onClick={() => navigate('/feed')}
                                    className="bg-sporthub-neon text-black font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all active:scale-95"
                                >
                                    Explorar el Feed
                                </button>
                            </div>
                        ) : (
                            <>
                                {posts.map((post, index) => (
                                    <div
                                        key={post.id}
                                        ref={index === posts.length - 1 ? lastPostRef : null}
                                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <PostCard
                                            post={post}
                                            onShare={handleOpenShare}
                                            onMediaClick={(id) => setSelectedPostId(id)}
                                            onDelete={(id) => setPostToDelete(id)}
                                            onUpdate={handleUpdatePost}
                                        />
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-sporthub-neon" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Columna Lateral */}
                <aside className="hidden xl:flex xl:col-span-4 h-full overflow-y-auto no-scrollbar pt-6 pb-20">
                    <div className="w-full flex flex-col gap-6">
                        <SuggestedUsers />
                    </div>
                </aside>
            </div>

            {/* Modales */}
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
