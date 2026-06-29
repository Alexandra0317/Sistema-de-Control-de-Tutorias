const authService = require('../services/authService');

async function login(req, res) {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }

        const result = await authService.login(correo, password);
        return res.json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al iniciar sesión',
        });
    }
}

async function me(req, res) {
    try {
        const user = await authService.getUserById(req.userId);
        return res.json({ user });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al obtener usuario',
        });
    }
}

module.exports = { login, me };
