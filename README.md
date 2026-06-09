# BibleApp RV1960

Aplicación de estudio bíblico completa con la Reina Valera 1960.

## Stack
- React 18 + Vite
- Neon PostgreSQL (serverless)
- Vercel (deploy)

## Módulos
- [x] Lector completo (66 libros, 1189 capítulos)
- [x] Buscador con frecuencias por libro
- [ ] Patrones y análisis de texto
- [ ] Angelología / Cristología
- [ ] Línea de tiempo de reyes
- [ ] Numerología bíblica
- [ ] Creador de bosquejos

## Setup local

```bash
npm install
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon
npm run dev
```
