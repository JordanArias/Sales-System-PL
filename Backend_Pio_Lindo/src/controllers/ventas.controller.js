const pool = require('../database')
// Importa las funciones del controlador de insumo
const {crear_Movimiento_Insumo, crear_Salida_de_Detalles, modificar_Salida, eliminar_Salida} = require('./movimiento_insumo.controller');
const {crear_ajuste} = require('./caja.controller');
//***************************************************************************************************************************
// ************************************************** CREAR NUEVA VENTA *****************************************************
//***************************************************************************************************************************
const CREAR_VENTA = async (req, res) =>{
    const client = await pool.connect();
    const venta = req.body.venta; 
    const detalles = req.body.detalles;
    console.log('************** INICIAMOS CREAR VENTA **************'); 
    console.log('------------------------------------------------------'); 
    console.log('Venta a Agregar: ',venta);
    console.log('------------------------------------------------------');
    // console.log('Detalles: ', JSON.stringify(detalles, null, 2));
    console.log('------------------------------------------------------');
    
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        // Consulta para obtener el último ticket del día según la fecha proporcionada
        const obtenerUltimoTicket = `
                                        SELECT ticket 
                                        FROM public.venta 
                                        WHERE TO_DATE(fecha, 'DD/MM/YYYY') = TO_DATE($1, 'DD/MM/YYYY')
                                        AND ticket IS NOT NULL
                                        ORDER BY ticket DESC 
                                        LIMIT 1;
                                     `;
        // CONSULTA PARA CREAR VENTA
        const crearVenta_Post = `
        INSERT INTO public.venta(
                                cod_caja, ticket, mesa, hora, descripcion, estado, ci_usuario, cod_cliente,
                                bs_total, bs_pagado, bs_cambio, ps_total, ps_pagado, ps_cambio, 
                                estado_documento, venta_llevar, bs_descuento, bs_banca_pagado, ps_descuento, fecha, estado_transaccion)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                                RETURNING cod_venta;
        `;

        //:::: PRIMERO :::: OBTENEMOSEL ULTIMO TICKET DEL DIA
        console.log(":::: PRIMERO :::: OBTENEMOSEL ULTIMO TICKET DEL DIA");  
        const resultado = await pool.query(obtenerUltimoTicket, [venta.fecha]);      
        // Si no existe ningún ticket, el valor será 1, de lo contrario será el último ticket + 1
        const ultimoTicket = resultado.rows.length === 0 ? 0 : resultado.rows[0].ticket || 0; // Si `ticket` es null, usar 0
        const nuevoTicket = ultimoTicket + 1;     
        console.log('ultimoTicket: ', ultimoTicket);  console.log('nuevoTicket: ', nuevoTicket);
        // Agregar el nuevo ticket al objeto de venta
        venta.ticket = nuevoTicket;
        console.log('TICKET: ', venta.ticket);

       
        //:::: SEGUNDO :::: GUARDAMOS LOS DATOS DE VENTA Y LA AGREGAMOS
        console.log(":::: SEGUNDO :::: GUARDAMOS LOS DATOS DE VENTA A AGREGAR"); 
        const {cod_caja, ticket, mesa, hora, descripcion, estado, ci_usuario, cod_cliente,
               bs_total, bs_pagado, bs_cambio, ps_total, ps_pagado, ps_cambio, 
               estado_documento, venta_llevar, bs_descuento, bs_banca_pagado, ps_descuento, fecha, estado_transaccion} = venta;   
        //CONSULTA CREAR VENTA
        const result = await client.query(crearVenta_Post, [cod_caja, ticket, mesa, hora, descripcion, estado, ci_usuario, cod_cliente,
                                            bs_total, bs_pagado, bs_cambio, ps_total, ps_pagado, ps_cambio, 
                                            estado_documento, venta_llevar, bs_descuento, bs_banca_pagado, ps_descuento, fecha, estado_transaccion]);
        //OBTENEMOS COD_VENTA OBTENIDO
        const cod_venta = result.rows[0].cod_venta;
        console.log('COD_VENTA OBTENIDO: ', cod_venta);
        
        //:::: TERCERO :::: LUEGO CREAMOS DETALLES DE LA VENTA
        console.log(":::: TERCERO :::: LUEGO CREAMOS DETALLES DE LA VENTA");
        await crear_Detalles_venta(client, cod_venta, detalles);

        //:::: CUARTO :::: SI LA VENTA SE PAGO ENTONCES
        console.log(":::: CUARTO :::: SI LA VENTA SE PAGO ENTONCES");
        //SI VENTA ES PAGADA
        if (venta.estado_transaccion == 2) {
            const listaInsumos = await obtenerInsumosVenta(client, detalles);    console.log('Lista Insumos Obtenidos: ',listaInsumos);
            await agregar_MovimimientoInsumo(client, listaInsumos, venta, cod_venta);
            await agregar_MontosCaja(client, venta, cod_venta);
        }

        const data = {cod_venta: cod_venta, ticket: nuevoTicket};
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
    console.log('************** TERMINAMOS CREAR VENTA **************'); 
}

// ******************************** 1.- CREAR DETALLES VENTA **********************************
//*********************************************************************************************
const crear_Detalles_venta = async (client, cod_venta, detalles) => {
    const text_crear_detalles = `
        INSERT INTO public.detalle_venta(
            cod_venta, cantidad_item, cod_producto, item_llevar)
        VALUES ($1, $2, $3, $4)
        RETURNING cod_item;
    `;
    
    const text_crear_detalle_opcion = `
        INSERT INTO public.detalle_opcion(
            cod_item, cod_opcion, cantidad_op)
        VALUES ($1, $2, $3);
    `;

    // Recorremos todos los detalles
    for (let detalle of detalles) {
        const { cantidad_item, cod_producto, item_llevar, complementos } = detalle;
        
        // Agregamos el detalle de la venta
        const result = await client.query(text_crear_detalles, [cod_venta, cantidad_item, cod_producto, item_llevar]);
        let cod_item = result.rows[0].cod_item;
        
        // Ahora recorremos los complementos y sus opciones
        for (let complemento of complementos) {
            const opciones = complemento?.opciones; // Usamos el operador opcional
            
            if (opciones) {
                for (let opcion of opciones) {
                    const { cod_opcion, cantidad_op } = opcion;
                    // Agregamos las opciones si estas tienen cantidad > 0
                    if (cantidad_op > 0) {
                        await client.query(text_crear_detalle_opcion, [cod_item, cod_opcion, cantidad_op]);
                    }
                }
            }
        }
    }
}

