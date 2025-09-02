const pool = require('../database');
const {crear_Movimiento_Insumo, crear_Entrada_de_Detalles, modificar_Salida, eliminar_Salida} = require('./movimiento_insumo.controller');
//***************************************** :::::::::: INSUMOS :::::::::: ************************************************************************************ */
//*************************************************************************************************************************************************************** */

// ********************** POST INSUMOS **********************
const crearInsumos = async (req, res) =>{
    const insumo = req.body[0];
    const movimiento = req.body[1];
    const detalle_movimiento= req.body[2];
    console.log('-----------------------------------------------------------');
    console.log('Insumo: ', insumo);
    console.log('movimiento: ', movimiento);
    console.log('detalle_movimiento: ', detalle_movimiento);
    console.log('-----------------------------------------------------------');
    //Consulta para insertar datos   
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = ' INSERT INTO insumo(cod_insumo, nombre, medida, descripcion, existencia, estado, minimo) ' + 
                        'VALUES ($1, $2, $3, $4, $5, $6, $7)';
        const {cod_insumo, nombre, medida, descripcion, existencia, estado, minimo} = insumo;
        console.log("Insumo a agregar::::::::::::");
        console.log(req.body[0]);
        //CONSULTA AGREGAR INSUMO
        await client.query(text, [cod_insumo, nombre, medida, descripcion, existencia, estado, minimo]);
        //REGISTRAR MOVIMIENTO
        await crear_Movimiento_Insumo(client, movimiento);
        //CREAR DETALLES ENTRADA
        const detalles=[req.body[2]];
        await crear_Entrada_de_Detalles(client, detalles, movimiento.cod_mov);
        
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Insumo Creado');   
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear insumo' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}

// ********************** GET INSUMOS **********************
const getInsumos = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = `
                    SELECT *,
                        CASE
                            WHEN medida = 1 THEN 'Unid.'
                            WHEN medida = 2 THEN 'Kg.'
                            WHEN medida = 3 THEN 'mg.'
                            WHEN medida = 4 THEN 'Lt.'
                            WHEN medida = 3 THEN 'ml.'
                        END AS nom_medida
                    FROM insumo
                    ORDER BY cod_insumo ASC;
                `;
        const insumosGet = await client.query(text);
        //console.log(insumosGet.rows); // Obtenemos solo los datos necesarios
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(insumosGet.rows);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener insumos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}

// ******************************* UPDATE INSUMOS *****************************************
//*****************************************************************************************
const modificarInsumos = async (req, res) =>{
    //Consulta para insertar datos
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = ' UPDATE insumo ' + 
                     ' SET nombre=$1, medida=$2, descripcion=$3, existencia=$4, estado=$5, minimo=$6 '+
                     ' WHERE cod_insumo=$7';
        const {cod_insumo, nombre, medida, descripcion, existencia, estado, minimo} = req.body;
        console.log("Insumo a modificar::::::::::::");
        console.log(req.body);
        //CONSULTA
        await client.query(text, [nombre, medida, descripcion, existencia, estado, minimo, cod_insumo]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Producto Modificado');   
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar insumo' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}

// ******************************** DELETE INSUMOS ****************************************
//*****************************************************************************************
const deleteInsumoById = async (req, res) =>{
    const cod_insumo = parseInt(req.params.cod_insumo);
    console.log("cod_insumo:::",cod_insumo);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = 'DELETE FROM insumo WHERE cod_insumo = $1';
        await client.query(text,[cod_insumo]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json("insumo eliminado");
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al eliminar insumo' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

module.exports = {
    crearInsumos,
    getInsumos,
    modificarInsumos,
    deleteInsumoById
}