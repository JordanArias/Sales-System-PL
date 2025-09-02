const {Router} = require('express');
const router = Router();
const cajaController = require('../controllers/caja.controller');

router.get('/',cajaController.get_Caja);
router.post('/',cajaController.crear_Caja);
router.put('/',cajaController.cerrar_caja);

router.post('/ajuste',cajaController.crear_ajuste);
router.get('/ajuste',cajaController.obtener_ajustes);

router.get('/last',cajaController.get_Last_Caja);


module.exports = router;