import { createContext } from "react";

export const ToastContext = createContext(null);

export const toastIcons = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  warning: "⚠",
};
