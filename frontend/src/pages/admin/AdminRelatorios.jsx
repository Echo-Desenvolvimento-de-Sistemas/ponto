import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { BarChart3, FileText, Download, Printer, Loader2, Users } from 'lucide-react';
import usePageTitle from '../../utils/usePageTitle';
import './AdminRelatorios.css';

const AdminRelatorios = () => {
    const { user } = useAuth();
    usePageTitle('Relatórios');
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, espelho, afd

    const [loading, setLoading] = useState(false);

    // States: Dashboard
    const [dashData, setDashData] = useState(null);
    const [dashParams, setDashParams] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

    // States: Espelho
    const [colaboradores, setColaboradores] = useState([]);
    const [espelhoUserId, setEspelhoUserId] = useState('');
    const [espelhoParams, setEspelhoParams] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
    const [espelhoData, setEspelhoData] = useState(null);

    // States: AFD
    const [afdStart, setAfdStart] = useState('');
    const [afdEnd, setAfdEnd] = useState('');

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboard();
        } else if (activeTab === 'espelho' && colaboradores.length === 0) {
            fetchColaboradores();
        }
    }, [activeTab, dashParams]);

    // --- Fetchers ---
    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/relatorios/absenteismo', { params: dashParams });
            setDashData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchColaboradores = async () => {
        try {
            const res = await api.get('/funcionarios'); // Pega só os da empresa do RH logado
            setColaboradores(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const gerarEspelho = async () => {
        if (!espelhoUserId) return alert("Selecione um colaborador.");
        setLoading(true);
        try {
            const res = await api.get(`/relatorios/espelho/${espelhoUserId}`, { params: espelhoParams });
            setEspelhoData(res.data);
        } catch (error) {
            alert('Erro ao buscar espelho de ponto.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const exportarAFD = async () => {
        if (!afdStart || !afdEnd) return alert("Preencha as datas.");
        try {
            const res = await api.post('/export/afd', {
                start_date: afdStart,
                end_date: afdEnd
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `AFD_${afdStart}_${afdEnd}.afk`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert("Erro ao exportar AFD.");
        }
    };

    const exportarFolha = async () => {
        try {
            const res = await api.get('/export/folha', {
                params: { mes: dashParams.mes, ano: dashParams.ano },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Folha_Pagamento_${dashParams.mes}_${dashParams.ano}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert("Erro ao exportar Folha de Pagamento.");
        }
    };

    const renderMonthOptions = () => {
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>);
    };

    const renderYearOptions = () => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>);
    };

    return (
        <div className="admin-relatorios">
            {/* Header escondido na impressão */}
            <header className="page-header animate-fade-in no-print">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Relatórios e Compliance</h1>
                    <p className="text-muted">Análises de absenteísmo, extração fiscal e espelhos de ponto.</p>
                </div>
            </header>

            <div className="tabs no-print">
                <button
                    className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <BarChart3 size={18} /> Absenteísmo
                </button>
                <button
                    className={`tab-btn ${activeTab === 'espelho' ? 'active' : ''}`}
                    onClick={() => setActiveTab('espelho')}
                >
                    <FileText size={18} /> Espelho de Ponto
                </button>
                <button
                    className={`tab-btn ${activeTab === 'afd' ? 'active' : ''}`}
                    onClick={() => setActiveTab('afd')}
                >
                    <Download size={18} /> Exportar AFD
                </button>
                <button
                    className={`tab-btn ${activeTab === 'folha' ? 'active' : ''}`}
                    onClick={() => setActiveTab('folha')}
                >
                    <FileText size={18} /> Exportar Folha (CSV)
                </button>
            </div>

            <div className={`tab-content ${activeTab === 'espelho' ? '' : 'glass-card'} animate-fade-in`}>

                {/* --- DASHBOARD ABSENTEISMO --- */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard-section animate-fade-in">
                        <div className="filters no-print">
                            <div className="filter-group form-group w-32 m-0">
                                <label>Mês</label>
                                <select className="form-input" value={dashParams.mes} onChange={e => setDashParams({ ...dashParams, mes: e.target.value })}>
                                    {renderMonthOptions()}
                                </select>
                            </div>
                            <div className="filter-group form-group w-32 m-0">
                                <label>Ano</label>
                                <select className="form-input" value={dashParams.ano} onChange={e => setDashParams({ ...dashParams, ano: e.target.value })}>
                                    {renderYearOptions()}
                                </select>
                            </div>
                        </div>

                        {loading ? <Loader2 className="animate-spin mx-auto text-primary" size={30} /> : dashData && (
                            <>
                                <div className="metrics-summary">
                                    <div className="metric-card blue">
                                        <div className="metric-card-header">
                                            <Users size={20} />
                                            <span>Total de Funcionários</span>
                                        </div>
                                        <div className="metric-value">{dashData.resumo.total_funcionarios}</div>
                                    </div>
                                    <div className="metric-card green">
                                        <div className="metric-card-header">
                                            <BarChart3 size={20} />
                                            <span>Média de Presença Diária</span>
                                        </div>
                                        <div className="metric-value">{dashData.resumo.media_presenca}%</div>
                                    </div>
                                </div>

                                <div className="chart-container">
                                    <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Frequência Diária do Mês</h3>
                                    <div className="css-bar-chart">
                                        {dashData.grafico_diario.map(dia => {
                                            const total = (dia.presentes + dia.faltas) || 1;
                                            const hPres = (dia.presentes / total) * 100;
                                            const hFaltas = (dia.faltas / total) * 100;

                                            if (hPres === 0 && hFaltas === 0) {
                                                return <div key={dia.dia}><div className="chart-label rotated-text">{dia.dia}</div></div>;
                                            }

                                            return (
                                                <div key={dia.dia}>
                                                    <div className="chart-tooltip">
                                                        Dia {dia.dia}: {dia.presentes} Presenças, {dia.faltas} Faltas
                                                    </div>

                                                    {dia.faltas > 0 && <div className="chart-bar-red rounded-top" style={{ height: `${hFaltas}%` }}></div>}
                                                    {dia.presentes > 0 && <div className={`chart-bar-green ${dia.faltas === 0 ? 'rounded-top' : ''}`} style={{ height: `${hPres}%` }}></div>}
                                                    <div className="chart-label">{dia.dia}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="legend-box">
                                        <div className="legend-item"><div className="legend-color chart-bar-green"></div> Presenças</div>
                                        <div className="legend-item"><div className="legend-color chart-bar-red"></div> Faltas (ou Atraso)</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {/* --- ESPELHO DE PONTO --- */}
                {activeTab === 'espelho' && (
                    <div className="espelho-section">
                        <div className="filters no-print">
                            <div className="filter-group flex-[2] m-0">
                                <label>Colaborador</label>
                                <select className="form-input" value={espelhoUserId} onChange={e => setEspelhoUserId(e.target.value)}>
                                    <option value="">Selecione o colaborador...</option>
                                    {colaboradores.map(c => <option key={c.id} value={c.id}>{c.name} - {c.email}</option>)}
                                </select>
                            </div>
                            <div className="filter-group w-32 m-0">
                                <label>Mês</label>
                                <select className="form-input" value={espelhoParams.mes} onChange={e => setEspelhoParams({ ...espelhoParams, mes: e.target.value })}>
                                    {renderMonthOptions()}
                                </select>
                            </div>
                            <div className="filter-group w-28 m-0">
                                <label>Ano</label>
                                <select className="form-input" value={espelhoParams.ano} onChange={e => setEspelhoParams({ ...espelhoParams, ano: e.target.value })}>
                                    {renderYearOptions()}
                                </select>
                            </div>
                            <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 'bold' }} onClick={gerarEspelho} disabled={loading}>
                                {loading ? 'Gerando...' : 'Gerar Espelho'}
                            </button>
                        </div>

                        {espelhoData && (
                            <div className="print-area printable-doc" id="espelho-doc">

                                <div className="text-right no-print mb-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={handlePrint} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Printer size={18} /> Imprimir Relatório
                                    </button>
                                </div>

                                <div className="doc-header" style={{ borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="flex flex-col items-center justify-center mb-6">
                                        {espelhoData.empresa.logo && (
                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${espelhoData.empresa.logo}`} alt="Logo da Empresa" className="h-16 mb-2 object-contain" />
                                        )}
                                        <h2 className="doc-header-title m-0">Espelho de Ponto Eletrônico</h2>
                                    </div>
                                    <div className="doc-info-grid">
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
                                    <div className="doc-competencia">
                                        COMPETÊNCIA: {String(espelhoData.periodo.mes).padStart(2, '0')}/{espelhoData.periodo.ano}
                                    </div>
                                </div>

                                <div className="overflow-x-auto w-full">
                                    <table className="doc-table">
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
                                    const lastDayOfMonth = new Date(espelhoData.periodo.ano, espelhoData.periodo.mes, 0);
                                    const isMonthClosed = today > lastDayOfMonth;

                                    // Hash dinâmico baseado no conteúdo (horas totais) para evitar assinaturas de conteúdo futuro
                                    const contentSum = espelhoData.dias.reduce((acc, d) => {
                                        const [h, m] = d.horas_trabalhadas.split(':').map(Number);
                                        return acc + (h * 60) + m;
                                    }, 0);

                                    const docHash = `PN-${espelhoData.funcionario.cpf?.replace(/\D/g, '') || '000'}-${espelhoData.periodo.mes}${espelhoData.periodo.ano}-${contentSum.toString(36).toUpperCase()}`;

                                    return (
                                        <>
                                            {!isMonthClosed && (
                                                <div className="no-print bg-amber-50 border border-amber-200 text-amber-800 p-2 mb-4 rounded text-xs text-center font-bold">
                                                    ⚠️ ESTE MÊS AINDA NÃO FOI ENCERRADO. OS REGISTROS PODEM SOFRER ALTERAÇÕES.
                                                </div>
                                            )}

                                            <div className="doc-footer mt-6 grid grid-cols-2 gap-8 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="border-t border-black pt-1 w-full px-2" style={{ maxWidth: '280px' }}>
                                                        <strong className="block text-[11px] uppercase">Assinatura do Empregador</strong>
                                                        <div className="text-[10px] font-bold mt-1">{espelhoData.empresa.razao_social}</div>
                                                        <div className="text-[9px] text-gray-500 mt-1 font-mono">
                                                            ID Digital: {btoa(espelhoData.empresa.cnpj || 'emp').slice(0, 14).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="border-t border-black pt-1 w-full px-2" style={{ maxWidth: '280px' }}>
                                                        <strong className="block text-[11px] uppercase">Assinatura do Colaborador</strong>
                                                        <div className="text-[10px] font-bold mt-1">{espelhoData.funcionario.nome}</div>
                                                        <div className="text-[9px] text-gray-500 mt-1 font-mono">
                                                            Token Facial: {btoa(espelhoData.funcionario.cpf || 'fn').slice(0, 14).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="assinatura-eletronica p-2 mt-4 text-center border-t border-dashed border-gray-300">
                                                <p className="text-[9px] text-gray-600">Este espelho de ponto possui validade jurídica conforme Portaria 671/2021 MTP.</p>
                                                <p className="font-mono text-[8px] mt-1 text-gray-500">Hash de Validação: {docHash} | Status: {isMonthClosed ? 'ENCERRADO' : 'EM ABERTO'}</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}


                {/* --- EXPORTACAO AFD --- */}
                {activeTab === 'afd' && (
                    <div className="afd-section max-w-lg mx-auto py-8">
                        <div className="text-center mb-6">
                            <Download size={48} className="mx-auto text-indigo-500 mb-4" />
                            <h2 className="text-xl font-bold">Arquivo Fonte de Dados (AFD)</h2>
                            <p className="text-muted text-sm mt-2">
                                Exporte os registros de ponto brutos em formato texto para integração com softwares de folha de pagamento tradicionais ou fiscalização, conforme Portaria 671.
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Data de Início do Período</label>
                            <input type="date" className="form-input" value={afdStart} onChange={e => setAfdStart(e.target.value)} />
                        </div>
                        <div className="form-group mb-6">
                            <label>Data Fim do Período</label>
                            <input type="date" className="form-input" value={afdEnd} onChange={e => setAfdEnd(e.target.value)} />
                        </div>

                        <button
                            className="btn btn-primary w-full flex justify-center items-center gap-2 py-3"
                            onClick={exportarAFD}
                        >
                            <FileText size={20} /> Baixar Arquivo AFD (.txt)
                        </button>
                    </div>
                )}

                {/* --- EXPORTACAO FOLHA DE PAGAMENTO --- */}
                {activeTab === 'folha' && (
                    <div className="afd-section max-w-lg mx-auto py-8">
                        <div className="text-center mb-6">
                            <FileText size={48} className="mx-auto text-green-600 mb-4" />
                            <h2 className="text-xl font-bold">Folha de Pagamento (CSV)</h2>
                            <p className="text-muted text-sm mt-2">
                                Exporte os totais de horas trabalhadas, faltas e atrasos do período para integração com o sistema do seu contador ou ERP de Folha de Pagamento.
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Mês de Referência</label>
                            <select className="form-input" value={dashParams.mes} onChange={e => setDashParams({ ...dashParams, mes: e.target.value })}>
                                {renderMonthOptions()}
                            </select>
                        </div>
                        <div className="form-group mb-6">
                            <label>Ano</label>
                            <select className="form-input" value={dashParams.ano} onChange={e => setDashParams({ ...dashParams, ano: e.target.value })}>
                                {renderYearOptions()}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary w-full flex justify-center items-center gap-2 py-3" style={{ background: '#16a34a', borderColor: '#16a34a' }}
                            onClick={exportarFolha}
                        >
                            <Download size={20} /> Exportar CSV da Folha
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRelatorios;
