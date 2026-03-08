import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import usePageTitle from '../../utils/usePageTitle';
import { UploadCloud, CheckCircle2, AlertCircle, Users, HardDrive, Key, Loader2, ArrowRight } from 'lucide-react';
import './AdminMigracao.css';

const AdminMigracao = () => {
    usePageTitle('Migração de Dados');
    const { user } = useAuth();

    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState('');
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const [selectedRows, setSelectedRows] = useState(new Set());
    const [defaultPassword, setDefaultPassword] = useState('');
    const [importSuccess, setImportSuccess] = useState(null);
    const [importError, setImportError] = useState(null);

    useEffect(() => {
        // Fetch tenants for dropdown
        const fetchEmpresas = async () => {
            try {
                const response = await api.get('/empresas');
                setEmpresas(response.data);
            } catch (error) {
                console.error('Erro ao carregar empresas', error);
            }
        };
        fetchEmpresas();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewData(null);
            setImportSuccess(null);
            setImportError(null);
        }
    };

    const handleUploadPreview = async () => {
        if (!selectedEmpresa || !file) {
            alert('Selecione uma empresa e um arquivo JSON primeiro.');
            return;
        }

        setLoading(true);
        setImportError(null);
        const formData = new FormData();
        formData.append('empresa_id', selectedEmpresa);
        formData.append('file', file);

        try {
            const response = await api.post('/migracao/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const users = response.data.users || [];
            setPreviewData(users);

            // Auto-select valid rows
            const initialSelected = new Set();
            users.forEach((u, i) => {
                if (u.errors.length === 0) initialSelected.add(i);
            });
            setSelectedRows(initialSelected);

        } catch (error) {
            console.error('Erro no preview:', error);
            setImportError(error.response?.data?.error || 'Erro ao processar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const handleDataChange = (index, field, value) => {
        const newData = [...previewData];
        newData[index][field] = value;
        setPreviewData(newData);
    };

    const handleRowToggle = (index, hasErrors) => {
        if (hasErrors) return; // Don't allow selecting rows with errors

        const newSelected = new Set(selectedRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRows(newSelected);
    };

    const handleImportar = async () => {
        if (!defaultPassword || defaultPassword.length < 6) {
            alert('A senha padrão deve ter no mínimo 6 caracteres.');
            return;
        }

        if (selectedRows.size === 0) {
            alert('Selecione ao menos um usuário válido para importar.');
            return;
        }

        const usersToImport = Array.from(selectedRows).map(idx => ({
            name: previewData[idx].name,
            email: previewData[idx].email,
            role: previewData[idx].role
        }));

        setImporting(true);
        setImportError(null);
        setImportSuccess(null);

        try {
            const response = await api.post('/migracao/importar', {
                empresa_id: selectedEmpresa,
                default_password: defaultPassword,
                users: usersToImport
            });

            setImportSuccess(response.data.message);
            setPreviewData(null); // Reset after success
            setFile(null);
            setSelectedEmpresa('');
            setDefaultPassword('');

        } catch (error) {
            console.error('Erro na importação:', error);
            const errData = error.response?.data;
            let errMsg = errData?.error || 'Erro crítico na importação.';
            if (errData?.details && Array.isArray(errData.details)) {
                errMsg += ` Detalhes: ${errData.details.join(', ')}`;
            }
            setImportError(errMsg);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="admin-migracao-container animate-fade-in relative">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <HardDrive className="text-primary-color" />
                        Migração de Dados JSON
                    </h1>
                    <p className="text-muted">Importe usuários em lote usando um formato estruturado. Apenas Professores e Secretarias serão processados.</p>
                </div>
            </header>

            {!previewData && (
                <div className="glass-card list-card p-8 min-h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div className="form-group">
                            <label className="form-label font-medium mb-1 block text-sm">Empresa Destino (Tenant)</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 text-gray-400" size={20} />
                                <select
                                    className="form-input pl-10 appearance-none bg-white"
                                    value={selectedEmpresa}
                                    onChange={(e) => setSelectedEmpresa(e.target.value)}
                                >
                                    <option value="">-- Selecione uma empresa --</option>
                                    {empresas.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.razao_social}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label font-medium mb-1 block text-sm">Arquivo `modelojson.json`</label>
                            <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition form-input text-center">
                                <UploadCloud className="text-primary-color" size={24} />
                                <span className="text-gray-600 truncate text-sm">
                                    {file ? file.name : 'Clique para selecionar o JSON...'}
                                </span>
                                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    {importSuccess && (
                        <div className="mt-6 p-4 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
                            <CheckCircle2 size={24} />
                            <span>{importSuccess}</span>
                        </div>
                    )}

                    {importError && (
                        <div className="mt-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                            <AlertCircle size={24} className="flex-shrink-0" />
                            <span>{importError}</span>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            className="btn btn-primary"
                            onClick={handleUploadPreview}
                            disabled={!selectedEmpresa || !file || loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                            Analisar Arquivo
                        </button>
                    </div>
                </div>
            )}

            {previewData && (
                <div className="glass-card list-card min-h-[400px] animate-fade-in flex flex-col pt-0">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center" style={{ backgroundColor: 'var(--surface-color-light)' }}>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">Preview de Importação</h2>
                            <p className="text-sm text-muted mt-1">Revise os dados, corrija se necessário e defina a senha padrão.</p>
                        </div>
                        <button className="text-primary-color text-sm font-medium hover:underline" onClick={() => setPreviewData(null)}>
                            Cancelar / Voltar
                        </button>
                    </div>

                    <div className="table-responsive flex-1">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">Imp.</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Cargo</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">Nenhum professor ou secretaria encontrado no JSON.</td>
                                    </tr>
                                ) : (
                                    previewData.map((usr, i) => {
                                        const hasErrors = usr.errors.length > 0;
                                        return (
                                            <tr key={i} className={hasErrors ? "bg-red-50" : ""}>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                        checked={selectedRows.has(i)}
                                                        disabled={hasErrors}
                                                        onChange={() => handleRowToggle(i, hasErrors)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={`form-input py-2 ${hasErrors && !usr.name ? 'border-red-400' : ''}`}
                                                        value={usr.name}
                                                        onChange={(e) => handleDataChange(i, 'name', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="email"
                                                        className={`form-input py-2 ${hasErrors && usr.errors.some(err => err.includes('E-mail')) ? 'border-red-400' : ''}`}
                                                        value={usr.email}
                                                        onChange={(e) => handleDataChange(i, 'email', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <span className="role-badge">
                                                        {usr.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    {hasErrors ? (
                                                        <div className="status-badge error flex flex-col gap-1 items-start text-left">
                                                            {usr.errors.map((e, idx) => <span key={idx} className="flex gap-1 items-center"><AlertCircle size={14} />{e}</span>)}
                                                        </div>
                                                    ) : (
                                                        <span className="status-badge success"><CheckCircle2 size={16} /> OK</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {importError && (
                        <div className="m-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                            <AlertCircle size={24} className="flex-shrink-0" />
                            <span>{importError}</span>
                        </div>
                    )}

                    <div className="p-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4" style={{ backgroundColor: 'var(--surface-color-light)' }}>
                        <div className="w-full md:w-1/3 form-group mb-0">
                            <label className="form-label font-medium mb-1 block text-sm">Senha Padrão (Mín. 6)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    className="form-input pl-10 bg-white"
                                    placeholder="******"
                                    value={defaultPassword}
                                    onChange={(e) => setDefaultPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            className="btn btn-primary bg-green-500 hover:bg-green-600 flex items-center gap-2"
                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                            onClick={handleImportar}
                            disabled={importing || selectedRows.size === 0 || !defaultPassword}
                        >
                            {importing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            Confirmar Importação ({selectedRows.size})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMigracao;
