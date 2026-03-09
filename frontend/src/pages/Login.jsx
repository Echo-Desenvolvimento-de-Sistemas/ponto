import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Eye, EyeOff, Mail, CreditCard, AlarmClockPlus } from 'lucide-react';
import api from '../api/axios';
import FloatingIconsLoader from '../components/ui/FloatingIconsLoader';
import usePageTitle from '../utils/usePageTitle';
import './Login.css';

// Formata CPF: 000.000.000-00
const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const isCpfMode = (value) => {
    // Se não tem @ e tem apenas números e formatação de CPF
    return !value.includes('@') && /^[\d.\-]*$/.test(value);
};

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [wlLoading, setWlLoading] = useState(true);

    // Estados para mudança de senha forçada
    const [showForceChange, setShowForceChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [tempToken, setTempToken] = useState('');

    const [whitelabel, setWhitelabel] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    usePageTitle('Entrar');

    const cpfMode = isCpfMode(identifier);

    useEffect(() => {
        const fetchWhitelabel = async () => {
            try {
                const response = await api.get('/whitelabel');
                if (response.data) {
                    setWhitelabel(response.data);
                    if (response.data.primaryColor) {
                        document.documentElement.style.setProperty('--primary-color', response.data.primaryColor);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar configurações white label:', error);
            } finally {
                setWlLoading(false);
            }
        };
        fetchWhitelabel();
    }, []);

    if (wlLoading) {
        return (
            <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                <FloatingIconsLoader Icon={AlarmClockPlus} size={60} count={3} />
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Carregando...</span>
            </div>
        );
    }

    const handleIdentifierChange = (e) => {
        const raw = e.target.value;
        if (isCpfMode(raw)) {
            setIdentifier(formatCpf(raw));
        } else {
            setIdentifier(raw);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/login', { login: identifier, password });
            const { access_token, user } = response.data;
            if (access_token && user) {
                await login(identifier, password); // Usa a função do contexto para garantir estado consistente
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.require_password_change) {
                setTempToken(err.response.data.access_token);
                setShowForceChange(true);
            } else {
                setError(err.response?.data?.message || 'Erro ao realizar login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceChangeSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== newPasswordConfirm) {
            return setError('As senhas não coincidem.');
        }

        setIsLoading(true);

        try {
            const response = await api.post('/change-password-forced', {
                current_password: password,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirm
            }, {
                headers: { 'Authorization': `Bearer ${tempToken}` }
            });

            const { access_token, user } = response.data;
            if (access_token && user) {
                localStorage.setItem('token', access_token);
                // Como login() do context já faz o setUser, vamos apenas forçar o estado local se necessário
                // ou melhor, chamar o login novamente ou setar o token e navegar
                navigate('/dashboard');
                window.location.reload(); // Força recarregamento apenas aqui se necessário para limpar estados residuais do modal
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao redefinir a senha.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="login-wrapper"
            style={whitelabel.loginBgUrl ? {
                backgroundImage: `url(${whitelabel.loginBgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            } : {}}
        >
            <div className="login-content">
                <div className="login-card animate-fade-in">
                    <div className="login-header flex flex-col items-start">
                        {whitelabel.logoUrl ? (
                            <img
                                src={whitelabel.logoUrl}
                                alt={`Logo ${whitelabel.systemName}`}
                                className="mb-5 object-contain"
                                style={{ maxHeight: '48px', maxWidth: '100%' }}
                            />
                        ) : (
                            <h1 className="text-2xl font-bold mb-4">{whitelabel.systemName}</h1>
                        )}
                        <h1>Bem-vindo de volta</h1>
                        <p className="login-subtitle">Entre com seu e-mail ou CPF</p>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="identifier">
                                {cpfMode && identifier.length > 0 ? 'CPF' : 'E-mail ou CPF'}
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type="text"
                                    id="identifier"
                                    className="form-input"
                                    placeholder="seu@email.com ou 000.000.000-00"
                                    value={identifier}
                                    onChange={handleIdentifierChange}
                                    autoComplete="username"
                                    required
                                    style={{ paddingRight: '3rem' }}
                                />
                                <span className="toggle-password" style={{ pointerEvents: 'none', opacity: 0.45 }}>
                                    {cpfMode && identifier.length > 0
                                        ? <CreditCard size={18} />
                                        : <Mail size={18} />
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                Lembrar-me
                            </label>
                            <Link to="/esqueci-senha" className="forgot-password">Esqueceu a senha?</Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-black login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="spinner" size={20} />
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>Não tem uma conta?</span>
                        <a href="#">Contate o RH</a>
                        <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                            <Link to="/privacidade" style={{ color: '#9ca3af', fontWeight: 500 }}>Política de Privacidade</Link>
                        </span>
                    </div>
                </div>

                {/* Modal de Mudança de Senha Forçada */}
                {showForceChange && createPortal(
                    <div className="force-password-modal-overlay">
                        <div className="force-password-modal-content">
                            <h2 className="force-password-modal-title">Redefinição Obrigatória</h2>
                            <p className="force-password-modal-text">
                                Sua senha foi redefinida pelo RH. Você precisa criar uma nova senha pessoal para continuar.
                            </p>

                            {error && (
                                <div className="force-password-modal-error">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleForceChangeSubmit}>
                                <div className="force-password-modal-form-group">
                                    <label className="force-password-modal-label">Nova Senha</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Mínimo de 6 caracteres"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength="6"
                                    />
                                </div>
                                <div className="force-password-modal-form-group-large">
                                    <label className="force-password-modal-label">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Repita a nova senha"
                                        value={newPasswordConfirm}
                                        onChange={e => setNewPasswordConfirm(e.target.value)}
                                        required
                                        minLength="6"
                                    />
                                </div>
                                <div className="force-password-modal-actions">
                                    <button
                                        type="button"
                                        className="force-password-modal-btn force-password-modal-btn-secondary"
                                        onClick={() => window.location.reload()}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="force-password-modal-btn force-password-modal-btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 size={18} className="spinner" /> : 'Salvar Nova Senha'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>, document.body
                )}
            </div>
        </div>
    );
};

export default Login;
