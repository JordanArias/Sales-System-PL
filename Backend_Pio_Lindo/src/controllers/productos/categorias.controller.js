const pool = require('../../database')

const getCategorias = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const categoriaGet = await pool.query('select * from categoria ORDER BY cod_categoria ASC;');
        //console.log(categoriaGet.rows); // Imprimimos solo los datos necesarios
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(categoriaGet.rows);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener categorias');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

const crearCategoria = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = 'INSERT INTO categoria(cod_categoria, nombre)' + 
        'VALUES ($1, $2)';
        const {cod_categoria, nombre} = req.body;
        // console.log("Categoria::::::::::::");
        console.log(req.body);
        await client.query(text, [cod_categoria, nombre]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Categoria Creada exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear Categoria' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

const updateCategoriaById = async (req, res) =>{
    console.log("Entro a Actualizar");
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = 'UPDATE categoria SET nombre=$1 WHERE cod_categoria=$2;';
        const {cod_categoria,nombre} = req.body;

        await client.query(text, [nombre,cod_categoria]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Categoria actualizada exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar categoria' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

const deleteCategoriaById = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const elminar_subcategoria = 'DELETE FROM subcategoria WHERE cod_categoria = $1';
        const elminar_categoria = 'DELETE FROM categoria WHERE cod_categoria = $1';
        const cod_categoria = parseInt(req.params.cod_categoria);

        await client.query(elminar_subcategoria,[cod_categoria]);
        await client.query(elminar_categoria,[cod_categoria]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Categoria eliminada exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al eliminar categoria' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

const getSubCategorias = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const subcategoriaGet = await pool.query('select *from subcategoria ORDER BY cod_subcategoria ASC;');
        //console.log(categoriaGet.rows); // Imprimimos solo los datos necesarios
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(subcategoriaGet.rows);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener categorias');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};
const crearSubCategorias = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const {cod_subcategoria, nombre, cod_categoria} = req.body;
        const text = 'INSERT INTO subcategoria(cod_subcategoria, nombre, cod_categoria) VALUES($1, $2, $3)';
        //console.log(categoriaGet.rows); // Imprimimos solo los datos necesarios
        await client.query(text, [cod_subcategoria, nombre, cod_categoria]);
        await client.query('COMMIT'); // Confirma la transaccións
        res.status(200).json('Subcategoria agregada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json('Error al Obtener categorias');
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

const deleteSubCategoriaById = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = 'DELETE FROM subcategoria WHERE cod_subcategoria = $1';
        const cod_subcategoria = parseInt(req.params.cod_subcategoria);
        console.log(cod_subcategoria);
        
        await client.query(text,[cod_subcategoria]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('SubCategoria eliminada exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al eliminar categoria' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}
const updateSubCategoriaById = async (req, res) =>{
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text = 'UPDATE subcategoria SET nombre=$1 WHERE cod_subcategoria=$2;';
        const {cod_subcategoria,nombre} = req.body;

        await client.query(text, [nombre,cod_subcategoria]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Categoria actualizada exitosamente');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al modificar categoria' });
    }finally {
        client.release(); // Libera la conexión al pool
    }  
}

module.exports = {
    getCategorias,
    crearCategoria,
    updateCategoriaById,
    deleteCategoriaById,
    getSubCategorias,
    crearSubCategorias,
    deleteSubCategoriaById,
    updateSubCategoriaById
}