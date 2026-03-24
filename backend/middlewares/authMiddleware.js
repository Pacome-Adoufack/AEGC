import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  const isProduction = process.env.NODE_ENV === "production";
  const authHeader = req.headers.authorization;
  const queryToken =
    !isProduction && typeof req.query?.token === "string"
      ? req.query.token
      : null;

  const tokenFromHeader = authHeader ? authHeader.split(" ")[1] : null;
  const token = tokenFromHeader || queryToken;

  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Standardise ici : toujours définir req.user.id, _id et role
    const userId = decoded.id || decoded.userId;
    req.user = {
      id: userId,
      _id: userId, // Compatibilité avec MongoDB _id
      role: decoded.role || "user", // Compatibilité ascendante
      ...decoded,
    };

    next();
  } catch (err) {
    if (!isProduction) {
      console.error("Erreur de vérification du token :", err.message);
    }
    res.status(403).json({ error: "Accès refusé" });
  }
}

export default authMiddleware;
