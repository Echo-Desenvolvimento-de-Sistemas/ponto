import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { FileText, Check, X, AlertTriangle, Loader2, Eye, Download, MapPin } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import './AdminOcorrencias.css';

const AdminOcorrencias = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ocorrencias'); // 'ocorrencias' ou 'justificativas'
    const [ocorrencias, setOcorrencias] = useState([]);
    const [justificativas, setJustificativas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, type: null, observacao: '' });
    usePageTitle('Ocorrências');

    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';

    useEffect(() => {
        if (activeTab === 'ocorrencias') {
            fetchOcorrencias();
        } else {
            fetchJustificativas();
        }
    }, [activeTab]);

    const fetchOcorrencias = async () => {
        setLoading(true);
        try {
            const response = await api.get('/ocorrencias');
            setOcorrencias(response.data);
        } catch (error) {
            console.error("Erro ao carregar ocorrências:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJustificativas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/registro-pontos/justificativas');
            setJustificativas(response.data);
        } catch (error) {
            console.error("Erro ao carregar justificativas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvaliar = async () => {
        const { id, type, observacao } = actionModal;

        if (type === 'rejeitada' && !observacao.trim()) {
            alert('A justificativa/observação é obrigatória ao rejeitar uma ocorrência.');
            return;
        }

        setSubmittingId(id);
        try {
            if (activeTab === 'ocorrencias') {
                await api.post(`/ocorrencias/${id}/avaliar`, {
                    status: type,
                    observacao_gestor: observacao
                });
                fetchOcorrencias();
            } else {
                await api.put(`/registro-pontos/${id}/justificativa`, {
                    status_justificativa: type,
                    nota_empresa: observacao
                });
                fetchJustificativas();
            }
            setActionModal({ isOpen: false, id: null, type: null, observacao: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao avaliar a solicitação.');
        } finally {
            setSubmittingId(null);
        }
    };

    const openActionModal = (id, type) => {
        setActionModal({ isOpen: true, id, type, observacao: '' });
    };

    const formatTipo = (tipo) => {
        const mapa = {
            'esquecimento_entrada': 'Esquecimento de Entrada',
            'esquecimento_saida': 'Esquecimento de Saída',
            'falta_justificada': 'Falta Justificada',
            'atestado': 'Atestado Médico',
            'outro': 'Outros'
        };
        return mapa[tipo] || tipo;
    };

    if (loading && ocorrencias.length === 0 && justificativas.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-color" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-ocorrencias">
            <header className="page-header animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Tratamento de Ponto e Atestados</h1>
                    <p className="text-muted">Aprove ou negue as justificativas e ajustes solicitados pela equipe.</p>
                </div>

                <div className="tabs-container mt-4 flex gap-4 border-b border-gray-200">
                    <button
                        className={`tab-btn pb-2 px-1 font-medium transition-colors ${activeTab === 'ocorrencias' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('ocorrencias')}
                    >
                        Ocorrências Gerais
                    </button>
                    <button
                        className={`tab-btn pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${activeTab === 'justificativas' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('justificativas')}
                    >
                        Ponto Fora do Cerco
                        {justificativas.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{justificativas.length}</span>
                        )}
                    </button>
                </div>
            </header>

            <div className="ocorrencias-grid mt-6">
                {(activeTab === 'ocorrencias' ? ocorrencias : justificativas).length === 0 && !loading ? (
                    <div className="empty-state glass-card">
                        <FileText size={48} className="text-muted mb-4" />
                        <h3>Nenhuma solicitação pendente</h3>
                        <p>A equipe está com os pontos em dia.</p>
                    </div>
                ) : (
                    (activeTab === 'ocorrencias' ? ocorrencias : justificativas).map((item, idx) => (
                        <div key={item.id} className="ocorrencia-card glass-card animate-fade-in" style={{ animationDelay: `${0.1 * idx}s` }}>

                            <div className="ocorrencia-header">
                                <div className="user-badge flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                        {item.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{item.user?.name || 'Deletado'}</h4>
                                        <span className="text-xs text-gray-500">
                                            {activeTab === 'ocorrencias'
                                                ? new Date(item.data_ocorrencia).toLocaleDateString('pt-BR')
                                                : new Date(item.horario_servidor).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                                <span className={`status-badge ${activeTab === 'ocorrencias' ? item.status : item.status_justificativa}`}>
                                    {(activeTab === 'ocorrencias' ? item.status : item.status_justificativa).toUpperCase()}
                                </span>
                            </div>

                            <div className="ocorrencia-body">
                                <div className="info-row">
                                    <strong>Tipo:</strong> <span>{activeTab === 'ocorrencias' ? formatTipo(item.tipo) : `Registro Fora do Local (${formatTipo(item.tipo)})`}</span>
                                </div>
                                {item.horario_sugerido && activeTab === 'ocorrencias' && (
                                    <div className="info-row highlight-row">
                                        <strong>Horário Sugerido:</strong>
                                        <span className="font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{item.horario_sugerido}</span>
                                    </div>
                                )}
                                {activeTab === 'justificativas' && (
                                    <div className="info-row highlight-row">
                                        <strong>Horário do Ponto:</strong>
                                        <span className="font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                            {new Date(item.horario_servidor).toLocaleTimeString('pt-BR')}
                                        </span>
                                    </div>
                                )}

                                {item.justificativa && (
                                    <div className="justificativa-box">
                                        <strong>Motivo/Mensagem:</strong>
                                        <p>"{item.justificativa}"</p>
                                    </div>
                                )}

                                {item.anexo_url && activeTab === 'ocorrencias' && (
                                    <div className="anexo-box mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText size={18} className="text-gray-500" />
                                            <strong className="text-sm">Documento Anexado</strong>
                                        </div>
                                        {item.anexo_url.match(/\.(jpeg|jpg|png)$/i) ? (
                                            <img src={`${baseUrl}${item.anexo_url}`} alt="Anexo" className="w-full h-32 object-cover rounded shadow-sm border" />
                                        ) : (
                                            <a href={`${baseUrl}${item.anexo_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                                                <Download size={16} /> Baixar PDF / Arquivo
                                            </a>
                                        )}
                                    </div>
                                )}

                                {(item.observacao_gestor || item.nota_empresa) && (
                                    <div className="gestor-note bg-blue-50 text-blue-800 p-3 rounded-md mt-3 text-sm">
                                        <strong>Feedback do Gestor:</strong> {item.observacao_gestor || item.nota_empresa}
                                    </div>
                                )}
                            </div>

                            {(activeTab === 'ocorrencias' ? item.status : item.status_justificativa) === 'pendente' && (
                                <div className="ocorrencia-actions border-t mt-4 pt-4 flex gap-2">
                                    <button
                                        className="btn bg-green-500 hover:bg-green-600 text-white flex-1 flex items-center justify-center gap-2"
                                        onClick={() => openActionModal(item.id, 'aprovada')}
                                        disabled={submittingId === item.id}
                                    >
                                        <Check size={18} /> Aprovar
                                    </button>
                                    <button
                                        className="btn bg-red-500 hover:bg-red-600 text-white flex-1 flex items-center justify-center gap-2"
                                        onClick={() => openActionModal(item.id, 'rejeitada')}
                                        disabled={submittingId === item.id}
                                    >
                                        <X size={18} /> Negar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Ação */}
            {actionModal.isOpen && createPortal(
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {actionModal.type === 'aprovada' ? (
                                    <><Check className="text-green-600" /> Aprovar Ocorrência</>
                                ) : (
                                    <><X className="text-red-500" /> Negar Ocorrência</>
                                )}
                            </h2>
                            <button className="text-gray-500 hover:text-black text-2xl" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>&times;</button>
                        </div>

                        <div className="modal-body p-6">
                            <p className="mb-4 text-gray-700">
                                {actionModal.type === 'aprovada'
                                    ? 'Você está prestes a aprovar esta ocorrência. Deseja adicionar uma observação opcional para o colaborador?'
                                    : 'Por favor, informe o motivo da rejeição para que o colaborador possa entender o que aconteceu (obrigatório).'}
                            </p>
                            <div className="form-group mb-0">
                                <label>Observação/Feedback do Gestor</label>
                                <textarea
                                    className="form-input min-h-[100px] resize-none"
                                    placeholder="Ex: Justificativa aceita / Faltou anexo do atestado médico..."
                                    value={actionModal.observacao}
                                    onChange={(e) => setActionModal({ ...actionModal, observacao: e.target.value })}
                                    autoFocus
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-footer bg-gray-50 flex gap-3 p-4 border-t rounded-b-lg">
                            <button type="button" className="btn btn-outline flex-1" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={`btn flex-1 flex justify-center items-center gap-2 ${actionModal.type === 'aprovada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                onClick={handleAvaliar}
                                disabled={submittingId === actionModal.id}
                            >
                                {submittingId === actionModal.id ? <Loader2 className="animate-spin" size={18} /> : actionModal.type === 'aprovada' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

export default AdminOcorrencias;
