const ensureDatabase = require('./config/ensureDatabase');
const { sequelize } = require('./models');
const runSeeders = require('./seeders');

async function bootstrap() {
    await ensureDatabase();
    await sequelize.authenticate();
    await sequelize.sync();

    const { roles, admin } = await runSeeders();

    const rolesCreados = roles.filter((r) => r.created).map((r) => r.nombre);
    if (rolesCreados.length > 0) {
        console.log(`Roles creados: ${rolesCreados.join(', ')}`);
    }

    if (admin.created) {
        console.log(`Usuario administrador creado: ${admin.correo}`);
    } else {
        console.log(`Usuario administrador ya existía: ${admin.correo}`);
    }
}

module.exports = bootstrap;
