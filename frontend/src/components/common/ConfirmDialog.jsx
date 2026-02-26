import React from 'react';
import '../../styles/ConfirmDialog.css';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation",
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = "danger" // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return '⚠️';
            case 'warning':
                return '⚡';
            case 'info':
                return 'ℹ️';
            default:
                return '❓';
        }
    };

    return (
        <div className="confirm-overlay" onClick={onClose}>
            <div className={`confirm-dialog ${type}`} onClick={(e) => e.stopPropagation()}>
                <div className="confirm-header">
                    <span className="confirm-icon">{getIcon()}</span>
                    <h3>{title}</h3>
                </div>
                <div className="confirm-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-footer">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn-confirm btn-confirm-${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
