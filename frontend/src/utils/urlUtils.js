/**
 * Corrige URLs vindas do backend que podem conter "localhost" ou caminhos relativos.
 * Útil para ambientes Ngrok/Mobile onde localhost refere-se ao próprio dispositivo.
 */
export const fixBackendUrl = (url) => {
    if (!url) return null;

    const { hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // Se estiver em local, as URLs geradas pelo Laravel (localhost:8000) já devem funcionar.
    // O problema acontece se o banco tiver URLs antigas de Ngrok ou se estivermos em Mobile.

    // Se for um caminho relativo (/storage/...), prefixa com a URL do backend
    if (url.startsWith('/')) {
        const backendBase = isLocal ? 'http://localhost:8000' : window.location.origin;
        return `${backendBase}${url}`;
    }

    // Se a URL contém um ngrok antigo e estamos localmente, troca por localhost
    if (isLocal && url.includes('ngrok-free.app')) {
        return url.replace(/https:\/\/[^/]+/g, 'http://localhost:8000');
    }

    return url;
};
