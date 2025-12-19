"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerCajaActiva() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajas] = await connection.execute(
            `SELECT * FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
            ORDER BY fecha_apertura DESC
            LIMIT 1`,
            [empresaId, userId]
        )

        connection.release()

        if (cajas.length === 0) {
            return {
                success: true,
                caja: null
            }
        }

        return {
            success: true,
            caja: cajas[0]
        }

    } catch (error) {
        console.error('Error al obtener caja activa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar caja'
        }
    }
}

export async function obtenerCajasDisponibles() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [config] = await connection.execute(
            `SELECT name, value FROM settings 
            WHERE empresa_id = ? AND name = 'numero_cajas'`,
            [empresaId]
        )

        const numeroCajas = config.length > 0 ? parseInt(config[0].value) : 1

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [cajasOcupadas] = await connection.execute(
            `SELECT numero_caja FROM cajas 
            WHERE empresa_id = ? AND fecha_caja = ? AND estado = 'abierta'`,
            [empresaId, fechaHoy]
        )

        const ocupadas = cajasOcupadas.map(c => c.numero_caja)
        const disponibles = []

        for (let i = 1; i <= numeroCajas; i++) {
            if (!ocupadas.includes(i)) {
                disponibles.push({ numero: i })
            }
        }

        connection.release()

        return {
            success: true,
            cajas: disponibles
        }

    } catch (error) {
        console.error('Error al obtener cajas disponibles:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar cajas disponibles',
            cajas: []
        }
    }
}

export async function abrirCaja(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajaActiva] = await connection.execute(
            `SELECT id FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'`,
            [empresaId, userId]
        )

        if (cajaActiva.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya tienes una caja abierta'
            }
        }

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [cajaOcupada] = await connection.execute(
            `SELECT id FROM cajas 
            WHERE empresa_id = ? AND fecha_caja = ? AND numero_caja = ? AND estado = 'abierta'`,
            [empresaId, fechaHoy, datos.numero_caja]
        )

        if (cajaOcupada.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Esta caja ya esta en uso'
            }
        }

        await connection.execute(
            `INSERT INTO cajas (
                empresa_id,
                usuario_id,
                numero_caja,
                fecha_caja,
                monto_inicial,
                estado
            ) VALUES (?, ?, ?, ?, ?, 'abierta')`,
            [
                empresaId,
                userId,
                datos.numero_caja,
                fechaHoy,
                datos.monto_inicial
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja abierta exitosamente'
        }

    } catch (error) {
        console.error('Error al abrir caja:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al abrir caja'
        }
    }
}

export async function obtenerVentasCaja() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [caja] = await connection.execute(
            `SELECT id FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
            LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: true,
                ventas: []
            }
        }

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [ventas] = await connection.execute(
            `SELECT 
                id,
                ncf,
                total,
                metodo_pago,
                fecha_venta
            FROM ventas 
            WHERE empresa_id = ? AND usuario_id = ? AND DATE(fecha_venta) = ?
            ORDER BY fecha_venta DESC`,
            [empresaId, userId, fechaHoy]
        )

        connection.release()

        return {
            success: true,
            ventas: ventas
        }

    } catch (error) {
        console.error('Error al obtener ventas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar ventas',
            ventas: []
        }
    }
}

export async function registrarGasto(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [caja] = await connection.execute(
            `SELECT id FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
            LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No tienes una caja abierta'
            }
        }

        await connection.execute(
            `INSERT INTO gastos (
                empresa_id,
                concepto,
                monto,
                categoria,
                usuario_id,
                caja_id,
                comprobante_numero,
                notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datos.concepto,
                datos.monto,
                datos.categoria,
                userId,
                caja[0].id,
                datos.comprobante_numero,
                datos.notas
            ]
        )

        await connection.execute(
            `UPDATE cajas 
            SET total_gastos = total_gastos + ?
            WHERE id = ?`,
            [datos.monto, caja[0].id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto registrado exitosamente'
        }

    } catch (error) {
        console.error('Error al registrar gasto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al registrar gasto'
        }
    }
}

export async function cerrarCaja(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [caja] = await connection.execute(
            `SELECT * FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
            LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No tienes una caja abierta'
            }
        }

        const cajaData = caja[0]
        const esperado = cajaData.monto_inicial + cajaData.total_ventas - cajaData.total_gastos
        const diferencia = datos.monto_final - esperado

        await connection.execute(
            `UPDATE cajas 
            SET 
                monto_final = ?,
                diferencia = ?,
                estado = 'cerrada',
                notas = ?,
                fecha_cierre = NOW()
            WHERE id = ?`,
            [
                datos.monto_final,
                diferencia,
                datos.notas,
                cajaData.id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja cerrada exitosamente'
        }

    } catch (error) {
        console.error('Error al cerrar caja:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cerrar caja'
        }
    }
}

export async function obtenerHistorialCajas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajas] = await connection.execute(
            `SELECT * FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ?
            ORDER BY fecha_caja DESC, fecha_apertura DESC
            LIMIT 50`,
            [empresaId, userId]
        )

        connection.release()

        return {
            success: true,
            cajas: cajas
        }

    } catch (error) {
        console.error('Error al obtener historial:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar historial',
            cajas: []
        }
    }
}

export async function obtenerTodasLasCajas() {
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
                mensaje: 'No tienes permisos'
            }
        }

        connection = await db.getConnection()

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [cajas] = await connection.execute(
            `SELECT 
                c.*,
                u.nombre as usuario_nombre
            FROM cajas c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.empresa_id = ? AND c.fecha_caja = ?
            ORDER BY c.numero_caja ASC`,
            [empresaId, fechaHoy]
        )

        connection.release()

        return {
            success: true,
            cajas: cajas
        }

    } catch (error) {
        console.error('Error al obtener todas las cajas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar cajas',
            cajas: []
        }
    }
}