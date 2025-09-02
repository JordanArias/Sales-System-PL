const { Router } = require('express');
const router = Router();
const insumosController = require('../controllers/insumos.controller');

// Rutas relacionadas con insumos
router.get('/', insumosController.getInsumos);
router.post('/', insumosController.crearInsumos);
router.put('/', insumosController.modificarInsumos);
router.delete('/:cod_insumo', insumosController.deleteInsumoById);


module.exports = router;