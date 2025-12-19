DROP DATABASE IF EXISTS punto_venta_rd;
CREATE DATABASE IF NOT EXISTS punto_venta_rd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE punto_venta_rd;

CREATE TABLE plataforma_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_plataforma VARCHAR(200) NOT NULL DEFAULT 'Punto de Venta RD',
    logo_url VARCHAR(255),
    email_contacto VARCHAR(100),
    telefono_contacto VARCHAR(20),
    telefono_whatsapp VARCHAR(20),
    direccion TEXT,
    color_primario VARCHAR(7) DEFAULT '#3B82F6',
    color_secundario VARCHAR(7) DEFAULT '#1E40AF',
    copyright VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE empresas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_empresa VARCHAR(200) NOT NULL,
    rnc VARCHAR(11) NOT NULL,
    razon_social VARCHAR(250) NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    actividad_economica VARCHAR(200) NOT NULL,
    direccion TEXT NOT NULL,
    sector VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    moneda VARCHAR(3) DEFAULT 'DOP',
    simbolo_moneda VARCHAR(5) DEFAULT 'RD$',
    impuesto_nombre VARCHAR(50) DEFAULT 'ITBIS',
    impuesto_porcentaje DECIMAL(5, 2) DEFAULT 18.00,
    logo_url VARCHAR(255),
    color_fondo VARCHAR(7) DEFAULT '#FFFFFF',
    mensaje_factura TEXT,
    secuencia_ncf_fiscal VARCHAR(20),
    secuencia_ncf_consumidor VARCHAR(20),
    secuencia_ncf_gubernamental VARCHAR(20),
    secuencia_ncf_regimenes VARCHAR(20),
    fecha_vencimiento_ncf DATE,
    usuario_dgii VARCHAR(100),
    ambiente_dgii ENUM('prueba', 'produccion') DEFAULT 'prueba',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rnc (rnc),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE permisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    modulo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    clave VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_modulo (modulo),
    INDEX idx_clave (clave)
) ENGINE=InnoDB;

CREATE TABLE roles_permisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE,
    INDEX idx_rol (rol_id),
    INDEX idx_permiso (permiso_id)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NULL,
    rol_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    tipo ENUM('superadmin', 'admin', 'vendedor') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_cedula (cedula),
    INDEX idx_email (email),
    INDEX idx_tipo (tipo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE solicitudes_registro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    nombre_empresa VARCHAR(200),
    rnc VARCHAR(11),
    razon_social VARCHAR(250),
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    notas TEXT,
    INDEX idx_estado (estado),
    INDEX idx_email (email),
    INDEX idx_fecha (fecha_solicitud)
) ENGINE=InnoDB;

CREATE TABLE monedas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_nombre (nombre),
    INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB;

CREATE TABLE marcas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    pais_origen VARCHAR(50),
    descripcion TEXT,
    logo_url VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_nombre (nombre),
    INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB;

CREATE TABLE unidades_medida (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    codigo_barras VARCHAR(50),
    sku VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    marca_id INT,
    unidad_medida_id INT,
    precio_compra DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    precio_oferta DECIMAL(10, 2),
    precio_mayorista DECIMAL(10, 2),
    cantidad_mayorista INT DEFAULT 6,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    stock_maximo INT DEFAULT 100,
    imagen_url VARCHAR(1000),
    aplica_itbis BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_vencimiento DATE,
    lote VARCHAR(50),
    ubicacion_bodega VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL,
    FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id) ON DELETE SET NULL,
    INDEX idx_codigo_barras (codigo_barras),
    INDEX idx_sku (sku),
    INDEX idx_nombre (nombre),
    INDEX idx_empresa (empresa_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_marca (marca_id)
) ENGINE=InnoDB;

CREATE TABLE tipos_documento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    longitud_min INT NOT NULL,
    longitud_max INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    tipo_documento_id INT NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    sector VARCHAR(100),
    municipio VARCHAR(100),
    provincia VARCHAR(100),
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro', 'prefiero_no_decir'),
    total_compras DECIMAL(12, 2) DEFAULT 0.00,
    puntos_fidelidad INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
    INDEX idx_nombre (nombre),
    INDEX idx_documento (numero_documento),
    INDEX idx_empresa (empresa_id),
    INDEX idx_telefono (telefono)
) ENGINE=InnoDB;

