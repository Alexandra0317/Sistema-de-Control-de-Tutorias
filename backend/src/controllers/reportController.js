const reportService = require('../services/reportService');
const { exportCobertura, exportActividad, exportBitacora } = require('../utils/reportExport');

function parseQueryFilters(query) {
    return {
        carrera: query.carrera || undefined,
        grupo: query.grupo || undefined,
        semestre: query.semestre || undefined,
        tutor_id: query.tutor_id || undefined,
        fecha_desde: query.fecha_desde || undefined,
        fecha_hasta: query.fecha_hasta || undefined,
        matricula: query.matricula || undefined,
    };
}

async function filterOptions(req, res) {
    try {
        const options = await reportService.getFilterOptions(req.userId);
        return res.json(options);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al obtener opciones de filtro',
        });
    }
}

async function cobertura(req, res) {
    try {
        const report = await reportService.getCoberturaReport(req.userId, parseQueryFilters(req.query));
        return res.json({ report });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al generar reporte de cobertura',
        });
    }
}

async function actividad(req, res) {
    try {
        const report = await reportService.getActividadReport(req.userId, parseQueryFilters(req.query));
        return res.json({ report });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al generar reporte de actividad',
        });
    }
}

async function bitacora(req, res) {
    try {
        const report = await reportService.getBitacoraReport(req.userId, parseQueryFilters(req.query));
        return res.json({ report });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al generar bitácora',
        });
    }
}

async function exportarCobertura(req, res) {
    try {
        const report = await reportService.getCoberturaReport(req.userId, parseQueryFilters(req.query));
        const buffer = exportCobertura(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_cobertura.xlsx"');
        return res.send(buffer);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al exportar reporte de cobertura',
        });
    }
}

async function exportarActividad(req, res) {
    try {
        const report = await reportService.getActividadReport(req.userId, parseQueryFilters(req.query));
        const buffer = exportActividad(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_actividad.xlsx"');
        return res.send(buffer);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al exportar reporte de actividad',
        });
    }
}

async function exportarBitacora(req, res) {
    try {
        const report = await reportService.getBitacoraReport(req.userId, parseQueryFilters(req.query));
        const buffer = exportBitacora(report);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_bitacora.xlsx"');
        return res.send(buffer);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al exportar bitácora',
        });
    }
}

module.exports = {
    filterOptions,
    cobertura,
    actividad,
    bitacora,
    exportarCobertura,
    exportarActividad,
    exportarBitacora,
};
