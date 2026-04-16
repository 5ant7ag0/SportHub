import React from 'react';
import { Construction } from 'lucide-react';

export const Placeholder = ({ title }) => {
    return (
        <main className="flex-1 p-8 flex flex-col items-center justify-center bg-sporthub-bg min-h-screen">
            <div className="flex flex-col items-center gap-6 p-12 bg-sporthub-card rounded-3xl border border-sporthub-border text-center max-w-lg shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-sporthub-neon/10 flex items-center justify-center">
                    <Construction className="w-10 h-10 text-sporthub-neon" />
                </div>
                <h2 className="text-2xl font-bold text-white">Próximamente: {title}</h2>
                <p className="text-sm text-sporthub-muted leading-relaxed">
                    Este módulo está en fase de desarrollo. Pronto desplegaremos nuevas funcionalidades para potenciar tu experiencia en la red profesional.
                </p>
                <button 
                  onClick={() => window.history.back()}
                  className="mt-4 bg-transparent border border-sporthub-cyan text-sporthub-cyan px-6 py-2 rounded-xl hover:bg-sporthub-cyan/10 transition-colors"
                >
                    Volver Atrás
                </button>
            </div>
        </main>
    );
};
