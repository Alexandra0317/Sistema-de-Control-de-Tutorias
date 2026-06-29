const sequelize = require('../config/database');
const Observation = require('./Observation');
const Role = require('./Role');
const Student = require('./student');
const StudentTutor = require('./StudentTutor');
const User = require('./User');

Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'usuarios',
});

User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'rol',
});

Student.hasMany(StudentTutor, {
    foreignKey: 'student_id',
    as: 'asignaciones',
    onDelete: 'CASCADE',
});

StudentTutor.belongsTo(Student, {
    foreignKey: 'student_id',
    as: 'alumno',
});

User.hasMany(StudentTutor, {
    foreignKey: 'tutor_id',
    as: 'tutorias_asignadas',
});

StudentTutor.belongsTo(User, {
    foreignKey: 'tutor_id',
    as: 'tutor',
});

StudentTutor.hasMany(Observation, {
    foreignKey: 'asignacion_id',
    as: 'observaciones',
    onDelete: 'CASCADE',
});

Observation.belongsTo(StudentTutor, {
    foreignKey: 'asignacion_id',
    as: 'asignacion',
});

module.exports = {
    sequelize,
    Observation,
    Role,
    Student,
    StudentTutor,
    User,
};
