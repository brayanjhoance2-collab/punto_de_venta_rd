"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerProducto(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
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
                descripcion,
                categoria_id,
                marca_id,
                unidad_medida_id,
                precio_compra,
                precio_venta,
                precio_oferta,
                precio_mayorista,
                cantidad_mayorista,
                stock,
                stock_minimo,
                stock_maximo,
                imagen_url,
                aplica_itbis,
                activo,
                DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') as fecha_vencimiento,
                lote,
                ubicacion_bodega
            FROM productos 
            WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (productos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        const [categorias] = await connection.execute(
            `SELECT id, nombre FROM categorias WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre FROM marcas WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre ASC`,
            [empresaId]
        )

        const [unidadesMedida] = await connection.execute(
            `SELECT id, codigo, nombre, abreviatura FROM unidades_medida WHERE activo = TRUE ORDER BY nombre ASC`
        )

        connection.release()

        return {
            success: true,
            producto: productos[0],
            categorias: categorias,
            marcas: marcas,
            unidadesMedida: unidadesMedida
        }

    } catch (error) {
        console.error('Error al obtener producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar producto'
        }
    }
}

export async function actualizarProducto(productoId, datosProducto) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar productos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [productoExistente] = await connection.execute(
            `SELECT id, stock FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (productoExistente.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        let codigoBarrasFinal = datosProducto.codigo_barras
        let skuFinal = datosProducto.sku

        if (codigoBarrasFinal) {
            const [existeCodigo] = await connection.execute(
                `SELECT id FROM productos WHERE codigo_barras = ? AND empresa_id = ? AND id != ?`,
                [codigoBarrasFinal, empresaId, productoId]
            )

            if (existeCodigo.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'El codigo de barras ya existe en otro producto'
                }
            }
        }

        if (skuFinal) {
            const [existeSku] = await connection.execute(
                `SELECT id FROM productos WHERE sku = ? AND empresa_id = ? AND id != ?`,
                [skuFinal, empresaId, productoId]
            )

            if (existeSku.length > 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'El SKU ya existe en otro producto'
                }
            }
        }

        let imagenFinal = datosProducto.imagen_url

        if (datosProducto.imagen_base64 && !datosProducto.imagen_url) {
            imagenFinal = datosProducto.imagen_base64
        }

        await connection.execute(
            `UPDATE productos SET
                codigo_barras = ?,
                sku = ?,
                nombre = ?,
                descripcion = ?,
                categoria_id = ?,
                marca_id = ?,
                unidad_medida_id = ?,
                precio_compra = ?,
                precio_venta = ?,
                precio_oferta = ?,
                precio_mayorista = ?,
                cantidad_mayorista = ?,
                stock_minimo = ?,
                stock_maximo = ?,
                imagen_url = ?,
                aplica_itbis = ?,
                activo = ?,
                fecha_vencimiento = ?,
                lote = ?,
                ubicacion_bodega = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ? AND empresa_id = ?`,
            [
                codigoBarrasFinal,
                skuFinal,
                datosProducto.nombre,
                datosProducto.descripcion,
                datosProducto.categoria_id,
                datosProducto.marca_id,
                datosProducto.unidad_medida_id,
                datosProducto.precio_compra,
                datosProducto.precio_venta,
                datosProducto.precio_oferta,
                datosProducto.precio_mayorista,
                datosProducto.cantidad_mayorista,
                datosProducto.stock_minimo,
                datosProducto.stock_maximo,
                imagenFinal,
                datosProducto.aplica_itbis,
                datosProducto.activo,
                datosProducto.fecha_vencimiento,
                datosProducto.lote,
                datosProducto.ubicacion_bodega,
                productoId,
                empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Producto actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar producto:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el producto'
        }
    }
}