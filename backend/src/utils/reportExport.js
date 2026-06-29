const XLSX = require('xlsx');
const { nombreCompleto } = require('../services/reportService');

function createWorkbookBuffer(sheets) {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
        if (sheet.cols) {
            worksheet['!cols'] = sheet.cols;
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function exportCobertura(report) {
    const resumen = [
        ['Reporte de cobertura y asignación de tutorías'],
        [],
        ['Total alumnos', report.resumen.total_alumnos],
        ['Con tutor', report.resumen.con_tutor],
        ['Sin tutor', report.resumen.sin_tutor],
        [],
        ['Por tutor'],
        ['Tutor', 'Correo', 'Total alumnos'],
        ...report.por_tutor.map((item) => [
            nombreCompleto(item.tutor),
            item.tutor.correo,
            item.total_alumnos,
        ]),
        [],
        ['Por carrera'],
        ['Carrera', 'Total', 'Con tutor', 'Sin tutor'],
        ...report.por_carrera.map((item) => [
            item.carrera,
            item.total,
            item.con_tutor,
            item.sin_tutor,
        ]),
        [],
        ['Alumnos sin tutor'],
        ['Matrícula', 'Nombre', 'Carrera', 'Grupo', 'Semestre'],
        ...report.alumnos_sin_tutor.map((a) => [
            a.matricula,
            nombreCompleto(a),
            a.carrera,
            a.grupo,
            a.semestres,
        ]),
    ];

    return createWorkbookBuffer([{
        name: 'Cobertura',
        data: resumen,
        cols: [{ wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }],
    }]);
}

function exportActividad(report) {
    const data = [
        ['Reporte de actividad de seguimiento'],
        ['Periodo', `${report.periodo.desde} a ${report.periodo.hasta}`],
        [],
        ['Por tutor'],
        ['Tutor', 'Correo', 'Observaciones', 'Alumnos asignados', 'Con observaciones', 'Sin observaciones', 'Promedio por alumno'],
        ...report.por_tutor.map((item) => [
            nombreCompleto(item.tutor),
            item.tutor.correo,
            item.total_observaciones,
            item.alumnos_asignados,
            item.alumnos_con_observaciones,
            item.alumnos_sin_observaciones,
            item.promedio_por_alumno,
        ]),
        [],
        ['Alumnos sin seguimiento en el periodo'],
        ['Matrícula', 'Alumno', 'Carrera', 'Grupo', 'Tutor'],
        ...report.alumnos_sin_seguimiento.map((item) => [
            item.alumno.matricula,
            nombreCompleto(item.alumno),
            item.alumno.carrera,
            item.alumno.grupo,
            nombreCompleto(item.tutor),
        ]),
    ];

    return createWorkbookBuffer([{
        name: 'Actividad',
        data,
        cols: [{ wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }],
    }]);
}

function exportBitacora(report) {
    const rows = [
        ['Bitácora / historial integral del alumno'],
        ['Total alumnos', report.total],
        [],
        ['Matrícula', 'Alumno', 'Carrera', 'Grupo', 'Semestre', 'Tutor actual', 'Fecha tutoría', 'Tutor observación', 'Observación'],
    ];

    for (const entry of report.alumnos) {
        const alumno = entry.alumno;
        const tutorActual = entry.alumno.tutor_actual ? nombreCompleto(entry.alumno.tutor_actual) : '—';

        if (entry.observaciones.length === 0) {
            rows.push([
                alumno.matricula,
                nombreCompleto(alumno),
                alumno.carrera,
                alumno.grupo,
                alumno.semestres,
                tutorActual,
                '',
                '',
                'Sin observaciones',
            ]);
            continue;
        }

        for (const obs of entry.observaciones) {
            rows.push([
                alumno.matricula,
                nombreCompleto(alumno),
                alumno.carrera,
                alumno.grupo,
                alumno.semestres,
                tutorActual,
                obs.fecha,
                obs.tutor ? nombreCompleto(obs.tutor) : '—',
                obs.contenido,
            ]);
        }
    }

    return createWorkbookBuffer([{
        name: 'Bitácora',
        data: rows,
        cols: [
            { wch: 14 },
            { wch: 28 },
            { wch: 24 },
            { wch: 10 },
            { wch: 10 },
            { wch: 24 },
            { wch: 14 },
            { wch: 24 },
            { wch: 48 },
        ],
    }]);
}

module.exports = {
    exportCobertura,
    exportActividad,
    exportBitacora,
};
