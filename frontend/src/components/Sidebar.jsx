import React, { useEffect } from 'react';
import { Home, Search, Users, MessageSquare, BarChart2, User, Bookmark, Bell, LogOut, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';
import clsx from 'clsx';

const SidebarItem = ({ icon: Icon, label, to, badgeCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) => clsx(
      "flex items-center w-full px-4 py-3 mb-2 rounded-xl transition-all duration-300 relative",
      isActive
        ? "bg-sporthub-neon/10 text-sporthub-neon font-semibold"
        : "text-sporthub-muted hover:bg-sporthub-card-hover hover:text-white"
    )}
  >
    <div className="relative">
      <Icon className="w-5 h-5 mr-4" />
      {badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </div>
    <span>{label}</span>
  </NavLink>
);

export const Sidebar = () => {
  const { user, logout, unreadCount, socialCount, setUser } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !user?.id) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Obtenemos tu ID de forma segura (para MongoDB)
      const myId = typeof user.id === 'object' ? user.id.$oid : String(user.id);

      // Si detectamos un nuevo post y el autor eres TÚ
      if (
        message.data?.type === 'feed_update' &&
        String(message.data?.author_id) === String(myId)
      ) {
        console.log("Sincronizando contador de posts localmente...");

        if (typeof setUser === 'function') {
          setUser(prev => ({
            ...prev,
            posts_count: (prev.posts_count || 0) + 1
          }));
        } else {
          console.warn("⚠️ setUser no está disponible en el AuthContext");
        }
      }
    };

    socket.onerror = (err) => console.error("Error WebSocket Sidebar:", err);

    return () => socket.close();
  }, [user?.id, setUser]);

  return (
    <aside className="hidden lg:flex w-64 bg-sporthub-bg border-r border-sporthub-border h-screen flex-col pt-6 fixed left-0 top-0 z-40 shrink-0">
      <div className="px-6 mb-8 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sporthub-neon tracking-tight">SportHub</h1>
          <div className="flex items-center px-2 py-1 rounded-full bg-sporthub-card border border-sporthub-border">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
            <span className="text-[10px] text-gray-400 font-medium">En vivo</span>
          </div>
        </div>
        <p className="text-[10px] text-sporthub-muted">Red Profesional Deportiva</p>
      </div>

      <div className="px-6 mb-8">
        <div className="flex flex-col items-center text-center p-4 bg-sporthub-card rounded-2xl border border-sporthub-border">
          <div className="relative">
            <img
              src={getMediaUrl(user?.avatar_url)}
              className="w-16 h-16 rounded-full border-2 border-sporthub-neon mb-3 object-cover bg-[#151b28]"
              alt="Profile"
              onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
            />
            <span className="absolute -bottom-1 -right-2 bg-sporthub-cyan text-black text-[8px] uppercase font-black px-2 py-0.5 rounded-full border border-sporthub-card tracking-tighter shadow-lg">
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'athlete' ? 'Deportista' : 'Usuario'}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{user?.name || "Cargando..."}</h3>
          <p className="text-[10px] text-sporthub-muted mb-4">{user?.email}</p>

          <div className="flex justify-between w-full px-2">
            <div className="flex flex-col text-center">
              <span className="text-sporthub-neon font-bold text-sm">{user?.followers_count || 0}</span>
              <span className="text-[9px] text-sporthub-muted">Seguidores</span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-sporthub-cyan font-bold text-sm">{user?.following_count || 0}</span>
              <span className="text-[9px] text-sporthub-muted">Siguiendo</span>
            </div>
            <div className="flex flex-col text-center">
              {/* El valor 'user.posts_count' ahora sube solo */}
              <span className="text-white font-bold text-sm">{user?.posts_count || 0}</span>
              <span className="text-[9px] text-sporthub-muted">Posts</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        <SidebarItem icon={Home} label="Feed" to="/feed" />
        <SidebarItem icon={BarChart2} label="Analítica" to="/dashboard" />
        <SidebarItem icon={User} label="Perfil" to="/profile" />
        <SidebarItem icon={Search} label="Buscar" to="/search" />
        <SidebarItem icon={Users} label="Red" to="/network" />
        <SidebarItem icon={MessageSquare} label="Mensajes" to="/messages" badgeCount={unreadCount} />
        <SidebarItem icon={Bookmark} label="Guardados" to="/saved" />
        <SidebarItem icon={Bell} label="Notificaciones" to="/notifications" badgeCount={socialCount} />
        <SidebarItem icon={Settings} label="Configuración" to="/settings" />

        <div className="mt-8">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 mb-2 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-400/10 hover:text-red-300">
            <LogOut className="w-5 h-5 mr-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};