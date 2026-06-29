# Sistema para Control de Tutorías

Plataforma web para la gestión integral de tutorías académicas en instituciones educativas. Permite administrar usuarios con distintos roles, registrar y dar seguimiento a estudiantes, documentar observaciones de tutoría y generar reportes de cobertura, actividad y bitácora.

## ¿En qué consiste el sistema?

El **Sistema de Control de Tutorías** es una aplicación compuesta por dos partes que trabajan en conjunto:

- **Backend (API REST):** Servidor que gestiona la lógica de negocio, la autenticación, la base de datos y la exportación de reportes.
- **Frontend (interfaz web):** Aplicación accesible desde el navegador donde los usuarios inician sesión y realizan las operaciones del día a día.

### Módulos principales

| Módulo | Descripción |
|--------|-------------|
| **Inicio (Dashboard)** | Panel de acceso rápido al sistema. |
| **Usuarios** | Alta, edición y administración de cuentas con roles y permisos (administrador, tutor, etc.). |
| **Estudiantes** | Registro individual o masivo de alumnos, asignación de tutores, consulta por matrícula y gestión de datos académicos. |
| **Tutorías** | Búsqueda de estudiantes y registro de observaciones de seguimiento con fecha. |
| **Reportes** | Consulta y exportación de reportes de cobertura, actividad de seguimiento y bitácora de observaciones. |

### Tecnologías utilizadas

- **Backend:** Node.js, Express, Sequelize, PostgreSQL, JWT
- **Frontend:** Vue 3, TypeScript, Vite, Pinia, Tailwind CSS

## Descarga del proyecto

El código fuente está disponible en GitHub. Para obtener una copia local:

### Opción 1: Clonar con Git (recomendado)

```sh
git clone https://github.com/Alexandra0317/Sistema-de-Control-de-Tutorias.git
cd Sistema-de-Control-de-Tutorias
```

### Opción 2: Descargar como ZIP

1. Abre el repositorio en GitHub: [Sistema-de-Control-de-Tutorias](https://github.com/Alexandra0317/Sistema-de-Control-de-Tutorias)
2. Haz clic en el botón **Code** (Código).
3. Selecciona **Download ZIP**.
4. Descomprime el archivo en la carpeta de tu preferencia.

## Requisitos de instalación

Antes de instalar, asegúrate de contar con lo siguiente:

| Requisito | Versión recomendada |
|-----------|---------------------|
| **Node.js** | 22.18+ (requerido para el frontend) |
| **npm** | Incluido con Node.js |
| **PostgreSQL** | 14 o superior |
| **Git** | Solo si vas a clonar el repositorio |

## Instalación

### 1. Base de datos

Crea una base de datos en PostgreSQL (por ejemplo, `tutorias`) y anota usuario y contraseña; los usarás en el archivo de configuración del backend.

### 2. Backend

```sh
cd backend
npm install
cp .env.example .env
```

Edita el archivo `.env` con los datos de tu base de datos:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tutorias
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=cambiar-este-secreto-en-produccion
JWT_EXPIRES_IN=24h
```

Inicia el servidor y carga los datos iniciales (roles y usuario administrador):

```sh
npm run dev
```

En otra terminal, ejecuta el seed una sola vez:

```sh
npm run seed
```

La API quedará disponible en `http://localhost:3000`.

> **Credenciales por defecto del administrador:** correo `admin@tutorias.local` — contraseña `admin123`. Cámbiala después del primer acceso.

### 3. Frontend

En una terminal nueva:

```sh
cd frontend
npm install
npm run dev
```

La interfaz quedará disponible en `http://localhost:5173`. Las peticiones a la API se redirigen automáticamente al backend mediante el proxy de Vite.

## Estructura del proyecto

```
Sistema Control de Tutorias/
├── backend/     # API REST (Node.js + Express + PostgreSQL)
└── frontend/    # Interfaz web (Vue 3 + TypeScript + Vite)
```

## Manual de usuario

La guía detallada de uso del sistema (capturas, pasos y explicación de cada módulo) está disponible en Google Drive:

**[Manual de Usuario — Sistema de Control de Tutorías](https://drive.google.com/drive/folders/1g-KMPOjantwx2EEdeJy1-CW_nyCcvZM4?usp=sharing)**

## Scripts útiles

| Proyecto   | Comando             | Descripción              |
|------------|---------------------|--------------------------|
| backend    | `npm run dev`       | Servidor con recarga     |
| backend    | `npm start`         | Servidor en producción   |
| backend    | `npm run seed`      | Datos iniciales (roles y admin) |
| frontend   | `npm run dev`       | Desarrollo con Vite      |
| frontend   | `npm run build`     | Build de producción      |
| frontend   | `npm run test:unit` | Pruebas unitarias        |
