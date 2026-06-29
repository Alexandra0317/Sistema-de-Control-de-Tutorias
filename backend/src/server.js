require('dotenv').config();

const app = require('./app');
const bootstrap = require('./bootstrap');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await bootstrap();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

start();