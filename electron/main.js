const { shell, ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const express = require('express');

//PARA IMPRIMIR
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
    // IMPORTS (arriba del archivo)
    // 🔸 IMPORTS
    const PDFDocument = require('pdfkit');
    const printer = require('pdf-to-printer');
    const html_to_pdf = require('html-pdf-node');
    const puppeteer = require('puppeteer');

console.log(escpos.USB.findPrinter());



let mainWindow;
let backendProcess;
let frontendServer;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 4201; // Puerto diferente al de desarrollo
const isDev = process.argv.includes('--dev');


// Función para iniciar el backend
function startBackend() {
  const backendPath = path.join(__dirname, '..', 'Backend_Pio_Lindo');

  // En desarrollo, usar src/app.js directamente (ya inicia el servidor)
  // En producción, usar build/app.js
  let backendFile;
  if (isDev) {
    backendFile = path.join(backendPath, 'src', 'app.js');
  } else {
    backendFile = path.join(backendPath, 'build', 'app.js');
    // Verificar si existe el build del backend
    if (!fs.existsSync(backendFile)) {
      console.error('Backend build no encontrado. Ejecuta: npm run build:backend');
      app.quit();
      return;
    }
  }

  // En la app empaquetada ejecutamos el backend en el mismo proceso de Electron.
  // Ajustamos variables de entorno y requerimos el archivo.
  process.env.PORT = BACKEND_PORT.toString();
  process.env.NODE_ENV = isDev ? 'development' : 'production';

  try {
    require(backendFile);
    console.log('Backend iniciado dentro del proceso principal.');
  } catch (error) {
    console.error('Error al iniciar backend:', error);
    app.quit();
  }
}

// Función para esperar a que el backend esté listo
function waitForBackend(callback, maxAttempts = 30) {
  const http = require('http');
  let attempts = 0;

  const checkBackend = () => {
    attempts++;
    const req = http.get(`http://localhost:${BACKEND_PORT}`, (res) => {
      console.log('Backend está listo!');
      callback();
    });

    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(checkBackend, 1000);
      } else {
        console.error('Backend no respondió a tiempo');
        app.quit();
      }
    });
  };

  checkBackend();
}

// Función para iniciar el servidor del frontend
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    const frontendPath = path.join(__dirname, '..', 'Frontent_Pio_Lindo', 'proyect_frontend_2', 'dist', 'proyect_frontend');
    
    // Verificar si existe el build del frontend
    if (!fs.existsSync(frontendPath)) {
      reject(new Error('Frontend build no encontrado. Ejecuta: npm run build:frontend'));
      return;
    }

    const frontendApp = express();
    
    // Servir archivos estáticos
    frontendApp.use(express.static(frontendPath));
    
    // Para SPA, todas las rutas que no sean archivos estáticos deben servir index.html
    // Usar un middleware que sirva index.html para rutas que no sean archivos
    frontendApp.use((req, res, next) => {
      // Si la ruta tiene extensión (es un archivo), ya fue manejada por static
      // Si no tiene extensión o es la raíz, servir index.html
      if (req.path === '/' || !path.extname(req.path)) {
        res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
          if (err) {
            next(err);
          }
        });
      } else {
        next();
      }
    });

    // frontendServer = frontendApp.listen(FRONTEND_PORT, () => {
    //   console.log(`Frontend servidor iniciado en http://localhost:${FRONTEND_PORT}`);
    //   resolve();
    // });
  
    frontendServer = frontendApp.listen(FRONTEND_PORT, '0.0.0.0', () => {
      console.log(`Frontend servidor iniciado en ip:${FRONTEND_PORT}`);
      resolve();
    });
    

    frontendServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Puerto ${FRONTEND_PORT} ya en uso, intentando otro...`);
        // Intentar con otro puerto
        frontendServer.close(() => {
          frontendServer = frontendApp.listen(0, () => {
            const actualPort = frontendServer.address().port;
            console.log(`Frontend servidor iniciado en http://localhost:${actualPort}`);
            resolve();
          });
        });
      } else {
        reject(error);
      }
    });
  });
}

// Función para crear la ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'build-resources', 'icon.png'),
    show: false // No mostrar hasta que esté listo
  });


  const FRONTEND_IP = '192.168.1.12'; // IP estática de tu PC
  // Cargar el frontend
  if (isDev) {
    // En modo desarrollo, usar el servidor de desarrollo de Angular
    // Esperar un poco para que Angular esté listo
    setTimeout(() => {
      // mainWindow.loadURL(`http://${require('os').hostname()}:4200`);
      // Para Electron usar localhost en vez de IP
      const loadUrl = isDev
      ? (isElectron ? 'http://localhost:4200' : `http://${FRONTEND_IP}:4200`)
      : `http://localhost:${FRONTEND_PORT}`;
       mainWindow.loadURL(loadUrl);
    }, 2000);
  } else {
    // En producción, cargar desde el servidor local
    const actualPort = frontendServer ? frontendServer.address().port : FRONTEND_PORT;
    mainWindow.loadURL(`http://localhost:${actualPort}`);
  }

  // Abrir herramientas de desarrollo para ver errores
  // mainWindow.webContents.openDevTools();

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error al cargar:', errorCode, errorDescription);
  });

  // Log cuando la página esté lista
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Página cargada correctamente');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


