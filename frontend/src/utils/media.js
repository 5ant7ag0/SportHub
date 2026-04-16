/**
 * Resolvedor de URLs de Medios para SportHub.
 * Asegura que todas las imágenes y videos apunten al backend (Puerto 8000)
 * si no son ya URLs absolutas (como Cloudinary).
 */
export const getMediaUrl = (path) => {
    // Manejo de nulos, undefined y la cadena "None" que a veces viene de MongoEngine
    if (!path || path === "None" || path === "" || typeof path !== 'string') {
        return "/test_media/sample_atleta.svg";
    }
    
    // Si ya es una URL absoluta (http:// o https://) o un protocolo local (blob: o data:) no tocamos nada
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }
    
    // Detección Dinámica del Backend
    const backendHost = window.location.hostname;
    const backendUrl = `http://${backendHost}:8000`;
    
    // Normalizar path: Asegurar que si es una ruta local, empiece con /media/
    // Si ya empieza con /media/, lo usamos. Si no, pero se asume que es media, lo corregimos.
    let normalizedPath = path;
    if (!path.startsWith('/') && !path.startsWith('http')) {
        // Si no empieza con slash, probablemente le falte /media/ o el / inicial
        if (!path.startsWith('media/')) {
            normalizedPath = `/media/${path}`;
        } else {
            normalizedPath = `/${path}`;
        }
    } else if (path.startsWith('media/')) {
        normalizedPath = `/${path}`;
    }
    
    // Retornar URL completa
    return `${backendUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

/**
 * Detecta si una URL o ruta de archivo corresponde a un video.
 * Implementación robusta que ignora query params y es insensible a mayúsculas.
 */
export const isVideo = (path) => {
    if (!path || path === "None" || path === "" || typeof path !== 'string') return false;
    
    // 1. Detección por Cloudinary / URL Signature
    if (path.includes('/video/upload/') || path.includes('/video/')) return true;
    
    // 2. Limpiar la URL de parámetros de consulta para la detección por extensión
    // Ejemplo: video.mp4?t=123 -> video.mp4
    const cleanPath = path.split('?')[0].split('#')[0].toLowerCase();
    
    // 3. Extensiones soportadas
    const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.m4v', '.3gp'];
    return videoExtensions.some(ext => cleanPath.endsWith(ext));
};
