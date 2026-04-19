import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Loader2 } from 'lucide-react';

export const Login = () => {
    // Autocompletado inteligentemente para los tests del seed
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        try {
            const { data } = await api.post('/auth/token/obtain/', { email, password });
            await login(data.access);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || "Credenciales inválidas o error de conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sporthub-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-sporthub-card p-10 rounded-3xl border border-sporthub-border shadow-2xl">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
                        <h1 className="text-4xl font-bold text-sporthub-neon mb-2 tracking-tight">SportHub</h1>
                    </Link>
                    <p className="text-sporthub-muted text-sm">Inicio de Sesión Profesional</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-sporthub-muted mb-2">Correo Electrónico</label>
                        <input 
                            type="email" 
                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sporthub-muted mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full bg-[#0B0F19] border border-sporthub-border text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sporthub-neon focus:ring-1 focus:ring-sporthub-neon transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs text-center border border-red-400/20 bg-red-400/10 p-2 rounded-lg">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-sporthub-neon text-black font-bold py-3.5 rounded-xl hover:bg-lime-400 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:shadow-[0_0_25px_rgba(163,230,53,0.5)]"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Acceder"}
                    </button>
                    
                    <p className="text-center text-xs text-sporthub-muted mt-6">
                        ¿No tienes una cuenta? <Link to="/register" className="text-sporthub-cyan font-bold hover:underline transition-colors tracking-wide">Registrarse</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
