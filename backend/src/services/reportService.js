const { Op } = require('sequelize');
const {
    Observation,
    Role,
    Student,
    StudentTutor,
    User,
} = require('../models');
const { formatTutorBrief, formatAsignacion, formatObservation } = require('../utils/studentFormatter');
const { getRequestingUser, isAdmin, isProfesor } = require('./studentService');

const studentInclude = [
    {
        model: StudentTutor,
        as: 'asignaciones',
        include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
    },
];

function nombreCompleto(person) {
    if (!person) return '';
    return [person.nombre, person.apellido_paterno, person.apellido_materno].filter(Boolean).join(' ');
}

function parseDate(value, fallback) {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const error = new Error('Fecha no válida');
        error.status = 400;
        throw error;
    }
    return value.slice(0, 10);
}

function defaultDateRange() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return {
        desde: inicio.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
    };
}

function buildStudentWhere(filters) {
    const where = { status: 'activo' };

    if (filters.carrera) {
        where.carrera = filters.carrera;
    }
    if (filters.grupo) {
        where.grupo = filters.grupo;
    }
    if (filters.semestre) {
        const sem = Number.parseInt(filters.semestre, 10);
        if (!Number.isNaN(sem)) {
            where.semestres = sem;
        }
    }

    return where;
}

function getAsignacionActivaFromStudent(student) {
    const plain = student.get ? student.get({ plain: true }) : student;
    return (plain.asignaciones || []).find((a) => a.activo) || null;
}

function formatAlumnoBrief(student) {
    const plain = student.get ? student.get({ plain: true }) : student;
    const asignacionActiva = getAsignacionActivaFromStudent(student);

    return {
        id: plain.id,
        matricula: plain.matricula,
        nombre: plain.nombre,
        apellido_paterno: plain.apellido_paterno,
        apellido_materno: plain.apellido_materno,
        semestres: plain.semestres,
        carrera: plain.carrera,
        grupo: plain.grupo,
        status: plain.status,
        tutor_actual: asignacionActiva ? formatTutorBrief(asignacionActiva.tutor) : null,
    };
}

async function assertAdmin(userId) {
    const user = await getRequestingUser(userId);

    if (!isAdmin(user)) {
        const error = new Error('Solo un administrador puede acceder a este reporte');
        error.status = 403;
        throw error;
    }

    return user;
}

async function getCoberturaReport(userId, filters = {}) {
    await assertAdmin(userId);

    const where = buildStudentWhere(filters);

    const students = await Student.findAll({
        where,
        include: [{
            model: StudentTutor,
            as: 'asignaciones',
            where: { activo: true },
            required: false,
            include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
        }],
        order: [['carrera', 'ASC'], ['grupo', 'ASC'], ['nombre', 'ASC']],
    });

    const alumnosSinTutor = [];
    const porTutorMap = new Map();
    const porCarreraMap = new Map();
    const porGrupoMap = new Map();

    let conTutor = 0;
    let sinTutor = 0;

    for (const student of students) {
        const asignacion = getAsignacionActivaFromStudent(student);
        const alumno = formatAlumnoBrief(student);

        if (asignacion?.tutor) {
            conTutor += 1;
            const tutorKey = asignacion.tutor.id;
            if (!porTutorMap.has(tutorKey)) {
                porTutorMap.set(tutorKey, {
                    tutor: formatTutorBrief(asignacion.tutor),
                    total_alumnos: 0,
                    alumnos: [],
                });
            }
            const entry = porTutorMap.get(tutorKey);
            entry.total_alumnos += 1;
            entry.alumnos.push(alumno);
        } else {
            sinTutor += 1;
            alumnosSinTutor.push(alumno);
        }

        const carreraKey = student.carrera;
        if (!porCarreraMap.has(carreraKey)) {
            porCarreraMap.set(carreraKey, { carrera: carreraKey, total: 0, con_tutor: 0, sin_tutor: 0 });
        }
        const carreraEntry = porCarreraMap.get(carreraKey);
        carreraEntry.total += 1;
        if (asignacion?.tutor) {
            carreraEntry.con_tutor += 1;
        } else {
            carreraEntry.sin_tutor += 1;
        }

        const grupoKey = `${student.carrera}|${student.grupo}`;
        if (!porGrupoMap.has(grupoKey)) {
            porGrupoMap.set(grupoKey, {
                carrera: student.carrera,
                grupo: student.grupo,
                total: 0,
                con_tutor: 0,
                sin_tutor: 0,
            });
        }
        const grupoEntry = porGrupoMap.get(grupoKey);
        grupoEntry.total += 1;
        if (asignacion?.tutor) {
            grupoEntry.con_tutor += 1;
        } else {
            grupoEntry.sin_tutor += 1;
        }
    }

    return {
        filtros: filters,
        resumen: {
            total_alumnos: students.length,
            con_tutor: conTutor,
            sin_tutor: sinTutor,
        },
        por_tutor: Array.from(porTutorMap.values()).sort((a, b) => b.total_alumnos - a.total_alumnos),
        por_carrera: Array.from(porCarreraMap.values()).sort((a, b) => a.carrera.localeCompare(b.carrera)),
        por_grupo: Array.from(porGrupoMap.values()).sort((a, b) => a.carrera.localeCompare(b.carrera) || a.grupo.localeCompare(b.grupo)),
        alumnos_sin_tutor: alumnosSinTutor,
    };
}

