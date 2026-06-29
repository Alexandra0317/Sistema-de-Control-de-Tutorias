const observationService = require('../services/observationService');

async function list(req, res) {
    try {
        const observaciones = await observationService.listObservations(req.params.id, req.userId);
        return res.json({ observaciones });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al listar observaciones',
        });
    }
}

async function create(req, res) {
    try {
        const observacion = await observationService.createObservation(
            req.params.id,
            req.body,
            req.userId,
        );
        return res.status(201).json({ observacion });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al crear observación',
        });
    }
}

module.exports = { list, create };
