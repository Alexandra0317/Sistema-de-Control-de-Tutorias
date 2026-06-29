const express = require('express');
const studentController = require('../controllers/studentController');
const observationController = require('../controllers/observationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/tutores', authorize('estudiantes', 'leer'), studentController.listTutors);
router.get('/matricula/:matricula', authorize('tutorias', 'leer'), studentController.getByMatricula);
router.get('/', authorize('estudiantes', 'leer'), studentController.list);
router.get('/:id', authorize('estudiantes', 'leer'), studentController.getById);
router.post('/', authorize('estudiantes', 'crear'), studentController.create);
router.patch('/:id/tutor', authorize('estudiantes', 'actualizar'), studentController.changeTutor);
router.patch('/:id', authorize('estudiantes', 'actualizar'), studentController.update);
router.delete('/:id', authorize('estudiantes', 'eliminar'), studentController.remove);
router.get('/:id/historial-tutores', authorize('estudiantes', 'leer'), studentController.tutorHistory);
router.get('/:id/observaciones', authorize('observaciones', 'leer'), observationController.list);
router.post('/:id/observaciones', authorize('observaciones', 'crear'), observationController.create);

module.exports = router;
