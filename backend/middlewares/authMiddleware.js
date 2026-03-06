import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("DEBUG Auth - Header Authorization présent:", !!authHeader);
  console.log("DEBUG Auth - URL:", req.method, req.originalUrl);

  if (!authHeader) {
    console.log("DEBUG Auth - Header manquant");
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  console.log(
    "DEBUG Auth - Token extrait:",
    token ? `${token.substring(0, 20)}...` : "VIDE",
  );

  if (!token) {
    console.log("DEBUG Auth - Token vide après extraction");
    return res.status(401).json({ error: "Token missing" });
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

    console.log("Utilisateur authentifié :", req.user);

    next();
  } catch (err) {
    console.error("Erreur de vérification du token :", err.message);
    res.status(403).json({ error: "SVP veillez vous inscrire" });
  }
}

export default authMiddleware;
