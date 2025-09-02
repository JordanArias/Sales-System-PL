const e = require('express');
const pool = require('../database')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer'); // Para enviar correos

const crearUsuarios = async (req, res) =>{
    const client = await pool.connect();
//Consulta para insertar datos
        try {
            // COMIENZA LA TRANSACCIÓN
            await client.query('BEGIN');

            const text = 'INSERT INTO usuario(ci_usuario, nom_usu, ap_usu, clave, cargo)' + 
            'VALUES ($1, $2, $3, $4, $5)';
            const {ci_usuario, nom_usu, ap_usu, clave, cargo} = req.body;

            //Encriptamos password
            let password = await bcrypt.hash(clave,8)
            console.log(password)
            //const values = [req.params.ci_usuario, req.params.nom_usu, req.params.ap_usu, req.params.am_usu, req.params.clave];

            //CONSULTA
            const usuarioSave = await pool.query(text, [ci_usuario, nom_usu, ap_usu, password, cargo]);
            //console.log(usuarioSave);
            //res.status(200).json('Usuario Creado');
          
            //Token
            const token = jwt.sign({id: usuarioSave.ci_usuario}, config.SECRET, {
                expiresIn:86400 //24horas
            })

            await client.query('COMMIT'); // Confirma la transacción
            res.status(200).json({token});
            //res.status(200).json({token});            
        } catch (error) {
            console.log(error);
            await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
            res.status(500).json({ error: 'Error interno del servidor' });
        }finally {
            client.release(); // Libera la conexión al pool
        }
}


// Endpoint para iniciar el proceso de recuperación de contraseña
const iniciarRecuperacion = async (req, res) => {
    try {
        const { ci_usuario } = req.body; // Recibimos el número de cédula

        // Verificamos si el usuario existe
        const userQuery = await pool.query('SELECT * FROM usuario WHERE ci_usuario = $1', [ci_usuario]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generamos un token único con una duración de 1 hora
        const resetToken = jwt.sign({ id: user.ci_usuario }, config.SECRET, { expiresIn: '1h' });

        // Guardamos el token y su fecha de expiración
        await pool.query(
            'UPDATE usuario SET reset_token = $1, reset_expires = $2 WHERE ci_usuario = $3',
            [resetToken, new Date(Date.now() + 3600 * 1000), ci_usuario]
        );

        res.status(200).json({
            message: 'Token generado con éxito',
            token: resetToken // Solo enviamos el token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el token de recuperación' });
    }
};




const restablecerContrasena = async (req, res) => {
    try {
        const { token, newPassword } = req.body; // Recibimos el token y la nueva contraseña

        // Verificamos el token
        const decoded = jwt.verify(token, config.SECRET);
        const userQuery = await pool.query('SELECT * FROM usuario WHERE ci_usuario = $1', [decoded.id]);
        const user = userQuery.rows[0];

        if (!user || user.reset_token !== token) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        // Encriptamos la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Actualizamos la contraseña y eliminamos el token
        await pool.query(
            'UPDATE usuario SET clave = $1, reset_token = NULL, reset_expires = NULL WHERE ci_usuario = $2',
            [hashedPassword, user.ci_usuario]
        );

        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al restablecer contraseña' });
    }
};






const getUsuarioById = async (req, res) =>{
    try {
        const text = 'select *from usuario where ci_usuario = $1';
        const id = parseInt(req.params.ci_usuario); 
        const usuarioGet = await pool.query(text, [id]);
        //pool.end()
        console.log(usuarioGet.rows.length);
        res.status(200).json(usuarioGet.rows); //Con esto da postman
    } catch (error) {
        console.log(error);
    }
}


const getUsuarios = async (req, res) =>{
    try {
        const usuariosGet = await pool.query('select *from usuario ORDER BY ci_usuario ASC');
        console.log(res.rows) //obtenemos solo los datos necesarios
        res.status(200).json(usuariosGet.rows);
        //pool.end(); //Para terminar la ejecucion
    } catch (error) {
        console.log(error);
    }
}


const updateUsuarioById = async (req, res) =>{
    console.log("REQ: ",req.body);
    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        const text = 'UPDATE usuario SET nom_usu = $1, ap_usu = $2, cargo = $3 WHERE ci_usuario = $4';
        //const id = parseInt(req.params.ci_usuario); //recogemos el id del objeto a actualizar
        const {nom_usu, ap_usu, cargo, ci_usuario} = req.body;
        // console.log('Nombre: ', nombre);
        

       await pool.query(text, [nom_usu, ap_usu, cargo, ci_usuario]);

       await client.query('COMMIT'); // Confirma la transacción
       res.status(200).json('Usuario modificado');
       //res.status(200).json({token});            
   } catch (error) {
       console.log(error);
       await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
       res.status(500).json({ error: 'Error interno del servidor' });
   }finally {
       client.release(); // Libera la conexión al pool
   }
}


const deleteUsuarioById = async (req, res) =>{
    try {
        const text = 'DELETE FROM usuario WHERE ci_usuario = $1';
        const id = parseInt(req.params.ci_usuario);
    
        const usuarioDeleted = await pool.query(text,[id]);
        res.status(200).json("usuario eliminado");
        //console.log(usuarioDeleted);  
    } catch (error) {
        console.log(error);
    }  
}


const getUsuarioRoles = async (req, res) =>{
    try {
        const text = 'select r.rol, r.enlace, r.cod_rol from roles r ' +  
                    ' JOIN roles_usuarios ru ON ru.cod_rol = r.cod_rol ' +
                    ' JOIN usuario u ON u.ci_usuario = ru.ci_usuario ' +
                    ' Where u.ci_usuario = $1 '
        const id = parseInt(req.params.ci_usuario); 
        console.log('id::',+id);
        const usuarioGet = await pool.query(text, [id]);
        //pool.end()
        console.log(usuarioGet.rows.length);
        res.status(200).json(usuarioGet.rows); //Con esto da postman
    } catch (error) {
        console.log('ERROR:: ID vacio o incorrecto');
        res.status(500).json('Error al obtener roles de usuario');
    }
}

const deleteRolesUsuarioById = async (req, res) =>{
    try {
        const text = 'DELETE FROM roles_usuarios WHERE ci_usuario = $1';
        const id = parseInt(req.params.ci_usuario);
    
        const usuarioDeleted = await pool.query(text,[id]);
        res.status(200).json("Roles eliminados");
        //console.log(usuarioDeleted);  
    } catch (error) {
        console.log(error);
    }  
}

module.exports = {
    crearUsuarios,
    iniciarRecuperacion,
    restablecerContrasena,
    getUsuarioById,
    getUsuarios,
    updateUsuarioById,
    deleteUsuarioById,
    getUsuarioRoles,
    deleteRolesUsuarioById
}
