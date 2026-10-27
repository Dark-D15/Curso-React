---
id: enrutado
nivel: 2
titulo: Enrutado con React Router
icono: 🧭
tiempo: 40 min
resumen: Navegación entre páginas en una SPA: rutas, enlaces, parámetros, rutas anidadas, layouts, rutas protegidas y carga de datos.
---

:::goal
Comprender cómo funciona una **SPA con rutas** y usar **React Router**: `Route`, `Link`, `useParams`, `Outlet`, `useNavigate`, rutas protegidas y *loaders*.
:::

## ¿Qué es el enrutado en una SPA?

En una *Single Page Application* hay **un único HTML**. Cuando navegas, el router:

1. Cambia la **URL** con la *History API* (sin recargar).
2. Decide qué **componente** mostrar según esa URL.

```text
URL  /usuarios/42   →   <Layout> <PaginaUsuario id="42" /> </Layout>
```

React no incluye router: se usa una librería. La más extendida es **React Router** (también hay TanStack Router y los routers de frameworks como Next.js).

## Cómo funciona por dentro (mini router)

Para entender el concepto, esta demo implementa un router muy simple: la "URL" es un estado y se hace *matching* con patrones con parámetros (`/usuarios/:id`):

```jsx run title="Mini router casero (solo para entender la idea)"
function coincidir(patron, ruta) {
  const p = patron.split('/'), r = ruta.split('/');
  if (p.length !== r.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = r[i];
    else if (p[i] !== r[i]) return null;
  }
  return params;
}

const RUTAS = [
  { patron: '/', vista: () => <h3>🏠 Inicio</h3> },
  { patron: '/usuarios', vista: () => <h3>👥 Lista de usuarios</h3> },
  { patron: '/usuarios/:id', vista: ({ id }) => <h3>👤 Perfil del usuario #{id}</h3> },
];

function App() {
  const [ruta, setRuta] = useState('/');
  let vista = <h3>🤷 404: no encontrada</h3>;
  for (const r of RUTAS) {
    const params = coincidir(r.patron, ruta);
    if (params) { vista = r.vista(params); break; }
  }

  const ir = (e, destino) => { e.preventDefault(); setRuta(destino); };   // como <Link>: sin recargar
  return (
    <div className="card col">
      <nav className="row">
        <a href="/" onClick={(e) => ir(e, '/')}>Inicio</a>
        <a href="/usuarios" onClick={(e) => ir(e, '/usuarios')}>Usuarios</a>
        <a href="/usuarios/7" onClick={(e) => ir(e, '/usuarios/7')}>Usuario 7</a>
        <a href="/nada" onClick={(e) => ir(e, '/nada')}>Ruta rota</a>
      </nav>
      <small className="muted">URL actual: {ruta}</small>
      {vista}
    </div>
  );
}
```

React Router hace esto (y mucho más) leyendo/escribiendo la URL real con la History API.

## Instalación y primer router

```bash
npm install react-router
```

:::info Paquetes
En **React Router v7** todo se importa desde `react-router` (y `react-router/dom` para `RouterProvider` en el navegador). El paquete `react-router-dom` de versiones anteriores sigue existiendo como reexportación. Consulta siempre la documentación de la versión que uses.
:::

```jsx title="main.jsx — modo declarativo"
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/productos">Productos</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/:id" element={<DetalleProducto />} />
        <Route path="*" element={<NoEncontrada />} />   {/* 404 */}
      </Routes>
    </BrowserRouter>
  );
}
```

- `<Link to="/ruta">` navega **sin recargar** (usa `<Link>` en vez de `<a href>`).
- `<NavLink>` añade automáticamente la clase `active` al enlace de la ruta actual.
- `path="*"` captura todo lo demás (página 404).

## Parámetros de ruta: `useParams`

```jsx
import { useParams, Link } from 'react-router';

function DetalleProducto() {
  const { id } = useParams();                 // /productos/42 → id === '42' (¡siempre string!)
  return (
    <>
      <h2>Producto {id}</h2>
      <Link to="/productos">← Volver</Link>
    </>
  );
}
```

## Navegar desde código: `useNavigate`

```jsx
import { useNavigate } from 'react-router';

function Login() {
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    await iniciarSesion();
    navigate('/panel', { replace: true });    // replace: no deja "login" en el historial
  }
  return <form onSubmit={handleSubmit}>…</form>;
}
```

(Para redirecciones declarativas: `<Navigate to="/login" replace />`.)

## Rutas anidadas y layouts con `Outlet`

Una ruta padre define el **marco común** y `<Outlet />` indica dónde se pinta la ruta hija:

```jsx
<Routes>
  <Route path="/" element={<Layout />}>            {/* Layout contiene <Outlet /> */}
    <Route index element={<Inicio />} />           {/* "/" */}
    <Route path="productos" element={<Productos />} />
    <Route path="productos/:id" element={<DetalleProducto />} />
    <Route path="*" element={<NoEncontrada />} />
  </Route>
</Routes>
```

```jsx
import { Outlet, NavLink } from 'react-router';

function Layout() {
  return (
    <div>
      <header><NavLink to="/">Inicio</NavLink> <NavLink to="/productos">Productos</NavLink></header>
      <main><Outlet /></main>        {/* aquí se renderiza la ruta hija activa */}
      <footer>© 2026</footer>
    </div>
  );
}
```

## Parámetros de búsqueda (`?q=...`)

```jsx
import { useSearchParams } from 'react-router';

function Productos() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  return (
    <input value={q} onChange={(e) => setParams({ q: e.target.value })} placeholder="Buscar…" />
    // la URL queda /productos?q=teclado → ¡el filtro es compartible y sobrevive al refrescar!
  );
}
```

