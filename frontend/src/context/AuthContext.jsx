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
    const [lastProfileUpdate, setLastProfileUpdate] = useState(null);
    const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState(null);
    const socketRef = React.useRef(null);

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

    const sendJsonMessage = useCallback((msg) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(msg));
        }
    }, []);

    // --- BLOQUE CRUCIAL: Inicialización y Persistencia de Sesión ---
    useEffect(() => {
        const initAuth = async () => {
            // Se intenta recuperar el token JWT del almacenamiento local del navegador (LocalStorage)
            const token = localStorage.getItem('access_token');
            const safetyTimeout = setTimeout(() => setLoading(false), 10000);

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        await fetchLatestUser(decoded);
                        fetchUnreadCount();
                        fetchSocialCount();
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

    // 🟢 LATIDO GLOBAL (HEARTBEAT)
    useEffect(() => {
        if (!user?.id) return;
        const heartbeat = setInterval(async () => {
            if (!localStorage.getItem('access_token')) return;
            try {
                const [msgRes, notifRes] = await Promise.all([
                    api.get('/messages/unread-count/'),
                    api.get('/social/notifications/count/')
                ]);
                setUnreadCount(msgRes.data.unread_count);
                setSocialCount(notifRes.data.unread_count);
            } catch (e) { console.warn("Error en Heartbeat:", e); }
        }, 20000);
        return () => clearInterval(heartbeat);
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const baseURL = api.defaults.baseURL || "";
        const wsBaseUrl = baseURL.replace('http', 'ws').replace('/api', '');
        const wsUrl = `${wsBaseUrl}/ws/notifications/?token=${token}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onmessage = (event) => {
            try {
                // Se recibe el mensaje en formato JSON a través del WebSocket
                const data = JSON.parse(event.data);
                
                // --- MANEJO DE SEÑALES EN TIEMPO REAL ---
                // 1. Presencia: Detecta si otros usuarios entran o salen (Online/Offline)
                if (data.type === 'presence_update') {
                    const { user_id, is_online } = data.data;
                    setOnlineUserIds(prev => {
                        const newSet = new Set(prev);
                        if (is_online) newSet.add(user_id);
                        else newSet.delete(user_id);
                        return newSet;
                    });
                }

                // 2. Actualización de Perfil (Global/Cualquier Usuario)
                if (data.type === 'profile_update') {
                    setLastProfileUpdate(data.data);
                }

                // 2.5 Actualización de Analítica (Ej: Distribución deportes)
                if (data.type === 'analytics_update') {
                    console.log("📊 Señal de actualización de analítica recibida:", data.data);
                    setLastAnalyticsUpdate(Date.now());
                }

                // 3. Notificaciones y Contadores Propios
                if (data.type === 'new_notification') {
                    setLastNotification({ ...data.data, eventType: data.type });
                    if (data.data?.type === 'count_update' || data.data?.type === 'follow') {
                        if (data.data.followers_count !== undefined) updateUser({ followers_count: data.data.followers_count });
                        if (data.data.following_count !== undefined) updateUser({ following_count: data.data.following_count });
                    }
                    if (data.data?.type === 'message') fetchUnreadCount();
                    fetchSocialCount();
                }
            } catch (err) { console.error("WS error:", err); }
        };

        return () => { ws.close(); socketRef.current = null; };
    }, [user?.id, updateUser]); 

    return (
        <AuthContext.Provider value={{
            user, setUser, login, logout, updateUser,
            unreadCount, setUnreadCount, fetchUnreadCount,
            socialCount, setSocialCount, fetchSocialCount,
            loading, lastNotification, lastProfileUpdate, lastAnalyticsUpdate, sendJsonMessage,
            onlineUserIds
        }}>
            {children}
        </AuthContext.Provider>
    );
};