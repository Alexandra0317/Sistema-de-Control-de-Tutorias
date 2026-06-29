const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');

const BCRYPT_ROUNDS = 10;

async function seedAdmin() {
    const rolAdmin = await Role.findOne({ where: { nombre: 'administrador' } });

    if (!rolAdmin) {
        throw new Error('No se encontró el rol administrador. Ejecuta primero el seed de roles.');
    }

    const correo = 'admin@tutorias.local';
    const password = 'admin123';

    const existe = await User.scope('withPassword').findOne({ where: { correo } });

    if (existe) {
        return { created: false, correo };
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await User.create({
        correo,
        nombre: 'Administrador',
        apellido_paterno: 'Sistema',
        apellido_materno: null,
        password_hash,
        role_id: rolAdmin.id,
        status: 'activo',
    });

    return { created: true, correo };
}

module.exports = seedAdmin;
