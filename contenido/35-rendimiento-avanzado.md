---
id: rendimiento-avanzado
nivel: 3
titulo: Rendimiento avanzado: reconciliación, virtualización y medición
icono: 🚀
tiempo: 45 min
resumen: Cómo decide React qué actualizar, cómo medir con el Profiler y técnicas avanzadas: virtualización, división de bundle y buenas métricas.
---

:::goal
Entender el **algoritmo de reconciliación** y la arquitectura **Fiber**, medir con el **Profiler** y aplicar técnicas avanzadas: **virtualización**, división de código, y optimización de métricas web.
:::

## Reconciliación: cómo decide React qué cambiar

Comparar dos árboles arbitrarios es costoso (O(n³) en teoría). React usa una **heurística O(n)** con dos supuestos:

1. **Elementos de distinto tipo producen árboles distintos.** Si en una posición pasas de `<div>` a `<span>` (o de `<A/>` a `<B/>`), React **destruye** el subárbol antiguo (se pierde su estado) y monta uno nuevo.
2. **Las `key` identifican elementos estables** entre renders de una lista.

```text
Mismo tipo y misma posición  →  React REUTILIZA el nodo/estado y solo actualiza props cambiadas.
Distinto tipo / distinta key →  React DESMONTA lo anterior y MONTA uno nuevo (estado reiniciado).
```

Esta idea explica comportamientos que vimos antes:

```jsx run title="La posición y el tipo determinan la identidad del estado"
function Contador({ nombre }) {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{nombre}: {n}</button>;
}

function App() {
  const [ambos, setAmbos] = useState(true);
  return (
    <div className="card col">
      <label><input type="checkbox" checked={ambos} onChange={(e) => setAmbos(e.target.checked)} /> Mostrar el primer contador</label>
      {/* Al quitar el primero, el segundo se reposiciona. Con keys explícitas conserva su estado */}
      <div className="row">
        {ambos && <Contador key="a" nombre="A" />}
        <Contador key="b" nombre="B" />
      </div>
      <small className="muted">Suma en B, oculta A y vuelve a mostrarlo: B conserva su cuenta; A empieza de cero.</small>
    </div>
  );
}
```

### Consecuencias prácticas

- **Nunca definas componentes dentro de otros** (es un tipo "nuevo" en cada render → estado destruido).
- Cambiar la **`key`** de un componente es la forma oficial de **reiniciarlo**.
- Mover un elemento entre posiciones sin `key` puede **perder su estado**; con `key` estable, React lo reordena.

## Fiber y el planificador (scheduler)

Desde React 16 el núcleo es **Fiber**: una reimplementación donde el trabajo de render se divide en **unidades pequeñas** (fibers, una por componente/elemento) que forman una estructura enlazada. Esto permite:

- **Pausar** el trabajo y ceder el hilo al navegador (la base de la concurrencia).
- **Priorizar** actualizaciones (urgentes vs. transiciones).
- **Descartar** trabajo obsoleto y **reutilizar** el ya hecho.

El render ocurre en **dos fases**: la **fase de render** (interrumpible, pura: calcula qué cambió) y la **fase de commit** (síncrona: aplica al DOM y ejecuta efectos).

## Medir antes de optimizar

### React DevTools Profiler

1. Pestaña **Profiler** → *Record* → interactúa → *Stop*.
2. Mira el **flamegraph/ranked**: qué componentes se renderizaron y cuánto tardaron.
3. Activa **"Record why each component rendered"** para ver la causa (props, hooks, contexto, padre).

### El componente `<Profiler>` (programático)

```jsx run
function onRender(id, fase, duracionReal) {
  console.log(id + ' [' + fase + '] ' + duracionReal.toFixed(2) + ' ms');
}

function Lista({ n }) {
  return <ul>{Array.from({ length: n }, (_, i) => <li key={i}>Elemento {i}</li>)}</ul>;
}

function App() {
  const [n, setN] = useState(50);
  return (
    <div className="card col">
      <button onClick={() => setN(n + 500)}>Añadir 500 elementos (ahora {n})</button>
      <Profiler id="Lista" onRender={onRender}>
        <div style={{ height: 120, overflow: 'auto' }}><Lista n={n} /></div>
      </Profiler>
    </div>
  );
}
```

Mira la consola: cada cambio informa de la duración del render. En producción suele estar desactivado (hay builds con *profiling*).

### Otras herramientas

- **Chrome DevTools → Performance**: flamegraph de JS, *long tasks*, *layout/paint*. React 19.2 añade pistas propias.
- **Lighthouse** y **Web Vitals** para métricas reales.
- Análisis de bundle: `vite-bundle-visualizer`, `source-map-explorer`, `webpack-bundle-analyzer`.

