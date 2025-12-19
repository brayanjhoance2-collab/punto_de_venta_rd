"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerEmpresas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                moneda,
                simbolo_moneda,
                impuesto_nombre,
                impuesto_porcentaje,
                activo,
                fecha_creacion
            FROM empresas
            ORDER BY fecha_creacion DESC`
        )

        connection.release()

        return {
            success: true,
            empresas: empresas
        }

    } catch (error) {
        console.error('Error al obtener empresas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar empresas'
        }
    }
}

export async function toggleEstadoEmpresa(empresaId, nuevoEstado) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE empresas SET activo = ? WHERE id = ?`,
            [nuevoEstado, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Empresa ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
        }

    } catch (error) {
        console.error('Error al cambiar estado de empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar estado'
        }
    }
}

export async function crearEmpresa(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [rncExistente] = await connection.execute(
            `SELECT id FROM empresas WHERE rnc = ?`,
            [datos.rnc]
        )

        if (rncExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una empresa con este RNC'
            }
        }

        await connection.execute(
            `INSERT INTO empresas (
                nombre_empresa,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                direccion,
                sector,
                municipio,
                provincia,
                telefono,
                email,
                moneda,
                simbolo_moneda,
                impuesto_nombre,
                impuesto_porcentaje,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                datos.nombre_empresa,
                datos.rnc,
                datos.razon_social,
                datos.nombre_comercial,
                datos.actividad_economica,
                datos.direccion,
                datos.sector,
                datos.municipio,
                datos.provincia,
                datos.telefono || null,
                datos.email || null,
                datos.moneda,
                datos.simbolo_moneda,
                datos.impuesto_nombre,
                datos.impuesto_porcentaje
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Empresa creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la empresa'
        }
    }
}

export async function actualizarEmpresa(empresaId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresaExistente] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [rncDuplicado] = await connection.execute(
            `SELECT id FROM empresas WHERE rnc = ? AND id != ?`,
            [datos.rnc, empresaId]
        )

        if (rncDuplicado.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otra empresa con este RNC'
            }
        }

        await connection.execute(
            `UPDATE empresas SET
                nombre_empresa = ?,
                rnc = ?,
                razon_social = ?,
                nombre_comercial = ?,
                actividad_economica = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                telefono = ?,
                email = ?,
                moneda = ?,
                simbolo_moneda = ?,
                impuesto_nombre = ?,
                impuesto_porcentaje = ?
            WHERE id = ?`,
            [
                datos.nombre_empresa,
                datos.rnc,
                datos.razon_social,
                datos.nombre_comercial,
                datos.actividad_economica,
                datos.direccion,
                datos.sector,
                datos.municipio,
                datos.provincia,
                datos.telefono || null,
                datos.email || null,
                datos.moneda,
                datos.simbolo_moneda,
                datos.impuesto_nombre,
                datos.impuesto_porcentaje,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Empresa actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la empresa'
        }
    }
}

export async function eliminarEmpresa(empresaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresaExistente] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [usuariosAsociados] = await connection.execute(
            `SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = ?`,
            [empresaId]
        )

        if (usuariosAsociados[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar la empresa porque tiene usuarios asociados'
            }
        }

        const [productosAsociados] = await connection.execute(
            `SELECT COUNT(*) as total FROM productos WHERE empresa_id = ?`,
            [empresaId]
        )

        if (productosAsociados[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar la empresa porque tiene productos registrados'
            }
        }

        const [ventasAsociadas] = await connection.execute(
            `SELECT COUNT(*) as total FROM ventas WHERE empresa_id = ?`,
            [empresaId]
        )

        if (ventasAsociadas[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar la empresa porque tiene ventas registradas'
            }
        }

        await connection.execute(
            `DELETE FROM empresas WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Empresa eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la empresa'
        }
    }
}