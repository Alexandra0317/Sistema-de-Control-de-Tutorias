function formatTutorBrief(tutor) {
    if (!tutor) return null;

    return {
        id: tutor.id,
        nombre: tutor.nombre,
        apellido_paterno: tutor.apellido_paterno,
        apellido_materno: tutor.apellido_materno,
        correo: tutor.correo,
    };
}

function formatAsignacion(asignacion) {
    const plain = asignacion.get ? asignacion.get({ plain: true }) : asignacion;

    return {
        id: plain.id,
        fecha_inicio: plain.fecha_inicio,
        fecha_fin: plain.fecha_fin,
        activo: plain.activo,
        tutor: formatTutorBrief(plain.tutor),
        observaciones: plain.observaciones
            ? plain.observaciones.map(formatObservation)
            : undefined,
    };
}

function formatObservation(observacion) {
    const plain = observacion.get ? observacion.get({ plain: true }) : observacion;

    return {
        id: plain.id,
        asignacion_id: plain.asignacion_id,
        contenido: plain.contenido,
        fecha: plain.fecha,
        tutor: plain.asignacion?.tutor
            ? formatTutorBrief(plain.asignacion.tutor)
            : undefined,
    };
}

function formatStudentResponse(student, options = {}) {
    const plain = student.get({ plain: true });
    const asignaciones = plain.asignaciones || [];
    const asignacionActiva = asignaciones.find((a) => a.activo) || null;

    const result = {
        id: plain.id,
        matricula: plain.matricula,
        nombre: plain.nombre,
        apellido_paterno: plain.apellido_paterno,
        apellido_materno: plain.apellido_materno,
        semestres: plain.semestres,
        carrera: plain.carrera,
        grupo: plain.grupo,
        tutor_actual: asignacionActiva ? formatTutorBrief(asignacionActiva.tutor) : null,
        asignacion_activa_id: asignacionActiva?.id ?? null,
    };

    if (options.includeHistorial) {
        result.historial_tutores = asignaciones
            .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
            .map(formatAsignacion);
    }

    return result;
}

module.exports = {
    formatStudentResponse,
    formatAsignacion,
    formatObservation,
    formatTutorBrief,
};
