"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosCaja, abrirCaja, obtenerVentas, anularVenta } from './servidor'
import estilos from './ventas.module.css'

export default function VentasAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cajaAbierta, setCajaAbierta] = useState(false)
    const [datosCaja, setDatosCaja] = useState(null)
    const [mostrarModalCaja, setMostrarModalCaja] = useState(false)
    const [montoInicial, setMontoInicial] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [ventas, setVentas] = useState([])
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroMetodo, setFiltroMetodo] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

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
        verificarCaja()
    }, [])

    useEffect(() => {
        if (cajaAbierta) {
            cargarVentas()
        }
    }, [cajaAbierta])

    const verificarCaja = async () => {
        try {
            const resultado = await obtenerDatosCaja()
            if (resultado.success) {
                if (resultado.cajaAbierta) {
                    setCajaAbierta(true)
                    setDatosCaja(resultado.caja)
                } else {
                    setCajaAbierta(false)
                    setMostrarModalCaja(true)
                }
            }
        } catch (error) {
            console.error('Error al verificar caja:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarVentas = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerVentas()
            if (resultado.success) {
                setVentas(resultado.ventas)
            }
        } catch (error) {
            console.error('Error al cargar ventas:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarAbrirCaja = async (e) => {
        e.preventDefault()
        
        if (!montoInicial || parseFloat(montoInicial) < 0) {
            alert('Por favor ingresa un monto inicial valido')
            return
        }

        setProcesando(true)
        try {
            const resultado = await abrirCaja(parseFloat(montoInicial))
            if (resultado.success) {
                setCajaAbierta(true)
                setDatosCaja(resultado.caja)
                setMostrarModalCaja(false)
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al abrir caja')
            }
        } catch (error) {
            console.error('Error al abrir caja:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarAnularVenta = async (ventaId, numeroInterno) => {
        const razon = prompt(`Ingresa la razon de anulacion para la venta ${numeroInterno}:`)
        
        if (!razon || razon.trim() === '') {
            alert('Debes proporcionar una razon para anular la venta')
            return
        }

        if (!confirm(`Estas seguro de anular la venta ${numeroInterno}? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await anularVenta(ventaId, razon.trim())
            if (resultado.success) {
                await cargarVentas()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al anular venta')
            }
        } catch (error) {
            console.error('Error al anular venta:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const ventasFiltradas = ventas.filter(venta => {
        const cumpleBusqueda = busqueda === '' ||
                               venta.vendedor_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                               venta.numero_interno.toLowerCase().includes(busqueda.toLowerCase()) ||
                               venta.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())
        
        const cumpleEstado = filtroEstado === 'todos' || venta.estado === filtroEstado
        
        const cumpleMetodo = filtroMetodo === 'todos' || venta.metodo_pago === filtroMetodo
        
        let cumpleFecha = true
        if (fechaInicio && fechaFin) {
            const fechaVenta = new Date(venta.fecha_venta).toISOString().split('T')[0]
            cumpleFecha = fechaVenta >= fechaInicio && fechaVenta <= fechaFin
        }
        
        return cumpleBusqueda && cumpleEstado && cumpleMetodo && cumpleFecha
    })

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: 'Efectivo', color: 'efectivo' },
            tarjeta_debito: { texto: 'Tarjeta Debito', color: 'tarjeta' },
            tarjeta_credito: { texto: 'Tarjeta Credito', color: 'tarjeta' },
            transferencia: { texto: 'Transferencia', color: 'transferencia' },
            cheque: { texto: 'Cheque', color: 'cheque' },
            mixto: { texto: 'Mixto', color: 'mixto' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    const calcularTotales = () => {
        const totales = {
            totalVentas: 0,
            totalEmitidas: 0,
            totalAnuladas: 0,
            montoTotal: 0
        }

        ventasFiltradas.forEach(venta => {
            totales.totalVentas++
            if (venta.estado === 'emitida') {
                totales.totalEmitidas++
                totales.montoTotal += parseFloat(venta.total)
            } else if (venta.estado === 'anulada') {
                totales.totalAnuladas++
            }
        })

        return totales
    }

    const totales = calcularTotales()

    if (cargando && !cajaAbierta) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Verificando estado de caja...</span>
                </div>
            </div>
        )
    }

    if (!cajaAbierta) {
        return (
            <>
                <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                    <div className={`${estilos.cajaRequerida} ${estilos[tema]}`}>
                        <div className={estilos.cajaIcono}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <h2>Caja Cerrada</h2>
                        <p>Para comenzar a realizar ventas, primero debes abrir la caja del dia</p>
                        <button 
                            className={estilos.btnAbrirCaja}
                            onClick={() => setMostrarModalCaja(true)}
                        >
                            <ion-icon name="lock-open-outline"></ion-icon>
                            <span>Abrir Caja</span>
                        </button>
                    </div>
                </div>

                {mostrarModalCaja && (
                    <div className={estilos.modalOverlay}>
                        <div className={`${estilos.modal} ${estilos[tema]}`}>
                            <div className={estilos.modalHeader}>
                                <h2>Abrir Caja</h2>
                                <button 
                                    className={estilos.btnCerrar}
                                    onClick={() => !procesando && setMostrarModalCaja(false)}
                                    disabled={procesando}
                                >
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            </div>

                            <form onSubmit={manejarAbrirCaja} className={estilos.modalBody}>
                                <div className={estilos.infoCaja}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>Ingresa el monto con el que iniciaras las operaciones del dia. Este monto sera el efectivo inicial disponible en caja.</p>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Monto Inicial (RD$)</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simboloMoneda}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={montoInicial}
                                            onChange={(e) => setMontoInicial(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            disabled={procesando}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className={estilos.modalFooter}>
                                    <button
                                        type="button"
                                        className={estilos.btnCancelar}
                                        onClick={() => setMostrarModalCaja(false)}
                                        disabled={procesando}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={estilos.btnGuardar}
                                        disabled={procesando}
                                    >
                                        {procesando ? 'Abriendo...' : 'Abrir Caja'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Ventas</h1>
                    <p className={estilos.subtitulo}>Gestiona las ventas y comprobantes fiscales</p>
                </div>
                <Link href="/admin/ventas/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Venta</span>
                </Link>
            </div>

            {datosCaja && (
                <div className={`${estilos.infoCajaAbierta} ${estilos[tema]}`}>
                    <div className={estilos.cajaInfo}>
                        <ion-icon name="cash-outline"></ion-icon>
                        <div className={estilos.cajaTexto}>
                            <span className={estilos.cajaLabel}>Caja Abierta</span>
                            <span className={estilos.cajaNumero}>Caja #{datosCaja.numero_caja}</span>
                        </div>
                    </div>
                    <div className={estilos.cajaMontos}>
                        <div className={estilos.montoItem}>
                            <span>Monto Inicial:</span>
                            <strong>{formatearMoneda(datosCaja.monto_inicial)}</strong>
                        </div>
                        <div className={estilos.montoItem}>
                            <span>Ventas del Dia:</span>
                            <strong>{formatearMoneda(datosCaja.total_ventas)}</strong>
                        </div>
                    </div>
                </div>
            )}

            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="receipt-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Ventas</span>
                        <span className={estilos.estadValor}>{totales.totalVentas}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Emitidas</span>
                        <span className={estilos.estadValor}>{totales.totalEmitidas}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Anuladas</span>
                        <span className={estilos.estadValor}>{totales.totalAnuladas}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Monto Total</span>
                        <span className={estilos.estadValor}>{formatearMoneda(totales.montoTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por vendedor, numero interno o cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="emitida">Emitidas</option>
                        <option value="anulada">Anuladas</option>
                        <option value="pendiente">Pendientes</option>
                    </select>

                    <select
                        value={filtroMetodo}
                        onChange={(e) => setFiltroMetodo(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los metodos</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Tarjeta Debito</option>
                        <option value="tarjeta_credito">Tarjeta Credito</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="mixto">Mixto</option>
                    </select>

                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className={estilos.inputFecha}
                    />

                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className={estilos.inputFecha}
                    />
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando ventas...</span>
                </div>
            ) : ventasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="receipt-outline"></ion-icon>
                    <span>No hay ventas que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                        <div className={estilos.columna}>Vendedor</div>
                        <div className={estilos.columna}>Numero</div>
                        <div className={estilos.columna}>Cliente</div>
                        <div className={estilos.columna}>Metodo Pago</div>
                        <div className={estilos.columna}>Subtotal</div>
                        <div className={estilos.columna}>ITBIS</div>
                        <div className={estilos.columna}>Total</div>
                        <div className={estilos.columna}>Estado</div>
                        <div className={estilos.columnaAcciones}>Acciones</div>
                    </div>

                    <div className={estilos.tablaBody}>
                        {ventasFiltradas.map((venta) => (
                            <div key={venta.id} className={`${estilos.fila} ${estilos[tema]}`}>
                                <div className={estilos.columna}>
                                    <span className={estilos.vendedor}>{venta.vendedor_nombre || 'Sin vendedor'}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.numero}>{venta.numero_interno}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.cliente}>
                                        {venta.cliente_nombre || 'Consumidor Final'}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={`${estilos.badgeMetodo} ${estilos[getMetodoPagoBadge(venta.metodo_pago).color]}`}>
                                        {getMetodoPagoBadge(venta.metodo_pago).texto}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.monto}>{formatearMoneda(venta.subtotal)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.monto}>{formatearMoneda(venta.itbis)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.montoTotal}>{formatearMoneda(venta.total)}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <div className={estilos.estadoContainer}>
                                        <span className={`${estilos.badgeEstado} ${estilos[venta.estado]}`}>
                                            {venta.estado === 'emitida' ? 'Emitida' : venta.estado === 'anulada' ? 'Anulada' : 'Pendiente'}
                                        </span>
                                        {venta.tipo_entrega === 'parcial' && !venta.despacho_completo && venta.estado === 'emitida' && (
                                            <span className={estilos.badgePendiente}>
                                                D Pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={estilos.columnaAcciones}>
                                    <Link
                                        href={`/admin/ventas/ver/${venta.id}`}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/admin/ventas/imprimir/${venta.id}`}
                                        className={`${estilos.btnIcono} ${estilos.imprimir}`}
                                        title="Imprimir"
                                    >
                                        <ion-icon name="print-outline"></ion-icon>
                                    </Link>
                                    {venta.tipo_entrega === 'parcial' && !venta.despacho_completo && venta.estado === 'emitida' && (
                                        <Link
                                            href={`/admin/ventas/despachar/${venta.id}`}
                                            className={`${estilos.btnIcono} ${estilos.despachar}`}
                                            title="Despachar pedido"
                                        >
                                            <ion-icon name="cube-outline"></ion-icon>
                                        </Link>
                                    )}
                                    {venta.estado === 'emitida' && (
                                        <button
                                            className={`${estilos.btnIcono} ${estilos.anular}`}
                                            onClick={() => manejarAnularVenta(venta.id, venta.numero_interno)}
                                            disabled={procesando}
                                            title="Anular venta"
                                        >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}