// ***************************** 2.- OBTENER INSUMOS CONSUMIDOS *******************************
//*********************************************************************************************
async function obtenerInsumosVenta(client, detalles) {
    console.log('----------- OBTENEMOS INSUMOS_VENTA -----------');
    
    const lista_insumos_venta = [];
    const insumos_map = new Map(); // Usamos un Map para almacenar los insumos y sus cantidades

    for (const detalle of detalles) {
        const cod_producto = detalle.cod_producto;
        const cantidad_item = detalle.cantidad_item; // Se obtiene la cantidad del item

        // Solo procesar si cantidad_item es mayor que 0
        if (cantidad_item > 0) {
            // Obtener insumos relacionados con el producto
            const resProducto = await client.query(`
                SELECT cod_insumo, cantidad
                FROM public.insumo_producto
                WHERE cod_producto = $1
            `, [cod_producto]);

            resProducto.rows.forEach(insumo => {
                const cod_insumo = insumo.cod_insumo;
                const cantidad = insumo.cantidad * cantidad_item; // Multiplicación por cantidad_item

                // Solo agregar si la cantidad es mayor que 0
                if (cantidad > 0) {
                    if (insumos_map.has(cod_insumo)) {
                        insumos_map.set(cod_insumo, insumos_map.get(cod_insumo) + cantidad);
                    } else {
                        insumos_map.set(cod_insumo, cantidad);
                    }
                }
            });

            // Obtener insumos relacionados con las opciones
            for (const complemento of detalle.complementos) {
                for (const opcion of complemento.opciones) {
                    const cod_opcion = opcion.cod_opcion;
                    const cantidad_op = opcion.cantidad_op; // Se obtiene la cantidad de la opción

                    // Solo procesar si cantidad_op es mayor que 0
                    if (cantidad_op > 0) {
                        const resOpcion = await client.query(`
                            SELECT cod_insumo, cantidad
                            FROM public.insumo_opcion
                            WHERE cod_opcion = $1
                        `, [cod_opcion]);

                        resOpcion.rows.forEach(insumo => {
                            const cod_insumo = insumo.cod_insumo;
                            const cantidad = insumo.cantidad * cantidad_op; // Multiplicación por cantidad_op

                            // Solo agregar si la cantidad es mayor que 0
                            if (cantidad > 0) {
                                if (insumos_map.has(cod_insumo)) {
                                    insumos_map.set(cod_insumo, insumos_map.get(cod_insumo) + cantidad);
                                } else {
                                    insumos_map.set(cod_insumo, cantidad);
                                }
                            }
                        });
                    }
                }
            }
        }
    }

    // Convertir el Map a un array de objetos
    insumos_map.forEach((cantidad, cod_insumo) => {
        lista_insumos_venta.push({ cod_insumo, cantidad });
    });

    console.log('----------- FIN OBTENEMOS INSUMOS_VENTA -----------');
    return lista_insumos_venta;
}

