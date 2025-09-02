const {Router} = require('express')
const router = Router();
const authController = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');
const config = require('../config');

router.post('/signup',authController.singUp);
router.post('/signin',authController.singIn);

router.get('/task', (req, res) =>{
    res.json([
        {
            _id:1,
            name: 'Task One',
            description: 'lorem ipsum'
        },
        {
            _id:2,
            name: 'Task Two',
            description: 'lorem ipsum'
        }
    ])
})

router.get('/private-tasks', verifyToken, (req, res) =>{
    res.json([
        {
            _id:1,
            name: 'Private Task One',
            description: 'lorem ipsum'
        },
        {
            _id:2,
            name: 'Private Task Two',
            description: 'lorem ipsum'
        }
    ])
})

router.get('/profile', verifyToken, (req, res) =>{
   // res.send(req.userId);
   res.json(req.userId)
})

module.exports = router;
//export default router;//Exportamos este modulo

function verifyToken(req, res, next){
    if(!req.headers.authorization){
        return res.status(401).send('Unthorize Request')
    }
    console.log(req.headers.authorization) //Bearer eyJhbGciOiJIUzI1NiIsInR5cCI

    //Separamos y obtenemos solo el codigo token
    const token = req.headers.authorization.split(' ')[1];
    if(token === null){
        return res.status(401).send('Unthorize Request')
    }

    //Verificamos el toke recibido con el token real creado en config.js
    const payload = jwt.verify(token, config.SECRET);
    console.log(payload);
    req.userId = payload.id;
    console.log("El id es:: "+req.userId);
    next();
}