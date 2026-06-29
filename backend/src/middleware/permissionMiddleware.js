const { User, Role } = require('../models');

function authorize(recurso, accion) {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId, {
                include: [{ model: Role, as: 'rol' }],
            });

            if (!user?.rol || user.rol.status !== 'activo') {
                return res.status(403).json({ message: 'Sin permisos para esta acción' });
            }

            const permisos = user.rol.permisos || {};
            const acciones = permisos[recurso];

            if (!Array.isArray(acciones) || !acciones.includes(accion)) {
                return res.status(403).json({ message: 'No tienes permiso para esta acción' });
            }

            next();
        } catch {
            return res.status(500).json({ message: 'Error al verificar permisos' });
        }
    };
}

module.exports = { authorize };
