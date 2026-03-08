import React, { useState, useEffect } from 'react';
import { FileUp, AlertTriangle, MessageSquarePlus, ChevronRight, X, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import api from '../../api/axios';
import './Ajustes.css';

const STATUS_CONFIG = {
    pendente: { label: 'Pendente', icon: <Clock size={14} />, cls: 'status-pendente' },
    aprovada: { label: 'Aprovada', icon: <CheckCircle2 size={14} />, cls: 'status-aprovada' },
    rejeitada: { label: 'Rejeitada', icon: <XCircle size={14} />, cls: 'status-rejeitada' },
};

const TIPO_LABELS = {
    esquecimento_entrada: 'Esquecimento de Entrada',
    esquecimento_saida: 'Esquecimento de Saída',
    falta_justificada: 'Falta Justificada',
    atestado: 'Atestado Médico',
    outro: 'Outros',
};

const ModalOcorrencia = ({ tipo: tipoInicial, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        tipo: tipoInicial || 'esquecimento_entrada',
        data_ocorrencia: new Date().toISOString().slice(0, 10),
        horario_sugerido: '',
        justificativa: '',
    });
    const [anexo, setAnexo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        if (anexo) fd.append('anexo', anexo);

        try {
            await api.post('/ocorrencias', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao enviar solicitação.');
        } finally {
            setSubmitting(false);
        }
    };

    const precisaHorario = ['esquecimento_entrada', 'esquecimento_saida'].includes(form.tipo);
    const precisaAnexo = form.tipo === 'atestado';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-bold">Nova Solicitação</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4 border border-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-body flex flex-col gap-4">
                    <div className="form-group">
                        <label className="form-label">Tipo de Solicitação</label>
                        <select
                            className="form-input"
                            value={form.tipo}
                            onChange={e => setForm({ ...form, tipo: e.target.value })}
                        >
                            {Object.entries(TIPO_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Data da Ocorrência</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.data_ocorrencia}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setForm({ ...form, data_ocorrencia: e.target.value })}
                            required
                        />
                    </div>

                    {precisaHorario && (
                        <div className="form-group">
                            <label className="form-label">Horário Sugerido</label>
                            <input
                                type="time"
                                className="form-input"
                                value={form.horario_sugerido}
                                onChange={e => setForm({ ...form, horario_sugerido: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Justificativa {!precisaAnexo && <span className="text-muted">(opcional)</span>}</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            placeholder="Descreva o motivo da solicitação..."
                            value={form.justificativa}
                            onChange={e => setForm({ ...form, justificativa: e.target.value })}
                            required={precisaAnexo}
                        />
                    </div>

                    {precisaAnexo && (
                        <div className="form-group">
                            <label className="form-label">Documento (PDF, JPG, PNG — máx. 5MB)</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="form-input"
                                onChange={e => setAnexo(e.target.files[0])}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Solicitação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Ajustes = () => {
    usePageTitle('Ajustes');
    const [ocorrencias, setOcorrencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchOcorrencias();
    }, []);

    const fetchOcorrencias = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ocorrencias');
            setOcorrencias(res.data);
        } catch (err) {
            console.error('Erro ao carregar ocorrências:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        setSuccessMsg('Solicitação enviada com sucesso! Aguarde aprovação do gestor.');
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchOcorrencias();
    };

    const openModal = (tipo) => {
        setModalTipo(tipo);
        setShowModal(true);
    };

    return (
        <div className="mobile-page-wrapper">
            <div className="page-header animate-fade-in">
                <h2>Ajustes & RH</h2>
                <p>Solicitações, abonos e correções de ponto.</p>
            </div>

            <div className="ajustes-content animate-fade-in" style={{ animationDelay: '0.1s' }}>

                {successMsg && (
                    <div className="success-toast animate-fade-in" style={{ marginBottom: '1rem' }}>
                        <CheckCircle2 size={18} /> {successMsg}
                    </div>
                )}

                {/* Ações */}
                <button className="action-card glass-card" onClick={() => openModal('atestado')}>
                    <div className="card-icon-area blue-tint">
                        <FileUp size={24} />
                    </div>
                    <div className="card-text-area">
                        <h3>Enviar Atestado Médico</h3>
                        <p>Justifique faltas ou atrasos com documento.</p>
                    </div>
                    <ChevronRight className="chevron" size={20} />
                </button>

                <button className="action-card glass-card" onClick={() => openModal('esquecimento_entrada')}>
                    <div className="card-icon-area orange-tint">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="card-text-area">
                        <h3>Solicitar Correção de Ponto</h3>
                        <p>Esqueceu de bater? Solicite o ajuste manual.</p>
                    </div>
                    <ChevronRight className="chevron" size={20} />
                </button>

                <button className="action-card glass-card" onClick={() => openModal('falta_justificada')}>
                    <div className="card-icon-area" style={{ background: 'var(--badge-purple-bg)', color: 'var(--primary-color)' }}>
                        <MessageSquarePlus size={24} />
                    </div>
                    <div className="card-text-area">
                        <h3>Justificar Falta</h3>
                        <p>Ausência justificada por motivo particular.</p>
                    </div>
                    <ChevronRight className="chevron" size={20} />
                </button>

                {/* Histórico de Solicitações */}
                <div className="glass-card section-card">
                    <div className="section-header">
                        <h3 className="section-title">Minhas Solicitações</h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-6">
                            <Loader2 className="animate-spin text-primary-color" size={28} />
                        </div>
                    ) : ocorrencias.length === 0 ? (
                        <div className="empty-state">
                            <MessageSquarePlus size={32} className="empty-icon text-gray-300 mb-2" />
                            <p className="empty-text">Nenhuma solicitação enviada.</p>
                        </div>
                    ) : (
                        <div className="ocorrencias-list">
                            {ocorrencias.map(oc => {
                                const st = STATUS_CONFIG[oc.status] || STATUS_CONFIG.pendente;
                                return (
                                    <div key={oc.id} className="ocorrencia-item">
                                        <div className="ocorrencia-info">
                                            <span className="ocorrencia-tipo">{TIPO_LABELS[oc.tipo] || oc.tipo}</span>
                                            <span className="ocorrencia-data">
                                                {new Date(oc.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <span className={`ocorrencia-status ${st.cls}`}>
                                            {st.icon}
                                            {st.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <ModalOcorrencia
                    tipo={modalTipo}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default Ajustes;
