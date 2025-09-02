// import {Router} from 'express';
// import * as productController from '../controllers/products.controller';
const {Router} = require('express')
const router = Router();
const usuarioController = require('../controllers/usuarios.controller');

//CRUD Usuarios
router.post('/',usuarioController.crearUsuarios);
//Recuperar contraseña
router.post('/iniciar-recuperacion', usuarioController.iniciarRecuperacion);
router.post('/reset-password', usuarioController.restablecerContrasena);

router.get('/',usuarioController.getUsuarios);
router.get('/:ci_usuario',usuarioController.getUsuarioById);
router.put('/',usuarioController.updateUsuarioById);
router.delete('/:ci_usuario',usuarioController.deleteUsuarioById);
//CRUD Roles-Usuarios
router.delete('/usu_roles/:ci_usuario',usuarioController.deleteRolesUsuarioById);
router.get('/usu_roles/:ci_usuario',usuarioController.getUsuarioRoles);

module.exports = router;
//export default router;//Exportamos este modulo


