const { Sequelize } = require('sequelize');

async function ensureDatabase() {
    const dbName = process.env.DB_NAME || 'tutorias';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
        throw new Error(`Nombre de base de datos inválido: ${dbName}`);
    }

    const admin = new Sequelize('postgres', user, password, {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
    });

    try {
        await admin.authenticate();

        const [rows] = await admin.query(
            'SELECT 1 FROM pg_database WHERE datname = :dbName',
            { replacements: { dbName } }
        );

        if (rows.length === 0) {
            await admin.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Base de datos "${dbName}" creada.`);
        }
    } finally {
        await admin.close();
    }
}

module.exports = ensureDatabase;
