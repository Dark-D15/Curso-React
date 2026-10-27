---
id: suspense-lazy
nivel: 3
titulo: Suspense, lazy y code splitting
icono: ⏳
tiempo: 35 min
resumen: Divide tu bundle, muestra fallbacks de carga de forma declarativa y lee promesas con use().
---

:::goal
Cargar componentes **bajo demanda** con `lazy`, declarar estados de carga con `<Suspense>`, leer promesas con **`use`** y combinar todo con *transiciones* y *Error Boundaries*.
:::

## ¿Qué es Suspense?

`<Suspense fallback={...}>` permite que un componente "diga": **todavía no estoy listo** (esperando código, datos…). React muestra el `fallback` hasta que todo lo de dentro esté disponible. Es una forma **declarativa** de manejar estados de carga.

```jsx
<Suspense fallback={<Spinner />}>
  <ComponenteQuePuedeEsperar />     {/* si "suspende", se ve <Spinner /> */}
</Suspense>
```

Funciona con: componentes `lazy`, lectura de promesas con `use`, y librerías/frameworks compatibles (TanStack Query con `useSuspenseQuery`, Relay, Next.js, React Router, Server Components).

## Code splitting con `lazy`

Tu *bundle* de JavaScript crece con la app. Con `lazy` y `import()` dinámico, partes se descargan **solo cuando se necesitan**:

```jsx
import { lazy, Suspense } from 'react';

const Grafica = lazy(() => import('./Grafica'));       // ./Grafica debe exportar un componente por defecto

function Panel({ verGrafica }) {
  return (
    <Suspense fallback={<p>Cargando gráfica…</p>}>
      {verGrafica && <Grafica />}                      {/* el archivo se descarga la primera vez que se renderiza */}
    </Suspense>
  );
}
```

Aquí lo simulamos con una promesa que tarda un poco (en un proyecto real, `import('./Grafica')` hace una petición del chunk):

```jsx run title="lazy + Suspense"
function Pesado() {
  return <div className="card ok">📦 ¡Componente cargado bajo demanda!</div>;
}

// Simula import('./Pesado') con retraso de 1 s
const PesadoLazy = lazy(() => new Promise((ok) => setTimeout(() => ok({ default: Pesado }), 1000)));

function App() {
  const [ver, setVer] = useState(false);
  return (
    <div className="col">
      <button onClick={() => setVer(true)} disabled={ver}>Cargar componente</button>
      <Suspense fallback={<p className="muted">⏳ Descargando…</p>}>
        {ver && <PesadoLazy />}
      </Suspense>
    </div>
  );
}
```

### Dónde dividir (estrategias)

1. **Por ruta** (lo más común y efectivo): cada página en su propio chunk.
2. **Componentes pesados** poco usados: editores, gráficos, mapas, modales complejos.
3. **Librerías grandes** que solo usas en ciertas pantallas.

```jsx
const Inicio = lazy(() => import('./pages/Inicio'));
const Admin = lazy(() => import('./pages/Admin'));

<Suspense fallback={<PantallaCarga />}>
  <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/admin" element={<Admin />} />
  </Routes>
</Suspense>
```

:::tip Precarga
Para que el chunk esté listo antes del clic, lánzalo al pasar el ratón o en tiempo ocioso: `onMouseEnter={() => import('./Admin')}`. El navegador lo guardará.
:::

## Límites anidados

Puedes poner **varios** `Suspense`: el más cercano al componente que suspende es el que muestra su fallback. Así controlas qué parte de la UI "parpadea":

```jsx
<Suspense fallback={<EsqueletoPagina />}>
  <Cabecera />
  <Suspense fallback={<EsqueletoComentarios />}>
    <Comentarios />          {/* solo esta zona muestra su esqueleto mientras carga */}
  </Suspense>
</Suspense>
```

## `use`: leer una promesa durante el render

React 19 añade la API `use(promesa)`. Si la promesa aún no se resolvió, el componente **suspende**; cuando se resuelve, continúa con el valor. Si se rechaza, el error lo captura el Error Boundary más cercano.

:::danger La promesa debe ser estable
**No crees la promesa dentro del componente que hace `use`**: se crearía una nueva en cada render. Debe venir de **fuera**: una caché, props, un Server Component, o una librería (TanStack Query, el router).
:::

```jsx run title="use(promesa) con una caché sencilla"
const cachePromesas = new Map();

function cargarUsuario(id) {                           // devuelve SIEMPRE la misma promesa para el mismo id
  if (!cachePromesas.has(id)) {
    cachePromesas.set(id, new Promise((ok) => setTimeout(() => ok({ id, nombre: 'Usuario ' + id, email: 'u' + id + '@mail.com' }), 900)));
  }
  return cachePromesas.get(id);
}

function Perfil({ promesa }) {
  const usuario = use(promesa);                        // suspende hasta que esté listo
  return <div className="card"><h3>{usuario.nombre}</h3><p className="muted">{usuario.email}</p></div>;
}

function App() {
  const [id, setId] = useState(1);
  return (
    <div className="col">
      <div className="row">{[1, 2, 3].map((n) => <button key={n} onClick={() => setId(n)}>Usuario {n}</button>)}</div>
      <Suspense fallback={<p className="muted">⏳ Cargando usuario…</p>}>
        <Perfil promesa={cargarUsuario(id)} />
      </Suspense>
    </div>
  );
}
```

Observa: cada usuario carga **una sola vez**; si vuelves a uno visto, aparece al instante porque su promesa ya está resuelta.

## Suspense + transiciones: evita saltos al fallback

