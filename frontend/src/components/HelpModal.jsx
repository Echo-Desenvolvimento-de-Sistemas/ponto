import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import './HelpModal.css';

/**
 * Componente reutilizável de ajuda.
 * Props:
 *   title: string — título do modal
 *   sections: Array<{ heading: string, items: string[] }>
 */
const HelpModal = ({ title, sections }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Botão flutuante ? */}
            <button
                className="help-trigger-btn"
                onClick={() => setOpen(true)}
                aria-label="Ajuda"
                title="Como usar esta página"
            >
                <HelpCircle size={20} />
            </button>

            {/* Modal */}
            {open && (
                <div className="help-modal-overlay" onClick={() => setOpen(false)}>
                    <div
                        className="help-modal-panel glass-card animate-fade-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="help-modal-header">
                            <div className="help-modal-title-row">
                                <HelpCircle size={20} className="help-header-icon" />
                                <h2>{title}</h2>
                            </div>
                            <button onClick={() => setOpen(false)} className="help-close-btn" aria-label="Fechar">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Conteúdo */}
                        <div className="help-modal-body">
                            {sections.map((sec, i) => (
                                <div key={i} className="help-section">
                                    {sec.heading && (
                                        <h3 className="help-section-title">{sec.heading}</h3>
                                    )}
                                    <ul className="help-items-list">
                                        {sec.items.map((item, j) => (
                                            <li key={j} className="help-item">
                                                <ChevronRight size={14} className="help-item-icon" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpModal;