// ************************ 3.- MANDAMOS A AGREGAR INSUMO MOVIMIENTOS *************************
//*********************************************************************************************
async function agregar_MovimimientoInsumo(client, listaInsumos, venta, cod_venta) {
    console.log('------------ AGREGAMOS MOVIMIENTO_INSUMO ------------');
    
    //:::: PASO 1 :::: OBTENEMOS EL ULTIMO COD_MOV
    console.log(':::: PASO 1 :::: OBTENEMOS EL ULTIMO COD_MOV');
    const res = await client.query(`SELECT cod_mov FROM public.movimiento_insumo ORDER BY cod_mov DESC LIMIT 1 `);
    const cod_movimiento = res.rows.length > 0 ? res.rows[0].cod_mov : null; // Retorna el último cod_mov o null si no hay registros
    console.log('cod_movimiento. ',cod_movimiento);

    //:::: PASO 2 :::: AGREGAMOS DATOS AL MOVIMIENTO
    console.log(':::: PASO 2 :::: AGREGAMOS DATOS AL MOVIMIENTO');
    const movimiento = {cod_mov:cod_movimiento+1, movimiento:2, precio:0, ps_precio:0, tipo_cambio:null, descripcion:`Venta Regular (${cod_venta})`, cod_doc:null, fecha:venta.fecha, hora:venta.hora, cod_proveedor:null, ci_usuario:venta.ci_usuario, estado:0, origen:1, cod_venta:cod_venta};
    console.log('Movimiento a agregar: ',movimiento);

    //:::: PASO 3 :::: ENVIAMOS A AGREGAR EL MOVIMIENTO
    console.log(':::: PASO 3 :::: ENVIAMOS A AGREGAR EL MOVIMIENTO');
    await crear_Movimiento_Insumo(client, movimiento);

    //:::: PASO 4 :::: ENVIAMSO A AGREGAR LOS DETALLES-INSUMOS
    console.log(':::: PASO 4 :::: ENVIAMSO A AGREGAR LOS DETALLES-INSUMOS');
    await crear_Salida_de_Detalles(client, listaInsumos, cod_movimiento+1);

    console.log('------------ FIN AGREGAMOS MOVIMIENTO_INSUMO ------------');
}
// ************************** 4.- MANDAMOS A AGREGAR MONTOS DE CAJA ***************************
//*********************************************************************************************
async function agregar_MontosCaja(client, venta, cod_venta) {
    console.log('------------ AGREGAR MONTOS_CAJA ------------');
    
    //:::: PASO 1 :::: RECUPERAMOS EL MOVIMIENTO SALIDA SEGUN COD_VENTA
    console.log(":::: PASO 1 :::: RECUPERAMOS EL ULTIMO MOVIMIENTO SALIDA");  
    const resm = await client.query(`SELECT * FROM public.movimiento_insumo WHERE cod_venta = $1 `,[cod_venta]);
    const movimiento = resm.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Movimiento: ',movimiento);

    //:::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA
    console.log(":::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA"); 
    //SEGUNDO:: RECUPERAMOS LA CAJA APERTURADA
    const resc = await client.query(`SELECT * FROM public.caja WHERE cod_caja = $1 `,[venta.cod_caja]);
    const caja = resc.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Caja: ',caja);

    console.log('------------------------------------------------------'); 
    //:::: PASO 3 :::: VERIFICAMOS SI NO HAY SALDO PARA AJUSTAR LA CAJA  
    console.log(":::: PASO 3 :::: VERIFICAMOS SI NO HAY SALDO PARA AJUSTAR LA CAJA  "); 
    //DEFINIMOS res
    let mockRes = {
        status: (code) => ({
            json: (data) => console.log(`Status: ${code}, Data: ${JSON.stringify(data)}`)
        })
    };
    //TERCERO VERIFICAMOS SI NO HAY SALDO PARA AJUSTAR LA CAJA                          
    if (venta.bs_cambio>0 && caja.bs_saldo_pre < venta.bs_cambio) {
        console.log('Ajuste por falta de Cambio en BOLIVIANOS');
        const bodyData = {
            fecha: venta.fecha,
            hora: venta.hora, 
            bs_saldo_pre: caja.bs_saldo_pre,
            ps_saldo_pre: caja.ps_saldo_pre,
            bs_ajuste: venta.bs_cambio, 
            ps_ajuste: 0, 
            tipo: 1,
            descripcion: 'Ajuste de caja por falta de cambio para completar la venta',
            ci_usuario: venta.ci_usuario,
            cod_caja: caja.cod_caja
        };
        // Aquí llamas a la función `crear_ajuste` y le pasas el objeto `bodyData` como si fuera `req.body`
        await crear_ajuste({ body: bodyData }, mockRes); // Aquí `res` es el mismo que usas en el controlador de ventas o puedes definir otro mock si es necesario.
    }
    if (venta.ps_cambio>0 && caja.ps_saldo_pre < venta.ps_cambio) {
        console.log('Ajuste por falta de Cambio en ARGENTINOS');
        const bodyData = {
            fecha: venta.fecha,
            hora: venta.hora, 
            bs_saldo_pre: caja.bs_saldo_pre,
            ps_saldo_pre: caja.ps_saldo_pre,
            bs_ajuste: 0, 
            ps_ajuste: venta.ps_cambio, 
            tipo: 1,
            descripcion: 'Ajuste de caja por falta de cambio para completar la venta',
            ci_usuario: venta.ci_usuario,
            cod_caja: caja.cod_caja
        };
        // Aquí llamas a la función `crear_ajuste` y le pasas el objeto `bodyData` como si fuera `req.body`
        await crear_ajuste({ body: bodyData }, mockRes); // Aquí `res` es el mismo que usas en el controlador de ventas o puedes definir otro mock si es necesario.
    }

    console.log('------------------------------------------------------'); 
    //:::: PASO 4 :::: DEFINIMOS LOS CALCULOS PARA ACTUALIZAR A CAJA  
    console.log(":::: PASO 4 :::: DEFINIMOS LOS CALCULOS PARA ACTUALIZAR A CAJA  "); 
    //INGRESOS
    const bs_ingreso = caja.bs_ingreso + venta.bs_pagado;   console.log('bs_ingreso: ',bs_ingreso);  
    const ps_ingreso = caja.ps_ingreso + venta.ps_pagado;   console.log('ps_ingreso: ',ps_ingreso);
    const banca_ingreso = caja.banca_ingreso + venta.bs_banca_pagado;   console.log('banca_ingreso: ',banca_ingreso);

    //EGRESOS
    const bs_egreso = caja.bs_egreso + venta.bs_cambio; console.log('bs_egreso: ',bs_egreso); 
    const ps_egreso = caja.ps_egreso+ venta.ps_cambio;  console.log('ps_egreso: ',ps_egreso);
    
    //SALDO PRELIMINAR (Ingresos + Saldoi - Egresos)
    const bs_saldo_pre = caja.bs_saldoi + bs_ingreso - bs_egreso; console.log('bs_saldo_pre: ',bs_saldo_pre);  
    const ps_saldo_pre = caja.ps_saldoi + ps_ingreso - ps_egreso;   console.log('ps_saldo_pre: ',ps_saldo_pre);
    
    //COSTO INSUMOS
    const bs_insumo = caja.bs_insumo + movimiento.precio;   console.log('bs_insumo: ',bs_insumo);
    
    //GANANCIA BRUTA (Ingresos - Egresos - Costo Insumos)
    const Ingresos = bs_ingreso + banca_ingreso +  Math.floor(ps_ingreso * caja.tipo_cambio);  
    const Egresos = bs_egreso + Math.floor(ps_egreso * caja.tipo_cambio);
    const bs_bruto = Ingresos - Egresos - bs_insumo; console.log('bs_bruto: ', bs_bruto);

    //DESCUENTO 
    const descuento = caja.bs_descuento + venta.bs_descuento +  Math.floor(venta.ps_descuento * caja.tipo_cambio * 100) / 100; console.log('descuento: ',descuento);
    
    //IVA
    let iva_venta = 0;
    if (venta.estado_documento == 1) { //Si estado_documento == 1, Se emitio Factura
        iva_venta =  Math.floor((venta.bs_total - descuento) * 0.13 * 100) / 100;    
    }
    const iva = caja.bs_iva + iva_venta; console.log('iva: ',iva);
    

    //SALDO FINAL (SaldoInicial + Ingresos - Egresos - Costo Insumos - Descuentos - IVA)
    // const bs_saldo_inicial = caja.bs_saldoi + Math.floor( caja.ps_saldoi * caja.tipo_cambio * 100) / 100;
    const bs_saldo_final =  Ingresos - Egresos - bs_insumo - descuento - iva; console.log('bs_saldo_final: ',bs_saldo_final);
    
    //:::: PASO 5 :::: ACTUALIZAMOS CAJA
    console.log(":::: PASO 5 :::: ACTUALIZAMOS CAJA "); 
    const text_updateCaja = ` UPDATE public.caja
                                SET bs_ingreso=$1, ps_ingreso=$2, banca_ingreso=$3, 
                                    bs_egreso=$4, ps_egreso=$5,
                                    bs_saldo_pre=$6, ps_saldo_pre=$7, 
                                    bs_insumo=$8, 
                                    bs_bruto=$9, 
                                    bs_descuento=$10, 
                                    bs_iva=$11,
                                    bs_saldo_final=$12
                                WHERE cod_caja = $13; `;

    await client.query(text_updateCaja,[bs_ingreso, ps_ingreso, banca_ingreso,
                                        bs_egreso, ps_egreso, 
                                        bs_saldo_pre, ps_saldo_pre, 
                                        bs_insumo, 
                                        bs_bruto, 
                                        descuento, 
                                        iva,
                                        bs_saldo_final, caja.cod_caja]);

    // console.log('NORMAL: ', ps_ingreso * caja.tipo_cambio);
    // console.log('ROUND: ', Math.round(ps_ingreso * caja.tipo_cambio));
    // console.log('CEIL: ', Math.ceil(ps_ingreso * caja.tipo_cambio));
    // console.log('FLOOR *100/100: ', Math.floor(ps_ingreso * caja.tipo_cambio * 100) / 100);

    // if (divisa == 'a-bs') {
    //     return Math.round(cantidad * this.tipo_de_cambio * 2) / 2
    //   }else{
    //     return Math.ceil(cantidad / this.tipo_de_cambio / 50) * 50
    //   }

    console.log('------------ FIN AGREGAR MONTOS_CAJA ------------');
}




