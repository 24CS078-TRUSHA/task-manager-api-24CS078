const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authorization = req.get("Authorization");
    const [scheme, token, ...extraParts] = authorization
        ? authorization.split(" ")
        : [];

    if (scheme !== "Bearer" || !token || extraParts.length > 0) {
        return res.status(401).json({
            message: "A Bearer token is required"
        });
    }

    if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET is not configured"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });

        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.id !== "string"
        ) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.user = { id: decoded.id };
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        return next(error);
    }
}

module.exports = authenticateToken;
