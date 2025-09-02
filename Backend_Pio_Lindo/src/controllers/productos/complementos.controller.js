const pool = require('../../database');


//**************************************************** LISTAR COMPLEMENTOS *******************************************************************
const getComplementos = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const complementoGet =` SELECT * FROM complemento ORDER BY cod_complemento ASC; `;
        //Obtenemos insumo_opcion
        const complementos = await client.query(complementoGet);
        const complemento_opcion = await getComplemento_Opcion(client);
        const data = [complementos.rows, complemento_opcion.rows]
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener complementos');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};
const getComplemento_Opcion = async (client) => {
    const insumo_opcionGet = `  SELECT co.*, o.nombre as nom_opcion, descripcion
                                FROM complemento_opcion as co
                                LEFT JOIN opcion as o ON o.cod_opcion = co.cod_opcion 
                                ORDER BY cod_complemento ASC; `;
    return await client.query(insumo_opcionGet);
}
//**************************************************** CREAR COMPLEMENTO *******************************************************************
const crearComplemento = async (req, res) =>{
    console.log('Complemento Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const addComplemento = ` INSERT INTO complemento(cod_complemento, nombre, descripcion, estado)
                            VALUES ($1, $2, $3, $4); `;
        const {cod_complemento, nombre, descripcion, estado} = req.body[0];

        //AGREGAMOS EL COMPLEMENTO
        await client.query(addComplemento, [cod_complemento, nombre, descripcion, estado]);
        //AGREGAMOS COMPLEMENTOS_OPCIONES
        await crear_Complemento_Opcion(client, req.body[1],cod_complemento)
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Complemento Creado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear Complemento' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}
const crear_Complemento_Opcion = async (client, complemento_opcion, cod_complemento) =>{
    var addComplemento_Opcion = `INSERT INTO complemento_opcion(cod_complemento, cod_opcion) VALUES ($1, $2); `;
    //Si el insumo_opcion tiene el cod_insumo!=0 del primer array, entonces si hay varaibles a agregar
    console.log('Opcion Insumo: ',complemento_opcion);
    if (complemento_opcion) {
        for(const co of complemento_opcion){
            const {cod_opcion} = co;
            await client.query(addComplemento_Opcion, [cod_complemento, cod_opcion]);
        }
    }
}
//**************************************************** MODIFICAR COMPLEMENTO *******************************************************************
const modificarComplemento = async (req, res) =>{
    console.log('Producto Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_complemento = ` UPDATE complemento SET nombre=$1, descripcion=$2, estado=$3
                                        WHERE cod_complemento=$4; `;
        const elminar_complemento_opcion = 'DELETE FROM complemento_opcion WHERE cod_complemento = $1';
        const {cod_complemento, nombre, descripcion, estado} = req.body[0];
        //PRIMERO: MODIFICAMOS LA OPCION
        await client.query(modificar_complemento,[nombre, descripcion, estado, cod_complemento]);
        //SEGUNDO: ELIMINAMOS LOS COMPLEMENTO-OPCION
        await client.query(elminar_complemento_opcion,[cod_complemento]); console.log('2.- ELIMINAMOS INSUMO-OPCION');
        //TERCERO AGREGAMOS NUEVAMENTE LOS COMPLEMENTO-OPCION
        await crear_Complemento_Opcion(client, req.body[1], cod_complemento); console.log('3.- CREAMOS INSUMO-OPCION');

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Complemento Modificado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al Modificar Complemento' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}
//**************************************************** ELIMINAR COMPLEMENTO *******************************************************************
const deleteComplemento = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const elminar_complemento_opcion = 'DELETE FROM complemento_opcion WHERE cod_complemento = $1';
        const elminar_complemento = 'DELETE FROM complemento WHERE cod_complemento = $1';

        const cod_complemento = parseInt(req.params.cod_complemento);
        //PRIMERO: ELIMINAMOS LOS COMPLEMENTO-OPCION
        await client.query(elminar_complemento_opcion,[cod_complemento]);
        //SEGUNDO: ELIMINAMOS COMPLEMENTO
        await client.query(elminar_complemento,[cod_complemento]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Complemento eliminada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Eliminar Complemento');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

//**************************************************** ELIMINAR OPCION *******************************************************************
const estadoComplemento = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_complemento = ` UPDATE complemento SET estado=$1 WHERE cod_complemento=$2; `;
        const {cod_complemento, estado} = req.body;
        //MODIFICAMOS LA OPCION
        await client.query(modificar_complemento,[estado, cod_complemento]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Complemento Estado Modificado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Eliminar Complemento');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};
module.exports = {
    getComplementos,
    crearComplemento,
    modificarComplemento,
    deleteComplemento,
    estadoComplemento
}