const { Router } = require('express');
const router = Router();
const opcionesController = require('../../controllers/productos/opciones.controller');

router.get('/', opcionesController.getOpciones);
router.post('/', opcionesController.crearOpcion);
router.put('/', opcionesController.modificarOpcion);
router.put('/estado/', opcionesController.estadoOpcion);
router.delete('/:cod_opcion', opcionesController.deleteOpcion);


module.exports = router;