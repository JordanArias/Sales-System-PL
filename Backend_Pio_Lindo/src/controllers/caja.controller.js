const pool = require('../database');



// *************************************** GET CAJA ****************************************
//***********************************************************************************************************************
const get_Caja = async (req, res) => {
    const client = await pool.connect();
    // OBTENEMOS LAS FECHAS DESDE LA QUERY STRING
    var fecha_inicio = req.query.fecha_inicio || '';
    var fecha_final = req.query.fecha_final || '';
    console.log('FECHA QUERY::',fecha_inicio);
    console.log('FECHA QUERY::',fecha_final);

    try {
        await client.query('BEGIN'); // Comienza la transacción

        //OBTENER ULTIMA CAJA
        const ultima_caja_Get = `SELECT c.cod_caja, c.estado, c.fecha_i,c.hora_i,c.fecha_c,c.hora_c FROM caja c WHERE c.cod_caja = (SELECT MAX(cod_caja) FROM caja);`
        const caja_Get = `
                        SELECT *FROM caja 
                            WHERE 
                                (TO_DATE(fecha_i, 'DD/MM/YYYY') >= TO_DATE($1, 'DD/MM/YYYY') 
                                AND TO_DATE(fecha_i, 'DD/MM/YYYY') <= TO_DATE($2, 'DD/MM/YYYY'))
                            OR 
                                (fecha_c != '' 
                                AND TO_DATE(fecha_c, 'DD/MM/YYYY') >= TO_DATE($1, 'DD/MM/YYYY') 
                                AND TO_DATE(fecha_c, 'DD/MM/YYYY') <= TO_DATE($2, 'DD/MM/YYYY'))
                                ORDER BY cod_caja DESC;
                            `;

        //SI LAS FECHAS ESTAN VACIAS, OBTENEMOS ULTIMA CAJA PARA OBTENER SUS FECHAS
        if (fecha_inicio == '') {
            //OBTENEMOS ULTIMA CAJA
            const ultima_caja = await client.query(ultima_caja_Get);
            //GUARDAMOS LAS FECHAS DE LA ULTIMA CAJA   
            const fechas = obtenerFechas(ultima_caja.rows[0].fecha_i);
            fecha_inicio = fechas.fecha_inicio;
            fecha_final = fechas.fecha_final;
        }

        console.log('FECHA INICIO: ',fecha_inicio); console.log('FECHA FINAL: ',fecha_final);
        
        //OBTENEMOS LA LISTA DE CAJAS SEGUN FECHAS
        const lista_caja = await client.query(caja_Get,[fecha_inicio, fecha_final]);

        console.log('LISTA CAJA:::::: ',lista_caja.rows); 

        await client.query('COMMIT'); // Confirma la transacción         
        res.status(200).json(lista_caja.rows);
    
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

//*********** FUNCION PARA OBTENER LA FECHA FINAL EN BASE A LA FECHA INICIO **************
function obtenerFechas(fecha) {
    const partes = fecha.split('/');
    const mes = parseInt(partes[1], 10) - 1; // Los meses en `Date` van de 0 (enero) a 11 (diciembre)
    const año = parseInt(partes[2], 10);
  
    // Obtener la fecha de inicio (primer día del mes)
    const fechaInicio = new Date(año, mes, 1);
    const fechaInicioStr = `${String(fechaInicio.getDate()).padStart(2, '0')}/${String(fechaInicio.getMonth() + 1).padStart(2, '0')}/${fechaInicio.getFullYear()}`;
  
    // Obtener la fecha final (primer día del mes siguiente)
    const fechaFinal = new Date(año, mes + 1, 1);
    const fechaFinalStr = `${String(fechaFinal.getDate()).padStart(2, '0')}/${String(fechaFinal.getMonth() + 1).padStart(2, '0')}/${fechaFinal.getFullYear()}`;
  
    return { fecha_inicio: fechaInicioStr, fecha_final: fechaFinalStr };
}
  
// *********************************************** CREAR NUEVA CAJA ***************************************************
//**********************************************************************************************************************
const crear_Caja = async (req, res) =>{
    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');

        const crearCaja_Post = `INSERT INTO public.caja(
	                            fecha_i, hora_i, fecha_c, hora_c, tipo_cambio, 
                                bs_saldoi, ps_saldoi, 
                                bs_egreso, ps_egreso, 
                                bs_ingreso, ps_ingreso, banca_ingreso, 
                                bs_saldo_pre, ps_saldo_pre, 
                                bs_insumo, 
                                bs_bruto, 
                                bs_saldo_final, 
                                bs_descuento,
                                bs_iva, 
                                estado, ci_usuario_i)
                                VALUES ($1, $2, '', '',$3, $4, $5, 0, 0, 0, 0, 0, $4, $5, 0, 0, 0, 0, 0, 0, $6);`;
       
        //GUARDAMOS LOS DATOS DE CAJA A AGREGAR
        const {fecha_i, hora_i, tipo_cambio, bs_saldoi, ps_saldoi, ci_usuario_i} = req.body;
        // let bs_saldo_final= bs_saldoi +  Math.floor((ps_saldoi || 0) * tipo_cambio * 100) / 100;
        //CONSULTA
        await client.query(crearCaja_Post, [fecha_i, hora_i, tipo_cambio, bs_saldoi || 0, ps_saldoi || 0, ci_usuario_i]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Caja Creada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}
  
// *********************************************** CREAR AJUSTE CAJA ***************************************************
//**********************************************************************************************************************
const crear_ajuste = async (req, res) =>{
    const client = await pool.connect();
    console.log('************** CREAMOS AJUSTE **************');
    
    try {     
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        //OBTENER LA CAJA AJUSTADA
        const caja_Get = `SELECT *FROM caja WHERE cod_caja = $1;`;
        //CREAR AJUSTE
        const crearAjuste_Post = `  INSERT INTO caja_ajuste(fecha, hora, bs_saldo_pre, ps_saldo_pre, bs_ajuste, ps_ajuste, bs_saldo, ps_saldo, tipo, descripcion, ci_usuario, cod_caja)
                                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12); `;
                                      
        //GUARDAMOS LOS DATOS DE CAJA A AGREGAR
        const {fecha, hora, bs_saldo_pre, ps_saldo_pre, bs_ajuste, ps_ajuste, tipo, descripcion, ci_usuario, cod_caja} = req.body;
        console.log('AJUSTE: ',req.body);
        
        //OBTENEMOS LA CAJA AJUSTADA 
        const caja_ajustada =  await pool.query(caja_Get, [cod_caja]);
        const caja = caja_ajustada.rows[0];

        //MODIFICAMOS LA CAJA AJUSTADA
        await ajustar_caja(client, req.body, caja);
        
        //VERIFICAMOS EL TIPO DE AJUSTE ENTRADA O SALIDA
        let bs_saldo = 0; let ps_saldo = 0;
        if (tipo == 1) {
            bs_saldo = caja.bs_saldo_pre + bs_ajuste;
            ps_saldo = caja.ps_saldo_pre + ps_ajuste;
        }else{
            bs_saldo = caja.bs_saldo_pre - bs_ajuste;
            ps_saldo = caja.ps_saldo_pre - ps_ajuste;  
        }
        //AGREGAMOS LA CAJA_AJUSTE
        await client.query(crearAjuste_Post, [fecha, hora, caja.bs_saldo_pre, caja.ps_saldo_pre, bs_ajuste, ps_ajuste, bs_saldo, ps_saldo, tipo, descripcion, ci_usuario, cod_caja]);

        //CONSULTA
        // await pool.query(crearCaja_Post, [fecha_i, hora_i, bs_saldoi, ps_saldoi, ci_usuario]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Caja Creada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    } 
    console.log('************** FIN CREAMOS AJUSTE **************');
}

//*********** FUNCION PARA ACTUALIZAR CAJA RESPECTO AL AJUSTE **************
const ajustar_caja = async (client, ajuste, caja) => {
    console.log('-------- AJUSTAR CAJA -----------');
    
    const modificar_caja_sumar = `UPDATE caja SET 
                                    bs_saldo_pre = bs_saldo_pre + $1, ps_saldo_pre = ps_saldo_pre + $2
                                  WHERE cod_caja= $3;`;

    const modificar_caja_restar = `UPDATE caja SET 
                                    bs_saldo_pre=bs_saldo_pre-$1, ps_saldo_pre=ps_saldo_pre-$2
                                  WHERE cod_caja= $3;`;

    console.log('AJUSTAR CAJA:: ',ajuste);
                                  
    let bs_saldo = ajuste.bs_ajuste; let ps_saldo = ajuste.ps_ajuste;
    //SALIDA, SI EL AJUSTO ES ENTRADA ENTONCES...
    if (ajuste.tipo == 1) {
        let bs_saldo_final= bs_saldo +  Math.floor(ps_saldo * caja.tipo_cambio * 100) / 100;
        await client.query(modificar_caja_sumar, [bs_saldo, ps_saldo, ajuste.cod_caja]);
    }
    //ENTRADA, SI EL AJUSTE ES SALIDA ENTONCES...
    else{
        let bs_saldo_final= bs_saldo +  Math.floor(ps_saldo * caja.tipo_cambio * 100) / 100;
        await client.query(modificar_caja_restar, [bs_saldo, ps_saldo, ajuste.cod_caja]);
    }

    console.log('-------- FIN AJUSTAR CAJA -----------');
}

// *************************************************** CERRAR CAJA *****************************************************
//**********************************************************************************************************************
const cerrar_caja = async (req, res) =>{
    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        const {cod_caja, fecha_c, hora_c, ci_usuario_c} = req.body;  console.log(req.body);
        
        const cerrarCaja_Put = `UPDATE caja SET estado = 1, fecha_c = $1, hora_c = $2, ci_usuario_c = $3 WHERE cod_caja = $4`;
        
        //CONSULTA
        await client.query(cerrarCaja_Put, [fecha_c, hora_c, ci_usuario_c,cod_caja]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Caja Cerrada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}


const obtener_ajustes = async (req, res) =>{
    var cod_caja = req.query.cod_caja ;
    console.log('COD_CAJA::',cod_caja);

    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        
        const obtenerAjustes = `SELECT *FROM caja_ajuste WHERE cod_caja = $1`;
        
        //CONSULTA
        const ajsutes = await client.query(obtenerAjustes, [cod_caja]);
        
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(ajsutes.rows);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}


// *************************************** GET CAJA ****************************************
//***********************************************************************************************************************
const get_Last_Caja = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Comienza la transacción

        // Consulta para obtener la última caja (según el código mayor)
        const ultima_caja_Get = `
            SELECT c.cod_caja, c.estado, c.fecha_i, c.hora_i, c.fecha_c, c.hora_c ,c.estado, c.tipo_cambio
            FROM caja c 
            ORDER BY c.cod_caja DESC 
            LIMIT 1;
        `;

        // Ejecutamos la consulta
        const ultima_caja = await client.query(ultima_caja_Get);

        await client.query('COMMIT'); // Confirmamos la transacción

        // Retornamos el resultado
        res.status(200).json(ultima_caja.rows[0]);

    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK'); // Realizamos rollback en caso de error
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release(); // Liberamos la conexión al pool
    }
};


module.exports = {
    get_Caja,
    crear_Caja,
    crear_ajuste,
    cerrar_caja,
    obtener_ajustes,
    get_Last_Caja
}