//***************************************************************************************************************************
//**************************************************** MODIFICAR VENTA ******************************************************
//***************************************************************************************************************************
const MODIFICAR_VENTA = async (req, res) =>{
    const client = await pool.connect();
    const venta = req.body.venta; 
    const detalles = req.body.detalles;
    console.log('*********************************** INICIAMOS MODIFICAR VENTA ***********************************'); 
    console.log('------------------------------------------------------'); 
    console.log('Venta a Agregar: ',venta);
    console.log('------------------------------------------------------');
    // console.log('Detalles: ', JSON.stringify(detalles, null, 2));
    console.log('Detalles: ', detalles);
    console.log('------------------------------------------------------');
    
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');

        console.log('COD_VENTA: ', venta.cod_venta);

        //:::: PRIMERO :::: ELIMINARMOS DETALLES DE LA VENTA ANTERIORES
        console.log(':::: PRIMERO :::: ELIMINARMOS DETALLES DE LA VENTA ANTERIORES');
        await eliminar_Detalles_venta(client, venta.cod_venta);

        //:::: SEGUNDO ::::CREAMOS DETALLES DE LA VENTA NUEVAMENTE
        console.log(':::: SEGUNDO :::: CREAMOS DETALLES DE LA VENTA NUEVAMENTE');
        await crear_Detalles_venta(client, venta.cod_venta, detalles);

        //:::: TERCERO :::: OBTENER VENTA ANTERIOR
        console.log(':::: TERCERO :::: OBTENER VENTA ANTERIOR');
        const venta_res = await client.query('SELECT * FROM public.venta where cod_venta = $1;',[venta.cod_venta]);
        const venta_anterior = venta_res.rows[0];

        //:::: CUARTO ::::  VERIFICAMOS SI ANTERIOR VENTA FUE PAGADA, PARA RESTAURAR INSUMO Y CAJA
        console.log(':::: CUARTO :::: VERIFICAMOS SI ANTERIOR VENTA FUE PAGADA, PARA RESTAURAR INSUMO Y CAJA');
        if (venta_anterior.estado_transaccion == 2) {
            await actualizar_MovimientoInsumo(client, venta, detalles);
            //Actualizamos Montos Caja
            await actualizar_MontosCaja(client, venta, venta_anterior);
        }

        //:::: QUINTO :::: SI VENTA ANTERIOR NO FUE PAGADA Y AHORA SE PAGO ENTONCES
        console.log(':::: QUINTO :::: SI VENTA ANTERIOR NO FUE PAGADA Y AHORA SE PAGO ENTONCES');

        if (venta_anterior.estado_transaccion == 1 && venta.estado_transaccion == 2) {
            const listaInsumos = await obtenerInsumosVenta(client, detalles);    console.log('Lista Insumos Obtenidos: ',listaInsumos);
            await agregar_MovimimientoInsumo(client, listaInsumos, venta, venta.cod_venta);
            await agregar_MontosCaja(client, venta, venta.cod_venta);
        }

        //:::: SEXTO :::: SI VENTA ANTERIOR NO TENIA FACTURA , FUE PAGADA Y AHORA SE EMITIO FACTURA
        console.log(':::: SEXTO :::: SI VENTA ANTERIOR NO TENIA FACTURA , FUE PAGADA Y AHORA SE EMITIO FACTURA');
        if (venta_anterior.estado_documento == 0 && venta.estado_transaccion == 2 && venta.estado_documento == 1) {
            const iva = Math.floor(venta.bs_total * 0.13 * 100) / 100; 
            await client.query('UPDATE caja SET bs_iva=bs_iva + $1, bs_saldo_final=bs_saldo_final + $2 WHERE cod_caja=$3',[iva,iva,venta.cod_caja])
        }

        //GUARDAMOS LOS DATOS DE VENTA A AGREGAR
        //:::: ULTIMO :::: GUARDAMOS LOS DATOS DE VENTA A AGREGAR
        console.log(':::: ULTIMO :::: GUARDAMOS LOS DATOS DE VENTA A AGREGAR');
        // CONSULTA PARA CREAR VENTA
        const actualizarVenta_Uptade = `
                UPDATE public.venta SET 
                    mesa = $1, descripcion = $2, estado = $3, ci_usuario = $4, cod_cliente = $5, 
                    bs_total = $6, bs_pagado = $7, bs_cambio = $8, ps_total = $9, ps_pagado = $10, ps_cambio = $11, 
                    estado_documento = $12, venta_llevar = $13, 
                    bs_descuento = $14, bs_banca_pagado = $15, ps_descuento = $16, 
                    fecha = $17, estado_transaccion = $18 
                WHERE cod_venta = $19;
        `;
           
        const {mesa, descripcion, estado, ci_usuario, cod_cliente,
            bs_total, bs_pagado, bs_cambio, ps_total, ps_pagado, ps_cambio, 
            estado_documento, venta_llevar, bs_descuento, bs_banca_pagado, ps_descuento, fecha, estado_transaccion, cod_venta} = venta;
        //CONSULTA ACTUALIZAR VENTA
        await client.query(actualizarVenta_Uptade, [mesa, descripcion, estado, ci_usuario, cod_cliente,
            bs_total, bs_pagado, bs_cambio, ps_total, ps_pagado, ps_cambio, 
            estado_documento, venta_llevar, bs_descuento, bs_banca_pagado, ps_descuento, fecha, estado_transaccion, cod_venta]);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Venta Modificada');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
    console.log('*********************************** TERMINAMOS CREAR VENTA ***********************************'); 
}

// ****************************** 1.- ELIMINAR DETALLES VENTA *********************************
//*********************************************************************************************
const eliminar_Detalles_venta = async (client, cod_venta) => {
    console.log('************************************* ELIMINAR DETALLES - VENTA ************************************');
    console.log('****************************************************************************************************');

    // PASO 1: Eliminar las opciones asociadas a los items de la venta
    console.log('PASO 1:: ELIMINAR OPCIONES');
    const eliminarDetalleOpcion = `
            DELETE FROM public.detalle_opcion
            WHERE cod_item IN (
                SELECT cod_item
                FROM public.detalle_venta
                WHERE cod_venta = $1
            );
    `;
    await client.query(eliminarDetalleOpcion, [cod_venta]);
   
    //PASO 2: Eliminar los detalles de la venta asociados al cod_venta
    console.log('PASO 2:: ELIMINAR DETALLES');
    const eliminarDetalleVenta = `
            DELETE FROM public.detalle_venta
            WHERE cod_venta = $1;
        `;
    await client.query(eliminarDetalleVenta, [cod_venta]);

    // Confirmar la transacción
    console.log(`Detalles de venta y opciones relacionados a cod_venta ${cod_venta} eliminados con éxito.`);
    console.log('******************************** FIN DE ELIMINAR DETALLES - VENTA **********************************'); 
    console.log('****************************************************************************************************');
}

//******************************* 2.- ELIMINAR INSUMOS VENTA **********************************
//*********************************************************************************************
const actualizar_MovimientoInsumo = async (client, venta, detalles) => {
    console.log('\x1b[36m%s\x1b[0m', '*********************************** ACTUALIZAR MOVIMIENTO INSUMO ***********************************');
    console.log('\x1b[36m%s\x1b[0m', '****************************************************************************************************');
    //:::: PASO 1:::: OBTENEMOS EL MOVIMIENTO Y RESTAURAMOS CAJA COSTO INSUMOS ANTES QUE SE MODIFIQUE EL MOVIMIENTO
    console.log('\x1b[36m%s\x1b[0m', ':::: PASO 1:::: OBTENEMOS EL MOVIMIENTO Y RESTAURAMOS CAJA COSTO INSUMOS '); 
    //Obtenemos movimiento
    const res_movimiento = await client.query('SELECT *FROM movimiento_insumo WHERE cod_venta = $1',[venta.cod_venta]);
    const movimiento= res_movimiento.rows[0]; console.log('movimiento: ',movimiento); 
    console.log('movimiento.precio: ',movimiento.precio);
    //Actualizamos Caja
    await client.query(' UPDATE caja SET bs_insumo = bs_insumo - $1 WHERE cod_caja = $2; ',[movimiento.precio, venta.cod_caja]);

    //:::: PASO 2:::: OBTENEMOS LOS LOTES ANTERIORES 
    console.log('\x1b[36m%s\x1b[0m', ':::: PASO 2:::: OBTENEMOS LOS LOTES ANTERIORES '); 
    // Consulta para obtener los detalles de movimiento_insumo según cod_venta
    const obtenerDetallesMovimientos = ` SELECT dmi.*
                                        FROM public.detalle_movimiento_insumo dmi
                                        JOIN public.movimiento_insumo mi ON dmi.cod_mov = mi.cod_mov
                                        WHERE mi.cod_venta = $1; `;
    //Ejecutamos la consulta
    const result = await client.query(obtenerDetallesMovimientos, [venta.cod_venta]);
    const lista_lotes_anteriores = result.rows; console.log('lista_lotes_anteriores: ', lista_lotes_anteriores);
    

    //:::: PASO 3 :::: ENVIAMOS A MODIFICAR SALIDA
    console.log('\x1b[36m%s\x1b[0m', ':::: PASO 3 :::: ENVIAMOS A MODIFICAR SALIDA'); 
    await modificar_Salida(client, lista_lotes_anteriores);


    //:::: PASO 4 :::: AGREGAMOS NUEVAMENTE LOS NUEVOS LOTES
    console.log('\x1b[36m%s\x1b[0m', ':::: PASO 4 :::: AGREGAMOS NUEVAMENTE LOS NUEVOS LOTES');
    const listaInsumos = await obtenerInsumosVenta(client, detalles); console.log('listaInsumos: ', listaInsumos);
    
    console.log('lista_lotes_anteriores[0].cod_mov: ', lista_lotes_anteriores[0].cod_mov);
    await crear_Salida_de_Detalles(client, listaInsumos, lista_lotes_anteriores[0].cod_mov);

    console.log('\x1b[36m%s\x1b[0m', '********************************* FIN ACTUALIZAR MOVIMIENTO INSUMO *********************************');
    console.log('\x1b[36m%s\x1b[0m', '****************************************************************************************************');
}

