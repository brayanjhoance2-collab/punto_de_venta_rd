"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from './servidor'
import estilos from './clientes.module.css'

export default function ClientesAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [clientes, setClientes] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroTipoDoc, setFiltroTipoDoc] = useState('todos')
    
    const [mostrarModal, setMostrarModal] = useState(false)
    const [modoModal, setModoModal] = useState('crear')
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    
    const [tipoDocumentoId, setTipoDocumentoId] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [direccion, setDireccion] = useState('')
    const [sector, setSector] = useState('')
    const [municipio, setMunicipio] = useState('')
    const [provincia, setProvincia] = useState('')
    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [genero, setGenero] = useState('')

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
        cargarClientes()
    }, [])

    const cargarClientes = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerClientes()
            if (resultado.success) {
                setClientes(resultado.clientes)
                setTiposDocumento(resultado.tiposDocumento)
            } else {
                alert(resultado.mensaje || 'Error al cargar clientes')
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const abrirModalCrear = () => {
        limpiarFormulario()
        setModoModal('crear')
        setMostrarModal(true)
    }

    const abrirModalEditar = (cliente) => {
        setClienteSeleccionado(cliente)
        setTipoDocumentoId(cliente.tipo_documento_id.toString())
        setNumeroDocumento(cliente.numero_documento)
        setNombre(cliente.nombre)
        setApellidos(cliente.apellidos || '')
        setTelefono(cliente.telefono || '')
        setEmail(cliente.email || '')
        setDireccion(cliente.direccion || '')
        setSector(cliente.sector || '')
        setMunicipio(cliente.municipio || '')
        setProvincia(cliente.provincia || '')
        setFechaNacimiento(cliente.fecha_nacimiento || '')
        setGenero(cliente.genero || '')
        setModoModal('editar')
        setMostrarModal(true)
    }

    const abrirModalVer = (cliente) => {
        setClienteSeleccionado(cliente)
        setModoModal('ver')
        setMostrarModal(true)
    }

    const limpiarFormulario = () => {
        setClienteSeleccionado(null)
        setTipoDocumentoId('')
        setNumeroDocumento('')
        setNombre('')
        setApellidos('')
        setTelefono('')
        setEmail('')
        setDireccion('')
        setSector('')
        setMunicipio('')
        setProvincia('')
        setFechaNacimiento('')
        setGenero('')
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        limpiarFormulario()
    }

    const validarFormulario = () => {
        if (!tipoDocumentoId) {
            alert('Selecciona un tipo de documento')
            return false
        }

        if (!numeroDocumento.trim()) {
            alert('El numero de documento es obligatorio')
            return false
        }

        if (!nombre.trim()) {
            alert('El nombre es obligatorio')
            return false
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('El email no es valido')
            return false
        }

        if (fechaNacimiento) {
            const fecha = new Date(fechaNacimiento)
            const hoy = new Date()
            const hace150anos = new Date()
            hace150anos.setFullYear(hoy.getFullYear() - 150)
            
            if (fecha > hoy) {
                alert('La fecha de nacimiento no puede ser futura')
                return false
            }
            
            if (fecha < hace150anos) {
                alert('La fecha de nacimiento no es valida')
                return false
            }
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const datosCliente = {
                tipo_documento_id: parseInt(tipoDocumentoId),
                numero_documento: numeroDocumento.trim(),
                nombre: nombre.trim(),
                apellidos: apellidos.trim() || null,
                telefono: telefono.trim() || null,
                email: email.trim() || null,
                direccion: direccion.trim() || null,
                sector: sector.trim() || null,
                municipio: municipio.trim() || null,
                provincia: provincia.trim() || null,
                fecha_nacimiento: fechaNacimiento || null,
                genero: genero || null
            }

            let resultado

            if (modoModal === 'crear') {
                resultado = await crearCliente(datosCliente)
            } else if (modoModal === 'editar') {
                datosCliente.cliente_id = clienteSeleccionado.id
                resultado = await actualizarCliente(datosCliente)
            }

            if (resultado.success) {
                await cargarClientes()
                cerrarModal()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al procesar la solicitud')
            }
        } catch (error) {
            console.error('Error al procesar cliente:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (clienteId, nombreCliente) => {
        if (!confirm(`¿Estas seguro de eliminar al cliente "${nombreCliente}"? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarCliente(clienteId)
            if (resultado.success) {
                await cargarClientes()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al eliminar cliente')
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const clientesFiltrados = clientes.filter(cliente => {
        const cumpleBusqueda = busqueda === '' ||
            cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.numero_documento.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.telefono?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleTipoDoc = filtroTipoDoc === 'todos' || cliente.tipo_documento_id === parseInt(filtroTipoDoc)

        return cumpleBusqueda && cumpleTipoDoc
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
            total: clientes.length,
            conCompras: clientes.filter(c => parseFloat(c.total_compras) > 0).length,
            valorTotal: clientes.reduce((sum, c) => sum + parseFloat(c.total_compras), 0),
            activos: clientes.filter(c => c.activo).length
        }
    }

    const stats = calcularEstadisticas()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Clientes</h1>
                    <p className={estilos.subtitulo}>Gestiona tu cartera de clientes</p>
                </div>
                <button onClick={abrirModalCrear} className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Clientes</span>
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
                        <ion-icon name="cart-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Con Compras</span>
                        <span className={estilos.estadValor}>{stats.conCompras}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Total</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o telefono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <select
                    value={filtroTipoDoc}
                    onChange={(e) => setFiltroTipoDoc(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todos los tipos</option>
                    {tiposDocumento.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando clientes...</span>
                </div>
            ) : clientesFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="people-outline"></ion-icon>
                    <span>No hay clientes que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                        <div className={estilos.columna}>Cliente</div>
                        <div className={estilos.columna}>Documento</div>
                        <div className={estilos.columna}>Contacto</div>
                        <div className={estilos.columna}>Total Compras</div>
                        <div className={estilos.columna}>Puntos</div>
                        <div className={estilos.columna}>Estado</div>
                        <div className={estilos.columnaAcciones}>Acciones</div>
                    </div>

                    <div className={estilos.tablaBody}>
                        {clientesFiltrados.map((cliente) => (
                            <div key={cliente.id} className={`${estilos.fila} ${estilos[tema]}`}>
                                <div className={estilos.columna}>
                                    <div className={estilos.clienteInfo}>
                                        <span className={estilos.clienteNombre}>
                                            {cliente.nombre} {cliente.apellidos}
                                        </span>
                                        {cliente.email && (
                                            <span className={estilos.clienteEmail}>{cliente.email}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.documento}>
                                        {cliente.tipo_documento_codigo}: {cliente.numero_documento}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.telefono}>
                                        {cliente.telefono || 'N/A'}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.monto}>
                                        {formatearMoneda(cliente.total_compras)}
                                    </span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={estilos.puntos}>{cliente.puntos_fidelidad}</span>
                                </div>
                                <div className={estilos.columna}>
                                    <span className={`${estilos.badgeEstado} ${cliente.activo ? estilos.activo : estilos.inactivo}`}>
                                        {cliente.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <div className={estilos.columnaAcciones}>
                                    <button
                                        onClick={() => abrirModalVer(cliente)}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                    <button
                                        onClick={() => abrirModalEditar(cliente)}
                                        className={`${estilos.btnIcono} ${estilos.editar}`}
                                        title="Editar"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button
                                        onClick={() => manejarEliminar(cliente.id, `${cliente.nombre} ${cliente.apellidos || ''}`)}
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
                </div>
            )}

            {mostrarModal && (
                <div className={estilos.modalOverlay} onClick={modoModal === 'ver' ? cerrarModal : null}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>
                                {modoModal === 'crear' ? 'Nuevo Cliente' : modoModal === 'editar' ? 'Editar Cliente' : 'Detalle del Cliente'}
                            </h2>
                            <button
                                className={estilos.btnCerrarModal}
                                onClick={cerrarModal}
                                disabled={procesando && modoModal !== 'ver'}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        {modoModal === 'ver' ? (
                            <div className={estilos.modalBody}>
                                <div className={estilos.detalleCliente}>
                                    <div className={estilos.campo}>
                                        <span className={estilos.labelDetalle}>Nombre Completo</span>
                                        <span className={estilos.valorDetalle}>
                                            {clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}
                                        </span>
                                    </div>

                                    <div className={estilos.gridDetalle}>
                                        <div className={estilos.campo}>
                                            <span className={estilos.labelDetalle}>Tipo de Documento</span>
                                            <span className={estilos.valorDetalle}>{clienteSeleccionado.tipo_documento_nombre}</span>
                                        </div>
                                        <div className={estilos.campo}>
                                            <span className={estilos.labelDetalle}>Numero</span>
                                            <span className={estilos.valorDetalle}>{clienteSeleccionado.numero_documento}</span>
                                        </div>
                                    </div>

                                    {(clienteSeleccionado.telefono || clienteSeleccionado.email) && (
                                        <div className={estilos.gridDetalle}>
                                            {clienteSeleccionado.telefono && (
                                                <div className={estilos.campo}>
                                                    <span className={estilos.labelDetalle}>Telefono</span>
                                                    <span className={estilos.valorDetalle}>{clienteSeleccionado.telefono}</span>
                                                </div>
                                            )}
                                            {clienteSeleccionado.email && (
                                                <div className={estilos.campo}>
                                                    <span className={estilos.labelDetalle}>Email</span>
                                                    <span className={estilos.valorDetalle}>{clienteSeleccionado.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {clienteSeleccionado.direccion && (
                                        <div className={estilos.campo}>
                                            <span className={estilos.labelDetalle}>Direccion</span>
                                            <span className={estilos.valorDetalle}>{clienteSeleccionado.direccion}</span>
                                        </div>
                                    )}

                                    {(clienteSeleccionado.sector || clienteSeleccionado.municipio || clienteSeleccionado.provincia) && (
                                        <div className={estilos.gridDetalle}>
                                            {clienteSeleccionado.sector && (
                                                <div className={estilos.campo}>
                                                    <span className={estilos.labelDetalle}>Sector</span>
                                                    <span className={estilos.valorDetalle}>{clienteSeleccionado.sector}</span>
                                                </div>
                                            )}
                                            {clienteSeleccionado.municipio && (
                                                <div className={estilos.campo}>
                                                    <span className={estilos.labelDetalle}>Municipio</span>
                                                    <span className={estilos.valorDetalle}>{clienteSeleccionado.municipio}</span>
                                                </div>
                                            )}
                                            {clienteSeleccionado.provincia && (
                                                <div className={estilos.campo}>
                                                    <span className={estilos.labelDetalle}>Provincia</span>
                                                    <span className={estilos.valorDetalle}>{clienteSeleccionado.provincia}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={estilos.gridDetalle}>
                                        <div className={estilos.campo}>
                                            <span className={estilos.labelDetalle}>Total Compras</span>
                                            <span className={estilos.valorDetalle}>{formatearMoneda(clienteSeleccionado.total_compras)}</span>
                                        </div>
                                        <div className={estilos.campo}>
                                            <span className={estilos.labelDetalle}>Puntos Fidelidad</span>
                                            <span className={estilos.valorDetalle}>{clienteSeleccionado.puntos_fidelidad}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={manejarSubmit} className={estilos.modalBody}>
                                <div className={estilos.gridForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Tipo de Documento *</label>
                                        <select
                                            value={tipoDocumentoId}
                                            onChange={(e) => setTipoDocumentoId(e.target.value)}
                                            className={estilos.select}
                                            required
                                            disabled={procesando}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Numero de Documento *</label>
                                        <input
                                            type="text"
                                            value={numeroDocumento}
                                            onChange={(e) => setNumeroDocumento(e.target.value)}
                                            className={estilos.input}
                                            required
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Nombre *</label>
                                        <input
                                            type="text"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            className={estilos.input}
                                            required
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Apellidos</label>
                                        <input
                                            type="text"
                                            value={apellidos}
                                            onChange={(e) => setApellidos(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Telefono</label>
                                        <input
                                            type="tel"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Direccion</label>
                                    <input
                                        type="text"
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                    />
                                </div>

                                <div className={estilos.gridForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Sector</label>
                                        <input
                                            type="text"
                                            value={sector}
                                            onChange={(e) => setSector(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Municipio</label>
                                        <input
                                            type="text"
                                            value={municipio}
                                            onChange={(e) => setMunicipio(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Provincia</label>
                                        <input
                                            type="text"
                                            value={provincia}
                                            onChange={(e) => setProvincia(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={fechaNacimiento}
                                            onChange={(e) => setFechaNacimiento(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                            max={new Date().toISOString().split('T')[0]}
                                            min={new Date(new Date().setFullYear(new Date().getFullYear() - 150)).toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Genero</label>
                                        <select
                                            value={genero}
                                            onChange={(e) => setGenero(e.target.value)}
                                            className={estilos.select}
                                            disabled={procesando}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                            <option value="otro">Otro</option>
                                            <option value="prefiero_no_decir">Prefiero no decir</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={estilos.modalFooter}>
                                    <button
                                        type="button"
                                        className={estilos.btnCancelar}
                                        onClick={cerrarModal}
                                        disabled={procesando}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={estilos.btnGuardar}
                                        disabled={procesando}
                                    >
                                        {procesando ? 'Procesando...' : modoModal === 'crear' ? 'Crear Cliente' : 'Actualizar Cliente'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}