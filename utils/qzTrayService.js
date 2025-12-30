let qz = null;
let isConnected = false;
let isConfigured = false;

async function cargarQZ() {
    if (qz) return qz;
    
    if (typeof window === 'undefined') return null;
    
    await new Promise((resolve) => {
        if (window.RSVP && window.CryptoJS) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.RSVP && window.CryptoJS) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        }
    });
    
    const qzModule = await import('qz-tray');
    qz = qzModule.default;
    
    return qz;
}

async function cargarCertificado() {
    try {
        const response = await fetch('/certificates/digital-certificate.txt');
        const cert = await response.text();
        return cert;
    } catch (error) {
        console.log('No se pudo cargar certificado, continuando sin firma');
        return null;
    }
}

async function firmarMensaje(message) {
    try {
        const response = await fetch('/api/qz-sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        return data.signature;
    } catch (error) {
        console.log('No se pudo firmar mensaje, continuando sin firma');
        return null;
    }
}

function configurarQZ() {
    if (isConfigured || !qz) return;
    
    if (typeof window !== 'undefined' && window.RSVP && window.CryptoJS) {
        qz.api.setSha256Type(data => {
            return window.CryptoJS.SHA256(data).toString();
        });
        
        qz.api.setPromiseType(resolver => {
            return new window.RSVP.Promise(resolver);
        });
        
        qz.security.setCertificatePromise(function(resolve) {
            cargarCertificado().then(cert => {
                if (cert) {
                    resolve(cert);
                } else {
                    resolve();
                }
            });
        });
        
        qz.security.setSignaturePromise(function(toSign) {
            return function(resolve) {
                firmarMensaje(toSign).then(signature => {
                    if (signature) {
                        resolve(signature);
                    } else {
                        resolve();
                    }
                });
            };
        });
        
        isConfigured = true;
    }
}

export async function conectarQZTray() {
    if (isConnected) {
        return true;
    }

    try {
        await cargarQZ();
        configurarQZ();
        
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({
                retries: 5,
                delay: 1
            });
        }
        isConnected = true;
        return true;
    } catch (error) {
        console.error('Error conectando QZ Tray:', error);
        throw new Error('No se pudo conectar con QZ Tray. Asegúrate de que esté instalado y ejecutándose.');
    }
}

export async function desconectarQZTray() {
    try {
        if (qz && qz.websocket.isActive()) {
            await qz.websocket.disconnect();
        }
        isConnected = false;
    } catch (error) {
        console.error('Error desconectando QZ Tray:', error);
    }
}

export async function obtenerImpresoras() {
    try {
        await conectarQZTray();
        const printers = await qz.printers.find();
        return printers;
    } catch (error) {
        console.error('Error obteniendo impresoras:', error);
        throw error;
    }
}

export async function obtenerImpresoraPredeterminada() {
    try {
        await conectarQZTray();
        const printer = await qz.printers.getDefault();
        return printer;
    } catch (error) {
        console.error('Error obteniendo impresora predeterminada:', error);
        throw error;
    }
}

export async function imprimirTextoRaw(printerName, data) {
    try {
        await conectarQZTray();
        
        const config = qz.configs.create(printerName, {
            encoding: 'UTF-8'
        });
        
        await qz.print(config, [data]);
        
        return { success: true };
    } catch (error) {
        console.error('Error imprimiendo:', error);
        throw new Error('Error al imprimir: ' + error.message);
    }
}

export async function buscarImpresoraTermica() {
    try {
        const impresoras = await obtenerImpresoras();
        
        const palabrasClave = ['pos', 'thermal', 'receipt', 'ticket', 'xprinter', 'epson', 'star', 'bixolon', '80mm', '58mm'];
        
        const impresoraTermica = impresoras.find(impresora => {
            const nombreLower = impresora.toLowerCase();
            return palabrasClave.some(palabra => nombreLower.includes(palabra));
        });
        
        return impresoraTermica || impresoras[0] || null;
    } catch (error) {
        console.error('Error buscando impresora térmica:', error);
        return null;
    }
}