const { Op } = require('sequelize');
const {
    sequelize,
    Observation,
    Student,
    StudentTutor,
    User,
    Role,
} = require('../models');
const { formatStudentResponse, formatTutorBrief } = require('../utils/studentFormatter');

const studentInclude = [
    {
        model: StudentTutor,
        as: 'asignaciones',
        include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
    },
];

async function getRequestingUser(userId) {
    const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'rol' }],
    });

    if (!user?.rol) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    }

    return user;
}

function isAdmin(user) {
    return user.rol.nombre === 'administrador';
}

function isProfesor(user) {
    return user.rol.nombre === 'profesor';
}

async function validateTutorId(tutorId) {
    const tutor = await User.findByPk(tutorId, {
        include: [{ model: Role, as: 'rol' }],
    });

    if (!tutor || tutor.status !== 'activo') {
        const error = new Error('Tutor no válido');
        error.status = 400;
        throw error;
    }

    if (tutor.rol?.nombre !== 'profesor' || tutor.rol.status !== 'activo') {
        const error = new Error('El tutor debe ser un profesor activo');
        error.status = 400;
        throw error;
    }

    return tutor;
}

async function getAsignacionActiva(studentId, transaction) {
    return StudentTutor.findOne({
        where: { student_id: studentId, activo: true },
        transaction,
    });
}

async function assertAccessToStudent(studentId, user) {
    const student = await Student.findByPk(studentId, { include: studentInclude });

    if (!student) {
        const error = new Error('Alumno no encontrado');
        error.status = 404;
        throw error;
    }

    if (isAdmin(user)) {
        return student;
    }

    const asignacion = await getAsignacionActiva(studentId);
    if (!asignacion || asignacion.tutor_id !== user.id) {
        const error = new Error('No tienes acceso a este alumno');
        error.status = 403;
        throw error;
    }

    return student;
}

function validateStudentData(data, isUpdate = false) {
    const {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        semestres,
        carrera,
        grupo,
    } = data;

    if (!isUpdate) {
        if (!matricula || !nombre || !apellido_paterno || !semestres || !carrera || !grupo) {
            const error = new Error('Matrícula, nombre, apellido paterno, semestres, carrera y grupo son requeridos');
            error.status = 400;
            throw error;
        }
    }

    if (matricula !== undefined) {
        if (typeof matricula !== 'string' || matricula.length !== 10) {
            const error = new Error('La matrícula debe tener exactamente 10 caracteres');
            error.status = 400;
            throw error;
        }
    }

    if (semestres !== undefined) {
        const sem = Number(semestres);
        if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
            const error = new Error('El semestre debe ser un número entre 1 y 12');
            error.status = 400;
            throw error;
        }
    }
}

async function listProfessors() {
    const profesores = await User.findAll({
        where: { status: 'activo' },
        include: [{
            model: Role,
            as: 'rol',
            where: { nombre: 'profesor', status: 'activo' },
        }],
        order: [['nombre', 'ASC'], ['apellido_paterno', 'ASC']],
        attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'],
    });

    return profesores.map(formatTutorBrief);
}

async function listStudents(userId) {
    const user = await getRequestingUser(userId);

    const whereAsignacion = { activo: true };
    if (isProfesor(user)) {
        whereAsignacion.tutor_id = user.id;
    }

    const students = await Student.findAll({
        include: [{
            model: StudentTutor,
            as: 'asignaciones',
            where: whereAsignacion,
            required: isProfesor(user),
            include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
        }],
        order: [['nombre', 'ASC'], ['apellido_paterno', 'ASC']],
    });

    return students.map((s) => formatStudentResponse(s));
}

async function getStudentById(id, userId) {
    const user = await getRequestingUser(userId);
    await assertAccessToStudent(id, user);

    const student = await Student.findByPk(id, {
        include: [{
            model: StudentTutor,
            as: 'asignaciones',
            include: [
                { model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] },
                { model: Observation, as: 'observaciones', separate: true, order: [['fecha', 'DESC']] },
            ],
        }],
    });

    return formatStudentResponse(student, { includeHistorial: true });
}

