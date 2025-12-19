"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDatosProducto, crearProducto } from './servidor'
import estilos from './nuevo.module.css'

export default function NuevoProductoAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    
    const [codigoBarras, setCodigoBarras] = useState('')
    const [sku, setSku] = useState('')
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [categoriaId, setCategoriaId] = useState('')
    const [marcaId, setMarcaId] = useState('')
    const [unidadMedidaId, setUnidadMedidaId] = useState('')
    const [precioCompra, setPrecioCompra] = useState('')
    const [precioVenta, setPrecioVenta] = useState('')
    const [precioOferta, setPrecioOferta] = useState('')
    const [precioMayorista, setPrecioMayorista] = useState('')
    const [cantidadMayorista, setCantidadMayorista] = useState('6')
    const [stock, setStock] = useState('0')
    const [stockMinimo, setStockMinimo] = useState('5')
    const [stockMaximo, setStockMaximo] = useState('100')
    const [tipoImagen, setTipoImagen] = useState('url')
    const [imagenUrl, setImagenUrl] = useState('')
    const [imagenArchivo, setImagenArchivo] = useState(null)
    const [vistaPrevia, setVistaPrevia] = useState(null)
    const [aplicaItbis, setAplicaItbis] = useState(true)
    const [activo, setActivo] = useState(true)
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [lote, setLote] = useState('')
    const [ubicacionBodega, setUbicacionBodega] = useState('')

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

    useEffect(() => {
        if (nombre && !codigoBarras) {
            generarCodigoBarras()
        }
        if (nombre && !sku) {
            generarSKU()
        }
    }, [nombre])

    const generarCodigoBarras = () => {
        const randomNum = Math.floor(Math.random() * 900000000000) + 100000000000
        setCodigoBarras(randomNum.toString())
    }

    const generarSKU = () => {
        const prefijo = nombre.substring(0, 3).toUpperCase().replace(/\s/g, '')
        const randomNum = Math.floor(Math.random() * 9000) + 1000
        setSku(`${prefijo}-${randomNum}`)
    }

    const manejarCambioTipoImagen = (tipo) => {
        setTipoImagen(tipo)
        setImagenUrl('')
        setImagenArchivo(null)
        setVistaPrevia(null)
    }

    const manejarCambioImagen = (e) => {
        const archivo = e.target.files?.[0]
        if (!archivo) return

        const maxSize = 2 * 1024 * 1024

        if (archivo.size > maxSize) {
            alert('La imagen no debe superar los 2MB. Tu archivo pesa: ' + (archivo.size / 1024 / 1024).toFixed(2) + 'MB')
            e.target.value = ''
            setImagenArchivo(null)
            setVistaPrevia(null)
            return
        }

        if (!archivo.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido')
            e.target.value = ''
            setImagenArchivo(null)
            setVistaPrevia(null)
            return
        }

        setImagenArchivo(archivo)
        const reader = new FileReader()
        reader.onloadend = () => {
            setVistaPrevia(reader.result)
        }
        reader.readAsDataURL(archivo)
    }

    const manejarCambioImagenUrl = (e) => {
        const url = e.target.value
        setImagenUrl(url)
        setVistaPrevia(url || null)
    }

    const cargarDatos = async () => {
        try {
            const resultado = await obtenerDatosProducto()
            if (resultado.success) {
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
                setUnidadesMedida(resultado.unidadesMedida)
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/productos')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/productos')
        } finally {
            setCargando(false)
        }
    }

    const validarFormulario = () => {
        if (!nombre.trim()) {
            alert('El nombre del producto es obligatorio')
            return false
        }

        if (!precioCompra || parseFloat(precioCompra) < 0) {
            alert('El precio de compra debe ser mayor o igual a 0')
            return false
        }

        if (!precioVenta || parseFloat(precioVenta) < 0) {
            alert('El precio de venta debe ser mayor o igual a 0')
            return false
        }

        if (parseFloat(precioVenta) < parseFloat(precioCompra)) {
            if (!confirm('El precio de venta es menor que el precio de compra. ¿Deseas continuar?')) {
                return false
            }
        }

        if (!unidadMedidaId) {
            alert('Selecciona una unidad de medida')
            return false
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const datosProducto = {
                codigo_barras: codigoBarras.trim() || null,
                sku: sku.trim() || null,
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                categoria_id: categoriaId ? parseInt(categoriaId) : null,
                marca_id: marcaId ? parseInt(marcaId) : null,
                unidad_medida_id: parseInt(unidadMedidaId),
                precio_compra: parseFloat(precioCompra),
                precio_venta: parseFloat(precioVenta),
                precio_oferta: precioOferta ? parseFloat(precioOferta) : null,
                precio_mayorista: precioMayorista ? parseFloat(precioMayorista) : null,
                cantidad_mayorista: parseInt(cantidadMayorista),
                stock: parseInt(stock),
                stock_minimo: parseInt(stockMinimo),
                stock_maximo: parseInt(stockMaximo),
                imagen_url: tipoImagen === 'url' ? (imagenUrl.trim() || null) : null,
                imagen_base64: tipoImagen === 'local' && imagenArchivo ? vistaPrevia : null,
                aplica_itbis: aplicaItbis,
                activo: activo,
                fecha_vencimiento: fechaVencimiento || null,
                lote: lote.trim() || null,
                ubicacion_bodega: ubicacionBodega.trim() || null
            }

            const resultado = await crearProducto(datosProducto)

            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/productos')
            } else {
                alert(resultado.mensaje || 'Error al crear producto')
            }
        } catch (error) {
            console.error('Error al crear producto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

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
                    <h1 className={estilos.titulo}>Nuevo Producto</h1>
                    <p className={estilos.subtitulo}>Registra un nuevo producto en el inventario</p>
                </div>
                <button 
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/productos')}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>
                    <div className={estilos.columnaIzquierda}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>Información General</span>
                            </h3>

                            <div className={estilos.grupoInput}>
                                <label>Nombre del Producto *</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className={estilos.input}
                                    required
                                    placeholder="Ingresa el nombre del producto"
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className={estilos.textarea}
                                    rows="5"
                                    placeholder="Descripción detallada del producto..."
                                />
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Código de Barras</label>
                                    <input
                                        type="text"
                                        value={codigoBarras}
                                        onChange={(e) => setCodigoBarras(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Auto-generado"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>SKU</label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Auto-generado"
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridTresColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Categoría</label>
                                    <select
                                        value={categoriaId}
                                        onChange={(e) => setCategoriaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Marca</label>
                                    <select
                                        value={marcaId}
                                        onChange={(e) => setMarcaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">Sin marca</option>
                                        {marcas.map(marca => (
                                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Unidad *</label>
                                    <select
                                        value={unidadMedidaId}
                                        onChange={(e) => setUnidadMedidaId(e.target.value)}
                                        className={estilos.select}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {unidadesMedida.map(um => (
                                            <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <span>Precios y Costos</span>
                            </h3>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Precio de Compra *</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioCompra}
                                            onChange={(e) => setPrecioCompra(e.target.value)}
                                            className={estilos.inputConIcono}
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Precio de Venta *</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioVenta}
                                            onChange={(e) => setPrecioVenta(e.target.value)}
                                            className={estilos.inputConIcono}
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Precio de Oferta</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioOferta}
                                            onChange={(e) => setPrecioOferta(e.target.value)}
                                            className={estilos.inputConIcono}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Precio Mayorista</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioMayorista}
                                            onChange={(e) => setPrecioMayorista(e.target.value)}
                                            className={estilos.inputConIcono}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Cantidad Mínima para Precio Mayorista</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidadMayorista}
                                    onChange={(e) => setCantidadMayorista(e.target.value)}
                                    className={estilos.input}
                                    placeholder="6"
                                />
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>Control de Inventario</span>
                            </h3>

                            <div className={estilos.gridTresColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Stock Actual</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className={estilos.input}
                                        placeholder="0"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockMinimo}
                                        onChange={(e) => setStockMinimo(e.target.value)}
                                        className={estilos.input}
                                        placeholder="5"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Stock Máximo</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockMaximo}
                                        onChange={(e) => setStockMaximo(e.target.value)}
                                        className={estilos.input}
                                        placeholder="100"
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Fecha de Vencimiento</label>
                                    <input
                                        type="date"
                                        value={fechaVencimiento}
                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                        className={estilos.input}
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Número de Lote</label>
                                    <input
                                        type="text"
                                        value={lote}
                                        onChange={(e) => setLote(e.target.value)}
                                        className={estilos.input}
                                        placeholder="LOTE-2024-001"
                                    />
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Ubicación en Bodega</label>
                                <input
                                    type="text"
                                    value={ubicacionBodega}
                                    onChange={(e) => setUbicacionBodega(e.target.value)}
                                    className={estilos.input}
                                    placeholder="Ej: Pasillo 3, Estante A, Nivel 2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDerecha}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="image-outline"></ion-icon>
                                <span>Imagen del Producto</span>
                            </h3>

                            <div className={estilos.selectorTipo}>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${tipoImagen === 'url' ? estilos.activo : ''}`}
                                    onClick={() => manejarCambioTipoImagen('url')}
                                >
                                    <ion-icon name="link-outline"></ion-icon>
                                    <span>URL</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${tipoImagen === 'local' ? estilos.activo : ''}`}
                                    onClick={() => manejarCambioTipoImagen('local')}
                                >
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    <span>Subir</span>
                                </button>
                            </div>

                            {tipoImagen === 'url' ? (
                                <div className={estilos.grupoInput}>
                                    <label>URL de la Imagen</label>
                                    <input
                                        type="url"
                                        value={imagenUrl}
                                        onChange={manejarCambioImagenUrl}
                                        className={estilos.input}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                </div>
                            ) : (
                                <div className={estilos.grupoInput}>
                                    <label>Seleccionar Archivo (máx. 2MB)</label>
                                    <div className={estilos.contenedorArchivo}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={manejarCambioImagen}
                                            className={estilos.inputFile}
                                            id="archivo-imagen"
                                        />
                                        <label htmlFor="archivo-imagen" className={estilos.labelArchivo}>
                                            <ion-icon name="cloud-upload-outline"></ion-icon>
                                            <span>Seleccionar imagen</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {vistaPrevia && (
                                <div className={estilos.vistaPrevia}>
                                    <label>Vista Previa</label>
                                    <div className={estilos.contenedorImagen}>
                                        <img src={vistaPrevia} alt="Vista previa" />
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarImagen}
                                            onClick={() => {
                                                setVistaPrevia(null)
                                                setImagenUrl('')
                                                setImagenArchivo(null)
                                            }}
                                        >
                                            <ion-icon name="close-circle"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="settings-outline"></ion-icon>
                                <span>Configuración</span>
                            </h3>

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={aplicaItbis}
                                        onChange={(e) => setAplicaItbis(e.target.checked)}
                                        className={estilos.switchInput}
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>Aplica ITBIS (18%)</span>
                                </label>
                            </div>

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={activo}
                                        onChange={(e) => setActivo(e.target.checked)}
                                        className={estilos.switchInput}
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>Producto Activo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={estilos.footerFormulario}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/productos')}
                        className={estilos.btnCancelarForm}
                        disabled={procesando}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>
                    <button
                        type="submit"
                        className={estilos.btnGuardar}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline"></ion-icon>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Guardar Producto</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}