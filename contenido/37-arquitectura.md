---
id: arquitectura
nivel: 3
titulo: Arquitectura, buenas prácticas y producción
icono: 🏛️
tiempo: 45 min
resumen: Estructura de proyecto, decisiones de estado, seguridad, variables de entorno, i18n, calidad de código y despliegue.
---

:::goal
Organizar una aplicación React para que **escale**: estructura por *features*, reglas para decidir dónde vive cada cosa, capa de datos, seguridad, calidad automática y despliegue.
:::

## Principios de diseño

1. **Colocación** (colocation): mantén juntos los archivos que cambian juntos (componente, estilos, pruebas, hooks).
2. **Una responsabilidad por componente**; extrae cuando un componente hace dos cosas.
3. **Composición sobre configuración**; componentes pequeños, nombrados por *qué son* (no por cómo se ven).
4. **Estado lo más local posible**, y elevarlo solo cuando haga falta.
5. **Dato derivado, no duplicado**: una única fuente de verdad.
6. **Haz explícitas las dependencias** (props/hooks) en lugar de globales ocultas.
7. **Simplicidad primero**: evita abstracciones antes de tener 2-3 casos reales (regla de tres).

## Estructura de carpetas

Para proyectos pequeños, agrupar "por tipo" es suficiente; al crecer, **por funcionalidad (feature)**:

```text
src/
├── app/                      ← configuración global
│   ├── App.jsx
│   ├── router.jsx
│   └── providers.jsx         ← QueryClient, Tema, Auth…
├── features/                 ← una carpeta por funcionalidad del negocio
│   ├── productos/
│   │   ├── components/       ← ListaProductos, TarjetaProducto
│   │   ├── hooks/            ← useProductos, useProducto
│   │   ├── api.js            ← funciones que llaman al backend
│   │   ├── ProductosPage.jsx
│   │   └── index.js          ← API pública de la feature
│   ├── carrito/
│   └── auth/
├── components/               ← UI genérica reutilizable (Boton, Modal, Input)
├── hooks/                    ← hooks genéricos (useDebounce, useMediaQuery)
├── lib/                      ← utilidades, cliente HTTP, formateadores, constantes
├── assets/
└── main.jsx
```

**Reglas útiles**

- Las *features* **no se importan entre sí** de forma desordenada; si necesitan compartir, sube la pieza a `components/`/`lib/` o expónla desde el `index.js` de la feature.
- Evita los **"barrel files"** (`index.js` que re-exportan todo) en módulos grandes: pueden empeorar el *tree shaking* y los tiempos de arranque.
- Usa **alias de importación** (`@/features/...`) en vez de `../../../`.
- Nombres: componentes `PascalCase.jsx`, hooks `useCosa.js`, utilidades `camelCase.js`.

## ¿Dónde vive cada tipo de estado? (árbol de decisión)

```text
¿Lo necesita un solo componente?                    → useState / useReducer local
¿Lo necesitan hermanos/hijos cercanos?              → levantar el estado al ancestro común
¿Es dato del servidor (usuarios, productos…)?       → TanStack Query / loader / Server Component
¿Debe sobrevivir al refresco o ser compartible?     → URL (search params)
¿Es un formulario?                                  → React Hook Form (o estado local)
¿Cambia poco y lo usan muchos (tema, sesión)?       → Context
¿Es global, dinámico y con muchos consumidores?     → Zustand / Redux Toolkit / Jotai
```

## Capa de datos y servicios

Aísla la comunicación con el backend: los componentes **no** deberían construir URLs ni parsear respuestas.

```js title="lib/http.js"
const BASE = import.meta.env.VITE_API_URL;

export async function http(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || 'Error ' + res.status);
  return res.status === 204 ? null : res.json();
}
```

```js title="features/productos/api.js"
import { http } from '@/lib/http';
export const listarProductos = (filtros) => http('/productos?' + new URLSearchParams(filtros));
export const crearProducto = (datos) => http('/productos', { metodo: 'POST', cuerpo: datos });
```

Sobre eso, hooks de TanStack Query (`useProductos`) y componentes que solo consumen el hook.

## Variables de entorno

Con **Vite**: archivos `.env`, `.env.production`; solo las que empiezan por **`VITE_`** se exponen al código cliente (`import.meta.env.VITE_API_URL`). En Next.js, las públicas llevan el prefijo `NEXT_PUBLIC_`.

:::danger Todo lo que va al cliente es público
Nunca pongas **secretos** (claves privadas, tokens de administrador) en variables que lleguen al navegador: cualquiera puede leerlas en el bundle. Los secretos viven en el **servidor**.
:::

## Seguridad en el frontend

| Riesgo | Cómo mitigarlo |
|---|---|
| **XSS** | React escapa por defecto. Evita `dangerouslySetInnerHTML` con contenido no confiable (o sanea con **DOMPurify**); no construyas URLs `javascript:` desde datos de usuario (`href={url}` valida el protocolo). |
| **Tokens de sesión** | Preferible cookies **`HttpOnly` + `Secure` + `SameSite`** antes que `localStorage` (accesible por scripts). |
| **CSRF** | Cookies `SameSite`, tokens CSRF, cabeceras personalizadas en el backend. |
| **Dependencias** | `npm audit`, Dependabot/Renovate, lockfile, revisa paquetes poco mantenidos. |
| **Autorización** | Esconder un botón **no** es seguridad: el backend debe comprobar permisos siempre. |
| **Datos sensibles** | No registres tokens ni datos personales en logs ni en la consola. |
| **CSP** | Cabecera *Content-Security-Policy* para limitar orígenes de scripts. |

