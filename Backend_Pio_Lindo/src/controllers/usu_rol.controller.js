const e = require('express');
const pool = require('../database')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const agregarRolUsuario = async (req, res) =>{
//Consulta para insertar datos
const client = await pool.connect();
const rolesAdd = req.body.rolesAdd;
const ci = req.body.ci_user;
        try {
            await deleteRolesUsuarios(client,ci);
            await crear_Rol_Usuario(client, rolesAdd, ci);
            await client.query('COMMIT'); // Confirma la transacción
            res.status(200).json("roles agregados"); //Con esto da postman 
        } catch (error) {
            console.log(error);
            await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        }finally {
            client.release(); // Libera la conexión al pool
        }
}

const crear_Rol_Usuario = async (client, roles, ci) =>{
    console.log("2.- rolesAdd es:", roles);
    //Consulta para insertar datos
        const text = ' INSERT INTO public.roles_usuarios(ci_usuario, cod_rol) VALUES ($1, $2)';
        for(const rol of roles){
            console.log("3.- insertar rol:", rol)
            await client.query(text, [ci, rol]); 
        }
}

const getRolesUsuarios = async (req, res) =>{
    const client = await pool.connect();
    try {
        const text = 'select cod_rol from roles_usuarios WHERE ci_usuario = $1';
        const ci_usuario = parseInt(req.params.ci_usuario);
        const usurolGet = await pool.query(text,[ci_usuario]);

        await client.query('COMMIT'); // Confirma la transacción 
        res.status(200).json(usurolGet.rows);
        //pool.end(); //Para terminar la ejecucion
    } catch (error) {
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        console.log(error);
    }finally {
        client.release(); // Libera la conexión al pool
    }
}



const deleteRolesUsuarios = async (client,ci_usuario) =>{
    console.log("1.- ci del de roles_usu:", ci_usuario);
        const text = 'DELETE FROM roles_usuarios WHERE ci_usuario = $1 ';
        await client.query(text,[ci_usuario]);  

}

module.exports = {
    agregarRolUsuario,
    getRolesUsuarios,
    deleteRolesUsuarios
}
