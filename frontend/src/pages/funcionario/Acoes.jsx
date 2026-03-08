import React, { useState, useEffect } from 'react';
import { FileUp, AlertTriangle, MessageSquarePlus, ChevronRight, X, Loader2, CheckCircle2, Clock, XCircle, Zap, AlarmClockPlus } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import HelpModal from '../../components/HelpModal';
import api from '../../api/axios';
import FloatingIconsLoader from '../../components/ui/FloatingIconsLoader';
import './FuncionarioLayout.css';
import './Acoes.css';

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

const HELP_SECTIONS = [
    {
        heading: 'O que é esta página?',
        items: [
            'Aqui você pode abrir solicitações para o RH — atestados, correções de ponto e justificativas de falta.',
            'Todas as solicitações são analisadas pelo seu gestor antes de serem aprovadas.',
        ],
    },
    {
        heading: 'Como usar',
        items: [
            'Clique em "Enviar Atestado Médico" para anexar um documento (PDF, JPG ou PNG).',
            'Clique em "Solicitar Correção de Ponto" se esqueceu de bater o ponto — informe o horário correto.',
            'Clique em "Justificar Falta" para registrar uma ausência com justificativa.',
            'Acompanhe o status das suas solicitações na lista abaixo: Pendente (aguardando), Aprovada ou Rejeitada.',
        ],
    },
];

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
            await api.post('/ocorrencias', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
                    <h2>Nova Solicitação</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Tipo de Solicitação</label>
                        <select className="form-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                            {Object.entries(TIPO_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Data da Ocorrência</label>
                        <input type="date" className="form-input" value={form.data_ocorrencia}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setForm({ ...form, data_ocorrencia: e.target.value })} required />
                    </div>

                    {precisaHorario && (
                        <div className="form-group">
                            <label className="form-label">Horário Sugerido</label>
                            <input type="time" className="form-input" value={form.horario_sugerido}
                                onChange={e => setForm({ ...form, horario_sugerido: e.target.value })} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Justificativa {!precisaAnexo && <span className="text-muted">(opcional)</span>}</label>
                        <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }}
                            placeholder="Descreva o motivo..."
                            value={form.justificativa}
                            onChange={e => setForm({ ...form, justificativa: e.target.value })}
                            required={precisaAnexo} />
                    </div>

                    {precisaAnexo && (
                        <div className="form-group">
                            <label className="form-label">Documento (PDF, JPG, PNG — máx. 5MB)</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-input"
                                onChange={e => setAnexo(e.target.files[0])} />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancelar</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Acoes = () => {
    usePageTitle('Ações');
    const [ocorrencias, setOcorrencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { fetchOcorrencias(); }, []);

    const fetchOcorrencias = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ocorrencias');
            setOcorrencias(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        setSuccessMsg('Solicitação enviada! Aguarde aprovação do gestor.');
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchOcorrencias();
    };

    const openModal = (tipo) => { setModalTipo(tipo); setShowModal(true); };

    return (
        <div className="funcionario-page-wrapper">
            {/* Header igual ao BaterPonto */}
            <div className="func-page-header animate-fade-in">
                <div>
                    <h2 className="func-page-title">Ações</h2>
                    <p className="func-page-subtitle">Solicitações, abonos e correções.</p>
                </div>
            </div>

            <div className="func-page-content animate-fade-in">

                {successMsg && (
                    <div className="success-toast">
                        <CheckCircle2 size={18} /> {successMsg}
                    </div>
                )}

                {/* Ações rápidas */}
                <div className="acoes-section-label">Abrir Solicitação</div>

                <button className="action-card glass-card" onClick={() => openModal('atestado')}>
                    <div className="action-icon blue-tint"><FileUp size={22} /></div>
                    <div className="action-text">
                        <h3>Enviar Atestado Médico</h3>
                        <p>Justifique faltas ou atrasos com documento.</p>
                    </div>
                    <ChevronRight className="action-chevron" size={20} />
                </button>

                <button className="action-card glass-card" onClick={() => openModal('esquecimento_entrada')}>
                    <div className="action-icon orange-tint"><AlertTriangle size={22} /></div>
                    <div className="action-text">
                        <h3>Solicitar Correção de Ponto</h3>
                        <p>Esqueceu de registrar? Solicite o ajuste.</p>
                    </div>
                    <ChevronRight className="action-chevron" size={20} />
                </button>

                <button className="action-card glass-card" onClick={() => openModal('falta_justificada')}>
                    <div className="action-icon purple-tint"><MessageSquarePlus size={22} /></div>
                    <div className="action-text">
                        <h3>Justificar Falta</h3>
                        <p>Ausência justificada por motivo particular.</p>
                    </div>
                    <ChevronRight className="action-chevron" size={20} />
                </button>

                {/* Lista de solicitações */}
                <div className="acoes-section-label" style={{ marginTop: '0.5rem' }}>Minhas Solicitações</div>

                <div className="glass-card">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-4">
                            <FloatingIconsLoader Icon={AlarmClockPlus} size={40} count={3} />
                            <span className="text-muted text-sm">Sincronizando...</span>
                        </div>
                    ) : ocorrencias.length === 0 ? (
                        <div className="empty-state">
                            <Zap size={36} className="empty-icon" />
                            <p>Nenhuma solicitação enviada.</p>
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
                                            {st.icon} {st.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <HelpModal title="Como usar Ações" sections={HELP_SECTIONS} />

            {showModal && (
                <ModalOcorrencia tipo={modalTipo} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
            )}
        </div>
    );
};

export default Acoes;