## Autenticación (visión general)

1. El usuario envía credenciales → el backend responde con una **cookie de sesión** `HttpOnly` (o tokens).
2. Un **`AuthProvider`** (contexto) expone `usuario`, `entrar`, `salir` y se inicializa consultando `/me`.
3. **Rutas protegidas** redirigen a `/login`.
4. El cliente HTTP gestiona el **401** (cierre de sesión/refresh).
5. Para no reinventar: **Auth.js**, **Clerk**, **Auth0**, **Supabase Auth**, **Firebase Auth**.

## Internacionalización (i18n)

Separa los textos del código con una librería (**react-i18next**, **FormatJS/react-intl**, **Lingui**) y usa la API **`Intl`** para fechas, números y monedas:

```jsx
const { t } = useTranslation();
<h1>{t('inicio.titulo')}</h1>
<p>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(1234.5)}</p>
```

## Manejo de errores y observabilidad

- Error Boundaries por zonas + uno global.
- **Sentry** (u otro) para capturar errores en producción con *source maps* y contexto de usuario.
- Registro de acciones relevantes y métricas de rendimiento (**Web Vitals**).
- Mensajes de error **útiles** para el usuario y con una acción de recuperación (reintentar).

## Calidad de código automatizada

| Herramienta | Para qué |
|---|---|
| **ESLint** (+ `react-hooks`, `jsx-a11y`) | Detectar bugs y malas prácticas |
| **Prettier** | Formato consistente |
| **TypeScript** | Tipos y refactors seguros |
| **Vitest + Testing Library**, **Playwright** | Pruebas |
| **Husky + lint-staged** | Ejecutar linters en cada *commit* |
| **Conventional Commits** | Historial legible y *changelogs* |
| **CI** (GitHub Actions) | Lint + tests + build en cada *pull request* |
| **Storybook** | Catálogo de componentes aislados y pruebas visuales |

```yaml title=".github/workflows/ci.yml"
name: CI
on: [push, pull_request]
jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
```

## Despliegue

```bash
npm run build          # genera /dist (Vite) con archivos estáticos optimizados y con hash
npm run preview        # comprueba el build localmente
```

| Plataforma | Notas |
|---|---|
| **Vercel / Netlify / Cloudflare Pages** | Conectan el repositorio, *build* y CDN automáticos, *preview deployments* por PR. |
| **GitHub Pages** | Gratis para estáticos; configura `base` en Vite y redirección a `index.html`. |
| **Contenedor (Docker + Nginx)** | Control total en tu infraestructura. |
| **Node / serverless** | Para SSR (Next.js). |

:::warn SPA y rutas
Una SPA con `BrowserRouter` necesita que el servidor devuelva `index.html` para cualquier ruta (si no, recargar `/productos` da 404). Configura un *fallback* (`_redirects` en Netlify, `rewrites` en Vercel, `try_files` en Nginx).
:::

Y recuerda: archivos con **hash en el nombre** + cabeceras de caché largas para *assets*; `index.html` sin caché.

## Escalar equipos y bases de código

- **Design system / librería de componentes** compartida (con Storybook).
- **Monorepo** (pnpm workspaces, Turborepo, Nx) para varias apps y paquetes compartidos.
- **Feature flags** para lanzar de forma gradual.
- **Documentación viva** (README, ADRs: *Architecture Decision Records*).
- Revisiones de código con **criterios claros** (accesibilidad, pruebas, rendimiento).

:::quiz
? ¿Qué es agrupar el código "por feature"?
+ Organizar carpetas por funcionalidad de negocio (productos, carrito…), manteniendo juntos sus componentes, hooks y API
- Agrupar todos los componentes en una carpeta y todos los hooks en otra
- Ordenar archivos alfabéticamente
- Separar el código por tamaño
> Facilita escalar y localizar cambios relacionados.

? ¿Dónde guardar un secreto (clave privada de API)?
+ En el servidor; lo que llega al cliente es público
- En una variable `VITE_...`
- En `localStorage`
- En el componente
> Cualquier cosa del bundle del navegador se puede leer.

? ¿Qué mitiga mejor el robo de tokens por XSS?
+ Cookies `HttpOnly` (+ `Secure` + `SameSite`), junto con evitar XSS
- Guardar el token en `localStorage`
- Esconder el botón de login
- Ofuscar el JavaScript
> `HttpOnly` impide que JavaScript lea la cookie.

? ¿Para qué sirve configurar un *fallback* a `index.html` en el servidor de una SPA?
+ Para que recargar o abrir una ruta directamente (`/productos`) no devuelva 404
- Para comprimir los archivos
- Para activar SSR
- Para cachear imágenes
> El enrutado lo hace el cliente, el servidor debe entregar siempre el HTML base.
:::

:::summary
- Estructura por **features**, colocación y alias; capa de datos aislada; árbol de decisión para el estado.
- Seguridad: secretos en servidor, cookies `HttpOnly`, cuidado con XSS, autorización en backend.
- Calidad: ESLint/Prettier/TS/tests/CI; observabilidad con Sentry; despliegue con fallback SPA y caché adecuada.
:::
