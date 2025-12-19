"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerConfiguracion() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver la configuracion'
            }
        }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT * FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresas.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        connection.release()

        return {
            success: true,
            empresa: empresas[0]
        }

    } catch (error) {
        console.error('Error al obtener configuracion:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar configuracion'
        }
    }
}

export async function actualizarEmpresa(datosEmpresa) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar la configuracion'
            }
        }

        connection = await db.getConnection()

        const [empresaExiste] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
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
                impuesto_porcentaje = ?,
                mensaje_factura = ?
            WHERE id = ?`,
            [
                datosEmpresa.nombre_empresa.trim(),
                datosEmpresa.rnc.trim(),
                datosEmpresa.razon_social.trim(),
                datosEmpresa.nombre_comercial?.trim() || null,
                datosEmpresa.actividad_economica?.trim() || null,
                datosEmpresa.direccion?.trim() || null,
                datosEmpresa.sector?.trim() || null,
                datosEmpresa.municipio?.trim() || null,
                datosEmpresa.provincia || null,
                datosEmpresa.telefono?.trim() || null,
                datosEmpresa.email?.trim() || null,
                datosEmpresa.moneda || 'DOP',
                datosEmpresa.simbolo_moneda || 'RD$',
                datosEmpresa.impuesto_nombre?.trim() || 'ITBIS',
                parseFloat(datosEmpresa.impuesto_porcentaje) || 18.00,
                datosEmpresa.mensaje_factura?.trim() || null,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Configuracion actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la configuracion'
        }
    }
}

export async function obtenerMonedas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [monedas] = await connection.execute(
            `SELECT * FROM monedas ORDER BY activo DESC, nombre ASC`
        )

        connection.release()

        return {
            success: true,
            monedas: monedas
        }

    } catch (error) {
        console.error('Error al obtener monedas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar monedas',
            monedas: []
        }
    }
}

export async function crearMoneda(datosMoneda) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear monedas'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM monedas WHERE codigo = ?`,
            [datosMoneda.codigo.toUpperCase()]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de moneda ya existe'
            }
        }

        await connection.execute(
            `INSERT INTO monedas (codigo, nombre, simbolo, activo) VALUES (?, ?, ?, ?)`,
            [
                datosMoneda.codigo.toUpperCase().trim(),
                datosMoneda.nombre.trim(),
                datosMoneda.simbolo.trim(),
                datosMoneda.activo
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la moneda'
        }
    }
}

export async function actualizarMoneda(id, datosMoneda) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar monedas'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM monedas WHERE codigo = ? AND id != ?`,
            [datosMoneda.codigo.toUpperCase(), id]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de moneda ya existe'
            }
        }

        await connection.execute(
            `UPDATE monedas SET codigo = ?, nombre = ?, simbolo = ?, activo = ? WHERE id = ?`,
            [
                datosMoneda.codigo.toUpperCase().trim(),
                datosMoneda.nombre.trim(),
                datosMoneda.simbolo.trim(),
                datosMoneda.activo,
                id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la moneda'
        }
    }
}

export async function eliminarMoneda(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar monedas'
            }
        }

        connection = await db.getConnection()

        const [enUso] = await connection.execute(
            `SELECT id FROM empresas WHERE moneda = (SELECT codigo FROM monedas WHERE id = ?)`,
            [id]
        )

        if (enUso.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar, la moneda esta en uso'
            }
        }

        await connection.execute(
            `DELETE FROM monedas WHERE id = ?`,
            [id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la moneda'
        }
    }
}

export async function obtenerUnidadesMedida() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [unidades] = await connection.execute(
            `SELECT * FROM unidades_medida ORDER BY activo DESC, nombre ASC`
        )

        connection.release()

        return {
            success: true,
            unidades: unidades
        }

    } catch (error) {
        console.error('Error al obtener unidades:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar unidades',
            unidades: []
        }
    }
}

export async function crearUnidadMedida(datosUnidad) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear unidades'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ?`,
            [datosUnidad.codigo.toUpperCase()]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de unidad ya existe'
            }
        }

        await connection.execute(
            `INSERT INTO unidades_medida (codigo, nombre, abreviatura, activo) VALUES (?, ?, ?, ?)`,
            [
                datosUnidad.codigo.toUpperCase().trim(),
                datosUnidad.nombre.trim(),
                datosUnidad.abreviatura.trim(),
                datosUnidad.activo
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la unidad'
        }
    }
}

export async function actualizarUnidadMedida(id, datosUnidad) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar unidades'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ? AND id != ?`,
            [datosUnidad.codigo.toUpperCase(), id]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de unidad ya existe'
            }
        }

        await connection.execute(
            `UPDATE unidades_medida SET codigo = ?, nombre = ?, abreviatura = ?, activo = ? WHERE id = ?`,
            [
                datosUnidad.codigo.toUpperCase().trim(),
                datosUnidad.nombre.trim(),
                datosUnidad.abreviatura.trim(),
                datosUnidad.activo,
                id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la unidad'
        }
    }
}

export async function eliminarUnidadMedida(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar unidades'
            }
        }

        connection = await db.getConnection()

        const [enUso] = await connection.execute(
            `SELECT id FROM productos WHERE unidad_medida_id = ?`,
            [id]
        )

        if (enUso.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar, la unidad esta en uso'
            }
        }

        await connection.execute(
            `DELETE FROM unidades_medida WHERE id = ?`,
            [id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la unidad'
        }
    }
}