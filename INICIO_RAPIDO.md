# 🚀 Inicio Rápido - Sistema Pio Lindo Desktop

## ⚡ Instalación Rápida (5 minutos)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Compilar Todo
```bash
npm run build:all
```

### 3. Probar en Electron
```bash
npm run electron
```

## 🎯 Generar .exe

```bash
npm run dist:win
```

El instalador estará en: `dist-electron/Pio Lindo Setup x.x.x.exe`

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala todas las dependencias |
| `npm run build:all` | Compila backend y frontend |
| `npm run electron` | Ejecuta Electron en producción |
| `npm run electron:dev` | Ejecuta Electron en desarrollo |
| `npm run dist:win` | Genera instalador Windows (.exe) |
| `npm run pack` | Genera carpeta de distribución |

## 🔧 Desarrollo

### Modo Desarrollo (3 terminales)

**Terminal 1 - Angular:**
```bash
cd Frontent_Pio_Lindo/proyect_frontend_2
npm start
```

**Terminal 2 - Backend:**
```bash
cd Backend_Pio_Lindo
npm run dev
```

**Terminal 3 - Electron (opcional):**
```bash
npm run electron:dev
```

## ⚠️ Requisitos

- ✅ Node.js instalado
- ✅ PostgreSQL instalado y ejecutándose
- ✅ Base de datos configurada

## 📚 Documentación Completa

- **Guía Paso a Paso:** Ver `GUIA_PASO_A_PASO.md`
- **Documentación General:** Ver `README_ELECTRON.md`

## 🐛 Problemas Comunes

### Backend no inicia
```bash
npm run build:backend
```

### Frontend no carga
```bash
npm run build:frontend
```

### Puerto 3000 ocupado
Cambia el puerto en:
- `Backend_Pio_Lindo/src/app.js` (línea 55)
- `electron/main.js` (línea 8)
- `Frontent_Pio_Lindo/proyect_frontend_2/src/app/services/configuration.ts`

---

**¡Listo para empezar!** 🎉

