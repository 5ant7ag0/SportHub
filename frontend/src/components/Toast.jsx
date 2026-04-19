import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const Toast = ({ message, type = 'success' }) => {
    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
            <div className={`px-8 py-3.5 rounded-full border backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-3 transition-all ${
                type === 'success' 
                ? 'bg-sporthub-card/90 border-sporthub-neon/30 text-sporthub-neon shadow-sporthub-neon/10' 
                : 'bg-sporthub-card/90 border-red-500/30 text-red-400 shadow-red-500/10'
            }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${type === 'success' ? 'bg-sporthub-neon' : 'bg-red-500'}`} />
                <span className="text-xs font-black uppercase tracking-[0.1em] whitespace-nowrap">
                    {message}
                </span>
            </div>
        </div>
    );
};
