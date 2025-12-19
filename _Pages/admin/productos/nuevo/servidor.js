"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL
const VPS_IMAGE_BASE_URL = process.env.VPS_IMAGE_BASE_URL

export async function obtenerDatosProducto() {
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
            categorias: categorias,
            marcas: marcas,
            unidadesMedida: unidadesMedida
        }

    } catch (error) {
        console.error('Error al obtener datos de producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

async function subirImagenAVPS(imagenBase64) {
    try {
        const base64Data = imagenBase64.split(',')[1]
        const mimeType = imagenBase64.split(';')[0].split(':')[1]
        const extension = mimeType.split('/')[1]
        
        const buffer = Buffer.from(base64Data, 'base64')
        const blob = new Blob([buffer], { type: mimeType })
        const file = new File([blob], `producto_${Date.now()}.${extension}`, { type: mimeType })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'productos')

        const response = await fetch(VPS_UPLOAD_URL, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor VPS')
        }

        const resultado = await response.json()

        if (!resultado.success) {
            throw new Error(resultado.mensaje || 'Error al subir imagen')
        }

        return `${VPS_IMAGE_BASE_URL}/${resultado.filename}`

    } catch (error) {
        console.error('Error al subir imagen a VPS:', error)
        throw error
    }
}

export async function crearProducto(datosProducto) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear productos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        let codigoBarrasFinal = datosProducto.codigo_barras
        let skuFinal = datosProducto.sku

        if (codigoBarrasFinal) {
            let intento = 0
            let existe = true
            
            while (existe && intento < 10) {
                const [existeCodigo] = await connection.execute(
                    `SELECT id FROM productos WHERE codigo_barras = ? AND empresa_id = ?`,
                    [codigoBarrasFinal, empresaId]
                )

                if (existeCodigo.length > 0) {
                    const randomNum = Math.floor(Math.random() * 900000000000) + 100000000000
                    codigoBarrasFinal = randomNum.toString()
                    intento++
                } else {
                    existe = false
                }
            }

            if (existe) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No se pudo generar un codigo de barras unico'
                }
            }
        }

        if (skuFinal) {
            let intento = 0
            let existe = true
            
            while (existe && intento < 10) {
                const [existeSku] = await connection.execute(
                    `SELECT id FROM productos WHERE sku = ? AND empresa_id = ?`,
                    [skuFinal, empresaId]
                )

                if (existeSku.length > 0) {
                    const prefijo = datosProducto.nombre.substring(0, 3).toUpperCase().replace(/\s/g, '')
                    const randomNum = Math.floor(Math.random() * 9000) + 1000
                    skuFinal = `${prefijo}-${randomNum}`
                    intento++
                } else {
                    existe = false
                }
            }

            if (existe) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'No se pudo generar un SKU unico'
                }
            }
        }

        let imagenFinal = datosProducto.imagen_url

        if (datosProducto.imagen_base64 && !datosProducto.imagen_url) {
            try {
                imagenFinal = await subirImagenAVPS(datosProducto.imagen_base64)
            } catch (error) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Error al subir la imagen del producto'
                }
            }
        }

        const [resultado] = await connection.execute(
            `INSERT INTO productos (
                empresa_id,
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
                fecha_vencimiento,
                lote,
                ubicacion_bodega
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
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
                datosProducto.stock,
                datosProducto.stock_minimo,
                datosProducto.stock_maximo,
                imagenFinal,
                datosProducto.aplica_itbis,
                datosProducto.activo,
                datosProducto.fecha_vencimiento,
                datosProducto.lote,
                datosProducto.ubicacion_bodega
            ]
        )

        if (datosProducto.stock > 0) {
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
                ) VALUES (?, ?, 'entrada', ?, 0, ?, 'INVENTARIO_INICIAL', ?, 'Stock inicial del producto')`,
                [empresaId, resultado.insertId, datosProducto.stock, datosProducto.stock, userId]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Producto creado exitosamente',
            productoId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear producto:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el producto'
        }
    }
}