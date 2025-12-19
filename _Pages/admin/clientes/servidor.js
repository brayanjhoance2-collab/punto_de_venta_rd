"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerClientes() {
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
                c.tipo_documento_id,
                c.numero_documento,
                c.nombre,
                c.apellidos,
                c.telefono,
                c.email,
                c.direccion,
                c.sector,
                c.municipio,
                c.provincia,
                c.fecha_nacimiento,
                c.genero,
                c.total_compras,
                c.puntos_fidelidad,
                c.activo,
                td.codigo as tipo_documento_codigo,
                td.nombre as tipo_documento_nombre
            FROM clientes c
            INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
            WHERE c.empresa_id = ?
            ORDER BY c.nombre ASC`,
            [empresaId]
        )

        const [tiposDocumento] = await connection.execute(
            `SELECT id, codigo, nombre, longitud_min, longitud_max
            FROM tipos_documento
            WHERE activo = TRUE
            ORDER BY codigo ASC`
        )

        connection.release()

        return {
            success: true,
            clientes: clientes,
            tiposDocumento: tiposDocumento
        }

    } catch (error) {
        console.error('Error al obtener clientes:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar clientes'
        }
    }
}

export async function crearCliente(datosCliente) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear clientes'
            }
        }

        connection = await db.getConnection()

        const [existeDocumento] = await connection.execute(
            `SELECT id FROM clientes 
            WHERE numero_documento = ? AND empresa_id = ?`,
            [datosCliente.numero_documento, empresaId]
        )

        if (existeDocumento.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un cliente con ese numero de documento'
            }
        }

        const [resultado] = await connection.execute(
            `INSERT INTO clientes (
                empresa_id,
                tipo_documento_id,
                numero_documento,
                nombre,
                apellidos,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                fecha_nacimiento,
                genero,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                empresaId,
                datosCliente.tipo_documento_id,
                datosCliente.numero_documento,
                datosCliente.nombre,
                datosCliente.apellidos,
                datosCliente.telefono,
                datosCliente.email,
                datosCliente.direccion,
                datosCliente.sector,
                datosCliente.municipio,
                datosCliente.provincia,
                datosCliente.fecha_nacimiento,
                datosCliente.genero
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Cliente creado exitosamente',
            clienteId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear cliente:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el cliente'
        }
    }
}

export async function actualizarCliente(datosCliente) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar clientes'
            }
        }

        connection = await db.getConnection()

        const [clienteExiste] = await connection.execute(
            `SELECT id FROM clientes WHERE id = ? AND empresa_id = ?`,
            [datosCliente.cliente_id, empresaId]
        )

        if (clienteExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Cliente no encontrado'
            }
        }

        const [existeDocumento] = await connection.execute(
            `SELECT id FROM clientes 
            WHERE numero_documento = ? AND empresa_id = ? AND id != ?`,
            [datosCliente.numero_documento, empresaId, datosCliente.cliente_id]
        )

        if (existeDocumento.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro cliente con ese numero de documento'
            }
        }

        await connection.execute(
            `UPDATE clientes SET
                tipo_documento_id = ?,
                numero_documento = ?,
                nombre = ?,
                apellidos = ?,
                telefono = ?,
                email = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                fecha_nacimiento = ?,
                genero = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosCliente.tipo_documento_id,
                datosCliente.numero_documento,
                datosCliente.nombre,
                datosCliente.apellidos,
                datosCliente.telefono,
                datosCliente.email,
                datosCliente.direccion,
                datosCliente.sector,
                datosCliente.municipio,
                datosCliente.provincia,
                datosCliente.fecha_nacimiento,
                datosCliente.genero,
                datosCliente.cliente_id,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Cliente actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar cliente:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el cliente'
        }
    }
}

export async function eliminarCliente(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar clientes'
            }
        }

        connection = await db.getConnection()

        const [cliente] = await connection.execute(
            `SELECT id FROM clientes WHERE id = ? AND empresa_id = ?`,
            [clienteId, empresaId]
        )

        if (cliente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Cliente no encontrado'
            }
        }

        const [tieneVentas] = await connection.execute(
            `SELECT COUNT(*) as total FROM ventas WHERE cliente_id = ?`,
            [clienteId]
        )

        if (tieneVentas[0].total > 0) {
            await connection.execute(
                `UPDATE clientes SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
                [clienteId, empresaId]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Cliente desactivado exitosamente (tiene ventas asociadas)'
            }
        }

        await connection.execute(
            `DELETE FROM clientes WHERE id = ? AND empresa_id = ?`,
            [clienteId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Cliente eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar cliente:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el cliente'
        }
    }
}