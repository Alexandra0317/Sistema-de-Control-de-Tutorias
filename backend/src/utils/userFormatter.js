function formatUserResponse(user) {
    const plain = user.get({ plain: true });
    const { rol, ...usuario } = plain;

    return {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        telefono: usuario.telefono,
        status: usuario.status,
        rol: rol
            ? {
                  id: rol.id,
                  nombre: rol.nombre,
                  descripcion: rol.descripcion,
                  permisos: rol.permisos,
              }
            : null,
    };
}

module.exports = { formatUserResponse };
