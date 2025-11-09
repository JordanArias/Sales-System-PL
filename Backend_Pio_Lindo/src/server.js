'use strict'

const app = require('./app');
require('./database');

// Obtener el puerto desde las variables de entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// El servidor ya está iniciado en app.js, solo necesitamos confirmar
console.log(`Backend iniciado en el puerto ${PORT}`);
console.log(`API disponible en: http://localhost:${PORT}/api`);

// Exportar para que pueda ser usado por Electron
module.exports = app;

