import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText, CheckCircle2, Clock, Loader2, AlertTriangle, Timer, PenTool, Printer, X, AlarmClockPlus } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import HelpModal from '../../components/HelpModal';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import FloatingIconsLoader from '../../components/ui/FloatingIconsLoader';
import './FuncionarioLayout.css';
import './Historico.css';

const HELP_SECTIONS = [
    {
        heading: 'O que é esta página?',
        items: [
            'Aqui você pode visualizar o histórico de todos os pontos registrados em qualquer mês.',
            'Os cards de resumo mostram suas horas trabalhadas, dias presentes, faltas e atrasos do período.',
        ],
    },
    {
        heading: 'Como usar',
        items: [
            'Use as setas para navegar entre os meses.',
            'Cada dia é agrupado com todos os registros de entrada e saída.',
            'Registros com badge verde são entradas; registros roxos são saídas.',
            'Registros com ✏️ foram inseridos manualmente por ajuste aprovado.',
        ],
    },
];

const Historico = () => {
    usePageTitle('Histórico de Pontos');
    const { user } = useAuth();
    const [mesAtual, setMesAtual] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEspelhoModal, setShowEspelhoModal] = useState(false);
    const [espelhoData, setEspelhoData] = useState(null);
    const [isSigning, setIsSigning] = useState(false);

    const mes = mesAtual.getMonth() + 1;
    const ano = mesAtual.getFullYear();

    const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchData();
    }, [mes, ano]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pontosRes, resumoRes] = await Promise.all([
                api.get('/registro-pontos', { params: { mes, ano } }),
                api.get('/registro-pontos/resumo-mensal', { params: { mes, ano } }),
            ]);
            setRecords(pontosRes.data);
            setResumo(resumoRes.data);
        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar registros por dia
    const grouped = records.reduce((acc, ponto) => {
        const date = ponto.horario_dispositivo?.slice(0, 10) || ponto.created_at?.slice(0, 10);
        if (!acc[date]) acc[date] = [];
        acc[date].push(ponto);
        return acc;
    }, {});

    const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const formatDate = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Hoje';
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getTipoBadge = (tipo) => {
        const map = {
            entrada: { label: 'Entrada', cls: 'badge-entrada' },
            saida: { label: 'Saída', cls: 'badge-saida' },
        };
        return map[tipo] || { label: tipo, cls: '' };
    };

    const fetchEspelho = async () => {
        try {
            const res = await api.get(`/relatorios/espelho/${user.id}`, { params: { mes, ano } });
            setEspelhoData(res.data);
            setShowEspelhoModal(true);
        } catch (err) {
            console.error(err);
            alert('Não foi possível carregar o espelho. Tente novamente mais tarde.');
        }
    };

    const handleAssinarEspelho = async () => {
        if (!window.confirm('Ao assinar, você concorda com os registros apresentados. Deseja continuar?')) return;
        setIsSigning(true);
        try {
            const res = await api.post(`/relatorios/espelho/${user.id}/assinar`, { mes, ano });
            const fetchRes = await api.get(`/relatorios/espelho/${user.id}`, { params: { mes, ano } });
            setEspelhoData(fetchRes.data);
            alert('Assinatura realizada com sucesso!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao assinar.');
        } finally {
            setIsSigning(false);
        }
    };

    const prevMonth = () => setMesAtual(new Date(ano, mes - 2, 1));
    const nextMonth = () => setMesAtual(new Date(ano, mes, 1));
    const isFutureMonth = () => new Date(ano, mes - 1) > new Date();

    return (
        <div className="funcionario-page-wrapper">
            {/* Header */}
            <div className="func-page-header animate-fade-in">
                <div>
                    <h2 className="func-page-title">Histórico de Ponto</h2>
                    <p className="func-page-subtitle">Consulte seus registros e espelhos.</p>
                </div>
            </div>

            <div className="func-page-content">

                {/* Seletor de Mês */}
                <div className="month-selector glass-card animate-fade-in">
                    <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
                    <div className="current-month">
                        <Calendar size={18} className="text-primary-color" />
                        <span>{mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <button className="icon-btn" onClick={nextMonth} disabled={isFutureMonth()}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Cards de Resumo */}
                {resumo && (
                    <div className="historico-summary-grid animate-fade-in" style={{ animationDelay: '0.05s' }}>
                        <div className="summary-box glass-card">
                            <span className="box-label"><Timer size={14} /> Horas Trabalhadas</span>
                            <span className="box-value">{(() => {
                                if (!resumo) return '0h 00m';
                                let addMinutes = 0;
                                if (resumo.inicio_intervalo_atual) {
                                    const start = new Date(resumo.inicio_intervalo_atual).getTime();
                                    addMinutes = Math.floor((currentTimeMs - start) / 60000);
                                }
                                if (resumo.base_minutos_totais === undefined) {
                                    return resumo.horas_trabalhadas || '0h 00m';
                                }
                                const total = Math.round(resumo.base_minutos_totais + addMinutes);
                                const h = Math.floor(total / 60);
                                const m = total % 60;
                                return `${h}h ${String(m).padStart(2, '0')}m`;
                            })()}</span>
                        </div>
                        <div className="summary-box glass-card">
                            <span className="box-label"><CheckCircle2 size={14} /> Dias Presentes</span>
                            <span className="box-value">{resumo.dias_presentes ?? 0}</span>
                        </div>
                        <div className="summary-box glass-card">
                            <span className="box-label"><AlertTriangle size={14} /> Faltas</span>
                            <span className="box-value" style={{ color: resumo.faltas > 0 ? '#ef4444' : 'inherit' }}>
                                {resumo.faltas ?? 0}
                            </span>
                        </div>
                        <div className="summary-box glass-card" style={{ gridColumn: 'span 2' }}>
                            <button className="btn btn-primary w-full h-full flex items-center justify-center gap-2 font-bold" onClick={fetchEspelho}>
                                <FileText size={18} /> Acessar Folha de Ponto
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de Registros */}
                <div className="records-list glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="records-header">
                        <h3>Registros do Mês</h3>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>{records.length} registros</span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-4">
                            <FloatingIconsLoader Icon={AlarmClockPlus} size={40} count={3} />
                            <span className="text-muted text-sm">Carregando registros...</span>
                        </div>
                    ) : days.length === 0 ? (
                        <div className="empty-state p-8 text-center">
                            <FileText size={40} className="text-muted mb-3 mx-auto" />
                            <p className="text-muted">Nenhum registro neste mês.</p>
                        </div>
                    ) : (
                        <div className="records-items">
                            {days.map(day => (
                                <div key={day} className="record-day-group">
                                    <div className="record-day-label">{formatDate(day)}</div>
                                    {grouped[day].map((ponto, i) => {
                                        const badge = getTipoBadge(ponto.tipo);
                                        return (
                                            <div key={i} className="record-item">
                                                <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                                                <span>{formatTime(ponto.horario_dispositivo)}</span>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {ponto.metodo_autenticacao === 'ajuste_manual_aprovado' ? '✏️ Ajuste manual' : '📍 GPS'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div> {/* records-list */}
            </div> {/* func-page-content */}

            {/* Modal de Espelho de Ponto / Assinatura */}
            {showEspelhoModal && espelhoData && (
                <div className="comprovante-modal-overlay animate-fade-in" style={{ zIndex: 99999 }}>
                    <div className="comprovante-modal glass-card" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }} id="espelho-doc-modal">
                        <button className="modal-close-btn no-print" onClick={() => setShowEspelhoModal(false)} style={{ zIndex: 10, top: '10px', right: '10px' }}>
                            <X size={24} />
                        </button>

                        <div className="p-8 bg-white printable-doc" id="espelho-doc">
                            <div className="doc-header border-b-2 border-black pb-4 mb-6">
                                <div className="flex flex-col items-center justify-center mb-6">
                                    {espelhoData.empresa.logo && (
                                        <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${espelhoData.empresa.logo}`} alt="Logo da Empresa" className="h-16 mb-2 object-contain" />
                                    )}
                                    <h2 className="doc-header-title m-0" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Espelho de Ponto Eletrônico</h2>
                                </div>
                                <div className="doc-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div className="doc-info-box">
                                        <strong style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Dados do Empregador</strong>
                                        <strong style={{ fontSize: '1rem' }}>{espelhoData.empresa.razao_social}</strong><br />
                                        CNPJ/CEI: {espelhoData.empresa.cnpj}<br />
                                    </div>
                                    <div className="doc-info-box">
                                        <strong style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Dados do Colaborador</strong>
                                        <strong style={{ fontSize: '1rem' }}>{espelhoData.funcionario.nome}</strong><br />
                                        Cargo: {espelhoData.funcionario.cargo || 'Não informado'}<br />
                                        PIS/PASEP: {espelhoData.funcionario.pis || 'Não informado'}<br />
                                        CPF: {espelhoData.funcionario.cpf || 'Não informado'}
                                    </div>
                                </div>
                                <div className="doc-competencia" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                                    COMPETÊNCIA: {String(espelhoData.periodo.mes).padStart(2, '0')}/{espelhoData.periodo.ano}
                                </div>
                            </div>

                            <div className="overflow-x-auto w-full">
                                <table className="doc-table w-full text-sm" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black p-1 text-center w-10">Dia</th>
                                            <th className="border border-black p-1 text-left">Dia Semana</th>
                                            <th className="border border-black p-1 text-left">Registros</th>
                                            <th className="border border-black p-1 text-center bg-gray-200">Total HTrabalho</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {espelhoData.dias.map(d => (
                                            <tr key={d.data} className={d.is_fim_semana ? 'bg-gray-50 text-gray-500' : ''}>
                                                <td className="border border-black p-1 text-center font-bold">{d.data.split('-')[2]}</td>
                                                <td className="border border-black p-1 text-left capitalize">{d.dia_semana.substring(0, 3)}.</td>
                                                <td className="border border-black p-1 text-left font-mono">
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {d.registros && d.registros.map((r, i) => (
                                                            <span key={i} title={r.tipo} style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                                {r.hora}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="border border-black p-1 text-center font-mono font-bold bg-gray-100">{d.horas_trabalhadas}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {(() => {
                                const today = new Date();
                                const lastDayOfMonth = new Date(ano, mes, 0); // Último dia do mês selecionado
                                const isMonthClosed = today > lastDayOfMonth;

                                // Se o mês está aberto, SEMPRE ignoramos validade de assinatura final para fins de exibição de trava
                                if (!isMonthClosed) {
                                    return (
                                        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg text-center no-print">
                                            <Clock className="mx-auto text-blue-500 mb-2" size={28} />
                                            <h3 className="text-blue-800 font-bold mb-1">Mês em Aberto (Extrato Parcial)</h3>
                                            <p className="text-blue-700 text-sm mb-2">Este documento é apenas para conferência e <strong>não possui validade jurídica</strong> como fechamento de ponto enquanto o mês estiver em curso.</p>
                                            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold uppercase">Assinatura Bloqueada até {new Date(ano, mes, 1).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    );
                                }

                                // Se o mês fechou e já assinou
                                if (espelhoData.assinatura) {
                                    return (
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center mb-6">
                                            <div className="flex justify-center text-green-600 mb-2"><CheckCircle2 size={32} /></div>
                                            <h3 className="text-green-800 font-bold">Documento Final Assinado Digitalmente</h3>
                                            <p className="text-xs text-green-700 mt-2 break-all">{espelhoData.assinatura.hash_assinatura}</p>
                                            <p className="text-xs text-green-600 mt-1">Selo de Integridade Gerado em: {new Date(espelhoData.assinatura.data_assinatura).toLocaleString('pt-BR')}</p>
                                        </div>
                                    );
                                }

                                // Mês fechado mas falta assinar
                                return (
                                    <div className="mb-6 p-4 border border-orange-200 bg-orange-50 rounded-lg text-center no-print">
                                        <AlertTriangle className="mx-auto text-orange-500 mb-2" size={28} />
                                        <h3 className="text-orange-800 font-bold mb-1">Fechamento Requerido</h3>
                                        <p className="text-orange-700 text-sm mb-3">O mês de {mesAtual.toLocaleDateString('pt-BR', { month: 'long' })} foi encerrado. Revise seus horários e realize a assinatura digital definitiva.</p>
                                        <button
                                            className="btn btn-primary w-full flex justify-center items-center gap-2"
                                            onClick={handleAssinarEspelho}
                                            disabled={isSigning}
                                            style={{ background: '#ea580c', color: 'white', border: 'none' }}
                                        >
                                            {isSigning ? <Loader2 className="animate-spin" size={18} /> : <PenTool size={18} />}
                                            Efetuar Assinatura Digital do Fechamento
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="mt-4 p-4 flex gap-2 no-print border-t">
                            <button className="btn w-full flex justify-center items-center gap-2" style={{ background: '#f3f4f6' }} onClick={() => window.print()}>
                                <Printer size={18} /> Imprimir Cópia
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal title="Histórico de Ponto" sections={HELP_SECTIONS} />
        </div>
    );
};

export default Historico;
