'use strict'

const express = require('express');
const morgan = require('morgan');
const pkg = require('../package.json');
const cors = require('cors'); // Importa el módulo cors
const usuariosRoutes = require('./routes/usuarios.routes')
const authRoutes = require('./routes/auth.routes');
const usu_rolRoutes = require('./routes/usu_rol.routes');
const productosRoutes = require('./routes/productos/productos.routes');
const categoriasRoutes = require('./routes/productos/categorias.routes');
const opcionesRoutes = require('./routes/productos/opciones.routes');
const complementosRoutes = require('./routes/productos/complementos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const reportesRoutes = require('./routes/reporte.routes');
const clientesRoutes = require('./routes/clientes.routes');
const cajaRoutes = require('./routes/caja.routes');
const insumoRoutes = require('./routes/insumos.routes');
const movimiento_insumoRoutes = require('./routes/movimiento_insumo.routes');
const socketIo = require('socket.io');
const http = require('http'); // Importa el módulo http para crear el servidor
const app = express();

// Crear un servidor HTTP
const server = http.createServer(app);
// Configura CORS para Express
app.use(cors({
    origin: ["http://localhost:4200", "http://192.168.3.125:4200", "file://"],
    methods: ['GET', 'POST','PUT','DELETE'],
    credentials: true
  }));
const io = socketIo(server, {
  cors: {
    //origin: "http://localhost:4200", // Cambia esta URL al origen de tu aplicación Angular
    origin: ["http://localhost:4200", "http://192.168.3.125:4200", "file://"],
    methods: ["GET", "POST","PUT", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

  io.on('connection', (socket) => {
    console.log('-----------------------------------------Un cliente se ha conectado.');

    // Maneja eventos personalizados aquí
    socket.on('evento_personalizado', (data) => {
      console.log('Evento personalizado recibido:', data);
      // Puedes emitir eventos a otros clientes aquí
      io.emit('evento_personalizado', data);
    });

    socket.on('disconnect', () => {
      console.log('Un cliente se ha desconectado.');
    });
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://192.168.3.125:${PORT}`);
  });
 
  
app.set('pkg', pkg);

app.use(morgan('dev'));
app.use(express.json());

app.get('/',(req,res) =>{
    res.json({
        name: app.get('pkg').name,
        author: app.get('pkg').author,
        description:app.get('pkg').description,
        version: app.get('pkg').version
    });
})

//Rutas Principales para las API Rest
app.use('/api/usuarios',usuariosRoutes);
app.use('/api/usu_rol',usu_rolRoutes);
app.use('/api/auth',authRoutes);
//PRODUCTOS
app.use('/api/productos',productosRoutes);
app.use('/api/categorias',categoriasRoutes);
app.use('/api/opciones',opcionesRoutes);
app.use('/api/complementos',complementosRoutes);

app.use('/api/ventas',ventasRoutes);
app.use('/api/reportes',reportesRoutes);
app.use('/api/clientes',clientesRoutes);
app.use('/api/caja',cajaRoutes);
app.use('/api/insumos',insumoRoutes);
app.use('/api/movimiento_insumo',movimiento_insumoRoutes);




//export default app;//Exportamos este modulo
module.exports = app;//Exportamos este modulo