async function getActividadReport(userId, filters = {}) {
    await assertAdmin(userId);

    const rango = defaultDateRange();
    const fechaDesde = parseDate(filters.fecha_desde, rango.desde);
    const fechaHasta = parseDate(filters.fecha_hasta, rango.hasta);

    if (fechaDesde > fechaHasta) {
        const error = new Error('La fecha inicial no puede ser posterior a la fecha final');
        error.status = 400;
        throw error;
    }

    const whereAsignacion = { activo: true };
    if (filters.tutor_id) {
        const tutorId = Number.parseInt(filters.tutor_id, 10);
        if (!Number.isNaN(tutorId)) {
            whereAsignacion.tutor_id = tutorId;
        }
    }

    const asignaciones = await StudentTutor.findAll({
        where: whereAsignacion,
        include: [
            {
                model: Student,
                as: 'alumno',
                where: { status: 'activo' },
                required: true,
                attributes: ['id', 'matricula', 'nombre', 'apellido_paterno', 'apellido_materno', 'semestres', 'carrera', 'grupo', 'status'],
            },
            {
                model: User,
                as: 'tutor',
                attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'],
            },
            {
                model: Observation,
                as: 'observaciones',
                where: {
                    fecha: { [Op.between]: [fechaDesde, fechaHasta] },
                },
                required: false,
            },
        ],
    });

    const porTutorMap = new Map();
    const alumnosSinSeguimiento = [];

    for (const asignacion of asignaciones) {
        const plain = asignacion.get({ plain: true });
        const tutorKey = plain.tutor.id;
        const observaciones = plain.observaciones || [];
        const alumno = formatAlumnoBrief({
            ...plain.alumno,
            asignaciones: [{ activo: true, tutor: plain.tutor }],
        });

        if (!porTutorMap.has(tutorKey)) {
            porTutorMap.set(tutorKey, {
                tutor: formatTutorBrief(plain.tutor),
                total_observaciones: 0,
                alumnos_asignados: 0,
                alumnos_con_observaciones: 0,
                alumnos_sin_observaciones: 0,
            });
        }

        const entry = porTutorMap.get(tutorKey);
        entry.alumnos_asignados += 1;
        entry.total_observaciones += observaciones.length;

        if (observaciones.length > 0) {
            entry.alumnos_con_observaciones += 1;
        } else {
            entry.alumnos_sin_observaciones += 1;
            alumnosSinSeguimiento.push({
                alumno,
                tutor: formatTutorBrief(plain.tutor),
            });
        }
    }

    const porTutor = Array.from(porTutorMap.values()).map((entry) => ({
        ...entry,
        promedio_por_alumno: entry.alumnos_asignados > 0
            ? Number((entry.total_observaciones / entry.alumnos_asignados).toFixed(2))
            : 0,
    })).sort((a, b) => b.total_observaciones - a.total_observaciones);

    return {
        periodo: { desde: fechaDesde, hasta: fechaHasta },
        filtros: { tutor_id: filters.tutor_id ? Number(filters.tutor_id) : null },
        por_tutor: porTutor,
        alumnos_sin_seguimiento: alumnosSinSeguimiento.sort((a, b) =>
            nombreCompleto(a.alumno).localeCompare(nombreCompleto(b.alumno)),
        ),
    };
}

