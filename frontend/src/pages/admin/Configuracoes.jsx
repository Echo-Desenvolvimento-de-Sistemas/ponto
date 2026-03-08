import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { MapPin, Clock, Plus, Trash2, Edit2, Loader2, Radio, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import usePageTitle from '../../utils/usePageTitle';
import './Configuracoes.css';

// Fix Leaflet default icon broken in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component: moves map view when center changes
const MapViewUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

// Component: captures click on map
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({ click: (e) => onMapClick(e.latlng) });
    return null;
};

const Configuracoes = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('geofence');
    usePageTitle('Configurações');

    // States
    const [geofences, setGeofences] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Geofence form
    const [geoForm, setGeoForm] = useState({
        id: null, nome: '', latitude: -15.7801, longitude: -47.9292, raio_metros: 150
    });
    const [showGeoForm, setShowGeoForm] = useState(false);

    // Jornada form
    const [jorForm, setJorForm] = useState({
        id: null, descricao: '', horario_entrada: '', horario_saida: '',
        intervalo_inicio: '', intervalo_fim: '', tolerancia_minutos: 15,
        escala_tipo: 'regular', is_noturna: false
    });
    const [showJorForm, setShowJorForm] = useState(false);

    // Company settings
    const [companySettings, setCompanySettings] = useState({
        regime_horas: 'extra',
        notificacao_ponto_minutos: 5
    });


    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'geofence') {
                const res = await api.get('/geofences');
                setGeofences(res.data);
            } else if (activeTab === 'jornada') {
                const res = await api.get('/jornadas');
                setJornadas(res.data);
            } else if (activeTab === 'empresa') {
                const res = await api.get('/user'); // To get company info
                setCompanySettings({
                    regime_horas: res.data.empresa?.regime_horas || 'extra',
                    notificacao_ponto_minutos: res.data.empresa?.notificacao_ponto_minutos || 5
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // --- Geofence Handlers ---
    const handleMapClick = useCallback((latlng) => {
        setGeoForm(f => ({ ...f, latitude: latlng.lat, longitude: latlng.lng }));
    }, []);

    const handleGeoSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (geoForm.id) {
                await api.put(`/geofences/${geoForm.id}`, geoForm);
            } else {
                await api.post('/geofences', geoForm);
            }
            setShowGeoForm(false);
            setGeoForm({ id: null, nome: '', latitude: -15.7801, longitude: -47.9292, raio_metros: 150 });
            fetchData();
            showSuccess('Raio de tolerância salvo com sucesso!');
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao salvar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const editGeo = (geo) => { setGeoForm({ ...geo }); setShowGeoForm(true); };
    const deleteGeo = async (id) => {
        if (!window.confirm('Remover este raio de tolerância?')) return;
        await api.delete(`/geofences/${id}`);
        fetchData();
    };

    // --- Jornada Handlers ---
    const handleJorSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const dataToSend = { ...jorForm };
        if (!dataToSend.intervalo_inicio) dataToSend.intervalo_inicio = null;
        if (!dataToSend.intervalo_fim) dataToSend.intervalo_fim = null;
        try {
            if (jorForm.id) {
                await api.put(`/jornadas/${jorForm.id}`, dataToSend);
            } else {
                await api.post('/jornadas', dataToSend);
            }
            setShowJorForm(false);
            setJorForm({ id: null, descricao: '', horario_entrada: '', horario_saida: '', intervalo_inicio: '', intervalo_fim: '', tolerancia_minutos: 15, escala_tipo: 'regular', is_noturna: false });
            fetchData();
            showSuccess('Jornada salva com sucesso!');
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao salvar jornada.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const editJor = (jor) => {
        const f = { ...jor };
        if (f.horario_entrada) f.horario_entrada = f.horario_entrada.substring(0, 5);
        if (f.horario_saida) f.horario_saida = f.horario_saida.substring(0, 5);
        if (f.intervalo_inicio) f.intervalo_inicio = f.intervalo_inicio.substring(0, 5);
        if (f.intervalo_fim) f.intervalo_fim = f.intervalo_fim.substring(0, 5);
        setJorForm(f);
        setShowJorForm(true);
    };

    const deleteJor = async (id) => {
        if (!window.confirm('Remover esta jornada?')) return;
        await api.delete(`/jornadas/${id}`);
        fetchData();
    };

    const handleCompanySettingsSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/whitelabel', companySettings); // Using whitelabel endpoint which handles company updates often
            showSuccess('Configurações da empresa salvas!');
        } catch (error) {
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const mapCenter = [Number(geoForm.latitude) || -15.7801, Number(geoForm.longitude) || -47.9292];

    return (
        <div className="admin-configuracoes">
            <header className="page-header animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Configurações de Ponto</h1>
                    <p className="text-muted">Defina o raio de tolerância de localização e as jornadas de trabalho.</p>
                </div>
            </header>

            {successMsg && (
                <div className="success-toast animate-fade-in">
                    <CheckCircle2 size={18} />
                    {successMsg}
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'geofence' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('geofence'); setShowGeoForm(false); }}
                >
                    <Radio size={18} /> Raio de Tolerância
                </button>
                <button
                    className={`tab-btn ${activeTab === 'jornada' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('jornada'); setShowJorForm(false); }}
                >
                    <Clock size={18} /> Jornadas e Escalas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'empresa' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('empresa'); }}
                >
                    <Settings size={18} /> Configurações Gerais
                </button>
            </div>

            <div className="tab-content glass-card animate-fade-in">

                {/* ====== ABA RAIO DE TOLERÂNCIA ====== */}
                {activeTab === 'geofence' && (
                    <div className="geofence-section">
                        {!showGeoForm ? (
                            <>
                                <div className="content-header">
                                    <div>
                                        <h2 className="text-xl font-bold">Raios de Tolerância</h2>
                                        <p className="text-muted text-sm">Defina as áreas onde os colaboradores podem registrar o ponto.</p>
                                    </div>
                                    <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowGeoForm(true)}>
                                        <Plus size={18} /> Novo Raio
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-color" size={32} /></div>
                                ) : geofences.length === 0 ? (
                                    <div className="empty-state">
                                        <Radio size={48} className="text-muted mb-3" />
                                        <p className="text-muted">Nenhum raio configurado ainda.</p>
                                        <p className="text-sm text-muted">Clique em "Novo Raio" para definir uma área permitida.</p>
                                    </div>
                                ) : (
                                    <div className="list-grid">
                                        {geofences.map(geo => (
                                            <div key={geo.id} className="geo-card">
                                                {/* Mini-mapa estático por local */}
                                                <div className="geo-card-map">
                                                    <MapContainer
                                                        center={[Number(geo.latitude), Number(geo.longitude)]}
                                                        zoom={15}
                                                        style={{ height: '120px', width: '100%', borderRadius: '10px 10px 0 0' }}
                                                        zoomControl={false}
                                                        dragging={false}
                                                        scrollWheelZoom={false}
                                                        doubleClickZoom={false}
                                                        touchZoom={false}
                                                        attributionControl={false}
                                                    >
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <Circle
                                                            center={[Number(geo.latitude), Number(geo.longitude)]}
                                                            radius={Number(geo.raio_metros)}
                                                            pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.2 }}
                                                        />
                                                        <Marker position={[Number(geo.latitude), Number(geo.longitude)]} />
                                                    </MapContainer>
                                                </div>
                                                <div className="geo-card-info">
                                                    <div>
                                                        <h3 className="font-bold">{geo.nome}</h3>
                                                        <span className="geo-badge">
                                                            <Radio size={12} /> {geo.raio_metros}m de raio
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => editGeo(geo)} className="icon-btn text-blue-500"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteGeo(geo.id)} className="icon-btn text-red-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ====== FORMULÁRIO COM MAPA INTERATIVO ====== */
                            <div className="geo-form-layout">
                                <div className="geo-form-sidebar">
                                    <h2 className="font-bold text-xl mb-1">
                                        {geoForm.id ? 'Editar' : 'Novo'} Raio de Tolerância
                                    </h2>
                                    <p className="text-sm text-muted mb-4">Clique no mapa para posicionar o centro. Ajuste o raio com o slider.</p>

                                    <form onSubmit={handleGeoSubmit} className="config-form">
                                        <div className="form-group">
                                            <label className="form-label">Nome do Local</label>
                                            <input
                                                type="text"
                                                value={geoForm.nome}
                                                onChange={e => setGeoForm({ ...geoForm, nome: e.target.value })}
                                                required
                                                className="form-input"
                                                placeholder="Ex: Sede Principal"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Raio de Tolerância</span>
                                                <strong style={{ color: 'var(--primary-color)' }}>{geoForm.raio_metros} metros</strong>
                                            </label>
                                            <input
                                                type="range"
                                                min="30"
                                                max="1000"
                                                step="10"
                                                value={geoForm.raio_metros}
                                                onChange={e => setGeoForm({ ...geoForm, raio_metros: Number(e.target.value) })}
                                                className="geo-slider"
                                            />
                                            <div className="slider-labels">
                                                <span>30m</span>
                                                <span>500m</span>
                                                <span>1km</span>
                                            </div>
                                        </div>

                                        <div className="coords-display">
                                            <div>
                                                <span className="text-xs text-muted">Latitude</span>
                                                <span className="font-mono text-sm">{Number(geoForm.latitude).toFixed(6)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted">Longitude</span>
                                                <span className="font-mono text-sm">{Number(geoForm.longitude).toFixed(6)}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted mt-1 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={13} /> Clique no mapa ao lado para reposicionar.
                                        </p>

                                        <div className="form-actions flex gap-3">
                                            <button type="button" onClick={() => setShowGeoForm(false)} className="btn btn-outline flex-1">Cancelar</button>
                                            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Raio'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Mapa Interativo */}
                                <div className="geo-map-wrapper">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%', borderRadius: '0 12px 12px 0' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapViewUpdater center={mapCenter} />
                                        <MapClickHandler onMapClick={handleMapClick} />
                                        <Circle
                                            center={mapCenter}
                                            radius={Number(geoForm.raio_metros)}
                                            pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.15, weight: 2 }}
                                        />
                                        <Marker position={mapCenter} />
                                    </MapContainer>
                                    <div className="map-hint">👆 Clique no mapa para mover o ponto</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== ABA JORNADA ====== */}
                {activeTab === 'jornada' && (
                    <div className="jornada-section">
                        {!showJorForm ? (
                            <>
                                <div className="content-header">
                                    <div>
                                        <h2 className="text-xl font-bold">Jornadas e Escalas</h2>
                                        <p className="text-muted text-sm">Configure os horários e regras de cada turno.</p>
                                    </div>
                                    <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowJorForm(true)}>
                                        <Plus size={18} /> Nova Jornada
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-color" size={32} /></div>
                                ) : jornadas.length === 0 ? (
                                    <div className="empty-state">
                                        <Clock size={48} className="text-muted mb-3" />
                                        <p className="text-muted">Nenhuma jornada configurada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="list-grid">
                                        {jornadas.map(jor => (
                                            <div key={jor.id} className="jor-card">
                                                <div className="jor-card-icon">
                                                    <Clock size={22} className="text-primary-color" />
                                                </div>
                                                <div className="jor-card-body">
                                                    <h3 className="font-bold">{jor.descricao}</h3>
                                                    <div className="jor-times">
                                                        <span>🟢 Entrada: <strong>{jor.horario_entrada?.substring(0, 5)}</strong></span>
                                                        <span>🔴 Saída: <strong>{jor.horario_saida?.substring(0, 5)}</strong></span>
                                                        {jor.intervalo_inicio && (
                                                            <span>⏸ Intervalo: <strong>{jor.intervalo_inicio.substring(0, 5)} – {jor.intervalo_fim?.substring(0, 5)}</strong></span>
                                                        )}
                                                        <span>🕒 Escala: <strong>{jor.escala_tipo === '12x36' ? '12x36' : 'Regular'} {jor.is_noturna ? '(Noturna)' : ''}</strong></span>
                                                        <span>⏱ Tolerância: <strong>{jor.tolerancia_minutos} min</strong></span>
                                                    </div>
                                                </div>
                                                <div className="jor-card-actions">
                                                    <button onClick={() => editJor(jor)} className="icon-btn text-blue-500"><Edit2 size={16} /></button>
                                                    <button onClick={() => deleteJor(jor.id)} className="icon-btn text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <form onSubmit={handleJorSubmit} className="config-form max-w-lg">
                                <h2 className="font-bold text-xl mb-4">{jorForm.id ? 'Editar' : 'Nova'} Jornada de Trabalho</h2>

                                <div className="form-group">
                                    <label className="form-label">Descrição da Escala</label>
                                    <input type="text" value={jorForm.descricao} onChange={e => setJorForm({ ...jorForm, descricao: e.target.value })} required className="form-input" placeholder="Ex: Comercial 8h–17h" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Escala</label>
                                        <select
                                            className="form-input"
                                            value={jorForm.escala_tipo}
                                            onChange={e => setJorForm({ ...jorForm, escala_tipo: e.target.value })}
                                        >
                                            <option value="regular">Regular (Diária)</option>
                                            <option value="12x36">12x36 (Dia Sim/Não)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Período Noturno?</label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={jorForm.is_noturna}
                                                onChange={e => setJorForm({ ...jorForm, is_noturna: e.target.checked })}
                                                id="noturna"
                                            />
                                            <label htmlFor="noturna" className="text-sm cursor-pointer">Sim (Atravessa a meia-noite)</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Horário de Entrada</label>
                                        <input type="time" value={jorForm.horario_entrada} onChange={e => setJorForm({ ...jorForm, horario_entrada: e.target.value })} required className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Horário de Saída</label>
                                        <input type="time" value={jorForm.horario_saida} onChange={e => setJorForm({ ...jorForm, horario_saida: e.target.value })} required className="form-input" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Início Intervalo <span className="text-muted">(opcional)</span></label>
                                        <input type="time" value={jorForm.intervalo_inicio} onChange={e => setJorForm({ ...jorForm, intervalo_inicio: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fim Intervalo <span className="text-muted">(opcional)</span></label>
                                        <input type="time" value={jorForm.intervalo_fim} onChange={e => setJorForm({ ...jorForm, intervalo_fim: e.target.value })} className="form-input" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tolerância de Atraso</span>
                                        <strong style={{ color: 'var(--primary-color)' }}>{jorForm.tolerancia_minutos} minutos</strong>
                                    </label>
                                    <input
                                        type="range" min="0" max="60" step="5"
                                        value={jorForm.tolerancia_minutos}
                                        onChange={e => setJorForm({ ...jorForm, tolerancia_minutos: Number(e.target.value) })}
                                        className="geo-slider"
                                    />
                                    <div className="slider-labels"><span>0 min</span><span>30 min</span><span>60 min</span></div>
                                    <small className="text-muted mt-1 block">CLT padrão: até 10 minutos diários (5 por registro).</small>
                                </div>

                                <div className="form-actions mt-6 flex gap-3">
                                    <button type="button" onClick={() => setShowJorForm(false)} className="btn btn-outline flex-1">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Jornada'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ====== ABA CONFIGURAÇÕES GERAIS ====== */}
                {activeTab === 'empresa' && (
                    <div className="empresa-section">
                        <form onSubmit={handleCompanySettingsSubmit} className="config-form max-w-lg">
                            <h2 className="font-bold text-xl mb-4">Configurações Gerais da Empresa</h2>

                            <div className="form-group">
                                <label className="form-label">Regime de Horas</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="regime"
                                            value="extra"
                                            checked={companySettings.regime_horas === 'extra'}
                                            onChange={e => setCompanySettings({ ...companySettings, regime_horas: e.target.value })}
                                        />
                                        <span>Horas Extras (Pagamento)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="regime"
                                            value="banco"
                                            checked={companySettings.regime_horas === 'banco'}
                                            onChange={e => setCompanySettings({ ...companySettings, regime_horas: e.target.value })}
                                        />
                                        <span>Banco de Horas (Compensação)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Minutos antes para Notificar o Ponto</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={companySettings.notificacao_ponto_minutos}
                                    onChange={e => setCompanySettings({ ...companySettings, notificacao_ponto_minutos: parseInt(e.target.value) })}
                                    className="form-input"
                                />
                                <small className="text-muted">Lembrete enviado ao celular do colaborador.</small>
                            </div>

                            <div className="form-actions mt-6">
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Configurações'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracoes;
