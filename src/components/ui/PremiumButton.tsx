import React from 'react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const PremiumButton = ({ children, className = '', ...props }: PremiumButtonProps) => {
    return (
        <button className={`premium-btn-wrapper ${className}`} {...props}>
            <div className="btn-outer">
                <div className="btn-inner">
                    <span>{children}</span>
                </div>
            </div>
        </button>
    );
};
