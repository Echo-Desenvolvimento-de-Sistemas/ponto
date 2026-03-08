import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWhitelabel } from '../../contexts/WhitelabelContext';
import { useGeolocation } from '../../utils/useGeolocation';
import api from '../../api/axios';
import { db } from '../../utils/db';
import { MapPin, Bell, User, Loader2, ArrowRightCircle, ArrowLeftCircle, Coffee, CheckCircle2, RefreshCcw, Clock, Calendar, ChevronRight, CheckCircle, AlertTriangle, X, Settings, Fingerprint, Printer, ScanFace } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePageTitle from '../../utils/usePageTitle';
import HelpModal from '../../components/HelpModal';
import ReconhecimentoFacial from '../../components/ReconhecimentoFacial';
import { fixBackendUrl } from '../../utils/urlUtils';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import './BaterPonto.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

const LocationMarker = ({ latitude, longitude }) => {
    const map = useMap();
    useEffect(() => {
        if (latitude && longitude) {
            map.flyTo([latitude, longitude], map.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }, [latitude, longitude, map]);

    return <Marker position={[latitude, longitude]} />;
};

const HELP_SECTIONS = [
    {
        heading: 'Como registrar o ponto',
        items: [
            'Clique em "Entrada" ao chegar no trabalho.',
            'Clique em "Iniciar Almoço" ao sair para o intervalo.',
            'Clique em "Retornar do Almoço" ao voltar do intervalo.',
            'Clique em "Saída" ao encerrar a jornada.',
        ],
    },
    {
        heading: 'Dicas importantes',
        items: [
            'Seu GPS precisa estar ativo para registrar o ponto.',
            'Se estiver sem internet, o ponto será salvo offline e sincronizado automaticamente.',
            'Clique no card de localização para ver o mapa com sua posição.',
            'Clique em um registro na linha do tempo para ver o comprovante digital.',
        ],
    },
];

const BaterPonto = () => {
    const { user } = useAuth();
    const { systemName, logoUrl, primaryColor, baseUrl } = useWhitelabel();
    const { latitude, longitude, error: geoError, loading: geoLoading, forceReload } = useGeolocation();
    usePageTitle('Meu Ponto');

    const [jornada, setJornada] = useState(null);

    useEffect(() => {
        api.get('/minha-jornada').then(res => setJornada(res.data)).catch(console.error);
    }, []);

    // Apply company primary color as CSS variable
    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
    }, [primaryColor]);

    const [statusMsg, setStatusMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMap, setShowMap] = useState(false);
    const [selectedPonto, setSelectedPonto] = useState(null);
    const [confirmandoAcao, setConfirmandoAcao] = useState(null);

    const [baseData, setBaseData] = useState({
        base_minutos_hoje: 0,
        base_minutos_mes: 0,
        inicio_intervalo_atual: null,
        pontos_hoje: []
    });

    const [resumo, setResumo] = useState({
        horas_hoje: '00:00',
        horas_hoje_percent: 0,
        saldo_mes: '0h 00m',
        saldo_mes_percent: 0,
        proximo_passo: 'Carregando...',
    });

    const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [isFacialModalOpen, setIsFacialModalOpen] = useState(false);
    const [facialStatus, setFacialStatus] = useState('checking'); // checking, missing, enrolled
    const [facialActive, setFacialActive] = useState(false);

    const checkFacialStatus = async () => {
        try {
            const res = await api.get('/facial-status');
            setHasFaceEnrolled(res.data.has_face);
            setFacialStatus(res.data.has_face ? 'enrolled' : 'missing');
        } catch (e) {
            console.error('Erro ao verificar status facial:', e);
        }
    };

    useEffect(() => {
        checkFacialStatus();
    }, []);

    const [offlineSyncMsg, setOfflineSyncMsg] = useState('');

    const fetchResumo = async () => {
        try {
            if (navigator.onLine) {
                const res = await api.get('/registro-pontos/resumo');
                setBaseData(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchResumo();
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            let addMinutes = 0;
            if (baseData.inicio_intervalo_atual) {
                const start = new Date(baseData.inicio_intervalo_atual);
                addMinutes = Math.floor((now - start) / 60000);
            }

            const totalHoje = Math.round((baseData.base_minutos_hoje || 0) + addMinutes);
            const totalMes = Math.round((baseData.base_minutos_mes || 0) + addMinutes);

            const hHoje = Math.floor(totalHoje / 60);
            const mHoje = totalHoje % 60;

            const hMes = Math.floor(totalMes / 60);
            const mMes = totalMes % 60;

            let propPasso = 'Bata seu ponto inicial para começar';
            const pts = baseData.pontos_hoje || [];
            const ultimoPonto = pts.length > 0 ? pts[pts.length - 1] : null;

            if (ultimoPonto) {
                const j = jornada || { horario_entrada: '08:00', intervalo_inicio: '12:00', intervalo_fim: '13:00', horario_saida: '18:00' };
                if (ultimoPonto.tipo === 'entrada') {
                    propPasso = `Pausa para descanso prevista às ${j.intervalo_inicio || '12:00'}`;
                } else if (ultimoPonto.tipo === 'inicio_intervalo') {
                    propPasso = `Fim do intervalo às ${j.intervalo_fim || '13:00'}`;
                } else if (ultimoPonto.tipo === 'fim_intervalo') {
                    propPasso = `Sua saída prevista é às ${j.horario_saida || '18:00'}`;
                } else if (ultimoPonto.tipo === 'saida') {
                    propPasso = 'Jornada encerrada por hoje. Bom descanso!';
                }
            }

            setResumo({
                horas_hoje: `${String(hHoje).padStart(2, '0')}:${String(mHoje).padStart(2, '0')}`,
                horas_hoje_percent: Math.min(100, (totalHoje / (8 * 60)) * 100),
                saldo_mes: `${hMes}h ${String(mMes).padStart(2, '0')}m`,
                saldo_mes_percent: Math.min(100, (totalMes / (160 * 60)) * 100),
                proximo_passo: propPasso,
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [baseData, jornada]);

    const [showJustificativaModal, setShowJustificativaModal] = useState(false);
    const [justificativaText, setJustificativaText] = useState('');
    const [pendingPontoPayload, setPendingPontoPayload] = useState(null);

    const handleBaterPonto = async (tipo, justificativa = null) => {
        if (!latitude || !longitude) {
            setIsError(true);
            setStatusMsg('Aguarde o GPS ou ative sua localização.');
            return;
        }

        setIsSubmitting(true);
        setStatusMsg('');
        setIsError(false);

        const isOnline = navigator.onLine;
        const nowISO = new Date().toISOString();

        const pontoPayload = {
            tipo,
            horario_dispositivo: nowISO,
            latitude,
            longitude,
            is_offline: !isOnline
        };

        if (justificativa) {
            pontoPayload.justificativa = justificativa;
        }

        if (faceDescriptor) {
            pontoPayload.face_descriptor = faceDescriptor;
        }

        if (isOnline) {
            try {
                const res = await api.post('/registro-pontos', pontoPayload);
                setShowJustificativaModal(false);
                setJustificativaText('');
                setPendingPontoPayload(null);

                setIsError(false);
                setStatusMsg(
                    res.data.data?.status === 'alerta_geofence'
                        ? 'Ponto registrado fora do local (aguardando aprovação)'
                        : 'Ponto registrado com sucesso!'
                );
            } catch (error) {
                setIsSubmitting(false);

                // Se o servidor respondeu, tratamos o erro especificamente em vez de salvar offline
                if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data;

                    if (status === 403 && data?.requires_justification) {
                        setPendingPontoPayload(pontoPayload);
                        setShowJustificativaModal(true);
                        return;
                    }

                    if (status === 403 || status === 422 || status === 401) {
                        setIsError(true);
                        setStatusMsg(data?.error || data?.message || 'Acesso negado ou erro de validação.');
                        setFaceDescriptor(null); // Resetar face em caso de erro 403 (provável mismatch)
                        setTimeout(() => setStatusMsg(''), 6000);
                        return;
                    }

                    // Para outros erros com resposta (ex: 500), mostramos o erro mas não salvamos offline por padrão
                    setIsError(true);
                    setStatusMsg('Erro no servidor ao registrar ponto. Tente novamente.');
                    return;
                }

                // Se chegou aqui sem error.response, é erro de rede REAL
                await saveOfflinePonto(pontoPayload);
            }
        } else {
            await saveOfflinePonto(pontoPayload);
        }

        setIsSubmitting(false);

        setTimeout(() => {
            fetchResumo();
            setStatusMsg('');
            setFaceDescriptor(null); // Limpar após uso
        }, 5000);
    };

    const handleEnrollment = async (descriptor) => {
        try {
            await api.post('/facial-enrollment', { face_descriptor: descriptor });
            setHasFaceEnrolled(true);
            setFacialStatus('enrolled');
            setStatusMsg('Sua face foi cadastrada com sucesso!');
        } catch (e) {
            setIsError(true);
            setStatusMsg('Erro ao cadastrar face. Tente novamente.');
        }
    };

    const confirmRegistration = () => {
        if (confirmandoAcao) {
            handleBaterPonto(confirmandoAcao);
            setConfirmandoAcao(null);
            setFacialActive(false); // Reset facial active state
        }
    };

    const isLunchTime = (j) => {
        if (!j?.intervalo_inicio || !j?.intervalo_fim) return true;

        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = j.intervalo_inicio.split(':').map(Number);
        const [endH, endM] = j.intervalo_fim.split(':').map(Number);

        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        // Tolerância de 15 minutos de antecedência para iniciar
        return currentMins >= (startMins - 15) && currentMins <= endMins;
    };

    const saveOfflinePonto = async (payload) => {
        try {
            await db.pontos_pendentes.add({ ...payload, user_id: user.id });
            setIsError(false);
            setStatusMsg('Salvo offline. Será enviado quando tiver internet.');
        } catch (e) {
            setIsError(true);
            setStatusMsg('Erro grave ao salvar.');
        }
    };

    const syncOfflinePontos = async () => {
        if (!navigator.onLine) return;
        try {
            const pending = await db.pontos_pendentes.toArray();
            if (pending.length === 0) return;

            setOfflineSyncMsg(`Sincronizando ${pending.length} registros...`);
            let successCount = 0;

            for (const ponto of pending) {
                try {
                    const { id, user_id, ...payloadToSend } = ponto;
                    await api.post('/registro-pontos', payloadToSend);
                    await db.pontos_pendentes.delete(id);
                    successCount++;
                } catch (e) {
                    console.error(e);
                }
            }
            if (successCount > 0) {
                setOfflineSyncMsg(`${successCount} sincronizados com sucesso.`);
                setTimeout(() => setOfflineSyncMsg(''), 4000);
            }
        } catch (e) { }
    };

    useEffect(() => {
        window.addEventListener('online', syncOfflinePontos);
        if (navigator.onLine) syncOfflinePontos();
        return () => window.removeEventListener('online', syncOfflinePontos);
    }, []);

    const getTipoLabel = (tipo) => {
        switch (tipo) {
            case 'entrada': return 'Entrada';
            case 'saida': return 'Saída';
            case 'inicio_intervalo': return 'Almoço (Saída)';
            case 'fim_intervalo': return 'Almoço (Retorno)';
            default: return tipo;
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'entrada': return <ArrowRightCircle size={16} />;
            case 'saida': return <ArrowLeftCircle size={16} />;
            case 'inicio_intervalo': return <Coffee size={16} />;
            case 'fim_intervalo': return <CheckCircle2 size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';

    return (
        <>
            <div className="bater-ponto-wrapper pb-24">
                <div className="mobile-mockup-frame">

                    {/* Company Logo Header */}
                    <div className="company-logo-header animate-fade-in">
                        {logoUrl ? (
                            <img
                                src={fixBackendUrl(logoUrl)}
                                alt={systemName}
                                className="company-logo-img"
                            />
                        ) : (
                            <div className="company-logo-fallback">
                                <Fingerprint size={20} style={{ color: primaryColor || 'var(--primary-color)' }} />
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                    {systemName || 'PontoNow'}
                                </span>
                            </div>
                        )}
                    </div>


                    <div className="main-info-card glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card-header">
                            <h3 className="text-h2">Seu Ponto</h3>
                            <div className="badge" style={{ backgroundColor: 'var(--badge-purple-bg)', color: 'var(--primary-hover)' }}>
                                Hoje
                            </div>
                        </div>

                        <div className="clock-area">
                            <h1>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</h1>
                            <p>{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>

                        <div className="action-buttons-grid">
                            <button className="btn-ponto btn-entrada"
                                onClick={() => {
                                    setConfirmandoAcao('entrada');
                                    setFacialActive(true);
                                }}
                                disabled={isSubmitting || geoLoading}>
                                <div className="btn-icon-wrapper"><ArrowRightCircle size={24} /></div>
                                Entrada
                            </button>

                            <button className="btn-ponto btn-saida"
                                onClick={() => {
                                    setConfirmandoAcao('saida');
                                    setFacialActive(true);
                                }}
                                disabled={isSubmitting || geoLoading}>
                                <div className="btn-icon-wrapper"><ArrowLeftCircle size={24} /></div>
                                Saída
                            </button>

                            <button className="btn-ponto btn-intervalo-out"
                                onClick={() => {
                                    setConfirmandoAcao('inicio_intervalo');
                                    setFacialActive(true);
                                }}
                                disabled={isSubmitting || geoLoading || !isLunchTime(jornada)}>
                                <div className="btn-icon-wrapper"><Coffee size={20} /></div>
                                Iniciar Almoço
                                {jornada?.intervalo_inicio && (
                                    <span className="btn-horario-hint">{jornada.intervalo_inicio}</span>
                                )}
                            </button>

                            <button className="btn-ponto btn-intervalo-in"
                                onClick={() => {
                                    setConfirmandoAcao('fim_intervalo');
                                    setFacialActive(true);
                                }}
                                disabled={isSubmitting || geoLoading}>
                                <div className="btn-icon-wrapper"><CheckCircle2 size={20} /></div>
                                Retornar do Almoço
                                {jornada?.intervalo_fim && (
                                    <span className="btn-horario-hint">{jornada.intervalo_fim}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Daily Journey Summary Cards */}
                    <div className="journey-summary-cards animate-fade-in" style={{ animationDelay: '0.15s' }}>
                        <div className="mini-card glass-card">
                            <div className="mini-card-icon" style={{ backgroundColor: 'var(--badge-blue-bg)', color: 'var(--primary-color)' }}>
                                <Clock size={18} />
                            </div>
                            <div className="mini-card-info">
                                <span className="mini-card-label">Horas Hoje</span>
                                <span className="mini-card-value">{resumo.horas_hoje}</span>
                                <div className="mini-card-progress">
                                    <div className="progress-fill" style={{ width: `${resumo.horas_hoje_percent}%`, backgroundColor: 'var(--primary-color)' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mini-card glass-card">
                            <div className="mini-card-icon" style={{ backgroundColor: 'var(--badge-purple-bg)', color: 'var(--primary-hover)' }}>
                                <Calendar size={18} />
                            </div>
                            <div className="mini-card-info">
                                <span className="mini-card-label">Saldo do Mês</span>
                                <span className="mini-card-value">{resumo.saldo_mes}</span>
                                <div className="mini-card-progress">
                                    <div className="progress-fill" style={{ width: `${resumo.saldo_mes_percent}%`, backgroundColor: 'var(--primary-hover)' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mini-card glass-card proximo-passo-card">
                            <div className="mini-card-info">
                                <span className="mini-card-label">Próximo Passo</span>
                                <span className="mini-card-value predict-text">{resumo.proximo_passo}</span>
                            </div>
                            <div className="mini-card-icon-right">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Hoje */}
                    {baseData.pontos_hoje && baseData.pontos_hoje.length > 0 && (
                        <div className="timeline-card glass-card animate-fade-in" style={{ animationDelay: '0.18s' }}>
                            <div className="timeline-header">
                                <h3 className="text-xl">Linha do Tempo</h3>
                                <span className="timeline-date">{new Date().toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="timeline-container">
                                {baseData.pontos_hoje.map((ponto, index) => (
                                    <div
                                        key={ponto.id}
                                        className="timeline-item"
                                        onClick={() => setSelectedPonto(ponto)}
                                    >
                                        <div className="timeline-marker">
                                            <div className={`timeline-dot ${ponto.status === 'alerta_geofence' ? 'warning' : 'success'}`}>
                                                {getTipoIcon(ponto.tipo)}
                                            </div>
                                            {index < baseData.pontos_hoje.length - 1 && <div className="timeline-line"></div>}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-content-header">
                                                <h4>{getTipoLabel(ponto.tipo)}</h4>
                                                <span className="timeline-time">
                                                    {new Date(ponto.horario_servidor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {ponto.status === 'alerta_geofence' ? (
                                                <p className="timeline-alert text-xs text-orange-500 flex items-center gap-1 mt-1">
                                                    <AlertTriangle size={12} /> Fora da área permitida
                                                </p>
                                            ) : (
                                                <p className="timeline-success text-xs text-green-500 flex items-center gap-1 mt-1">
                                                    <CheckCircle size={12} /> Localização válida
                                                </p>
                                            )}
                                        </div>
                                        <div className="timeline-chevron">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Footer Card (Geolocation reference Map) */}
                    <div
                        className="status-card glass-card animate-fade-in"
                        style={{
                            animationDelay: '0.2s',
                            borderRadius: 'var(--radius-lg)',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            cursor: 'default'
                        }}
                    >
                        <div className="status-info" style={{ padding: '0.25rem 0' }}>
                            <div className={`status-icon ${geoLoading ? 'loading' : geoError ? 'error' : ''}`}>
                                {geoLoading ? <Loader2 className="spinner" size={20} /> : <MapPin size={22} />}
                            </div>
                            <div className="status-texts" style={{ flex: 1 }}>
                                <h4 style={{ marginBottom: '2px' }}>Localização</h4>
                                {geoLoading ? (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Obtendo GPS...</p>
                                ) : geoError ? (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--badge-red-text)' }}>Erro de permissão</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                            Precisão alta (GPS Ativo)
                                        </p>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 700, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                                            >
                                                {showMap ? 'Ocultar mapa ↑' : 'Clique para ver o mapa ↗'}
                                            </button>
                                            <Link to="/privacidade" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                Privacidade <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                className="icon-btn"
                                style={{ width: '36px', height: '36px', border: '1px solid var(--border-highlight)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    forceReload();
                                }}
                                disabled={geoLoading}
                                title="Forçar atualização de GPS"
                            >
                                <RefreshCcw size={18} className={geoLoading ? "spinner" : ""} />
                            </button>
                        </div>

                        {showMap && latitude && longitude && (
                            <div className="map-wrapper animate-fade-in" style={{ marginTop: '1rem', height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <MapContainer
                                    center={[latitude, longitude]}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        attribution='&copy; OpenStreetMap contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationMarker latitude={latitude} longitude={longitude} />
                                </MapContainer>
                            </div>
                        )}
                    </div>

                    {statusMsg && (
                        <div className={`message-banner animate-fade-in ${isError ? 'error' : 'success'}`} style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
                            {statusMsg}
                        </div>
                    )}

                    {offlineSyncMsg && (
                        <div className="message-banner info animate-fade-in" style={{ position: 'absolute', top: statusMsg ? '5rem' : '1rem', left: '1rem', right: '1rem', zIndex: 9998, boxShadow: 'var(--shadow-lg)' }}>
                            {offlineSyncMsg}
                        </div>
                    )}

                </div>

                {/* Modal de Confirmação de Ação */}
                {confirmandoAcao && (
                    <div className="comprovante-modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
                        <div className="comprovante-modal glass-card">
                            {!facialActive && (
                                <button className="modal-close-btn" onClick={() => {
                                    setConfirmandoAcao(null);
                                    setFacialActive(false);
                                    setFaceDescriptor(null);
                                }}>
                                    <X size={24} />
                                </button>
                            )}

                            <div className="comprovante-header">
                                <div className="comprovante-icon" style={{ backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '50%', padding: '12px' }}>
                                    {facialStatus === 'missing' ? <Fingerprint size={24} /> : (facialActive ? <ScanFace size={24} /> : getTipoIcon(confirmandoAcao))}
                                </div>
                                <h2 style={{ fontSize: '1.4rem', marginTop: '1rem', fontWeight: 700 }}>
                                    {facialStatus === 'missing' ? 'Cadastro de Biometria' : (facialActive ? 'Verificando Identidade' : 'Confirmar Registro')}
                                </h2>
                                <p className="comprovante-date">
                                    {facialStatus === 'missing'
                                        ? 'Para sua segurança, precisamos cadastrar seu rosto.'
                                        : (facialActive ? 'Olhe para a câmera para confirmar sua identidade.' : `Deseja registrar ${getTipoLabel(confirmandoAcao)} agora?`)}
                                </p>
                            </div>

                            <div className="comprovante-body text-center">
                                {/* Só mostramos GPS e Relógio SE a face já foi validada ou não é exigida */}
                                {facialStatus !== 'missing' && !facialActive && (
                                    <>
                                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                <Clock size={16} /> Horário do Registro
                                            </div>
                                            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1, textAlign: 'center' }}>
                                                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <MapPin size={16} /> Informações de Localização
                                            </div>

                                            {geoLoading ? (
                                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <Loader2 size={20} className="spinner" style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
                                                    <span style={{ fontSize: '0.85rem' }}>Obtendo sua localização...</span>
                                                </div>
                                            ) : geoError ? (
                                                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                                    <AlertTriangle size={16} />
                                                    <span>Não é possível registrar o ponto. Verifique suas permissões de GPS.</span>
                                                </div>
                                            ) : latitude && longitude ? (
                                                <>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                                        <span>Lat: {latitude.toFixed(6)}</span>
                                                        <span>Lng: {longitude.toFixed(6)}</span>
                                                    </div>
                                                    <div style={{ height: '90px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                                        <MapContainer
                                                            center={[latitude, longitude]}
                                                            zoom={15}
                                                            style={{ height: '100%', width: '100%' }}
                                                            zoomControl={false}
                                                            dragging={false}
                                                            scrollWheelZoom={false}
                                                            doubleClickZoom={false}
                                                            touchZoom={false}
                                                        >
                                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                            <Marker position={[latitude, longitude]} />
                                                        </MapContainer>
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    </>
                                )}

                                {facialStatus === 'missing' ? (
                                    <div className="facial-enrollment-prompt mb-4">
                                        <div className="alert-box info flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                                            <Fingerprint size={20} className="shrink-0" />
                                            <div>
                                                <strong>Primeiro Acesso:</strong> Precisamos cadastrar seu rosto para aumentar a segurança. Posicione-se bem.
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            {facialActive ? (
                                                <ReconhecimentoFacial
                                                    startCamera={true}
                                                    onDescriptor={handleEnrollment}
                                                />
                                            ) : (
                                                <button
                                                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                                                    onClick={() => setFacialActive(true)}
                                                    style={{ padding: '1rem' }}
                                                >
                                                    <Fingerprint size={18} /> Cadastrar Biometria Facial
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : facialActive ? (
                                    <div className="facial-recognition-prompt mb-4">
                                        <ReconhecimentoFacial
                                            startCamera={true}
                                            onDescriptor={(d) => {
                                                setFaceDescriptor(d);
                                                setFacialActive(false);
                                            }}
                                        />
                                    </div>
                                ) : facialStatus === 'enrolled' && faceDescriptor ? (
                                    <div className="facial-success-container mb-4 text-center p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                                        <CheckCircle size={32} className="mx-auto mb-2" />
                                        <p className="font-bold">Identidade Confirmada</p>
                                        <p className="text-sm">Pronto para registrar o ponto.</p>
                                    </div>
                                ) : null}

                                {facialStatus !== 'missing' && !facialActive && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={confirmRegistration}
                                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                                        disabled={geoLoading || isSubmitting || (!latitude && !longitude) || (facialStatus === 'enrolled' && !faceDescriptor)}
                                    >
                                        {isSubmitting ? <Loader2 size={24} className="spinner" /> : `Confirmar ${getTipoLabel(confirmandoAcao)}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Comprovante Digital */}
                {selectedPonto && (
                    <div className="comprovante-modal-overlay animate-fade-in">
                        <div className="comprovante-modal glass-card">
                            <button className="modal-close-btn" onClick={() => setSelectedPonto(null)}>
                                <X size={24} />
                            </button>

                            <div className="comprovante-header">
                                <div className="comprovante-icon">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2>Comprovante de Ponto</h2>
                                <p className="comprovante-date">
                                    {new Date(selectedPonto.horario_servidor).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                                </p>
                            </div>

                            <div className="comprovante-body">
                                <div className="detail-row">
                                    <span>Tipo de Registro</span>
                                    <strong>{getTipoLabel(selectedPonto.tipo)}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Horário Local</span>
                                    <strong>{new Date(selectedPonto.horario_servidor).toLocaleTimeString('pt-BR')}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Dispositivo</span>
                                    <strong>{selectedPonto.is_offline ? 'Modo Offline (Sincronizado)' : 'Online App'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Restrição Geográfica</span>
                                    <strong className={selectedPonto.status === 'alerta_geofence' ? 'text-red-500' : 'text-green-500'}>
                                        {selectedPonto.status === 'alerta_geofence' ? 'Fora da Cerca' : 'Aprovado'}
                                    </strong>
                                </div>

                                <div className="hash-box" style={{ marginTop: '1rem' }}>
                                    <span>Comprovante de Registro (Portaria 671)</span>
                                    <code style={{ fontSize: '0.65rem', wordBreak: 'break-all', display: 'block', marginTop: '0.5rem' }}>
                                        {selectedPonto.hash_comprovante || selectedPonto.hash_afd}
                                    </code>
                                </div>

                                <button className="btn btn-primary no-print" onClick={() => window.print()} style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Printer size={18} /> Salvar PDF / Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Justificativa de Cerca Geográfica */}
                {showJustificativaModal && pendingPontoPayload && (
                    <div className="comprovante-modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
                        <div className="comprovante-modal glass-card">
                            <button className="modal-close-btn" onClick={() => {
                                setShowJustificativaModal(false);
                                setPendingPontoPayload(null);
                                setJustificativaText('');
                                setIsSubmitting(false);
                            }}>
                                <X size={24} />
                            </button>

                            <div className="comprovante-header">
                                <div className="comprovante-icon" style={{ backgroundColor: '#f59e0b', color: '#fff', borderRadius: '50%', padding: '12px' }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', fontWeight: 700 }}>Registro Fora do Local</h2>
                                <p className="text-sm text-gray-600 mt-2">
                                    Identificamos que você está fora do raio permitido pela empresa para registrar este ponto.
                                </p>
                            </div>

                            <div className="comprovante-body p-4 text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Por favor, justifique o motivo:
                                </label>
                                <textarea
                                    className="w-full p-3 border rounded-md mb-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                                    rows="4"
                                    placeholder="Ex: Reunião externa no cliente XYZ, almoço fora, etc."
                                    value={justificativaText}
                                    onChange={(e) => setJustificativaText(e.target.value)}
                                ></textarea>

                                <button
                                    className="btn btn-primary w-full p-3 font-bold"
                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                                    onClick={() => handleBaterPonto(pendingPontoPayload.tipo, justificativaText)}
                                    disabled={isSubmitting || !justificativaText.trim()}
                                >
                                    {isSubmitting ? <Loader2 size={24} className="spinner mx-auto" /> : 'Enviar e Registrar Ponto'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <HelpModal title="Como Registrar o Ponto" sections={HELP_SECTIONS} />
        </>
    );
};

export default BaterPonto;
