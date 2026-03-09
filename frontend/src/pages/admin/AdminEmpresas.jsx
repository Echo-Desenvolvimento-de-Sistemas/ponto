import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MoreVertical, Building, Users, Clock, AlertTriangle, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../utils/usePageTitle';
import './AdminEmpresas.css';

const AdminEmpresas = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    usePageTitle('Gestão de Empresas');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        razao_social: '',
        cnpj: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    // Invite Modal state
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [generatedInviteLink, setGeneratedInviteLink] = useState('');
    const [inviteEmpresaName, setInviteEmpresaName] = useState('');
    const [copiedInvite, setCopiedInvite] = useState(false);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmpresa(null);
        setFormData({ nome_fantasia: '', razao_social: '', cnpj: '' });
        setError('');
    };

    const openEditModal = (empresa) => {
        setEditingEmpresa(empresa);
        setFormData({
            nome_fantasia: empresa.nome_fantasia,
            razao_social: empresa.razao_social,
            cnpj: empresa.cnpj
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta empresa? Todos os dados vinculados a ela (funcionários, pontos, etc) poderão ser deletados no lado do servidor.')) return;

        setDeletingId(id);
        try {
            await api.delete(`/empresas/${id}`);
            fetchEmpresas();
        } catch (error) {
            console.error('Erro ao excluir empresa:', error);
            alert('Não foi possível excluir a empresa.');
        } finally {
            setDeletingId(null);
        }
    };

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/empresas');
            setEmpresas(response.data);
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (editingEmpresa) {
                await api.put(`/empresas/${editingEmpresa.id}`, formData);
            } else {
                await api.post('/empresas', formData);
            }
            fetchEmpresas(); // Refresh list
            handleCloseModal(); // Close modal and reset
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao processar dados da empresa. Verifique se o CNPJ já existe.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateInvite = async (empresa) => {
        try {
            const response = await api.post('/convites/gerar', { empresa_id: empresa.id });
            const link = response.data.link;

            // Replaces backend domain with frontend domain for the invite link
            const url = new URL(link);
            const frontendUrl = `${window.location.origin}${url.pathname}`;

            setGeneratedInviteLink(frontendUrl);
            setInviteEmpresaName(empresa.nome_fantasia);
            setCopiedInvite(false);
            setInviteModalOpen(true);
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar o link. Tente novamente.');
        }
    };

    const handleCopyInvite = () => {
        navigator.clipboard.writeText(generatedInviteLink);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
    };

    return (
        <div className="admin-empresas-container animate-fade-in relative">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building className="text-primary-color" />
                        Gestão de Clientes
                    </h1>
                    <p className="text-muted">Administre as empresas assinantes da sua plataforma.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmpresa(null);
                        setFormData({ nome_fantasia: '', razao_social: '', cnpj: '' });
                        setIsModalOpen(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> Cadastrar Empresa
                </button>
            </header>

            <div className="dashboard-content-grid mb-6">
                {/* Quick Stats for Admin */}
                <div className="metric-card glass-card border-l-4 border-l-indigo-500">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' }}>
                        <Building size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-value">{empresas.length}</h3>
                        <span className="metric-title">Clientes Cadastrados</span>
                    </div>
                </div>

                <div className="metric-card glass-card py-4">
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-value">0</h3>
                        <span className="metric-title">Atrasos de Pagamento</span>
                    </div>
                </div>
            </div>

            <div className="glass-card list-card min-h-[400px]">
                <div className="list-toolbar">
                    <div className="search-bar">
                        <Search size={18} className="text-gray-400" />
                        <input type="text" placeholder="Buscar por Razão Social ou CNPJ..." />
                    </div>
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="animate-spin text-primary-color" size={32} />
                        </div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>CNPJ</th>
                                    <th>Criada Em</th>
                                    <th>Status SaaS</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empresas.length > 0 ? empresas.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="empresa-logo-placeholder">
                                                    {emp.nome_fantasia.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{emp.nome_fantasia}</div>
                                                    <div className="text-sm text-gray-500 mt-1">{emp.razao_social}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm text-gray-600">{emp.cnpj}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={14} className="text-primary-color" />
                                                {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge badge-rh`}>Ativo</span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-1 px-3 text-xs"
                                                    onClick={() => handleGenerateInvite(emp)}
                                                    title="Gerar Link de Convite"
                                                >
                                                    Gerar Convite
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(emp)}
                                                    className="text-gray-500 hover:text-indigo-600 transition-colors p-1"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="text-gray-500 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                                                    disabled={deletingId === emp.id}
                                                    title="Excluir"
                                                >
                                                    {deletingId === emp.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">
                                            Nenhuma empresa cadastrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Criação de Empresa */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold">{editingEmpresa ? 'Editar Cliente' : 'Cadastrar Cliente (Tenant)'}</h2>
                            <button type="button" onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group mb-4">
                                <label className="form-label font-medium mb-1 block text-sm">Nome Fantasia</label>
                                <input
                                    type="text"
                                    name="nome_fantasia"
                                    className="form-input"
                                    placeholder="Ex: Tech Corp Ponto"
                                    value={formData.nome_fantasia}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label font-medium mb-1 block text-sm">Razão Social</label>
                                <input
                                    type="text"
                                    name="razao_social"
                                    className="form-input"
                                    placeholder="Ex: Tech Corp Ponto SaaS Ltda"
                                    value={formData.razao_social}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label font-medium mb-1 block text-sm">CNPJ</label>
                                <input
                                    type="text"
                                    name="cnpj"
                                    className="form-input"
                                    placeholder="Ex: 00.000.000/0001-00"
                                    value={formData.cnpj}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal de Link de Convite */}
            {inviteModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users size={20} className="text-primary-color" />
                                Link de Convite Gerado
                            </h2>
                            <button type="button" onClick={() => setInviteModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body p-6">
                            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 w-full text-left border border-green-100">
                                <p className="font-semibold mb-1 text-sm">Convite Ativo: {inviteEmpresaName}</p>
                                <p className="text-xs">Envie com segurança o link abaixo para o administrador desta empresa. Ao acessar a página, ele mesmo fará o processo de definir o login e a senha administrativa dele.</p>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-3 rounded-lg mb-8 shadow-inner">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedInviteLink}
                                    className="w-full bg-transparent outline-none font-mono text-sm text-gray-700"
                                    onClick={e => e.target.select()}
                                />
                                <button
                                    onClick={handleCopyInvite}
                                    className={`btn text-sm whitespace-nowrap px-4 py-2 transition-colors ${copiedInvite ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 'btn-outline bg-white hover:bg-gray-50'}`}
                                >
                                    {copiedInvite ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>

                            <button className="btn btn-primary w-full py-3 font-semibold" onClick={() => setInviteModalOpen(false)}>
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminEmpresas;