CREATE TABLE proveedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    rnc VARCHAR(11) NOT NULL,
    razon_social VARCHAR(250) NOT NULL,
    nombre_comercial VARCHAR(200),
    actividad_economica VARCHAR(200),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    sector VARCHAR(100),
    municipio VARCHAR(100),
    provincia VARCHAR(100),
    sitio_web VARCHAR(255),
    condiciones_pago TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_razon_social (razon_social),
    INDEX idx_rnc (rnc),
    INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB;

CREATE TABLE tipos_comprobante (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    prefijo_ncf VARCHAR(3),
    secuencia_desde BIGINT,
    secuencia_hasta BIGINT,
    secuencia_actual BIGINT DEFAULT 1,
    requiere_rnc BOOLEAN DEFAULT FALSE,
    requiere_razon_social BOOLEAN DEFAULT FALSE,
    genera_credito_fiscal BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    tipo_comprobante_id INT NOT NULL,
    ncf VARCHAR(19) NOT NULL,
    numero_interno VARCHAR(20) NOT NULL,
    usuario_id INT NOT NULL,
    cliente_id INT,
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    monto_gravado DECIMAL(10, 2) NOT NULL,
    itbis DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NOT NULL,
    tipo_entrega ENUM('completa', 'parcial') DEFAULT 'completa',
    despacho_completo BOOLEAN DEFAULT TRUE,
    efectivo_recibido DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    estado ENUM('emitida', 'anulada', 'pendiente') DEFAULT 'emitida',
    razon_anulacion TEXT,
    ncf_modificado VARCHAR(19),
    tipo_ingreso ENUM('01', '02', '03', '04') DEFAULT '01',
    tipo_operacion VARCHAR(2) DEFAULT '1',
    fecha_envio_dgii TIMESTAMP NULL,
    estado_dgii ENUM('enviado', 'aceptado', 'rechazado', 'no_enviado') DEFAULT 'no_enviado',
    notas TEXT,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_comprobante_id) REFERENCES tipos_comprobante(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    INDEX idx_ncf (ncf),
    INDEX idx_numero_interno (numero_interno),
    INDEX idx_fecha (fecha_venta),
    INDEX idx_empresa (empresa_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_comprobante (tipo_comprobante_id)
) ENGINE=InnoDB;

CREATE TABLE detalle_ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    cantidad_despachada INT DEFAULT 0,
    cantidad_pendiente INT DEFAULT 0,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    monto_gravado DECIMAL(10, 2) NOT NULL,
    itbis DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_venta (venta_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB;

CREATE TABLE despachos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    numero_despacho INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_despacho TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    estado ENUM('activo', 'cerrado', 'anulado') DEFAULT 'activo',
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_venta (venta_id),
    INDEX idx_fecha (fecha_despacho),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE detalle_despachos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    despacho_id INT NOT NULL,
    detalle_venta_id INT NOT NULL,
    cantidad_despachada INT NOT NULL,
    FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE,
    FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas(id) ON DELETE CASCADE,
    INDEX idx_despacho (despacho_id),
    INDEX idx_detalle_venta (detalle_venta_id)
) ENGINE=InnoDB;

CREATE TABLE compras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    tipo_comprobante_id INT NOT NULL,
    ncf VARCHAR(19) NOT NULL,
    proveedor_id INT NOT NULL,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    itbis DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NOT NULL DEFAULT 'efectivo',
    efectivo_pagado DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    estado ENUM('recibida', 'pendiente', 'anulada') DEFAULT 'recibida',
    notas TEXT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_comprobante_id) REFERENCES tipos_comprobante(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_ncf (ncf),
    INDEX idx_fecha (fecha_compra),
    INDEX idx_empresa (empresa_id),
    INDEX idx_proveedor (proveedor_id)
) ENGINE=InnoDB;