## Virtualización (windowing)

Renderizar **10 000 filas** crea 10 000 nodos DOM aunque el usuario solo vea 10. La **virtualización** renderiza únicamente las filas **visibles** (más un pequeño margen) y simula el resto con espacio vacío.

```text
┌─────────────┐  ← espacio superior (altura = filas ocultas arriba)
│ fila 41     │
│ fila 42     │  ← solo estas existen en el DOM
│ fila 43     │
├─────────────┤  ← espacio inferior
└─────────────┘
```

Una implementación manual (idea central que usan `react-window` y `@tanstack/react-virtual`):

```jsx run title="10 000 filas, ~10 nodos en el DOM"
const TOTAL = 10000, ALTO_FILA = 32, ALTO_VISTA = 160, MARGEN = 3;

function ListaVirtual() {
  const [scrollTop, setScrollTop] = useState(0);

  const inicio = Math.max(0, Math.floor(scrollTop / ALTO_FILA) - MARGEN);
  const fin = Math.min(TOTAL, Math.ceil((scrollTop + ALTO_VISTA) / ALTO_FILA) + MARGEN);

  const filas = [];
  for (let i = inicio; i < fin; i++) {
    filas.push(
      <div key={i} className="fila" style={{ position: 'absolute', top: i * ALTO_FILA, height: ALTO_FILA, left: 0, right: 0, padding: '4px 10px', borderBottom: '1px solid #e2e8f0' }}>
        Fila {i + 1}
      </div>
    );
  }

  return (
    <div id="vista" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
         style={{ height: ALTO_VISTA, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: 8, position: 'relative' }}>
      <div style={{ height: TOTAL * ALTO_FILA, position: 'relative' }}>{filas}</div>   {/* "espacio" total del scroll */}
    </div>
  );
}

function App() {
  return (
    <div className="card col">
      <ListaVirtual />
      <small className="muted">La lista tiene {TOTAL.toLocaleString()} filas, pero el DOM solo contiene las visibles.</small>
    </div>
  );
}
```

En proyectos reales usa **`@tanstack/react-virtual`** o **`react-window`** (alturas variables, cuadrículas, scroll infinito, accesibilidad). La paginación o el *infinite scroll* también son alternativas válidas.

## Reducir el trabajo de JavaScript

| Técnica | Efecto |
|---|---|
| **Code splitting** (`lazy`, rutas) | Menos JS inicial. |
| **Tree shaking** + imports nombrados | Quita código no usado (`import { debounce } from 'lodash-es'`, no todo `lodash`). |
| **Preferir librerías ligeras** | `date-fns` o `Intl` en vez de moment; revisa el peso con *bundlephobia*. |
| **Mover cálculo al servidor** | Server Components, SSR/SSG. |
| **Web Workers** | Cálculos muy pesados fuera del hilo principal. |
| **`useTransition` / `useDeferredValue`** | UI fluida bajo carga. |
| **React Compiler** | Memoización automática. |

## Evitar renders innecesarios (resumen avanzado)

1. **Colocación del estado** (estado lo más cerca posible).
2. **Composición** (`children` ya creados no se re-renderizan).
3. **`memo` + props estables**; con Compiler a menudo es automático.
4. **Selectores** en stores (Zustand/Redux) y contextos divididos.
5. **Keys estables** y listas virtualizadas.
6. **Evitar objetos/arrays literales nuevos** como props de componentes memoizados.

## Carga y percepción de velocidad (Core Web Vitals)

| Métrica | Mide | Cómo mejorar |
|---|---|---|
| **LCP** (Largest Contentful Paint) | Cuándo aparece el contenido principal | SSR/SSG, imágenes optimizadas y con `priority`/`fetchpriority`, menos JS bloqueante. |
| **INP** (Interaction to Next Paint) | Respuesta a interacciones | Dividir tareas largas, transiciones, menos trabajo en manejadores. |
| **CLS** (Cumulative Layout Shift) | Saltos de diseño | Reservar tamaño de imágenes/anuncios, fuentes sin salto, esqueletos con la medida final. |

## Fugas de memoria: limpia lo que abres

Efectos sin limpieza son la causa típica: **intervalos, listeners, suscripciones, observers, sockets**. Revisa también cachés que crecen sin límite y referencias a nodos DOM en variables globales.

## Checklist de optimización