// Cuando Electron esté listo
app.whenReady().then(async () => {

  // Iniciar el backend
  startBackend();
  
  // Esperar a que el backend esté listo
  waitForBackend(async () => {
    // Iniciar el servidor del frontend (solo en producción)
    if (!isDev) {
      try {
        await startFrontendServer();
      } catch (error) {
        console.error('Error al iniciar servidor frontend:', error);
        app.quit();
        return;
      }
    }
    
    // Crear la ventana
    createWindow();

    //PARA IMPRIMIR ******************************************************
    //🔸 VERSION HTML MAYOR renderizado
    ipcMain.on('imprimir-ticket', async (event, html) => {
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Renderiza el HTML en alta resolución (≈240 DPI)
        await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 2.5 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const filePath = path.join(__dirname, 'ticket_comanda.pdf');

        await page.pdf({
          path: filePath,
          width: '80mm',
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
          scale: 1
        });

        await browser.close();

        // 🖨️ Enviar directamente a la impresora térmica
        await printer.print(filePath, {
          printer: 'GP-C200 Series',
          silent: true,
          orientation: 'portrait',
          paperSize: '80x297mm',
          scale: 'noscale'
        });

        console.log('🟢 Ticket impreso correctamente');

      } catch (err) {
        console.error('❌ Error al imprimir ticket:', err);
      }
    });
    



    //🔸 VERSION HTML A DOC
    // ipcMain.on('imprimir-ticket', async (event, payload) => {
    //   try {
    //     const filePath = path.join(__dirname, 'ticket_comanda.pdf');
    
    //     // Si viene un HTML en vez de un objeto con productos, convertirlo a PDF directamente
    //     if (typeof payload === 'string' && payload.trim().startsWith('<')) {
    //       console.log('🧩 Generando PDF desde HTML...');
    //       const file = { content: payload };
    
    //       const options = {
    //         width: '80mm', // 👈 tamaño real de papel térmico
    //         printBackground: true,
    //         margin: { top: '0mm', right: '2mm', bottom: '2mm', left: '2mm' },
    //         preferCSSPageSize: true,
    //         scale: 1.0, // 👈 duplica la densidad de render → texto más nítido
    //       };

    //       await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 2.5 });

    //       const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    //       fs.writeFileSync(filePath, pdfBuffer);
    
    //       console.log('📄 Ticket generado desde HTML en:', filePath);
    
    //       // 👀 Mostrar vista previa o imprimir directo
    //       //await shell.openPath(filePath);
    
    //       // Si querés imprimir directo, descomentá esto:
    //       await printer.print(filePath, { printer: 'GP-C200 Series' });
    
    //       return;
    //     }
    
    //     // 🚀 Si no es HTML, seguir con tu flujo normal (pdfkit)
    //     const datos = payload;
    //     // ... 🔹 tu código PDFKit tal como ya lo tenés aquí
    //   } catch (err) {
    //     console.error('❌ Error generando PDF:', err);
    //   }
    // });
    


  // 🔸 HANDLER DE IMPRESIÓN VERSION TRUE
  // ipcMain.on('imprimir-ticket', async (event, datos) => {
  //   try {
  //     const filePath = path.join(__dirname, 'ticket_comanda.pdf');

  //     // --- Parámetros de layout ---
  //     const width = 226.77;        // 80mm exacto en puntos
  //     const lineHeight = 12;
  //     const topPadding = 4;
  //     const bottomPadding = 8;

  //     const headerLines = 3;       // COMANDA + fecha
  //     const footerLines = 2;       // Gracias
  //     const descripcionLines = datos.descripcion ? 2 : 0;
  //     const productosLines = (datos.productos || []).length;

  //     const totalLines = headerLines + productosLines + descripcionLines + footerLines;
  //     const computedHeight = Math.ceil(topPadding + bottomPadding + totalLines * lineHeight);
  //     const height = Math.max(200, Math.min(computedHeight, 2500)); // límite seguro

  //     // --- Crear PDF ---
  //     const doc = new PDFDocument({
  //       margin: 0,
  //       size: [width, 600], // ancho 80mm, altura provisional
  //       layout: 'portrait',
  //       autoFirstPage: false
  //     });
  //     doc.addPage({ size: [height, width], layout: 'portrait', margin: 0 });


  //     const writeStream = fs.createWriteStream(filePath);
  //     let printed = false;
  //     doc.pipe(writeStream);
  //     // Agregar margen superior manual (~5 puntos = ~1.7 mm)
  //     doc.translate(0, 5);

  //     // --- Contenido ---
  //     doc.font('Helvetica-Bold');
  //     doc.fontSize(12).text('COMANDA', { align: 'center' });
  //     doc.moveDown(0.2);
  //     doc.fontSize(10).text(`Fecha: ${datos.fecha}   Hora: ${datos.hora}`);
  //     doc.moveDown(0.1);
  //     doc.font('Helvetica'); // volver a normal

  //     // Línea superior
  //     //-------------------------------------------------------------
  //     doc.moveTo(0, doc.y).lineTo(width, doc.y).stroke();

  //     const yLine = doc.y + 3;

  //     // Posiciones fijas por columna
  //     const margenIzq = 2;
  //     const margenDer = width - 80; // 👈 ajustá este número si el texto se pasa

  //     // Mesa (columna izquierda)
  //     doc.fontSize(10).text(`Mesa: ${datos.mesa ?? ''}`, margenIzq, yLine, {
  //       width: 80,
  //       align: 'left'
  //     });

  //     // Código (columna derecha)
  //     doc.text(`Código: ${datos.cod_venta ?? ''}`, margenDer, yLine, {
  //       width: 80,
  //       align: 'right'
  //     });

      
      
            
  //     // Línea inferior
  //     //-------------------------------------------------------------
  //     doc.moveTo(0, yLine + 10).lineTo(width, yLine + 10).stroke();
  //     // 🔧 Resetear posición X para que el siguiente texto comience a la izquierda
  //     doc.x = 0;
  //     // 🔧 Avanzar un poco la posición Y para evitar sobreposición
  //     doc.y = yLine + 15;


  //     // Ajustar cursor debajo de la línea
  //     doc.moveDown(0.5);

  //     // --- Productos y complementos ---
  //     doc.fontSize(10);
  //     (datos.productos || []).forEach(p => {
  //       const nombre = (p.nombre || '').substring(0, 28);
  //       doc.font('Helvetica-Bold');
  //       doc.text(`${p.cantidad_item} x ${nombre} ${p.item_llevar ? '(LLEVAR)' : ''}`);
  //       doc.font('Helvetica'); // volver a normal

  //       // --- Complementos u opciones ---
  //       if (p.complementos && p.complementos.length > 0) {
  //         p.complementos.forEach(c => {
  //           const opcionesTexto = (c.opciones || [])
  //             .filter(o => o.cantidad_op > 0)
  //             .map(o => `${o.cantidad_op} ${o.nombre}`)
  //             .join(' | ');

  //           if (opcionesTexto) {
  //             doc.fontSize(9).text(` ${opcionesTexto}`); // indentado un poco
  //           }
  //         });
  //       }

  //       // Pequeño espacio entre productos
  //       doc.moveDown(0.1);
  //     });


  //     doc.moveDown(0.2);
  //     doc.fontSize(10).text('Gracias!', { align: 'center' });
      
  //     // doc.rotate(-90, { origin: [0, 0] });

  //     // Cerrar PDF
  //     doc.end();

  //     // --- Imprimir cuando termine de escribir el archivo ---
  //     writeStream.on('finish', async () => {
  //       if (printed) return;
  //       printed = true;

  //       try {
  //         // await printer.print(filePath, {
  //         //   printer: 'GP-C200 Series',
  //         //   orientation: 'portrait',
  //         //   paperSize: '80x297mm',
  //         //   scale: 'noscale',
  //         //   silent: true // evita diálogo de impresión
  //         // });

  //         // 🧪 Vista previa del PDF en nueva ventana de Electron
  //         const { shell } = require('electron');
  //         shell.openPath(filePath); // abre el PDF para revisión

  //         console.log('🟢 Ticket impreso correctamente');
  //       } catch (err) {
  //         console.error('❌ Error al enviar a la impresora:', err);
  //       } finally {
  //         // Borrar PDF temporal
  //         console.log('📄 Ticket generado en:', filePath);
  //         // fs.unlink(filePath, (e) => {
  //         //   if (e) console.warn('No se pudo eliminar PDF:', e);
  //         // });
  //       }
  //     });

  //   } catch (err) {
  //     console.error('❌ Error general al imprimir:', err);
  //   }
  // });


      //FIN PARA IMPRIMIR
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        waitForBackend(async () => {
          if (!isDev) {
            try {
              await startFrontendServer();
            } catch (error) {
              console.error('Error al iniciar servidor frontend:', error);
              app.quit();
              return;
            }
          }
          createWindow();
        });
      }
    });
  });

// Cerrar el backend y frontend server cuando se cierre la aplicación
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendServer) {
    frontendServer.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    if (frontendServer) {
      frontendServer.close();
    }
    app.quit();
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