//******************************* 3.- RESTAURAR MONTOS CAJA *********************************
//*********************************************************************************************
const actualizar_MontosCaja = async (client, venta, venta_anterior) => {
    console.log('\x1b[33m%s\x1b[0m','************************************** ACTUALIZAR MONTOS CAJA **************************************');
    console.log('\x1b[33m%s\x1b[0m','****************************************************************************************************');
    //:::: PASO 1 :::: RECUPERAMOS EL ULTIMO MOVIMIENTO SALIDA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 1 :::: RECUPERAMOS EL ULTIMO MOVIMIENTO SALIDA');
    const resm = await client.query(`SELECT * FROM public.movimiento_insumo WHERE cod_venta = $1 `,[venta_anterior.cod_venta]);
    const movimiento = resm.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Movimiento: ',movimiento);

    //:::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA');
    const resc = await client.query(`SELECT * FROM public.caja WHERE cod_caja = $1 `,[venta_anterior.cod_caja]);
    const caja = resc.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Caja: ',caja);

    console.log('------------------------------------------------------');  
    //:::: PASO 3 :::: DEFINIMOS LOS CALCULOS PARA ACTUALIZAR A CAJA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 3 :::: DEFINIMOS LOS CALCULOS PARA ACTUALIZAR A CAJA');
    //INGRESOS
    const bs_ingreso = caja.bs_ingreso - venta_anterior.bs_pagado + venta.bs_pagado;   console.log('bs_ingreso: ',bs_ingreso);  
    const ps_ingreso = caja.ps_ingreso - venta_anterior.ps_pagado + venta.ps_pagado;   console.log('ps_ingreso: ',ps_ingreso);
    const banca_ingreso = caja.banca_ingreso - venta_anterior.bs_banca_pagado + venta.bs_banca_pagado;   console.log('banca_ingreso: ',banca_ingreso);

    //EGRESOS
    const bs_egreso = caja.bs_egreso - venta_anterior.bs_cambio + venta.bs_cambio; console.log('bs_egreso: ',bs_egreso); 
    const ps_egreso = caja.ps_egreso - venta_anterior.ps_cambio + venta.ps_cambio;  console.log('ps_egreso: ',ps_egreso);

    //SALDO PRELIMINAR (Ingresos + Saldoi - Egresos)
    const bs_saldo_pre = caja.bs_saldoi + bs_ingreso - bs_egreso;   console.log('bs_saldo_pre: ',bs_saldo_pre);  
    const ps_saldo_pre = caja.ps_saldoi + ps_ingreso - ps_egreso;   console.log('ps_saldo_pre: ',ps_saldo_pre);

    //COSTO INSUMOS
    const bs_insumo = caja.bs_insumo + movimiento.precio;   console.log('bs_insumo: ',bs_insumo);

    //GANANCIA BRUTA (Ingresos - Egresos - Costo Insumos)
    const Ingresos = bs_ingreso + banca_ingreso +  Math.floor(ps_ingreso * caja.tipo_cambio);  
    const Egresos = bs_egreso + Math.floor(ps_egreso * caja.tipo_cambio);
    const bs_bruto = Ingresos - Egresos - bs_insumo; console.log('bs_bruto: ', bs_bruto);

    //DESCUENTO 
    const descuento = caja.bs_descuento - (venta_anterior.bs_descuento + Math.floor(venta_anterior.ps_descuento * caja.tipo_cambio * 100) / 100) 
                                        + venta.bs_descuento + Math.floor(venta.ps_descuento * caja.tipo_cambio * 100) / 100; 
    console.log('descuento: ',descuento);

    //IVA
    let iva_venta = 0;
    if (venta.estado_documento == 1) { //Si estado_documento == 1, Se emitio Factura
        iva_venta =  Math.floor(venta.bs_total * 0.13 * 100) / 100;    
    }
    const iva = caja.bs_iva + iva_venta; console.log('iva: ',iva);


    //SALDO FINAL (SaldoInicial + Ingresos - Egresos - Costo Insumos - Descuentos - IVA)
    const bs_saldo_inicial = caja.bs_saldoi + Math.floor( caja.ps_saldoi * caja.tipo_cambio * 100) / 100;
    const bs_saldo_final =  Ingresos - Egresos - bs_insumo - descuento - iva; console.log('bs_saldo_final: ',bs_saldo_final);
    //:::: PASO 4 :::: CONSULTA ACTUALIZAR CAJA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 4 ::::  CONSULTA ACTUALIZAR CAJA');
    const text_updateCaja = ` UPDATE public.caja
                                SET bs_ingreso=$1, ps_ingreso=$2, banca_ingreso=$3, 
                                    bs_egreso=$4, ps_egreso=$5,
                                    bs_saldo_pre=$6, ps_saldo_pre=$7, 
                                    bs_insumo=$8, 
                                    bs_bruto=$9, 
                                    bs_descuento=$10, 
                                    bs_iva=$11,
                                    bs_saldo_final=$12
                                WHERE cod_caja = $13; `;

    await client.query(text_updateCaja,[bs_ingreso, ps_ingreso, banca_ingreso,
                                        bs_egreso, ps_egreso, 
                                        bs_saldo_pre, ps_saldo_pre, 
                                        bs_insumo, 
                                        bs_bruto, 
                                        descuento, 
                                        iva,
                                        bs_saldo_final, caja.cod_caja]);

    console.log('\x1b[33m%s\x1b[0m','************************************ FIN ACTUALIZAR MONTOS CAJA ************************************');
    console.log('\x1b[33m%s\x1b[0m','****************************************************************************************************');
}

