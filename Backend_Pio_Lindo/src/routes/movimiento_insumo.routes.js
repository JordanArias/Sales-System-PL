const { Router } = require('express');
const router = Router();
const movimiento_insumo_Controller = require('../controllers/movimiento_insumo.controller');

//Obtener ultimos codigos
router.get('/', movimiento_insumo_Controller.get_ultimos_Cod_Detalle_y_Movimiento);
//Agregar Movimiento
router.post('/', movimiento_insumo_Controller.crear_Todo_Detalle_Movimiento_Insumo);
//1.- Modificar Movimiento: Obtener Ultimo Movimiento
router.put('/ultimo', movimiento_insumo_Controller.obtener_Ultimo_Movimiento_y_Detalles);
//2.- Modificar Ultimo Movimiento
router.put('/', movimiento_insumo_Controller.modificar_Ultimo_Movimiento);
//3.- Eliminar Ultimo Movimiento
router.delete('/:cod_mov',movimiento_insumo_Controller.eliminar_Ultimo_Movimiento);
//Obtener Reporte de Todos los Movimientos 
router.put('/todo', movimiento_insumo_Controller.get_MovimientoInsumo_y_Detalle_Todo);
//Obtener Reporte de los Movimientes de un Insumo 
router.put('/insumo', movimiento_insumo_Controller.get_MovimientoInsumo_y_Detalle_Insumo);

module.exports = router;