1. ¿Está **medido** el problema (Profiler/Lighthouse)?
2. ¿Hay renders por **estado demasiado alto** o contexto demasiado amplio?
3. ¿Listas largas **virtualizadas**/paginadas?
4. ¿Bundle dividido por **rutas** y librerías pesadas diferidas?
5. ¿Imágenes con tamaños correctos, formatos modernos y `loading="lazy"`?
6. ¿Efectos con limpieza y dependencias correctas?
7. ¿Trabajo pesado movido a servidor/worker o en transición?

:::exercise Calcula la ventana visible
Completa la virtualización: calcula `inicio` y `fin` a partir de `scrollTop` para renderizar **solo las filas visibles** (con 2 filas de margen). Hay 5 000 filas de 40 px y una vista de 200 px. Al hacer scroll, deben aparecer las filas correspondientes.

```hint
`inicio = Math.max(0, Math.floor(scrollTop / ALTO) - 2)` y `fin = Math.min(TOTAL, Math.ceil((scrollTop + VISTA) / ALTO) + 2)`.
```

```starter
const TOTAL = 5000, ALTO = 40, VISTA = 200;

function App() {
  const [scrollTop, setScrollTop] = useState(0);

  const inicio = 0;      // ← calcula
  const fin = TOTAL;     // ← calcula (¡ahora renderiza las 5000!)

  const filas = [];
  for (let i = inicio; i < fin; i++) {
    filas.push(<div className="fila" key={i} style={{ position: 'absolute', top: i * ALTO, height: ALTO }}>Fila {i + 1}</div>);
  }

  return (
    <div id="vista" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} style={{ height: VISTA, overflow: 'auto', position: 'relative' }}>
      <div style={{ height: TOTAL * ALTO, position: 'relative' }}>{filas}</div>
    </div>
  );
}
```

```solution
const TOTAL = 5000, ALTO = 40, VISTA = 200;

function App() {
  const [scrollTop, setScrollTop] = useState(0);

  const inicio = Math.max(0, Math.floor(scrollTop / ALTO) - 2);
  const fin = Math.min(TOTAL, Math.ceil((scrollTop + VISTA) / ALTO) + 2);

  const filas = [];
  for (let i = inicio; i < fin; i++) {
    filas.push(<div className="fila" key={i} style={{ position: 'absolute', top: i * ALTO, height: ALTO }}>Fila {i + 1}</div>);
  }

  return (
    <div id="vista" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} style={{ height: VISTA, overflow: 'auto', position: 'relative' }}>
      <div style={{ height: TOTAL * ALTO, position: 'relative' }}>{filas}</div>
    </div>
  );
}
```

```checks
await check('Solo se renderizan unas pocas filas (menos de 20)', () => $$('.fila').length > 0 && $$('.fila').length < 20);
await check('La primera fila visible es "Fila 1"', () => $$('.fila')[0].textContent === 'Fila 1');
const v = $('#vista');
v.scrollTop = 4000;
v.dispatchEvent(new win.Event('scroll'));
await wait(120);
await check('Tras hacer scroll a 4000px aparece "Fila 101" (4000/40 + 1)', () => $$('.fila').some(f => f.textContent === 'Fila 101'));
await check('Y la "Fila 1" ya no está en el DOM', () => !$$('.fila').some(f => f.textContent === 'Fila 1'));
await check('Se siguen renderizando pocas filas (menos de 20)', () => $$('.fila').length < 20);
```
:::

:::quiz
? ¿Qué hace React cuando en la misma posición cambia el tipo de elemento (`<div>` → `<span>`)?
+ Destruye el subárbol anterior (y su estado) y monta uno nuevo
- Reutiliza el estado
- Lanza un error
- Lo ignora
> Elementos de distinto tipo producen árboles distintos.

? ¿Qué beneficio aporta Fiber?
+ Permite dividir, pausar, priorizar y reanudar el trabajo de renderizado
- Hace que React use varios hilos
- Elimina el DOM
- Sustituye al navegador
> Es la base de la concurrencia.

? ¿Qué es la virtualización de listas?
+ Renderizar en el DOM solo las filas visibles (más un margen) y simular el resto
- Cargar la lista desde el servidor
- Comprimir los datos
- Ordenar la lista
> Reduce drásticamente los nodos DOM.

? ¿Qué debes hacer antes de optimizar?
+ Medir con el Profiler/Lighthouse para localizar el cuello de botella real
- Memoizar todo
- Reescribir en clases
- Quitar los estados
> La intuición suele fallar; los datos no.
:::

:::summary
- Reconciliación: mismo tipo+posición → reutiliza; distinto → remonta. Las `key` dan identidad.
- Fiber permite render interrumpible: base de transiciones y Suspense.
- Mide (Profiler, Lighthouse); virtualiza listas largas; divide el bundle; limpia efectos; vigila LCP/INP/CLS.
:::
