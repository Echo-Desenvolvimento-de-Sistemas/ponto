import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Loader2, Link as LinkIcon, Edit, Trash2, Copy, CheckCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../utils/usePageTitle';
import './AdminFuncionarios.css';

const AdminFuncionarios = () => {
    const [colaboradores, setColaboradores] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    usePageTitle('Colaboradores');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Feedbacks e modais de confirmação
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDestructive: false });
    const [resetPasswordModal, setResetPasswordModal] = useState({ isOpen: false, newPassword: '', loading: false });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    // Modal e Formulario
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', cpf: '', pis: '', cargo: '', data_admissao: '', regime_contratacao: 'CLT', jornada_id: '',
        intervalo_inicio: '', intervalo_fim: ''
    });

    // Convite modal
    const [conviteLink, setConviteLink] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const copyInviteLink = (colab) => {
        const token = colab.detalhes?.setup_token;
        if (!token) {
            showToast('Este colaborador já ativou a conta e não possui mais um link pendente.', 'error');
            return;
        }
        const link = `${window.location.origin}/ativar/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedId(colab.id);
        setTimeout(() => setCopiedId(null), 2500);
    };

    useEffect(() => {
        fetchData();
        fetchJornadas();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/funcionarios');
            setColaboradores(res.data);
        } catch (error) {
            console.error('Erro ao buscar colaboradores', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJornadas = async () => {
        try {
            const res = await api.get('/jornadas');
            setJornadas(res.data);
        } catch (error) {
            console.error('Erro ao buscar jornadas', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openModal = (colab = null) => {
        if (colab) {
            setEditingId(colab.id);
            setFormData({
                name: colab.name,
                email: colab.email,
                cpf: colab.detalhes?.cpf || '',
                pis: colab.detalhes?.pis || '',
                cargo: colab.detalhes?.cargo || '',
                data_admissao: colab.detalhes?.data_admissao || '',
                regime_contratacao: colab.detalhes?.regime_contratacao || 'CLT',
                jornada_id: colab.detalhes?.jornada_id || '',
                intervalo_inicio: colab.detalhes?.intervalo_inicio ? colab.detalhes.intervalo_inicio.slice(0, 5) : '',
                intervalo_fim: colab.detalhes?.intervalo_fim ? colab.detalhes.intervalo_fim.slice(0, 5) : ''
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '', email: '', cpf: '', pis: '', cargo: '', data_admissao: '', regime_contratacao: 'CLT', jornada_id: '',
                intervalo_inicio: '', intervalo_fim: ''
            });
        }
        setConviteLink('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/funcionarios/${editingId}`, formData);
                showToast('Colaborador atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchData();
            } else {
                // Passa uma senha aleatoria, pois o email serve como chave primária de login.
                const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';

                const dataToSend = { ...formData, password: randomPassword };
                const res = await api.post('/funcionarios', dataToSend);

                // setup_token está nos detalhes do colaborador criado
                const setupToken = res.data.detalhes?.setup_token;
                const link = `${window.location.origin}/ativar/${setupToken}`;
                setConviteLink(link);
                fetchData();
            }
        } catch (error) {
            showToast('Erro ao salvar colaborador: ' + (error.response?.data?.message || 'Erro Desconhecido'), 'error');
        }
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Remover Colaborador',
            message: 'Deseja realmente remover este colaborador da empresa? Esta ação não pode ser desfeita.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/funcionarios/${id}`);
                    showToast('Colaborador removido com sucesso!', 'success');
                    fetchData();
                } catch (error) {
                    showToast('Erro ao deletar colaborador.', 'error');
                }
            }
        });
    };

    const openResetPasswordModal = () => {
        setResetPasswordModal({ isOpen: true, newPassword: '', loading: false });
    };

    const submitPasswordReset = async (e) => {
        e.preventDefault();
        if (!editingId) return;

        setResetPasswordModal(prev => ({ ...prev, loading: true }));
        try {
            await api.post(`/funcionarios/${editingId}/force-password-reset`, { password: resetPasswordModal.newPassword });
            showToast('Senha redefinida com sucesso para o colaborador.', 'success');
            setResetPasswordModal({ isOpen: false, newPassword: '', loading: false });
        } catch (error) {
            showToast('Erro ao forçar redefinição de senha: ' + (error.response?.data?.message || 'Tente novamente mais tarde.'), 'error');
            setResetPasswordModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="admin-funcionarios animate-fade-in">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Equipe & Colaboradores</h1>
                    <p className="text-muted">Gerencie quem faz parte do time e defina seus regimes/jornadas.</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2" onClick={() => openModal()}>
                    <Plus size={18} /> Novo Colaborador
                </button>
            </header>

            <div className="glass-card list-card">
                <div className="list-toolbar flex justify-between p-4 border-b">
                    <div className="search-bar w-1/3">
                        <Search size={18} className="text-gray-400" />
                        <input type="text" placeholder="Buscar colaborador..." className="w-full bg-transparent outline-none ml-2" />
                    </div>
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                    ) : (
                        <table className="users-table w-full">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>Cargo / Departamento</th>
                                    <th>Regime</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {colaboradores.map((colab) => (
                                    <tr key={colab.id}>
                                        <td>
                                            <div className="font-bold">{colab.name}</div>
                                            <div className="text-sm text-gray-500">{colab.email}</div>
                                        </td>
                                        <td className="font-mono text-sm">{colab.detalhes?.cpf || '-'}</td>
                                        <td>{colab.detalhes?.cargo || '-'}</td>
                                        <td><span className="badge-info">{colab.detalhes?.regime_contratacao || 'CLT'}</span></td>
                                        <td>
                                            {colab.detalhes?.setup_token ? (
                                                <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                                                    Convite Pendente
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                                                    Ativo
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {colab.detalhes?.setup_token && (
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => copyInviteLink(colab)}
                                                        title="Copiar Link de Convite"
                                                        style={{ color: copiedId === colab.id ? '#22c55e' : '#a855f7', transition: 'color 0.3s' }}
                                                    >
                                                        {copiedId === colab.id ? <CheckCheck size={18} /> : <Copy size={18} />}
                                                    </button>
                                                )}
                                                <button className="icon-btn text-blue-500" onClick={() => openModal(colab)} title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button className="icon-btn text-red-500 hover:bg-red-50" onClick={() => handleDelete(colab.id)} title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {colaboradores.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8 text-gray-500">Nenhum colaborador encontrado na empresa.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}</h2>
                            <button className="text-gray-500 hover:text-black text-2xl" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            {conviteLink ? (
                                <div className="text-center py-8">
                                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 inline-block">
                                        Usuário criado com sucesso!
                                    </div>
                                    <p className="mb-4 text-gray-700">O cadastro inicial foi feito. Envie este link de convite para que o colaborador insira suas informações completas (senha, biometria/foto, etc).</p>

                                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded border">
                                        <LinkIcon size={18} className="text-gray-500" />
                                        <input type="text" readOnly value={conviteLink} className="w-full bg-transparent outline-none font-mono text-sm text-gray-600" />
                                        <button className="btn btn-outline text-sm whitespace-nowrap" onClick={() => navigator.clipboard.writeText(conviteLink)}>
                                            Copiar Link
                                        </button>
                                    </div>

                                    <button className="btn btn-primary mt-8 w-full" onClick={() => setIsModalOpen(false)}>
                                        Concluir
                                    </button>
                                </div>
                            ) : (
                                <form id="colabForm" onSubmit={handleSubmit} className="form-grid">
                                    <div className="form-group full-col">
                                        <label>Nome Completo*</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="form-input" />
                                    </div>

                                    <div className="form-group">
                                        <label>E-mail Corporativo/Pessoal*</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="form-input" />
                                    </div>

                                    <div className="form-group grid grid-cols-2 gap-4">
                                        <div>
                                            <label>CPF*</label>
                                            <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} required className="form-input" placeholder="000.000.000-00" />
                                        </div>
                                        <div>
                                            <label>PIS / PASEP <span className="text-gray-400 text-xs">(Opcional)</span></label>
                                            <input type="text" name="pis" value={formData.pis} onChange={handleInputChange} className="form-input" placeholder="000.00000.00-0" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Departamento ou Cargo</label>
                                        <input type="text" name="cargo" value={formData.cargo} onChange={handleInputChange} className="form-input" placeholder="Ex: Desenvolvedor Senior" />
                                    </div>

                                    <div className="form-group">
                                        <label>Data de Admissão</label>
                                        <input type="date" name="data_admissao" value={formData.data_admissao} onChange={handleInputChange} className="form-input" />
                                    </div>

                                    <div className="form-group">
                                        <label>Regime de Contratação*</label>
                                        <select name="regime_contratacao" value={formData.regime_contratacao} onChange={handleInputChange} className="form-input" required>
                                            <option value="CLT">CLT Mensalista</option>
                                            <option value="PJ">Pessoa Jurídica (PJ)</option>
                                            <option value="Estágio">Estágio</option>
                                            <option value="Temporário">Temporário</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Jornada de Trabalho (Escala)</label>
                                        <select name="jornada_id" value={formData.jornada_id} onChange={handleInputChange} className="form-input">
                                            <option value="">Livre / Sem Escala Fixa</option>
                                            {jornadas.map(j => (
                                                <option key={j.id} value={j.id}>{j.descricao} ({j.entrada_1} às {j.saida_2})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group grid grid-cols-2 gap-4 col-span-full">
                                        <div>
                                            <label>Início do Almoço / Pausa</label>
                                            <input type="time" name="intervalo_inicio" value={formData.intervalo_inicio} onChange={handleInputChange} className="form-input" />
                                        </div>
                                        <div>
                                            <label>Fim do Almoço / Pausa</label>
                                            <input type="time" name="intervalo_fim" value={formData.intervalo_fim} onChange={handleInputChange} className="form-input" />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        {!conviteLink && (
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    {editingId && (
                                        <button type="button" className="btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={openResetPasswordModal}>
                                            Resetar Senha do Colaborador
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" form="colabForm" className="btn btn-primary">
                                        {editingId ? 'Salvar Edição' : 'Criar & Gerar Convite'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>, document.body
            )}

            {/* Password Reset Modal - rendered as a separate portal with higher z-index */}
            {resetPasswordModal.isOpen && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="modal-content max-w-sm animate-fade-in">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-gray-800">Nova Senha</h2>
                            <button className="text-gray-500 hover:text-black text-2xl" onClick={() => setResetPasswordModal(prev => ({ ...prev, isOpen: false }))}>&times;</button>
                        </div>
                        <form onSubmit={submitPasswordReset}>
                            <div className="modal-body py-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Defina uma nova senha de acesso para este colaborador. No próximo login, ele será obrigado a cadastrar uma senha definitiva de sua escolha pessoal.
                                </p>
                                <div className="form-group">
                                    <label>Nova Senha Provisória</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        required
                                        minLength="6"
                                        value={resetPasswordModal.newPassword}
                                        onChange={(e) => setResetPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                                        placeholder="Digite a senha"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" className="btn btn-outline" onClick={() => setResetPasswordModal(prev => ({ ...prev, isOpen: false }))}>Cancelar</button>
                                    <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white border-0" disabled={resetPasswordModal.loading}>
                                        {resetPasswordModal.loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar e Resetar'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {/* Toast Notification */}
            {
                toast.show && createPortal(
                    <div className="fixed bottom-4 right-4 z-50 animate-fade-in flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg" style={{ backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type === 'error' ? '#991b1b' : '#166534' }}>
                        {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 hover:opacity-70"><X size={16} /></button>
                    </div>, document.body
                )
            }

            {/* Confirm Dialog Modal */}
            {
                confirmDialog.isOpen && createPortal(
                    <div className="modal-overlay z-50">
                        <div className="modal-content max-w-sm animate-fade-in">
                            <div className="modal-header">
                                <h2 className="text-xl font-bold text-gray-800">{confirmDialog.title}</h2>
                                <button className="text-gray-500 hover:text-black text-2xl" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>&times;</button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button className="btn btn-outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Cancelar</button>
                                    <button className={`btn ${confirmDialog.isDestructive ? 'bg-red-600 hover:bg-red-700 text-white border-0' : 'btn-primary'}`} onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}>
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>, document.body
                )
            }


        </div>
    );
};

export default AdminFuncionarios;
