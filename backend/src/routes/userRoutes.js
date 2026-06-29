const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/permissionMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/roles', authorize('roles', 'leer'), userController.listRoles);
router.get('/', authorize('usuarios', 'leer'), userController.list);
router.post('/', authorize('usuarios', 'crear'), userController.create);
router.patch('/:id/password', authorize('usuarios', 'actualizar'), userController.updatePassword);
router.patch('/:id', authorize('usuarios', 'actualizar'), userController.update);

module.exports = router;
