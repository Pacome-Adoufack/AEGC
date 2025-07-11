import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
    console.log(req.body);
    
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "Authorization header missing" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("Decoded user:", user);
        req.user = user;
        next();
    } catch (err) {
        res.status(403).json({ error: "SVP veillez vous inscrire" });
    }
}

export default authMiddleware;