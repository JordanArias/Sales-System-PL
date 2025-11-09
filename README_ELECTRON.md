# Sistema Pio Lindo - Aplicación de Escritorio con Electron

Este documento explica cómo convertir el sistema completo (Frontend Angular + Backend Node.js/Express) en una aplicación de escritorio usando Electron.

## 📋 Estructura del Proyecto

```
SISTEMA_3_PIO_LINDO/
│
├── electron/              # Archivos de Electron
│   └── main.js            # Proceso principal de Electron
│
├── Backend_Pio_Lindo/     # API Node.js/Express
│   ├── src/               # Código fuente
│   └── build/             # Código compilado (generado)
│
├── Frontent_Pio_Lindo/
│   └── proyect_frontend_2/  # Aplicación Angular
│       └── dist/          # Build de producción (generado)
│
├── package.json           # Configuración principal de Electron
└── dist-electron/        # Ejecutables generados (generado)
```

## 🚀 Instalación y Configuración

### Paso 1: Instalar Dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará:
- Electron y electron-builder en la raíz
- Todas las dependencias del backend
- Todas las dependencias del frontend

### Paso 2: Compilar Backend y Frontend

```bash
# Compilar ambos
npm run build:all

# O por separado:
npm run build:backend   # Compila el backend con Babel
npm run build:frontend  # Compila Angular para producción
```

### Paso 3: Probar en Modo Desarrollo

```bash
# Terminal 1: Iniciar Angular en modo desarrollo
cd Frontent_Pio_Lindo/proyect_frontend_2
npm start

# Terminal 2: Iniciar Electron en modo desarrollo
cd ../..
npm run electron:dev
```

En modo desarrollo:
- Electron iniciará el backend automáticamente
- Electron cargará Angular desde `http://localhost:4200`
- Se abrirán las herramientas de desarrollo

### Paso 4: Probar en Modo Producción (Local)

```bash
# Primero compilar todo
npm run build:all

# Luego ejecutar Electron
npm run electron
```

## 📦 Generar Ejecutable (.exe)

### Generar Instalador Windows

```bash
npm run dist:win
```

Esto generará:
- Un instalador `.exe` en `dist-electron/`
- Un instalador NSIS que permite elegir la ubicación de instalación

### Generar Carpeta de Distribución (sin instalador)

```bash
npm run pack
```

Esto genera una carpeta con todos los archivos necesarios para ejecutar la aplicación.

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run electron` | Ejecuta Electron en modo producción |
| `npm run electron:dev` | Ejecuta Electron en modo desarrollo |
| `npm run build:backend` | Compila el backend con Babel |
| `npm run build:frontend` | Compila Angular para producción |
| `npm run build:all` | Compila backend y frontend |
| `npm run dist` | Compila todo y genera ejecutable |
| `npm run dist:win` | Compila todo y genera instalador Windows |
| `npm run pack` | Compila todo y genera carpeta de distribución |

## ⚙️ Configuración

### Puerto del Backend

El backend se ejecuta en el puerto **3000** por defecto. Esto se configura en:
- `Backend_Pio_Lindo/src/app.js` (línea 55)
- `electron/main.js` (línea 8)

### URL de la API

El frontend está configurado para usar `http://localhost:3000/api` en:
- `Frontent_Pio_Lindo/proyect_frontend_2/src/app/services/configuration.ts`

### Base de Datos PostgreSQL

El sistema requiere PostgreSQL instalado y configurado. La configuración está en:
- `Backend_Pio_Lindo/src/database.js`

**Nota:** PostgreSQL debe estar instalado y ejecutándose en la máquina donde se use la aplicación.

## 🛠️ Desarrollo

### Modificar el Código

1. **Backend**: Edita archivos en `Backend_Pio_Lindo/src/`
   - Después de cambios, ejecuta: `npm run build:backend`

2. **Frontend**: Edita archivos en `Frontent_Pio_Lindo/proyect_frontend_2/src/`
   - En desarrollo: `npm start` (se recarga automáticamente)
   - Para producción: `npm run build:frontend`

3. **Electron**: Edita `electron/main.js`
   - Reinicia Electron para ver cambios

### Flujo de Trabajo Recomendado

1. **Desarrollo activo:**
   ```bash
   # Terminal 1
   cd Frontent_Pio_Lindo/proyect_frontend_2
   npm start
   
   # Terminal 2
   cd Backend_Pio_Lindo
   npm run dev
   
   # Terminal 3 (opcional, para probar en Electron)
   npm run electron:dev
   ```

2. **Preparar para distribución:**
   ```bash
   npm run build:all
   npm run dist:win
   ```

## 📝 Notas Importantes

### ⚠️ Antes de Generar el .exe

1. **Compilar Backend**: Asegúrate de que `Backend_Pio_Lindo/build/` existe
2. **Compilar Frontend**: Asegúrate de que `Frontent_Pio_Lindo/proyect_frontend_2/dist/` existe
3. **Dependencias**: Todas las dependencias deben estar instaladas

### 🔒 Seguridad

- El backend se ejecuta localmente en `localhost:3000`
- No se expone a la red externa por defecto
- PostgreSQL debe estar configurado correctamente

### 🖨️ Impresión (Futuro)

Para agregar impresión directa:
1. Instalar librerías de impresión en el backend o frontend
2. Usar APIs de Electron para acceso a impresoras
3. Configurar impresión silenciosa según necesidad

## 🐛 Solución de Problemas

### Backend no inicia

- Verifica que PostgreSQL esté ejecutándose
- Verifica la configuración en `Backend_Pio_Lindo/src/database.js`
- Revisa los logs en la consola de Electron

### Frontend no carga

- En desarrollo: Verifica que `npm start` esté ejecutándose
- En producción: Verifica que `npm run build:frontend` se haya ejecutado correctamente

### Error al generar .exe

- Asegúrate de haber ejecutado `npm run build:all` primero
- Verifica que todas las rutas en `package.json` (sección `build.files`) sean correctas
- Revisa los logs de electron-builder

### Puerto 3000 ya en uso

- Cambia el puerto en `Backend_Pio_Lindo/src/app.js` y `electron/main.js`
- Actualiza la configuración del frontend en `configuration.ts`

## 📚 Recursos Adicionales

- [Documentación de Electron](https://www.electronjs.org/docs)
- [Documentación de electron-builder](https://www.electron.build/)
- [Documentación de Angular](https://angular.io/docs)

## 📄 Licencia

MIT

