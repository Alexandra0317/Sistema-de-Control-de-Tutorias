# Sistema para Control de Tutorías

Monorepo con API REST y interfaz web para la gestión de tutorías.

## Estructura

- **backend/** — API REST con Node.js + Express
- **frontend/** — Interfaz con Vue 3 + TypeScript + Vite

## Requisitos

- Node.js 22.18+ (recomendado para el frontend)
- npm

## Instalación

### Backend

```sh
cd backend
npm install
cp .env.example .env
npm run dev
```

La API queda disponible en `http://localhost:3000`.

### Frontend

```sh
cd frontend
npm install
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`.

## Scripts útiles

| Proyecto   | Comando           | Descripción              |
|------------|-------------------|--------------------------|
| backend    | `npm run dev`     | Servidor con recarga     |
| backend    | `npm start`       | Servidor en producción   |
| frontend   | `npm run dev`     | Desarrollo con Vite      |
| frontend   | `npm run build`   | Build de producción      |
| frontend   | `npm run test:unit` | Pruebas unitarias      |
