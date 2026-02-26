/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * Usage: requireRole(['admin', 'dev'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Si pas d'utilisateur authentifié
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    // Récupérer le rôle avec compatibilité ascendante
    const userRole = req.user.role || "user";

    // Vérifier si le rôle est autorisé
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Accès refusé",
        message: `Cette action nécessite l'un des rôles suivants: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

export default requireRole;
