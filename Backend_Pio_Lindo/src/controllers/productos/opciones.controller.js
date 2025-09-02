const pool = require('../../database')


//**************************************************** LISTAR OPCIONES *******************************************************************
const getOpciones = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const opcionGet = await client.query('select * from opcion ORDER BY cod_opcion ASC;');
        //Obtenemos insumo_opcion
        const insumo_opcionGet = await getInsumo_Opcion(client);
        const datos = [opcionGet.rows, insumo_opcionGet.rows];
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(datos);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener opciones');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};
const getInsumo_Opcion = async (client) => {
    const insumo_opcionGet = ` SELECT op.*, ins.cod_insumo, ins.nombre as nom_insumo, 
                                CASE 
                                WHEN ins.medida = 1 THEN 'Unid.'
                                WHEN ins.medida = 2 THEN 'Kg.'
                                WHEN ins.medida = 3 THEN 'mg.'
                                WHEN ins.medida = 4 THEN 'Lt.'
                                WHEN ins.medida = 3 THEN 'ml.'
                                END AS nom_medida
                            FROM insumo_opcion as op
                            LEFT JOIN insumo as ins ON ins.cod_insumo = op.cod_insumo 
                            ORDER BY cod_opcion ASC; `;
    return await client.query(insumo_opcionGet);
}
//**************************************************** CREAR OPCION *******************************************************************
const crearOpcion = async (req, res) =>{
    console.log('Producto Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const addOpcion = ` INSERT INTO opcion(cod_opcion, nombre, descripcion, estado)
                            VALUES ($1, $2, $3, $4); `;
        const {cod_opcion, nombre, descripcion, estado} = req.body[0];
        console.log('Opción Agregado',req.body[0]);
        //AGREGAMOS LA OPCION
        await client.query(addOpcion, [cod_opcion, nombre, descripcion, estado]);
        //MANDAMOS A AGREGAR LOS INSUMOS-OPCIONES 
        await crear_Insumo_Opcion(client,req.body[1],cod_opcion);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Producto Creado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear Producto' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}
const crear_Insumo_Opcion = async (client, insumo_opcion, cod_opcion) =>{
    var addInsumo_Opcion = `INSERT INTO insumo_opcion(cod_insumo, cod_opcion, cantidad) VALUES ($1, $2, $3); `;
    //Si el insumo_opcion tiene el cod_insumo!=0 del primer array, entonces si hay varaibles a agregar
    console.log('Opcion Insumo: ',insumo_opcion);
    if (insumo_opcion) {
        for(const op of insumo_opcion){
            const {cod_insumo, cantidad} = op;
            await client.query(addInsumo_Opcion, [cod_insumo, cod_opcion, cantidad]);
        }
    }
}

//**************************************************** MODIFICAR OPCION *******************************************************************
const modificarOpcion = async (req, res) =>{
    console.log('Producto Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_opcion = ` UPDATE opcion SET nombre=$1, descripcion=$2, estado=$3
                                   WHERE cod_opcion=$4; `;
        const elminar_insumo_opcion = 'DELETE FROM insumo_opcion WHERE cod_opcion = $1';

        const {cod_opcion, nombre, descripcion, estado} = req.body[0];
        //PRIMERO: MODIFICAMOS LA OPCION
        await client.query(modificar_opcion,[nombre, descripcion, estado, cod_opcion]); console.log('1.- MODIFICAMOS OPCION');
        //SEGUNDO: ELIMINAMOS LOS INSUMOS-OPCION
        await client.query(elminar_insumo_opcion,[cod_opcion]); console.log('2.- ELIMINAMOS INSUMO-OPCION');
        //TERCERO AGREGAMOS NUEVAMENTE LOS INSUMOS-OPCION
        await crear_Insumo_Opcion(client, req.body[1], cod_opcion); console.log('3.- CREAMOS INSUMO-OPCION');

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Producto Modificado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar Producto' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}
//**************************************************** ELIMINAR OPCION *******************************************************************
const deleteOpcion = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const elminar_insumo_opcion = 'DELETE FROM insumo_opcion WHERE cod_opcion = $1';
        const elminar_opcion = 'DELETE FROM opcion WHERE cod_opcion = $1';
        const cod_opcion = parseInt(req.params.cod_opcion);
        //PRIMERO ELIMINAMOS LOS INUSMOS-OPCION
        await client.query(elminar_insumo_opcion,[cod_opcion]);
        //SEGUNDO ELIMINAMOS LA OPCION
        await client.query(elminar_opcion,[cod_opcion]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Opcion eliminada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener opciones');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

//**************************************************** ELIMINAR OPCION *******************************************************************
const estadoOpcion = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_opcion = ` UPDATE opcion SET estado=$1 WHERE cod_opcion=$2; `;
        const {cod_opcion, estado} = req.body;
        //MODIFICAMOS LA OPCION
        await client.query(modificar_opcion,[estado, cod_opcion]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Opcion Estado Modificado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener opciones');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

module.exports = {
    getOpciones,
    crearOpcion,
    modificarOpcion,
    deleteOpcion,
    estadoOpcion
}