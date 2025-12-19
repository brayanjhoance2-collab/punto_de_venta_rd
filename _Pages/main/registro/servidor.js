"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'

export async function registrarUsuario(formData) {
    let connection
    try {
        const { nombre, cedula, email, telefono, password, nombreEmpresa, rnc, razonSocial } = formData

        if (!nombre || !cedula || !email || !telefono || !password || !nombreEmpresa || !rnc || !razonSocial) {
            return {
                success: false,
                mensaje: 'Todos los campos son requeridos'
            }
        }

        connection = await db.getConnection()

        const [emailExiste] = await connection.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        )

        if (emailExiste.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El email ya esta registrado'
            }
        }

        const [rncExiste] = await connection.execute(
            'SELECT id FROM solicitudes_registro WHERE rnc = ? AND estado = "pendiente"',
            [rnc]
        )

        if (rncExiste.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una solicitud pendiente con este RNC'
            }
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const [resultado] = await connection.execute(
            `INSERT INTO solicitudes_registro (
                nombre,
                cedula,
                email,
                password,
                telefono,
                nombre_empresa,
                rnc,
                razon_social,
                estado,
                fecha_solicitud
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
            [nombre, cedula, email, passwordHash, telefono, nombreEmpresa, rnc, razonSocial]
        )

        const solicitudId = resultado.insertId

        const [configSuperAdmin] = await connection.execute(
            `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
        )

        connection.release()

        const telefonoSuperAdmin = configSuperAdmin[0]?.telefono_whatsapp

        let whatsappUrl = null

        if (telefonoSuperAdmin) {
            const mensaje = `
Hola, soy *${nombre}* y acabo de registrarme en *IziWeek*.

*Mis datos personales:*
- Nombre: ${nombre}
- Cedula: ${cedula}
- Email: ${email}
- Telefono: ${telefono}

*Datos de mi empresa:*
- Nombre: ${nombreEmpresa}
- RNC: ${rnc}
- Razon Social: ${razonSocial}

Por favor, podrian activar mi cuenta para empezar a usar el sistema?

Gracias!
            `.trim()

            const mensajeEncoded = encodeURIComponent(mensaje)
            whatsappUrl = `https://wa.me/${telefonoSuperAdmin}?text=${mensajeEncoded}`
        }

        return {
            success: true,
            mensaje: 'Solicitud enviada exitosamente',
            solicitudId: solicitudId,
            whatsappUrl: whatsappUrl
        }

    } catch (error) {
        console.error('Error al registrar usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }
    }
}