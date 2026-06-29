const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { JWT_SECRET } = require('../services/authService');

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        const user = await User.findByPk(payload.sub, {
            include: [{ model: Role, as: 'rol' }],
        });

        if (!user || user.status !== 'activo') {
            return res.status(403).json({ message: 'Usuario inactivo' });
        }

        if (!user.rol || user.rol.status !== 'activo') {
            return res.status(403).json({ message: 'Rol inactivo o no asignado' });
        }

        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = { authenticate };
