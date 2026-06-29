const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Observation = sequelize.define('Observation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    asignacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'alumno_tutores',
            key: 'id',
        },
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'observaciones',
});

module.exports = Observation;
