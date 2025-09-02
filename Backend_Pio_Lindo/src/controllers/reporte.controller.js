
const pool = require('../database')

const REPORTE_VENTAS = async (req, res) => {
    var fecha_inicio = req.query.fecha_inicio || '01/09/2024'; // Establecer valores predeterminados
    var fecha_final = req.query.fecha_final || '01/10/2024';

    console.log('fecha_inicio: ', fecha_inicio, 'fecha_final: ', fecha_final);

    // Consulta para obtener el reporte de ventas
    const get_reporteVentas = `
        SELECT 
            v.cod_venta, v.ticket, v.fecha, v.hora, v.ci_usuario, v.cod_cliente, ci.identificacion, ci.nombre, c.tipo_cambio, 
            v.bs_total, v.bs_pagado, v.bs_cambio,  v.ps_total, v.ps_pagado, v.ps_cambio, v.bs_banca_pagado,
            v.estado_documento, v.bs_descuento, v.ps_descuento,
            SUM(dv.cantidad_item) AS cantidad_total_vendida,
            SUM(dv.cantidad_item * p.precio) AS total_precio_vendido
        FROM public.venta v
        JOIN public.detalle_venta dv ON v.cod_venta = dv.cod_venta
        JOIN public.producto p ON dv.cod_producto = p.cod_producto
        LEFT JOIN public.cliente ci ON ci.cod_cliente = v.cod_cliente
        JOIN public.caja c ON v.cod_caja = c.cod_caja
        WHERE to_date(v.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
        AND to_date($2, 'DD/MM/YYYY') 
 
        GROUP BY v.cod_venta, v.fecha, c.tipo_cambio, ci.identificacion, ci.nombre
        ORDER BY v.cod_venta DESC;
    `;

    // Consulta para obtener el costo de insumos por cada venta
    const get_costoInsumosPorVenta = `
        SELECT 
            v.cod_venta,
            v.ticket,
            COALESCE(SUM(mi.precio), 0) AS total_costo_insumo
        FROM public.movimiento_insumo mi
        JOIN public.venta v ON mi.cod_venta = v.cod_venta
        WHERE mi.movimiento = 2 
        AND to_date(mi.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
        AND to_date($2, 'DD/MM/YYYY')
        GROUP BY v.cod_venta, v.ticket
        ORDER BY v.cod_venta;
    `;

    const client = await pool.connect();
    try {
        // Inicia la transacción
        await client.query('BEGIN');

        // Obtener reporte de ventas
        const reporte_ventas = await client.query(get_reporteVentas, [fecha_inicio, fecha_final]);
        const ventas = reporte_ventas.rows;
        console.log('REPORTE VENTAS: ', ventas);

        // Obtener costo de insumos por venta
        const costo_insumos = await client.query(get_costoInsumosPorVenta, [fecha_inicio, fecha_final]);
        const costos = costo_insumos.rows;
        console.log('COSTOS DE INSUMOS POR VENTA: ', costos);

        // Crear un objeto para almacenar los costos por cada venta
        const costosPorVenta = {};
        costos.forEach(costo => {
            costosPorVenta[costo.cod_venta] = costo.total_costo_insumo;
        });

        // Crear una lista para almacenar el resultado final
        let reporteFinal = [];

        // Recorrer las ventas y añadir el costo de insumos
        ventas.forEach(venta => {
            reporteFinal.push({
                cod_venta: venta.cod_venta,
                ticket: venta.ticket, 
                fecha:venta.fecha, 
                hora:venta.hora, 
                ci_usuario:venta.ci_usuario,
                tipo_cambio:venta.tipo_cambio, 
                cod_cliente:venta.cod_cliente,         
                identificacion:venta.identificacion,    
                nombre:venta.nombre,           
                bs_total:venta.bs_total, 
                bs_pagado:venta.bs_pagado, 
                bs_cambio:venta.bs_cambio,  
                ps_total:venta.ps_total, 
                ps_pagado:venta.ps_pagado, 
                ps_cambio:venta.ps_cambio, 
                bs_banca_pagado:venta.bs_banca_pagado,
                bs_total_descuento:venta.bs_descuento + (Math.floor((venta.ps_descuento??0)) * venta.tipo_cambio),
                bs_total_pagado: (venta.bs_pagado - venta.bs_cambio) + venta.bs_banca_pagado + ( Math.floor((venta.ps_pagado??0) - (venta.ps_cambio??0)) * venta.tipo_cambio),             
                estado_documento:venta.estado_documento, 
                bs_descuento:venta.bs_descuento, 
                ps_descuento:venta.ps_descuento,
                cantidad_total_vendida: venta.cantidad_total_vendida,
                total_precio_vendido: venta.total_precio_vendido,
                total_costo_insumo: costosPorVenta[venta.cod_venta] || 0 // Asignar costo o 0 si no hay
            });
        });

        console.log('REPORTE FINAL DE VENTAS: ', reporteFinal);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(reporteFinal);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
};







// const REPORTE_VENTAS = async (req, res) => {
//     var fecha_inicio = req.query.fecha_inicio || '01/09/2024'; // Valores predeterminados
//     var fecha_final = req.query.fecha_final || '01/10/2024';

//     console.log('fecha_inicio: ', fecha_inicio, 'fecha_final: ', fecha_final);

//     // Consulta para obtener el reporte de ventas
//     const get_reporteVentas = `
// SELECT 
//     v.cod_venta, v.ticket, v.fecha, v.hora, v.ci_usuario, v.cod_cliente, c.tipo_cambio, 
//     v.bs_total, v.bs_pagado, v.bs_cambio, v.ps_total, v.ps_pagado, v.ps_cambio, v.bs_banca_pagado,
//     v.estado_documento, v.bs_descuento, v.ps_descuento,
//     COALESCE(SUM(dv.cantidad_item), 0) AS cantidad_total_vendida,
//     COALESCE(SUM(dv.cantidad_item * p.precio), 0) AS total_precio_vendido
// FROM public.venta v
// LEFT JOIN public.detalle_venta dv ON v.cod_venta = dv.cod_venta
// LEFT JOIN public.producto p ON dv.cod_producto = p.cod_producto
// LEFT JOIN public.caja c ON v.cod_caja = c.cod_caja
// WHERE to_date(v.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
// AND to_date($2, 'DD/MM/YYYY') 

// GROUP BY v.cod_venta, v.fecha, c.tipo_cambio
// ORDER BY v.cod_venta DESC;

//     `;

//     // Consulta para obtener el costo de insumos por cada venta
//     const get_costoInsumosPorVenta = `
// SELECT 
//     v.cod_venta,
//     COALESCE(SUM(mi.precio), 0) AS total_costo_insumo
// FROM public.venta v
// LEFT JOIN public.movimiento_insumo mi ON mi.cod_venta = v.cod_venta AND mi.movimiento = 2
// WHERE to_date(v.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
// AND to_date($2, 'DD/MM/YYYY')
// GROUP BY v.cod_venta
// ORDER BY v.cod_venta;
//     `;

//     const client = await pool.connect();
//     try {
//         // Inicia la transacción
//         await client.query('BEGIN');

//         // Obtener reporte de ventas
//         const reporte_ventas = await client.query(get_reporteVentas, [fecha_inicio, fecha_final]);
//         const ventas = reporte_ventas.rows;

//         console.log('REPORTE VENTAS: ', ventas);

//         // Obtener costo de insumos por venta
//         const costo_insumos = await client.query(get_costoInsumosPorVenta, [fecha_inicio, fecha_final]);
//         const costos = costo_insumos.rows;

//         console.log('COSTOS DE INSUMOS POR VENTA: ', costos);

//         // Crear un mapa para almacenar los costos por cada venta
//         const costosPorVenta = {};
//         costos.forEach(costo => {
//             costosPorVenta[costo.cod_venta] = costo.total_costo_insumo;
//         });

//         // Crear un conjunto para asegurar que todas las ventas del rango estén incluidas
//         const ventasConRelaciones = new Set(costos.map(c => c.cod_venta));

//         // Crear el reporte final combinando datos
//         const reporteFinal = ventas.map(venta => ({
//             cod_venta: venta.cod_venta,
//             ticket: venta.ticket,
//             fecha: venta.fecha,
//             hora: venta.hora,
//             ci_usuario: venta.ci_usuario,
//             cod_cliente: venta.cod_cliente,
//             tipo_cambio: venta.tipo_cambio,
//             bs_total: venta.bs_total,
//             bs_pagado: venta.bs_pagado,
//             bs_cambio: venta.bs_cambio,
//             ps_total: venta.ps_total,
//             ps_pagado: venta.ps_pagado,
//             ps_cambio: venta.ps_cambio,
//             bs_banca_pagado: venta.bs_banca_pagado,
//             bs_total_descuento: venta.bs_descuento + Math.floor((venta.ps_descuento ?? 0) * venta.tipo_cambio),
//             bs_total_pagado:
//                 (venta.bs_pagado - venta.bs_cambio) +
//                 venta.bs_banca_pagado +
//                 Math.floor((venta.ps_pagado ?? 0) - (venta.ps_cambio ?? 0)) * venta.tipo_cambio,
//             estado_documento: venta.estado_documento,
//             bs_descuento: venta.bs_descuento,
//             ps_descuento: venta.ps_descuento,
//             cantidad_total_vendida: venta.cantidad_total_vendida,
//             total_precio_vendido: venta.total_precio_vendido,
//             total_costo_insumo: costosPorVenta[venta.cod_venta] || 0, // Asignar costo o 0 si no hay relación
//         }));

//         console.log('REPORTE FINAL DE VENTAS: ', reporteFinal);

//         await client.query('COMMIT'); // Confirma la transacción
//         res.status(200).json(reporteFinal);
//     } catch (error) {
//         console.error(error);
//         await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
//         res.status(500).json({ error: 'Error interno del servidor' });
//     } finally {
//         client.release(); // Libera la conexión al pool
//     }
// };




const REPORTE_PRODUCTOS = async (req, res) => {
    var fecha_inicio = req.query.fecha_inicio || '';
    var fecha_final = req.query.fecha_final || '';

    console.log('fecha_inicio: ', fecha_inicio, 'fecha_final: ', fecha_final);

    const get_reporteProductos = `
                        SELECT 
                            p.cod_producto, p.nombre, p.precio, 
                            COALESCE(SUM(dv.cantidad_item), 0)::integer AS cantidad_total_vendida,
                            COALESCE(SUM(dv.cantidad_item * p.precio), 0)::numeric AS precio_total_vendido
                        FROM public.venta v 
                        JOIN public.detalle_venta dv ON v.cod_venta = dv.cod_venta
                        JOIN public.producto p ON dv.cod_producto = p.cod_producto
                        WHERE to_date(v.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
                        AND to_date($2, 'DD/MM/YYYY') 
                        AND v.estado_documento != 2 
                        AND v.estado_transaccion = 2
                        GROUP BY p.cod_producto, p.nombre
                        ORDER BY cantidad_total_vendida DESC;
    `;


    const get_reporteCosto = `
                    SELECT 
                        i.cod_insumo,
                        i.nombre AS insumo_nombre,
                        COALESCE(SUM(dmi.precio), 0) AS total_costo_insumo,
                        COALESCE(SUM(dmi.cantidad), 0) AS total_cantidad_insumo
                    FROM public.movimiento_insumo mi
                    JOIN public.detalle_movimiento_insumo dmi ON mi.cod_mov = dmi.cod_mov
                    JOIN public.insumo i ON dmi.cod_insumo = i.cod_insumo
                    WHERE mi.movimiento = 2 
                    AND to_date(mi.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
                    AND to_date($2, 'DD/MM/YYYY')
                    GROUP BY i.cod_insumo, i.nombre
                    ORDER BY total_costo_insumo DESC;
    `;

    const client = await pool.connect();
    try {
        // Inicia la transacción
        await client.query('BEGIN');

        // Obtener reporte de productos
        const reporte_productos = await client.query(get_reporteProductos, [fecha_inicio, fecha_final]);
        const productos = reporte_productos.rows;
        console.log('REPORTE PRODUCTOS: ', productos);

        // Obtener reporte de costos de insumos
        const reporte_insumos_costo = await client.query(get_reporteCosto, [fecha_inicio, fecha_final]);
        const insumos = reporte_insumos_costo.rows;
        console.log('REPORTE COSTO INSUMOS: ', insumos);

        // Obtener relación insumos-productos
        const insumos_productos = await client.query(`SELECT * FROM insumo_producto`);
        const relacion = insumos_productos.rows;
        console.log('RELACION INSUMOS_PRODUCTOS: ', relacion);

        // Crear una lista para almacenar el resultado del cruce
        let reporteCostoPorProducto = [];

        // Recorrer los productos vendidos
        productos.forEach(producto => {
            let costo_total_insumos = 0;

            // Encontrar los insumos relacionados con el producto actual
            relacion
                .filter(rel => rel.cod_producto === producto.cod_producto)
                .forEach(rel => {
                    // Encontrar el insumo relacionado en el reporte de costos de insumos
                    const insumo = insumos.find(i => i.cod_insumo === rel.cod_insumo);

                    if (insumo) {
                        // Calcular el costo del insumo usado para este producto
                        const cantidad_usada = rel.cantidad * producto.cantidad_total_vendida;
                        const costo_insumo = (insumo.total_costo_insumo / insumo.total_cantidad_insumo) * cantidad_usada;
                        costo_total_insumos += costo_insumo;
                    }
                });

            // Agregar el producto y su costo total de insumos al reporte final
            reporteCostoPorProducto.push({
                cod_producto: producto.cod_producto,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad_total_vendida: producto.cantidad_total_vendida,
                precio_total_vendido: producto.precio_total_vendido,
                costo_total_insumos: costo_total_insumos
            });
        });

        console.log('REPORTE COSTO POR PRODUCTO: ', reporteCostoPorProducto);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(reporteCostoPorProducto);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
};

const REPORTE_OPCIONES = async (req, res) => {
    var fecha_inicio = req.query.fecha_inicio || '';
    var fecha_final = req.query.fecha_final || '';

    console.log('fecha_inicio: ', fecha_inicio, 'fecha_final: ', fecha_final);

    // Consulta para obtener el reporte de opciones vendidas
    const get_reporteOpciones = `
        SELECT 
            o.cod_opcion, o.nombre, o.descripcion,
            COALESCE(SUM(d.cantidad_op), 0)::integer AS cantidad_total_vendida
        FROM public.venta v
        JOIN public.detalle_venta dv ON v.cod_venta = dv.cod_venta
        JOIN public.detalle_opcion d ON dv.cod_item = d.cod_item
        JOIN public.opcion o ON d.cod_opcion = o.cod_opcion
        JOIN public.producto p ON dv.cod_producto = p.cod_producto
        WHERE to_date(v.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
        AND to_date($2, 'DD/MM/YYYY') 
        AND v.estado_documento != 2 
        AND v.estado_transaccion = 2
        GROUP BY o.cod_opcion, o.nombre
        ORDER BY cantidad_total_vendida DESC;
    `;

    // Consulta para obtener el costo de insumos
    const get_reporteCosto = `
        SELECT 
            i.cod_insumo,
            i.nombre AS insumo_nombre,
            COALESCE(SUM(dmi.precio), 0) AS total_costo_insumo,
            COALESCE(SUM(dmi.cantidad), 0) AS total_cantidad_insumo
        FROM public.movimiento_insumo mi
        JOIN public.detalle_movimiento_insumo dmi ON mi.cod_mov = dmi.cod_mov
        JOIN public.insumo i ON dmi.cod_insumo = i.cod_insumo
        WHERE mi.movimiento = 2 
        AND to_date(mi.fecha, 'DD/MM/YYYY') BETWEEN to_date($1, 'DD/MM/YYYY') 
        AND to_date($2, 'DD/MM/YYYY')
        GROUP BY i.cod_insumo, i.nombre
        ORDER BY total_costo_insumo DESC;
    `;

    const client = await pool.connect();
    try {
        // Inicia la transacción
        await client.query('BEGIN');

        // Obtener reporte de opciones
        const reporte_opciones = await client.query(get_reporteOpciones, [fecha_inicio, fecha_final]);
        const opciones = reporte_opciones.rows;
        console.log('REPORTE OPCIONES: ', opciones);

        // Obtener reporte de costos de insumos
        const reporte_insumos_costo = await client.query(get_reporteCosto, [fecha_inicio, fecha_final]);
        const insumos = reporte_insumos_costo.rows;
        console.log('REPORTE COSTO INSUMOS: ', insumos);

        // Obtener relación insumos-opciones
        const insumos_opciones = await client.query(`SELECT * FROM insumo_opcion`);
        const relacion = insumos_opciones.rows;
        console.log('RELACION INSUMOS_OPCIONES: ', relacion);

        // Crear una lista para almacenar el resultado del cruce
        let reporteCostoPorOpcion = [];

        // Recorrer las opciones vendidas
        opciones.forEach(opcion => {
            let costo_total_insumos = 0;

            // Encontrar los insumos relacionados con la opción actual
            relacion
                .filter(rel => rel.cod_opcion === opcion.cod_opcion)
                .forEach(rel => {
                    // Encontrar el insumo relacionado en el reporte de costos de insumos
                    const insumo = insumos.find(i => i.cod_insumo === rel.cod_insumo);

                    if (insumo) {
                        // Calcular el costo del insumo usado para esta opción
                        const cantidad_usada = rel.cantidad * opcion.cantidad_total_vendida;
                        const costo_insumo = (insumo.total_costo_insumo / insumo.total_cantidad_insumo) * cantidad_usada;
                        costo_total_insumos += costo_insumo;
                    }
                });

            // Agregar la opción y su costo total de insumos al reporte final
            reporteCostoPorOpcion.push({
                cod_opcion: opcion.cod_opcion,
                nombre: opcion.nombre,
                descripcion: opcion.descripcion,
                cantidad_total_vendida: opcion.cantidad_total_vendida,
                precio_total_vendido: opcion.precio_total_vendido,
                costo_total_insumos: costo_total_insumos
            });
        });

        console.log('REPORTE COSTO POR OPCION: ', reporteCostoPorOpcion);

        await client.query('COMMIT'); // Confirma la transacción
        res.status(200).json(reporteCostoPorOpcion);
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK'); // Si hay un error, realiza un rollback
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release(); // Libera la conexión al pool
    }
};




module.exports = {
    REPORTE_VENTAS,
    //
    REPORTE_PRODUCTOS,
    REPORTE_OPCIONES
}