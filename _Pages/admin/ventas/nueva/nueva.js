"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDatosVenta, buscarProductos, buscarClientes, crearClienteRapido, crearVenta } from './servidor'
import estilos from './nueva.module.css'

export default function NuevaVentaAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [tiposComprobante, setTiposComprobante] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [productos, setProductos] = useState([])
    const [mostrarDropdownProductos, setMostrarDropdownProductos] = useState(false)
    const [productosVenta, setProductosVenta] = useState([])
    
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [clientes, setClientes] = useState([])
    const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false)
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    const [nombreClienteRapido, setNombreClienteRapido] = useState('')
    
    const [tipoComprobanteId, setTipoComprobanteId] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [efectivoRecibido, setEfectivoRecibido] = useState('')
    const [descuentoGlobal, setDescuentoGlobal] = useState('')
    const [notasVenta, setNotasVenta] = useState('')

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
        cargarDatosIniciales()
    }, [])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (!e.target.closest(`.${estilos.busquedaProductoContainer}`)) {
                setMostrarDropdownProductos(false)
            }
            if (!e.target.closest(`.${estilos.busquedaClienteContainer}`)) {
                setMostrarDropdownClientes(false)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [])

    const cargarDatosIniciales = async () => {
        try {
            const resultado = await obtenerDatosVenta()
            if (resultado.success) {
                setDatosEmpresa(resultado.empresa)
                setTiposComprobante(resultado.tiposComprobante)
                setTiposDocumento(resultado.tiposDocumento)
                if (resultado.tiposComprobante.length > 0) {
                    setTipoComprobanteId(resultado.tiposComprobante[0].id)
                }
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/ventas')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos iniciales')
            router.push('/admin/ventas')
        } finally {
            setCargando(false)
        }
    }

    const manejarBusquedaProducto = async (e) => {
        const valor = e.target.value
        setBusquedaProducto(valor)

        if (valor.length >= 2) {
            try {
                const resultado = await buscarProductos(valor)
                if (resultado.success) {
                    setProductos(resultado.productos)
                    setMostrarDropdownProductos(true)
                }
            } catch (error) {
                console.error('Error al buscar productos:', error)
            }
        } else {
            setProductos([])
            setMostrarDropdownProductos(false)
        }
    }

