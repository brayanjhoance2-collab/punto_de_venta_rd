"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosAdmin, cerrarSesion } from './servidor'
import estilos from './header.module.css'

export default function HeaderAdmin() {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)

    const navegacionPrincipal = [
        { href: '/admin/ventas', icon: 'cart-outline', label: 'Ventas' },
        { href: '/admin/productos', icon: 'cube-outline', label: 'Productos' },
        { href: '/admin/clientes', icon: 'people-outline', label: 'Clientes' },
        { href: '/admin/dashboard', icon: 'speedometer-outline', label: 'Dashboard' }
    ]

    const navegacionMenu = [
        { href: '/admin/inventario', icon: 'file-tray-stacked-outline', label: 'Inventario' },
        { href: '/admin/compras', icon: 'bag-handle-outline', label: 'Compras' },
        { href: '/admin/proveedores', icon: 'business-outline', label: 'Proveedores' },
        { href: '/admin/categorias', icon: 'apps-outline', label: 'Categorias' },
        { href: '/admin/marcas', icon: 'pricetag-outline', label: 'Marcas' },
        { href: '/admin/cajas', icon: 'cash-outline', label: 'Cajas' },
        { href: '/admin/gastos', icon: 'wallet-outline', label: 'Gastos' },
        { href: '/admin/reportes', icon: 'stats-chart-outline', label: 'Reportes' },
        { href: '/admin/usuarios', icon: 'person-outline', label: 'Usuarios' },
        { href: '/admin/configuracion', icon: 'settings-outline', label: 'Configuracion' }
    ]

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
        const cargarDatos = async () => {
            try {
                const resultado = await obtenerDatosAdmin()
                if (resultado.success) {
                    setDatosUsuario(resultado.usuario)
                    setDatosEmpresa(resultado.empresa)
                    setLogoPlataforma(resultado.logoPlataforma)
                } else {
                    router.push('/login')
                }
            } catch (error) {
                console.error('Error al cargar datos del header:', error)
                router.push('/login')
            } finally {
                setCargando(false)
            }
        }
        cargarDatos()
    }, [router])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (menuUsuarioAbierto && !e.target.closest(`.${estilos.usuario}`)) {
                setMenuUsuarioAbierto(false)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [menuUsuarioAbierto])

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto)
    }

    const cerrarMenu = () => {
        setMenuAbierto(false)
    }

    const toggleMenuUsuario = (e) => {
        e.stopPropagation()
        setMenuUsuarioAbierto(!menuUsuarioAbierto)
    }

    const toggleTema = () => {
        const nuevoTema = tema === 'light' ? 'dark' : 'light'
        setTema(nuevoTema)
        localStorage.setItem('tema', nuevoTema)
        window.dispatchEvent(new Event('temaChange'))
    }

    const manejarCerrarSesion = async () => {
        await cerrarSesion()
        router.push('/login')
    }

    const obtenerTipoUsuario = () => {
        if (!datosUsuario) return ''
        if (datosUsuario.tipo === 'admin') return 'Administrador'
        if (datosUsuario.tipo === 'vendedor') return 'Vendedor'
        return datosUsuario.tipo
    }

    if (cargando) {
        return (
            <header className={`${estilos.header} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <div className={estilos.cargando}>Cargando...</div>
                </div>
            </header>
        )
    }

    return (
        <>
            <header className={`${estilos.header} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <button 
                        className={estilos.botonMenu}
                        onClick={toggleMenu}
                        aria-label="Abrir menu"
                    >
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>

                    <Link href="/admin" className={estilos.logo}>
                        {logoPlataforma ? (
                            <img 
                                src={logoPlataforma} 
                                alt="Logo"
                                className={estilos.logoImagen}
                            />
                        ) : (
                            <span className={estilos.logoTexto}>Sistema POS</span>
                        )}
                    </Link>

                    <nav className={estilos.navDesktop}>
                        {navegacionPrincipal.map((item) => {
                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                            
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={`${estilos.navItem} ${esActivo ? estilos.activo : ''}`}
                                >
                                    <ion-icon name={item.icon}></ion-icon>
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className={estilos.acciones}>
                        <button 
                            className={estilos.botonTema}
                            onClick={toggleTema}
                            aria-label="Cambiar tema"
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                        </button>

                        <div className={estilos.usuario} onClick={toggleMenuUsuario}>
                            {datosUsuario?.avatar_url ? (
                                <img 
                                    src={datosUsuario.avatar_url} 
                                    alt={datosUsuario.nombre}
                                    className={estilos.avatar}
                                />
                            ) : (
                                <div className={estilos.avatarDefault}>
                                    <ion-icon name="person-outline"></ion-icon>
                                </div>
                            )}
                            <div className={estilos.usuarioInfo}>
                                <span className={estilos.nombreUsuario}>{datosUsuario?.nombre}</span>
                                <span className={estilos.tipoUsuario}>{obtenerTipoUsuario()}</span>
                            </div>
                            <ion-icon name="chevron-down-outline" className={estilos.chevronIcon}></ion-icon>

                            {menuUsuarioAbierto && (
                                <div className={`${estilos.menuDesplegable} ${estilos[tema]}`}>
                                    <Link 
                                        href="/admin/perfil"
                                        className={estilos.menuDesplegableItem}
                                        onClick={() => setMenuUsuarioAbierto(false)}
                                    >
                                        <ion-icon name="person-circle-outline"></ion-icon>
                                        <span>Mi Perfil</span>
                                    </Link>

                                    <div className={estilos.separadorMenu}></div>

                                    {navegacionMenu.map((item) => {
                                        const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                        
                                        return (
                                            <Link 
                                                key={item.href}
                                                href={item.href}
                                                className={`${estilos.menuDesplegableItem} ${esActivo ? estilos.activo : ''}`}
                                                onClick={() => setMenuUsuarioAbierto(false)}
                                            >
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}

                                    <div className={estilos.separadorMenu}></div>

                                    <button 
                                        className={`${estilos.menuDesplegableItem} ${estilos.itemSalir}`}
                                        onClick={manejarCerrarSesion}
                                    >
                                        <ion-icon name="log-out-outline"></ion-icon>
                                        <span>Cerrar Sesion</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {menuAbierto && (
                <>
                    <div 
                        className={estilos.overlay}
                        onClick={cerrarMenu}
                    ></div>
                    
                    <div className={`${estilos.menuLateral} ${estilos[tema]}`}>
                        <button 
                            className={estilos.botonCerrar}
                            onClick={cerrarMenu}
                            aria-label="Cerrar menu"
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>

                        <div className={estilos.menuContenido}>
                            <div className={estilos.menuHeader}>
                                <div className={estilos.menuEmpresa}>
                                    {datosEmpresa?.logo_url ? (
                                        <img 
                                            src={datosEmpresa.logo_url} 
                                            alt={datosEmpresa.nombre_empresa}
                                            className={estilos.menuLogoEmpresa}
                                        />
                                    ) : (
                                        <div className={estilos.menuLogoDefault}>
                                            <ion-icon name="business-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuEmpresaInfo}>
                                        <span className={estilos.menuEmpresaNombre}>{datosEmpresa?.nombre_empresa}</span>
                                        <span className={estilos.menuEmpresaRnc}>RNC: {datosEmpresa?.rnc}</span>
                                    </div>
                                </div>

                                <div className={estilos.menuUsuario}>
                                    {datosUsuario?.avatar_url ? (
                                        <img 
                                            src={datosUsuario.avatar_url} 
                                            alt={datosUsuario.nombre}
                                            className={estilos.menuAvatar}
                                        />
                                    ) : (
                                        <div className={estilos.menuAvatarDefault}>
                                            <ion-icon name="person-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuUsuarioInfo}>
                                        <span className={estilos.menuUsuarioNombre}>{datosUsuario?.nombre}</span>
                                        <span className={estilos.menuUsuarioTipo}>{obtenerTipoUsuario()}</span>
                                    </div>
                                </div>
                            </div>

                            <nav className={estilos.menuNav}>
                                <div className={estilos.menuSeccion}>
                                    <span className={estilos.menuSeccionTitulo}>Principal</span>
                                    {navegacionPrincipal.map((item) => {
                                        const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                        
                                        return (
                                            <Link 
                                                key={item.href}
                                                href={item.href} 
                                                className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`} 
                                                onClick={cerrarMenu}
                                            >
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>

                                <div className={estilos.menuSeccion}>
                                    <span className={estilos.menuSeccionTitulo}>Gestion</span>
                                    {navegacionMenu.map((item) => {
                                        const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                        
                                        return (
                                            <Link 
                                                key={item.href}
                                                href={item.href} 
                                                className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`} 
                                                onClick={cerrarMenu}
                                            >
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                                </button>
                                <Link href="/admin/perfil" className={estilos.menuItemPerfil} onClick={cerrarMenu}>
                                    <ion-icon name="person-circle-outline"></ion-icon>
                                    <span>Mi Perfil</span>
                                </Link>
                                <button className={estilos.menuItemSalir} onClick={manejarCerrarSesion}>
                                    <ion-icon name="log-out-outline"></ion-icon>
                                    <span>Cerrar Sesion</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}