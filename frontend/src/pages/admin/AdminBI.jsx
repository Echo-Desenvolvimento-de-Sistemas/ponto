import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useWhitelabel } from '../../contexts/WhitelabelContext';
import usePageTitle from '../../utils/usePageTitle';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, BarChart4, DollarSign, Users, Loader2 } from 'lucide-react';
import './AdminBI.css';

const AdminBI = () => {
    usePageTitle('BI & Analytics');
    const { primaryColor } = useWhitelabel();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    // Filters
    const [params, setParams] = useState({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear()
    });

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const anos = [2024, 2025, 2026, 2027];

    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
    }, [primaryColor]);

    useEffect(() => {
        fetchBI();
    }, [params]);

    const fetchBI = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bi/dashboard', { params });
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const { resumo, top_atrasos, grafico_tendencia } = data || {};

    return (
        <div className="admin-bi-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Inteligência de RH (BI)</h1>
                    <p className="text-gray-500 mt-1 text-sm">Visão analítica de custos, absenteísmo e conformidade.</p>
                </div>
                <div className="filters-row">
                    <select className="form-input custom-select w-32" value={params.mes} onChange={e => setParams({ ...params, mes: e.target.value })}>
                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="form-input custom-select w-28" value={params.ano} onChange={e => setParams({ ...params, ano: e.target.value })}>
                        {anos.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {data && (
                <>
                    {/* KPI Cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card glass-card">
                            <div className="kpi-icon-wrapper red">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="kpi-info">
                                <h3>Absenteísmo</h3>
                                <div className="kpi-value">{resumo.taxa_absenteismo}%</div>
                                <p className="kpi-subtext">Taxa de faltas do mês</p>
                            </div>
                        </div>

                        <div className="kpi-card glass-card">
                            <div className="kpi-icon-wrapper orange">
                                <Users size={24} />
                            </div>
                            <div className="kpi-info">
                                <h3>Dias Perdidos</h3>
                                <div className="kpi-value">{resumo.faltas_mes}</div>
                                <p className="kpi-subtext">Soma de faltas inteiras</p>
                            </div>
                        </div>

                        <div className="kpi-card glass-card">
                            <div className="kpi-icon-wrapper blue">
                                <Clock size={24} />
                            </div>
                            <div className="kpi-info">
                                <h3>Horas Extras Projetadas</h3>
                                <div className="kpi-value">{resumo.horas_extras}h</div>
                                <p className="kpi-subtext">Horas excedentes a pagar</p>
                            </div>
                        </div>

                        <div className="kpi-card glass-card">
                            <div className="kpi-icon-wrapper green">
                                <DollarSign size={24} />
                            </div>
                            <div className="kpi-info">
                                <h3>Custo Estimado (HE)</h3>
                                <div className="kpi-value">R$ {resumo.custo_extra_estimado.toFixed(2)}</div>
                                <p className="kpi-subtext">Previsão financeira</p>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid mt-6">
                        {/* Gráfico de Evolução (Absenteísmo vs Horas Extras) */}
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <h3><BarChart4 size={18} /> Tendência Semanal</h3>
                                <div className="chart-legend">
                                    <span className="legend-item"><div className="dot red"></div> Absenteísmo (%)</span>
                                    <span className="legend-item"><div className="dot blue"></div> Horas Extras (h)</span>
                                </div>
                            </div>
                            <div className="trend-chart-area">
                                {grafico_tendencia.map((item, idx) => {
                                    // Scale for chart visualization (max height 150px)
                                    const hAbs = Math.min((item.absenteismo / 10) * 100, 100);
                                    const hHe = Math.min((item.he / 50) * 100, 100);

                                    return (
                                        <div key={idx} className="trend-column">
                                            <div className="trend-bars">
                                                <div className="trend-bar red-bar" style={{ height: `${hAbs}%` }} title={`Absenteísmo: ${item.absenteismo}%`}>
                                                    <span className="trend-val">{item.absenteismo}%</span>
                                                </div>
                                                <div className="trend-bar blue-bar" style={{ height: `${hHe}%` }} title={`Horas Extras: ${item.he}h`}>
                                                    <span className="trend-val">{item.he}h</span>
                                                </div>
                                            </div>
                                            <div className="trend-label">{item.semana}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Ranking de Atrasos */}
                        <div className="ranking-card glass-card">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800">
                                <TrendingDown className="text-orange-500" size={20} />
                                Top 5 Atrasos Recorrentes
                            </h3>

                            {top_atrasos.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">Nenhum atraso crítico no período.</div>
                            ) : (
                                <ul className="ranking-list">
                                    {top_atrasos.map((user, idx) => (
                                        <li key={idx} className="ranking-item">
                                            <div className="rnk-left">
                                                <div className={`rnk-pos num-${idx + 1}`}>{idx + 1}</div>
                                                <div className="rnk-user">
                                                    <strong>{user.nome}</strong>
                                                    <span>{user.cargo}</span>
                                                </div>
                                            </div>
                                            <div className="rnk-right">
                                                <span className="rnk-badge">{user.atrasos} Ocorrências</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminBI;
