import React from 'react';
import { MoreVertical, Check, X, TrendingUp } from 'lucide-react';

const ChatOptionsMenu = ({ 
    chat, 
    onMarkAsUnread, 
    onClearChat, 
    onDeleteChat, 
    isOpen, 
    onToggle, 
    variant = 'sidebar' 
}) => {
    if (!chat) return null;

    return (
        <div className="relative ml-auto shrink-0 self-center">
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onToggle(); 
                }}
                className={`p-3 lg:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all ${
                    isOpen ? 'bg-white/10 text-white' : 'opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100'
                }`}
                aria-label="Opciones de chat"
            >
                <MoreVertical className={variant === 'header' ? 'w-5 h-5' : 'w-5 h-5 lg:w-4 lg:h-4'} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[9998] bg-black/5 lg:bg-transparent" 
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            onToggle(); 
                        }} 
                    />
                    <div className={`absolute right-4 ${variant === 'header' ? 'top-full mt-2' : 'top-1/2 -translate-y-1/2 mt-8'} w-52 bg-[#1a2130] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[9999] py-2 overflow-hidden animate-in fade-in zoom-in duration-200`}>
                        {variant === 'sidebar' && onMarkAsUnread && (
                            <>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onMarkAsUnread(chat.contactId);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors active:bg-white/20"
                                >
                                    <Check className="w-4 h-4 text-sporthub-neon" />
                                    Marcar como no leído
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                            </>
                        )}
                        
                        <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                onClearChat(chat); 
                            }}
                            className="w-full text-left px-4 py-3 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors active:bg-red-500/20"
                        >
                            <TrendingUp className="w-4 h-4 rotate-90" />
                            Vaciar chat
                        </button>
                        
                        <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                onDeleteChat(chat); 
                            }}
                            className="w-full text-left px-4 py-3 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors font-bold active:bg-red-500/20"
                        >
                            <X className="w-4 h-4" />
                            Eliminar chat
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatOptionsMenu;
