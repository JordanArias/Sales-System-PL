const {Router} = require('express');
const router = Router();
const ventasController = require('../controllers/ventas.controller');



router.post('/',ventasController.CREAR_VENTA);
router.put('/',ventasController.MODIFICAR_VENTA);
router.get('/nuevas',ventasController.GET_VENTAS_NUEVAS);
router.get('/proceso',ventasController.GET_VENTAS_EN_PROCESO);
router.get('/finalizadas',ventasController.GET_VENTAS_FINALIZADAS);
router.delete('/:cod_venta',ventasController.ELIMINAR_VENTA);

router.put('/datos',ventasController.MODIFICAR_DATOS_VENTA);

// router.get('/item',ventasController.get_Item_Presa);

// router.put('/',ventasController.modificar_Venta);
// router.post('/delete',ventasController.Delete_Venta);

// router.put('/estado',ventasController.update_estado);
// router.put('/estado_l',ventasController.update_estado_L);

module.exports = router;