const userService = require('../services/userService');

async function list(req, res) {
    try {
        const users = await userService.listUsers();
        return res.json({ users });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al listar usuarios',
        });
    }
}

async function create(req, res) {
    try {
        const user = await userService.createUser(req.body);
        return res.status(201).json({ user });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al crear usuario',
        });
    }
}

async function update(req, res) {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        return res.json({ user });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al actualizar usuario',
        });
    }
}

async function updatePassword(req, res) {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'La contraseña es requerida' });
        }

        const user = await userService.updatePassword(req.params.id, password);
        return res.json({ user });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al actualizar contraseña',
        });
    }
}

async function listRoles(req, res) {
    try {
        const roles = await userService.listRoles();
        return res.json({ roles });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Error al listar roles',
        });
    }
}

module.exports = { list, create, update, updatePassword, listRoles };
