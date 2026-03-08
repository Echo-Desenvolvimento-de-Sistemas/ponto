import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Shield, Bell, Briefcase, Calendar, CreditCard, Building, ChevronRight, AlarmClockPlus } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import HelpModal from '../../components/HelpModal';
import api from '../../api/axios';
import FloatingIconsLoader from '../../components/ui/FloatingIconsLoader';
import './FuncionarioLayout.css';
import './Perfil.css';

const HELP_SECTIONS = [
    {
        heading: 'Seus dados',
        items: [
            'Esta página exibe suas informações cadastrais: CPF, cargo, data de admissão e regime de contratação.',
            'Para atualizar seus dados, entre em contato com o setor de RH.',
        ],
    },
    {
        heading: 'Preferências',
        items: [
            'Ative ou desative as notificações push da plataforma.',
            'Clique em "Sair da Conta" para fazer logout com segurança.',
        ],
    },
];

const roleLabel = (role) => {
    const map = {
        funcionario: 'Colaborador',
        empresa_rh: 'Gestor de RH',
        admin_global: 'Admin Global',
    };
    return map[role] || role;
};

const Perfil = () => {
    const { user, logout } = useAuth();
    usePageTitle('Meu Perfil');

    const [detalhes, setDetalhes] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/user').then(res => {
            setDetalhes(res.data?.detalhes || null);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    };

    return (
        <div className="funcionario-page-wrapper">
            <div className="func-page-header animate-fade-in">
                <div>
                    <h2 className="func-page-title">Meu Perfil</h2>
                </div>
            </div>

            <div className="perfil-content func-page-content animate-fade-in">

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-4 h-64">
                        <FloatingIconsLoader Icon={AlarmClockPlus} size={40} count={3} />
                        <span className="text-muted text-sm">Carregando perfil...</span>
                    </div>
                ) : (
                    <>
                        {/* User Info Card */}
                        <div className="perfil-header-card glass-card">
                            <div className="perfil-avatar">
                                <span>{user?.name?.charAt(0).toUpperCase() || '?'}</span>
                            </div>
                            <div className="perfil-info">
                                <h3>{user?.name || 'Usuário'}</h3>
                                <p>{user?.email}</p>
                                <span className="badge-role">{roleLabel(user?.role)}</span>
                            </div>
                        </div>

                        {/* Info Fields */}
                        <div className="settings-group glass-card">
                            <div className="perfil-field">
                                <div className="perfil-field-icon"><CreditCard size={18} /></div>
                                <div className="perfil-field-info">
                                    <span className="perfil-field-label">CPF</span>
                                    <span className="perfil-field-value">{detalhes?.cpf || '—'}</span>
                                </div>
                            </div>
                            <div className="perfil-field">
                                <div className="perfil-field-icon"><Briefcase size={18} /></div>
                                <div className="perfil-field-info">
                                    <span className="perfil-field-label">Cargo</span>
                                    <span className="perfil-field-value">{detalhes?.cargo || '—'}</span>
                                </div>
                            </div>
                            <div className="perfil-field">
                                <div className="perfil-field-icon"><Calendar size={18} /></div>
                                <div className="perfil-field-info">
                                    <span className="perfil-field-label">Admissão</span>
                                    <span className="perfil-field-value">{formatDate(detalhes?.data_admissao)}</span>
                                </div>
                            </div>
                            {detalhes?.regime_contratacao && (
                                <div className="perfil-field">
                                    <div className="perfil-field-icon"><Building size={18} /></div>
                                    <div className="perfil-field-info">
                                        <span className="perfil-field-label">Regime</span>
                                        <span className="perfil-field-value">{detalhes.regime_contratacao}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferências */}
                        <div className="settings-group glass-card">
                            <div className="settings-item">
                                <div className="settings-icon"><Bell size={18} /></div>
                                <span>Notificações Push</span>
                                <div className="toggle-switch active"></div>
                            </div>
                            <div className="settings-item">
                                <div className="settings-icon"><Shield size={18} /></div>
                                <span>Privacidade e Localização</span>
                                <ChevronRight size={18} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Logout */}
                        <button className="logout-button glass-card" onClick={logout}>
                            <LogOut size={20} />
                            <span>Sair da Conta</span>
                        </button>
                    </>
                )}
            </div>

            <HelpModal title="Meu Perfil" sections={HELP_SECTIONS} />
        </div>
    );
};

export default Perfil;
