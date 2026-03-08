import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { fixBackendUrl } from '../utils/urlUtils';

const WhitelabelContext = createContext({
    systemName: 'PontoNow',
    primaryColor: '#d19bf7',
    logoUrl: null,
    loginBgUrl: null,
    baseUrl: 'http://localhost:8000',
    loading: true,
    refresh: () => { },
});

export const WhitelabelProvider = ({ children }) => {
    const { user } = useAuth();
    const [config, setConfig] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });
    const [loading, setLoading] = useState(true);

    const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:8000';

    const fetchConfig = async () => {
        try {
            const res = await api.get('/whitelabel');
            if (res.data) {
                const normalizedData = {
                    ...res.data,
                    logoUrl: fixBackendUrl(res.data.logoUrl),
                    loginBgUrl: fixBackendUrl(res.data.loginBgUrl)
                };
                setConfig(normalizedData);
                if (res.data.primaryColor) {
                    document.documentElement.style.setProperty('--primary-color', res.data.primaryColor);
                }
            }
        } catch (e) { /* silently ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchConfig();
    }, [user?.empresa_id, user?.id]);

    return (
        <WhitelabelContext.Provider value={{ ...config, baseUrl, loading, refresh: fetchConfig }}>
            {children}
        </WhitelabelContext.Provider>
    );
};

export const useWhitelabel = () => useContext(WhitelabelContext);
