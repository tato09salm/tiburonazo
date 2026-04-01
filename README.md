# 🦈 TIBURONAZO E-commerce

Plataforma e-commerce completa para tienda de natación.
Stack: Next.js 15 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · NextAuth · Zustand · Culqi

## Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno (ya configuradas para tu BD)
# .env tiene: postgresql://postgres:sa@localhost:5432/tiburonazo

# 3. Generar Prisma Client
npm run db:generate

# 4. Crear tablas en la BD
npm run db:push

# 5. Poblar con datos iniciales
npm run db:seed

# 6. Iniciar servidor
npm run dev
```

## Credenciales iniciales
- Admin:    admin@tiburonazo.pe / admin123
- Vendedor: vendedor@tiburonazo.pe / vendedor123
- Cliente:  cliente@tiburonazo.pe / cliente123

## Rutas principales
- /                    → Home
- /productos           → Catálogo con filtros e infinite scroll
- /productos/[slug]    → Detalle de producto
- /carrito             → Carrito
- /checkout            → Pago con Culqi
- /cuenta              → Mis pedidos
- /admin/dashboard     → Panel admin
- /admin/products      → CRUD de productos
- /admin/inventory     → Inventario
- /admin/sales         → Ventas POS

## Scripts
- npm run db:generate  → Generar Prisma Client
- npm run db:push      → Crear tablas
- npm run db:seed      → Datos iniciales
- npm run db:studio    → GUI para BD
- npm run build        → Build producción

Ver README completo en el código fuente.
