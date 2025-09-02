const { Router } = require('express');
const router = Router();
const clienteController = require('../controllers/clientes.controller');

// Rutas relacionadas con productos
router.get('/', clienteController.getClientes);
router.post('/', clienteController.post_AgregarCliente);
router.delete('/:cod_cliente', clienteController.delete_Cliente);
router.put('/', clienteController.update_ModificarCliente);
router.put('/estado', clienteController.update_EstadoCliente);
// router.delete('/:cod_producto', productosController.deleteProductoById);
// router.put('/estado/', productosController.cambiarEstadoProductoById);
// // router.get('/:cod_producto', productosController.getProductoById);
// router.get('/venta', productosController.getProductos_Venta);
module.exports = router;
