const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const express = require('express');

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

  // Iniciar el servidor backend
  backendProcess = spawn('node', [backendFile], {
    cwd: backendPath,
    env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: isDev ? 'development' : 'production'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('error', (error) => {
    console.error('Error al iniciar backend:', error);
    app.quit();
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend terminó con código ${code}`);
    if (code !== 0 && code !== null) {
      app.quit();
    }
  });
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

    frontendServer = frontendApp.listen(FRONTEND_PORT, () => {
      console.log(`Frontend servidor iniciado en http://localhost:${FRONTEND_PORT}`);
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
      webSecurity: true
    },
    icon: path.join(__dirname, '..', 'build-resources', 'icon.png'),
    show: false // No mostrar hasta que esté listo
  });

  // Cargar el frontend
  if (isDev) {
    // En modo desarrollo, usar el servidor de desarrollo de Angular
    // Esperar un poco para que Angular esté listo
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:4200');
    }, 2000);
  } else {
    // En producción, cargar desde el servidor local
    const actualPort = frontendServer ? frontendServer.address().port : FRONTEND_PORT;
    mainWindow.loadURL(`http://localhost:${actualPort}`);
  }

  // Abrir herramientas de desarrollo para ver errores
  mainWindow.webContents.openDevTools();

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

