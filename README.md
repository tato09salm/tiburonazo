# 🦈 TIBURONAZO E-commerce

Plataforma e-commerce completa para tienda de natación.
Stack: Next.js 16 · TypeScript · Tailwind CSS v4 · PostgreSQL · Prisma · NextAuth · Zustand · MercadoPago

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
- /checkout            → Pago con MercadoPago
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

## Sistema de Tipografía

El proyecto usa 3 fuentes organizadas en una jerarquía clara. Para cambiar una tipografía, solo editar `--font-display`, `--font-heading` o `--font-body` en `app/globals.css`.

| Token | Fuente | Uso | Clase Tailwind |
|-------|--------|-----|----------------|
| `--font-display` | **Bebas Neue** | Hero titles, section-title, banners | `font-display` |
| `--font-heading` | **Rajdhani** | h2-h6, cards, labels, navegación | `font-heading` |
| `--font-body` | **Nunito** | Texto largo, descripciones, formularios | default body |

### Utility `section-title`
Uso: `<h2 className="section-title">Título de sección</h2>`
Aplica Bebas Neue con tamaños responsivos (1.75rem → 2.25rem en md).

## Sistema de Colores

Los colores de marca están definidos en `app/globals.css` dentro de `@theme` (única fuente de verdad). **Nunca usar hex hardcoded** en componentes — siempre usar los tokens semánticos.

### Colores de marca
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#11ABC4` | Botones principales, links, acentos |
| `--color-secondary` | `#00D4DD` | Gradientes, acentos secundarios |
| `--color-light` | `#CCECFB` | Fondos suaves, badges, highlights |
| `--color-primary-dark` | `#0d8fa6` | Hover de primary |

### Colores UI
| Token | Valor | Uso |
|-------|-------|-----|
| `--color-text` | `#1a1a2e` | Texto principal |
| `--color-muted` | `#6b7280` | Texto secundario |
| `--color-bg` | `#f8fbff` | Fondo de página |
| `--color-card` | `#ffffff` | Fondo de cards |
| `--color-border` | `#e2e8f0` | Bordes |

### Uso en Tailwind
```tsx
// ✅ Correcto — usar tokens semánticos
<button className="bg-primary hover:bg-primary-dark text-white">Comprar</button>
<div className="text-primary font-heading">Título</div>

// ❌ Incorrecto — nunca hardcodear hex
<button className="bg-[#11ABC4] hover:bg-[#0d8fa6]">Comprar</button>
```

## Canvas Editor (Hero Slides)

El editor de hero slides usa su propio sistema de fuentes definido en `components/admin/hero/canvas/types.ts`. Las fuentes disponibles están agrupadas en `FONT_GROUPS`. Para agregar una nueva fuente al editor, agregarla al grupo correspondiente en ese archivo.

Ver README completo en el código fuente.
