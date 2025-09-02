const { Router } = require('express');
const router = Router();
const complementosController = require('../../controllers/productos/complementos.controller');

router.get('/', complementosController.getComplementos);
router.post('/', complementosController.crearComplemento);
router.put('/', complementosController.modificarComplemento);
router.put('/estado/', complementosController.estadoComplemento);
router.delete('/:cod_complemento', complementosController.deleteComplemento);


module.exports = router;