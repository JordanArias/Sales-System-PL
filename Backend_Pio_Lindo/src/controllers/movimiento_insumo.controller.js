const pool = require('../database');

// ****************************** POST TODO - DETALLE - MOVIMIENTO - INSUMO ******************************
//********************************************************************************************************
const crear_Todo_Detalle_Movimiento_Insumo = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        console.log("Movimiento:: ",req.body[0]); console.log("Detalle:: ",req.body[1]);
        const movimiento_insumo=req.body[0]; const detalle_movimiento_insumo=req.body[1];
        await crear_Movimiento_Insumo(client, movimiento_insumo);
        //VERIFICAMOS SI ES ENTRADA , SALIDA O MERMA
        if (movimiento_insumo.movimiento>1) {
            await crear_Salida_de_Detalles(client, detalle_movimiento_insumo, movimiento_insumo.cod_mov);
        }else{
            await crear_Entrada_de_Detalles(client, detalle_movimiento_insumo, movimiento_insumo.cod_mov);
        }
        console.log('------------------------------------------------------------------------------------------------');
        
         // Verificar los datos después de las actualizaciones
        //  const resultAfterUpdate = await client.query('SELECT * FROM detalle_movimiento_insumo WHERE lote = $1;', [1]);
        //  console.log('Resultado de la consulta después de la actualización:', resultAfterUpdate.rows);
        //  console.log('------------------------------------------------------------------------------------------------');

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Movimiento Creado');   
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear insumo' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
// :::::::::: POST MOVIMIENTO - INSUMO 
const crear_Movimiento_Insumo = async (client, movimiento_insumo) => {
    const text = `
        INSERT INTO movimiento_insumo 
        (cod_mov, movimiento, precio, ps_precio, tipo_cambio, descripcion, fecha, hora, ci_usuario, origen, cod_venta) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
    `;
    const {cod_mov, movimiento, precio, ps_precio, tipo_cambio, descripcion, fecha, hora, ci_usuario, origen, cod_venta} = movimiento_insumo;
    
    console.log("1.- Movimiento a agregar::::::::::::");
    console.log(movimiento_insumo);
    
    // CONSULTA
    await client.query(text, [
        cod_mov, movimiento, precio, ps_precio, tipo_cambio, descripcion, fecha, hora, ci_usuario, origen, cod_venta || null
    ]);
}
// :::::::::: POST SALIDA MOVIMIENTO - INSUMO 
const crear_Salida_de_Detalles2 = async (client, detalle_movimientos,cod_mov) => {
    console.log('***************************************** SALIDA DETALLES *****************************************');
    
    //Obtener Lotes que se relacionen con cod_insumo , existencia >0 y movimiento =1 (entrada)
    const obtener_lotes = ` SELECT d.*
                            FROM detalle_movimiento_insumo AS d
                            JOIN movimiento_insumo AS m ON d.cod_mov = m.cod_mov
                            WHERE d.cod_insumo = $1
                            AND m.movimiento = 1
                            AND m.cod_mov = (
                                SELECT MAX(m2.cod_mov)
                                FROM movimiento_insumo AS m2
                                JOIN detalle_movimiento_insumo AS d2 ON m2.cod_mov = d2.cod_mov
                                WHERE d2.cod_insumo = $1 AND m2.movimiento = 1
                            )
                            ORDER BY d.lote;`;
    //Modificar Lote Existencia
    const modificar_lote = ` Update detalle_movimiento_insumo set existencia=$1 where lote=$2 and cod_mov=$3; `;
    //Insertar Lote Salida
    const insertar_lote = ` INSERT INTO detalle_movimiento_insumo (lote, cod_mov, cod_insumo, precio, precio_unidad, cantidad, existencia, cantidad_nueva, cod_detalle_insumo)
                                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); `;
    const modificar_movimiento = ` Update movimiento_insumo set precio=$1 where cod_mov=$2; `;
    //Modificar Lote Existencia
    const modificar_insumo = ` Update insumo set existencia=existencia-$1 where cod_insumo=$2; `;

    //Obtenemos el ultimo cod_detalle_insumo
    const ultimo_cod_detalle=  await client.query(`  SELECT COALESCE((SELECT MAX(cod_detalle_insumo) FROM detalle_movimiento_insumo), 0) AS cod_detalle_insumo; `);
    //Guardamos el cod_detalle
    let cod_detalle_insumo = Number(ultimo_cod_detalle.rows[0].cod_detalle_insumo);
    console.log("Ultimo cod detalle:: ",cod_detalle_insumo);

    //Definimos las variables precio_total que agregaremos a precio de Movimiento_Insumo y cantidad_total que restaremos a cantidad de Insumo
    var precio_total=0; var cantidad_total=0;  
    
    //Recorremos todos los Detalles
    for(const detalle of detalle_movimientos){

        console.log('Detalle: ',detalle);
        
        //Lote de Salida
        const {lote, cod_insumo, precio, precio_unidad, cantidad, existencia,existencia_actual} = detalle; 
        //Obtenemos los lotes relacionados al Lote_salida y que sean >0 
        const lotes_llenos = await client.query(obtener_lotes, [cod_insumo]); 
        console.log('lotes_llenos: ',lotes_llenos.rows);
        
        //Variable bandera para verificar si se resto toda la cantidad del lote
        var cantidad_aux=Number(cantidad);  
        //Sumamos la cantidad de cada lote Salida para restarlo a existencia de Insumo
        cantidad_total=cantidad_total+Number(detalle.cantidad); console.log("CANTIDAD:::::::  ",detalle.cantidad); console.log("CANTIDAD_TOTAL:::::::  ",cantidad_total);

        //Existencia Actual del Insumo
        // let existencia_insumo=existencia_actual;
        let existencia_insumo = (await client.query('SELECT existencia FROM insumo WHERE cod_insumo = $1', [cod_insumo])).rows[0].existencia;
        console.log("Cantidad actual del insumo::: ",existencia_insumo );

    //::::: RECCORREMOS TODOS LOS LOTES LLENOS RELACIONADOS AL COD_INSUMO ::::::
        for(const lote_lleno of lotes_llenos.rows){ 
        //1er IF :: Si lote_lleno.existencia(30) < cantidad_aux(31) :: Modificamos la existencia del lote a 0 y restamos cantidad_aux - existencia del lote lleno
            if (lote_lleno.existencia <= cantidad_aux && cantidad_aux > 0) {     console.log("1.- PRIMER IF::::::::::::::::::");

             //PASO 1:: MODIFICAMOS EL LOTE DE ENTRADA A EXISTENCIA = 0 
                //restamos: lote_lleno.existencia(0) - cantidad_aux(1) = -1
                cantidad_aux = lote_lleno.existencia - cantidad_aux;  console.log("1.- PRIMER IF:: cantidad_aux :: ",cantidad_aux);
                //***** Modificamos el primer lote_lleno verificado a existencia=0 ****
                await client.query(modificar_lote, [cantidad_aux, lote_lleno.lote, lote_lleno.cod_mov]);

             //PASO 2:: AGREGAMOS EL NUEVO LOTE DE SALIDA CON LOS DATOS CORRESPONDIENTES
                //agregamos : lote_lleno.precio_unidad(7,5) * lote_lleno.existencia(30) = 225bs
                detalle.precio = lote_lleno.precio_unidad * detalle.cantidad; console.log("2.- PRIMER IF:: detalle_precio :: ",detalle.precio);
                //Agregamos la lote_lleno.existencia a detalle.cantidad : La cantidad que consume el Lote Salida
                //detalle.cantidad = lote_lleno.existencia - detalle.cantidad; console.log("2.- PRIMER IF:: detalle.cantidad :: ",detalle.cantidad);
                //Agregamos detalle.existencia = 0 : debido a que el lote_lleno quedo en 0
                detalle.existencia = lote_lleno.existencia - detalle.cantidad;    console.log("2.- PRIMER IF:: detalle.existencia :: ",detalle.existencia);
                //Agregamos el lote_lleno.lote a detalle.lote, por que es el mismo lote que consume la salida
                detalle.lote = lote_lleno.lote;
                
                //Obtenemos la existencia actual del insumo
                console.log("2.- PRIMER IF:: existencia_insumo y lote_lleno.existencia :: " + existencia_insumo + " : "+ lote_lleno.existencia);  
                const cantidad_nueva = 0;        console.log("2.- PRIMER IF:: Cantidad Nueva :: ",cantidad_nueva);
                //Modificamos existencia del insumo Actual  
                //existencia_insumo = cantidad_nueva; console.log("2.- PRIMER IF:: existencia_insumo  :: ",existencia_insumo);  
                //Elevamos el cod_detalle_insumo
                cod_detalle_insumo = cod_detalle_insumo+1; console.log("cod_detalle_insumo a elevar :: ",cod_detalle_insumo);
                console.log('2.- DETALLE ANTES DE INSERTAR LOTE:: ',detalle);
                
                //***** Agregamos el Lote Salida *****
                await client.query(insertar_lote, [detalle.lote, cod_mov, detalle.cod_insumo, detalle.precio, detalle.precio_unidad, detalle.cantidad, detalle.existencia, cantidad_nueva, cod_detalle_insumo]); console.log("2.- PRIMER IF:: lote a agregar :: ",detalle);
            }
        //2do IF :: Si lote_lleno.existencia(31) >= cantidad_aux(1) :: Modificamos la existencia del lote a 0 y restamos cantidad_aux - existencia del lote lleno
            else if(lote_lleno.existencia >= cantidad_aux && cantidad_aux > 0){
              //PASO 1:: MODIFICAMOS LA EXISTENCIA DEL LOTE_LLENO 
                //restamos: lote_lleno.existencia(31) - cantidad_aux(1) = 30
                const nueva_cantidad=lote_lleno.existencia - cantidad_aux;  console.log("1.- SEGUNDO IF:: nueva_cantidad :: ",nueva_cantidad);
                //***** Modificamos el lote_lleno verificado a existencia= 30 ****
                await client.query(modificar_lote, [nueva_cantidad,lote_lleno.lote,lote_lleno.cod_mov]);
              //PASO 2:: AGREGAMOS EL NUEVO LOTE SALIDA CON LOS DATO CORRESPONDIENTES
                //agregamos : lote_lleno.precio_unidad(7,5) * lote_lleno.existencia(30) = 225bs
                detalle.precio=lote_lleno.precio_unidad*cantidad_aux; console.log("2.- SEGUNDO IF:: detalle_precio :: ",detalle.precio);
                //Agregamos la cantidad_aux a detalle.cantidad
                detalle.cantidad = cantidad_aux; console.log("2.- SEGUNDO IF:: cantidad_aux :: ", cantidad_aux);
                //Agregamos detalle.existencia = nueva_cantidad : por que es la catidad que quedo en lote_lleno
                detalle.existencia= nueva_cantidad;    console.log("2.- SEGUNDO IF:: detalle.existencia :: ",detalle.existencia);
                //Agregamos el lote_lleno.lote a detalle.lote, por que es el mismo lote que consume la salida
                detalle.lote=lote_lleno.lote;


                //Obtenemos la existencia actual del insumo
                console.log("2.- SEGUNDO IF:: existencia_insumo y cantidad_aux :: " + existencia_insumo + " : "+ cantidad_aux);  
                const cantidad_nueva = existencia_insumo - cantidad_aux;        console.log("2.- SEGUNDO IF:: Cantidad Nueva :: ",cantidad_nueva);  
                //Modificamos existencia del insumo Actual  
                existencia_insumo = cantidad_nueva; console.log("2.- SEGUNDO IF:: existencia_insumo  :: ",existencia_insumo);   
                //Elevamos el cod_detalle_insumo
                cod_detalle_insumo = cod_detalle_insumo+1; console.log("cod_detalle_insumo a elevar :: ",cod_detalle_insumo);
                console.log('2.- DETALLE ANTES DE INSERTAR LOTE:: ',detalle);
                //***** Agregamos el Lote Salida *****
                await client.query(insertar_lote, [detalle.lote, cod_mov, detalle.cod_insumo, detalle.precio, detalle.precio_unidad, detalle.cantidad, detalle.existencia, cantidad_nueva,cod_detalle_insumo]); 
                console.log("2.- SEGUNDO IF:: lote a agregar :: ",detalle);
                
                //Ponemos cantidad_aux=0 debido a que lote_lleno.existencia(31) >= cantidad_aux(1) 
                console.log("2.- SEGUNDO IF:: cantidad_aux :: ",cantidad_aux); cantidad_aux=0;
            }

        }
     //PRIMERO: Sumamos el precio que consume el lote salida para agregarlo a Movimiento_Insumo
     precio_total=precio_total+detalle.precio;  console.log("PRECIO:::::::  ",detalle.precio); console.log("PRECIO_TOTAL:::::::  ",precio_total);

     //MODIFICAMOS LA EXISTENCIA DE INSUMO
     // 1 < 3
     if (existencia_insumo < cantidad_total) {
        cantidad_total = existencia_insumo;
     }
     console.log("MODIFICAR EXISTENCIA INSUMO:: ", cantidad_total);
     await client.query(modificar_insumo, [cantidad_total,cod_insumo]);
     //Reiniciamos cantidad_total
     cantidad_total=0;
    }

     // CONSULTA
     console.log("AGREGAR PRECIO TOTAL:: ", precio_total);
     await client.query(modificar_movimiento, [precio_total,cod_mov]);
}