//***************************************************************************************************************************
//***************************************************** ELIMINAR VENTA ******************************************************
//***************************************************************************************************************************
const ELIMINAR_VENTA = async (req, res) =>{
    console.log('\x1b[31m%s\x1b[0m', '*********************************** ELIMINAR VENTA ***********************************');
    console.log('\x1b[31m%s\x1b[0m', '**************************************************************************************');
     
    const cod_venta = parseInt(req.params.cod_venta);   console.log('cod_venta: ', cod_venta);
    
    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
    
        //:::: PRIMERO :::: OBTENEMOS LA VENTA COMPLETA
        console.log(':::: PRIMERO :::: OBTENEMOS LA VENTA COMPLETA');
        const res_venta = await client.query('SELECT * FROM venta WHERE cod_venta = $1;',[cod_venta]);
        const venta = res_venta.rows[0]; console.log('Venta: ',venta);  

        //SI LA VENTA FUE PAGADA ENTONCES 
        if(venta.estado_transaccion == 2){
            //:::: SEGUNDO :::: AJUSTAMOS CAJA
            console.log(':::: SEGUNDO :::: AJUSTAMOS CAJA');
            await eliminar_MontosCaja(client,venta);

            //:::: TERCERO :::: OBTENEMOS MOVIMIENTO SEGUN COD_VENTA
            console.log(':::: TERCERO :::: OBTENEMOS MOVIMIENTO SEGUN COD_VENTA');
            //Obtenemos movimiento
            const res_movimiento = await client.query('SELECT *FROM movimiento_insumo WHERE cod_venta = $1',[cod_venta]);
            const movimiento= res_movimiento.rows[0]; console.log('movimiento: ',movimiento); 

            //:::: CUARTO :::: ELIMINAR DETALLES DE MOVIMIENTO
            console.log(':::: CUARTO :::: ELIMINAR DETALLES DE MOVIMIENTO');
            await eliminar_Salida(client, movimiento);

            //:::: QUINTO :::: ELIMINAR MOVIMIENTO
            console.log(':::: QUINTO :::: ELIMINAR MOVIMIENTO');
            await client.query('DELETE FROM movimiento_insumo WHERE cod_mov = $1;',[movimiento.cod_mov]);
        }

        //:::: SEXTO ::::SI VENTA A ELIMINAR TENIA EMITIDA LA FACTURA, NO ELIMINAMOS LA VENTA
        if (venta.estado_documento!=1) { 
            //:::: SEPTIMO :::: ELIMINAR DETALLES VENTA
            console.log(':::: SEPTIMO :::: ELIMINAR DETALLES VENTA');
            await eliminar_Detalles_venta(client, cod_venta);

            //:::: OCTAVO :::: ELIMINAR VENTA
            console.log(':::: OCTAVO :::: ELIMINAR VENTA');
            await client.query('DELETE FROM venta WHERE cod_venta = $1',[cod_venta]);
        }
        //:::: NOVENO :::: ENTONCES SOLO MODIFICAMOSLA VENTA COMO ANULADO
        else{
            console.log(':::: NOVENO :::: MODICAMOS LA VENTA A ANULADO');
            await client.query('UPDATE venta SET estado_documento = 2 WHERE cod_venta = $1',[cod_venta]);
        }


        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Venta Eliminada');
    }catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }

    console.log('\x1b[31m%s\x1b[0m','********************************* FIN ELIMINAR VENTA *********************************'); 
    console.log('\x1b[31m%s\x1b[0m','**************************************************************************************'); 
}

const eliminar_MontosCaja = async (client, venta) => {
    console.log('\x1b[33m%s\x1b[0m','**************************************** ELIMINAR MONTOS CAJA **************************************');
    console.log('\x1b[33m%s\x1b[0m','****************************************************************************************************');
    //:::: PASO 1 :::: RECUPERAMOS EL ULTIMO MOVIMIENTO SALIDA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 1 :::: RECUPERAMOS EL ULTIMO MOVIMIENTO SALIDA');
    const resm = await client.query(`SELECT * FROM public.movimiento_insumo WHERE cod_venta = $1 `,[venta.cod_venta]);
    const movimiento = resm.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Movimiento: ',movimiento);

    //:::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 2 :::: RECUPERAMOS LA CAJA APERTURADA');
    const resc = await client.query(`SELECT * FROM public.caja WHERE cod_caja = $1 `,[venta.cod_caja]);
    const caja = resc.rows[0]; // Retorna el último cod_mov o null si no hay registros
    console.log('Caja: ',caja);

    console.log('------------------------------------------------------');  
    //:::: PASO 3 :::: DEFINIMOS LOS CALCULOS PARA RESTAURAR CAJA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 3 :::: DEFINIMOS LOS CALCULOS PARA RESTAURAR CAJA');
    //INGRESOS
    const bs_ingreso = caja.bs_ingreso - venta.bs_pagado;   console.log('bs_ingreso: ',bs_ingreso);  
    const ps_ingreso = caja.ps_ingreso - venta.ps_pagado;   console.log('ps_ingreso: ',ps_ingreso);
    const banca_ingreso = caja.banca_ingreso - venta.bs_banca_pagado;   console.log('banca_ingreso: ',banca_ingreso);

    //EGRESOS
    const bs_egreso = caja.bs_egreso - venta.bs_cambio; console.log('bs_egreso: ',bs_egreso); 
    const ps_egreso = caja.ps_egreso - venta.ps_cambio;  console.log('ps_egreso: ',ps_egreso);

    //SALDO PRELIMINAR (Ingresos + Saldoi - Egresos)
    const bs_saldo_pre = caja.bs_saldoi + bs_ingreso - bs_egreso;   console.log('bs_saldo_pre: ',bs_saldo_pre);  
    const ps_saldo_pre = caja.ps_saldoi + ps_ingreso - ps_egreso;   console.log('ps_saldo_pre: ',ps_saldo_pre);

    //COSTO INSUMOS
    const bs_insumo = caja.bs_insumo - movimiento.precio;   console.log('bs_insumo: ',bs_insumo);

    //GANANCIA BRUTA (Ingresos - Egresos - Costo Insumos)
    const Ingresos = bs_ingreso + banca_ingreso +  Math.floor(ps_ingreso * caja.tipo_cambio);  
    const Egresos = bs_egreso + Math.floor(ps_egreso * caja.tipo_cambio);
    const bs_bruto = Ingresos - Egresos - bs_insumo; console.log('bs_bruto: ', bs_bruto);

    //DESCUENTO 
    const descuento = caja.bs_descuento - (venta.bs_descuento + Math.floor(venta.ps_descuento * caja.tipo_cambio * 100) / 100); 
    console.log('descuento: ',descuento);

    //IVA
    let iva_venta = 0;
    if (venta.estado_documento == 1) { //Si estado_documento == 1, Se emitio Factura
        iva_venta =  Math.floor(venta.bs_total * 0.13 * 100) / 100;    
    }
    const iva = caja.bs_iva - iva_venta; console.log('iva: ',iva);


    //SALDO FINAL (SaldoInicial + Ingresos - Egresos - Costo Insumos - Descuentos - IVA)
    const bs_saldo_inicial = caja.bs_saldoi + Math.floor( caja.ps_saldoi * caja.tipo_cambio * 100) / 100;
    const bs_saldo_final =  Ingresos - Egresos - bs_insumo - descuento - iva; console.log('bs_saldo_final: ',bs_saldo_final);

    //:::: PASO 4 :::: CONSULTA ACTUALIZAR CAJA
    console.log('\x1b[33m%s\x1b[0m',':::: PASO 4 ::::  CONSULTA ACTUALIZAR CAJA');
    const text_updateCaja = ` UPDATE public.caja
                                SET bs_ingreso=$1, ps_ingreso=$2, banca_ingreso=$3, 
                                    bs_egreso=$4, ps_egreso=$5,
                                    bs_saldo_pre=$6, ps_saldo_pre=$7, 
                                    bs_insumo=$8, 
                                    bs_bruto=$9, 
                                    bs_descuento=$10, 
                                    bs_iva=$11,
                                    bs_saldo_final=$12
                                WHERE cod_caja = $13; `;

    await client.query(text_updateCaja,[bs_ingreso, ps_ingreso, banca_ingreso,
                                        bs_egreso, ps_egreso, 
                                        bs_saldo_pre, ps_saldo_pre, 
                                        bs_insumo, 
                                        bs_bruto, 
                                        descuento, 
                                        iva,
                                        bs_saldo_final, caja.cod_caja]);

    console.log('\x1b[33m%s\x1b[0m','************************************* FIN ELIMINAR MONTOS CAJA *************************************');
    console.log('\x1b[33m%s\x1b[0m','****************************************************************************************************');
}

