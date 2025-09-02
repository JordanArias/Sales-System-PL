const pool = require('../database');


//******************************************* :::::::::: CLIENTES :::::::::: ************************************************************************************
//***************************************************************************************************************************************************************

//**************************************************** LISTAR CLIENTES *******************************************************************
const getClientes = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción

        const res_cliente = await client.query('SELECT * FROM cliente ORDER BY cod_cliente;');
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(res_cliente.rows);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener clientes' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}

const post_AgregarCliente = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text_InsertCliente = `INSERT INTO public.cliente(
                                    identificacion, nombre, documento, correo, celular, estado)
                                    VALUES ($1, $2, $3, $4, $5, $6);`;
        const {identificacion, nombre, documento, correo, celular, estado} = req.body;
        await client.query(text_InsertCliente, [identificacion, nombre, documento, correo, celular, estado]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Cliente Agregado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear cliente' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}

const update_ModificarCliente = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text_UpdateCliente = `UPDATE cliente
                                    SET identificacion=$1, nombre=$2, documento=$3, correo=$4, celular=$5, estado=$6
                                    WHERE cod_cliente = $7; `;
        const {identificacion, nombre, documento, correo, celular, estado, cod_cliente} = req.body;
        await client.query(text_UpdateCliente, [identificacion, nombre, documento, correo, celular, estado, cod_cliente]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Cliente Modificado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar cliente' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
const update_EstadoCliente = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text_UpdateCliente = `UPDATE cliente
                                    SET estado=$1
                                    WHERE cod_cliente = $2; `;
        const {cod_cliente, estado} = req.body;
        await client.query(text_UpdateCliente, [estado, cod_cliente]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Estado Cliente Modificado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar estado cliente' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}

const delete_Cliente = async (req, res) =>{
    console.log('******************** ELIMINAR CLIENTE ********************');
    console.log('cod_cliente ::', req.params.cod_cliente);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text_DeleteCliente = ` DELETE FROM cliente
                                     WHERE cod_cliente = $1; `;
        
        const { cod_cliente } = req.params;

        await client.query(text_DeleteCliente, [cod_cliente]);
        
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Cliente Eliminado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al eliminar el cliente' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
module.exports = {
    getClientes,
    post_AgregarCliente,
    delete_Cliente,
    update_ModificarCliente,
    update_EstadoCliente
    // crearProducto,
    // modificarProducto,
    // deleteProductoById,
    // cambiarEstadoProductoById,
    // getProductos_Venta
}