// :::::::::: POST SALIDA MOVIMIENTO - INSUMO 
const crear_Salida_de_Detalles = async (client, detalle_movimientos,cod_mov) => {
    console.log('***************************************** SALIDA DETALLES *****************************************');
    
    //Obtener Lotes que se relacionen con cod_insumo , existencia >0 y movimiento =1 (entrada)
    const obtener_lotes = ` SELECT d.*
                            FROM detalle_movimiento_insumo AS d
                            JOIN movimiento_insumo AS m ON d.cod_mov = m.cod_mov
                            WHERE d.cod_insumo = $1
                            AND m.movimiento = 1
                            AND m.cod_mov = (
                                SELECT MAX(m2.cod_mov)
                                FROM movimiento_insumo AS m2
                                JOIN detalle_movimiento_insumo AS d2 ON m2.cod_mov = d2.cod_mov
                                WHERE d2.cod_insumo = $1 AND m2.movimiento = 1
                            )
                            ORDER BY d.lote;`;
    //Modificar Lote Existencia
    const modificar_lote = ` Update detalle_movimiento_insumo set existencia=$1 where lote=$2 and cod_mov=$3; `;
    //Insertar Lote Salida
    const insertar_lote = ` INSERT INTO detalle_movimiento_insumo (lote, cod_mov, cod_insumo, precio, precio_unidad, cantidad, existencia, cantidad_nueva, cod_detalle_insumo)
                                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); `;
    const modificar_movimiento = ` Update movimiento_insumo set precio=$1 where cod_mov=$2; `;
    //Modificar Lote Existencia
    const modificar_insumo = ` Update insumo set existencia=existencia-$1 where cod_insumo=$2; `;

    //Obtenemos el ultimo cod_detalle_insumo
    const ultimo_cod_detalle=  await client.query(`  SELECT COALESCE((SELECT MAX(cod_detalle_insumo) FROM detalle_movimiento_insumo), 0) AS cod_detalle_insumo; `);
    //Guardamos el cod_detalle
    let cod_detalle_insumo = Number(ultimo_cod_detalle.rows[0].cod_detalle_insumo);
    console.log("Ultimo cod detalle:: ",cod_detalle_insumo);

    //Definimos las variables precio_total que agregaremos a precio de Movimiento_Insumo y cantidad_total que restaremos a cantidad de Insumo
    var precio_total=0; var cantidad_total=0;  
    
    //Recorremos todos los Detalles
    for(const detalle of detalle_movimientos){

        console.log('Detalle: ',detalle);
        
        //Lote de Salida
        const {lote, cod_insumo, precio, precio_unidad, cantidad, existencia,existencia_actual} = detalle; 
        //Obtenemos los lotes relacionados al Lote_salida y que sean >0 
        const lotes_llenos = await client.query(obtener_lotes, [cod_insumo]); 
        console.log('lotes_llenos: ',lotes_llenos.rows);
        
        //Variable bandera para verificar si se resto toda la cantidad del lote
        var cantidad_aux=Number(cantidad);  
        //Sumamos la cantidad de cada lote Salida para restarlo a existencia de Insumo
        cantidad_total=cantidad_total+Number(detalle.cantidad); console.log("CANTIDAD:::::::  ",detalle.cantidad); console.log("CANTIDAD_TOTAL:::::::  ",cantidad_total);

        //Existencia Actual del Insumo
        // let existencia_insumo=existencia_actual;
        let existencia_insumo = (await client.query('SELECT existencia FROM insumo WHERE cod_insumo = $1', [cod_insumo])).rows[0].existencia;
        console.log("Cantidad actual del insumo::: ",existencia_insumo );

    //::::: RECCORREMOS TODOS LOS LOTES LLENOS RELACIONADOS AL COD_INSUMO ::::::
        for(const lote_lleno of lotes_llenos.rows){ 

              //PASO 1:: MODIFICAMOS LA EXISTENCIA DEL LOTE_LLENO 
                //restamos: lote_lleno.existencia(31) - cantidad_aux(1) = 30
                const nueva_cantidad=lote_lleno.existencia - cantidad_aux;  console.log("1.- SEGUNDO IF:: nueva_cantidad :: ",nueva_cantidad);
                //***** Modificamos el lote_lleno verificado a existencia= 30 ****
                await client.query(modificar_lote, [nueva_cantidad,lote_lleno.lote,lote_lleno.cod_mov]);
              //PASO 2:: AGREGAMOS EL NUEVO LOTE SALIDA CON LOS DATO CORRESPONDIENTES
                //agregamos : lote_lleno.precio_unidad(7,5) * lote_lleno.existencia(30) = 225bs
                detalle.precio=lote_lleno.precio_unidad*cantidad_aux; console.log("2.- SEGUNDO IF:: detalle_precio :: ",detalle.precio);
                //Agregamos la cantidad_aux a detalle.cantidad
                detalle.cantidad = cantidad_aux; console.log("2.- SEGUNDO IF:: cantidad_aux :: ", cantidad_aux);
                //Agregamos detalle.existencia = nueva_cantidad : por que es la catidad que quedo en lote_lleno
                detalle.existencia= nueva_cantidad;    console.log("2.- SEGUNDO IF:: detalle.existencia :: ",detalle.existencia);
                //Agregamos el lote_lleno.lote a detalle.lote, por que es el mismo lote que consume la salida
                detalle.lote=lote_lleno.lote;


                //Obtenemos la existencia actual del insumo
                console.log("2.- SEGUNDO IF:: existencia_insumo y cantidad_aux :: " + existencia_insumo + " : "+ cantidad_aux);  
                const cantidad_nueva = existencia_insumo - cantidad_aux;        console.log("2.- SEGUNDO IF:: Cantidad Nueva :: ",cantidad_nueva);  
                //Modificamos existencia del insumo Actual  
                existencia_insumo = cantidad_nueva; console.log("2.- SEGUNDO IF:: existencia_insumo  :: ",existencia_insumo);   
                //Elevamos el cod_detalle_insumo
                cod_detalle_insumo = cod_detalle_insumo+1; console.log("cod_detalle_insumo a elevar :: ",cod_detalle_insumo);
                console.log('2.- DETALLE ANTES DE INSERTAR LOTE:: ',detalle);
                //***** Agregamos el Lote Salida *****
                await client.query(insertar_lote, [detalle.lote, cod_mov, detalle.cod_insumo, detalle.precio, detalle.precio_unidad, detalle.cantidad, detalle.existencia, cantidad_nueva,cod_detalle_insumo]); 
                console.log("2.- SEGUNDO IF:: lote a agregar :: ",detalle);
                
                //Ponemos cantidad_aux=0 debido a que lote_lleno.existencia(31) >= cantidad_aux(1) 
                console.log("2.- SEGUNDO IF:: cantidad_aux :: ",cantidad_aux); cantidad_aux=0;
            
        }
     //PRIMERO: Sumamos el precio que consume el lote salida para agregarlo a Movimiento_Insumo
     precio_total=precio_total+detalle.precio;  console.log("PRECIO:::::::  ",detalle.precio); console.log("PRECIO_TOTAL:::::::  ",precio_total);

     //MODIFICAMOS LA EXISTENCIA DE INSUMO
     // 1 < 3
    //  if (existencia_insumo < cantidad_total) {
    //     cantidad_total = existencia_insumo;
    //  }
     console.log("MODIFICAR EXISTENCIA INSUMO:: ", cantidad_total);
     await client.query(modificar_insumo, [cantidad_total,cod_insumo]);
     //Reiniciamos cantidad_total
     cantidad_total=0;
    }

     // CONSULTA
     console.log("AGREGAR PRECIO TOTAL:: ", precio_total);
     await client.query(modificar_movimiento, [precio_total,cod_mov]);
}

