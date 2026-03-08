import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserCheck, AlertTriangle, UserX, Clock, ChevronRight, MapPin, Loader2, Navigation, Building, Fingerprint } from 'lucide-react';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePageTitle from '../../utils/usePageTitle';
import './AdminDashboard.css';

// Fix leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMap } from 'react-leaflet';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const AdminDashboard = () => {
    const { user } = useAuth();
    usePageTitle('Painel');

    const [dashboardData, setDashboardData] = useState({
        metrics: {
            total_colaboradores: 0,
            presentes_hoje: 0,
            faltas: 0,
            alertas_cerca: 0
        },
        recent_activity: []
    });
    const [loading, setLoading] = useState(true);
    const [mapInstance, setMapInstance] = useState(null);

    // Componente interno para controle do mapa
    const MapController = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            if (center) map.setView(center, map.getZoom());
        }, [center, map]);
        return null;
    };

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/dashboard/metrics');
                setDashboardData(response.data);
            } catch (error) {
                console.error("Erro ao buscar métricas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const isAdminGlobal = user?.role === 'admin_global';

    const metrics = isAdminGlobal ? [
        { title: 'Total de Empresas', value: dashboardData?.metrics?.total_empresas || 0, icon: <Building size={24} />, color: 'var(--badge-blue-text)', bgColor: 'var(--badge-blue-bg)' },
        { title: 'Total de Usuários', value: dashboardData?.metrics?.total_usuarios || 0, icon: <Users size={24} />, color: 'var(--badge-green-text)', bgColor: 'var(--badge-green-bg)' },
        { title: 'Tickets Pendentes', value: dashboardData?.metrics?.tickets_pendentes || 0, icon: <AlertTriangle size={24} />, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
        { title: 'Registros Hoje', value: dashboardData?.metrics?.total_pontos_hoje || 0, icon: <Fingerprint size={24} />, color: 'var(--text-muted)', bgColor: 'var(--surface-color-light)' }
    ] : [
        { title: 'Total de Colaboradores', value: dashboardData?.metrics?.total_colaboradores || 0, icon: <Users size={24} />, color: 'var(--badge-blue-text)', bgColor: 'var(--badge-blue-bg)' },
        { title: 'Presentes Hoje', value: dashboardData?.metrics?.presentes_hoje || 0, icon: <UserCheck size={24} />, color: 'var(--badge-green-text)', bgColor: 'var(--badge-green-bg)' },
        { title: 'Faltas', value: dashboardData?.metrics?.faltas || 0, icon: <UserX size={24} />, color: 'var(--text-muted)', bgColor: 'var(--surface-color-light)' },
        { title: 'Atrasos & Alertas', value: dashboardData?.metrics?.alertas_cerca || 0, icon: <AlertTriangle size={24} />, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' }
    ];

    const recentActivity = dashboardData.recent_activity || [];
    const validLocations = recentActivity.filter(a => a.lat && a.lng);
    const mapCenter = validLocations.length > 0 ? [validLocations[0].lat, validLocations[0].lng] : [-23.5505, -46.6333];

    if (loading) {
        return (
            <div className="admin-dashboard flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-color" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Visão Geral</h1>
                    <p className="text-muted">Bem-vindo de volta, {user?.name}. Aqui está o resumo de hoje.</p>
                </div>
                <div className="header-actions">
                    <Link to="/relatorios" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        Gerar Espelho
                    </Link>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="metric-card glass-card animate-fade-in" style={{ animationDelay: `${0.1 * idx}s` }}>
                        <div className="metric-icon" style={{ backgroundColor: metric.bgColor, color: metric.color }}>
                            {metric.icon}
                        </div>
                        <div className="metric-info">
                            <h3 className="metric-value">{metric.value}</h3>
                            <span className="metric-title">{metric.title}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content-grid">

                {/* Map (Geolocalização em Tempo Real) - Only for RH or if there are locations */}
                {!isAdminGlobal && (
                    <div className="map-card glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="card-header">
                            <h2 className="card-title flex items-center gap-2">
                                <Navigation size={20} className="text-primary-color" /> Mapa ao Vivo
                            </h2>
                        </div>
                        <div className="map-wrapper mt-4">
                            <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '350px', width: '100%', borderRadius: '12px', zIndex: 0 }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapController center={mapCenter} />
                                {recentActivity.map((activity, idx) => {
                                    if (!activity.lat || !activity.lng) return null;

                                    const customIcon = L.divIcon({
                                        className: 'custom-div-icon',
                                        html: `<div class="map-marker-avatar" style="background-color: var(--primary-color); color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.2)">${activity.name.charAt(0)}</div>`,
                                        iconSize: [32, 32],
                                        iconAnchor: [16, 16]
                                    });

                                    return (
                                        <Marker
                                            key={idx}
                                            position={[activity.lat, activity.lng]}
                                            icon={customIcon}
                                        >
                                            <Popup className="custom-map-popup">
                                                <div className="popup-content">
                                                    <div className="popup-user-header">
                                                        <div className="popup-avatar">{activity.name.charAt(0)}</div>
                                                        <div>
                                                            <h4 className="font-bold">{activity.name}</h4>
                                                            <span className="text-xs text-muted">{activity.role}</span>
                                                        </div>
                                                    </div>
                                                    <div className="popup-info mt-2 pt-2 border-t">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {activity.time}</span>
                                                            <span className={`feed-badge ${activity.status || 'success'}`}>{activity.type}</span>
                                                        </div>
                                                        {activity.photo && (
                                                            <img
                                                                src={activity.photo.startsWith('http') ? activity.photo : `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${activity.photo}`}
                                                                alt="Reconhecimento"
                                                                className="w-full h-24 object-cover rounded-md mt-2"
                                                            />
                                                        )}
                                                        {activity.location_name && (
                                                            <div className="text-[10px] text-muted mt-1 flex items-center gap-1">
                                                                <MapPin size={10} /> {activity.location_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Live Feed / System Activity Feed */}
                <div className={`feed-card glass-card animate-fade-in ${isAdminGlobal ? 'col-span-2' : ''}`} style={{ animationDelay: '0.4s' }}>
                    <div className="card-header">
                        <h2 className="card-title">{isAdminGlobal ? 'Atividades do Sistema' : 'Feed de Últimos Registros'}</h2>
                        {!isAdminGlobal && <button className="link-btn">Ver Todos</button>}
                    </div>
                    <div className="feed-list" style={{ maxHeight: isAdminGlobal ? '500px' : '350px', overflowY: 'auto' }}>
                        {recentActivity.length > 0 ? (
                            recentActivity.map(activity => (
                                <div
                                    key={activity.id}
                                    className="feed-item clickable"
                                    onClick={() => {
                                        if (activity.lat && activity.lng) {
                                            const newCenter = [activity.lat, activity.lng];
                                            setDashboardData(prev => ({ ...prev })); // Force refresh maps if needed
                                            // Scroll back to map on mobile
                                            if (window.innerWidth < 1024) {
                                                document.querySelector('.map-card')?.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }
                                    }}
                                >
                                    <div className="feed-avatar">
                                        {activity.name.charAt(0)}
                                    </div>
                                    <div className="feed-details">
                                        <div className="feed-user">
                                            <h4>{activity.name}</h4>
                                            <span>{activity.role}</span>
                                        </div>
                                        <div className="feed-meta">
                                            <div className="feed-time">
                                                <Clock size={14} />
                                                <span>{activity.time}</span>
                                            </div>
                                            <div className={`feed-badge ${activity.status}`}>
                                                {activity.type}
                                            </div>
                                        </div>
                                        {activity.note && (
                                            <div className="feed-note">
                                                <AlertTriangle size={12} /> {activity.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 font-medium">
                                Nenhuma atividade monitorada hoje ainda.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
