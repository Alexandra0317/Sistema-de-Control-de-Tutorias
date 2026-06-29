const { Observation, StudentTutor, User } = require('../models');
const { formatObservation } = require('../utils/studentFormatter');
const studentService = require('./studentService');

async function listObservations(studentId, userId) {
    await studentService.assertAccessToStudent(studentId, userId);

    const asignaciones = await StudentTutor.findAll({
        where: { student_id: studentId },
        include: [
            { model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] },
            { model: Observation, as: 'observaciones', separate: true, order: [['fecha', 'DESC']] },
        ],
        order: [['fecha_inicio', 'DESC']],
    });

    const observaciones = [];

    for (const asignacion of asignaciones) {
        const plain = asignacion.get({ plain: true });
        for (const obs of plain.observaciones || []) {
            observaciones.push(formatObservation({
                ...obs,
                asignacion: { tutor: plain.tutor },
            }));
        }
    }

    observaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return observaciones;
}

async function createObservation(studentId, data, userId) {
    const user = await studentService.getRequestingUser(userId);
    await studentService.assertAccessToStudent(studentId, user);

    const { contenido, fecha } = data;

    if (!contenido || !contenido.trim()) {
        const error = new Error('El contenido de la observación es requerido');
        error.status = 400;
        throw error;
    }

    const asignacion = await studentService.getAsignacionActiva(studentId);
    if (!asignacion) {
        const error = new Error('El alumno no tiene un tutor asignado actualmente');
        error.status = 400;
        throw error;
    }

    if (!studentService.isAdmin(user) && asignacion.tutor_id !== user.id) {
        const error = new Error('Solo el tutor actual puede registrar observaciones');
        error.status = 403;
        throw error;
    }

    const observacion = await Observation.create({
        asignacion_id: asignacion.id,
        contenido: contenido.trim(),
        fecha: fecha || new Date().toISOString().slice(0, 10),
    });

    await observacion.reload({
        include: [{
            model: StudentTutor,
            as: 'asignacion',
            include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
        }],
    });

    return formatObservation(observacion);
}

module.exports = {
    listObservations,
    createObservation,
};