// :::::::::: POST ENTRADA DETALLE MOVIMIENTO - INSUMO 
const crear_Entrada_de_Detalles = async (client, detalle_movimiento_insumo,cod_mov) => {
    console.log("1.- CREAR ENTRADA DE DETALLES::::::::::::");
    const text_crear_detalles = ` INSERT INTO detalle_movimiento_insumo 
                                  (lote, cod_mov, cod_insumo, precio, precio_unidad, cantidad, existencia, cantidad_nueva,cod_detalle_insumo)
                                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); `;

    const text_existencia_insumo=`  select existencia from insumo where cod_insumo = $1; `;

    const text_entrada_insumo = `  UPDATE insumo SET existencia=existencia + $1 WHERE cod_insumo=$2; `;
    //Obtenemos el ultimo cod_detalle_insumo
    const ultimo_cod_detalle=  await client.query(`  SELECT COALESCE((SELECT MAX(cod_detalle_insumo) FROM detalle_movimiento_insumo), 0) AS cod_detalle_insumo; `);
    //Guardamos el cod_detalle
    let cod_detalle_insumo = Number(ultimo_cod_detalle.rows[0].cod_detalle_insumo);
    console.log("Ultimo cod detalle:: ",cod_detalle_insumo);

    //Recorremos todos los Detalles
    for(const detalle of detalle_movimiento_insumo){
        //Elevamos el cod_detalle_insumo
        cod_detalle_insumo = cod_detalle_insumo+1; console.log("cod_detalle_insumo a elevar :: ",cod_detalle_insumo);
        var {lote, cod_insumo, precio, precio_unidad, cantidad, existencia} = detalle;
        //Igualamos Existencia == Cantidad otra vez para confirmar
        existencia= cantidad;
        //Confirmamos el precio_unidad
        precio_unidad = precio/cantidad; console.log('precio_unidad :: ',precio_unidad);
        

        console.log("2.- Detalle Movimiento a agregar::::::::::::", detalle);
        let cantidad_nueva=0;
        //Modificamos la existencia de Insumo
        const existencia_insumo = await client.query(text_existencia_insumo, [cod_insumo]);
        
        cantidad_nueva = Number(existencia_insumo.rows[0].existencia) + cantidad;
        console.log(existencia_insumo.rows[0]); console.log(existencia_insumo.rows[0].existencia); 

        // Agregamos detalle
        await client.query(text_crear_detalles, [lote, cod_mov, cod_insumo, precio, precio_unidad, cantidad, existencia, cantidad_nueva,cod_detalle_insumo,]);
        //Modificamos la existencia de Insumo
        await client.query(text_entrada_insumo, [cantidad,cod_insumo]);
        
    }
}