//***************************************************************************************************************************
//****************************************************** OBTENER VENTAS *****************************************************
//***************************************************************************************************************************

// ********************************* 1.- OBTENER VENTAS NUEVAS ************************************
//*********************************************************************************************
const GET_VENTAS_NUEVAS = async (req, res) => {
    console.log('------------------------------------------------------------');
    console.log('GET_VENTAS_NUEVAS');
    console.log('------------------------------------------------------------');
    const cod_caja = req.query.cod_caja || 0;
    const fecha = req.query.fecha || ''; // Corregido a `fecha`
    // console.log('fecha: ',fecha);
    

    const client = await pool.connect();
    try {
        // Comienza la transacción
        await client.query('BEGIN');

        const text_get_ventas_nuevos = `
            SELECT * FROM public.venta
            WHERE cod_caja = $1 AND estado = 0
            AND TO_DATE(fecha, 'DD/MM/YYYY') = TO_DATE($2, 'DD/MM/YYYY')
            ORDER BY ticket ASC;
        `;

        // Ejecutar la consulta
        const lista_Nuevos = await client.query(text_get_ventas_nuevos, [cod_caja, fecha]);

        //OBTENER DETALLES
        const detalles = await Get_Ventas_Detalles(client, cod_caja,fecha, 0)
        // console.log('Ventas:',lista_Nuevos.rows );       
        // console.log('Detalles: ', detalles);


        // UNIMOS LAS DETALLES Y VENTAS
        const lista_ventas = unirVentasConDetalles(lista_Nuevos.rows, detalles);
        // console.log(lista_ventas);

        // Confirmar la transacción
        await client.query('COMMIT');
        
        // Devolver los resultados
        res.status(200).json(lista_ventas);
    } catch (error) {
        console.error('Error en la transacción:', error);
        
        // Si hay un error, hacer rollback
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        // Liberar la conexión
        client.release();
    }
};
// ******************************* 1.- OBTENER VENTAS EN PROCESO **********************************
//*********************************************************************************************
const GET_VENTAS_EN_PROCESO = async (req, res) => {
    console.log('------------------------------------------------------------');
    console.log('GET_VENTAS_EN_PROCESO');
    console.log('------------------------------------------------------------');
    const cod_caja = req.query.cod_caja || 0;
    const fecha = req.query.fecha || '';

    const client = await pool.connect();
    try {
        // Comienza la transacción
        await client.query('BEGIN');

        const text_get_ventas_proceso = `
            SELECT * FROM public.venta
            WHERE cod_caja = $1 AND estado = 1
            AND TO_DATE(fecha, 'DD/MM/YYYY') = TO_DATE($2, 'DD/MM/YYYY')
            ORDER BY ticket ASC;
        `;

        // Ejecutar la consulta
        const lista_en_proceso = await client.query(text_get_ventas_proceso, [cod_caja, fecha]);
        //OBTENER DETALLES
        const detalles = await Get_Ventas_Detalles(client, cod_caja,fecha, 1)
        // console.log('Ventas:',lista_en_proceso.rows );
        // console.log('Detalles: ', detalles);

        // UNIMOS LAS DETALLES Y VENTAS
        const lista_ventas = unirVentasConDetalles(lista_en_proceso.rows, detalles);
        console.log(lista_ventas);

        // Confirmar la transacción
        await client.query('COMMIT');
        
        // Devolver los resultados
        res.status(200).json(lista_ventas);
    } catch (error) {
        console.error('Error en la transacción:', error);
        
        // Si hay un error, hacer rollback
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        // Liberar la conexión
        client.release();
    }
};
// ****************************** 1.- OBTENER VENTAS FINALIZADAS***********************************
//*********************************************************************************************
const GET_VENTAS_FINALIZADAS = async (req, res) => {
    console.log('------------------------------------------------------------');
    console.log('GET_VENTAS_FINALIZADAS');
    console.log('------------------------------------------------------------');
    const cod_caja = req.query.cod_caja || 0;
    const fecha = req.query.fecha || '';
    const limite = 100; // Valor por defecto para el límite

    const client = await pool.connect();
    try {
        // Comienza la transacción
        await client.query('BEGIN');

        const text_get_ventas_finalizadas = `
            SELECT * FROM public.venta
            WHERE cod_caja = $1 AND estado = 2
            AND TO_DATE(fecha, 'DD/MM/YYYY') = TO_DATE($2, 'DD/MM/YYYY')
            ORDER BY ticket ASC
        `;

        // Ejecutar la consulta
        const lista_Finalizadas = await client.query(text_get_ventas_finalizadas, [cod_caja, fecha]);
        
        // Extraer los cod_venta
        const cod_ventas = lista_Finalizadas.rows.map(venta => venta.cod_venta);

        // Si hay ventas, obtener detalles
        let detalles = { detalle_venta: [], detalle_opcion: [] };
        if (cod_ventas.length > 0) {
            detalles = await Get_Ventas_Detalles_Limite(client, cod_ventas, 0); // Usamos el estado 0 para detalles
        }
        // console.log('Ventas:',lista_Finalizadas.rows );     
        // console.log('Detalles: ', detalles);

         // UNIMOS LAS DETALLES Y VENTAS
         const lista_ventas = unirVentasConDetalles(lista_Finalizadas.rows, detalles);
         console.log(lista_ventas);
 
         // Confirmar la transacción
         await client.query('COMMIT');
         
         // Devolver los resultados
         res.status(200).json(lista_ventas);
    } catch (error) {
        console.error('Error en la transacción:', error);
        
        // Si hay un error, hacer rollback
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        // Liberar la conexión
        client.release();
    }
};

