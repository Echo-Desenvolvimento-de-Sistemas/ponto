import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import {
    LogOut, Fingerprint, MapPin, Settings, Users, FileText,
    PieChart, Palette, LayoutDashboard, Building, Shield, TrendingUp, ShieldAlert,
    HardDrive, AlarmClockPlus, Menu, X
} from 'lucide-react';
import FloatingIconsLoader from '../components/ui/FloatingIconsLoader';
import './Layout.css';

const ROLE_LABELS = {
    admin_global: 'Admin Global',
    empresa_rh: 'Gestor de RH',
    funcionario: 'Colaborador',
};

export const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export const AppLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { systemName, logoUrl, loading: wlLoading } = useWhitelabel();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // Close sidebar on route change (for mobile)
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    if (wlLoading) {
        return (
            <div className="loading-screen" style={{ flexDirection: 'column', gap: '20px' }}>
                <FloatingIconsLoader Icon={AlarmClockPlus} size={60} count={3} />
                <span className="text-muted font-medium">Carregando...</span>
            </div>
        );
    }

    const getNavClass = (path) =>
        location.pathname === path ? 'nav-item active' : 'nav-item';

    const logoDisplay = logoUrl
        ? <img src={logoUrl} alt={systemName} style={{ maxHeight: '32px', maxWidth: '140px', objectFit: 'contain' }} />
        : <><Fingerprint className="logo-icon" size={24} /><h2>{systemName || 'PontoNow'}</h2></>;

    const companyName = user?.empresa?.nome_fantasia || user?.empresa?.razao_social;

    // Funcionário usa layout mobile próprio (sem sidebar)
    if (user?.role === 'funcionario') {
        return <Outlet />;
    }

    return (
        <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <aside className={`sidebar glass-card ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div className="flex items-center gap-2">
                            {logoDisplay}
                        </div>
                        {companyName && (
                            <div className="text-xs text-gray-500 font-medium truncate w-64" title={companyName}>
                                {companyName}
                            </div>
                        )}
                    </div>

                    {/* Close button inside sidebar for mobile */}
                    <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {/* Dashboard — todos os roles admin */}
                    <Link to="/dashboard" className={getNavClass('/dashboard')}>
                        <LayoutDashboard size={20} />
                        <span>Painel</span>
                    </Link>

                    {/* Admin Global */}
                    {user?.role === 'admin_global' && (
                        <>
                            <Link to="/relatorios" className={getNavClass('/relatorios')}>
                                <PieChart size={20} />
                                <span>Relatórios Restritos</span>
                            </Link>
                            <Link to="/admin/auditoria" className={getNavClass('/admin/auditoria') || (location.pathname === '/admin/auditoria' ? 'active' : '')}>
                                <ShieldAlert size={20} />
                                <span>Auditoria do Sistema</span>
                            </Link>

                            <Link to="/admin/empresas" className={getNavClass('/admin/empresas')}>
                                <Building size={20} />
                                <span>Gestão de Empresas</span>
                            </Link>
                            <Link to="/admin/funcionarios" className={getNavClass('/admin/funcionarios')}>
                                <Shield size={20} />
                                <span>Usuários Globais</span>
                            </Link>
                            <Link to="/admin/whitelabel" className={getNavClass('/admin/whitelabel')}>
                                <Palette size={20} />
                                <span>Personalização SaaS</span>
                            </Link>
                            <Link to="/admin/migracao" className={getNavClass('/admin/migracao')}>
                                <HardDrive size={20} />
                                <span>Migração JSON</span>
                            </Link>

                            <Link to="/configuracoes" className={getNavClass('/configuracoes')}>
                                <Settings size={20} />
                                <span>Regras de Ponto & Cercas</span>
                            </Link>
                        </>
                    )}

                    {/* RH da Empresa */}
                    {user?.role === 'empresa_rh' && (
                        <>
                            <Link to="/relatorios" className={getNavClass('/relatorios')}>
                                <PieChart size={20} />
                                <span>Relatórios Contábeis</span>
                            </Link>
                            <Link to="/admin/bi" className={getNavClass('/admin/bi') || (location.pathname === '/admin/bi' ? 'active' : '')}>
                                <TrendingUp size={20} />
                                <span>BI & Analytics</span>
                            </Link>
                            <Link to="/admin/auditoria" className={getNavClass('/admin/auditoria') || (location.pathname === '/admin/auditoria' ? 'active' : '')}>
                                <ShieldAlert size={20} />
                                <span>Auditoria do Sistema</span>
                            </Link>
                            <Link to="/ocorrencias" className={getNavClass('/ocorrencias')}>
                                <FileText size={20} />
                                <span>Ocorrências</span>
                            </Link>
                            <Link to="/funcionarios" className={getNavClass('/funcionarios')}>
                                <Users size={20} />
                                <span>Colaboradores</span>
                            </Link>
                            <Link to="/configuracoes" className={getNavClass('/configuracoes')}>
                                <Settings size={20} />
                                <span>Configurações</span>
                            </Link>
                            <Link to="/empresa/whitelabel" className={getNavClass('/empresa/whitelabel')}>
                                <Palette size={20} />
                                <span>Identidade Visual</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{ROLE_LABELS[user?.role] || user?.role}</span>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="mobile-header glass-card">
                    <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo">
                        {logoDisplay}
                    </div>
                </header>
                <div className="page-container animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
