"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    obtenerConfiguracion, 
    actualizarEmpresa,
    obtenerMonedas,
    crearMoneda,
    actualizarMoneda,
    eliminarMoneda,
    obtenerUnidadesMedida,
    crearUnidadMedida,
    actualizarUnidadMedida,
    eliminarUnidadMedida
} from './servidor'
import estilos from './configuracion.module.css'

export default function ConfiguracionAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [tabActiva, setTabActiva] = useState('general')
    
    const [datosEmpresa, setDatosEmpresa] = useState({
        nombre_empresa: '',
        rnc: '',
        razon_social: '',
        nombre_comercial: '',
        actividad_economica: '',
        direccion: '',
        sector: '',
        municipio: '',
        provincia: '',
        telefono: '',
        email: '',
        moneda: 'DOP',
        simbolo_moneda: 'RD$',
        impuesto_nombre: 'ITBIS',
        impuesto_porcentaje: 18.00,
        mensaje_factura: ''
    })

    const [monedas, setMonedas] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    const [modalMoneda, setModalMoneda] = useState(false)
    const [modalUnidad, setModalUnidad] = useState(false)
    const [editandoMoneda, setEditandoMoneda] = useState(null)
    const [editandoUnidad, setEditandoUnidad] = useState(null)

    const [formMoneda, setFormMoneda] = useState({
        codigo: '',
        nombre: '',
        simbolo: '',
        activo: true
    })

    const [formUnidad, setFormUnidad] = useState({
        codigo: '',
        nombre: '',
        abreviatura: '',
        activo: true
    })

    const [errores, setErrores] = useState({})

    const provincias = [
        'Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte',
        'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal',
        'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez',
        'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia',
        'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan',
        'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez',
        'Santo Domingo', 'Valverde'
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
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoConfig, resultadoMonedas, resultadoUnidades] = await Promise.all([
                obtenerConfiguracion(),
                obtenerMonedas(),
                obtenerUnidadesMedida()
            ])

            if (resultadoConfig.success) {
                setDatosEmpresa({
                    nombre_empresa: resultadoConfig.empresa.nombre_empresa || '',
                    rnc: resultadoConfig.empresa.rnc || '',
                    razon_social: resultadoConfig.empresa.razon_social || '',
                    nombre_comercial: resultadoConfig.empresa.nombre_comercial || '',
                    actividad_economica: resultadoConfig.empresa.actividad_economica || '',
                    direccion: resultadoConfig.empresa.direccion || '',
                    sector: resultadoConfig.empresa.sector || '',
                    municipio: resultadoConfig.empresa.municipio || '',
                    provincia: resultadoConfig.empresa.provincia || '',
                    telefono: resultadoConfig.empresa.telefono || '',
                    email: resultadoConfig.empresa.email || '',
                    moneda: resultadoConfig.empresa.moneda || 'DOP',
                    simbolo_moneda: resultadoConfig.empresa.simbolo_moneda || 'RD$',
                    impuesto_nombre: resultadoConfig.empresa.impuesto_nombre || 'ITBIS',
                    impuesto_porcentaje: resultadoConfig.empresa.impuesto_porcentaje || 18.00,
                    mensaje_factura: resultadoConfig.empresa.mensaje_factura || ''
                })
            }

            if (resultadoMonedas.success) {
                const monedasUnicas = resultadoMonedas.monedas.reduce((acc, moneda) => {
                    if (!acc.find(m => m.codigo === moneda.codigo)) {
                        acc.push(moneda)
                    }
                    return acc
                }, [])
                setMonedas(monedasUnicas)
            }

            if (resultadoUnidades.success) {
                setUnidadesMedida(resultadoUnidades.unidades)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setDatosEmpresa(prev => ({
            ...prev,
            [name]: value
        }))
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const manejarCambioMoneda = (e) => {
        const monedaSeleccionada = monedas.find(m => m.codigo === e.target.value)
        setDatosEmpresa(prev => ({
            ...prev,
            moneda: monedaSeleccionada.codigo,
            simbolo_moneda: monedaSeleccionada.simbolo
        }))
    }

    const abrirModalMoneda = (moneda = null) => {
        if (moneda) {
            setFormMoneda({
                codigo: moneda.codigo,
                nombre: moneda.nombre,
                simbolo: moneda.simbolo,
                activo: moneda.activo
            })
            setEditandoMoneda(moneda.id)
        } else {
            setFormMoneda({
                codigo: '',
                nombre: '',
                simbolo: '',
                activo: true
            })
            setEditandoMoneda(null)
        }
        setModalMoneda(true)
    }

    const abrirModalUnidad = (unidad = null) => {
        if (unidad) {
            setFormUnidad({
                codigo: unidad.codigo,
                nombre: unidad.nombre,
                abreviatura: unidad.abreviatura,
                activo: unidad.activo
            })
            setEditandoUnidad(unidad.id)
        } else {
            setFormUnidad({
                codigo: '',
                nombre: '',
                abreviatura: '',
                activo: true
            })
            setEditandoUnidad(null)
        }
        setModalUnidad(true)
    }

    const guardarMoneda = async () => {
        setProcesando(true)
        try {
            let resultado
            if (editandoMoneda) {
                resultado = await actualizarMoneda(editandoMoneda, formMoneda)
            } else {
                resultado = await crearMoneda(formMoneda)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                setModalMoneda(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al guardar')
        } finally {
            setProcesando(false)
        }
    }

    const guardarUnidad = async () => {
        setProcesando(true)
        try {
            let resultado
            if (editandoUnidad) {
                resultado = await actualizarUnidadMedida(editandoUnidad, formUnidad)
            } else {
                resultado = await crearUnidadMedida(formUnidad)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                setModalUnidad(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al guardar')
        } finally {
            setProcesando(false)
        }
    }

    const eliminarMonedaHandler = async (id, nombre) => {
        if (!confirm(`¿Eliminar moneda ${nombre}?`)) return

        setProcesando(true)
        try {
            const resultado = await eliminarMoneda(id)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al eliminar')
        } finally {
            setProcesando(false)
        }
    }

    const eliminarUnidadHandler = async (id, nombre) => {
        if (!confirm(`¿Eliminar unidad ${nombre}?`)) return

        setProcesando(true)
        try {
            const resultado = await eliminarUnidadMedida(id)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al eliminar')
        } finally {
            setProcesando(false)
        }
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        setProcesando(true)
        try {
            const resultado = await actualizarEmpresa(datosEmpresa)

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al guardar')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando configuracion...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Configuracion</h1>
                    <p className={estilos.subtitulo}>Administra la configuracion de tu empresa</p>
                </div>
            </div>

            <div className={estilos.tabs}>
                <button className={`${estilos.tab} ${tabActiva === 'general' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('general')}>
                    <ion-icon name="business-outline"></ion-icon>
                    <span>General</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'ubicacion' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('ubicacion')}>
                    <ion-icon name="location-outline"></ion-icon>
                    <span>Ubicacion</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'financiero' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('financiero')}>
                    <ion-icon name="cash-outline"></ion-icon>
                    <span>Financiero</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'monedas' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('monedas')}>
                    <ion-icon name="logo-usd"></ion-icon>
                    <span>Monedas</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'unidades' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('unidades')}>
                    <ion-icon name="scale-outline"></ion-icon>
                    <span>Unidades</span>
                </button>
            </div>

            {(tabActiva === 'general' || tabActiva === 'ubicacion' || tabActiva === 'financiero') && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <form onSubmit={manejarSubmit} className={estilos.formulario}>
                        {tabActiva === 'general' && (
                            <>
                                <div className={estilos.grupoInput}>
                                    <label>Nombre de la Empresa *</label>
                                    <input type="text" name="nombre_empresa" value={datosEmpresa.nombre_empresa} onChange={manejarCambio} disabled={procesando} />
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>RNC *</label>
                                        <input type="text" name="rnc" value={datosEmpresa.rnc} onChange={manejarCambio} disabled={procesando} maxLength="11" />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Razon Social *</label>
                                        <input type="text" name="razon_social" value={datosEmpresa.razon_social} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Nombre Comercial</label>
                                        <input type="text" name="nombre_comercial" value={datosEmpresa.nombre_comercial} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Actividad Economica</label>
                                        <input type="text" name="actividad_economica" value={datosEmpresa.actividad_economica} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Telefono</label>
                                        <input type="tel" name="telefono" value={datosEmpresa.telefono} onChange={manejarCambio} disabled={procesando} maxLength="20" />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Email</label>
                                        <input type="email" name="email" value={datosEmpresa.email} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                            </>
                        )}

                        {tabActiva === 'ubicacion' && (
                            <>
                                <div className={estilos.grupoInput}>
                                    <label>Direccion *</label>
                                    <textarea name="direccion" value={datosEmpresa.direccion} onChange={manejarCambio} rows="3" disabled={procesando} />
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Sector</label>
                                        <input type="text" name="sector" value={datosEmpresa.sector} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Municipio</label>
                                        <input type="text" name="municipio" value={datosEmpresa.municipio} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Provincia *</label>
                                    <select name="provincia" value={datosEmpresa.provincia} onChange={manejarCambio} disabled={procesando}>
                                        <option value="">Seleccionar provincia</option>
                                        {provincias.map(prov => (
                                            <option key={prov} value={prov}>{prov}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {tabActiva === 'financiero' && (
                            <>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Moneda *</label>
                                        <select name="moneda" value={datosEmpresa.moneda} onChange={manejarCambioMoneda} disabled={procesando}>
                                            {monedas.filter(m => m.activo).map(mon => (
                                                <option key={`moneda-${mon.id}-${mon.codigo}`} value={mon.codigo}>
                                                    {mon.nombre} ({mon.simbolo})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Simbolo de Moneda</label>
                                        <input type="text" name="simbolo_moneda" value={datosEmpresa.simbolo_moneda} disabled className={estilos.inputDisabled} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Nombre del Impuesto</label>
                                        <input type="text" name="impuesto_nombre" value={datosEmpresa.impuesto_nombre} onChange={manejarCambio} disabled={procesando} placeholder="ITBIS, IVA, etc" />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Porcentaje del Impuesto (%)</label>
                                        <input type="number" name="impuesto_porcentaje" value={datosEmpresa.impuesto_porcentaje} onChange={manejarCambio} disabled={procesando} step="0.01" min="0" max="100" />
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>Mensaje en Facturas</label>
                                    <textarea name="mensaje_factura" value={datosEmpresa.mensaje_factura} onChange={manejarCambio} rows="4" disabled={procesando} placeholder="Mensaje al pie de facturas" />
                                </div>
                            </>
                        )}

                        <div className={estilos.formularioFooter}>
                            <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>{procesando ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tabActiva === 'monedas' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2>Gestion de Monedas</h2>
                        <button onClick={() => abrirModalMoneda()} className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>Nueva Moneda</span>
                        </button>
                    </div>
                    <div className={estilos.grid}>
                        {monedas.map(moneda => (
                            <div key={`card-${moneda.id}`} className={`${estilos.itemCard} ${estilos[tema]}`}>
                                <div className={estilos.itemHeader}>
                                    <div>
                                        <h3>{moneda.nombre}</h3>
                                        <p>{moneda.codigo} - {moneda.simbolo}</p>
                                    </div>
                                    <span className={`${estilos.badge} ${moneda.activo ? estilos.activo : estilos.inactivo}`}>
                                        {moneda.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <div className={estilos.itemAcciones}>
                                    <button onClick={() => abrirModalMoneda(moneda)} className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => eliminarMonedaHandler(moneda.id, moneda.nombre)} className={`${estilos.btnIcono} ${estilos.eliminar}`}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tabActiva === 'unidades' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2>Unidades de Medida</h2>
                        <button onClick={() => abrirModalUnidad()} className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>Nueva Unidad</span>
                        </button>
                    </div>
                    <div className={estilos.grid}>
                        {unidadesMedida.map(unidad => (
                            <div key={unidad.id} className={`${estilos.itemCard} ${estilos[tema]}`}>
                                <div className={estilos.itemHeader}>
                                    <div>
                                        <h3>{unidad.nombre}</h3>
                                        <p>{unidad.codigo} - {unidad.abreviatura}</p>
                                    </div>
                                    <span className={`${estilos.badge} ${unidad.activo ? estilos.activo : estilos.inactivo}`}>
                                        {unidad.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <div className={estilos.itemAcciones}>
                                    <button onClick={() => abrirModalUnidad(unidad)} className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => eliminarUnidadHandler(unidad.id, unidad.nombre)} className={`${estilos.btnIcono} ${estilos.eliminar}`}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modalMoneda && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoMoneda ? 'Editar Moneda' : 'Nueva Moneda'}</h3>
                            <button onClick={() => setModalMoneda(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>Codigo *</label>
                                <input type="text" value={formMoneda.codigo} onChange={(e) => setFormMoneda({...formMoneda, codigo: e.target.value})} maxLength="3" />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>Nombre *</label>
                                <input type="text" value={formMoneda.nombre} onChange={(e) => setFormMoneda({...formMoneda, nombre: e.target.value})} />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>Simbolo *</label>
                                <input type="text" value={formMoneda.simbolo} onChange={(e) => setFormMoneda({...formMoneda, simbolo: e.target.value})} maxLength="5" />
                            </div>
                            <div className={estilos.grupoCheckbox}>
                                <input type="checkbox" id="activoMoneda" checked={formMoneda.activo} onChange={(e) => setFormMoneda({...formMoneda, activo: e.target.checked})} />
                                <label htmlFor="activoMoneda">Activo</label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setModalMoneda(false)} className={estilos.btnCancelar}>Cancelar</button>
                            <button onClick={guardarMoneda} className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{procesando ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalUnidad && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoUnidad ? 'Editar Unidad' : 'Nueva Unidad'}</h3>
                            <button onClick={() => setModalUnidad(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>Codigo *</label>
                                <input type="text" value={formUnidad.codigo} onChange={(e) => setFormUnidad({...formUnidad, codigo: e.target.value})} maxLength="10" />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>Nombre *</label>
                                <input type="text" value={formUnidad.nombre} onChange={(e) => setFormUnidad({...formUnidad, nombre: e.target.value})} />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>Abreviatura *</label>
                                <input type="text" value={formUnidad.abreviatura} onChange={(e) => setFormUnidad({...formUnidad, abreviatura: e.target.value})} maxLength="10" />
                            </div>
                            <div className={estilos.grupoCheckbox}>
                                <input type="checkbox" id="activoUnidad" checked={formUnidad.activo} onChange={(e) => setFormUnidad({...formUnidad, activo: e.target.checked})} />
                                <label htmlFor="activoUnidad">Activo</label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setModalUnidad(false)} className={estilos.btnCancelar}>Cancelar</button>
                            <button onClick={guardarUnidad} className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{procesando ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}