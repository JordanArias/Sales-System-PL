
const pool = require('../../database');

//***************************************** :::::::::: PRODUCTOS :::::::::: ************************************************************************************ */
//*************************************************************************************************************************************************************** */
//**************************************************** LISTAR PRODUCTOS *******************************************************************
const getProductos = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const getProcuctos = `  SELECT p.*, c.nombre as nom_categoria, s.nombre as nom_subcategoria
                                FROM producto as p
                                LEFT JOIN categoria as c ON p.cod_categoria = c.cod_categoria
                                LEFT JOIN subcategoria as s ON p.cod_subcategoria = s.cod_subcategoria
                                ORDER BY cod_producto ASC; `;

        const productos = await client.query(getProcuctos);
        const productos_insumos = await getProductos_Insumos(client);
        const productos_complemento = await getProductos_Complementos(client);
        const datos = [productos.rows, productos_insumos.rows, productos_complemento.rows];
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(datos);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener productos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
//**************************************************** LISTAR PRODUCTOS-INSUMOS *******************************************************************
const getProductos_Insumos = async (client) =>{
        const productos_insumoGet = ` SELECT ip.*, ins.nombre,
                                            CASE 
                                            WHEN ins.medida = 1 THEN 'Unid.'
                                            WHEN ins.medida = 2 THEN 'Kg.'
                                            WHEN ins.medida = 3 THEN 'mg.'
                                            WHEN ins.medida = 4 THEN 'Lt.'
                                            WHEN ins.medida = 3 THEN 'ml.'
                                            END AS nom_medida
                                        FROM insumo_producto as ip
                                        LEFT JOIN insumo as ins ON ins.cod_insumo = ip.cod_insumo 
                                        ORDER BY cod_producto ASC; `;
       return await client.query(productos_insumoGet);
}
//**************************************************** LISTAR PRODUCTOS-INSUMOS *******************************************************************
const getProductos_Complementos = async (client) =>{
    const productos_insumoGet = ` SELECT cp.*, c.nombre
                                    FROM producto_complemento as cp
                                    LEFT JOIN complemento as c ON c.cod_complemento = cp.cod_complemento 
                                    ORDER BY cod_complemento ASC; `;
   return await client.query(productos_insumoGet);
}
//**************************************************** CREAR PRODUCTO *******************************************************************
const crearProducto = async (req, res) =>{
    console.log('Producto Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = ` INSERT INTO producto(cod_producto, nombre, precio, ps_precio, producto_unico, estado, cocina, cod_categoria, cod_subcategoria)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); `;
        const {cod_producto, nombre, precio, ps_precio, producto_unico, estado, cocina, cod_categoria, cod_subcategoria} = req.body[0];
        console.log('Producto Agregado',req.body);
        //AGREGAMOS EL PRODUCTO
        await client.query(text, [cod_producto, nombre, precio, ps_precio, producto_unico, estado, cocina, cod_categoria, cod_subcategoria]);
        //MANDAMOS A AGREGAR LOS INSUMOS PRODUCTOS 
        await crearProducto_Insumo(client, req.body[1], cod_producto);
        await crearProducto_Complemento(client, req.body[2], cod_producto);
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
//*********** CREAR PRODUCTO-INSUMO *************
const crearProducto_Insumo = async (client, productos_insumos, cod_producto) =>{
    var text = `INSERT INTO insumo_producto(cod_producto, cod_insumo, cantidad) VALUES ($1, $2, $3); `;
    //Si el producto_insumo tiene el cod_insumo!=0 del primer array, entonces si hay varaibles a agregar
    console.log("PRODUCTOS_INSUMOS: ", productos_insumos);
    
    if (Array.isArray(productos_insumos) && productos_insumos.length > 0 && productos_insumos[0].cod_insumo != 0) {
        for (const producto of productos_insumos) {
            const { cod_insumo, cantidad } = producto;

            // Verifica que cod_insumo y cantidad estén definidos
            if (cod_insumo !== undefined && cantidad !== undefined) {
                await client.query(text, [cod_producto, cod_insumo, cantidad]);
            } else {
                console.warn('Elemento inválido encontrado, se omite:', producto);
            }
        }
    } else {
        console.log('No hay productos_insumos válidos para agregar.');
    }
}
//*********** CREAR PRODUCTO-INSUMO *************
const crearProducto_Complemento = async (client, productos_complementos, cod_producto) =>{
    var text = `INSERT INTO producto_complemento(cod_producto, cod_complemento) VALUES ($1, $2); `;
    //Si el producto_insumo tiene el cod_insumo!=0 del primer array, entonces si hay varaibles a agregar
    if (productos_complementos) {
        for(const complemento of productos_complementos){
            const {cod_complemento} = complemento;
            await client.query(text, [cod_producto, cod_complemento])
        }
    }
}
//**************************************************** MODIFICAR PRODUCTO *******************************************************************
const modificarProducto = async (req, res) =>{
    console.log('Producto Agregado',req.body);
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_producto = ` UPDATE producto SET nombre=$1, precio=$2, ps_precio=$3, producto_unico=$4, estado=$5, cocina=$6, cod_categoria=$7, cod_subcategoria=$8
                                     WHERE cod_producto=$9; `;
        const elminar_insumo_producto = 'DELETE FROM insumo_producto WHERE cod_producto = $1';
        const elminar_complemento_producto = 'DELETE FROM producto_complemento WHERE cod_producto = $1';
        const {cod_producto, nombre, precio, ps_precio, producto_unico, estado, cocina, cod_categoria, cod_subcategoria} = req.body[0];
        console.log('Producto Modificado',req.body);

        //MODIFICAMOS EL PRODUCTO EN LA BASE DE DATOS
        await client.query(modificar_producto, [nombre, precio, ps_precio, producto_unico, estado, cocina, cod_categoria, cod_subcategoria, cod_producto]);

        //ELIMINAMOS LOS INSUMO-PRODUCTOS
        await client.query(elminar_insumo_producto, [cod_producto]);
        //ELIMINAMOS LOS COMPLEMENTOS-PRODUCTOS
        await client.query(elminar_complemento_producto, [cod_producto]);

        //AGREGAMOS NUEVAMENTE LOS INSUMOS-PRODUCTOS
        await crearProducto_Insumo(client, req.body[1], cod_producto);
        //AGREGAMOS NUEVAMENTE LOS INSUMOS-PRODUCTOS
        await crearProducto_Complemento(client, req.body[2], cod_producto);

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

//************************************************* ELIMINAR PRODUCTO **************************************************************** */
const deleteProductoById = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const elminar_producto_complemento = 'DELETE FROM producto_complemento WHERE cod_producto = $1';
        const elminar_producto_insumo = 'DELETE FROM insumo_producto WHERE cod_producto = $1';
        const elminar_producto = 'DELETE FROM producto WHERE cod_producto = $1';

        const cod_producto = parseInt(req.params.cod_producto);
        //PRIMERO ELIMINAMOS LOS INSUMOS-PRODUCTOS
        await client.query(elminar_producto_insumo,[cod_producto]);
        //PRIMERO ELIMINAMOS LOS INSUMOS-PRODUCTOS
        await client.query(elminar_producto_complemento,[cod_producto]);
        //SEGUNDO ELIMINAMOS EL PRODUCTO
        await client.query(elminar_producto,[cod_producto]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Producto eliminado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al eliminar producto' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

//************************************************* ELIMINAR PRODUCTO **************************************************************** */
const cambiarEstadoProductoById = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const modificar_producto = ` UPDATE producto SET  estado=$1
                                     WHERE cod_producto=$2; `;

        const {cod_producto,estado} = req.body;

        await client.query(modificar_producto,[estado, cod_producto]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Producto modificado exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar producto' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}



//************************************** :::::::::: PETICION DE PRODUCTOS, COMPLEMENTO, OPCIONES, INSUMOS :::::::::: ************************************ */
//******************************************************************************************************************************************************** */
const getProductos_Venta = async (req, res) => {
    const client = await pool.connect();
    try {
        // Definir las consultas
        const queries = {
            categorias: 'SELECT * FROM categoria ORDER BY cod_categoria',
            subcategorias: 'SELECT * FROM subcategoria ORDER BY cod_subcategoria',
            productos: 'SELECT * FROM producto WHERE estado = 0 ORDER BY cod_producto ASC',
            complementos: 'SELECT * FROM complemento WHERE estado = 0 ORDER BY cod_complemento ASC',
            opciones: 'SELECT * FROM opcion WHERE estado = 0 ORDER BY cod_opcion ASC',
            productos_complementos: `SELECT pc.cod_producto, pc.cod_complemento
                                     FROM public.producto_complemento pc
                                     JOIN public.complemento c ON pc.cod_complemento = c.cod_complemento
                                     WHERE c.estado = 0`,
            complementos_opciones: `SELECT co.cod_complemento, co.cod_opcion
                                    FROM public.complemento_opcion co
                                    JOIN public.opcion o ON co.cod_opcion = o.cod_opcion
                                    WHERE o.estado = 0`
        };

        // Ejecutar todas las consultas en paralelo
        const results = await Promise.all([
            client.query(queries.categorias),
            client.query(queries.subcategorias),
            client.query(queries.productos),
            client.query(queries.complementos),
            client.query(queries.opciones),
            client.query(queries.productos_complementos),
            client.query(queries.complementos_opciones)
        ]);

        // Estructurar la respuesta
        const data = {
            categorias: results[0].rows,
            subcategorias: results[1].rows,
            productos: results[2].rows,
            complementos: results[3].rows,
            opciones: results[4].rows,
            productos_complementos: results[5].rows,
            complementos_opciones: results[6].rows
        };
        console.log(data.categorias);
        
        // Responder con los datos estructurados
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al obtener datos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
};




module.exports = {
    getProductos,
    crearProducto,
    modificarProducto,
    deleteProductoById,
    cambiarEstadoProductoById,
    getProductos_Venta
}