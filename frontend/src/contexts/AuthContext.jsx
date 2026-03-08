import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { requestNotificationPermission, subscribeUserToPush } from '../utils/pushNotifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/user');
                    setUser(response.data);
                    // Tenta ativar notificações silenciosamente se já tiver permissão
                    if (Notification.permission === 'granted') {
                        subscribeUserToPush();
                    }
                } catch (error) {
                    console.error("Token invalid or expired", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await api.post('/login', { login: identifier, password });
            setUser(response.data.user);
            localStorage.setItem('token', response.data.access_token);

            // Solicita permissão e subscreve após login
            setTimeout(async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                    await subscribeUserToPush();
                }
            }, 1000);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao realizar login.'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
