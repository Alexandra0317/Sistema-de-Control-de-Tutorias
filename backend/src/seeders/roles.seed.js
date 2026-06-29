const { Role } = require('../models');

const ROLES_INICIALES = [
    {
        nombre: 'administrador',
        descripcion: 'Acceso completo al sistema de tutorías',
        status: 'activo',
        permisos: {
            usuarios: ['crear', 'leer', 'actualizar', 'eliminar'],
            roles: ['leer'],
            tutorias: ['crear', 'leer', 'actualizar', 'eliminar'],
            reportes: ['leer', 'exportar'],
        },
    },
    {
        nombre: 'profesor',
        descripcion: 'Gestión de tutorías y consulta de estudiantes',
        status: 'activo',
        permisos: {
            tutorias: ['crear', 'leer', 'actualizar'],
            estudiantes: ['leer'],
            reportes: ['leer'],
        },
    },
];

async function seedRoles() {
    const resultados = [];

    for (const datosRol of ROLES_INICIALES) {
        const [rol, created] = await Role.findOrCreate({
            where: { nombre: datosRol.nombre },
            defaults: datosRol,
        });

        resultados.push({ nombre: rol.nombre, created });
    }

    return resultados;
}

module.exports = seedRoles;
