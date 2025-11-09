# 🚀 Guía Paso a Paso: Convertir Sistema a Aplicación de Escritorio con Electron

Esta guía te llevará paso a paso para convertir tu sistema completo (Angular + Node.js/Express) en una aplicación de escritorio con Electron.

## 📋 Requisitos Previos

- Node.js instalado (versión 16 o superior)
- PostgreSQL instalado y configurado
- npm o yarn instalado
- Git (opcional, para control de versiones)

## 🎯 Paso 1: Instalar Dependencias Principales

Desde la **raíz del proyecto** (`SISTEMA_3_PIO_LINDO`):

```bash
npm install
```

Esto instalará:
- ✅ Electron y electron-builder
- ✅ Todas las dependencias del backend
- ✅ Todas las dependencias del frontend

**Tiempo estimado:** 5-10 minutos

---

## 🔨 Paso 2: Compilar el Backend

El backend usa Babel para transpilar el código. Necesitas compilarlo:

```bash
npm run build:backend
```

O manualmente:

```bash
cd Backend_Pio_Lindo
npm run build
cd ..
```

**Verifica que se creó:** `Backend_Pio_Lindo/build/` con los archivos compilados

**Tiempo estimado:** 30 segundos

---

## 🎨 Paso 3: Compilar el Frontend (Angular)

Compila Angular para producción:

```bash
npm run build:frontend
```

O manualmente:

```bash
cd Frontent_Pio_Lindo/proyect_frontend_2
npm run build
cd ../../..
```

**Verifica que se creó:** `Frontent_Pio_Lindo/proyect_frontend_2/dist/proyect_frontend/` con los archivos compilados

**Tiempo estimado:** 2-5 minutos

---

## ✅ Paso 4: Compilar Todo de Una Vez

Para compilar backend y frontend juntos:

```bash
npm run build:all
```

**Tiempo estimado:** 3-6 minutos

---

## 🧪 Paso 5: Probar en Modo Desarrollo

### Opción A: Probar con Electron en Modo Desarrollo

1. **Terminal 1 - Iniciar Angular en modo desarrollo:**
   ```bash
   cd Frontent_Pio_Lindo/proyect_frontend_2
   npm start
   ```
   Espera a que veas: `✔ Compiled successfully.`

2. **Terminal 2 - Iniciar Electron en modo desarrollo:**
   ```bash
   cd ../..
   npm run electron:dev
   ```

3. **Verifica:**
   - ✅ Se abre una ventana de Electron
   - ✅ El backend se inicia automáticamente (verás logs en la consola)
   - ✅ Angular se carga desde `http://localhost:4200`
   - ✅ La aplicación funciona correctamente

### Opción B: Probar en Modo Producción (Local)

1. **Compilar todo:**
   ```bash
   npm run build:all
   ```

2. **Ejecutar Electron:**
   ```bash
   npm run electron
   ```

3. **Verifica:**
   - ✅ Se abre una ventana de Electron
   - ✅ El backend se inicia automáticamente
   - ✅ Angular se carga desde el build local
   - ✅ La aplicación funciona correctamente

---

## 📦 Paso 6: Generar el Ejecutable (.exe)

### Generar Instalador Windows

```bash
npm run dist:win
```

**Esto hará:**
1. Compilar backend y frontend automáticamente
2. Generar un instalador `.exe` en `dist-electron/`
3. El instalador permitirá elegir la ubicación de instalación

**Tiempo estimado:** 5-15 minutos (depende de la velocidad de tu PC)

**Resultado:**
- 📁 `dist-electron/Pio Lindo Setup x.x.x.exe` (instalador)
- 📁 `dist-electron/win-unpacked/` (carpeta con la aplicación sin instalar)

### Generar Carpeta de Distribución (sin instalador)

```bash
npm run pack
```

**Resultado:**
- 📁 `dist-electron/win-unpacked/` (carpeta lista para distribuir)

---

## 🎯 Paso 7: Validar que Todo Funciona

### Validación del Ejecutable

1. **Ejecuta el instalador:**
   - Doble clic en `Pio Lindo Setup x.x.x.exe`
   - Sigue el asistente de instalación
   - Elige una ubicación (ej: `C:\Program Files\Pio Lindo`)

2. **Ejecuta la aplicación:**
   - Busca "Pio Lindo" en el menú de inicio
   - O ejecuta desde el escritorio

3. **Verifica:**
   - ✅ La aplicación se abre
   - ✅ El backend se inicia automáticamente (sin terminales visibles)
   - ✅ La interfaz de Angular se muestra correctamente
   - ✅ Puedes hacer login y usar todas las funcionalidades
   - ✅ Las peticiones a la API funcionan
   - ✅ Socket.IO funciona (si lo usas)

### Validación del Código (Desarrollo)

1. **Modifica algo en el frontend:**
   - Edita un archivo en `Frontent_Pio_Lindo/proyect_frontend_2/src/`
   - Ejecuta `npm run build:frontend`
   - Ejecuta `npm run electron` nuevamente
   - ✅ Los cambios se reflejan

2. **Modifica algo en el backend:**
   - Edita un archivo en `Backend_Pio_Lindo/src/`
   - Ejecuta `npm run build:backend`
   - Ejecuta `npm run electron` nuevamente
   - ✅ Los cambios se reflejan

---

