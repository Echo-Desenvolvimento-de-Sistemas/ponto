import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Shield, Building2 } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import './AdminGlobalUsers.css';

const AdminGlobalUsers = () => {
    // Mock data for all users across tenants
    usePageTitle('Usuários Globais');
    const [users] = useState([
        { id: 1, name: 'João Silva', email: 'joao@techcorp.com', role: 'funcionario', empresa: 'Tech Corp Ponto SaaS Ltda', status: 'Ativo' },
        { id: 2, name: 'Gestor do RH', email: 'rh@techcorp.com', role: 'empresa_rh', empresa: 'Tech Corp Ponto SaaS Ltda', status: 'Ativo' },
        { id: 3, name: 'Admin SaaS Full', email: 'admin@pontonow.com', role: 'admin_global', empresa: 'PontoNow (Global)', status: 'Ativo' },
        { id: 4, name: 'Maria Souza', email: 'maria@padariacentral.com', role: 'funcionario', empresa: 'Padaria Central', status: 'Inativo' },
    ]);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin_global': return 'badge-global';
            case 'empresa_rh': return 'badge-rh';
            default: return 'badge-func';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin_global': return 'SaaS Admin';
            case 'empresa_rh': return 'Gestor RH';
            default: return 'Colaborador';
        }
    };

    return (
        <div className="global-users-container animate-fade-in">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-primary-color" />
                        Colaboradores Globais
                    </h1>
                    <p className="text-muted">Gestão mestra de todos os usuários cadastrados no SaaS.</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} /> Novo Usuário
                </button>
            </header>

            <div className="glass-card list-card">
                <div className="list-toolbar">
                    <div className="search-bar">
                        <Search size={18} className="text-gray-400" />
                        <input type="text" placeholder="Buscar por nome, email ou empresa..." />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Empresa (Tenant)</th>
                                <th>Nível de Acesso</th>
                                <th>Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar-small">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 size={14} className="text-gray-400" />
                                            {user.empresa}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-dot ${user.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-sm text-gray-600">{user.status}</span>
                                    </td>
                                    <td className="text-right">
                                        <button className="icon-btn text-gray-400 hover:text-gray-600">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-footer">
                    <span className="text-sm text-gray-500">Mostrando 4 de 4 usuários</span>
                </div>
            </div>
        </div>
    );
};

export default AdminGlobalUsers;
