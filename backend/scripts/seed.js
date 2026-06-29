require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bootstrap = require('../src/bootstrap');
const { sequelize } = require('../src/models');

bootstrap()
    .then(() => sequelize.close())
    .then(() => {
        console.log('Seed completado.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error en seed:', error.message);
        sequelize.close().finally(() => process.exit(1));
    });
