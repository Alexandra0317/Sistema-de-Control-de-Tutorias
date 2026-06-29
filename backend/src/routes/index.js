const express = require('express');
const authRoutes = require('./authRoutes');
const reportRoutes = require('./reportRoutes');
const studentRoutes = require('./studentRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/estudiantes', studentRoutes);
router.use('/reportes', reportRoutes);

module.exports = router;
