import React, { useState, useRef, useEffect } from 'react';
import { Palette, Image as ImageIcon, Upload, Save, Building, X, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import usePageTitle from '../../utils/usePageTitle';
import './WhiteLabelConfig.css';

const WhiteLabelConfig = () => {
    const { user } = useAuth();
    const isEmpresa = user?.role === 'empresa_rh';
    usePageTitle('Identidade Visual');

    const [configs, setConfigs] = useState({
        systemName: 'PontoNow',
        primaryColor: '#d19bf7',
        logoUrl: null,
        loginBgUrl: null,
    });

    const [previews, setPreviews] = useState({
        logo: null,
        bg: null
    });

    const [files, setFiles] = useState({
        logo: null,
        bg: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const logoInputRef = useRef(null);
    const bgInputRef = useRef(null);

    // Na montagem, buscaria as configs atuais
    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const response = await api.get('/whitelabel');
                if (response.data) {
                    setConfigs({
                        ...configs,
                        systemName: response.data.systemName || 'PontoNow',
                        primaryColor: response.data.primaryColor || '#d19bf7',
                        logoUrl: response.data.logoUrl || null,
                        loginBgUrl: response.data.loginBgUrl || null,
                    });

                    // Set previews to the DB URLs if they exist
                    setPreviews({
                        logo: response.data.logoUrl || null,
                        bg: response.data.loginBgUrl || null,
                    });

                    // Aplica a cor primária no :root se houver
                    if (response.data.primaryColor) {
                        document.documentElement.style.setProperty('--primary-color', response.data.primaryColor);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar white label', error);
            }
        };
        fetchConfigs();
    }, []);

    const handleColorChange = (e) => {
        setConfigs({ ...configs, primaryColor: e.target.value });
        // Em um app real, isso poderia atualizar uma variável no :root em tempo de execução
        document.documentElement.style.setProperty('--primary-color', e.target.value);
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [type]: previewUrl }));
            setFiles(prev => ({ ...prev, [type]: file }));
        }
    };

    const removeImage = (type) => {
        setPreviews(prev => ({ ...prev, [type]: null }));
        setFiles(prev => ({ ...prev, [type]: null }));
        if (type === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
        if (type === 'bg' && bgInputRef.current) bgInputRef.current.value = '';
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const hasFiles = files.logo || files.bg;
            let response;

            if (hasFiles) {
                // Com arquivos: usa FormData e deixa o Axios definir o Content-Type+boundary automaticamente
                const formData = new FormData();
                formData.append('systemName', configs.systemName);
                formData.append('primaryColor', configs.primaryColor);
                if (files.logo) formData.append('logo', files.logo);
                if (files.bg) formData.append('loginBg', files.bg);

                response = await api.post('/whitelabel', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Sem arquivos: JSON puro (mais confiável)
                const payload = {
                    primaryColor: configs.primaryColor,
                    systemName: configs.systemName,
                };
                response = await api.post('/whitelabel', payload);
            }

            // Recarrega as configs do servidor para garantir consistência
            if (response.data?.data) {
                const saved = response.data.data;
                const base = import.meta.env.VITE_API_URL
                    ? import.meta.env.VITE_API_URL.replace('/api', '')
                    : 'https://apiponto.echo.dev.br';
                setConfigs(prev => ({
                    ...prev,
                    primaryColor: saved.primaryColor || prev.primaryColor,
                    systemName: saved.systemName || prev.systemName,
                    logoUrl: saved.logoUrl || prev.logoUrl,
                    loginBgUrl: saved.loginBgUrl || prev.loginBgUrl,
                }));
                if (saved.logoUrl) setPreviews(p => ({ ...p, logo: saved.logoUrl }));
                if (saved.loginBgUrl) setPreviews(p => ({ ...p, bg: saved.loginBgUrl }));
                // Aplica a cor imediatamente
                if (saved.primaryColor) {
                    document.documentElement.style.setProperty('--primary-color', saved.primaryColor);
                }
            }

            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar white label:', error.response?.data || error);
            alert(error.response?.data?.message || 'Erro ao salvar configurações.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="whitelabel-container animate-fade-in">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Palette className="text-primary-color" size={24} />
                        {isEmpresa ? 'Identidade Visual da Empresa' : 'Customização White-Label SaaS'}
                    </h1>
                    <p className="text-muted">
                        {isEmpresa
                            ? 'Personalize a identidade visual do painel para os seus colaboradores.'
                            : 'Personalize a identidade visual do SaaS para todos os clientes.'}
                    </p>
                </div>
            </header>

            <form onSubmit={handleSave} className="config-grid">

                {/* Identidade Visual */}
                <div className="glass-card config-card">
                    <div className="card-header border-b pb-3 mb-4 flex items-center gap-2">
                        <Palette className="text-primary-color" size={20} />
                        <h2 className="text-xl font-semibold">Identidade e Cor</h2>
                    </div>

                    {/* Nome do sistema: editável por todos */}
                    <div className="form-group mb-4">
                        <label className="form-label font-medium mb-1 block text-sm">
                            Nome do Sistema
                            {isEmpresa && (
                                <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.12)', color: '#7c3aed', padding: '1px 8px', borderRadius: '999px', fontWeight: 600, marginLeft: '0.5rem' }}>
                                    Visível apenas aos seus colaboradores
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={configs.systemName}
                            onChange={(e) => setConfigs({ ...configs, systemName: e.target.value })}
                        />
                        {isEmpresa && (
                            <p className="text-xs text-muted mt-1">
                                Este nome será exibido no painel dos seus colaboradores.
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label font-medium mb-1 block text-sm">Cor Primária {isEmpresa ? 'da Empresa' : '(Tema Global)'}</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                className="color-picker"
                                value={configs.primaryColor}
                                onChange={handleColorChange}
                            />
                            <span className="text-sm border p-1 rounded font-mono">{configs.primaryColor}</span>
                        </div>
                        <p className="text-xs text-muted mt-2">
                            Esta cor será aplicada em botões, links e destaques em todo o aplicativo mobile e desktop.
                        </p>
                    </div>
                </div>

                {/* Uploads de Imagem */}
                <div className="glass-card config-card">
                    <div className="card-header border-b pb-3 mb-4 flex items-center gap-2">
                        <ImageIcon className="text-primary-color" size={20} />
                        <h2 className="text-xl font-semibold">Mídia e Logos</h2>
                    </div>

                    <div className="form-group mb-5">
                        <label className="form-label font-medium mb-1 block text-sm">Logo Pequena (Menu e Celular)</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            className="hidden"
                            ref={logoInputRef}
                            onChange={(e) => handleImageChange(e, 'logo')}
                        />
                        {previews.logo ? (
                            <div className="preview-wrapper group">
                                <div className="preview-logo-box">
                                    <img src={previews.logo} alt="Preview Logo" className="preview-logo-img" />
                                    <div className="preview-overlay">
                                        <button
                                            type="button"
                                            onClick={() => removeImage('logo')}
                                            className="preview-remove-btn"
                                            title="Remover imagem"
                                        >
                                            <X size={14} /> Remover
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            className="preview-change-btn"
                                            title="Trocar imagem"
                                        >
                                            <Upload size={14} /> Trocar
                                        </button>
                                    </div>
                                </div>
                                <span className="preview-label">PNG ou JPG com fundo transparente</span>
                            </div>
                        ) : (
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className="upload-dropzone"
                            >
                                <Building size={28} className="upload-icon" />
                                <span className="upload-cta">Clique para fazer upload</span>
                                <p className="upload-hint">PNG ou JPG • max 2MB</p>
                            </div>
                        )}
                    </div>

                    {!isEmpresa && (
                        <div className="form-group">
                            <label className="form-label font-medium mb-1 block text-sm">Painel de Fundo do Login</label>
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                ref={bgInputRef}
                                onChange={(e) => handleImageChange(e, 'bg')}
                            />
                            {previews.bg ? (
                                <div className="preview-wrapper group">
                                    <div className="preview-bg-box">
                                        <img src={previews.bg} alt="Preview Fundo" className="preview-bg-img" />
                                        <div className="preview-bg-badge">Login Background</div>
                                        <div className="preview-overlay">
                                            <button
                                                type="button"
                                                onClick={() => removeImage('bg')}
                                                className="preview-remove-btn"
                                                title="Remover imagem"
                                            >
                                                <X size={14} /> Remover
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bgInputRef.current?.click()}
                                                className="preview-change-btn"
                                                title="Trocar imagem"
                                            >
                                                <Upload size={14} /> Trocar
                                            </button>
                                        </div>
                                    </div>
                                    <span className="preview-label">Recomendado: 1920 × 1080px</span>
                                </div>
                            ) : (
                                <div
                                    onClick={() => bgInputRef.current?.click()}
                                    className="upload-dropzone"
                                >
                                    <Upload size={28} className="upload-icon" />
                                    <span className="upload-cta">Clique para fazer upload</span>
                                    <p className="upload-hint">JPG, PNG ou WebP • max 5MB • 1920×1080px</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit Area */}
                <div className="submit-area col-span-full flex justify-end mt-4">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary flex items-center gap-2">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSubmitting ? 'Salvando...' : 'Salvar Customizações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WhiteLabelConfig;