// *************************************** MODIFICAR ULTIMO MOVIMIENTO *************************************
//***********************************************************************************************************
//1.- OBTENEMOS ULTIMOS MOVIMIENTOS Y DETALLES
const obtener_Ultimo_Movimiento_y_Detalles = async (req, res) => {
    const client = await pool.connect();
    const movimiento= req.body.movimiento;
    console.log('1.- Obtener Ultimos Insumo y Detalles:::::::');
    console.log(movimiento);
    var select_ultimoMovimiento;
    var select_ultimoDetalles;

    if (movimiento==1) {
        //CONSULA PARA OBTENER EL ULTIMO MOVIMIENTO SEGUN SU TIPO (ENTRADA, SALIDA O MERMA)
        select_ultimoMovimiento= `
                                    SELECT m.* FROM movimiento_insumo as m
                                    JOIN detalle_movimiento_insumo as d ON d.cod_mov = m.cod_mov
                                    where movimiento= 1 AND d.existencia=d.cantidad AND origen=0
                                    ORDER BY cod_mov DESC LIMIT 1;
                                    `;
        //CONSULTA PAR OBTENER LOS DETALLES SEGUN EL COD_MOV OBTENIDO DEL ULTIMO MOVIMIENTO
        select_ultimoDetalles= `
                                    SELECT d.*,i.existencia as existencia_actual, i.nombre,
                                        CASE 
                                        WHEN i.medida = 1 THEN 'Unid.'
                                        WHEN i.medida = 2 THEN 'Kg.'
                                        WHEN i.medida = 3 THEN 'mg.'
                                        WHEN i.medida = 4 THEN 'Lt.'
                                        WHEN i.medida = 3 THEN 'ml.'
                                        END AS nom_medida
                                    FROM detalle_movimiento_insumo AS d
									JOIN movimiento_insumo as m ON d.cod_mov = m.cod_mov
                                    JOIN insumo AS i ON d.cod_insumo = i.cod_insumo		
                                    where d.cod_mov = $1 AND d.existencia=d.cantidad
                                    ORDER BY cod_detalle_insumo ASC;
                                     `;
    }else{
        select_ultimoMovimiento= `
                                    SELECT m.* FROM movimiento_insumo as m
                                    JOIN detalle_movimiento_insumo as d ON d.cod_mov = m.cod_mov
                                    where movimiento > 1 AND origen=0
                                    ORDER BY cod_mov DESC LIMIT 1;
                                    `;
        select_ultimoDetalles= `
                                    SELECT d.*,i.existencia as existencia_actual, i.nombre,
                                        CASE 
                                        WHEN i.medida = 1 THEN 'Unid.'
                                        WHEN i.medida = 2 THEN 'Kg.'
                                        WHEN i.medida = 3 THEN 'mg.'
                                        WHEN i.medida = 4 THEN 'Lt.'
                                        WHEN i.medida = 3 THEN 'ml.'
                                        END AS nom_medida
                                    FROM detalle_movimiento_insumo AS d
                                    JOIN movimiento_insumo as m ON d.cod_mov = m.cod_mov
                                    JOIN insumo AS i ON d.cod_insumo = i.cod_insumo		
                                    where d.cod_mov = $1
                                    ORDER BY cod_detalle_insumo ASC;
                                     `;
    }

                          
    try {
        // Comienza la transacción
        await client.query('BEGIN');

        //CONSULTAMOS EL ULTIMO MOVIMIENTO
        const ultimo_movimiento= await client.query(select_ultimoMovimiento);
        //GUARDAMOS EL COD_MOV PARA CONSULTAR LOS DETALLES
        const cod_mov=ultimo_movimiento.rows[0].cod_mov;
        //CONSULTAMOS LOS DETALLES DEL ULTIMO MOVIMIENTOS SEGUN SU COD_MOV OBTENIDO
        const ultimos_detalles= await client.query(select_ultimoDetalles,[cod_mov]);
        //GUARDAMOS EN UNA VARIABLE
        const datos = [ultimo_movimiento.rows[0],ultimos_detalles.rows];
        //:: TERMINAL
        // console.log('2.- Datos obtenidos::::::'); console.log('Ultimo Movimiento: ',datos);

        // Confirma la transacción
        await client.query('COMMIT');
        res.status(200).json(datos);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener ultimos movimientos detalles' });
    }finally{
        client.release(); // Libera la conexión al pool
    }
}
//2.- PRINCIPAL:: MODIFICAR ULTIMO MOVIMIENTO
const modificar_Ultimo_Movimiento = async (req, res) => {
    const client = await pool.connect();
    console.log('----------------------------------------------------------------------------------');
    console.log('Movimiento Completo a Modificar :: ',req.body);
    console.log('----------------------------------------------------------------------------------');
    //Guardamos los datos a manipular
    const movimiento= req.body[0];           const detalles= req.body[1];
    const movimiento_Anterior= req.body[2];  const detalles_Anterior= req.body[3];
    const ultimo_lote= req.body[4];
    //CONSULTA PARA ACTUALIZAR MOVIMIENTO PRINCIPAL
    const actualizar_movimiento = ` UPDATE movimiento_insumo
                                    SET movimiento=$1, precio=$2, ps_precio=$3, tipo_cambio=$4, descripcion=$5, fecha=$6, hora=$7, ci_usuario=$8
                                    WHERE cod_mov = $9;
                                  `;

    try {
        //Comienza la transacción
        await client.query('BEGIN'); 

    //PRIMERO :::: ACTUALIZAMOS EL NUEVO MOVIMIENTO PRINCIPAL ANTES DE MODIFICAR TODOS LOS LOTES ::::
        console.log('ACTUALIZAMOS MOVIMIENTO');
        await client.query(actualizar_movimiento, [movimiento.movimiento,movimiento.precio,movimiento.ps_precio,movimiento.tipo_cambio,movimiento.descripcion,movimiento.fecha,movimiento.hora,movimiento.ci_usuario,
                                                movimiento.cod_mov])

    //SEGUNDO :::::  MODIFICAMOS EL INSUMO AFECTADO SEGUN EL MOVIMIENTO ANTERIOR DE LOS LOTES :::::
         await client.query('SELECT * FROM detalle_movimiento_insumo WHERE detalle_movimiento_insumo.lote = $1 FOR UPDATE;', [1])
         .then(res => console.log(res.rows));
        //---------- 1.- SI EL MOVIMINETO ANTERIOR ERA ENTRADA(1) ----------
        if (movimiento_Anterior.movimiento==1) {
            //Modificamos la Existencia Insumo y Eliminamos los lotes
            console.log('----------------------------------------------------------------------------------');
            console.log('MOFICAMOS ENTRADA');
            console.log('----------------------------------------------------------------------------------');
            await modificar_Entrada(client, detalles_Anterior);    
        }
        //---------- 2.- SI EL MOVIMINETO ANTERIOR ERA SALIDA O MERMA(>1) ----------
        else{
            console.log('----------------------------------------------------------------------------------');
            console.log('MOFICAMOS SALIDA');
            console.log('----------------------------------------------------------------------------------');
            await modificar_Salida(client, detalles_Anterior);    
        }

    //TERCERO :::: REGISTRAMOS LOS LOTES NUEVAMENTE (Usando las funciones de Nuevo Movimiento)::::
        //----------1.- SI EL NUEVO MOVIMIENTO ES ENTRADA(1) ----------
        if (movimiento.movimiento==1) {
            //Recorremos y verificamos los lotes si el movimiento era salida y ahora es entrada
            if (movimiento_Anterior.movimiento > 1) {
                for(const detalle of detalles){
                    ultimo_lote++;
                    detalle.lote=ultimo_lote;
                }
            }
            //Creamos el lote Nuevamente
            console.log('----------------------------------------------------------------------------------');
            console.log('CREAMOS LOS LOTES ENTRADA NUEVAMENTE');
            console.log('----------------------------------------------------------------------------------');
            await crear_Entrada_de_Detalles(client, detalles, movimiento.cod_mov);
        }
        //----------2.- SI EL NUEVO MOVIMIENTO ES SALDIDA O MERMA(>1) ----------
        else{
            //Creamos el lote Nuevamente
            console.log('----------------------------------------------------------------------------------');
            console.log('CREAMOS LOS LOTES SALIDA NUEVAMENTE'); 
            console.log('----------------------------------------------------------------------------------');
            await crear_Salida_de_Detalles(client, detalles,movimiento.cod_mov);
        }


        // Confirma la transacción
        await client.query('COMMIT');
        res.status(200).json('Movimiento modificado');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener ultimos movimientos detalles' });
    }finally{
        client.release(); // Libera la conexión al pool
    }

}

