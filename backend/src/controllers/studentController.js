const studentService = require('../services/studentService');
const studentBulkService = require('../services/studentBulkService');

async function listTutors(req, res) {
    try {
        const tutores = await studentService.listProfessors();
        return res.json({ tutores });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al listar tutores',
        });
    }
}

async function list(req, res) {
    try {
        const students = await studentService.listStudents(req.userId);
        return res.json({ students });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al listar alumnos',
        });
    }
}

async function getByMatricula(req, res) {
    try {
        const student = await studentService.getStudentByMatricula(req.params.matricula, req.userId);
        return res.json({ student });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al buscar alumno',
        });
    }
}

async function getById(req, res) {
    try {
        const student = await studentService.getStudentById(req.params.id, req.userId);
        return res.json({ student });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al obtener alumno',
        });
    }
}

async function create(req, res) {
    try {
        const student = await studentService.createStudent(req.body, req.userId);
        return res.status(201).json({ student });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al crear alumno',
        });
    }
}

async function update(req, res) {
    try {
        const student = await studentService.updateStudent(req.params.id, req.body, req.userId);
        return res.json({ student });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al actualizar alumno',
        });
    }
}

async function remove(req, res) {
    try {
        await studentService.deleteStudent(req.params.id, req.userId);
        return res.json({ message: 'Alumno eliminado correctamente' });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al eliminar alumno',
        });
    }
}

async function changeTutor(req, res) {
    try {
        const { tutor_id } = req.body;

        if (!tutor_id) {
            return res.status(400).json({ message: 'El tutor_id es requerido' });
        }

        const student = await studentService.changeTutor(req.params.id, tutor_id, req.userId);
        return res.json({ student });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al cambiar tutor',
        });
    }
}

async function tutorHistory(req, res) {
    try {
        const historial = await studentService.getTutorHistory(req.params.id, req.userId);
        return res.json({ historial });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al obtener historial de tutores',
        });
    }
}

async function downloadTemplate(req, res) {
    try {
        const buffer = studentBulkService.generateTemplateBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_alumnos.xlsx"');
        return res.send(buffer);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al generar plantilla',
        });
    }
}

async function bulkImport(req, res) {
    try {
        if (!req.file?.buffer) {
            return res.status(400).json({ message: 'Debes enviar un archivo Excel' });
        }

        const defaultTutorId = req.body.tutor_id
            ? Number.parseInt(req.body.tutor_id, 10)
            : undefined;

        const result = await studentBulkService.bulkCreateStudents(
            req.file.buffer,
            req.userId,
            Number.isNaN(defaultTutorId) ? undefined : defaultTutorId,
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error en la carga masiva',
        });
    }
}

module.exports = {
    listTutors,
    list,
    getByMatricula,
    getById,
    create,
    update,
    remove,
    changeTutor,
    tutorHistory,
    downloadTemplate,
    bulkImport,
};
