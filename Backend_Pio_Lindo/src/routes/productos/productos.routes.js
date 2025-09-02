const { Router } = require('express');
const router = Router();
const productosController = require('../../controllers/productos/productos.controller');

// Rutas relacionadas con productos
router.get('/', productosController.getProductos);
router.post('/', productosController.crearProducto);
router.put('/', productosController.modificarProducto);
router.delete('/:cod_producto', productosController.deleteProductoById);
router.put('/estado/', productosController.cambiarEstadoProductoById);
// router.get('/:cod_producto', productosController.getProductoById);
router.get('/venta', productosController.getProductos_Venta);
module.exports = router;
