import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed or prompt dismissed
        const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isDismissed || isStandalone) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a short delay for better UX
            setTimeout(() => setIsVisible(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, we show the prompt regardless of the event because it doesn't support it
        if (isIOSDevice) {
            setTimeout(() => setIsVisible(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt && !isIOS) return;

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
            }
            setDeferredPrompt(null);
        }
    };

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="pwa-prompt-container animate-slide-up">
            <div className="pwa-prompt-card glass-card">
                <button className="pwa-close" onClick={dismiss}>
                    <X size={18} />
                </button>

                <div className="pwa-content">
                    <div className="pwa-icon-wrapper">
                        <Smartphone className="pwa-main-icon" size={32} />
                        <div className="pwa-badge-mini">
                            <Download size={12} />
                        </div>
                    </div>

                    <div className="pwa-text">
                        <h3>PontoNow no seu Celular</h3>
                        <p>
                            {isIOS
                                ? 'Toque em compartilhar e "Adicionar à Tela de Início" para usar como App.'
                                : 'Instale nosso aplicativo para registrar o ponto com mais agilidade e offline.'}
                        </p>
                    </div>
                </div>

                <div className="pwa-actions">
                    {isIOS ? (
                        <div className="ios-instruction">
                            <Share size={20} className="text-primary-color" />
                            <span>Siga as instruções do Safari</span>
                        </div>
                    ) : (
                        <button className="btn btn-primary w-full" onClick={handleInstall}>
                            Instalar Aplicativo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
