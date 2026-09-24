import React, { useState, useCallback, useMemo } from "react";
import "@/styles/Toast.css";
import { ToastContext, toastIcons } from "@/hooks/ToastContext.js";

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // useMemo est indispensable ici : sans lui, cet objet change d'identité à
  // chaque rendu du fournisseur, donc pour TOUS les composants qui appellent
  // useToast(). Un useEffect qui liste `toast` dans ses dépendances repart
  // alors en boucle, et comme afficher une notification re-rend le fournisseur,
  // la boucle s'alimente elle-même (« Maximum update depth exceeded »).
  const toast = useMemo(
    () => ({
      success: (msg, duration) => addToast(msg, "success", duration),
      error: (msg, duration) => addToast(msg, "error", duration),
      info: (msg, duration) => addToast(msg, "info", duration),
      warning: (msg, duration) => addToast(msg, "warning", duration),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{toastIcons[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Fermer"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}