## 🔧 Configuración Avanzada

### Cambiar el Puerto del Backend

Si necesitas cambiar el puerto (por ejemplo, si el 3000 está ocupado):

1. **Backend:** Edita `Backend_Pio_Lindo/src/app.js` línea 55:
   ```javascript
   const PORT = process.env.PORT || 3000; // Cambia 3000 por el puerto deseado
   ```

2. **Electron:** Edita `electron/main.js` línea 8:
   ```javascript
   const BACKEND_PORT = 3000; // Cambia 3000 por el puerto deseado
   ```

3. **Frontend:** Edita `Frontent_Pio_Lindo/proyect_frontend_2/src/app/services/configuration.ts`:
   ```typescript
   url: 'http://localhost:3000/api' // Cambia 3000 por el puerto deseado
   ```

### Cambiar el Icono de la Aplicación

1. **Crea un icono:**
   - Formato: `.png` o `.ico`
   - Tamaño recomendado: 256x256 o 512x512 píxeles

2. **Colócalo en:**
   - `build-resources/icon.png` (para PNG)
   - `build-resources/icon.ico` (para Windows)

3. **Actualiza `package.json`** (ya está configurado):
   ```json
   "win": {
     "icon": "build-resources/icon.ico"
   }
   ```

### Configurar PostgreSQL

Asegúrate de que PostgreSQL esté:
- ✅ Instalado
- ✅ Ejecutándose como servicio
- ✅ Configurado con los datos correctos en `Backend_Pio_Lindo/src/database.js`

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "Backend build no encontrado"

**Solución:**
```bash
npm run build:backend
```

### ❌ Error: "Frontend build no encontrado"

**Solución:**
```bash
npm run build:frontend
```

### ❌ Error: "Puerto 3000 ya en uso"

**Solución:**
1. Cierra otras aplicaciones que usen el puerto 3000
2. O cambia el puerto (ver sección "Cambiar el Puerto del Backend")

### ❌ Error: "PostgreSQL connection failed"

**Solución:**
1. Verifica que PostgreSQL esté ejecutándose
2. Verifica la configuración en `Backend_Pio_Lindo/src/database.js`
3. Verifica que la base de datos exista

### ❌ Error al generar .exe: "Cannot find module"

**Solución:**
1. Asegúrate de haber ejecutado `npm run build:all` primero
2. Verifica que todas las dependencias estén instaladas:
   ```bash
   cd Backend_Pio_Lindo && npm install
   cd ../Frontent_Pio_Lindo/proyect_frontend_2 && npm install
   ```

### ❌ La aplicación no se conecta al backend

**Solución:**
1. Verifica que el backend se esté iniciando (revisa los logs)
2. Verifica que el puerto sea el correcto
3. Verifica la configuración de CORS en `Backend_Pio_Lindo/src/app.js`

---

## 📝 Flujo de Trabajo Recomendado

### Para Desarrollo Activo:

```bash
# Terminal 1: Angular en modo desarrollo
cd Frontent_Pio_Lindo/proyect_frontend_2
npm start

# Terminal 2: Backend en modo desarrollo
cd Backend_Pio_Lindo
npm run dev

# Terminal 3: Electron (opcional, para probar)
cd ../..
npm run electron:dev
```

### Para Preparar Distribución:

```bash
# 1. Compilar todo
npm run build:all

# 2. Probar localmente
npm run electron

# 3. Si todo funciona, generar .exe
npm run dist:win
```

---

## ✅ Checklist Final

Antes de distribuir la aplicación, verifica:

- [ ] Backend compila correctamente (`npm run build:backend`)
- [ ] Frontend compila correctamente (`npm run build:frontend`)
- [ ] Electron funciona en modo desarrollo (`npm run electron:dev`)
- [ ] Electron funciona en modo producción (`npm run electron`)
- [ ] El .exe se genera correctamente (`npm run dist:win`)
- [ ] El instalador funciona correctamente
- [ ] La aplicación instalada funciona correctamente
- [ ] El backend se inicia automáticamente
- [ ] El frontend se carga correctamente
- [ ] Las peticiones a la API funcionan
- [ ] Socket.IO funciona (si lo usas)
- [ ] PostgreSQL está configurado correctamente

---

## 🎉 ¡Listo!

Tu aplicación de escritorio está lista. Ahora puedes:

1. ✅ Distribuir el `.exe` a los usuarios
2. ✅ Modificar el código cuando lo necesites
3. ✅ Regenerar el `.exe` después de cambios
4. ✅ Agregar funcionalidades de impresión más adelante

---

## 📚 Próximos Pasos (Opcional)

### Agregar Impresión Directa

Para agregar impresión directa en el futuro:

1. **Instalar librerías de impresión:**
   ```bash
   cd Backend_Pio_Lindo
   npm install printer
   ```

2. **Usar APIs de Electron para impresión:**
   - `window.print()` para impresión del navegador
   - Librerías de Node.js para impresión directa

3. **Configurar impresión silenciosa:**
   - Usar opciones de impresión sin diálogo
   - Configurar impresora por defecto

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en la consola de Electron
2. Revisa los logs del backend
3. Verifica que todas las dependencias estén instaladas
4. Verifica que PostgreSQL esté configurado correctamente

---

**¡Felicitaciones! Tu sistema ahora es una aplicación de escritorio completa.** 🎊

