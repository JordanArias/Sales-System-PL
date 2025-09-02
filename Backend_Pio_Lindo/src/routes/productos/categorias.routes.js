const { Router } = require('express');
const router = Router();
const categoriasController = require('../../controllers/productos/categorias.controller');

// Rutas relacionadas con categorías
router.get('/', categoriasController.getCategorias);
router.post('/', categoriasController.crearCategoria);
router.put('/', categoriasController.updateCategoriaById);
router.delete('/:cod_categoria', categoriasController.deleteCategoriaById);
// Rutas relacionadas con subcategorías
router.get('/subcategorias', categoriasController.getSubCategorias);
router.post('/subcategorias', categoriasController.crearSubCategorias);
router.delete('/subcategorias/:cod_subcategoria', categoriasController.deleteSubCategoriaById);
router.put('/subcategorias', categoriasController.updateSubCategoriaById);

module.exports = router;
