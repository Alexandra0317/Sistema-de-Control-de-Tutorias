const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentTutor = sequelize.define('StudentTutor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'alumnos',
            key: 'id',
        },
    },
    tutor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id',
        },
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'alumno_tutores',
});

module.exports = StudentTutor;
