const seedRoles = require('./roles.seed');
const seedAdmin = require('./admin.seed');

async function runSeeders() {
    const roles = await seedRoles();
    const admin = await seedAdmin();

    return { roles, admin };
}

module.exports = runSeeders;
