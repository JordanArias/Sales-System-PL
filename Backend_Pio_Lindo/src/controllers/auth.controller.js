
const pool = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const singUp = async (req, res) =>{
    try {
    } catch (error) {
        console.log(error);
    }
}

//INICIAR SESION
const singIn = async (req, res) =>{
    const text = 'select *from usuario where ci_usuario = $1';
    const ci_usuario = req.body.ci_usuario;
    const passwordReceived = req.body.clave;
    const client = await pool.connect();
    try {
         //Consulta
    const usuarioFound = await pool.query(text, [ci_usuario]);
    
    const passwordFound = usuarioFound.rows[0].clave;

    if(!usuarioFound.rows.length){ res.status(400).json('no existe el ci'); }

    //console.log(passwordReceived);
    //console.log("Clave: "+passwordFound);
    //console.log(usuarioFound.rows.length);
    
    //Comparamos las contraseñas
    const comparePasswords = await bcrypt.compare(passwordReceived,passwordFound);
    //console.log(comparePasswords);

    if (!comparePasswords) return res.status(401).json({token:null, message:'Invalid password'})
        console.log(usuarioFound.rows);
    const token = jwt.sign({id: usuarioFound.rows[0].ci_usuario}, config.SECRET, {
        expiresIn: 86400
    })
    await client.query('COMMIT'); // Confirma la transacción
    res.status(200).json({token});
    } catch (error) {
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Usuario o password invalidos');
    }finally {
        client.release(); // Libera la conexión al pool
    }
   
}


module.exports = {
    singUp,
    singIn
}
