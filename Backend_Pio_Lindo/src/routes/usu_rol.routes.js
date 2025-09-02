const {Router} = require('express')
const router = Router();
const rolusuController = require('../controllers/usu_rol.controller');

router.post('/',rolusuController.agregarRolUsuario);
router.get('/:ci_usuario',rolusuController.getRolesUsuarios);
router.delete('/:ci_usuario/:cod_rol',rolusuController.deleteRolesUsuarios);

module.exports = router;
//export default router;//Exportamos este modulo