//2.1.- MODIFICAR LOTES QUE ERAN ENTRADA
const modificar_Entrada = async (client, lote_anterior) => {
    const modificar_insumo = `UPDATE insumo SET existencia = existencia - $1 WHERE cod_insumo = $2;`;
    const eliminar_lote = `DELETE FROM detalle_movimiento_insumo WHERE cod_detalle_insumo = $1;`;

    console.log('Lote Anterior: ', lote_anterior);
    // Recorrer todos los lotes anteriores
    for (const lote of lote_anterior) {

        console.log('Antes del UPDATE, existencia:');
        await client.query('SELECT * FROM insumo WHERE cod_insumo = $1', [lote.cod_insumo])
            .then(res => console.log(res.rows));
        console.log('----------------------------------------------------------------------------------');
        // Modificar la existencia de Insumo
        console.log('ACTUALIZAMOS INSUMO');
        console.log('lote.cantidad = ', lote.cantidad);
        console.log('lote.cod_insumo = ', lote.cod_insumo);


        await client.query(modificar_insumo, [lote.cantidad, lote.cod_insumo]);
        console.log('----------------------------------------------------------------------------------');
        console.log('Después del UPDATE, existencia:');
        await client.query('SELECT * FROM insumo WHERE cod_insumo = $1', [lote.cod_insumo])
            .then(res => console.log(res.rows));
        console.log('----------------------------------------------------------------------------------');
        // Eliminar el lote anterior
        console.log('ELIMINAMOS LOTE');
        await client.query(eliminar_lote, [lote.cod_detalle_insumo]);

        console.log('----------------------------------------------------------------------------------');
    }
};

//2.2.- MODIFICAR LOTES QUE ERAN SALIDA O MERMA
const modificar_Salida = async (client,lote_anterior) =>{
    const modificar_insumo= `UPDATE insumo SET existencia=existencia + $1 WHERE cod_insumo=$2;`;

    const modificar_LoteEntrada= `  UPDATE detalle_movimiento_insumo
                                    SET existencia = existencia + $1
                                    FROM movimiento_insumo
                                    WHERE detalle_movimiento_insumo.cod_mov = movimiento_insumo.cod_mov
                                    AND detalle_movimiento_insumo.lote = $2
                                    AND movimiento_insumo.movimiento = 1;
                                 `;
    const eliminar_lote= `Delete from detalle_movimiento_insumo WHERE cod_detalle_insumo=$1;`;

    console.log('Lote Anterior: ', lote_anterior);
    let existencia_actual=0;
    //RECORREMOS TODOS LOS LOTES ANTERIORES
    for(const lote of lote_anterior){
        console.log('Antes del UPDATE, existencia:');
        await client.query('SELECT * FROM detalle_movimiento_insumo WHERE detalle_movimiento_insumo.lote = $1 FOR UPDATE;', [lote.lote])
            .then(res => console.log(res.rows));

        console.log('----------------------------------------------------------------------------------');
        console.log('ACTUALIZAMOS INSUMO');
        console.log('lote.cantidad = ', lote.cantidad);
        console.log('lote.cod_insumo = ', lote.cod_insumo);
        //MODIFICAMOS LA EXISTENCIA DEL INSUMO: sumamos la cantidad usada por el Lote en la salida a la existencia del Insumo 

        console.log('ACTUALIZAMOS INSUMO');
        await client.query(modificar_insumo, [lote.cantidad,lote.cod_insumo]);

        //RESTAURAMOS LA EXISTENCIA DEL LOTE ENTRADA --------------------------------------------------
        console.log('ACTUALIZAMOS LOTE ENTRADA');
        await client.query(modificar_LoteEntrada, [lote.cantidad, lote.lote]);

        //ELIMINAMOS EL LOTE ANTERIOR -----------------------------------------------------------------
        console.log('ELIMINAMOS LOTE');
        await client.query(eliminar_lote, [lote.cod_detalle_insumo]); 
        console.log('----------------------------------------------------------------------------------');
    }
}

