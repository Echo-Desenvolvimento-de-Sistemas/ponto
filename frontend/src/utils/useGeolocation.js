import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        let watchId;
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation({
                latitude: null,
                longitude: null,
                error: 'Geolocalização não é suportada pelo seu navegador.',
                loading: false
            });
            return;
        }

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    loading: false
                });
            },
            (error) => {
                let errorMessage = 'Não foi possível obter a sua localização.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permissão para acessar a localização foi negada.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'As informações de localização não estão disponíveis.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'A requisição para obter a localização expirou.';
                        break;
                    default:
                        break;
                }
                setLocation({
                    latitude: null,
                    longitude: null,
                    error: errorMessage,
                    loading: false
                });
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0
            }
        );

        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, []);

    const forceReload = () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));
        // This slight delay gives visual feedback to the user that it is reloading
        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        error: null,
                        loading: false
                    });
                },
                (error) => {
                    setLocation(prev => ({ ...prev, loading: false }));
                },
                { enableHighAccuracy: true }
            );
        }, 800);
    };

    return { ...location, forceReload };
};
