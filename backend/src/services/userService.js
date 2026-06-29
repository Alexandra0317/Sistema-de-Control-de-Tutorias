const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { formatUserResponse } = require('../utils/userFormatter');

const SALT_ROUNDS = 10;

async function listUsers() {
    const users = await User.findAll({
        include: [{ model: Role, as: 'rol' }],
        order: [['nombre', 'ASC'], ['apellido_paterno', 'ASC']],
    });

    return users.map(formatUserResponse);
}

async function createUser(data) {
    const {
        correo,
        password,
        nombre,
        apellido_paterno,
        apellido_materno,
        telefono,
        role_id,
        status = 'activo',
    } = data;

    if (!correo || !password || !nombre || !apellido_paterno || !role_id) {
        const error = new Error('Correo, contraseña, nombre, apellido paterno y rol son requeridos');
        error.status = 400;
        throw error;
    }

    if (password.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres');
        error.status = 400;
        throw error;
    }

    const rol = await Role.findByPk(role_id);
    if (!rol || rol.status !== 'activo') {
        const error = new Error('Rol no válido');
        error.status = 400;
        throw error;
    }

    const existente = await User.findOne({ where: { correo } });
    if (existente) {
        const error = new Error('Ya existe un usuario con ese correo');
        error.status = 409;
        throw error;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        correo,
        password_hash,
        nombre,
        apellido_paterno,
        apellido_materno: apellido_materno || null,
        telefono: telefono || null,
        role_id,
        status,
    });

    await user.reload({ include: [{ model: Role, as: 'rol' }] });
    return formatUserResponse(user);
}

async function updateUser(id, data) {
    const { telefono, status, password } = data;

    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    }

    const updates = {};

    if (telefono !== undefined) {
        updates.telefono = telefono || null;
    }

    if (status !== undefined) {
        if (!['activo', 'inactivo'].includes(status)) {
            const error = new Error('Estado no válido');
            error.status = 400;
            throw error;
        }
        updates.status = status;
    }

    if (password) {
        if (password.length < 6) {
            const error = new Error('La contraseña debe tener al menos 6 caracteres');
            error.status = 400;
            throw error;
        }
        updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
        const error = new Error('No hay datos para actualizar');
        error.status = 400;
        throw error;
    }

    await user.update(updates);
    await user.reload({ include: [{ model: Role, as: 'rol' }] });
    return formatUserResponse(user);
}

async function updatePassword(id, password) {
    if (!password || password.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres');
        error.status = 400;
        throw error;
    }

    const user = await User.scope('withPassword').findByPk(id);
    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await user.update({ password_hash });

    await user.reload({ include: [{ model: Role, as: 'rol' }] });
    return formatUserResponse(user);
}

async function listRoles() {
    const roles = await Role.findAll({
        where: { status: 'activo' },
        order: [['nombre', 'ASC']],
    });

    return roles.map((rol) => ({
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
    }));
}

module.exports = {
    listUsers,
    createUser,
    updateUser,
    updatePassword,
    listRoles,
};
