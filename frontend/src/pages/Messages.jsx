import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { api } from '../api';
import { Loader2, Send, Search as SearchIcon, Paperclip, X, ArrowLeft, MessageSquare, PlayCircle, Pencil, Check as SaveIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getMediaUrl } from '../utils/media';
import ChatOptionsMenu from '../components/ChatOptionsMenu';
import AnalyticsPanel from '../components/AnalyticsPanel';

const Messages = () => {
    const { user: authUser, fetchUnreadCount, setUnreadCount, lastNotification, lastAnalyticsUpdate } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [inboxConfig, setInboxConfig] = useState([]);
    
    // Lógica para pre-llenar mensaje desde URL (Marketplace)
    useEffect(() => {
        const prefillMsg = searchParams.get('prefill');
        if (prefillMsg) {
            setBody(prefillMsg);
        }
    }, [searchParams]);

    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const activeChatRef = useRef(null);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const [viewMode, setViewMode] = useState('list'); 
    const [pendingFile, setPendingFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', contact: null });
    const messagesEndRef = useRef(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const isInitialLoadRef = useRef(true);
    const isUserScrolling = useRef(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editBuffer, setEditBuffer] = useState('');
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const isManualScroll = useRef(false);
    const [syncingChats, setSyncingChats] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInitialData = async (isPolling = false) => {
        try {
            if (!isPolling && (!inboxConfig || inboxConfig.length === 0)) setIsLoading(true);
            
            // Sincronizar analítica siempre (ligero y necesario para tiempo real)
            const analyticsRes = await api.get('/analytics/summary/').catch(() => ({ data: null }));
            if (analyticsRes?.data) setAnalytics(analyticsRes.data);

            const { data: conversations } = await api.get('/messages/inbox/');
            
            const fullList = (conversations || []).map(c => {
                const contactId = String(c.contact.id);
                // Si el chat está en proceso de sincronización, preservamos su estado local
                const isSyncing = syncingChats.has(contactId);
                const existingChat = inboxConfig.find(item => String(item.contactId) === contactId);
                
                return {
                    id: contactId,
                    contactId: contactId,
                    name: c.contact.name || "Usuario",
                    sport: c.contact.sport || c.contact.rol || "Atleta",
                    avatar: getMediaUrl(c.contact.avatar_url),
                    unread: isSyncing && existingChat ? existingChat.unread : ((activeChat && String(activeChat.contactId) === contactId) ? 0 : (c.unread_count || 0)),
                    is_online: c.contact.is_online,
                    time: c.last_message ? new Date(c.last_message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Ahora",
                    lastMessage: c.last_message ? (c.last_message.content || c.last_message.body) : "Sin mensajes",
                    messages: []
                };
            });

            setInboxConfig(fullList);

            // LÓGICA DE APERTURA DESDE URL
            const contactIdFromUrl = searchParams.get('contactId');
            if (contactIdFromUrl && !isPolling) {
                const existing = fullList.find(c => String(c.contactId) === String(contactIdFromUrl));
                if (existing) {
                    handleSelectChat(existing);
                } else {
                    // Si no está en el inbox, traemos sus datos de perfil directamente para evitar la pantalla vacía
                    try {
                        const { data: profile } = await api.get(`/profile/?id=${contactIdFromUrl}`);
                        const newChat = {
                            id: profile.id,
                            contactId: profile.id,
                            name: profile.name || "Usuario",
                            sport: profile.sport || profile.rol || "Deportista",
                            avatar: getMediaUrl(profile.avatar_url),
                            unread: 0,
                            is_online: profile.is_online,
                            time: "Hoy",
                            lastMessage: "Inicia la conversación",
                            messages: []
                        };
                        setActiveChat(newChat);
                        setViewMode('chat');
                    } catch (e) {
                        console.error("Error cargando contacto externo:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error trayendo inbox:", error);
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    };

    const handleStartEdit = (msg) => {
        setEditingMessageId(msg.id);
        setEditBuffer(msg.body);
    };

    const handleSaveEdit = async (msgId) => {
        if (!editBuffer.trim()) return;
        try {
            await api.put(`/messages/edit/${msgId}/`, { body: editBuffer });
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, body: editBuffer, is_edited: true } : m));
            setEditingMessageId(null);
        } catch (error) { 
            console.error("Error editando mensaje:", error);
            showToast("No se pudo editar el mensaje", 'error');
        }
    };

    const markConversationAsRead = async (contactId) => {
        if (!contactId) return;
        const cidStr = String(contactId);
        
        // 1. ACTUALIZACIÓN OPTIMISTA (Interfaz Instantánea)
        // Buscamos en el inboxConfig actual si este chat tiene pendientes
        let hadUnread = false;
        setInboxConfig(prev => prev.map(c => {
            if (String(c.contactId) === cidStr && c.unread > 0) {
                hadUnread = true;
                return { ...c, unread: 0 };
            }
            return c;
        }));

        if (hadUnread) {
            // Restar 1 al contador global de forma inmediata
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // 2. PERSISTENCIA EN BACKEND (POST atómico)
        try {
            await api.post(`/messages/conversation/${cidStr}/`);
            // Sincronización silenciosa para asegurar consistencia
            fetchUnreadCount();
        } catch (error) {
            console.error("Error al marcar como leído:", error);
        }
    };

    const handleSelectChat = async (chat) => {
        navigate(`/messages?contactId=${chat.contactId}`, { replace: true });
        setActiveChat({ ...chat, unread: 0 }); 
        setViewMode('chat');

        // RESET DE CONTROL DE SCROLL
        isInitialLoadRef.current = true;
        isAtBottomRef.current = true;
        setShouldScrollToBottom(true);
        isManualScroll.current = false;

        try {
            const { data: history } = await api.get(`/messages/conversation/${chat.contactId}/`);
            setMessages(history || []);
        } catch (e) { console.error("Error cargando historial:", e); }
    };

    // TRIGGER DE LECTURA AUTOMÁTICO
    useEffect(() => {
        if (activeChat?.contactId) {
            markConversationAsRead(activeChat.contactId);
        }
    }, [activeChat?.contactId]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if ((!body.trim() && !pendingFile) || !activeChat || isUploading) return;

        setIsUploading(true);
        const optimisticMessage = {
            id: `temp_${Date.now()}`,
            body: body || "📎 Archivo Multimedia",
            media_url: previewUrl,
            timestamp: new Date().toISOString(),
            isMe: true,
            is_sending: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        const currentBody = body;
        const currentFile = pendingFile;
        setBody('');
        setPendingFile(null);
        setPreviewUrl(null);
        
        // FORZAR SCROLL AL ENVIAR (Interacción proactiva)
        isManualScroll.current = false;
        setShouldScrollToBottom(true);
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
        
        try {
            if (currentFile) {
                const formData = new FormData();
                formData.append('receiver_id', activeChat.contactId);
                formData.append('body', currentBody || "📎 Archivo Multimedia");
                formData.append('file', currentFile);
                await api.post('/messages/send/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/messages/send/', { receiver_id: activeChat.contactId, body: currentBody });
            }
            const { data: updated } = await api.get(`/messages/conversation/${activeChat.contactId}/`);
            setMessages(updated || []);
            // Refrescar bandeja de entrada para actualizar la previsualización del último mensaje
            fetchInitialData(true);
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setBody(currentBody);
        } finally {
            setIsUploading(false);
        }
    };

    const handleMarkAsUnread = async (contactId) => {
        const cidStr = String(contactId);
        
        // ACTIVAR LOCK Y ACTUALIZACIÓN OPTIMISTA
        setSyncingChats(prev => new Set(prev).add(cidStr));
        setInboxConfig(prev => prev.map(c => 
            String(c.contactId) === cidStr ? { ...c, unread: (c.unread || 0) + 1 } : c
        ));

        try {
            await api.post(`/messages/mark-unread/${cidStr}/`);
            fetchUnreadCount();
            setActiveDropdownId(null);
        } catch (error) { 
            console.error("Error al marcar como no leído:", error);
            fetchInitialData(true);
        } finally {
            // LIBERAR LOCK DESPUÉS DE UN BREVE LAG PARA ASEGURAR QUE EL SIGUIENTE POLLING TENGA EL DATO FRESCO
            setTimeout(() => {
                setSyncingChats(prev => {
                    const next = new Set(prev);
                    next.delete(cidStr);
                    return next;
                });
            }, 1000);
        }
    };

    const handleClearChat = async () => {
        if (!confirmModal.contact) return;
        try {
            await api.delete(`/messages/clear/${confirmModal.contact.contactId}/`);
            if (activeChat?.contactId === confirmModal.contact.contactId) setMessages([]);
            fetchInitialData(true);
            setConfirmModal({ show: false, type: '', contact: null });
            setHeaderDropdownOpen(false);
        } catch (error) { console.error(error); }
    };

    const handleDeleteChat = async () => {
        if (!confirmModal.contact) return;
        try {
            await api.delete(`/messages/delete/${confirmModal.contact.contactId}/`);
            if (activeChat?.contactId === confirmModal.contact.contactId) {
                setActiveChat(null);
                setViewMode('list');
                navigate('/messages', { replace: true });
            }
            fetchInitialData(true);
            setConfirmModal({ show: false, type: '', contact: null });
            setHeaderDropdownOpen(false);
        } catch (error) { console.error(error); }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
            const atBottom = scrollHeight - scrollTop <= clientHeight + 50;
            isAtBottomRef.current = atBottom;

            // DETECCIÓN DE SCROLL MANUAL:
            // Si el usuario sube > 50px, marcamos como manual y bloqueamos autoscroll
            if (scrollHeight - scrollTop - clientHeight > 50) {
                isManualScroll.current = true;
                setShouldScrollToBottom(false);
            } else if (atBottom) {
                isManualScroll.current = false;
                setShouldScrollToBottom(true);
            }
        }
    };

    // Manejadores para detectar interacción táctil y evitar saltos de scroll inercial
    const handleTouchStart = () => { isUserScrolling.current = true; };
    const handleTouchEnd = () => { 
        setTimeout(() => { 
            isUserScrolling.current = false; 
            handleScroll(); // Recalcular después del gesto
        }, 500); 
    };

    useEffect(() => {
        if (authUser) fetchInitialData();
    }, [authUser?.id]);

    // Integración de Tiempo Real
    useEffect(() => {
        if (!lastNotification) return;

        // Caso 1: Actualización de Presencia (Online/Offline)
        if (lastNotification.eventType === 'presence_update') {
            const { user_id, is_online } = lastNotification;
            setInboxConfig(prev => prev.map(chat => 
                String(chat.contactId) === String(user_id) ? { ...chat, is_online } : chat
            ));
            
            // Si el chat activo es el que cambió de estado, lo actualizamos también
            if (activeChatRef.current && String(activeChatRef.current.contactId) === String(user_id)) {
                setActiveChat(prev => prev ? { ...prev, is_online } : null);
            }
            return;
        }

        // Caso 2: Notificaciones de Mensajes (reordenar inbox)
        // Solo refrescar inbox si es una notificación de nueva data
        if (lastNotification.eventType === 'new_notification') {
            fetchInitialData(true);

            // Si la notificación pertenece a nuestro chat activo, traemos el nuevo mensaje
            if (activeChatRef.current && (lastNotification.type === 'message' || lastNotification.type === 'message_update')) {
                const senderId = String(lastNotification.message?.sender_id);
                if (activeChatRef.current.contactId === senderId) {
                    api.get(`/messages/conversation/${activeChatRef.current.contactId}/`)
                    .then(res => setMessages(res.data || []))
                    .catch(e => console.error("Error trayendo nuevos msgs:", e));
                }
            }
        }
    }, [lastNotification]);
    
    // 📡 ACTUALIZACIÓN DE ANALÍTICA EN TIEMPO REAL
    useEffect(() => {
        if (lastAnalyticsUpdate) {
            console.log("♻️ Mensajes: Refrescando analítica por señal externa...");
            fetchInitialData(true); // silent mode
        }
    }, [lastAnalyticsUpdate]);

    // 1. CARGA SILENCIOSA: Scroll instantáneo al entrar (Ejecutado antes de pintar)
    useLayoutEffect(() => {
        if (messages.length > 0 && isInitialLoadRef.current && scrollRef.current) {
            // Posicionamiento invisible y atómico
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            isInitialLoadRef.current = false;
        }
    }, [messages.length]);

    // 2. SCROLL REACTIVO: Para nuevos mensajes durante la sesión
    useEffect(() => {
        if (messages.length > 0 && !isInitialLoadRef.current && scrollRef.current) {
            const lastMessage = messages[messages.length - 1];
            // Excepción: Si yo envío o si estoy al fondo, scroll suave
            const forceScroll = lastMessage?.isMe;

            if (forceScroll || (shouldScrollToBottom && !isManualScroll.current)) {
                const timer = setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    if (forceScroll) {
                        isManualScroll.current = false;
                        setShouldScrollToBottom(true);
                    }
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [messages.length]);

    // Lógica de respaldo al cambiar de chat
    useEffect(() => {
        if (activeChat) {
            isInitialLoadRef.current = true; // Reiniciar para el nuevo chat
        }
    }, [activeChat?.contactId]);

    if (isLoading || !authUser) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center bg-sporthub-bg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-sporthub-neon animate-spin" />
                    <p className="text-gray-500 text-xs">Sincronizando Mensajes...</p>
                </div>
            </main>
        );
    }



    return (
        <div className="flex-1 flex overflow-hidden bg-[#0B0F19] p-4 pb-20 lg:p-6 w-full h-full relative">
            <div className="flex flex-col lg:flex-row gap-6 max-w-full w-full mx-auto h-full overflow-hidden relative items-stretch">
                
                {/* LISTA DE CHATS */}
                <div className={`${viewMode === 'chat' ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 xl:w-[350px] bg-sporthub-card rounded-[32px] border border-white/5 flex-col shrink-0 overflow-hidden shadow-xl h-full`}>
                    <div className="p-6 pb-2">
                        <div className="bg-[#0B0F19] rounded-2xl flex items-center px-4 py-3 border border-white/5 shadow-inner mb-2">
                            <SearchIcon className="w-4 h-4 text-gray-600 mr-2" />
                            <input 
                                type="text" 
                                placeholder="Buscar conversación..." 
                                className="w-full bg-transparent border-none text-white text-xs outline-none placeholder:text-gray-600" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2 pb-6">
                        {(() => {
                            const filteredInbox = (inboxConfig || []).filter(chat => 
                                chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                chat.sport.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            return filteredInbox.length > 0 ? filteredInbox.map(chat => (
                                <button key={chat.contactId} onClick={() => handleSelectChat(chat)} className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all group relative ${activeChat?.contactId === chat.contactId ? 'bg-sporthub-neon/10' : 'hover:bg-white/5'}`}>
                                <div className="relative shrink-0">
                                    <img src={chat.avatar} className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-sporthub-neon/30 object-cover bg-sporthub-card transition-all" alt="" />
                                    <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 ${chat.is_online ? 'bg-sporthub-neon shadow-[0_0_8px_rgba(163,230,53,0.6)]' : 'bg-gray-600'} rounded-full border-2 border-[#151b28]`}></div>
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="text-sm font-bold truncate text-white">{chat.name}</h3>
                                        <span className="text-[10px] text-gray-500">{chat.time}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5 opacity-60">{chat.sport}</p>
                                    <p className="text-xs truncate text-gray-500 group-hover:text-gray-300 transition-colors leading-tight">{chat.lastMessage}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {chat.unread > 0 && (
                                        <div className="bg-sporthub-neon text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in shadow-[0_4px_12px_rgba(163,230,53,0.4)]">
                                            {chat.unread}
                                        </div>
                                    )}
                                    <div className="lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity">
                                        <ChatOptionsMenu 
                                            chat={chat} 
                                            isOpen={activeDropdownId === chat.contactId} 
                                            onToggle={() => setActiveDropdownId(activeDropdownId === chat.contactId ? null : chat.contactId)} 
                                            onMarkAsUnread={handleMarkAsUnread} 
                                            onClearChat={() => setConfirmModal({ show: true, type: 'clear', contact: chat })} 
                                            onDeleteChat={() => setConfirmModal({ show: true, type: 'delete', contact: chat })} 
                                        />
                                    </div>
                                </div>
                            </button>
                            )) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-600 text-xs">
                                        {searchTerm ? `No hay resultados para "${searchTerm}"` : "Sin conversaciones activas"}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* VENTANA DE CHAT */}
                <div className="flex-1 flex flex-col min-w-0 bg-sporthub-card rounded-[32px] border border-white/5 relative h-full overflow-hidden shadow-2xl">
                    {activeChat ? (
                        <>
                            {/* CABECERA: Ajustada para ser el único elemento fijo en iOS */}
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0B0F19]/20 backdrop-blur-xl relative z-50">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => { setViewMode('list'); navigate('/messages', { replace: true }); setActiveChat(null); }} 
                                        className="lg:hidden text-gray-400 p-2 hover:text-white transition-colors bg-white/5 rounded-full"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={activeChat.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/5" alt="" />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 ${activeChat.is_online ? 'bg-sporthub-neon shadow-[0_0_5px_rgba(163,230,53,0.5)]' : 'bg-gray-600'} rounded-full border-2 border-sporthub-card`}></div>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold text-lg tracking-tight truncate max-w-[200px]">{activeChat.name}</h3>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {activeChat.is_online ? 'En línea' : 'Desconectado'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="hidden md:flex p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </button>
                                    <button className="hidden md:flex p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                    <Link to={`/profile?id=${activeChat.contactId}`} className="bg-sporthub-neon text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-sporthub-neon/20">
                                        Ver Perfil
                                    </Link>
                                    <ChatOptionsMenu chat={activeChat} variant="header" isOpen={headerDropdownOpen} onToggle={() => setHeaderDropdownOpen(!headerDropdownOpen)} onClearChat={() => setConfirmModal({ show: true, type: 'clear', contact: activeChat })} onDeleteChat={() => setConfirmModal({ show: true, type: 'delete', contact: activeChat })} />
                                </div>
                            </div>

                            <div 
                                ref={scrollRef} 
                                onScroll={handleScroll}
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                                className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-[#0B0F19]"
                            >
                                {/* SPACER REDUCIDO PARA EVITAR SALTOS VISUALES */}
                                <div className="h-4 flex-shrink-0" />

                                {(messages || []).map((msg, idx) => (
                                    <div key={msg.id || idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`p-5 rounded-[24px] max-w-[85%] md:max-w-[75%] shadow-xl transition-all relative group ${msg.isMe ? 'bg-sporthub-neon text-black font-semibold rounded-br-none shadow-sporthub-neon/10' : 'bg-[#151b28] text-white border border-white/5 rounded-bl-none shadow-[#000]/20'}`}>
                                            {msg.media_url && !editingMessageId && (
                                                <div className="mb-2 relative rounded-xl overflow-hidden group/media">
                                                    {(() => {
                                                        const url = msg.media_url.toLowerCase();
                                                        const isVideo = url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') || url.endsWith('.m4v');
                                                        const isImage = url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif') || url.endsWith('.webp');

                                                        if (isVideo) {
                                                            return (
                                                                <div 
                                                                    className="relative cursor-pointer group/video max-w-[300px] bg-black rounded-xl overflow-hidden border border-white/10 min-h-[200px] flex items-center justify-center"
                                                                    onClick={() => setFullscreenMedia(msg.media_url)}
                                                                >
                                                                    <video 
                                                                        src={`${getMediaUrl(msg.media_url)}#t=0.001`} 
                                                                        className="w-full h-auto rounded-xl shadow-inner object-cover" 
                                                                        preload="metadata"
                                                                        playsInline
                                                                        muted
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/40 transition-all">
                                                                        <PlayCircle className="w-12 h-12 text-sporthub-neon opacity-80 group-hover/video:opacity-100 group-hover/video:scale-110 transition-all drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (isImage) {
                                                            return (
                                                                <div className="min-h-[200px] bg-black/10 rounded-xl flex items-center justify-center">
                                                                    <img 
                                                                        src={getMediaUrl(msg.media_url)} 
                                                                        className="w-full h-auto max-h-64 object-contain cursor-pointer transition-transform group-hover/media:scale-[1.02]" 
                                                                        onClick={() => setFullscreenMedia(msg.media_url)} 
                                                                        alt="" 
                                                                    />
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-colors">
                                                                <Paperclip className="w-4 h-4 text-sporthub-neon" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Archivo Adjunto</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    {(msg.media_url && !msg.media_url.toLowerCase().endsWith('.mp4')) && (
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center pointer-events-none text-white text-[10px] font-bold uppercase tracking-widest">Previsualizar</div>
                                                    )}
                                                </div>
                                            )}

                                            {editingMessageId === msg.id ? (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <textarea
                                                        value={editBuffer}
                                                        onChange={(e) => setEditBuffer(e.target.value)}
                                                        className="w-full bg-black/20 border border-black/10 rounded-lg p-2 text-sm text-black outline-none focus:border-black/30 resize-none h-20"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingMessageId(null)} className="p-1 px-3 rounded-lg bg-black/10 hover:bg-black/20 text-[10px] font-bold uppercase">Cancelar</button>
                                                        <button onClick={() => handleSaveEdit(msg.id)} className="p-1 px-3 rounded-lg bg-black text-white hover:bg-black/80 text-[10px] font-bold uppercase flex items-center gap-1">
                                                            <SaveIcon className="w-3 h-3" />
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="cursor-pointer group" 
                                                    onClick={(e) => {
                                                        if (msg.isMe) {
                                                            e.stopPropagation();
                                                            setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                                                        }
                                                    }}
                                                >
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                                    {msg.isMe && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartEdit(msg);
                                                            }}
                                                            className={`absolute -left-10 top-1/2 -translate-y-1/2 p-2 transition-all duration-300 transform
                                                                ${activeMessageId === msg.id ? 'opacity-100 scale-110 text-sporthub-neon' : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-sporthub-neon'}
                                                            `}
                                                            title="Editar mensaje"
                                                        >
                                                            <Pencil className="w-4 h-4 shadow-sm" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="mt-2 flex justify-end items-center gap-1.5 opacity-80">
                                                <span className={`text-[9px] ${msg.isMe ? 'text-black/70' : 'text-gray-500'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                                {msg.isMe && (
                                                    <div className="flex items-center text-black/70">
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline><polyline points="22 10 13.5 18.5 11 16"></polyline></svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 md:p-6 pb-4 md:pb-6 bg-[#0B0F19]/20 border-t border-white/5 relative">
                                <form onSubmit={handleSend} className="flex gap-4 items-center">
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-white transition-all">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={e => {
                                        if (e.target.files?.[0]) {
                                            setPendingFile(e.target.files[0]);
                                            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} className="hidden" />
                                    
                                    <div className="flex-1 relative">
                                        {pendingFile && (
                                            <div className="absolute bottom-full left-0 mb-4 bg-sporthub-card p-2 rounded-2xl border border-sporthub-neon/20 flex items-center gap-3 animate-in fade-in zoom-in shadow-2xl">
                                                <img src={previewUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                                <button type="button" onClick={() => { setPendingFile(null); setPreviewUrl(null); }} className="text-red-400 bg-red-400/10 p-1 rounded-full"><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                        <input 
                                            type="text" 
                                            value={body} 
                                            onChange={e => setBody(e.target.value)} 
                                            placeholder="Escribe un mensaje..." 
                                            className="w-full bg-[#151b28] border border-white/5 rounded-[20px] text-white px-5 py-4 text-sm focus:outline-none focus:border-sporthub-neon/30 transition-all placeholder:text-gray-600 shadow-inner" 
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                                        />
                                    </div>
                                    
                                    <button type="submit" disabled={isUploading} className="bg-sporthub-neon w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_4px_20px_rgba(163,230,53,0.4)] disabled:opacity-50">
                                        <Send className="w-5 h-5 text-black" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <MessageSquare className="w-12 h-12 text-sporthub-neon opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Tus Mensajes</h3>
                            <p className="text-sm text-gray-500 max-w-xs">Selecciona un deportista o reclutador para iniciar una conversación profesional</p>
                        </div>
                    )}
                </div>

                {/* PANEL DE ANALÍTICA (Widget Unificado) */}
                <AnalyticsPanel analytics={analytics} />
            </div>

            {/* MODALES Y OVERLAYS */}
            {fullscreenMedia && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullscreenMedia(null)}>
                    {(() => {
                        const url = fullscreenMedia.toLowerCase();
                        const isVideo = url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') || url.endsWith('.m4v');
                        
                        if (isVideo) {
                            return (
                                <video 
                                    src={getMediaUrl(fullscreenMedia)} 
                                    className="max-h-full max-w-full rounded-2xl shadow-2xl animate-in zoom-in" 
                                    controls 
                                    autoPlay 
                                    onClick={(e) => e.stopPropagation()}
                                />
                            );
                        }
                        
                        return (
                            <img 
                                src={getMediaUrl(fullscreenMedia)} 
                                className="max-h-full max-w-full rounded-2xl shadow-2xl animate-in zoom-in" 
                                alt="" 
                            />
                        );
                    })()}
                    <button className="absolute top-6 right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {confirmModal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0B0F19] p-8 rounded-[32px] border border-white/10 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">¿Confirmar Acción?</h3>
                        <p className="text-gray-400 text-sm mb-8 text-center text-pretty">Esta operación eliminará permanentemente los datos del chat. No se puede deshacer.</p>
                        <div className="flex gap-4">
                            <button onClick={confirmModal.type === 'clear' ? handleClearChat : handleDeleteChat} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl font-bold transition-colors shadow-lg shadow-red-600/20">Eliminar</button>
                            <button onClick={() => setConfirmModal({ show: false, type: '', contact: null })} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl font-bold transition-colors border border-white/5">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
