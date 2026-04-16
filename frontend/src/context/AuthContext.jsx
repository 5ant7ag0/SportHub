import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socialCount, setSocialCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastNotification, setLastNotification] = useState(null);
    // NUEVO: Lista real de IDs conectados para evitar el "+2"
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());

    const fetchLatestUser = async (baseUser) => {
        try {
            const { data: profile } = await api.get('/profile/');
            setUser({
                ...baseUser,
                ...profile,
                id: profile.id || baseUser.user_id,
                avatar_url: profile.avatar_url && profile.avatar_url !== '' ? profile.avatar_url : "/test_media/sample_atleta.svg"
            });
        } catch (e) {
            console.error("Error al sincronizar perfil:", e);
            setUser(baseUser);
        }
    };

    // --- BLOQUE CRUCIAL: Inicialización (Evita la pantalla negra) ---
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');

            const safetyTimeout = setTimeout(() => {
                setLoading(false);
            }, 3000);

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        await fetchLatestUser(decoded);
                    }
                } catch (e) {
                    console.error("Token decoding error:", e);
                    logout();
                }
            }

            clearTimeout(safetyTimeout);
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (token) => {
        localStorage.setItem('access_token', token);
        const decoded = jwtDecode(token);
        await fetchLatestUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = useCallback((data) => {
        setUser(prev => (prev ? { ...prev, ...data } : null));
    }, []);

    const fetchUnreadCount = async () => {
        if (!localStorage.getItem('access_token')) return;
        try {
            const { data } = await api.get('/messages/unread-count/');
            setUnreadCount(data.unread_count);
        } catch (e) { console.error("Error unread:", e); }
    };

    const fetchSocialCount = async () => {
        if (!localStorage.getItem('access_token')) return;
        try {
            const { data } = await api.get('/social/notifications/count/');
            setSocialCount(data.unread_count);
        } catch (e) { console.error("Error social:", e); }
    };

    // --- Sistema de Sincronización Real (WebSockets Centralizado) ---
    useEffect(() => {
        if (!user) return;

        let ws = null;

        const connectWS = () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            try {
                const baseURL = api.defaults.baseURL || "";
                const wsBaseUrl = baseURL.replace('http', 'ws').replace('/api', '');
                const wsUrl = `${wsBaseUrl}/ws/notifications/?token=${token}`;

                ws = new WebSocket(wsUrl);

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // 1. Gestión de Presencia (Donut y Tabla)
                        if (data.type === 'presence_update') {
                            const { user_id, is_online } = data.data;
                            setOnlineUserIds(prev => {
                                const newSet = new Set(prev);
                                if (is_online) newSet.add(user_id);
                                else newSet.delete(user_id);
                                return newSet;
                            });
                        }

                        // 2. Notificaciones Generales
                        if (data.type === 'new_notification' || data.type === 'feed_update') {
                            setLastNotification({ ...data.data, eventType: data.type });

                            // Refrescar contadores si es mensaje o social
                            if (data.data?.type === 'message') fetchUnreadCount();
                            fetchSocialCount();
                        }
                    } catch (err) {
                        console.error("Error procesando socket:", err);
                    }
                };

                ws.onerror = (e) => console.warn("WebSocket error:", e);
            } catch (error) {
                console.error("Fallo crítico WebSocket:", error);
            }
        };

        connectWS();
        return () => { if (ws) ws.close(); };
    }, [user?.id]);

    return (
        <AuthContext.Provider value={{
            user, setUser, login, logout, updateUser,
            unreadCount, socialCount, loading, lastNotification,
            onlineUserIds // Enviamos el Set para el Donut del Dashboard
        }}>
            {children}
        </AuthContext.Provider>
    );
};