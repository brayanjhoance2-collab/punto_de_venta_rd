export class ESCPOSBuilder {
    constructor() {
        this.commands = [];
    }

    ESC = '\x1B';
    GS = '\x1D';
    LF = '\x0A';

    init() {
        this.commands.push(this.ESC + '@');
        return this;
    }

    alignLeft() {
        this.commands.push(this.ESC + 'a' + '\x00');
        return this;
    }

    alignCenter() {
        this.commands.push(this.ESC + 'a' + '\x01');
        return this;
    }

    alignRight() {
        this.commands.push(this.ESC + 'a' + '\x02');
        return this;
    }

    bold(enable = true) {
        this.commands.push(this.ESC + 'E' + (enable ? '\x01' : '\x00'));
        return this;
    }

    textSize(width = 1, height = 1) {
        const size = ((width - 1) << 4) | (height - 1);
        this.commands.push(this.GS + '!' + String.fromCharCode(size));
        return this;
    }

    text(str) {
        this.commands.push(str);
        return this;
    }

    newLine(lines = 1) {
        for (let i = 0; i < lines; i++) {
            this.commands.push(this.LF);
        }
        return this;
    }

    line(char = '-', width = 32) {
        this.commands.push(char.repeat(width) + this.LF);
        return this;
    }

    doubleLine(char = '=', width = 32) {
        this.line(char, width);
        return this;
    }

    cut() {
        this.commands.push(this.GS + 'V' + '\x41');
        return this;
    }

    build() {
        return this.commands.join('');
    }
}

export function generarTicketESCPOS(venta, empresa, anchoLinea = 32) {
    const builder = new ESCPOSBuilder();
    
    builder.init();
    
    builder.alignCenter().bold(true).textSize(2, 2);
    builder.text(empresa.nombre_empresa).newLine();
    
    builder.textSize(1, 1).bold(false);
    builder.text(empresa.razon_social).newLine();
    builder.text(`RNC: ${empresa.rnc}`).newLine();
    builder.text(empresa.direccion).newLine();
    if (empresa.telefono) {
        builder.text(`Tel: ${empresa.telefono}`).newLine();
    }
    
    builder.alignLeft().line('-', anchoLinea);
    
    builder.alignCenter().bold(true);
    builder.text(venta.tipo_comprobante_nombre).newLine();
    builder.text(`NCF: ${venta.ncf}`).newLine();
    builder.text(`No. ${venta.numero_interno}`).newLine();
    builder.bold(false);
    
    builder.alignLeft().line('-', anchoLinea);
    
    const fecha = new Date(venta.fecha_venta);
    const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()} ${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    builder.text(`Fecha: ${fechaStr}`).newLine();
    builder.text(`Vendedor: ${venta.usuario_nombre}`).newLine();
    
    if (venta.cliente_id) {
        builder.text(`Cliente: ${venta.cliente_nombre}`).newLine();
        builder.text(`${venta.cliente_tipo_documento}: ${venta.cliente_numero_documento}`).newLine();
    } else {
        builder.text('Cliente: Consumidor Final').newLine();
    }
    
    builder.line('-', anchoLinea);
    
    builder.text('Cant  Descripcion        Total').newLine();
    builder.line('-', anchoLinea);
    
    venta.productos.forEach(producto => {
        const cant = String(producto.cantidad).padStart(4, ' ');
        const total = formatearMoneda(producto.total).padStart(8, ' ');
        const nombreMax = anchoLinea - 14;
        let nombre = producto.nombre_producto;
        
        if (nombre.length > nombreMax) {
            nombre = nombre.substring(0, nombreMax);
        } else {
            nombre = nombre.padEnd(nombreMax, ' ');
        }
        
        builder.text(`${cant} ${nombre} ${total}`).newLine();
        
        const precio = formatearMoneda(producto.precio_unitario);
        builder.text(`      @${precio}`).newLine();
        
        if (producto.cantidad_despachada < producto.cantidad) {
            const pendiente = producto.cantidad - producto.cantidad_despachada;
            builder.text(`      Pendiente: ${pendiente}`).newLine();
        }
    });
    
    if (venta.extras && venta.extras.length > 0) {
        builder.line('-', anchoLinea);
        builder.bold(true).text('EXTRAS').newLine().bold(false);
        
        venta.extras.forEach(extra => {
            const cant = String(extra.cantidad).padStart(4, ' ');
            const total = formatearMoneda(extra.monto_total).padStart(8, ' ');
            const nombreMax = anchoLinea - 14;
            let nombre = extra.nombre;
            
            if (nombre.length > nombreMax) {
                nombre = nombre.substring(0, nombreMax);
            } else {
                nombre = nombre.padEnd(nombreMax, ' ');
            }
            
            builder.text(`${cant} ${nombre} ${total}`).newLine();
            builder.text(`      @${formatearMoneda(extra.precio_unitario)}`).newLine();
        });
    }
    
    builder.line('-', anchoLinea);
    
    const subtotal = formatearMoneda(venta.subtotal).padStart(10, ' ');
    builder.text(`Subtotal:${subtotal}`).newLine();
    
    if (parseFloat(venta.descuento) > 0) {
        const descuento = formatearMoneda(venta.descuento).padStart(10, ' ');
        builder.text(`Descuento:${descuento}`).newLine();
    }
    
    const itbis = formatearMoneda(venta.itbis).padStart(10, ' ');
    builder.text(`${empresa.impuesto_nombre} (${empresa.impuesto_porcentaje}%):${itbis}`).newLine();
    
    builder.doubleLine('=', anchoLinea);
    
    builder.bold(true).textSize(2, 2);
    const total = formatearMoneda(venta.total).padStart(10, ' ');
    builder.text(`TOTAL:${total}`).newLine();
    builder.textSize(1, 1).bold(false);
    
    if (venta.metodo_pago === 'efectivo' && venta.efectivo_recibido) {
        builder.line('-', anchoLinea);
        const recibido = formatearMoneda(venta.efectivo_recibido).padStart(10, ' ');
        builder.text(`Recibido:${recibido}`).newLine();
        const cambio = formatearMoneda(venta.cambio).padStart(10, ' ');
        builder.text(`Cambio:${cambio}`).newLine();
    }
    
    builder.line('-', anchoLinea);
    builder.text(`Metodo: ${venta.metodo_pago_texto}`).newLine();
    
    if (venta.notas) {
        builder.line('-', anchoLinea);
        builder.text(`NOTA: ${venta.notas}`).newLine();
    }
    
    builder.line('-', anchoLinea);
    
    builder.alignCenter();
    if (empresa.mensaje_factura) {
        builder.text(empresa.mensaje_factura).newLine();
    }
    builder.text('Comprobante fiscal autorizado DGII').newLine();
    builder.text(new Date().toLocaleDateString('es-DO')).newLine();
    builder.newLine();
    builder.bold(true).text('GRACIAS POR SU COMPRA').newLine().bold(false);
    
    builder.newLine(3);
    builder.cut();
    
    return builder.build();
}

function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
    }).format(monto);
}