Cuando un cambio de estado hace que se **suspenda** algo ya visible, React reemplaza la UI por el fallback (un "parpadeo" molesto). Si el cambio está dentro de `startTransition`, React **mantiene la UI anterior** mientras prepara la nueva:

```jsx run title="Con startTransition la pantalla anterior se queda mientras carga"
const cachePromesas = new Map();
function cargarPost(id) {
  if (!cachePromesas.has(id)) cachePromesas.set(id, new Promise((ok) => setTimeout(() => ok('Contenido del post #' + id), 900)));
  return cachePromesas.get(id);
}

function Post({ promesa }) { return <p className="card">{use(promesa)}</p>; }

function App() {
  const [id, setId] = useState(1);
  const [pendiente, empezarTransicion] = useTransition();

  function ir(n) { empezarTransicion(() => setId(n)); }   // actualización NO urgente

  return (
    <div className="col">
      <div className="row">
        {[1, 2, 3].map((n) => <button key={n} onClick={() => ir(n)}>Post {n}</button>)}
        {pendiente && <small className="muted">cargando…</small>}
      </div>
      <div style={{ opacity: pendiente ? 0.5 : 1, transition: 'opacity .2s' }}>
        <Suspense fallback={<p>⏳ Primera carga…</p>}>
          <Post promesa={cargarPost(id)} />
        </Suspense>
      </div>
    </div>
  );
}
```

## Suspense + Error Boundary: el combo completo

```jsx
<ErrorBoundary fallback={<p>No se pudo cargar</p>}>
  <Suspense fallback={<Spinner />}>
    <DatosRemotos />
  </Suspense>
</ErrorBoundary>
```

- **Suspense** gestiona el "todavía no".
- **Error Boundary** gestiona el "falló".

## Streaming y SSR

Con Server Components/SSR, Suspense permite **enviar HTML por partes**: la página llega pronto con esqueletos y cada zona se completa cuando sus datos están listos (*streaming*). Lo verás en la lección de Server Components.

## Buenas prácticas

- Los *fallbacks* deben ser **ligeros** y parecerse al contenido final (esqueletos), para evitar saltos de layout.
- No envuelvas **toda** la app en un solo Suspense si algunas zonas pueden cargar independientemente.
- Los chunks muy pequeños no merecen `lazy` (la petición extra cuesta más).
- Siempre combina `lazy` con un **Error Boundary** (puede fallar la descarga del chunk).

:::exercise Carga diferida con fallback
`Reporte` se carga de forma diferida (`lazy`). Envuélvelo en un `Suspense` con el fallback `<p id="carga">Cargando reporte…</p>` para que, tras pulsar el botón, primero se vea el fallback y luego el contenido.

```hint
`<Suspense fallback={<p id="carga">Cargando reporte…</p>}>{ver && <ReporteLazy />}</Suspense>`
```

```starter
function Reporte() {
  return <p id="reporte">📊 Reporte listo</p>;
}
const ReporteLazy = lazy(() => new Promise((ok) => setTimeout(() => ok({ default: Reporte }), 600)));

function App() {
  const [ver, setVer] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setVer(true)}>Ver reporte</button>
      {ver && <ReporteLazy />}
    </div>
  );
}
```

```solution
function Reporte() {
  return <p id="reporte">📊 Reporte listo</p>;
}
const ReporteLazy = lazy(() => new Promise((ok) => setTimeout(() => ok({ default: Reporte }), 600)));

function App() {
  const [ver, setVer] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setVer(true)}>Ver reporte</button>
      <Suspense fallback={<p id="carga">Cargando reporte…</p>}>
        {ver && <ReporteLazy />}
      </Suspense>
    </div>
  );
}
```

```checks
await check('Al inicio no hay reporte ni fallback', () => !$('#reporte') && !$('#carga'));
await click(btn('Ver reporte'));
await check('Mientras carga se ve el fallback "Cargando reporte…"', () => $('#carga') && text('#carga') === 'Cargando reporte…');
const ok = await waitFor(() => $('#reporte'), 2500);
await check('Después aparece el reporte y desaparece el fallback', () => ok && !$('#carga'));
```
:::

:::quiz
? ¿Qué muestra React mientras un componente dentro de `<Suspense>` no está listo?
+ El `fallback` del Suspense más cercano
- Nada
- Un error
- La versión anterior siempre
> Se puede evitar el fallback con transiciones.

? ¿Qué requisito importante tiene la promesa que pasas a `use()`?
+ Debe ser estable entre renders (creada fuera del componente o cacheada)
- Debe crearse dentro del componente
- Debe ser síncrona
- Debe devolver JSX
> Si se crea nueva en cada render, se produciría un bucle de suspensión.

? ¿Dónde es más efectivo aplicar code splitting con `lazy`?
+ Por rutas/páginas y componentes pesados poco usados
- En cada botón pequeño
- En todos los componentes
- Solo en el componente raíz
> Equilibra beneficio y número de peticiones.

? ¿Qué componente atrapa el fallo si la promesa de `use` se rechaza?
+ El Error Boundary más cercano
- Suspense
- El navegador
- Nadie
> Suspense gestiona "cargando"; el Error Boundary gestiona "error".
:::

:::summary
- `<Suspense fallback>` = estado de carga declarativo; `lazy(() => import(...))` = código bajo demanda.
- `use(promesaEstable)` suspende durante el render; combínalo con `useTransition` para no perder la UI actual.
- Siempre empareja Suspense con un Error Boundary; divide por rutas y piezas pesadas.
:::
