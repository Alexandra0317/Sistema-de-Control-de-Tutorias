const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('reportes', 'leer'));

router.get('/filtros', reportController.filterOptions);
router.get('/cobertura', reportController.cobertura);
router.get('/actividad', reportController.actividad);
router.get('/bitacora', reportController.bitacora);
router.get('/cobertura/exportar', authorize('reportes', 'exportar'), reportController.exportarCobertura);
router.get('/actividad/exportar', authorize('reportes', 'exportar'), reportController.exportarActividad);
router.get('/bitacora/exportar', authorize('reportes', 'exportar'), reportController.exportarBitacora);

module.exports = router;
