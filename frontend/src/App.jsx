import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { Network } from './pages/Network';
import Messages from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Placeholder } from './pages/Placeholder';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';

// Layout wrapper for authenticated routes that require the Sidebar
const DashboardLayout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isMessages = location.pathname === '/messages';
  const isChatActive = !!searchParams.get('contactId');

  // En modo mensajes o chat activo, forzamos un viewport fijo (estilo app nativa)
  if (isMessages || isChatActive) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-sporthub-bg font-outfit fixed inset-0 w-full">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar aria-hidden={true} />
          <main className="flex-1 flex flex-col h-full overflow-hidden w-full max-w-[100vw] lg:ml-72">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  // En modo normal (Feed, Perfil, etc), dejamos que la página fluya libremente
  return (
    <div className="min-h-screen bg-sporthub-bg font-outfit relative">
      <MobileHeader />
      <div className="lg:flex">
        <Sidebar aria-hidden={false} />
        {/* En PC ml-64 (ancho sidebar), en móvil pt-24 (alto header) */}
        <main className="flex-1 w-full max-w-[100vw] relative lg:ml-72 pt-24 lg:pt-0 pb-32 lg:pb-0 px-0 md:px-4">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

function AppContent() {
  const { loading, user } = useAuth();
  
  // DESBLOQUEADOR UNIVERSAL: Limpia bloqueos de scroll residuales (modales, etc) al cambiar de página
  useEffect(() => {
    // Aseguramos que al navegar, el body recupere su flujo a menos que se fuerce lo contrario
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-sporthub-bg overflow-x-hidden">
      {/* Banner de Carga */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-sporthub-neon/20 overflow-hidden">
          <div className="h-full bg-sporthub-neon animate-pulse" style={{ width: '100%' }}></div>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={loading ? null : (user ? <Navigate to="/feed" replace /> : <Landing />)} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><DashboardLayout><AnalyticsDashboard /></DashboardLayout></ProtectedRoute>} 
          />
          <Route 
            path="/feed" 
            element={<ProtectedRoute><DashboardLayout><Feed /></DashboardLayout></ProtectedRoute>} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} 
          />
          
          <Route path="/search" element={<ProtectedRoute><DashboardLayout><Search /></DashboardLayout></ProtectedRoute>} />
          <Route path="/network" element={<ProtectedRoute><DashboardLayout><Network /></DashboardLayout></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><DashboardLayout><Messages /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><DashboardLayout><Placeholder title="Elementos Guardados" /></DashboardLayout></ProtectedRoute>} />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
