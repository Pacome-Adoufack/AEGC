import { API_BASE_URL } from "../components/Url";

export const CATEGORY_LABELS = {
  ANNOUNCEMENT: "Annonce",
  INFO: "Information",
  EVENT: "Événement",
};

export const categoryLabel = (category) => CATEGORY_LABELS[category] || category;

export const attachmentUrl = (attachment) => `${API_BASE_URL}${attachment.url}`;

export const firstImageAttachment = (announcement) =>
  announcement?.attachments?.find((attachment) => attachment.kind === "image") || null;

// Au-delà de cette longueur, les cartes étroites coupent le résumé (3 lignes max).
const SUMMARY_CLAMP_CHARS = 100;

// Vrai si la modale apporte plus que ce que la carte montre : texte complet,
// pièces jointes, ou fin d'un résumé tronqué à l'affichage.
export const hasMoreToRead = (announcement) =>
  Boolean(announcement?.content?.trim()) ||
  (announcement?.attachments?.length || 0) > 0 ||
  (announcement?.summary?.length || 0) > SUMMARY_CLAMP_CHARS;

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
};

// Le contenu est du texte brut. Les anciennes annonces (script de seed) contiennent
// du HTML : on le convertit en texte au lieu de l'injecter dans la page.
// DOMParser produit un document inerte : aucun script ni chargement n'y est exécuté.
export const contentToText = (content) => {
  if (!content) return "";
  if (!/<[a-z!/][^>]*>/i.test(content)) return content;
  const withBreaks = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ");
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};
