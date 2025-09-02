const {Router} = require('express');
const router = Router();
const reporteController = require('../controllers/reporte.controller');


router.get('/productos',reporteController.REPORTE_PRODUCTOS);
router.get('/opciones',reporteController.REPORTE_OPCIONES);
router.get('/ventas',reporteController.REPORTE_VENTAS);
// router.get('/proceso',ventasController.GET_VENTAS_EN_PROCESO);
// router.get('/finalizadas',ventasController.GET_VENTAS_FINALIZADAS);
// router.delete('/:cod_venta',ventasController.ELIMINAR_VENTA);


module.exports = router;