// *************************************** ELIMINAR ULTIMO MOVIMIENTO *************************************
//***********************************************************************************************************
//3.- ElIMINAMOS ULTIMO MOVIMIENTO Y DETALLES
const eliminar_Ultimo_Movimiento = async (req, res) => {
    const cod_mov = parseInt(req.params.cod_mov);
    console.log("cod_mov:::",cod_mov);
    //OBTENER MOVIMIENTO
    const obtener_movimiento = ` SELECT *FROM movimiento_insumo WHERE cod_mov = $1 `;
    //OBETENER LOTES DEL MOVIMIENTO
    const obtener_lotes = ` SELECT *FROM detalle_movimiento_insumo WHERE cod_mov = $1; `;
    //ELIMINAR MOVIMIENTO
    const eliminar_movimiento = ` DELETE FROM movimiento_insumo WHERE cod_mov = $1; `;

    const client = await pool.connect();
    await client.query('BEGIN'); // Comienza la transacción
    try {
        //1ro:: Obtenemos el movimiento
        const movimiento = await client.query(obtener_movimiento, [cod_mov]);    console.log("1ro:: OBTENEMOS EL MOVIMIENTO", movimiento.rows);
        //2do:: Verificamos si el movimeinto a eliminar es entrada o salida
        if (movimiento.rows[0].movimiento == 1) {
            await eliminar_Entrada(client, movimiento.rows[0]);
        }else{
            await eliminar_Salida(client, movimiento.rows[0]);
        }

        //3ro:: VERIFICAMOS SI EL MOVIMIENTO TIENE ALGUN LOTE EXISTENTE
        //OBTENEMOS LOS LOTES
        const lotes = await client.query(obtener_lotes,[cod_mov]); console.log("3ro:: lotes: ",lotes.rows);
        //Si la lista lotes no tiene elementos eliminamos el movimiento
        if(lotes.rows.length==0){ console.log("4to:: lotes.rows[0].length = ",lotes.rows.length);
            await client.query(eliminar_movimiento,[cod_mov]); console.log("4to:: Eliminamos el movimiento :: cod_mov =  ",cod_mov);
        }
  
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Movimiento Eliminado');   
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al crear insumo' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
//3.1.- ELIMINAR LOTES QUE ERAN ENTRADA
const eliminar_Entrada = async (client,movimiento) =>{
    //CONSULTA PARA ACTUALIZAR MOVIMIENTO PRINCIPAL
    const actualizar_movimiento = ` UPDATE movimiento_insumo  SET precio = precio - $1  WHERE cod_mov = $2; `; 
    //OBETENER LOTES DEL MOVIMIENTO
    const obtener_lotes = ` SELECT *FROM detalle_movimiento_insumo WHERE cod_mov = $1; `;
    //MODIFICAR INSUMO                                                                  
    const modificar_insumo= `UPDATE insumo SET existencia=existencia - $1 WHERE cod_insumo=$2;`;
    //OBETENER LOTES DEL MOVIMIENTO
    const eliminar_lote = ` DELETE FROM detalle_movimiento_insumo WHERE cod_detalle_insumo = $1; `;       
    //OBTENEMOS LOS LOTES
    const getlotes = await client.query(obtener_lotes,[movimiento.cod_mov])
    const lotes = getlotes.rows;   console.log("1.- GET LOTES :: ", lotes);   
    //Variable precio total de los lotes eliminados
    var precio_lotes = 0;
    //Recorremos los lotes del Movimineto
    for(const lote of lotes){
        //Verficamos si el lote no ha sido usado aun para restaurar el insumo
        if (lote.cantidad == lote.existencia) { console.log("2.- IF-ELSE :: lote.cantidad= ", lote.cantidad ," | lote.existencia= ", lote.existencia);
            //Sumamos el precio del lote
            precio_lotes = precio_lotes + lote.precio; 
            //Modificamos el insumo restando la cantidad o existencia del lote a la del insumo    
            await client.query(modificar_insumo,[lote.cantidad,lote.cod_insumo]);  console.log("3.- MODIFICAMOS INSUMO :: lote.cantidad= ",lote.cantidad, " | lote.cod_insumo= ",lote.cod_insumo);      
            //Eliminamos el lote
            await client.query(eliminar_lote,[lote.cod_detalle_insumo]); console.log("4.- ELIMINAMOS LOTE :: lote.cod_detalle_insumo= ", lote.cod_detalle_insumo);         
        }
    }
    //Modificamos el movimiento restando el precio total con su precio
    await client.query(actualizar_movimiento,[precio_lotes, movimiento.cod_mov]); console.log("5.- ATUALIZAR MOMIVIENTO:: precio_lotes = ", precio_lotes);
  
}
//3.2.- ELIMINAR LOTES QUE ERAN SALIDA
const eliminar_Salida = async (client,movimiento) =>{
    console.log("************************** ELIMINAR SALIDA **************************");
    
    //OBETENER LOTES DEL MOVIMIENTO
    const obtener_lotes = ` SELECT *FROM detalle_movimiento_insumo WHERE cod_mov = $1; `;
    //MODIFICAR INSUMO                                                                  
    const modificar_insumo= `UPDATE insumo SET existencia=existencia + $1 WHERE cod_insumo=$2;`;
    //OBETENER LOTES DEL MOVIMIENTO
    const eliminar_lote = ` DELETE FROM detalle_movimiento_insumo WHERE cod_detalle_insumo = $1; `; 
    //OBETENER LOTES DEL MOVIMIENTO
    const modificar_lotes = `   UPDATE detalle_movimiento_insumo
                                SET existencia = existencia + $1
                                FROM movimiento_insumo m
                                WHERE detalle_movimiento_insumo.lote = $2
                                AND detalle_movimiento_insumo.cod_mov = m.cod_mov
                                AND m.movimiento = 1; `; ///falta para recorrer el lote entrada 
    //OBTENEMOS LOS LOTES
    const getlotes = await client.query(obtener_lotes,[movimiento.cod_mov])
    const lotes = getlotes.rows;   console.log("1.- GET LOTES :: ", lotes);   

    //Recorremos los lotes del Movimineto
    for(const lote of lotes){
        // //Modificamos el insumo sumando la cantidad o existencia del lote a la del insumo
        // if (lote.existencia <= 0) {
        //     lote.cantidad = lote.cantidad + lote.existencia; console.log("lote.cantidad :: ", lote.cantidad);
        // }    
        await client.query(modificar_insumo,[lote.cantidad,lote.cod_insumo]);  console.log("3.- MODIFICAMOS INSUMO :: lote.cantidad= ",lote.cantidad, " | lote.cod_insumo= ",lote.cod_insumo);    
        //Eliminamos el lote
        await client.query(eliminar_lote,[lote.cod_detalle_insumo]); console.log("4.- ELIMINAMOS LOTE :: lote.cod_detalle_insumo= ", lote.cod_detalle_insumo);
        //Modificamos la existencia del lote que se uso
        await client.query(modificar_lotes,[lote.cantidad, lote.lote]);
    }
}

// ********************** GET REPORTE INSUMO - DETALLE - MOVIMIENTO - INSUMO **********************
//*************************************************************************************************
//OBTENEMOS TODOS LOS MOVIMIENTOS DE UN INSUMO CON FILTRO DE FECHAS Y EL INSUMO SELECCIONADO
const get_MovimientoInsumo_y_Detalle_Insumo = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        //Obtenemos las fechas y cod de 
        const datos= req.body; console.log("Fecha y cod::::: ",datos);
        //Obtenemos lista de los 'movimientos_insumos'
        var movimiento_insumo= await get_movimiento_insumo(client,datos);
        //Obtenemos lista de los 'detalle_movimiento_insumos'
        var detalle_movimientoinsumo= await get_detalle_movimiento_insumo(client,datos);
        console.log('movimiento_insumo: ',movimiento_insumo.rows);
        console.log('detalle_movimientoinsumo: ',detalle_movimientoinsumo.rows);

        // Agrupar detalles por fecha
        const detallesAgrupadosPorFecha = detalle_movimientoinsumo.rows.reduce((acc, detalle) => {
            const fecha = detalle.fecha;
            if (!acc[fecha]) {
                acc[fecha] = [];
            }
            acc[fecha].push(detalle);
            return acc;
        }, {});
        // Convertir el objeto en una lista de listas con fecha como encabezado
        const listaDetallesPorFecha = Object.entries(detallesAgrupadosPorFecha).map(([fecha, detalles]) => {
            return {
                fecha_comun: fecha,
                detalles: detalles
            };
        });
        // Convertir el objeto en una lista de listas de detalles

       console.log("lista por fechas::::::::::::: ",listaDetallesPorFecha);
       const todo_movimiento=[movimiento_insumo.rows,detalle_movimientoinsumo.rows,listaDetallesPorFecha]

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(todo_movimiento);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener movimiento insumos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
// :::::::::: GET MOVIMIENTO - INSUMO 
const get_movimiento_insumo = async (client,datos) =>{
    //Guardamos las fechas para buscar en la lista
    const fechaInicial = datos.fechaI;
    const fechaFinal = datos.fechaF;
    const cod_insumo= datos.cod_insumo;
    //Consulta para obtener lista movimiento_insumo segun fecha Inicio y fecha Final 
    const movimiento_insumo = ` SELECT m.*, 
                                            CASE 
                                                WHEN m.movimiento = 1 THEN 'Entrada'
                                                WHEN m.movimiento = 2 THEN 'Salida'
                                                WHEN m.movimiento = 3 THEN 'Merma'
                                            END AS nom_movimiento 
                                        FROM movimiento_insumo AS m
                                        JOIN detalle_movimiento_insumo AS d ON m.cod_mov = d.cod_mov
                                        WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                        AND d.cod_insumo = $3
                                        ORDER BY m.fecha DESC, m.hora DESC;  `;
    //Realizamos la consulta en sql
    console.log("1.- Get Movimiento Insumo");
    return await client.query(movimiento_insumo,[fechaInicial,fechaFinal,cod_insumo]);
}
// :::::::::: GET DETALLE MOVIMIENTO - INSUMO 
const get_detalle_movimiento_insumo = async (client,datos) =>{
    //Guardamos las fechas para buscar en la lista
    const fechaInicial = datos.fechaI;
    const fechaFinal = datos.fechaF;
    const cod_insumo= datos.cod_insumo;
    //Consulta para obtener lista detalle_movimiento_insumo segun fecha Inicio y fecha Final 
    const detalle_movimiento_insumo = ` SELECT d.*,m.hora as hora,m.tipo_cambio, m.fecha as fecha, m.descripcion as descripcion, m.movimiento as movimiento, m.ci_usuario as ci_usuario, 
                                                    CASE 
                                                        WHEN m.movimiento = 1 THEN 'Entrada'
                                                        WHEN m.movimiento = 2 THEN 'Salida'
                                                        WHEN m.movimiento = 3 THEN 'Merma'
                                                    END AS nom_movimiento
                                                FROM detalle_movimiento_insumo AS d
                                                JOIN movimiento_insumo AS m ON d.cod_mov = m.cod_mov
                                                WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                                AND d.cod_insumo=$3
                                                ORDER BY d.cod_detalle_insumo desc ;`;
    //Realizamos la consulta en sql                                        
    console.log("2.- Get Detlla Movimiento Insumo");
    //CONSULTA
    return await client.query(detalle_movimiento_insumo,[fechaInicial,fechaFinal,cod_insumo]);
}

// ********************** GET REPORTE TODO - DETALLE - MOVIMIENTO - INSUMO **********************
//*************************************************************************************************
//OBTENEMOS TODOS LOS MOVIMIENTOS EN GENERAL SOLO CON FILTRO DE FECHAS
const get_MovimientoInsumo_y_Detalle_Todo = async (req, res) => {
    const client = await pool.connect();
    console.log("TODO TRANQUI");
    try {
        await client.query('BEGIN'); // Comienza la transacción
        //Obtenemos las fechas y cod de 
        const datos= req.body; console.log("Fecha y cod::::: ",datos);
        //Obtenemos lista de los 'movimientos_insumos'
        var movimiento_insumo= await get_movimiento_insumo_Todo(client,datos);
        //Obtenemos lista de los 'detalle_movimiento_insumos'
        var detalle_movimientoinsumo= await get_detalle_movimiento_insumo_Todo(client,datos);
        // console.log('movimiento_insumo: ',movimiento_insumo.rows);
        // console.log('detalle_movimientoinsumo: ',detalle_movimientoinsumo.rows);
        // Unir los detalles con los movimientos
        const movimientosConDetalles = movimiento_insumo.rows.map(movimiento => {
            return {
                ...movimiento,
                detalle_movimiento_insumo: detalle_movimientoinsumo.rows.filter(detalle => detalle.cod_mov === movimiento.cod_mov)
            };
        });

        // Agrupar detalles por fecha
        const detallesAgrupadosPorFecha = detalle_movimientoinsumo.rows.reduce((acc, detalle) => {
            const fecha = detalle.fecha;
            if (!acc[fecha]) {
                acc[fecha] = [];
            }
            acc[fecha].push(detalle);
            return acc;
        }, {});
        // Convertir el objeto en una lista de listas con fecha como encabezado
        const listaDetallesPorFecha = Object.entries(detallesAgrupadosPorFecha).map(([fecha, detalles]) => {
            return {
                fecha_comun: fecha,
                detalles: detalles
            };
        });
        // Convertir el objeto en una lista de listas de detalles

       console.log("lista por fechas::::::::::::: ",listaDetallesPorFecha);
       const todo_movimiento=[movimiento_insumo.rows,detalle_movimientoinsumo.rows,listaDetallesPorFecha]

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(todo_movimiento);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener movimiento insumos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}
// :::::::::: GET MOVIMIENTO - INSUMO 
const get_movimiento_insumo_Todo = async (client,datos) =>{
    //Guardamos las fechas para buscar en la lista
    const fechaInicial = datos.fechaI;
    const fechaFinal = datos.fechaF;
    const movimiento= datos.movimiento;
    //Consulta para obtener lista movimiento_insumo segun fecha Inicio y fecha Final 
    const movimiento_insumo_todo = ` SELECT DISTINCT ON (m.cod_mov) m.*,  
                                            CASE 
                                                WHEN m.movimiento = 1 THEN 'Entrada'
                                                WHEN m.movimiento = 2 THEN 'Salida'
                                                WHEN m.movimiento = 3 THEN 'Merma'
                                            END AS nom_movimiento 
                                        FROM movimiento_insumo AS m
                                        JOIN detalle_movimiento_insumo AS d ON m.cod_mov = d.cod_mov
                                        WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                        ORDER BY m.cod_mov DESC, m.fecha DESC;  `;
    //Consulta para obtener lista movimiento_insumo segun fecha Inicio y fecha Final 
    const movimiento_insumo_seleccionado = ` SELECT DISTINCT ON (m.cod_mov) m.*,  
                                            CASE 
                                                WHEN m.movimiento = 1 THEN 'Entrada'
                                                WHEN m.movimiento = 2 THEN 'Salida'
                                                WHEN m.movimiento = 3 THEN 'Merma'
                                            END AS nom_movimiento 
                                        FROM movimiento_insumo AS m
                                        JOIN detalle_movimiento_insumo AS d ON m.cod_mov = d.cod_mov
                                        WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                        AND m.movimiento = $3
                                        ORDER BY m.cod_mov DESC, m.fecha DESC;  `;
    //Realizamos la consulta en sql
    console.log("1.- Get Movimiento Insumo");
    if (movimiento==0) {
        return await client.query(movimiento_insumo_todo,[fechaInicial,fechaFinal]);
    }else{
        return await client.query(movimiento_insumo_seleccionado,[fechaInicial,fechaFinal,movimiento]);
    }
}

// :::::::::: GET DETALLE MOVIMIENTO - INSUMO 
const get_detalle_movimiento_insumo_Todo = async (client,datos) =>{
    //Guardamos las fechas para buscar en la lista
    const fechaInicial = datos.fechaI;
    const fechaFinal = datos.fechaF;
    const movimiento= datos.movimiento;
    //Consulta para obtener lista detalle_movimiento_insumo segun fecha Inicio y fecha Final 
    const detalle_movimiento_insum_todo = ` SELECT d.*, i.nombre as nom_insumo, m.tipo_cambio, m.hora as hora, m.fecha as fecha, m.descripcion as descripcion, m.movimiento as movimiento, m.ci_usuario as ci_usuario, 
                                                    CASE 
                                                        WHEN m.movimiento = 1 THEN 'Entrada'
                                                        WHEN m.movimiento = 2 THEN 'Salida'
                                                        WHEN m.movimiento = 3 THEN 'Merma'
                                                    END AS nom_movimiento
                                                FROM detalle_movimiento_insumo AS d
                                                JOIN movimiento_insumo AS m ON d.cod_mov = m.cod_mov
                                                JOIN insumo AS i ON i.cod_insumo = d.cod_insumo
                                                WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                                ORDER BY d.cod_detalle_insumo desc ; `;
    const detalle_movimiento_insumo_seleccionado = ` SELECT d.*, i.nombre as nom_insumo, m.tipo_cambio, m.hora as hora, m.fecha as fecha, m.descripcion as descripcion, m.movimiento as movimiento, m.ci_usuario as ci_usuario, 
                                                    CASE 
                                                        WHEN m.movimiento = 1 THEN 'Entrada'
                                                        WHEN m.movimiento = 2 THEN 'Salida'
                                                        WHEN m.movimiento = 3 THEN 'Merma'
                                                    END AS nom_movimiento
                                                FROM detalle_movimiento_insumo AS d
                                                JOIN movimiento_insumo AS m ON d.cod_mov = m.cod_mov
                                                JOIN insumo AS i ON i.cod_insumo = d.cod_insumo
                                                WHERE TO_DATE(m.fecha, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'DD/MM/YYYY') AND TO_DATE($2, 'DD/MM/YYYY')
                                                AND m.movimiento = $3
                                                ORDER BY d.cod_detalle_insumo desc ; `;                                                
    //Realizamos la consulta en sql                                        
    console.log("2.- Get Detlla Movimiento Insumo");
    //CONSULTA
    if (movimiento==0) {
        return await client.query(detalle_movimiento_insum_todo,[fechaInicial,fechaFinal]);
    }else{
        return await client.query(detalle_movimiento_insumo_seleccionado,[fechaInicial,fechaFinal,movimiento]);
    }
    
}



// ********************** GET UlTIMOS COD::: **********************
//*************************************************************************************************
// :::::::::: OBTENER ULTIMO LOTE Y COD_MOV 
const get_ultimos_Cod_Detalle_y_Movimiento = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Comienza la transacción
        const text_lote = ` SELECT COALESCE((SELECT MAX(lote) 
                            FROM detalle_movimiento_insumo), 0) AS lote;
                            `;
        const text_cod_mov = ` SELECT COALESCE((SELECT MAX(cod_mov) 
                               FROM movimiento_insumo), 0) AS cod_mov;
                                `;

        // Ejecutar consultas
        const lote = await client.query(text_lote);      
        const cod_mov = await client.query(text_cod_mov);  

        
        //console.log('codmovstock:::',cod_movstock.rows[0]);

        const ultimos_cod = [lote.rows[0],cod_mov.rows[0]]
        //console.log(ultimos_cod); // Obtenemos solo los datos necesarios

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(ultimos_cod);
    } catch (error) {
        console.log('Error: ',error);
        await client.query('ROLLBACK'); // Revierte la transacción en caso de error
        res.status(500).json({ error: 'Error al obtener ultimos codigos' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
}


module.exports = {
    crear_Todo_Detalle_Movimiento_Insumo,
    //Exportamos para Ventas
    crear_Movimiento_Insumo,
    crear_Salida_de_Detalles,
    crear_Entrada_de_Detalles,
    //
    modificar_Salida,
    eliminar_Salida,
    obtener_Ultimo_Movimiento_y_Detalles,
    modificar_Ultimo_Movimiento,
    eliminar_Ultimo_Movimiento,
    get_MovimientoInsumo_y_Detalle_Insumo,
    get_ultimos_Cod_Detalle_y_Movimiento,
    get_MovimientoInsumo_y_Detalle_Todo
}