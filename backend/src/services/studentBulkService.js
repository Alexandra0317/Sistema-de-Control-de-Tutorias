const XLSX = require('xlsx');
const {
    sequelize,
    Student,
    StudentTutor,
    User,
    Role,
} = require('../models');
const { formatStudentResponse } = require('../utils/studentFormatter');
const {
    getRequestingUser,
    validateTutorId,
    isAdmin,
    isProfesor,
} = require('./studentService');

const COLUMN_ALIASES = {
    matricula: ['matricula', 'matrícula', 'matricula_alumno'],
    nombre: ['nombre', 'nombres'],
    apellido_paterno: ['apellido_paterno', 'apellido paterno', 'apellidopaterno', 'paterno'],
    apellido_materno: ['apellido_materno', 'apellido materno', 'apellidomaterno', 'materno'],
    semestres: ['semestres', 'semestre', 'sem'],
    carrera: ['carrera'],
    grupo: ['grupo'],
    tutor_id: ['tutor_id', 'id_tutor', 'tutor id'],
    correo_tutor: ['correo_tutor', 'correo tutor', 'email_tutor', 'tutor_correo', 'correo del tutor'],
};

function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

function buildColumnMap(headers) {
    const map = {};

    headers.forEach((header, index) => {
        const normalized = normalizeHeader(header);
        if (!normalized) return;

        for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
            if (aliases.includes(normalized)) {
                map[field] = index;
            }
        }
    });

    return map;
}

function cellValue(row, index) {
    if (index === undefined) return '';
    const value = row[index];
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function normalizeMatricula(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    if (/^\d+$/.test(raw) && raw.length < 10) {
        return raw.padStart(10, '0');
    }

    return raw;
}

function parseSemestres(value) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number.parseInt(String(value).trim(), 10);
    return Number.isNaN(num) ? null : num;
}

function parseTutorId(value) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number.parseInt(String(value).trim(), 10);
    return Number.isNaN(num) ? null : num;
}

function rowIsEmpty(row) {
    return !row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}

function parseExcelBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        const error = new Error('El archivo Excel no contiene hojas');
        error.status = 400;
        throw error;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length < 2) {
        const error = new Error('El archivo debe incluir encabezados y al menos una fila de datos');
        error.status = 400;
        throw error;
    }

    const columnMap = buildColumnMap(rows[0]);
    const requiredFields = ['matricula', 'nombre', 'apellido_paterno', 'semestres', 'carrera', 'grupo'];
    const missing = requiredFields.filter((field) => columnMap[field] === undefined);

    if (missing.length > 0) {
        const labels = {
            matricula: 'matricula',
            nombre: 'nombre',
            apellido_paterno: 'apellido_paterno',
            semestres: 'semestres',
            carrera: 'carrera',
            grupo: 'grupo',
        };
        const error = new Error(`Faltan columnas obligatorias: ${missing.map((f) => labels[f]).join(', ')}`);
        error.status = 400;
        throw error;
    }

    const parsedRows = [];

    for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        if (rowIsEmpty(row)) continue;

        parsedRows.push({
            fila: i + 1,
            matricula: normalizeMatricula(cellValue(row, columnMap.matricula)),
            nombre: cellValue(row, columnMap.nombre),
            apellido_paterno: cellValue(row, columnMap.apellido_paterno),
            apellido_materno: cellValue(row, columnMap.apellido_materno) || null,
            semestres: parseSemestres(cellValue(row, columnMap.semestres)),
            carrera: cellValue(row, columnMap.carrera),
            grupo: cellValue(row, columnMap.grupo),
            tutor_id: parseTutorId(cellValue(row, columnMap.tutor_id)),
            correo_tutor: cellValue(row, columnMap.correo_tutor).toLowerCase() || null,
        });
    }

    if (parsedRows.length === 0) {
        const error = new Error('No se encontraron filas de alumnos en el archivo');
        error.status = 400;
        throw error;
    }

    return parsedRows;
}

function validateRowData(row) {
    if (!row.matricula || row.matricula.length !== 10) {
        return 'La matrícula debe tener exactamente 10 caracteres';
    }
    if (!row.nombre) return 'El nombre es requerido';
    if (!row.apellido_paterno) return 'El apellido paterno es requerido';
    if (row.semestres === null || row.semestres < 1 || row.semestres > 12) {
        return 'El semestre debe ser un número entre 1 y 12';
    }
    if (!row.carrera) return 'La carrera es requerida';
    if (!row.grupo) return 'El grupo es requerido';
    return null;
}

