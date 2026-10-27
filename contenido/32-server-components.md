---
id: server-components
nivel: 3
titulo: Renderizado en servidor, Server Components y Next.js
icono: 🖧
tiempo: 45 min
resumen: CSR, SSR, SSG, hidratación y el modelo de Server Components; cómo se usa todo esto en la práctica con Next.js.
---

:::goal
Entender **dónde se renderiza** tu React (cliente o servidor), qué son **hidratación**, **Server Components** y **Server Actions**, y cómo se aplican en un framework como **Next.js (App Router)**.
:::

:::info Lección conceptual
Esta lección explica el modelo mental con código real de Next.js. No se ejecuta en el navegador de este curso porque necesita un servidor: crea un proyecto (`npx create-next-app@latest`) para probarlo.
:::

## ¿Dónde se renderiza React?

| Estrategia | Dónde y cuándo se genera el HTML | Ventajas | Inconvenientes |
|---|---|---|---|
| **CSR** (Client-Side Rendering) | En el navegador, tras descargar y ejecutar JS | Simple, hosting estático, muy interactivo | Pantalla inicial vacía, peor SEO y *LCP*, bundle grande |
| **SSR** (Server-Side Rendering) | En el servidor **en cada petición** | HTML listo (SEO, carga percibida), datos frescos | Necesita servidor, TTFB mayor |
| **SSG** (Static Site Generation) | En **build**, una vez | Rapidísimo, CDN, barato | Datos "congelados" hasta el próximo build |
| **ISR** (Incremental Static Regeneration) | Estático, regenerado cada cierto tiempo/evento | Lo mejor de ambos | Requiere plataforma compatible |

Una app moderna **mezcla** estrategias según la ruta (landing estática, panel privado en cliente, producto con datos en servidor).

## Hidratación

Con SSR/SSG, el servidor envía **HTML ya pintado**. El navegador lo muestra enseguida, pero aún no es interactivo. Después carga el JavaScript y React **hidrata**: adjunta eventos y estado a ese HTML existente (`hydrateRoot`).

```text
Servidor ──HTML──▶ Navegador (se ve, pero "muerto") ──JS──▶ Hidratación ──▶ Interactivo ✅
```

:::warn Errores de hidratación
Si el HTML del servidor y el primer render del cliente **no coinciden** (por `Date.now()`, `Math.random()`, `window`, `localStorage`, formatos de fecha locales…), React avisa con un *hydration mismatch*. Mantén el primer render determinista y mueve lo específico del navegador a `useEffect`.
:::

## Server Components (RSC)

Hasta ahora **todos** los componentes se ejecutaban en el navegador. Con **React Server Components** puedes tener componentes que **solo se ejecutan en el servidor** (en build o por petición) y **no envían su JavaScript al cliente**.

| | Server Component | Client Component |
|---|---|---|
| Se ejecuta en | Servidor | Servidor (pre-render) **y** navegador (hidratación) |
| Estado / efectos (`useState`, `useEffect`) | ❌ | ✅ |
| Eventos (`onClick`) | ❌ | ✅ |
| APIs del navegador (`window`) | ❌ | ✅ |
| Acceso directo a BD, archivos, secretos | ✅ | ❌ |
| `async/await` en el componente | ✅ | ❌ |
| JS enviado al navegador | **0 bytes** | Sí |

### Un Server Component típico (por defecto en Next.js App Router)

```jsx title="app/productos/page.jsx — Server Component"
import { db } from '@/lib/db';
import BotonComprar from './BotonComprar';       // Client Component

export default async function PaginaProductos() {
  const productos = await db.producto.findMany();        // consulta directa, sin API intermedia ni useEffect

  return (
    <ul>
      {productos.map((p) => (
        <li key={p.id}>
          {p.nombre} — ${p.precio}
          <BotonComprar id={p.id} />                     {/* la interactividad vive en un componente cliente */}
        </li>
      ))}
    </ul>
  );
}
```

### Client Components: la directiva `'use client'`