:::tip Estado en la URL
Filtros, paginación, pestañas, orden… guardados en la URL hacen que la app sea **compartible** y que el botón "atrás" funcione como espera el usuario.
:::

## Rutas protegidas

```jsx
function RutaPrivada() {
  const { usuario } = useAuth();                    // tu contexto de autenticación
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}

<Route element={<RutaPrivada />}>
  <Route path="/panel" element={<Panel />} />
  <Route path="/perfil" element={<Perfil />} />
</Route>
```

## Modo "data router": loaders y actions

Con `createBrowserRouter` y `RouterProvider`, cada ruta puede declarar **cómo cargar sus datos** (`loader`) y **cómo procesar formularios** (`action`), *antes* de renderizar. Se evitan cascadas de peticiones y se simplifica el estado de carga.

```jsx
import { createBrowserRouter, useLoaderData } from 'react-router';
import { RouterProvider } from 'react-router/dom';   // en el navegador (v7)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPagina />,                  // errores de carga o render de esta rama
    children: [
      {
        path: 'productos/:id',
        loader: async ({ params }) => {
          const res = await fetch(`/api/productos/${params.id}`);
          if (!res.ok) throw new Response('No encontrado', { status: 404 });
          return res.json();
        },
        element: <DetalleProducto />,
      },
    ],
  },
]);

function DetalleProducto() {
  const producto = useLoaderData();                 // los datos ya están listos
  return <h2>{producto.nombre}</h2>;
}

root.render(<RouterProvider router={router} />);
```

## Carga perezosa de rutas (code splitting)

```jsx
const Panel = lazy(() => import('./Panel'));          // se descarga cuando se visita la ruta

<Suspense fallback={<p>Cargando…</p>}>
  <Routes><Route path="/panel" element={<Panel />} /></Routes>
</Suspense>
```

## Alternativas

| Opción | Notas |
|---|---|
| **React Router** | El estándar; modo declarativo, data y framework (SSR). |
| **TanStack Router** | Rutas con tipado total en TypeScript, *search params* tipados. |
| **Next.js (App Router)** | Rutas por carpetas del sistema de archivos, Server Components. |

:::exercise Mini router con 404
Completa el mini router: cada botón de navegación debe cambiar la ruta (`setRuta`), y la vista se obtiene del objeto `PAGINAS` según la ruta. Si la ruta no existe, muestra `<h3>404</h3>`.

```hint
`const Pagina = PAGINAS[ruta];` y `return Pagina ? <Pagina /> : <h3>404</h3>`. Los botones: `onClick={() => setRuta('/acerca')}`.
```

```starter
const PAGINAS = {
  '/': () => <h3>Inicio</h3>,
  '/acerca': () => <h3>Acerca de</h3>,
};

function App() {
  const [ruta, setRuta] = useState('/');

  return (
    <div className="card col">
      <nav className="row">
        <button>Inicio</button>
        <button>Acerca</button>
        <button>Rota</button>
      </nav>
      <div>{/* vista aquí */}</div>
    </div>
  );
}
```

```solution
const PAGINAS = {
  '/': () => <h3>Inicio</h3>,
  '/acerca': () => <h3>Acerca de</h3>,
};

function App() {
  const [ruta, setRuta] = useState('/');
  const Pagina = PAGINAS[ruta];

  return (
    <div className="card col">
      <nav className="row">
        <button onClick={() => setRuta('/')}>Inicio</button>
        <button onClick={() => setRuta('/acerca')}>Acerca</button>
        <button onClick={() => setRuta('/rota')}>Rota</button>
      </nav>
      <div>{Pagina ? <Pagina /> : <h3>404</h3>}</div>
    </div>
  );
}
```

```checks
await check('Se muestra "Inicio" al comenzar', () => text('h3') === 'Inicio');
await click(btn('Acerca'));
await check('"Acerca" muestra "Acerca de"', () => text('h3') === 'Acerca de');
await click(btn('Rota'));
await check('Una ruta inexistente muestra 404', () => text('h3') === '404');
await click(btn('Inicio'));
await check('Se puede volver a Inicio', () => text('h3') === 'Inicio');
```
:::

:::quiz
? ¿Qué diferencia hay entre `<Link>` y `<a href>` en una SPA?
+ `<Link>` navega sin recargar la página; `<a href>` provoca una carga completa
- Ninguna
- `<Link>` solo sirve para enlaces externos
- `<a>` es más rápido
> Un router intercepta el clic y actualiza la URL con la History API.

? ¿Para qué sirve `<Outlet />`?
+ Para indicar dónde se renderiza la ruta hija dentro de una ruta padre (layout)
- Para redirigir
- Para cargar datos
- Para cerrar sesión
> Es el "hueco" del layout para las rutas anidadas.

? ¿De qué tipo es siempre el valor devuelto por `useParams()`?
- `number`
+ `string` (hay que convertirlo si hace falta)
- `boolean`
- Depende de la ruta
> Los parámetros vienen de la URL, que es texto.

? ¿Qué ventaja tiene guardar filtros en los *search params*?
+ La URL es compartible y el estado sobrevive a recargas y al botón "atrás"
- Es más seguro
- Evita usar estado
- Hace la app más pequeña
> Es una buena práctica de UX.
:::

:::summary
- Una SPA cambia la URL con la History API y elige qué componente mostrar.
- React Router: `Routes/Route`, `Link/NavLink`, `useParams`, `useNavigate`, `Outlet`, `useSearchParams`.
- Rutas protegidas con `Navigate`; *data routers* con `loader/action`; `lazy` para dividir el código.
:::
