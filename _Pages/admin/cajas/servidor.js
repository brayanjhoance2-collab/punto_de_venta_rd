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
            `SELECT 
                c.*,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id THEN v.total ELSE 0 END), 0) as total_ventas_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) as total_efectivo_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'tarjeta_debito' THEN v.total ELSE 0 END), 0) as total_tarjeta_debito_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'tarjeta_credito' THEN v.total ELSE 0 END), 0) as total_tarjeta_credito_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END), 0) as total_transferencia_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'cheque' THEN v.total ELSE 0 END), 0) as total_cheque_real
            FROM cajas c
            LEFT JOIN ventas v ON v.caja_id = c.id AND v.estado = 'emitida'
            WHERE c.empresa_id = ? AND c.usuario_id = ? AND c.estado = 'abierta'
            GROUP BY c.id
            ORDER BY c.fecha_apertura DESC
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

        const caja = {
            ...cajas[0],
            total_ventas: parseFloat(cajas[0].total_ventas_real || 0),
            total_efectivo: parseFloat(cajas[0].total_efectivo_real || 0),
            total_tarjeta_debito: parseFloat(cajas[0].total_tarjeta_debito_real || 0),
            total_tarjeta_credito: parseFloat(cajas[0].total_tarjeta_credito_real || 0),
            total_transferencia: parseFloat(cajas[0].total_transferencia_real || 0),
            total_cheque: parseFloat(cajas[0].total_cheque_real || 0)
        }

        return {
            success: true,
            caja: caja
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

        // Verificar si el usuario ya tiene una caja abierta
        const [cajaUsuario] = await connection.execute(
            `SELECT id, numero_caja FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'`,
            [empresaId, userId]
        )

        if (cajaUsuario.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya tienes una caja abierta',
                cajas: []
            }
        }

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

        // Verificar si el usuario ya tiene una caja abierta
        const [cajaActiva] = await connection.execute(
            `SELECT id, numero_caja FROM cajas 
            WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'`,
            [empresaId, userId]
        )

        if (cajaActiva.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: `Ya tienes la Caja ${cajaActiva[0].numero_caja} abierta. Ciérrala antes de abrir otra.`
            }
        }

        const fechaHoy = new Date().toISOString().split('T')[0]

        // Verificar si la caja ya está ocupada por otro usuario
        const [cajaOcupada] = await connection.execute(
            `SELECT id, numero_caja FROM cajas 
            WHERE empresa_id = ? AND fecha_caja = ? AND numero_caja = ? AND estado = 'abierta'`,
            [empresaId, fechaHoy, datos.numero_caja]
        )

        if (cajaOcupada.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: `La Caja ${datos.numero_caja} ya está en uso por otro usuario`
            }
        }

        // Insertar nueva caja
        const [result] = await connection.execute(
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
            mensaje: `Caja ${datos.numero_caja} abierta exitosamente`,
            cajaId: result.insertId
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

        const [ventas] = await connection.execute(
            `SELECT 
                id,
                ncf,
                total,
                metodo_pago,
                fecha_venta
            FROM ventas 
            WHERE caja_id = ? AND estado = 'emitida'
            ORDER BY fecha_venta DESC`,
            [caja[0].id]
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

        // Obtener caja activa con totales reales
        const [cajaResult] = await connection.execute(
            `SELECT 
                c.*,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id THEN v.total ELSE 0 END), 0) as total_ventas_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) as total_efectivo_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'tarjeta_debito' THEN v.total ELSE 0 END), 0) as total_tarjeta_debito_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'tarjeta_credito' THEN v.total ELSE 0 END), 0) as total_tarjeta_credito_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END), 0) as total_transferencia_real,
                COALESCE(SUM(CASE WHEN v.estado = 'emitida' AND v.caja_id = c.id AND v.metodo_pago = 'cheque' THEN v.total ELSE 0 END), 0) as total_cheque_real,
                COALESCE(SUM(CASE WHEN g.caja_id = c.id THEN g.monto ELSE 0 END), 0) as total_gastos_real
            FROM cajas c
            LEFT JOIN ventas v ON v.caja_id = c.id AND v.estado = 'emitida'
            LEFT JOIN gastos g ON g.caja_id = c.id
            WHERE c.empresa_id = ? AND c.usuario_id = ? AND c.estado = 'abierta'
            GROUP BY c.id
            LIMIT 1`,
            [empresaId, userId]
        )

        if (cajaResult.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No tienes una caja abierta'
            }
        }

        const cajaData = cajaResult[0]
        const totalVentasReal = parseFloat(cajaData.total_ventas_real || 0)
        const totalGastosReal = parseFloat(cajaData.total_gastos_real || 0)
        const esperado = parseFloat(cajaData.monto_inicial) + totalVentasReal - totalGastosReal
        const diferencia = parseFloat(datos.monto_final) - esperado

        // Actualizar la caja
        await connection.execute(
            `UPDATE cajas 
            SET 
                monto_final = ?,
                total_ventas = ?,
                total_efectivo = ?,
                total_tarjeta_debito = ?,
                total_tarjeta_credito = ?,
                total_transferencia = ?,
                total_cheque = ?,
                total_gastos = ?,
                diferencia = ?,
                estado = 'cerrada',
                notas = ?,
                fecha_cierre = NOW()
            WHERE id = ?`,
            [
                datos.monto_final,
                totalVentasReal,
                parseFloat(cajaData.total_efectivo_real || 0),
                parseFloat(cajaData.total_tarjeta_debito_real || 0),
                parseFloat(cajaData.total_tarjeta_credito_real || 0),
                parseFloat(cajaData.total_transferencia_real || 0),
                parseFloat(cajaData.total_cheque_real || 0),
                totalGastosReal,
                diferencia,
                datos.notas,
                cajaData.id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja cerrada exitosamente',
            diferencia: diferencia
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
            `SELECT 
                c.id,
                c.numero_caja,
                c.fecha_caja,
                c.monto_inicial,
                c.monto_final,
                c.total_ventas,
                c.total_efectivo,
                c.total_tarjeta_debito,
                c.total_tarjeta_credito,
                c.total_transferencia,
                c.total_cheque,
                c.total_gastos,
                c.diferencia,
                c.estado,
                c.fecha_apertura,
                c.fecha_cierre,
                c.notas
            FROM cajas c
            WHERE c.empresa_id = ? AND c.usuario_id = ?
            ORDER BY c.fecha_caja DESC, c.fecha_apertura DESC
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
                c.id,
                c.numero_caja,
                c.fecha_caja,
                c.monto_inicial,
                c.monto_final,
                c.total_ventas,
                c.total_efectivo,
                c.total_tarjeta_debito,
                c.total_tarjeta_credito,
                c.total_transferencia,
                c.total_cheque,
                c.total_gastos,
                c.diferencia,
                c.estado,
                c.fecha_apertura,
                c.fecha_cierre,
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