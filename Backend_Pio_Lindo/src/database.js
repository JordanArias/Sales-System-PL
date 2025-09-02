const { Pool, types } = require('pg');

// Forzar la conversión de tipos numéricos a JavaScript number
types.setTypeParser(1700, val => parseFloat(val)); // 1700 es el OID para el tipo numeric


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    port: '5432',
    password: '1234567',
    database: 'sistema_version_bs1'
});


module.exports = pool;
