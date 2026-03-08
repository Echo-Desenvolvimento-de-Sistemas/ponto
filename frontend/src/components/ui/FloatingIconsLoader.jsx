import React from "react";
import "./FloatingIconsLoader.css";

/**
 * Componente de Loader com ícones flutuantes.
 * Adaptado para Vanilla CSS do projeto.
 */
const FloatingIconsLoader = ({
    count = 3,
    size = 40,
    color = "var(--primary-color)",
    Icon, // pass icon component
}) => {
    const icons = Array.from({ length: count });

    return (
        <div className="floating-loader-container">
            {icons.map((_, idx) => {
                const delay = idx * 0.3;
                const animationClass =
                    idx % 3 === 0
                        ? "animate-flowe-one"
                        : idx % 3 === 1
                            ? "animate-flowe-two"
                            : "animate-flowe-three";

                return (
                    <div
                        key={idx}
                        className={`floating-loader-item ${animationClass}`}
                        style={{ animationDelay: `${delay}s` }}
                    >
                        {Icon ? <Icon size={size} color={color} /> : null}
                    </div>
                );
            })}
        </div>
    );
};

export default FloatingIconsLoader;