const agregarProducto = (producto) => {
    const existe = productosVenta.find(p => p.id === producto.id)
    
    if (existe) {
        setProductosVenta(productosVenta.map(p => 
            p.id === producto.id 
                ? { ...p, cantidad: p.cantidad + 1, cantidadDespachar: (p.cantidadDespachar || p.cantidad) + 1 }
                : p
        ))
    } else {
        setProductosVenta([...productosVenta, {
            ...producto,
            cantidad: 1,
            precio_venta_usado: parseFloat(producto.precio_venta),
            despacho_parcial: false,
            cantidadDespachar: 1
        }])
    }

    setBusquedaProducto('')
    setMostrarDropdownProductos(false)
}

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            eliminarProducto(productoId)
            return
        }

        const producto = productosVenta.find(p => p.id === productoId)
        if (producto && nuevaCantidad > producto.stock) {
            alert(`Stock disponible: ${producto.stock}`)
            return
        }

        setProductosVenta(productosVenta.map(p => {
            if (p.id === productoId) {
                const nuevaCantidadDespachar = p.despacho_parcial ? p.cantidadDespachar : nuevaCantidad
                return { 
                    ...p, 
                    cantidad: nuevaCantidad,
                    cantidadDespachar: nuevaCantidadDespachar > nuevaCantidad ? nuevaCantidad : nuevaCantidadDespachar
                }
            }
            return p
        }))
    }

    const actualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosVenta(productosVenta.map(p =>
            p.id === productoId ? { ...p, precio_venta_usado: parseFloat(nuevoPrecio) || 0 } : p
        ))
    }

    const toggleDespachoParcial = (productoId) => {
        setProductosVenta(productosVenta.map(p => {
            if (p.id === productoId) {
                const nuevoEstado = !p.despacho_parcial
                return {
                    ...p,
                    despacho_parcial: nuevoEstado,
                    cantidadDespachar: nuevoEstado ? Math.min(p.cantidad, p.cantidadDespachar) : p.cantidad
                }
            }
            return p
        }))
    }

    const actualizarCantidadDespachar = (productoId, nuevaCantidad) => {
        setProductosVenta(productosVenta.map(p => {
            if (p.id === productoId) {
                const cantidadValida = Math.min(Math.max(1, nuevaCantidad), p.cantidad)
                return { ...p, cantidadDespachar: cantidadValida }
            }
            return p
        }))
    }

    const eliminarProducto = (productoId) => {
        setProductosVenta(productosVenta.filter(p => p.id !== productoId))
    }

    const manejarBusquedaCliente = async (e) => {
        const valor = e.target.value
        setBusquedaCliente(valor)

        if (valor.length >= 2) {
            try {
                const resultado = await buscarClientes(valor)
                if (resultado.success) {
                    setClientes(resultado.clientes)
                    setMostrarDropdownClientes(true)
                }
            } catch (error) {
                console.error('Error al buscar clientes:', error)
            }
        } else {
            setClientes([])
            setMostrarDropdownClientes(false)
        }
    }

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.nombre)
        setMostrarDropdownClientes(false)
    }

    const limpiarCliente = () => {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
    }

    const abrirModalClienteRapido = () => {
        setNombreClienteRapido('')
        setMostrarModalCliente(true)
    }

    const crearClienteRapidoHandler = async (e) => {
        e.preventDefault()

        if (!nombreClienteRapido.trim()) {
            alert('Ingresa el nombre del cliente')
            return
        }

        setProcesando(true)
        try {
            const resultado = await crearClienteRapido(nombreClienteRapido.trim())
            if (resultado.success) {
                setClienteSeleccionado(resultado.cliente)
                setBusquedaCliente(resultado.cliente.nombre)
                setMostrarModalCliente(false)
            } else {
                alert(resultado.mensaje || 'Error al crear cliente')
            }
        } catch (error) {
            console.error('Error al crear cliente:', error)
            alert('Error al crear cliente')
        } finally {
            setProcesando(false)
        }
    }

    const calcularTotales = () => {
        let subtotal = 0
        let descuento = parseFloat(descuentoGlobal) || 0

        productosVenta.forEach(producto => {
            const precio = producto.precio_venta_usado || 0
            const cantidad = producto.cantidad || 0
            subtotal += precio * cantidad
        })

        const subtotalConDescuento = subtotal - descuento
        const montoGravado = subtotalConDescuento
        const itbis = datosEmpresa?.impuesto_porcentaje 
            ? (montoGravado * parseFloat(datosEmpresa.impuesto_porcentaje)) / 100
            : 0
        const total = subtotalConDescuento + itbis

        return {
            subtotal: subtotal.toFixed(2),
            descuento: descuento.toFixed(2),
            montoGravado: montoGravado.toFixed(2),
            itbis: itbis.toFixed(2),
            total: total.toFixed(2)
        }
    }

    const validarVenta = () => {
        if (productosVenta.length === 0) {
            alert('Agrega al menos un producto a la venta')
            return false
        }

        if (!tipoComprobanteId) {
            alert('Selecciona un tipo de comprobante')
            return false
        }

        const tipoComprobante = tiposComprobante.find(t => t.id === parseInt(tipoComprobanteId))
        if (tipoComprobante?.requiere_rnc && !clienteSeleccionado) {
            alert('Este tipo de comprobante requiere seleccionar un cliente')
            return false
        }

        for (const producto of productosVenta) {
            if (producto.despacho_parcial && producto.cantidadDespachar < 1) {
                alert(`El producto "${producto.nombre}" debe despachar al menos 1 unidad`)
                return false
            }
            if (producto.despacho_parcial && producto.cantidadDespachar > producto.cantidad) {
                alert(`El producto "${producto.nombre}" no puede despachar más de lo comprado`)
                return false
            }
        }

        if (metodoPago === 'efectivo') {
            const recibido = parseFloat(efectivoRecibido) || 0
            const total = parseFloat(calcularTotales().total)
            if (recibido < total) {
                alert('El efectivo recibido debe ser mayor o igual al total')
                return false
            }
        }

        return true
    }

    const procesarVenta = async () => {
        if (!validarVenta()) return

        setProcesando(true)
        try {
            const totales = calcularTotales()
            
            let efectivoRecibidoFinal = null
            let cambioFinal = null

            if (metodoPago === 'efectivo') {
                const recibido = parseFloat(efectivoRecibido)
                const total = parseFloat(totales.total)
                efectivoRecibidoFinal = recibido
                cambioFinal = recibido - total
            }

            const hayDespachoParcial = productosVenta.some(p => p.despacho_parcial)

            const datosVenta = {
                tipo_comprobante_id: parseInt(tipoComprobanteId),
                cliente_id: clienteSeleccionado?.id || null,
                productos: productosVenta.map(p => ({
                    producto_id: p.id,
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_venta_usado,
                    despacho_parcial: p.despacho_parcial,
                    cantidad_despachar: p.despacho_parcial ? p.cantidadDespachar : p.cantidad
                })),
                subtotal: parseFloat(totales.subtotal),
                descuento: parseFloat(totales.descuento),
                monto_gravado: parseFloat(totales.montoGravado),
                itbis: parseFloat(totales.itbis),
                total: parseFloat(totales.total),
                metodo_pago: metodoPago,
                efectivo_recibido: efectivoRecibidoFinal,
                cambio: cambioFinal,
                notas: notasVenta.trim() || null,
                tipo_entrega: hayDespachoParcial ? 'parcial' : 'completa'
            }

            const resultado = await crearVenta(datosVenta)
            
            if (resultado.success) {
                router.push(`/admin/ventas/imprimir/${resultado.venta.id}`)
            } else {
                alert(resultado.mensaje || 'Error al crear la venta')
            }
        } catch (error) {
            console.error('Error al procesar venta:', error)
            alert('Error al procesar la venta')
        } finally {
            setProcesando(false)
        }
    }

    const totales = calcularTotales()
    const cambio = metodoPago === 'efectivo' && efectivoRecibido
        ? (parseFloat(efectivoRecibido) - parseFloat(totales.total)).toFixed(2)
        : '0.00'

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Nueva Venta</h1>
                    <p className={estilos.subtitulo}>Registra una nueva venta y genera el comprobante fiscal</p>
                </div>
                <button 
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/ventas')}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <div className={estilos.contenido}>
                <div className={estilos.columnaIzquierda}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Productos</span>
                        </h3>

                        <div className={estilos.busquedaProductoContainer}>
                            <div className={estilos.busquedaProducto}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar producto por nombre, codigo o SKU..."
                                    value={busquedaProducto}
                                    onChange={manejarBusquedaProducto}
                                    className={estilos.inputBusqueda}
                                />
                            </div>

                            {mostrarDropdownProductos && productos.length > 0 && (
                                <div className={`${estilos.dropdownProductos} ${estilos[tema]}`}>
                                    {productos.map(producto => (
                                        <div
                                            key={producto.id}
                                            className={estilos.dropdownItem}
                                            onClick={() => agregarProducto(producto)}
                                        >
                                            <div className={estilos.productoInfo}>
                                                <span className={estilos.productoNombre}>{producto.nombre}</span>
                                                <span className={estilos.productoCodigo}>
                                                    {producto.codigo_barras || producto.sku}
                                                </span>
                                            </div>
                                            <div className={estilos.productoDatos}>
                                                <span className={estilos.productoStock}>Stock: {producto.stock}</span>
                                                <span className={estilos.productoPrecio}>
                                                    RD$ {parseFloat(producto.precio_venta).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={estilos.listaProductos}>
                            {productosVenta.length === 0 ? (
                                <div className={estilos.sinProductos}>
                                    <ion-icon name="cart-outline"></ion-icon>
                                    <span>No hay productos agregados</span>
                                </div>
                            ) : (
                                productosVenta.map(producto => (
                                    <div key={producto.id} className={`${estilos.productoItem} ${estilos[tema]}`}>
                                        <div className={estilos.productoDetalles}>
                                            <span className={estilos.productoNombreItem}>{producto.nombre}</span>
                                            <span className={estilos.productoStockItem}>
                                                Stock: {producto.stock} | Cod: {producto.codigo_barras || producto.sku}
                                            </span>
                                        </div>

                                        <div className={estilos.productoControles}>
                                            <div className={estilos.controlCantidad}>
                                                <button
                                                    onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                                                    className={estilos.btnCantidad}
                                                >
                                                    <ion-icon name="remove-outline"></ion-icon>
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={producto.stock}
                                                    value={producto.cantidad}
                                                    onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 1)}
                                                    className={estilos.inputCantidad}
                                                />
                                                <button
                                                    onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                                                    className={estilos.btnCantidad}
                                                    disabled={producto.cantidad >= producto.stock}
                                                >
                                                    <ion-icon name="add-outline"></ion-icon>
                                                </button>
                                            </div>

                                            <div className={estilos.controlPrecio}>
                                                <span className={estilos.labelPrecio}>RD$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={producto.precio_venta_usado}
                                                    onChange={(e) => actualizarPrecio(producto.id, e.target.value)}
                                                    className={estilos.inputPrecio}
                                                />
                                            </div>

                                            <div className={estilos.productoSubtotal}>
                                                <span>RD$ {(producto.cantidad * producto.precio_venta_usado).toFixed(2)}</span>
                                            </div>

                                            <button
                                                onClick={() => eliminarProducto(producto.id)}
                                                className={estilos.btnEliminar}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>

                                        <div className={estilos.despachoParcialContainer}>
                                            <label className={estilos.checkboxDespachoParcial}>
                                                <input
                                                    type="checkbox"
                                                    checked={producto.despacho_parcial}
                                                    onChange={() => toggleDespachoParcial(producto.id)}
                                                    className={estilos.checkboxInput}
                                                />
                                                <span className={estilos.checkboxTexto}>Despacho Parcial</span>
                                            </label>

                                            {producto.despacho_parcial && (
                                                <div className={estilos.controlDespacho}>
                                                    <label className={estilos.labelDespacho}>
                                                        Entregar ahora:
                                                    </label>
                                                    <div className={estilos.inputDespachoContainer}>
                                                        <button
                                                            onClick={() => actualizarCantidadDespachar(producto.id, producto.cantidadDespachar - 1)}
                                                            className={estilos.btnCantidadDespacho}
                                                            disabled={producto.cantidadDespachar <= 1}
                                                        >
                                                            <ion-icon name="remove-outline"></ion-icon>
                                                        </button>
<input
    type="number"
    min="1"
    max={producto.cantidad}
    value={producto.cantidadDespachar || 1}
    onChange={(e) => actualizarCantidadDespachar(producto.id, parseInt(e.target.value) || 1)}
    className={estilos.inputCantidadDespacho}
/>
                                                        <button
                                                            onClick={() => actualizarCantidadDespachar(producto.id, producto.cantidadDespachar + 1)}
                                                            className={estilos.btnCantidadDespacho}
                                                            disabled={producto.cantidadDespachar >= producto.cantidad}
                                                        >
                                                            <ion-icon name="add-outline"></ion-icon>
                                                        </button>
                                                        <span className={estilos.despachoInfo}>
                                                            de {producto.cantidad}
                                                        </span>
                                                    </div>
                                                    <span className={estilos.despachoPendiente}>
                                                        Pendiente: {producto.cantidad - producto.cantidadDespachar}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className={estilos.columnaDerecha}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="person-outline"></ion-icon>
                            <span>Cliente</span>
                        </h3>

                        <div className={estilos.busquedaClienteContainer}>
                            <div className={estilos.busquedaCliente}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={busquedaCliente}
                                    onChange={manejarBusquedaCliente}
                                    className={estilos.inputBusqueda}
                                    disabled={clienteSeleccionado !== null}
                                />
                                {clienteSeleccionado && (
                                    <button
                                        onClick={limpiarCliente}
                                        className={estilos.btnLimpiarCliente}
                                    >
                                        <ion-icon name="close-circle"></ion-icon>
                                    </button>
                                )}
                            </div>

                            {mostrarDropdownClientes && clientes.length > 0 && (
                                <div className={`${estilos.dropdownClientes} ${estilos[tema]}`}>
                                    {clientes.map(cliente => (
                                        <div
                                            key={cliente.id}
                                            className={estilos.dropdownItemCliente}
                                            onClick={() => seleccionarCliente(cliente)}
                                        >
                                            <div className={estilos.clienteInfo}>
                                                <span className={estilos.clienteNombre}>{cliente.nombre}</span>
                                                <span className={estilos.clienteDoc}>{cliente.numero_documento}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={abrirModalClienteRapido}
                                className={estilos.btnClienteRapido}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                <span>Cliente Rapido</span>
                            </button>
                        </div>

                        {clienteSeleccionado && (
                            <div className={`${estilos.clienteSeleccionado} ${estilos[tema]}`}>
                                <div className={estilos.clienteData}>
                                    <span className={estilos.clienteNombreSelec}>{clienteSeleccionado.nombre}</span>
                                    <span className={estilos.clienteDocSelec}>
                                        {clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <span>Comprobante</span>
                        </h3>

                        <div className={estilos.grupoInput}>
                            <label>Tipo de Comprobante</label>
                            <select
                                value={tipoComprobanteId}
                                onChange={(e) => setTipoComprobanteId(e.target.value)}
                                className={estilos.select}
                            >
                                {tiposComprobante.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.codigo} - {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Descuento Global (RD$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={descuentoGlobal}
                                onChange={(e) => setDescuentoGlobal(e.target.value)}
                                placeholder="0.00"
                                className={estilos.input}
                            />
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="card-outline"></ion-icon>
                            <span>Metodo de Pago</span>
                        </h3>

                        <div className={estilos.gridMetodosPago}>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'efectivo' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('efectivo')}
                            >
                                <ion-icon name="cash-outline"></ion-icon>
                                <span>Efectivo</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'tarjeta_debito' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('tarjeta_debito')}
                            >
                                <ion-icon name="card-outline"></ion-icon>
                                <span>T. Debito</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'tarjeta_credito' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('tarjeta_credito')}
                            >
                                <ion-icon name="card-outline"></ion-icon>
                                <span>T. Credito</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'transferencia' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('transferencia')}
                            >
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                <span>Transferencia</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'cheque' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('cheque')}
                            >
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Cheque</span>
                            </button>
                        </div>

                        {metodoPago === 'efectivo' && (
                            <div className={estilos.grupoInput}>
                                <label>Efectivo Recibido (RD$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={efectivoRecibido}
                                    onChange={(e) => setEfectivoRecibido(e.target.value)}
                                    placeholder="0.00"
                                    className={estilos.input}
                                />
                                {efectivoRecibido && parseFloat(cambio) >= 0 && (
                                    <div className={`${estilos.cambioBox} ${estilos[tema]}`}>
                                        <span>Cambio:</span>
                                        <strong>RD$ {cambio}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={estilos.grupoInput}>
                            <label>Notas (Opcional)</label>
                            <textarea
                                value={notasVenta}
                                onChange={(e) => setNotasVenta(e.target.value)}
                                placeholder="Observaciones sobre la venta..."
                                className={estilos.textarea}
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className={`${estilos.resumenVenta} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloResumen}>Resumen de Venta</h3>
                        
                        <div className={estilos.lineaResumen}>
                            <span>Subtotal:</span>
                            <span>RD$ {totales.subtotal}</span>
                        </div>

                        {parseFloat(totales.descuento) > 0 && (
                            <div className={estilos.lineaResumen}>
                                <span>Descuento:</span>
                                <span className={estilos.descuento}>- RD$ {totales.descuento}</span>
                            </div>
                        )}

                        <div className={estilos.lineaResumen}>
                            <span>Monto Gravado:</span>
                            <span>RD$ {totales.montoGravado}</span>
                        </div>

                        <div className={estilos.lineaResumen}>
                            <span>{datosEmpresa?.impuesto_nombre || 'ITBIS'} ({datosEmpresa?.impuesto_porcentaje || 18}%):</span>
                            <span>RD$ {totales.itbis}</span>
                        </div>

                        <div className={estilos.separador}></div>

                        <div className={estilos.lineaTotal}>
                            <span>Total a Pagar:</span>
                            <span>RD$ {totales.total}</span>
                        </div>

                        <button
                            onClick={procesarVenta}
                            disabled={procesando || productosVenta.length === 0}
                            className={estilos.btnProcesar}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Procesar Venta</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {mostrarModalCliente && (
                <div className={estilos.modalOverlay} onClick={() => !procesando && setMostrarModalCliente(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Cliente Rapido</h2>
                            <button
                                className={estilos.btnCerrarModal}
                                onClick={() => setMostrarModalCliente(false)}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={crearClienteRapidoHandler} className={estilos.modalBody}>
                            <p className={estilos.infoModal}>
                                Crea un cliente rapido con solo el nombre. Podras completar sus datos mas tarde.
                            </p>
                            
                            <div className={estilos.grupoInput}>
                                <label>Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    value={nombreClienteRapido}
                                    onChange={(e) => setNombreClienteRapido(e.target.value)}
                                    placeholder="Ej: Juan Perez"
                                    className={estilos.input}
                                    required
                                    disabled={procesando}
                                    autoFocus
                                />
                            </div>
                            
                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelarModal}
                                    onClick={() => setMostrarModalCliente(false)}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardarModal}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Creando...' : 'Crear Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}