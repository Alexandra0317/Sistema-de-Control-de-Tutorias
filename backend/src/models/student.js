const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    matricula: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
            len: [10, 10],
        },
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    apellido_paterno: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    apellido_materno: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    semestres: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 12,
        },
    },
    carrera: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    grupo: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
    },
}, {
    tableName: 'alumnos',
});

module.exports = Student;
