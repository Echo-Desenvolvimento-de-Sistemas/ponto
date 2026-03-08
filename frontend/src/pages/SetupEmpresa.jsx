import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Fingerprint, CheckCircle2, User, Mail, Lock, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const SetupEmpresa = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    // Status can be: 'loading', 'valid', 'invalid', 'success'
    const [status, setStatus] = useState('loading');
    const [empresa, setEmpresa] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // Whitelabel support
    const [whitelabel, setWhitelabel] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await api.get(`/convites/${token}/validar`);
                if (response.data.valido) {
                    setEmpresa(response.data.empresa);
                    setStatus('valid');
                }
            } catch (err) {
                setStatus('invalid');
                setErrorMsg(err.response?.data?.message || 'Link inválido ou expirado.');
            }
        };

        if (token) {
            validateToken();
        }

        // Fetch whitelabel configs
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
            }
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
            const response = await api.post(`/convites/${token}/aceitar`, formData);

            // Save token globally if we are reusing the login mechanism
            localStorage.setItem('auth_token', response.data.access_token);
            // Quick force refresh context or redirect to login. Doing manual auth inject here:
            window.location.href = '/dashboard'; // simplest way to reload AuthContext with the new token
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
                        <h1 style={{ textAlign: 'center' }}>Acesso Negado</h1>
                        <p className="login-subtitle" style={{ textAlign: 'center' }}>{errorMsg}</p>
                    </div>
                    <button onClick={() => navigate('/login')} className="btn btn-black login-btn">
                        Voltar para o Login
                    </button>
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
                backgroundRepeat: 'no-repeat'
            } : {}}
        >
            <div className="login-content">
                <div className="login-card animate-fade-in">
                    <div className="login-header flex flex-col items-start" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {whitelabel.logoUrl ? (
                            <img
                                src={`${baseUrl}${whitelabel.logoUrl}`}
                                alt={`Logo ${whitelabel.systemName}`}
                                className="mb-5 object-contain"
                                style={{ maxHeight: '48px', maxWidth: '100%', marginBottom: '1.25rem' }}
                            />
                        ) : (
                            <h1 style={{ marginBottom: '1rem' }}>{whitelabel.systemName}</h1>
                        )}
                        <h1 style={{ fontSize: '1.6rem' }}>Configure seu Acesso</h1>
                        <p className="login-subtitle">
                            Bem-vindo(a) à <strong>{empresa?.nome_fantasia}</strong>.<br />
                            Crie sua conta de Admin.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Nome Completo</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="João da Silva"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">E-mail Corporativo</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="joao@empresa.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Senha Forte</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
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
                                    type={showPasswordConfirm ? "text" : "password"}
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
                                <>Acessar Plataforma <CheckCircle2 size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>Ao se registrar, você concorda com nossos</span>
                        <br />
                        <Link to="/privacidade">Termos de Serviço</Link> e <Link to="/privacidade">Políticas de Privacidade</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupEmpresa;
