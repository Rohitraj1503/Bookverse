import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && (
          <div
            className="modal-actions"
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