```jsx title="app/productos/BotonComprar.jsx"
'use client';                                   // primera línea: marca la frontera servidor → cliente

import { useState } from 'react';

export default function BotonComprar({ id }) {
  const [añadido, setAñadido] = useState(false);
  return <button onClick={() => setAñadido(true)}>{añadido ? '✔ Añadido' : 'Comprar'}</button>;
}
```

`'use client'` declara una **frontera**: ese archivo y todo lo que importa se incluyen en el bundle del cliente.

### Reglas de composición

1. Los **Server Components pueden importar Client Components**, no al revés.
2. Un Client Component **puede recibir Server Components como `children`** (o props): el servidor los renderiza y los "inserta".
3. Las **props** que cruzan la frontera deben ser **serializables** (strings, números, objetos planos, arrays, Promesas…; no funciones ni clases, salvo Server Actions).
4. Empieza **todo en servidor** y pasa a cliente solo **las hojas interactivas**.

```jsx title="Un cliente que envuelve contenido de servidor"
// ContenedorCliente.jsx  ('use client')
export default function Acordeon({ children }) {
  const [abierto, setAbierto] = useState(false);
  return <div><button onClick={() => setAbierto(!abierto)}>Ver</button>{abierto && children}</div>;
}

// page.jsx (servidor)
<Acordeon><ContenidoPesadoDelServidor /></Acordeon>
```

## Datos asíncronos: streaming con Suspense

Los Server Components son `async`. Con `<Suspense>` el servidor **envía HTML por partes** (*streaming*): la página se muestra enseguida y cada zona aparece cuando su dato está listo.

```jsx title="app/dashboard/page.jsx"
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <>
      <h1>Panel</h1>                                      {/* se envía de inmediato */}
      <Suspense fallback={<EsqueletoGrafica />}>
        <GraficaLenta />                                  {/* async: se completa cuando llegue el dato */}
      </Suspense>
      <Suspense fallback={<EsqueletoTabla />}>
        <TablaPedidos />
      </Suspense>
    </>
  );
}
```

Pedir datos **en paralelo** (cada componente su propia petición) evita *waterfalls*.

## Server Actions: `'use server'`

Funciones que **se ejecutan en el servidor** y que llamas desde el cliente (formularios, botones) sin escribir endpoints:

```jsx title="app/acciones.js"
'use server';

import { revalidatePath } from 'next/cache';

export async function crearTarea(formData) {
  const titulo = formData.get('titulo');
  await db.tarea.create({ data: { titulo } });
  revalidatePath('/tareas');                       // refresca los datos cacheados de esa ruta
}
```

```jsx title="app/tareas/page.jsx"
import { crearTarea } from '../acciones';

export default function Tareas() {
  return (
    <form action={crearTarea}>                    {/* ¡funciona incluso antes de hidratar! */}
      <input name="titulo" />
      <button>Añadir</button>
    </form>
  );
}
```

:::danger Trata las Server Actions como endpoints públicos
Cualquiera puede invocarlas. **Valida y autoriza siempre** dentro de la acción (sesión, permisos, esquema Zod). Nunca confíes en datos del cliente.
:::

## Next.js (App Router): lo esencial

Next.js organiza la app con **carpetas = rutas** y archivos con significado especial:

```text
app/
├── layout.jsx          ← layout raíz (html, body, proveedores)
├── page.jsx            ← "/"
├── loading.jsx         ← fallback automático con Suspense para el segmento
├── error.jsx           ← Error Boundary del segmento ('use client')
├── not-found.jsx       ← 404
├── productos/
│   ├── page.jsx        ← "/productos"
│   └── [id]/
│       └── page.jsx    ← "/productos/42"  (params.id)
├── api/
│   └── saludo/route.js ← endpoint HTTP: GET/POST…
└── globals.css
```

