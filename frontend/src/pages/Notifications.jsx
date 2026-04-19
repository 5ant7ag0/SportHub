import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Heart, UserPlus, MessageCircle, Clock, BellOff, Loader2, ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../utils/media';

export const Notifications = () => {
    const { fetchSocialCount } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const { data } = await api.get('/social/notifications/');
                setNotifications(data);
                // Al cargar la página, se marcan como leídas en el backend automáticamente (según vista)
                // Forzamos el refresh del contador global
                fetchSocialCount();
            } catch (e) {
                console.error("Error loading notifications:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadNotifications();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
            case 'follow': return <UserPlus className="w-4 h-4 text-sporthub-cyan" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-sporthub-neon" />;
            case 'repost': return <Share2 className="w-4 h-4 text-sporthub-neon" />; // Nuevo icono viral
            default: return <BellOff className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActionText = (type) => {
        switch (type) {
            case 'like': return "le dio me gusta a tu publicación";
            case 'follow': return "comenzó a seguirte";
            case 'comment': return "comentó en tu post";
            case 'repost': return "compartió tu publicación"; // Texto viral
            default: return "realizó una acción";
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-sporthub-bg">
                <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-sporthub-bg min-h-screen p-4 lg:p-10 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Actividad Reciente</h1>
                        <p className="text-gray-500 text-sm">Lo que está pasando en tu perfil</p>
                    </div>
                    <div className="bg-sporthub-card border border-sporthub-border px-3 py-1 rounded-full text-[10px] text-sporthub-neon font-bold uppercase">
                        Reciente
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="bg-sporthub-card border border-sporthub-border rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-[#151b28] rounded-full flex items-center justify-center text-gray-600">
                            <BellOff className="w-8 h-8" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Sin notificaciones aún</h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                            Comparte contenido o sigue a más atletas para ver actividad aquí.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`group flex items-center gap-4 p-4 rounded-2xl bg-sporthub-card border border-sporthub-border hover:bg-sporthub-card-hover transition-all duration-300 ${!notif.read ? 'border-l-4 border-l-sporthub-neon' : ''}`}
                            >
                                <Link to={`/profile?id=${notif.actor.id}`} className="shrink-0 relative">
                                    <img
                                        src={getMediaUrl(notif.actor.avatar_url)}
                                        className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.1)] object-cover bg-[#0B0F19]"
                                        alt={notif.actor.name}
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-[#0B0F19] p-1 rounded-full border border-sporthub-border">
                                        {getIcon(notif.action_type)}
                                    </div>
                                </Link>

                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-gray-300 leading-tight">
                                        <Link to={`/profile?id=${notif.actor.id}`} className="text-white font-bold hover:text-sporthub-neon transition-colors mr-1">
                                            {notif.actor.name}
                                        </Link>
                                        {getActionText(notif.action_type)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        <span className="text-[10px] text-gray-500">{new Date(notif.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>

                                {notif.post_id && (
                                    <Link
                                        to={`/feed?post_id=${notif.post_id}`}
                                        className="shrink-0 w-10 h-10 rounded-lg bg-[#0B0F19] flex items-center justify-center border border-sporthub-border text-gray-500 hover:text-sporthub-neon hover:border-sporthub-neon transition-all"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
