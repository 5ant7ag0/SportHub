import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { MapPin, UserPlus, Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/media';
import { formatAuthorMetadata } from './PostCard';

/**
 * Reusable User Card component with the premium square design, 
 * integrated banner mask, and follow/message actions.
 */
export const UserCard = ({ user: initialUser, className = "" }) => {
    const navigate = useNavigate();
    const [isFollowing, setIsFollowing] = useState(initialUser.is_following);
    const [isPending, setIsPending] = useState(false);

    // Sync if initialUser changes (e.g., from Search results refresh)
    useEffect(() => {
        setIsFollowing(initialUser.is_following);
    }, [initialUser.is_following]);

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (isPending) return;

        const previousState = isFollowing;
        setIsFollowing(!previousState);
        setIsPending(true);

        try {
            await api.post('/social/follow/', { target_id: initialUser.id });
        } catch (error) {
            console.error("Error al seguir:", error);
            setIsFollowing(previousState);
        } finally {
            // Keep pending for a moment to prevent visual jumps during state updates
            setTimeout(() => {
                setIsPending(false);
            }, 3000);
        }
    };

    const handleMessage = (e) => {
        e.stopPropagation();
        navigate(`/messages?contactId=${initialUser.id}`);
    };

    const hasBanner = initialUser.banner_url && initialUser.banner_url !== 'None' && initialUser.banner_url !== '';

    return (
        <div 
            onClick={() => navigate(`/profile?id=${initialUser.id}`)}
            className={`bg-sporthub-card border border-sporthub-border rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] group cursor-pointer aspect-square max-h-[380px] relative ${className}`}
        >
            {/* Fondo de Banner con Máscara de Degradado */}
            <div className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden">
                <div 
                    className="w-full h-full relative"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)'
                    }}
                >
                    {hasBanner ? (
                        <img 
                            src={getMediaUrl(initialUser.banner_url)} 
                            className="w-full h-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-80" 
                            alt="" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1a2235] to-sporthub-card opacity-30"></div>
                    )}
                </div>
            </div>

            <div className="p-6 flex flex-col items-center h-full relative z-10">
                {/* Avatar con Badge superpuesto */}
                <div className="relative mb-3 flex flex-col items-center pt-1">
                    <div className="p-1 rounded-full bg-sporthub-card/20 backdrop-blur-xl ring-2 ring-white/5 shadow-2xl">
                        <img 
                            src={getMediaUrl(initialUser.avatar_url)} 
                            className="w-24 h-24 rounded-full object-cover border-4 border-sporthub-card shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                            alt={initialUser.name} 
                            onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                        />
                    </div>
                    {/* Badge de Rol */}
                    <div className={`absolute -bottom-2 z-10 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${initialUser.role === 'recruiter' ? 'bg-sporthub-cyan/20 border-sporthub-cyan/40 text-sporthub-cyan' : 'bg-sporthub-neon/20 border-sporthub-neon/40 text-sporthub-neon'}`}>
                        {initialUser.role === 'recruiter' ? 'Reclutador' : 'Deportista'}
                    </div>
                    {initialUser.is_online && (
                        <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-sporthub-card z-20 bg-sporthub-neon shadow-[0_0_10px_rgba(163,230,53,0.8)]"></div>
                    )}
                </div>

                {/* Información Central */}
                <div className="text-center w-full mb-6">
                    <h4 className="text-white font-bold text-xl tracking-tight truncate mb-1">
                        {initialUser.name}
                    </h4>
                    <p className="text-gray-400 text-[11px] font-medium leading-tight opacity-90">
                        {formatAuthorMetadata(initialUser)}
                    </p>
                    <div className="mt-2 text-gray-400 text-[10px] font-medium flex items-center justify-center gap-1 opacity-80">
                        <MapPin className="w-3 h-3 text-sporthub-cyan" />
                        <span>{initialUser.city || 'Quito'}</span>
                    </div>
                </div>

                {/* Botones */}
                <div className="w-full flex gap-2 mt-auto">
                    <button 
                        onClick={handleFollow}
                        className={`flex-1 py-3.5 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all active:scale-95 border font-black text-xs uppercase tracking-widest ${isFollowing ? 'bg-white/5 border-white/10 text-white' : 'bg-sporthub-neon border-sporthub-neon text-black hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]'}`}
                    >
                        {isFollowing ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </button>

                    <button 
                        onClick={handleMessage}
                        className="w-12 bg-white/5 border border-white/10 rounded-[1.25rem] flex items-center justify-center hover:bg-sporthub-cyan hover:text-black hover:border-sporthub-cyan transition-all active:scale-95 group/msg"
                    >
                        <MessageSquare className="w-5 h-5 text-gray-400 group-hover/msg:text-black transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};
