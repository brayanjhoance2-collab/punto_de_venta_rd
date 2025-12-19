"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { iniciarSesion, obtenerCopyright } from './servidor'
import estilos from './login.module.css'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [tema, setTema] = useState('light')
    const [copyright, setCopyright] = useState('© 2025 IziWeek. Todos los derechos reservados.')

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        const cargarCopyright = async () => {
            const resultado = await obtenerCopyright()
            if (resultado.success && resultado.copyright) {
                setCopyright(resultado.copyright)
            }
        }
        cargarCopyright()
    }, [])

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            const resultado = await iniciarSesion(email, password)

            if (resultado.success) {
                if (resultado.tipo === 'superadmin') {
                    router.push('/superadmin')
                } else if (resultado.tipo === 'admin') {
                    router.push('/admin')
                } else if (resultado.tipo === 'vendedor') {
                    router.push('/vendedor')
                }
            } else {
                setError(resultado.mensaje || 'Error al iniciar sesion')
            }
        } catch (error) {
            setError('Error al procesar la solicitud')
            console.error('Error en login:', error)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.caja} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>Iniciar Sesion</h1>
                    <p className={estilos.subtitulo}>Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={estilos.campo}>
                        <label htmlFor="email" className={estilos.label}>
                            Correo Electronico
                        </label>
                        <div className={estilos.inputWrapper}>
                            <ion-icon name="mail-outline"></ion-icon>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className={estilos.input}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label htmlFor="password" className={estilos.label}>
                            Contrasena
                        </label>
                        <div className={estilos.inputWrapper}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            <input
                                type={mostrarPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tu contrasena"
                                className={estilos.input}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className={estilos.togglePassword}
                                aria-label={mostrarPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                            >
                                <ion-icon name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                            </button>
                        </div>
                    </div>

                    <div className={estilos.opciones}>
                        <Link href="/recuperar-password" className={estilos.enlaceRecuperar}>
                            Olvidaste tu contrasena?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={estilos.botonSubmit}
                    >
                        {cargando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>Iniciando sesion...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="log-in-outline"></ion-icon>
                                <span>Iniciar Sesion</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={estilos.footer}>
                    <p className={estilos.textoRegistro}>
                        No tienes una cuenta?{' '}
                        <Link href="/registro" className={estilos.enlaceRegistro}>
                            Registrate aqui
                        </Link>
                    </p>
                    <p className={estilos.copyright}>{copyright}</p>
                </div>
            </div>
        </div>
    )
}