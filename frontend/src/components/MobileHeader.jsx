import React from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';

export const MobileHeader = () => {
    const { socialCount, user } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const isFeed = location.pathname === '/feed';
    const activeFilter = searchParams.get('post_type') || '';
    const avatarUrl = getMediaUrl(user?.avatar_url);

    const handleFilterChange = (val) => {
        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set('post_type', val);
        } else {
            params.delete('post_type');
        }
        setSearchParams(params);
    };

    return (
        <header className="lg:hidden flex items-center justify-between px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-sporthub-bg border-b border-sporthub-border fixed top-0 left-0 right-0 w-full z-50">
            <div className="flex items-center gap-3">
                <span className="text-xl font-black text-sporthub-neon tracking-tighter uppercase italic">SportHub</span>
                
                {isFeed && (
                    <div className="flex items-center bg-[#0B0F19] p-0.5 rounded-[10px] border border-white/10 shadow-inner scale-[0.85] origin-left">
                        <button 
                            onClick={() => handleFilterChange('')}
                            className={`px-3 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-widest transition-all ${!activeFilter ? 'bg-sporthub-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => handleFilterChange('service')}
                            className={`px-3 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-widest transition-all ${activeFilter === 'service' ? 'bg-sporthub-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Servicios
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-6 h-6" />
                    {socialCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            {socialCount > 9 ? '9+' : socialCount}
                        </span>
                    )}
                </Link>
                
                <Link to="/profile" className="ml-1">
                    <div className="w-9 h-9 rounded-full border-2 border-[rgba(163,230,53,0.3)] p-0.5 overflow-hidden active:scale-95 transition-transform">
                        <img 
                            src={avatarUrl} 
                            className="w-full h-full rounded-full object-cover" 
                            alt="Mi Perfil" 
                        />
                    </div>
                </Link>
            </div>
        </header>
    );
};