| Concepto | Descripción |
|---|---|
| **Layouts anidados** | Se conservan al navegar (no pierden estado). |
| **`generateMetadata`** | SEO: título, descripción y Open Graph por ruta. |
| **`next/link`, `next/image`, `next/font`** | Navegación con *prefetch*, imágenes optimizadas, fuentes sin salto. |
| **Caché y revalidación** | Control del almacenamiento de datos (`revalidatePath`, `revalidateTag`, opciones de `fetch`). La política exacta ha cambiado entre versiones: consulta la documentación. |
| **Route Handlers** | `route.js` para APIs. |
| **Middleware / Proxy** | Lógica antes de la ruta (redirecciones, autenticación). |
| **Rutas dinámicas** | `[id]`, `[...slug]`, grupos `(grupo)`, rutas paralelas e interceptadas. |

```jsx title="app/productos/[id]/page.jsx"
export async function generateMetadata({ params }) {
  const { id } = await params;                    // en versiones recientes params es una Promesa
  const p = await obtenerProducto(id);
  return { title: p.nombre, description: p.resumen };
}

export default async function Producto({ params }) {
  const { id } = await params;
  const producto = await obtenerProducto(id);
  return <h1>{producto.nombre}</h1>;
}
```

:::info Versiones
Las APIs de Next.js (caché, `params` asíncronos, proxy/middleware…) evolucionan rápido. Usa como referencia la documentación oficial de la versión que instales.
:::

## ¿Cuándo usar qué?

| Necesidad | Elección |
|---|---|
| Panel interno, SPA muy interactiva, sin SEO | **Vite + React (CSR)** |
| Sitio de marketing/blog | **SSG** (Next.js/Astro) |
| Tienda, contenido con SEO y datos que cambian | **SSR + streaming + caché** |
| Mezcla de todo con buen DX | **Next.js** o **React Router (modo framework)** |
| Mucho contenido y poca interactividad | **Astro** (islas de React) |

## Resumen visual: el árbol RSC

```text
 Servidor                                  Cliente
 ────────                                  ────────
 <Layout/>        (server)                 
   <Pagina/>      (server, async + BD)     
     <Lista/>     (server)                 
       <Item/>    (server) ──────────▶ HTML
         <BotonLike/> ('use client') ───▶ JS + hidratación (solo esta isla)
```

Solo el código **interactivo** viaja al navegador: menos JS, mejor rendimiento.

:::quiz
? ¿Qué es la hidratación?
+ Adjuntar eventos y estado de React al HTML que ya envió el servidor
- Descargar imágenes
- Guardar datos en caché
- Comprimir el bundle
> El HTML se ve antes, y se vuelve interactivo tras hidratar.

? ¿Cuál de estas cosas NO puede hacer un Server Component?
- Hacer `await` de una consulta a base de datos
+ Usar `useState` o manejar `onClick`
- Renderizar otros componentes
- Recibir props
> Para estado y eventos necesitas un Client Component (`'use client'`).

? ¿Qué significa `'use client'` al inicio de un archivo?
+ Marca la frontera: ese módulo y sus imports se incluyen en el bundle del cliente
- Ejecuta el archivo solo en el navegador sin SSR
- Desactiva TypeScript
- Hace el componente asíncrono
> Los Client Components también se pre-renderizan en el servidor.

? ¿Por qué hay que validar datos y permisos dentro de una Server Action?
+ Porque es un endpoint invocable por cualquiera y no se debe confiar en el cliente
- Porque React lo exige
- Porque es más rápido
- Porque es opcional
> Trátalas como una API pública.

? ¿Qué estrategia genera el HTML en build, una sola vez?
+ SSG
- CSR
- SSR
- Hidratación
> Se sirve desde CDN, muy rápido.
:::

:::summary
- CSR/SSR/SSG/ISR: elige por ruta. Hidratación = hacer interactivo el HTML del servidor.
- **Server Components**: `async`, acceso directo a datos, 0 JS al cliente; **Client Components** (`'use client'`) para estado y eventos.
- **Server Actions** (`'use server'`) para mutaciones; **Suspense** para streaming; Next.js organiza todo con carpetas y archivos especiales.
:::
