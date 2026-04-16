import React, { useState, useEffect } from 'react';
import { X, Heart, Loader2, Check } from 'lucide-react';
import { api } from '../api';
import { getMediaUrl } from '../utils/media';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LikesListModal - Un modal elegante con estética SportHub para ver quién dio Like.
 */
export const LikesListModal = ({ postId, onClose }) => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [likes, setLikes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(null);

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                const { data } = await api.get(`/posts/${postId}/likes/`);
                setLikes(data);
            } catch (err) {
                console.error("Error cargando likes:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (postId) fetchLikes();

        // Cerrar con Esc
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [postId, onClose]);

    const handleUserClick = (userId) => {
        onClose(); // Cerrar modal detalle y este modal
        navigate(`/profile?id=${userId}`);
    };

    const handleToggleFollow = async (e, targetUserId) => {
        e.stopPropagation();
        if (isProcessing) return;

        setIsProcessing(targetUserId);
        const originallyFollowing = likes.find(u => u.id === targetUserId)?.is_following;

        // Optimistic UI
        setLikes(prev => prev.map(u => u.id === targetUserId ? { ...u, is_following: !originallyFollowing } : u));

        try {
            await api.post('/social/follow/', { target_id: targetUserId });
        } catch (err) {
            console.error("Error toggling follow:", err);
            // Revert
            setLikes(prev => prev.map(u => u.id === targetUserId ? { ...u, is_following: originallyFollowing } : u));
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            {/* Backdrop propio para el sub-modal */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#181818]">
                    <h3 className="text-white text-sm font-black uppercase italic tracking-tighter">Personas a las que les gusta esto</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                    {isLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-sporthub-neon animate-spin" />
                        </div>
                    ) : likes.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {likes.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserClick(user.id)}
                                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all group text-left"
                                >
                                    <img 
                                        src={getMediaUrl(user.avatar_url)} 
                                        className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-sporthub-neon/50 transition-colors"
                                        alt={user.name}
                                        onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate group-hover:text-sporthub-neon transition-colors">
                                            {user.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate">
                                            {user.sport || 'Atleta'} • {user.position || 'Deportista'}
                                        </p>
                                    </div>
                                    {authUser?.id !== user.id && (
                                        <button
                                            onClick={(e) => handleToggleFollow(e, user.id)}
                                            disabled={isProcessing === user.id}
                                            className={`py-1 px-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border shrink-0 ${
                                                user.is_following
                                                    ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                    : 'bg-sporthub-neon text-black border-sporthub-neon hover:shadow-[0_0_10px_rgba(163,230,53,0.4)] active:scale-95'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1 pointer-events-none">
                                                {user.is_following && <Check className="w-3 h-3 animate-in zoom-in duration-300" />}
                                                {user.is_following ? 'Siguiendo' : 'Seguir'}
                                            </span>
                                        </button>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center opacity-30">
                            <Heart className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Nadie ha reaccionado aún</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
