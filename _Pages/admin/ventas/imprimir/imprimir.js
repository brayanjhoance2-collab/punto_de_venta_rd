"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Barcode from 'react-barcode'
import { obtenerVentaImprimir } from './servidor'
import estilos from './imprimir.module.css'

export default function ImprimirVenta() {
    const params = useParams()
    const router = useRouter()
    const ventaId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [venta, setVenta] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const [error, setError] = useState(null)
    const [tamañoPapel, setTamañoPapel] = useState('80mm')
    
    const [opciones, setOpciones] = useState({
        mostrarDatosEmpresa: true,
        mostrarDatosCliente: true,
        mostrarVendedor: true,
        mostrarMetodoPago: true,
        mostrarNotas: true,
        mostrarMensajeFinal: true,
        mostrarCodigoBarras: true
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const tamañoGuardado = localStorage.getItem('tamañoPapelImpresion')
        if (tamañoGuardado) {
            setTamañoPapel(tamañoGuardado)
        }

        const opcionesGuardadas = localStorage.getItem('opcionesImpresion')
        if (opcionesGuardadas) {
            setOpciones(JSON.parse(opcionesGuardadas))
        }

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
        cargarDatosVenta()
    }, [ventaId])

    useEffect(() => {
        if (tamañoPapel) {
            document.body.setAttribute('data-print-size', tamañoPapel)
        }
    }, [tamañoPapel])

    const cargarDatosVenta = async () => {
        try {
            const resultado = await obtenerVentaImprimir(ventaId)
            if (resultado.success) {
                setVenta(resultado.venta)
                setEmpresa(resultado.empresa)
            } else {
                setError(resultado.mensaje || 'Error al cargar venta')
            }
        } catch (error) {
            console.error('Error al cargar venta:', error)
            setError('Error al cargar datos de la venta')
        } finally {
            setCargando(false)
        }
    }

    const toggleOpcion = (opcion) => {
        const nuevasOpciones = {
            ...opciones,
            [opcion]: !opciones[opcion]
        }
        setOpciones(nuevasOpciones)
        localStorage.setItem('opcionesImpresion', JSON.stringify(nuevasOpciones))
    }

    const cambiarTamañoPapel = (tamaño) => {
        setTamañoPapel(tamaño)
        localStorage.setItem('tamañoPapelImpresion', tamaño)
    }

    const manejarImprimir = () => {
        window.print()
    }

    const formatearFecha = (fecha) => {
        const date = new Date(fecha)
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const año = date.getFullYear()
        const hora = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        return `${dia}/${mes}/${año} ${hora}:${min}`
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <p>Preparando boucher...</p>
                </div>
            </div>
        )
    }

    if (error || !venta || !empresa) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <h2>Error al cargar el boucher</h2>
                    <p>{error || 'No se pudo cargar la información'}</p>
                    <button onClick={() => router.push('/admin/ventas')} className={estilos.btnCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.selectores}>
                    <h3>Tamaño de Papel</h3>
                    <div className={estilos.botonesTabaño}>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === '58mm' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('58mm')}
                        >
                            58mm
                        </button>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === '80mm' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('80mm')}
                        >
                            80mm
                        </button>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === 'A4' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('A4')}
                        >
                            A4
                        </button>
                    </div>
                </div>

                <div className={estilos.botonesAccion}>
                    <button onClick={manejarImprimir} className={estilos.btnImprimir}>
                        Imprimir
                    </button>
                    <button onClick={() => router.push('/admin/ventas')} className={estilos.btnCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>

            <div className={estilos.vistaPrevia}>
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>Mostrar en Boucher</h3>
                    <div className={estilos.listaOpciones}>
                        <label className={estilos.opcionLabel}>
                            <span>Datos Empresa</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosEmpresa ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosEmpresa')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Datos Cliente</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosCliente ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosCliente')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Vendedor</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarVendedor ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarVendedor')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Método Pago</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMetodoPago ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMetodoPago')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Notas</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarNotas ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarNotas')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Mensaje Final</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMensajeFinal ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMensajeFinal')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Código Barras</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarCodigoBarras ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarCodigoBarras')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>
                    </div>
                </div>

                <div className={`${estilos.boucher} ${estilos[tamañoPapel]}`} data-size={tamañoPapel}>
                    {opciones.mostrarDatosEmpresa && (
                        <>
                            <div className={estilos.encabezado}>
                                <h1>{empresa.nombre_empresa}</h1>
                                <p>{empresa.razon_social}</p>
                                <p>RNC: {empresa.rnc}</p>
                                <p>{empresa.direccion}</p>
                                {empresa.telefono && <p>Tel: {empresa.telefono}</p>}
                            </div>
                            <div className={estilos.linea}></div>
                        </>
                    )}

                    <div className={estilos.comprobante}>
                        <p className={estilos.tipoDoc}>{venta.tipo_comprobante_nombre}</p>
                        <p className={estilos.ncf}>NCF: {venta.ncf}</p>
                        <p>No. {venta.numero_interno}</p>
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.info}>
                        <p><strong>Fecha:</strong> {formatearFecha(venta.fecha_venta)}</p>
                        {opciones.mostrarVendedor && (
                            <p><strong>Vendedor:</strong> {venta.usuario_nombre}</p>
                        )}
                        {opciones.mostrarDatosCliente && (
                            venta.cliente_id ? (
                                <>
                                    <p><strong>Cliente:</strong> {venta.cliente_nombre}</p>
                                    <p><strong>{venta.cliente_tipo_documento}:</strong> {venta.cliente_numero_documento}</p>
                                </>
                            ) : (
                                <p><strong>Cliente:</strong> Consumidor Final</p>
                            )
                        )}
                    </div>

                    <div className={estilos.linea}></div>

                    <table className={estilos.productos}>
                        <thead>
                            <tr>
                                <th>Cant</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venta.productos.map((producto, index) => {
                                const cantidadPendiente = producto.cantidad - producto.cantidad_despachada
                                const esDespachoParcial = cantidadPendiente > 0
                                
                                return (
                                    <tr key={index}>
                                        <td className={estilos.centrado}>
                                            {esDespachoParcial ? (
                                                <span>
                                                    {producto.cantidad_despachada}/{producto.cantidad}
                                                </span>
                                            ) : (
                                                producto.cantidad
                                            )}
                                        </td>
                                        <td>
                                            {producto.nombre_producto}
                                            {esDespachoParcial && (
                                                <div style={{fontSize: '0.85em', color: '#ef4444', marginTop: '2px'}}>
                                                    Pendiente: {cantidadPendiente}
                                                </div>
                                            )}
                                        </td>
                                        <td className={estilos.derecha}>{formatearMoneda(producto.precio_unitario)}</td>
                                        <td className={estilos.derecha}>{formatearMoneda(producto.total)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    <div className={estilos.linea}></div>

                    <div className={estilos.totales}>
                        <div className={estilos.fila}>
                            <span>Subtotal:</span>
                            <span>{formatearMoneda(venta.subtotal)}</span>
                        </div>
                        {parseFloat(venta.descuento) > 0 && (
                            <div className={estilos.fila}>
                                <span>Descuento:</span>
                                <span>-{formatearMoneda(venta.descuento)}</span>
                            </div>
                        )}
                        <div className={estilos.fila}>
                            <span>{empresa.impuesto_nombre} ({empresa.impuesto_porcentaje}%):</span>
                            <span>{formatearMoneda(venta.itbis)}</span>
                        </div>
                        <div className={estilos.lineaDoble}></div>
                        <div className={`${estilos.fila} ${estilos.total}`}>
                            <span>TOTAL:</span>
                            <span>{formatearMoneda(venta.total)}</span>
                        </div>

                        {venta.metodo_pago === 'efectivo' && venta.efectivo_recibido && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>Recibido:</span>
                                    <span>{formatearMoneda(venta.efectivo_recibido)}</span>
                                </div>
                                <div className={estilos.fila}>
                                    <span>Cambio:</span>
                                    <span>{formatearMoneda(venta.cambio)}</span>
                                </div>
                            </>
                        )}

                        {opciones.mostrarMetodoPago && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>Método de Pago:</span>
                                    <span>{venta.metodo_pago_texto}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {opciones.mostrarNotas && venta.notas && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.notas}>
                                <p><strong>NOTA:</strong> {venta.notas}</p>
                            </div>
                        </>
                    )}

                    {opciones.mostrarCodigoBarras && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.codigoQR}>
                                <Barcode 
                                    value={venta.numero_interno}
                                    format="CODE128"
                                    width={2}
                                    height={60}
                                    displayValue={true}
                                    fontSize={14}
                                    margin={10}
                                />
                            </div>
                        </>
                    )}

                    {opciones.mostrarMensajeFinal && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.footer}>
                                {empresa.mensaje_factura && (
                                    <p className={estilos.mensaje}>{empresa.mensaje_factura}</p>
                                )}
                                <p className={estilos.legal}>Comprobante fiscal autorizado DGII</p>
                                <p className={estilos.fecha}>{new Date().toLocaleDateString('es-DO')}</p>
                                <p className={estilos.gracias}>¡GRACIAS POR SU COMPRA!</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}