const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/authService');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = { authenticate };
