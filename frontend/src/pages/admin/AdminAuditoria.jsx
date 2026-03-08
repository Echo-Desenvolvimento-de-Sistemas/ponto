import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useWhitelabel } from '../../contexts/WhitelabelContext';
import usePageTitle from '../../utils/usePageTitle';
import { ShieldAlert, Search, RefreshCcw, Loader2, ArrowRight } from 'lucide-react';
import './AdminAuditoria.css';

const AdminAuditoria = () => {
    usePageTitle('Trilha de Auditoria');
    const { primaryColor } = useWhitelabel();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
    }, [primaryColor]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auditoria');
            setLogs(res.data.data || res.data);
        } catch (error) {
            console.error('Erro ao buscar logs', error);
        } finally {
            setLoading(false);
        }
    };

    const formatJSON = (data) => {
        if (!data) return <span className="text-gray-400 italic">Vazio</span>;
        return (
            <div className="json-tree">
                {Object.entries(data).map(([k, v]) => (
                    <div key={k} className="json-line">
                        <span className="json-key">{k}:</span>
                        <span className="json-val">{String(v)}</span>
                    </div>
                ))}
            </div>
        )
    };

    const parseAction = (action) => {
        switch (action) {
            case 'update': return <span className="badge badge-blue">Edição</span>;
            case 'avaliar_ocorrencia': return <span className="badge badge-purple">Avaliação Ocorrência</span>;
            case 'delete': return <span className="badge badge-red">Remoção</span>;
            default: return <span className="badge badge-gray">{action}</span>;
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Trilha de Auditoria</h1>
                    <p className="admin-subtitle">Rastreamento de edição de cadastros, ocorrências e ponto.</p>
                </div>
                <button className="btn btn-secondary flex items-center gap-2" onClick={fetchLogs} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                </button>
            </div>

            <div className="admin-content glass-card mt-6">
                <div className="auditoria-table-wrapper">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <ShieldAlert size={48} className="mb-4 text-gray-300" />
                            <p>Nenhuma alteração registrada ainda.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Data e Hora</th>
                                    <th>Usuário Responsável</th>
                                    <th>Ação</th>
                                    <th>Registro Afetado</th>
                                    <th className="w-1/3">Alterações (De <ArrowRight size={14} className="inline text-gray-400 mx-1" /> Para)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                            <div className="text-xs text-gray-400 mt-1">IP: {log.ip_address}</div>
                                        </td>
                                        <td>
                                            <div className="font-semibold">{log.user?.name || 'Sistema'}</div>
                                            <div className="text-xs text-gray-500">{log.user?.role}</div>
                                        </td>
                                        <td>{parseAction(log.acao)}</td>
                                        <td>
                                            <div className="text-sm">
                                                <span className="text-gray-500 text-xs block">Model: {log.model_type.split('\\').pop()}</span>
                                                <span className="font-mono text-gray-700">#{log.model_id}</span>
                                            </div>
                                        </td>
                                        <td className="diff-cell">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="diff-box before">
                                                    <div className="diff-title">Antes</div>
                                                    {formatJSON(log.dados_antigos)}
                                                </div>
                                                <div className="diff-box after">
                                                    <div className="diff-title">Depois</div>
                                                    {formatJSON(log.dados_novos)}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAuditoria;
