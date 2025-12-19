"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

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
                activo
            FROM empresas
            ORDER BY nombre_empresa ASC`
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

export async function obtenerUsuarios(empresaId) {
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

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.empresa_id,
                u.nombre,
                u.cedula,
                u.email,
                u.avatar_url,
                u.tipo,
                u.activo,
                u.fecha_creacion,
                e.nombre_empresa
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            WHERE u.empresa_id = ? AND u.tipo != 'superadmin'
            ORDER BY u.fecha_creacion DESC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            usuarios: usuarios
        }

    } catch (error) {
        console.error('Error al obtener usuarios:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar usuarios'
        }
    }
}

export async function crearUsuario(datos) {
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

        const [cedulaExistente] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ?`,
            [datos.cedula]
        )

        if (cedulaExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con esta cedula'
            }
        }

        const [emailExistente] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ?`,
            [datos.email]
        )

        if (emailExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con este email'
            }
        }

        const [empresaExiste] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ? AND activo = TRUE`,
            [datos.empresa_id]
        )

        if (empresaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'La empresa seleccionada no existe o no esta activa'
            }
        }

        const passwordHash = await bcrypt.hash(datos.password, 10)

        await connection.execute(
            `INSERT INTO usuarios (
                empresa_id,
                nombre,
                cedula,
                email,
                password,
                tipo,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [
                datos.empresa_id,
                datos.nombre,
                datos.cedula,
                datos.email,
                passwordHash,
                datos.tipo
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario creado exitosamente'
        }

    } catch (error) {
        console.error('Error al crear usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el usuario'
        }
    }
}

export async function actualizarUsuario(usuarioId, datos) {
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

        const [usuarioExistente] = await connection.execute(
            `SELECT id, tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuarioExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuarioExistente[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes editar usuarios super administradores'
            }
        }

        const [cedulaDuplicada] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ? AND id != ?`,
            [datos.cedula, usuarioId]
        )

        if (cedulaDuplicada.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con esta cedula'
            }
        }

        const [emailDuplicado] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ? AND id != ?`,
            [datos.email, usuarioId]
        )

        if (emailDuplicado.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con este email'
            }
        }

        if (datos.password && datos.password.trim() !== '') {
            const passwordHash = await bcrypt.hash(datos.password, 10)
            
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    password = ?,
                    tipo = ?
                WHERE id = ?`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    passwordHash,
                    datos.tipo,
                    usuarioId
                ]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    tipo = ?
                WHERE id = ?`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    datos.tipo,
                    usuarioId
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el usuario'
        }
    }
}

export async function toggleEstadoUsuario(usuarioId, nuevoEstado) {
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

        const [usuario] = await connection.execute(
            `SELECT tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuario.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuario[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes desactivar usuarios super administradores'
            }
        }

        await connection.execute(
            `UPDATE usuarios SET activo = ? WHERE id = ?`,
            [nuevoEstado, usuarioId]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
        }

    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar estado'
        }
    }
}

export async function eliminarUsuario(usuarioId) {
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

        const [usuarioExistente] = await connection.execute(
            `SELECT tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuarioExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuarioExistente[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes eliminar usuarios super administradores'
            }
        }

        const [ventasAsociadas] = await connection.execute(
            `SELECT COUNT(*) as total FROM ventas WHERE usuario_id = ?`,
            [usuarioId]
        )

        if (ventasAsociadas[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar el usuario porque tiene ventas registradas'
            }
        }

        const [cajasAsociadas] = await connection.execute(
            `SELECT COUNT(*) as total FROM cajas WHERE usuario_id = ?`,
            [usuarioId]
        )

        if (cajasAsociadas[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar el usuario porque tiene cajas registradas'
            }
        }

        await connection.execute(
            `DELETE FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el usuario'
        }
    }
}