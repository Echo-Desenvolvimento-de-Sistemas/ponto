import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import BaterPonto from './funcionario/BaterPonto';
import Historico from './funcionario/Historico';
import Acoes from './funcionario/Acoes';
import Perfil from './funcionario/Perfil';
import BottomNav from '../components/BottomNav';
import AdminDashboard from './admin/AdminDashboard';
import FloatingIconsLoader from '../components/ui/FloatingIconsLoader';
import { AlarmClockPlus } from 'lucide-react';

const DashboardPlaceholder = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = React.useState('ponto');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white" style={{ gap: '20px' }}>
                <FloatingIconsLoader Icon={AlarmClockPlus} size={60} count={3} />
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Carregando...</span>
            </div>
        );
    }

    const renderFuncionarioScreen = () => {
        switch (activeTab) {
            case 'ponto': return <BaterPonto />;
            case 'historico': return <Historico />;
            case 'acoes': return <Acoes />;
            case 'perfil': return <Perfil />;
            default: return <BaterPonto />;
        }
    };

    if (user?.role === 'funcionario') {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '80px' }}>
                {renderFuncionarioScreen()}
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        );
    }

    return <AdminDashboard />;
};

export default DashboardPlaceholder;
