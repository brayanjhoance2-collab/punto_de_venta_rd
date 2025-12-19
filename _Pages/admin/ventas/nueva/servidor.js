"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosVenta() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [empresa] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                impuesto_nombre,
                impuesto_porcentaje,
                simbolo_moneda
            FROM empresas
            WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        if (empresa.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [tiposComprobante] = await connection.execute(
            `SELECT 
                id,
                codigo,
                nombre,
                prefijo_ncf,
                requiere_rnc,
                requiere_razon_social
            FROM tipos_comprobante
            WHERE activo = TRUE
            ORDER BY codigo ASC`
        )

        const [tiposDocumento] = await connection.execute(
            `SELECT 
                id,
                codigo,
                nombre
            FROM tipos_documento
            WHERE activo = TRUE
            ORDER BY codigo ASC`
        )

        connection.release()

        return {
            success: true,
            empresa: empresa[0],
            tiposComprobante: tiposComprobante,
            tiposDocumento: tiposDocumento
        }

    } catch (error) {
        console.error('Error al obtener datos de venta:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function buscarProductos(termino) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                id,
                codigo_barras,
                sku,
                nombre,
                precio_venta,
                stock,
                aplica_itbis
            FROM productos
            WHERE empresa_id = ?
            AND activo = TRUE
            AND (
                nombre LIKE ? OR
                codigo_barras LIKE ? OR
                sku LIKE ?
            )
            AND stock > 0
            ORDER BY nombre ASC
            LIMIT 20`,
            [empresaId, `%${termino}%`, `%${termino}%`, `%${termino}%`]
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al buscar productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al buscar productos'
        }
    }
}

export async function buscarClientes(termino) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [clientes] = await connection.execute(
            `SELECT 
                c.id,
                c.nombre,
                c.numero_documento,
                td.codigo as tipo_documento
            FROM clientes c
            INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE c.empresa_id = ?
            AND c.activo = TRUE
            AND (
                c.nombre LIKE ? OR
                c.numero_documento LIKE ?
            )
            ORDER BY c.nombre ASC
            LIMIT 20`,
            [empresaId, `%${termino}%`, `%${termino}%`]
        )

        connection.release()

        return {
            success: true,
            clientes: clientes
        }

    } catch (error) {
        console.error('Error al buscar clientes:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al buscar clientes'
        }
    }
}

export async function crearClienteRapido(nombre) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [tipoDocCedula] = await connection.execute(
            `SELECT id FROM tipos_documento WHERE codigo = 'CED' LIMIT 1`
        )

        if (tipoDocCedula.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de documento no encontrado'
            }
        }

        const timestamp = Date.now()
        const numeroDocumentoTemporal = `TEMP${timestamp}`

        const [resultado] = await connection.execute(
            `INSERT INTO clientes (
                empresa_id,
                tipo_documento_id,
                numero_documento,
                nombre,
                activo
            ) VALUES (?, ?, ?, ?, TRUE)`,
            [empresaId, tipoDocCedula[0].id, numeroDocumentoTemporal, nombre]
        )

        const [nuevoCliente] = await connection.execute(
            `SELECT 
                c.id,
                c.nombre,
                c.numero_documento,
                td.codigo as tipo_documento
            FROM clientes c
            INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE c.id = ?`,
            [resultado.insertId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Cliente creado exitosamente',
            cliente: nuevoCliente[0]
        }

    } catch (error) {
        console.error('Error al crear cliente rapido:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el cliente'
        }
    }
}

export async function crearVenta(datosVenta) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [tipoComprobante] = await connection.execute(
            `SELECT 
                id,
                codigo,
                prefijo_ncf,
                secuencia_actual,
                secuencia_hasta
            FROM tipos_comprobante
            WHERE id = ?`,
            [datosVenta.tipo_comprobante_id]
        )

        if (tipoComprobante.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de comprobante no encontrado'
            }
        }

        const secuenciaActual = tipoComprobante[0].secuencia_actual
        const secuenciaHasta = tipoComprobante[0].secuencia_hasta

        if (secuenciaActual > secuenciaHasta) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Se agotaron los NCF disponibles para este tipo de comprobante'
            }
        }

        const ncf = `${tipoComprobante[0].prefijo_ncf}${String(secuenciaActual).padStart(8, '0')}`

        await connection.execute(
            `UPDATE tipos_comprobante 
            SET secuencia_actual = secuencia_actual + 1 
            WHERE id = ?`,
            [datosVenta.tipo_comprobante_id]
        )

        const [ultimaVenta] = await connection.execute(
            `SELECT MAX(CAST(SUBSTRING(numero_interno, 6) AS UNSIGNED)) as ultimo_numero
            FROM ventas
            WHERE empresa_id = ?`,
            [empresaId]
        )

        const numeroInterno = `VENTA${String((ultimaVenta[0].ultimo_numero || 0) + 1).padStart(6, '0')}`

        for (const producto of datosVenta.productos) {
            const [stockActual] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ? AND empresa_id = ?`,
                [producto.producto_id, empresaId]
            )

            if (stockActual.length === 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                }
            }

            if (stockActual[0].stock < producto.cantidad_despachar) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: `Stock insuficiente para el producto ID ${producto.producto_id}`
                }
            }
        }

        const hayDespachoParcial = datosVenta.tipo_entrega === 'parcial'
        const despachoCompleto = !hayDespachoParcial

        const [resultadoVenta] = await connection.execute(
            `INSERT INTO ventas (
                empresa_id,
                tipo_comprobante_id,
                ncf,
                numero_interno,
                usuario_id,
                cliente_id,
                subtotal,
                descuento,
                monto_gravado,
                itbis,
                total,
                metodo_pago,
                tipo_entrega,
                despacho_completo,
                efectivo_recibido,
                cambio,
                estado,
                notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'emitida', ?)`,
            [
                empresaId,
                datosVenta.tipo_comprobante_id,
                ncf,
                numeroInterno,
                userId,
                datosVenta.cliente_id,
                datosVenta.subtotal,
                datosVenta.descuento,
                datosVenta.monto_gravado,
                datosVenta.itbis,
                datosVenta.total,
                datosVenta.metodo_pago,
                datosVenta.tipo_entrega,
                despachoCompleto,
                datosVenta.efectivo_recibido,
                datosVenta.cambio,
                datosVenta.notas
            ]
        )

        const ventaId = resultadoVenta.insertId

        for (const producto of datosVenta.productos) {
            const subtotalProducto = producto.cantidad * producto.precio_unitario
            const montoGravado = subtotalProducto
            const [empresa] = await connection.execute(
                `SELECT impuesto_porcentaje FROM empresas WHERE id = ?`,
                [empresaId]
            )
            const itbisProducto = (montoGravado * parseFloat(empresa[0].impuesto_porcentaje)) / 100
            const totalProducto = subtotalProducto + itbisProducto

            const cantidadDespachada = producto.cantidad_despachar
            const cantidadPendiente = producto.cantidad - producto.cantidad_despachar

            await connection.execute(
                `INSERT INTO detalle_ventas (
                    venta_id,
                    producto_id,
                    cantidad,
                    cantidad_despachada,
                    cantidad_pendiente,
                    precio_unitario,
                    subtotal,
                    descuento,
                    monto_gravado,
                    itbis,
                    total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    ventaId,
                    producto.producto_id,
                    producto.cantidad,
                    cantidadDespachada,
                    cantidadPendiente,
                    producto.precio_unitario,
                    subtotalProducto,
                    montoGravado,
                    itbisProducto,
                    totalProducto
                ]
            )

            await connection.execute(
                `UPDATE productos 
                SET stock = stock - ? 
                WHERE id = ? AND empresa_id = ?`,
                [cantidadDespachada, producto.producto_id, empresaId]
            )

            const [productoActualizado] = await connection.execute(
                `SELECT stock FROM productos WHERE id = ?`,
                [producto.producto_id]
            )

            await connection.execute(
                `INSERT INTO movimientos_inventario (
                    empresa_id,
                    producto_id,
                    tipo,
                    cantidad,
                    stock_anterior,
                    stock_nuevo,
                    referencia,
                    usuario_id,
                    notas
                ) VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    producto.producto_id,
                    cantidadDespachada,
                    productoActualizado[0].stock + cantidadDespachada,
                    productoActualizado[0].stock,
                    ncf,
                    userId,
                    `Venta ${numeroInterno}`
                ]
            )
        }

        if (hayDespachoParcial) {
            const [resultadoDespacho] = await connection.execute(
                `INSERT INTO despachos (
                    venta_id,
                    numero_despacho,
                    usuario_id,
                    observaciones,
                    estado
                ) VALUES (?, 1, ?, 'Despacho inicial parcial', 'activo')`,
                [ventaId, userId]
            )

            const despachoId = resultadoDespacho.insertId

            const [detallesVenta] = await connection.execute(
                `SELECT id, cantidad_despachada
                FROM detalle_ventas
                WHERE venta_id = ?`,
                [ventaId]
            )

            for (const detalle of detallesVenta) {
                if (detalle.cantidad_despachada > 0) {
                    await connection.execute(
                        `INSERT INTO detalle_despachos (
                            despacho_id,
                            detalle_venta_id,
                            cantidad_despachada
                        ) VALUES (?, ?, ?)`,
                        [despachoId, detalle.id, detalle.cantidad_despachada]
                    )
                }
            }
        }

        const fechaHoy = new Date().toISOString().split('T')[0]
        await connection.execute(
            `UPDATE cajas 
            SET total_ventas = total_ventas + ? 
            WHERE empresa_id = ? 
            AND usuario_id = ? 
            AND fecha_caja = ?
            AND estado = 'abierta'`,
            [datosVenta.total, empresaId, userId, fechaHoy]
        )

        if (datosVenta.metodo_pago === 'mixto' && datosVenta.montos_metodos) {
            for (const [metodo, monto] of Object.entries(datosVenta.montos_metodos)) {
                const columna = `total_${metodo}`
                await connection.execute(
                    `UPDATE cajas 
                    SET ${columna} = ${columna} + ? 
                    WHERE empresa_id = ? 
                    AND usuario_id = ? 
                    AND fecha_caja = ?
                    AND estado = 'abierta'`,
                    [parseFloat(monto), empresaId, userId, fechaHoy]
                )
            }
        } else {
            const columna = `total_${datosVenta.metodo_pago}`
            await connection.execute(
                `UPDATE cajas 
                SET ${columna} = ${columna} + ? 
                WHERE empresa_id = ? 
                AND usuario_id = ? 
                AND fecha_caja = ?
                AND estado = 'abierta'`,
                [datosVenta.total, empresaId, userId, fechaHoy]
            )
        }

        if (datosVenta.cliente_id) {
            await connection.execute(
                `UPDATE clientes 
                SET total_compras = total_compras + ? 
                WHERE id = ? AND empresa_id = ?`,
                [datosVenta.total, datosVenta.cliente_id, empresaId]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Venta creada exitosamente',
            venta: {
                id: ventaId,
                ncf: ncf,
                numero_interno: numeroInterno
            }
        }

    } catch (error) {
        console.error('Error al crear venta:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la venta'
        }
    }
}