/**
 * Utilitaire pour gérer le stockage du token d'authentification
 * Centralise la logique pour éviter les incohérences
 */

/**
 * Récupère le token depuis le stockage
 * Vérifie d'abord localStorage, puis sessionStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

/**
 * Stocke le token
 * @param {string} token - Le token JWT
 * @param {boolean} rememberMe - Si true, stocke dans localStorage, sinon sessionStorage
 */
export const setAuthToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
};

/**
 * Supprime le token des deux stockages
 */
export const removeAuthToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

/**
 * Vérifie si un token existe
 */
export const hasAuthToken = () => {
  return !!getAuthToken();
};

/**
 * Récupère les headers d'authentification pour les requêtes API
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  hasAuthToken,
  getAuthHeaders,
};
