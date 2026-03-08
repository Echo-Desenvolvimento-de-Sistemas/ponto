import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Lock, Loader2, AlertTriangle, Eye, EyeOff, User, Building2 } from 'lucide-react';
import api from '../api/axios';
import './Login.css';

const SetupColaborador = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid' | 'success'
    const [dadosConvite, setDadosConvite] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const [whitelabel, setWhitelabel] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });

    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await api.get(`/colaborador/setup/${token}`);
                if (response.data.valido) {
                    setDadosConvite(response.data);
                    setStatus('valid');
                }
            } catch (err) {
                setStatus('invalid');
                setErrorMsg(err.response?.data?.message || 'Link inválido ou expirado.');
            }
        };

        if (token) validateToken();

        const fetchWhitelabel = async () => {
            try {
                const response = await api.get('/whitelabel');
                if (response.data) {
                    setWhitelabel(response.data);
                    if (response.data.primaryColor) {
                        document.documentElement.style.setProperty('--primary-color', response.data.primaryColor);
                    }
                }
            } catch (error) { /* ignore */ }
        };
        fetchWhitelabel();
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirmation) {
            alert('As senhas não coincidem!');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post(`/colaborador/setup/${token}`, formData);
            localStorage.setItem('auth_token', response.data.access_token);
            setStatus('success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao concluir o setup.');
            setIsSubmitting(false);
        }
    };

    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';

    if (status === 'loading') {
        return (
            <div className="login-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={48} className="spinner" />
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="login-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="login-card animate-fade-in" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <AlertTriangle color="#ef4444" size={48} />
                    </div>
                    <div className="login-header">
                        <h1 style={{ textAlign: 'center' }}>Link Inválido</h1>
                        <p className="login-subtitle" style={{ textAlign: 'center' }}>{errorMsg}</p>
                    </div>
                    <button onClick={() => navigate('/login')} className="btn btn-black login-btn">
                        Ir para o Login
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="login-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="login-card animate-fade-in" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <CheckCircle2 color="#22c55e" size={56} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Conta Ativada!</h1>
                    <p className="login-subtitle">Sua senha foi definida com sucesso. Redirecionando...</p>
                    <Loader2 size={24} className="spinner" style={{ margin: '1rem auto 0' }} />
                </div>
            </div>
        );
    }

    return (
        <div
            className="login-wrapper"
            style={whitelabel.loginBgUrl ? {
                backgroundImage: `url(${baseUrl}${whitelabel.loginBgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            } : {}}
        >
            <div className="login-content">
                <div className="login-card animate-fade-in">
                    <div className="login-header">
                        {whitelabel.logoUrl ? (
                            <img
                                src={`${baseUrl}${whitelabel.logoUrl}`}
                                alt={whitelabel.systemName}
                                style={{ maxHeight: '40px', marginBottom: '1.25rem' }}
                            />
                        ) : (
                            <h1 style={{ marginBottom: '0.75rem' }}>{whitelabel.systemName}</h1>
                        )}
                        <h1 style={{ fontSize: '1.5rem' }}>Ative sua Conta</h1>
                        <p className="login-subtitle">
                            Seu acesso foi pré-cadastrado. Escolha uma senha para entrar no sistema.
                        </p>
                    </div>

                    {/* Dados do colaborador (somente leitura) */}
                    <div style={{ background: 'var(--surface-color-light)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <User size={16} />
                            <span style={{ fontWeight: 600 }}>{dadosConvite?.user?.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>({dadosConvite?.user?.email})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <Building2 size={14} />
                            <span>{dadosConvite?.empresa}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Crie uma Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="Mínimo 8 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={8}
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

                        <div className="form-group">
                            <label className="form-label">Confirme a Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswordConfirm ? 'text' : 'password'}
                                    name="password_confirmation"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                >
                                    {showPasswordConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-black login-btn"
                            style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isSubmitting ? (
                                <Loader2 className="spinner" size={20} />
                            ) : (
                                <>Ativar Conta <CheckCircle2 size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>Ao ativar sua conta, você concorda com os </span>
                        <Link to="/privacidade">Termos de Uso e Privacidade</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupColaborador;
