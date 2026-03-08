import React from 'react';
import { Clock, Calendar, Zap, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'ponto', label: 'Home', icon: <Clock size={20} /> },
        { id: 'historico', label: 'Histórico', icon: <Calendar size={20} /> },
        { id: 'acoes', label: 'Ações', icon: <Zap size={20} /> },
        { id: 'perfil', label: 'Perfil', icon: <User size={20} /> }
    ];

    return (
        <div className="bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <div className="nav-icon">{tab.icon}</div>
                    <span className="nav-label">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default BottomNav;
