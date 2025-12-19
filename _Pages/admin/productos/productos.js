"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerProductos, eliminarProducto } from './servidor'
import estilos from './productos.module.css'

export default function ProductosAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [productos, setProductos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroMarca, setFiltroMarca] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [procesando, setProcesando] = useState(false)

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
        cargarProductos()
    }, [])

    const cargarProductos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerProductos()
            if (resultado.success) {
                setProductos(resultado.productos)
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
            } else {
                alert(resultado.mensaje || 'Error al cargar productos')
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const manejarEliminar = async (productoId, nombreProducto) => {
        if (!confirm(`¿Estas seguro de eliminar el producto "${nombreProducto}"? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarProducto(productoId)
            if (resultado.success) {
                await cargarProductos()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al eliminar producto')
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const productosFiltrados = productos.filter(producto => {
        const cumpleBusqueda = busqueda === '' ||
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.sku?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleCategoria = filtroCategoria === 'todos' || producto.categoria_id === parseInt(filtroCategoria)
        const cumpleMarca = filtroMarca === 'todos' || producto.marca_id === parseInt(filtroMarca)
        const cumpleEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activo' && producto.activo) ||
            (filtroEstado === 'inactivo' && !producto.activo) ||
            (filtroEstado === 'bajo_stock' && producto.stock <= producto.stock_minimo)

        return cumpleBusqueda && cumpleCategoria && cumpleMarca && cumpleEstado
    })

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const calcularEstadisticas = () => {
        return {
            total: productos.length,
            activos: productos.filter(p => p.activo).length,
            bajoStock: productos.filter(p => p.stock <= p.stock_minimo).length,
            valorInventario: productos.reduce((sum, p) => sum + (p.precio_venta * p.stock), 0)
        }
    }

    const stats = calcularEstadisticas()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Productos</h1>
                    <p className={estilos.subtitulo}>Gestiona el catálogo de productos</p>
                </div>
                <Link href="/admin/productos/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Producto</span>
                </Link>
            </div>

            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Productos</span>
                        <span className={estilos.estadValor}>{stats.total}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Activos</span>
                        <span className={estilos.estadValor}>{stats.activos}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Bajo Stock</span>
                        <span className={estilos.estadValor}>{stats.bajoStock}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Inventario</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorInventario)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o SKU..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroMarca}
                        onChange={(e) => setFiltroMarca(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las marcas</option>
                        {marcas.map(marca => (
                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                        <option value="bajo_stock">Bajo Stock</option>
                    </select>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando productos...</span>
                </div>
            ) : productosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>No hay productos que coincidan con tu búsqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {productosFiltrados.map((producto) => (
                        <div key={producto.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                {producto.imagen_url ? (
                                    <img 
                                        src={producto.imagen_url} 
                                        alt={producto.nombre}
                                        className={estilos.imagen}
                                    />
                                ) : (
                                    <div className={estilos.imagenPlaceholder}>
                                        <ion-icon name="image-outline"></ion-icon>
                                    </div>
                                )}
                                {producto.stock <= producto.stock_minimo && (
                                    <span className={estilos.badgeBajoStock}>Bajo Stock</span>
                                )}
                            </div>

                            <div className={estilos.cardBody}>
                                <h3 className={estilos.nombreProducto}>{producto.nombre}</h3>
                                
                                <div className={estilos.codigoInfo}>
                                    {producto.codigo_barras && (
                                        <span className={estilos.codigo}>
                                            <ion-icon name="barcode-outline"></ion-icon>
                                            {producto.codigo_barras}
                                        </span>
                                    )}
                                    {producto.sku && (
                                        <span className={estilos.codigo}>
                                            <ion-icon name="pricetag-outline"></ion-icon>
                                            {producto.sku}
                                        </span>
                                    )}
                                </div>

                                {producto.categoria_nombre && (
                                    <span className={estilos.categoria}>{producto.categoria_nombre}</span>
                                )}

                                <div className={estilos.precios}>
                                    <div className={estilos.precioItem}>
                                        <span className={estilos.precioLabel}>Compra:</span>
                                        <span className={estilos.precioValor}>
                                            {formatearMoneda(producto.precio_compra)}
                                        </span>
                                    </div>
                                    <div className={estilos.precioItem}>
                                        <span className={estilos.precioLabel}>Venta:</span>
                                        <span className={estilos.precioVenta}>
                                            {formatearMoneda(producto.precio_venta)}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.stock}>
                                    <div className={estilos.stockInfo}>
                                        <span className={estilos.stockLabel}>Stock:</span>
                                        <span className={`${estilos.stockValor} ${producto.stock <= producto.stock_minimo ? estilos.stockBajo : ''}`}>
                                            {producto.stock} {producto.unidad_medida_abreviatura}
                                        </span>
                                    </div>
                                    <span className={estilos.stockMinimo}>
                                        Mín: {producto.stock_minimo}
                                    </span>
                                </div>

                                <div className={estilos.estado}>
                                    <span className={`${estilos.badgeEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                        {producto.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <Link
                                    href={`/admin/productos/ver/${producto.id}`}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </Link>
                                <Link
                                    href={`/admin/productos/editar/${producto.id}`}
                                    className={`${estilos.btnIcono} ${estilos.editar}`}
                                    title="Editar"
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </Link>
                                <button
                                    onClick={() => manejarEliminar(producto.id, producto.nombre)}
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    disabled={procesando}
                                    title="Eliminar"
                                >
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}