import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import './EsqueciSenha.css';

const EsqueciSenha = () => {
    const [step, setStep] = useState('select'); // 'select' | 'funcionario' | 'empresa' | 'success'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [whitelabel, setWhitelabel] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });

    const [formData, setFormData] = useState({
        email: '',
        nome_empresa: '',
        mensagem: '',
    });

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
            } catch (err) {
                console.error('Erro ao buscar configurações white label:', err);
            }
        };
        fetchWhitelabel();
    }, []);

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/password-reset-ticket', formData);
            setStep('success');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao enviar solicitação. Tente novamente.');
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
                <div className="login-card animate-fade-in" style={{ maxWidth: '480px' }}>

                    {/* Header */}
                    <div className="esqueci-header">
                        {whitelabel.logoUrl ? (
                            <img
                                src={whitelabel.logoUrl}
                                alt={`Logo ${whitelabel.systemName}`}
                                className="mb-4 object-contain"
                                style={{ maxHeight: '40px', maxWidth: '100%' }}
                            />
                        ) : (
                            <h1 className="text-xl font-bold mb-2">{whitelabel.systemName}</h1>
                        )}
                    </div>

                    {/* Step: Select Role */}
                    {step === 'select' && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-1">Recuperação de Senha</h2>
                            <p className="text-gray-500 text-sm mb-6">Quem precisa de ajuda com a senha?</p>

                            <div className="role-cards">
                                <button className="role-card" onClick={() => setStep('funcionario')}>
                                    <div className="role-icon" style={{ background: '#ede9fe' }}>
                                        <User size={28} color="#7c3aed" />
                                    </div>
                                    <div className="role-info">
                                        <span className="role-title">Sou Colaborador</span>
                                        <span className="role-desc">Funcionário de uma empresa</span>
                                    </div>
                                </button>

                                <button className="role-card" onClick={() => setStep('empresa')}>
                                    <div className="role-icon" style={{ background: '#dbeafe' }}>
                                        <Building2 size={28} color="#2563eb" />
                                    </div>
                                    <div className="role-info">
                                        <span className="role-title">Sou Empresa</span>
                                        <span className="role-desc">Administrador / RH da empresa</span>
                                    </div>
                                </button>
                            </div>

                            <Link to="/login" className="back-link">
                                <ArrowLeft size={16} /> Voltar ao Login
                            </Link>
                        </div>
                    )}

                    {/* Step: Funcionário Instructions */}
                    {step === 'funcionario' && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-1">Colaborador</h2>
                            <p className="text-gray-500 text-sm mb-6">Recuperação de acesso</p>

                            <div className="info-box">
                                <AlertCircle size={20} className="text-amber-500" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <p className="font-semibold text-gray-800 mb-1">Sua senha é gerenciada pela sua empresa.</p>
                                    <p className="text-gray-600 text-sm">
                                        Entre em contato com o <strong>setor de RH</strong> ou o <strong>responsável administrativo</strong> da sua empresa
                                        e solicite a redefinição da sua senha no sistema.
                                    </p>
                                    <p className="text-gray-500 text-xs mt-3">
                                        Após o RH redefinir sua senha, você receberá uma credencial provisória.
                                        No próximo login, o sistema exigirá que você crie uma nova senha pessoal.
                                    </p>
                                </div>
                            </div>

                            <button className="btn btn-black login-btn mt-4" onClick={() => setStep('select')}>
                                <ArrowLeft size={16} /> Voltar
                            </button>

                            <Link to="/login" className="back-link" style={{ marginTop: '1rem' }}>
                                Ir para o Login
                            </Link>
                        </div>
                    )}

                    {/* Step: Empresa Ticket Form */}
                    {step === 'empresa' && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-1">Empresa / RH</h2>
                            <p className="text-gray-500 text-sm mb-5">Envie uma solicitação de recuperação de senha para o administrador do sistema.</p>

                            {error && (
                                <div className="login-error">{error}</div>
                            )}

                            <form onSubmit={handleSubmitTicket} className="login-form">
                                <div className="form-group">
                                    <label className="form-label">E-mail cadastrado*</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="rh@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nome da Empresa*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Minha Empresa Ltda."
                                        value={formData.nome_empresa}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nome_empresa: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mensagem <span className="text-gray-400 text-xs">(Opcional)</span></label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Descreva brevemente o problema..."
                                        rows="3"
                                        value={formData.mensagem}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                    />
                                </div>

                                <button type="submit" className="btn btn-black login-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="spinner" size={20} />
                                    ) : (
                                        <><Send size={16} /> Enviar Solicitação</>
                                    )}
                                </button>
                            </form>

                            <button className="back-link" onClick={() => setStep('select')} style={{ marginTop: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="animate-fade-in text-center" style={{ padding: '2rem 0' }}>
                            <div className="success-icon-wrapper">
                                <CheckCircle2 size={48} color="#22c55e" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 mt-4">Solicitação Enviada!</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Seu ticket foi registrado com sucesso. O administrador do sistema entrará em contato pelo e-mail informado para redefinir sua senha.
                            </p>

                            <Link to="/login" className="btn btn-black login-btn" style={{ textDecoration: 'none' }}>
                                Voltar ao Login
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default EsqueciSenha;
