import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, AppLayout } from './components/Layout';
import Login from './pages/Login';
import DashboardPlaceholder from './pages/Dashboard';
import AdminGlobalUsers from './pages/admin/AdminGlobalUsers';
import AdminEmpresas from './pages/admin/AdminEmpresas';
import WhiteLabelConfig from './pages/admin/WhiteLabelConfig';
import AdminOcorrencias from './pages/admin/AdminOcorrencias';
import Configuracoes from './pages/admin/Configuracoes';
import AdminRelatorios from './pages/admin/AdminRelatorios';
import AdminFuncionarios from './pages/admin/AdminFuncionarios';
import AdminMigracao from './pages/admin/AdminMigracao';
import AdminBI from './pages/admin/AdminBI';
import AdminAuditoria from './pages/admin/AdminAuditoria';
import SetupEmpresa from './pages/SetupEmpresa';
import SetupColaborador from './pages/SetupColaborador';
import EsqueciSenha from './pages/EsqueciSenha';
import PrivacidadeLocalizacao from './pages/PrivacidadeLocalizacao';
import { requestNotificationPermission } from './utils/pushNotifications';
import { WhitelabelProvider } from './contexts/WhitelabelContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  useEffect(() => {
    requestNotificationPermission();

    // Check for upcoming punch times every minute
    const interval = setInterval(async () => {
      const isFuncionario = localStorage.getItem('user_role') === 'funcionario';
      if (!isFuncionario || !navigator.onLine) return;

      try {
        const { data: jornada } = await api.get('/minha-jornada');
        if (!jornada) return;

        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const notifyLeadTime = 10; // 10 minutos antes do horário

        const times = [
          jornada.horario_entrada,
          jornada.horario_saida,
          jornada.intervalo_inicio,
          jornada.intervalo_fim
        ].filter(Boolean);

        for (const t of times) {
          const [h, m] = t.split(':').map(Number);
          const punchMins = h * 60 + m;

          if (punchMins - currentMins === notifyLeadTime) {
            import('./utils/pushNotifications').then(({ sendLocalNotification }) => {
              sendLocalNotification('Lembrete de Ponto', `Faltam ${notifyLeadTime} minutos para o seu horário (${t}).`);
            });
            break;
          }
        }
      } catch (e) {
        // Silently fail if not logged in or API fails
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <WhitelabelProvider>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />

            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPlaceholder />} />
                <Route path="/admin/empresas" element={<AdminEmpresas />} />
                <Route path="/admin/funcionarios" element={<AdminGlobalUsers />} />
                <Route path="/admin/migracao" element={<AdminMigracao />} />
                <Route path="/admin/bi" element={<AdminBI />} />
                <Route path="/admin/auditoria" element={<AdminAuditoria />} />
                <Route path="/funcionarios" element={<AdminFuncionarios />} />
                <Route path="/admin/whitelabel" element={<WhiteLabelConfig />} />
                <Route path="/ocorrencias" element={<AdminOcorrencias />} />
                <Route element={<PrivateRoute allowedRoles={['empresa_rh', 'admin_global']} />}>
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
                <Route path="/relatorios" element={<AdminRelatorios />} />
                <Route path="/empresa/whitelabel" element={<WhiteLabelConfig />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/setup/:token" element={<SetupEmpresa />} />
            <Route path="/ativar/:token" element={<SetupColaborador />} />
            <Route path="/privacidade" element={<PrivacidadeLocalizacao />} />
          </Routes>
        </WhitelabelProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