CREATE TABLE detalle_compras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_compra (compra_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB;

CREATE TABLE movimientos_inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    producto_id INT NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste', 'devolucion', 'merma') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia VARCHAR(100),
    usuario_id INT NOT NULL,
    notas TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (fecha_movimiento),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

CREATE TABLE cajas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    numero_caja INT NOT NULL,
    fecha_caja DATE NOT NULL,
    monto_inicial DECIMAL(10, 2) NOT NULL,
    monto_final DECIMAL(10, 2),
    total_ventas DECIMAL(10, 2) DEFAULT 0.00,
    total_efectivo DECIMAL(10, 2) DEFAULT 0.00,
    total_tarjeta_debito DECIMAL(10, 2) DEFAULT 0.00,
    total_tarjeta_credito DECIMAL(10, 2) DEFAULT 0.00,
    total_transferencia DECIMAL(10, 2) DEFAULT 0.00,
    total_cheque DECIMAL(10, 2) DEFAULT 0.00,
    total_gastos DECIMAL(10, 2) DEFAULT 0.00,
    diferencia DECIMAL(10, 2) DEFAULT 0.00,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    notas TEXT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_caja (fecha_caja),
    INDEX idx_fecha_apertura (fecha_apertura),
    UNIQUE KEY unique_caja_dia (empresa_id, fecha_caja, numero_caja)
) ENGINE=InnoDB;

CREATE TABLE gastos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    usuario_id INT NOT NULL,
    caja_id INT,
    comprobante_numero VARCHAR(50),
    notas TEXT,
    fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha_gasto),
    INDEX idx_empresa (empresa_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB;

CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NULL,
    name VARCHAR(50) NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_empresa (empresa_id),
    UNIQUE KEY unique_setting_empresa (empresa_id, name)
) ENGINE=InnoDB;