async function resolveTutorId(row, user, defaultTutorId, tutorByEmail) {
    if (isProfesor(user)) {
        return user.id;
    }

    if (!isAdmin(user)) {
        const error = new Error('No tienes permiso para dar de alta alumnos');
        error.status = 403;
        throw error;
    }

    if (row.tutor_id) {
        await validateTutorId(row.tutor_id);
        return row.tutor_id;
    }

    if (row.correo_tutor) {
        const tutor = tutorByEmail.get(row.correo_tutor);
        if (!tutor) {
            const error = new Error(`No se encontró un profesor activo con correo ${row.correo_tutor}`);
            error.status = 400;
            throw error;
        }
        return tutor.id;
    }

    if (defaultTutorId) {
        await validateTutorId(defaultTutorId);
        return defaultTutorId;
    }

    const error = new Error('Debes asignar un tutor (columna tutor_id, correo_tutor o tutor por defecto)');
    error.status = 400;
    throw error;
}

async function buildTutorEmailMap() {
    const profesores = await User.findAll({
        where: { status: 'activo' },
        include: [{
            model: Role,
            as: 'rol',
            where: { nombre: 'profesor', status: 'activo' },
        }],
        attributes: ['id', 'correo'],
    });

    return new Map(profesores.map((p) => [p.correo.toLowerCase(), p]));
}

async function createStudentRow(row, tutorId) {
    const transaction = await sequelize.transaction();

    try {
        const student = await Student.create({
            matricula: row.matricula,
            nombre: row.nombre,
            apellido_paterno: row.apellido_paterno,
            apellido_materno: row.apellido_materno,
            semestres: row.semestres,
            carrera: row.carrera,
            grupo: row.grupo,
        }, { transaction });

        await StudentTutor.create({
            student_id: student.id,
            tutor_id: tutorId,
            fecha_inicio: new Date().toISOString().slice(0, 10),
            activo: true,
        }, { transaction });

        await transaction.commit();

        await student.reload({
            include: [{
                model: StudentTutor,
                as: 'asignaciones',
                include: [{ model: User, as: 'tutor', attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'] }],
            }],
        });

        return formatStudentResponse(student);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function bulkCreateStudents(buffer, userId, defaultTutorId) {
    const user = await getRequestingUser(userId);
    const rows = parseExcelBuffer(buffer);
    const tutorByEmail = isAdmin(user) ? await buildTutorEmailMap() : new Map();

    const matriculasEnArchivo = new Set();
    const result = {
        total: rows.length,
        creados: 0,
        errores: [],
        students: [],
    };

    for (const row of rows) {
        const validationError = validateRowData(row);
        if (validationError) {
            result.errores.push({ fila: row.fila, matricula: row.matricula || null, mensaje: validationError });
            continue;
        }

        if (matriculasEnArchivo.has(row.matricula)) {
            result.errores.push({
                fila: row.fila,
                matricula: row.matricula,
                mensaje: 'Matrícula duplicada en el archivo',
            });
            continue;
        }
        matriculasEnArchivo.add(row.matricula);

        const existente = await Student.findOne({ where: { matricula: row.matricula } });
        if (existente) {
            result.errores.push({
                fila: row.fila,
                matricula: row.matricula,
                mensaje: 'Ya existe un alumno con esa matrícula',
            });
            continue;
        }

        try {
            const tutorId = await resolveTutorId(row, user, defaultTutorId, tutorByEmail);
            const student = await createStudentRow(row, tutorId);
            result.creados += 1;
            result.students.push(student);
        } catch (error) {
            result.errores.push({
                fila: row.fila,
                matricula: row.matricula,
                mensaje: error.message || 'Error al crear alumno',
            });
        }
    }

    return result;
}

function generateTemplateBuffer() {
    const headers = [
        'matricula',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'semestres',
        'carrera',
        'grupo',
        'correo_tutor',
    ];

    const example = [
        '2024000001',
        'Juan',
        'Pérez',
        'García',
        3,
        'Ingeniería en Sistemas',
        '3A',
        'tutor@ejemplo.com',
    ];

    const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
    sheet['!cols'] = [
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 10 },
        { wch: 28 },
        { wch: 8 },
        { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Alumnos');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
    bulkCreateStudents,
    generateTemplateBuffer,
    parseExcelBuffer,
};
