import React from 'react';
import { LogOut } from 'lucide-react';

export const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-sporthub-card border border-sporthub-border w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-sporthub-neon/10 flex items-center justify-center text-sporthub-neon">
                        <LogOut className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">¿Cerrar sesión?</h3>
                    <p className="text-sm text-sporthub-muted">Tendrás que volver a ingresar tus credenciales para acceder a SportHub.</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg text-sm uppercase"
                    >
                        SÍ, CERRAR SESIÓN
                    </button>
                    <button 
                        onClick={onCancel}
                        className="w-full bg-transparent text-white font-bold py-3 hover:bg-white/5 rounded-2xl transition-all text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
