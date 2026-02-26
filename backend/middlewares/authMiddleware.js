import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Standardise ici : toujours définir req.user.id et role
    req.user = {
      id: decoded.id || decoded.userId,
      role: decoded.role || "user", // Compatibilité ascendante
      ...decoded,
    };

    console.log("Utilisateur authentifié :", req.user);

    next();
  } catch (err) {
    console.error("Erreur de vérification du token :", err.message);
    res.status(403).json({ error: "SVP veillez vous inscrire" });
  }
}

export default authMiddleware;
