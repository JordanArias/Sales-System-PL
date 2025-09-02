'use strict';

//Creación del servidor
var app = require('./app'); //cargamos el archivo(app.js) donde se configuro el Express
var port = 3700; //Indicamos el puerto del servidor

//CREACION DEL SERVIDOR
app.listen(port, () => {
  console.log("Servidor correctamente en la url: localhost:3700");
});
const {
  Pool
} = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  port: '5433',
  password: '1234567',
  database: 'proyecto_db'
});

//Consulta a la base de datos
const getUsuarios = async () => {
  try {
    const res = await pool.query('select *from usuario');
    console.log(res.rows); //obtenemos solo los datos necesarios
    //pool.end(); //Para terminar la ejecucion
  } catch (error) {
    console.log(error);
  }
};

//Consulta para insertar datos
const insertUser = async () => {
  try {
    const text = 'INSERT INTO usuario(ci_usuario, nom_usu, ap_usu, am_usu, clave)' + 'VALUES ($1, $2, $3, $4, $5)';
    const values = [123456, 'Jordan', 'Arias', 'Marca', 'jordan'];
    const res = await pool.query(text, values);
    console.log(res);
    pool.end();
  } catch (error) {
    console.log(error);
  }
};

//Consulta para insertar datos
const deletetUser = async () => {
  const text = 'DELETE FROM usuario WHERE nom_usu = $1';
  const value = ['Jordan'];
  const res = await pool.query(text, value);
  console.log(res);
};

//Consulta para insertar datos
const updateUser = async () => {
  const text = 'UPDATE usuario SET nom_usu = $1 WHERE nom_usu = $2';
  const value = ['Brenda', 'Jordan'];
  const res = await pool.query(text, value);
  console.log(res);
};
getUsuarios();
//insertUser();
//deletetUser();
//updateUser();