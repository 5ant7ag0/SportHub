import React, { useState, useRef } from 'react';
import { api } from '../api';
import { Loader2, Image as ImageIcon, X, Tag, DollarSign, Type } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

/**
 * Componente unificado para la creación de posts.
 * Utilizado en Feed y Perfil.
 * 
 * @param {Object} authUser - Usuario autenticado actual
 * @param {Function} onPostCreated - Callback ejecutado tras crear un post exitosamente
 */
export const CreatePostBox = ({ authUser, onPostCreated }) => {
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostFile, setNewPostFile] = useState(null);
    const [newPostPreview, setNewPostPreview] = useState(null);
    const [postType, setPostType] = useState('post'); // 'post' | 'service'
    const [serviceTitle, setServiceTitle] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPostFile(file);
            setNewPostPreview(URL.createObjectURL(file));
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !newPostFile) return;
        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('content', newPostContent);
            formData.append('post_type', postType);
            if (postType === 'service') {
                formData.append('service_title', serviceTitle);
                formData.append('service_price', servicePrice);
            }
            if (newPostFile) {
                formData.append('file', newPostFile);
            }
            
            await api.post('/posts/create/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setNewPostContent('');
            setServiceTitle('');
            setServicePrice('');
            setPostType('post');
            setNewPostFile(null);
            setNewPostPreview(null);
            if (onPostCreated) onPostCreated();
        } catch (error) {
            console.error("Error creando post:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-4 bg-sporthub-card rounded-2xl border border-sporthub-border shadow-lg">
            {/* Selector de Tipo de Post */}
            <div className="flex gap-2 mb-4 p-1 bg-[#0B0F19] rounded-xl w-fit">
                <button 
                    onClick={() => setPostType('post')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${postType === 'post' ? 'bg-sporthub-card text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Type className="w-3.5 h-3.5" /> Post Normal
                </button>
                <button 
                    onClick={() => setPostType('service')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${postType === 'service' ? 'bg-sporthub-neon text-black shadow-lg shadow-sporthub-neon/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Tag className="w-3.5 h-3.5" /> Ofrecer Servicio
                </button>
            </div>

            <div className="flex gap-4">
                <img 
                    src={getMediaUrl(authUser?.avatar_url)} 
                    className="w-10 h-10 rounded-full object-cover bg-[#0B0F19]" 
                    alt="Me" 
                    onError={(e) => { e.target.src = "/test_media/sample_atleta.svg" }}
                />
                <div className="flex-1 flex flex-col gap-3">
                    {postType === 'service' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative group">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-sporthub-neon transition-colors" />
                                <input 
                                    type="text"
                                    value={serviceTitle}
                                    onChange={(e) => setServiceTitle(e.target.value)}
                                    placeholder="Título del Servicio (Ej: Clase de Tenis)"
                                    className="w-full bg-[#0B0F19] border border-sporthub-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-sporthub-neon outline-none transition-all"
                                />
                            </div>
                            <div className="relative group">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-sporthub-neon transition-colors" />
                                <input 
                                    type="number"
                                    value={servicePrice}
                                    onChange={(e) => setServicePrice(e.target.value)}
                                    placeholder="Precio (Ej: 25)"
                                    className="w-full bg-[#0B0F19] border border-sporthub-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-sporthub-neon outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <textarea 
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder={postType === 'service' ? "Describe tu servicio: beneficios, horarios, requisitos..." : "¿Qué analizaste de tu entrenamiento hoy?"}
                        className="bg-transparent border-none focus:ring-0 text-white text-sm w-full outline-none resize-none min-h-[60px]"
                        rows={2}
                    />
                    {newPostPreview && (
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-sporthub-border group bg-black/20 flex items-center justify-center">
                            {newPostFile?.type?.startsWith('video/') ? (
                                <video 
                                    src={newPostPreview} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    playsInline 
                                    onMouseOver={(e) => e.target.play()}
                                    onMouseOut={(e) => e.target.pause()}
                                />
                            ) : (
                                <img 
                                    src={newPostPreview} 
                                    className="w-full h-full object-cover" 
                                    alt="Preview" 
                                />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 p-2 rounded-full">
                                    <X 
                                        className="w-5 h-5 text-white pointer-events-auto cursor-pointer" 
                                        onClick={() => { 
                                            setNewPostFile(null); 
                                            setNewPostPreview(null); 
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-sporthub-border">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,video/*" 
                />
                <button 
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 text-sporthub-cyan text-sm hover:bg-sporthub-cyan/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                    <ImageIcon className="w-4 h-4" /> Adjuntar Foto/Video
                </button>
                <button 
                    onClick={handleCreatePost}
                    disabled={isCreating || (!newPostContent.trim() && !newPostFile)}
                    className="bg-sporthub-neon text-black text-sm font-bold px-5 py-1.5 rounded-lg active:scale-95 transition-transform hover:shadow-[0_0_15px_rgba(163,230,53,0.4)] disabled:opacity-50"
                >
                    {isCreating ? 'Publicando...' : 'Publicar'}
                </button>
            </div>
        </div>
    );
};