CREATE TABLE venta_extras (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    empresa_id INT NOT NULL,
    usuario_id INT NULL,
    tipo VARCHAR(50) NULL,
    nombre VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    precio_unitario DECIMAL(14, 2) NOT NULL,
    aplica_itbis BOOLEAN DEFAULT TRUE,
    impuesto_porcentaje DECIMAL(5, 2) NOT NULL,
    monto_base DECIMAL(14, 2) NOT NULL,
    monto_impuesto DECIMAL(14, 2) NOT NULL,
    monto_total DECIMAL(14, 2) NOT NULL,
    notas TEXT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_venta (venta_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB;

INSERT INTO plataforma_config (nombre_plataforma, email_contacto) VALUES 
('Punto de Venta RD', 'admin@puntoventa.com');

INSERT INTO monedas (codigo, nombre, simbolo, activo) VALUES
('DOP', 'Peso Dominicano', 'RD$', 1),
('USD', 'Dolar Estadounidense', 'US$', 1),
('EUR', 'Euro', '€', 0);

INSERT INTO tipos_documento (codigo, nombre, longitud_min, longitud_max) VALUES
('CED', 'Cedula de Identidad', 11, 13),
('RNC', 'Registro Nacional de Contribuyentes', 9, 11),
('PAS', 'Pasaporte', 6, 15);

INSERT INTO tipos_comprobante (codigo, nombre, prefijo_ncf, secuencia_desde, secuencia_hasta, requiere_rnc, requiere_razon_social, genera_credito_fiscal) VALUES
('B01', 'Comprobante Credito Fiscal', 'B01', 1, 10000000, TRUE, TRUE, TRUE),
('B02', 'Comprobante Consumidor Final', 'B02', 1, 10000000, FALSE, FALSE, FALSE),
('B14', 'Comprobante Regimenes Especiales', 'B14', 1, 10000000, TRUE, TRUE, FALSE),
('B15', 'Comprobante Gubernamental', 'B15', 1, 10000000, TRUE, TRUE, TRUE),
('B16', 'Comprobante Exportaciones', 'B16', 1, 10000000, TRUE, TRUE, FALSE),
('B04', 'Nota de Credito', 'B04', 1, 10000000, TRUE, TRUE, TRUE),
('B03', 'Nota de Debito', 'B03', 1, 10000000, TRUE, TRUE, TRUE);

INSERT INTO unidades_medida (codigo, nombre, abreviatura) VALUES
('UN', 'Unidad', 'UN'),
('ML', 'Mililitro', 'ml'),
('GR', 'Gramo', 'gr'),
('KG', 'Kilogramo', 'kg'),
('LT', 'Litro', 'lt'),
('CJ', 'Caja', 'cj'),
('PQ', 'Paquete', 'pq'),
('SET', 'Set/Conjunto', 'set');

INSERT INTO roles (nombre, descripcion, activo) VALUES
('vendedor', 'Vendedor con permisos limitados', TRUE),
('cajero', 'Cajero con acceso a caja y ventas', TRUE),
('inventario', 'Encargado de inventario', TRUE);

INSERT INTO permisos (modulo, nombre, clave, descripcion, activo) VALUES
('generico', 'Acceso al dashboard', 'dashboard.view', 'Ver dashboard principal', TRUE),
('reportes', 'Ver reportes', 'reportes.view', 'Acceso a módulo de reportes', TRUE),
('reportes', 'Exportar reportes', 'reportes.export', 'Exportar reportes a PDF/Excel', TRUE),
('configuracion', 'Ver configuración', 'configuracion.view', 'Acceso a configuración', TRUE),
('configuracion', 'Editar configuración', 'configuracion.edit', 'Modificar configuración', TRUE),
('ventas', 'Ver ventas', 'ventas.view', 'Ver listado de ventas', TRUE),
('ventas', 'Crear ventas', 'ventas.create', 'Realizar nuevas ventas', TRUE),
('ventas', 'Editar ventas', 'ventas.edit', 'Modificar ventas', TRUE),
('ventas', 'Anular ventas', 'ventas.delete', 'Anular ventas', TRUE),
('clientes', 'Ver clientes', 'clientes.view', 'Ver listado de clientes', TRUE),
('clientes', 'Crear clientes', 'clientes.create', 'Registrar nuevos clientes', TRUE),
('clientes', 'Editar clientes', 'clientes.edit', 'Modificar datos de clientes', TRUE),
('clientes', 'Eliminar clientes', 'clientes.delete', 'Eliminar clientes', TRUE),
('productos', 'Ver productos', 'productos.view', 'Ver listado de productos', TRUE),
('productos', 'Crear productos', 'productos.create', 'Registrar nuevos productos', TRUE),
('productos', 'Editar productos', 'productos.edit', 'Modificar productos', TRUE),
('productos', 'Eliminar productos', 'productos.delete', 'Eliminar productos', TRUE),
('inventario', 'Ver inventario', 'inventario.view', 'Ver inventario', TRUE),
('inventario', 'Ajustar inventario', 'inventario.adjust', 'Realizar ajustes de inventario', TRUE),
('caja', 'Abrir caja', 'caja.open', 'Abrir caja', TRUE),
('caja', 'Cerrar caja', 'caja.close', 'Cerrar caja', TRUE),
('caja', 'Ver movimientos caja', 'caja.view', 'Ver movimientos de caja', TRUE),
('compras', 'Ver compras', 'compras.view', 'Ver listado de compras', TRUE),
('compras', 'Crear compras', 'compras.create', 'Registrar nuevas compras', TRUE),
('proveedores', 'Ver proveedores', 'proveedores.view', 'Ver listado de proveedores', TRUE),
('proveedores', 'Crear proveedores', 'proveedores.create', 'Registrar nuevos proveedores', TRUE);

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'vendedor'
AND p.clave IN (
    'dashboard.view',
    'ventas.view', 'ventas.create',
    'clientes.view', 'clientes.create',
    'productos.view',
    'caja.open', 'caja.close', 'caja.view'
);

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'cajero'
AND p.clave IN (
    'dashboard.view',
    'ventas.view', 'ventas.create',
    'clientes.view',
    'productos.view',
    'caja.open', 'caja.close', 'caja.view'
);

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'inventario'
AND p.clave IN (
    'dashboard.view',
    'productos.view', 'productos.create', 'productos.edit',
    'inventario.view', 'inventario.adjust',
    'compras.view', 'compras.create',
    'proveedores.view', 'proveedores.create'
);

UPDATE plataforma_config SET copyright = '© 2025 IziWeek. Todos los derechos reservados.' WHERE id = 1;