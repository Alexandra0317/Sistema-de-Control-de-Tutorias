const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
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
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    ultimo_acceso: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'usuarios',
    defaultScope: {
        attributes: {
            exclude: ['password_hash'],
        },
    },
    scopes: {
        withPassword: {
            attributes: {},
        },
    },
});

module.exports = User;