async function getBitacoraReport(userId, filters = {}) {
    const user = await getRequestingUser(userId);
    const where = buildStudentWhere(filters);

    if (filters.matricula) {
        if (filters.matricula.length !== 10) {
            const error = new Error('La matrícula debe tener exactamente 10 caracteres');
            error.status = 400;
            throw error;
        }
        where.matricula = filters.matricula;
    }

    const rango = filters.fecha_desde || filters.fecha_hasta ? defaultDateRange() : null;
    const fechaDesde = rango ? parseDate(filters.fecha_desde, rango.desde) : null;
    const fechaHasta = rango ? parseDate(filters.fecha_hasta, rango.hasta) : null;

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
        const error = new Error('La fecha inicial no puede ser posterior a la fecha final');
        error.status = 400;
        throw error;
    }

    if (isProfesor(user)) {
        const asignacionesActivas = await StudentTutor.findAll({
            where: { tutor_id: user.id, activo: true },
            attributes: ['student_id'],
        });
        const studentIds = asignacionesActivas.map((a) => a.student_id);

        if (studentIds.length === 0) {
            return {
                filtros: {
                    matricula: filters.matricula || null,
                    carrera: filters.carrera || null,
                    grupo: filters.grupo || null,
                    semestre: filters.semestre ? Number(filters.semestre) : null,
                    fecha_desde: fechaDesde,
                    fecha_hasta: fechaHasta,
                },
                total: 0,
                alumnos: [],
            };
        }

        where.id = { [Op.in]: studentIds };
    }

    const students = await Student.findAll({
        where,
        include: [{
            model: StudentTutor,
            as: 'asignaciones',
            include: [
                { model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] },
                {
                    model: Observation,
                    as: 'observaciones',
                    separate: true,
                    order: [['fecha', 'DESC']],
                    ...(fechaDesde && fechaHasta
                        ? { where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } } }
                        : {}),
                },
            ],
        }],
        order: [['nombre', 'ASC'], ['apellido_paterno', 'ASC']],
    });

    const alumnos = students.map((student) => {
        const plain = student.get({ plain: true });
        const asignaciones = (plain.asignaciones || [])
            .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
            .map(formatAsignacion);

        const observaciones = asignaciones
            .flatMap((a) => a.observaciones || [])
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return {
            alumno: formatAlumnoBrief(student),
            historial_tutores: asignaciones,
            observaciones,
        };
    });

    return {
        filtros: {
            matricula: filters.matricula || null,
            carrera: filters.carrera || null,
            grupo: filters.grupo || null,
            semestre: filters.semestre ? Number(filters.semestre) : null,
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
        },
        total: alumnos.length,
        alumnos,
    };
}

async function getFilterOptions(userId) {
    const user = await getRequestingUser(userId);

    const whereAsignacion = {};
    if (isProfesor(user)) {
        whereAsignacion.tutor_id = user.id;
        whereAsignacion.activo = true;
    }

    const students = await Student.findAll({
        where: { status: 'activo' },
        attributes: ['carrera', 'grupo', 'semestres'],
        include: isProfesor(user) ? [{
            model: StudentTutor,
            as: 'asignaciones',
            where: whereAsignacion,
            required: true,
            attributes: [],
        }] : [],
        order: [['carrera', 'ASC'], ['grupo', 'ASC']],
    });

    const carreras = [...new Set(students.map((s) => s.carrera))].sort();
    const grupos = [...new Set(students.map((s) => s.grupo))].sort();
    const semestres = [...new Set(students.map((s) => s.semestres))].sort((a, b) => a - b);

    let tutores = [];
    if (isAdmin(user)) {
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
        tutores = profesores.map(formatTutorBrief);
    }

    return { carreras, grupos, semestres, tutores };
}

module.exports = {
    nombreCompleto,
    getCoberturaReport,
    getActividadReport,
    getBitacoraReport,
    getFilterOptions,
};
