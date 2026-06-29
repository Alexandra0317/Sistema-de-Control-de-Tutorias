const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { formatUserResponse } = require('../utils/userFormatter');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(correo, password) {
    const user = await User.scope('withPassword').findOne({
        where: { correo },
        include: [{ model: Role, as: 'rol' }],
    });

    if (!user) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    }

    if (user.status !== 'activo') {
        const error = new Error('Usuario inactivo');
        error.status = 403;
        throw error;
    }

    if (!user.rol || user.rol.status !== 'activo') {
        const error = new Error('Rol inactivo o no asignado');
        error.status = 403;
        throw error;
    }

    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    }

    await user.update({ ultimo_acceso: new Date() });

    const token = jwt.sign(
        { sub: user.id, role: user.rol.nombre },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
    );

    return {
        token,
        user: formatUserResponse(user),
    };
}

async function getUserById(id) {
    const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'rol' }],
    });

    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    }

    if (user.status !== 'activo') {
        const error = new Error('Usuario inactivo');
        error.status = 403;
        throw error;
    }

    if (!user.rol || user.rol.status !== 'activo') {
        const error = new Error('Rol inactivo o no asignado');
        error.status = 403;
        throw error;
    }

    return formatUserResponse(user);
}

module.exports = {
    login,
    getUserById,
    JWT_SECRET,
};
