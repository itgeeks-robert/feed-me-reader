import React, { createContext, useContext, useState, useId } from 'react';

interface DisclosureContextType {
    isOpen: boolean;
    toggleOpen: () => void;
    panelId: string;
}

const DisclosureContext = createContext<DisclosureContextType | null>(null);

const useDisclosureContext = () => {
    const context = useContext(DisclosureContext);
    if (!context) {
        throw new Error('Disclosure components must be used within a Disclosure provider');
    }
    return context;
};

// Main component (Provider)
export const Disclosure: React.FC<{ children: React.ReactNode, defaultOpen?: boolean }> = ({ children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const panelId = useId();
    const toggleOpen = () => setIsOpen(prev => !prev);

    return (
        <DisclosureContext.Provider value={{ isOpen, toggleOpen, panelId }}>
            {children}
        </DisclosureContext.Provider>
    );
};

// Button component
export const DisclosureButton: React.FC<{ children: React.ReactNode | ((props: { open: boolean }) => React.ReactNode), className?: string }> = ({ children, className }) => {
    const { isOpen, toggleOpen, panelId } = useDisclosureContext();

    return (
        <button
            onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
            className={className}
            aria-expanded={isOpen}
            aria-controls={panelId}
        >
            {typeof children === 'function' ? children({ open: isOpen }) : children}
        </button>
    );
};

// Panel component
export const DisclosurePanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const { isOpen, panelId } = useDisclosureContext();

    return isOpen ? (
        <div id={panelId} className={className}>
            {children}
        </div>
    ) : null;
};
