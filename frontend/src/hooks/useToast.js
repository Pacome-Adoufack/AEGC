import { useContext } from "react";
import { ToastContext } from "./ToastContext.js";

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit etre utilise dans un ToastProvider");
  return ctx;
}