// ****************************** 2.- OBTENER VENTAS DETALLES***********************************
const Get_Ventas_Detalles = async (client, cod_caja, fecha, estado) => {
            const text_lista_detalle_venta = `  SELECT dv.*, v.cod_venta, p.nombre, p.cocina  
                                                    FROM public.detalle_venta AS dv
                                                    JOIN public.venta AS v ON dv.cod_venta = v.cod_venta
                                                    JOIN public.producto AS p ON dv.cod_producto = p.cod_producto
                                                    WHERE v.cod_caja = $1
                                                    AND v.estado = $2
                                                    AND TO_DATE(v.fecha, 'DD/MM/YYYY') = TO_DATE($3, 'DD/MM/YYYY')
                                                    ORDER BY v.fecha DESC; `;

            const text_lista_detalle_opcion = ` SELECT dop.* , dv.cod_item, o.nombre, c.cod_complemento 
                                                    FROM public.detalle_opcion AS dop
                                                    JOIN public.detalle_venta AS dv ON dop.cod_item = dv.cod_item
                                                    JOIN public.venta AS v ON dv.cod_venta = v.cod_venta
                                                    JOIN public.opcion AS o ON dop.cod_opcion = o.cod_opcion
                                                    JOIN public.complemento_opcion AS c ON dop.cod_opcion = c.cod_opcion        
                                                    WHERE v.cod_caja = $1
                                                    AND v.estado = $2
                                                    AND TO_DATE(v.fecha, 'DD/MM/YYYY') = TO_DATE($3, 'DD/MM/YYYY')
                                                    ORDER BY v.fecha DESC; `;

            // Ejecutar la consulta
            const lista_detalle_venta = await client.query(text_lista_detalle_venta, [cod_caja, estado, fecha]);
            // Ejecutar la consulta
            const lista_detalle_opcion = await client.query(text_lista_detalle_opcion, [cod_caja, estado, fecha]);


            const detalles = {detalle_venta:lista_detalle_venta.rows, detalle_opcion: lista_detalle_opcion.rows}
            return detalles;
}
const Get_Ventas_Detalles_Limite = async (client, cod_ventas, estado) => {
    const cod_ventas_placeholder = cod_ventas.map((_, index) => `$${index + 1}`).join(',');

    const text_lista_detalle_venta = `
        SELECT dv.*, v.cod_venta, p.nombre, p.cocina     
        FROM public.detalle_venta AS dv
        JOIN public.venta AS v ON dv.cod_venta = v.cod_venta
        JOIN public.producto AS p ON dv.cod_producto = p.cod_producto
        WHERE v.cod_venta IN (${cod_ventas_placeholder})
        AND v.estado = 2;
    `;

    const text_lista_detalle_opcion = `
        SELECT dop.*, dv.cod_item, o.nombre, c.cod_complemento 
        FROM public.detalle_opcion AS dop
        JOIN public.detalle_venta AS dv ON dop.cod_item = dv.cod_item
        JOIN public.venta AS v ON dv.cod_venta = v.cod_venta
        JOIN public.opcion AS o ON dop.cod_opcion = o.cod_opcion
        JOIN public.complemento_opcion AS c ON dop.cod_opcion = c.cod_opcion 
        WHERE v.cod_venta IN (${cod_ventas_placeholder})
        AND v.estado =2;
    `;

    // Ejecutar las consultas
    const lista_detalle_venta = await client.query(text_lista_detalle_venta, [...cod_ventas]);
    const lista_detalle_opcion = await client.query(text_lista_detalle_opcion, [...cod_ventas]);
    return { detalle_venta: lista_detalle_venta.rows, detalle_opcion: lista_detalle_opcion.rows };
};


const unirVentasConDetalles = (ventas, detalles) => {
    return ventas.map((venta) => {
      // FILTRAR LOS DETALLES DE LA VENTA ACTUAL SEGÚN SU cod_venta
      const detalle_venta = detalles.detalle_venta
        .filter((d) => d.cod_venta === venta.cod_venta)
        .map((d) => {
          // FILTRAR LAS OPCIONES QUE CORRESPONDEN AL cod_item ACTUAL DE LA VENTA
          const detalle_opcion = detalles.detalle_opcion
            .filter((op) => op.cod_item === d.cod_item)
            .reduce((acc, curr) => {
              // BUSCAR SI YA EXISTE UN GRUPO CON EL MISMO cod_complemento
              const complementoIndex = acc.findIndex(group => group[0].cod_complemento === curr.cod_complemento);
              
              if (complementoIndex !== -1) {
                // SI YA EXISTE UN GRUPO CON EL MISMO cod_complemento, AÑADIR LA OPCIÓN AL GRUPO EXISTENTE
                acc[complementoIndex].push(curr);
              } else {
                // SI NO EXISTE EL GRUPO, CREAR UN NUEVO GRUPO Y AÑADIR LA OPCIÓN ACTUAL
                acc.push([curr]);
              }
              return acc;
            }, []); // EL ARRAY INICIAL (acc) ESTÁ VACÍO, SE LLENARÁ CON LOS GRUPOS DE cod_complemento
  
          // RETORNAR CADA DETALLE DE LA VENTA, INCLUYENDO LAS OPCIONES AGRUPADAS POR cod_complemento
          return {
            ...d,              // INCLUIR TODAS LAS PROPIEDADES DEL DETALLE ACTUAL (cod_venta, cod_item, etc.)
            detalle_opcion     // AÑADIR EL ARRAY DE OPCIONES AGRUPADAS POR cod_complemento
          };
        });
  
      // RETORNAR LA VENTA ACTUAL, INCLUYENDO LOS DETALLES FILTRADOS Y AGRUPADOS
      return {
        venta,             // INCLUIR TODAS LAS PROPIEDADES DE LA VENTA ACTUAL
        detalle_venta      // AÑADIR EL ARRAY DE DETALLES DE LA VENTA ACTUAL
      };
    });
};
  
  
  
const MODIFICAR_DATOS_VENTA = async (req, res) => {
    console.log('MODIFICAR SOLO DATOS VENTA');
    
    const client = await pool.connect();
    try {
        // COMIENZA LA TRANSACCIÓN
        await client.query('BEGIN');
        const {mesa, cod_venta, descripcion,venta_llevar, estado} = req.body;  console.log(req.body);
        
        const update_Venta = `UPDATE venta SET mesa = $1, descripcion = $2, venta_llevar = $3, estado = $4 WHERE cod_venta = $5`;
        
        //CONSULTA
        await client.query(update_Venta, [mesa, descripcion, venta_llevar, estado, cod_venta]);
        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json('Datos de Venta Actualiza');
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    }finally {
        client.release(); // Libera la conexión al pool
    }
}
  

  




module.exports = {
    // CREAR VENTA
    CREAR_VENTA,
    //MODIFICAR VENTA
    MODIFICAR_VENTA,
    //ELIMINAR VENTA
    ELIMINAR_VENTA,
    // LISTAR VENTAS
    GET_VENTAS_NUEVAS,
    GET_VENTAS_EN_PROCESO,
    GET_VENTAS_FINALIZADAS,
    //
    MODIFICAR_DATOS_VENTA

}