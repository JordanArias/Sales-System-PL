'use strict';

var express = require('express'); //cargaremos el modulo de Express
var bodyParser = require('body-parser'); //Cargamos el modulo body-parser

var app = express(); //creamos la variable para ejecutar Express

//cargar archivos de rutas
//var project_router =require('./routes/project'); //cargamos el archivo de rutas(project.js)

//middlewares: es un metodo que se ejecuta antes de ejecutar la accion de un controlador o del resultado de la peticion
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json()); //cualquier tipo de peticion que llegue lo convertira a Json

//CORS
// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); //Cuando hagamos deploy en vez de * tendriamos que poner la url o origenes permitidos.
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

//RUTAS
// RUTA DE PRUEBA
// creamos la ruta(/test) | req: son los datos que enviamos desde el cliente o peticion que hagamos 
//                       | res: es la response que estaremos enviando
// app.get('/test', (req, res) =>{
//     res.status(200).send({ //Es una respuesta exitosa por parte del servidor y con(send) enviaremos los datos
//         message: "Hola mundo desde mi API de NodeJs" //En este caso enviaremos un mensaje
//     })
// })

// //OTRA RUTA
// app.get('/', (req, res) =>{
//     res.status(200).send( // Devolvemos algo no sea un Json queitanto las llaves {}
//         "<h1>Pagina de inicio</h1>" //Enviamso solo texto
//     )
// })

// //CAMBIAMOS GET POR POST
// app.post('/test/:id', (req, res) =>{
//    //console.log(req.param('nombre')); //devuelve Fabrizio
//     console.log(req.body.nombre); //forma mas optima, devuelve Fabrizio
//     console.log(req.query.web); // Devuelve la variable web de la peticion : http://localhost:3700/test?web=google.com 
//     console.log(req.params.id); //devuelve el id:88 que colocamos al hacer la peticion : http://localhost:3700/test/88?web=google.com  
//     res.status(200).send({ //Es una respuesta exitosa por parte del servidor y con(send) enviaremos los datos
//         message: "Hola mundo desde mi API de NodeJs" //En este caso enviaremos un mensaje
//     })
// })

// **************************************4.-CONTROLADOR DEL BACKEND DE NODE********************************  
//Cargamos las rutas de project_router
//app.use('/api',project_router); //Si queremos lo ponemos sin /api

//EXPORTAR
module.exports = app; //Exportamos este modulo