async function createStudent(data, userId) {
    const user = await getRequestingUser(userId);
    validateStudentData(data);

    const {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        semestres,
        carrera,
        grupo,
        tutor_id,
    } = data;

    let tutorIdFinal;

    if (isAdmin(user)) {
        if (!tutor_id) {
            const error = new Error('Debes asignar un profesor tutor al alumno');
            error.status = 400;
            throw error;
        }
        await validateTutorId(tutor_id);
        tutorIdFinal = tutor_id;
    } else if (isProfesor(user)) {
        tutorIdFinal = user.id;
    } else {
        const error = new Error('No tienes permiso para dar de alta alumnos');
        error.status = 403;
        throw error;
    }

    const existente = await Student.findOne({ where: { matricula } });
    if (existente) {
        const error = new Error('Ya existe un alumno con esa matrícula');
        error.status = 409;
        throw error;
    }

    const transaction = await sequelize.transaction();

    try {
        const student = await Student.create({
            matricula,
            nombre,
            apellido_paterno,
            apellido_materno: apellido_materno || null,
            semestres: Number(semestres),
            carrera,
            grupo,
        }, { transaction });

        await StudentTutor.create({
            student_id: student.id,
            tutor_id: tutorIdFinal,
            fecha_inicio: new Date().toISOString().slice(0, 10),
            activo: true,
        }, { transaction });

        await transaction.commit();

        await student.reload({ include: studentInclude });
        return formatStudentResponse(student);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function updateStudent(id, data, userId) {
    const user = await getRequestingUser(userId);
    await assertAccessToStudent(id, user);
    validateStudentData(data, true);

    const student = await Student.findByPk(id);
    const updates = {};

    const fields = ['matricula', 'nombre', 'apellido_paterno', 'apellido_materno', 'semestres', 'carrera', 'grupo'];
    for (const field of fields) {
        if (data[field] !== undefined) {
            if (field === 'semestres') {
                updates[field] = Number(data[field]);
            } else if (field === 'apellido_materno') {
                updates[field] = data[field] || null;
            } else {
                updates[field] = data[field];
            }
        }
    }

    if (Object.keys(updates).length === 0) {
        const error = new Error('No hay datos para actualizar');
        error.status = 400;
        throw error;
    }

    if (updates.matricula) {
        const duplicado = await Student.findOne({
            where: { matricula: updates.matricula, id: { [Op.ne]: id } },
        });
        if (duplicado) {
            const error = new Error('Ya existe un alumno con esa matrícula');
            error.status = 409;
            throw error;
        }
    }

    await student.update(updates);
    await student.reload({ include: studentInclude });
    return formatStudentResponse(student);
}

async function deleteStudent(id, userId) {
    const user = await getRequestingUser(userId);

    if (!isAdmin(user)) {
        const error = new Error('Solo un administrador puede eliminar alumnos');
        error.status = 403;
        throw error;
    }

    const student = await Student.findByPk(id);
    if (!student) {
        const error = new Error('Alumno no encontrado');
        error.status = 404;
        throw error;
    }

    await student.destroy();
}

async function changeTutor(studentId, tutorId, userId) {
    const user = await getRequestingUser(userId);

    if (!isAdmin(user)) {
        const error = new Error('Solo un administrador puede cambiar el tutor de un alumno');
        error.status = 403;
        throw error;
    }

    await validateTutorId(tutorId);

    const student = await Student.findByPk(studentId);
    if (!student) {
        const error = new Error('Alumno no encontrado');
        error.status = 404;
        throw error;
    }

    const asignacionActual = await getAsignacionActiva(studentId);

    if (asignacionActual && asignacionActual.tutor_id === tutorId) {
        const error = new Error('Este profesor ya es el tutor actual del alumno');
        error.status = 400;
        throw error;
    }

    const transaction = await sequelize.transaction();
    const hoy = new Date().toISOString().slice(0, 10);

    try {
        if (asignacionActual) {
            await asignacionActual.update({
                activo: false,
                fecha_fin: hoy,
            }, { transaction });
        }

        await StudentTutor.create({
            student_id: studentId,
            tutor_id: tutorId,
            fecha_inicio: hoy,
            activo: true,
        }, { transaction });

        await transaction.commit();

        await student.reload({ include: studentInclude });
        return formatStudentResponse(student, { includeHistorial: true });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getTutorHistory(studentId, userId) {
    const user = await getRequestingUser(userId);
    await assertAccessToStudent(studentId, user);

    const asignaciones = await StudentTutor.findAll({
        where: { student_id: studentId },
        include: [
            { model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] },
            { model: Observation, as: 'observaciones', separate: true, order: [['fecha', 'DESC']] },
        ],
        order: [['fecha_inicio', 'DESC']],
    });

    const { formatAsignacion } = require('../utils/studentFormatter');
    return asignaciones.map(formatAsignacion);
}

module.exports = {
    listProfessors,
    listStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    changeTutor,
    getTutorHistory,
    getRequestingUser,
    assertAccessToStudent,
    getAsignacionActiva,
    isAdmin,
    isProfesor,
};
