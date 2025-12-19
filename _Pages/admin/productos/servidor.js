"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerProductos() {
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
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                p.precio_compra,
                p.precio_venta,
                p.precio_oferta,
                p.stock,
                p.stock_minimo,
                p.stock_maximo,
                p.imagen_url,
                p.aplica_itbis,
                p.activo,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.abreviatura as unidad_medida_abreviatura
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE p.empresa_id = ?
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        const [categorias] = await connection.execute(
            `SELECT id, nombre
            FROM categorias
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre
            FROM marcas
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            productos: productos,
            categorias: categorias,
            marcas: marcas
        }

    } catch (error) {
        console.error('Error al obtener productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos'
        }
    }
}

export async function eliminarProducto(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar productos'
            }
        }

        connection = await db.getConnection()

        const [producto] = await connection.execute(
            `SELECT id FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        await connection.execute(
            `UPDATE productos SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Producto eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar producto'
        }
    }
}