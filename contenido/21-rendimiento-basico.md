---
id: rendimiento-basico
nivel: 2
titulo: Rendimiento: memo, useMemo y useCallback
icono: 🏎️
tiempo: 40 min
resumen: Cuándo y cómo evitar renders y cálculos innecesarios, sin optimizar a ciegas.
---

:::goal
Entender **por qué** se renderiza un componente, usar `React.memo`, `useMemo` y `useCallback` con criterio y conocer técnicas de composición que evitan renders sin memoizar.
:::

:::warn Primero: no optimices prematuramente
React es rápido por defecto. **Mide antes de optimizar** (React DevTools Profiler). Memoizar todo añade complejidad y a veces cuesta más de lo que ahorra. Además, el **React Compiler** (lección avanzada) memoiza automáticamente en muchos casos.
:::

## ¿Cuándo se renderiza un componente?

Un componente se vuelve a renderizar cuando:

1. Cambia **su estado**.
2. Su **padre** se renderiza (aunque sus props sean idénticas).
3. Cambia un **contexto** que consume.

El punto 2 es el que genera renders "de más". Obsérvalo con contadores:

```jsx run title="El hijo se renderiza cada vez que el padre cambia"
function Hijo({ nombre }) {
  const renders = useRef(0);
  renders.current++;
  return <p>👶 {nombre} — renders: <strong>{renders.current}</strong></p>;
}

function App() {
  const [n, setN] = useState(0);
  return (
    <div className="card col">
      <button onClick={() => setN(n + 1)}>Cambiar estado del padre ({n})</button>
      <Hijo nombre="Hijo normal" />
    </div>
  );
}
```

## `React.memo`

Envuelve un componente para que **se salte el render si sus props no cambiaron** (comparación superficial, `Object.is` por prop):

```jsx run
const Hijo = memo(function Hijo({ nombre }) {
  const renders = useRef(0);
  renders.current++;
  return <p>👶 {nombre} — renders: <strong>{renders.current}</strong></p>;
});

function App() {
  const [n, setN] = useState(0);
  return (
    <div className="card col">
      <button onClick={() => setN(n + 1)}>Cambiar estado del padre ({n})</button>
      <Hijo nombre="Hijo con memo" />
    </div>
  );
}
```

El contador del hijo ya no sube. ¡Pero cuidado con las props que **no son primitivas**!

## El problema de las referencias nuevas

Un objeto, array o función creados dentro del componente son **nuevos en cada render** (`{} !== {}`), así que `memo` ve "props distintas" y no sirve de nada:

```jsx run title="memo sin efecto: la función cambia en cada render"
const Boton = memo(function Boton({ onClick, texto }) {
  const renders = useRef(0);
  renders.current++;
  return <button onClick={onClick}>{texto} (renders: {renders.current})</button>;
});

function App() {
  const [n, setN] = useState(0);
  const guardar = () => console.log('guardado');        // función NUEVA en cada render
  return (
    <div className="card col">
      <button onClick={() => setN(n + 1)}>Contador del padre: {n}</button>
      <Boton onClick={guardar} texto="Guardar" />
    </div>
  );
}
```

## `useCallback`: funciones estables

`useCallback(fn, deps)` devuelve **la misma función** mientras las dependencias no cambien:

```jsx run
const Boton = memo(function Boton({ onClick, texto }) {
  const renders = useRef(0);
  renders.current++;
  return <button onClick={onClick}>{texto} (renders: {renders.current})</button>;
});

function App() {
  const [n, setN] = useState(0);
  const guardar = useCallback(() => console.log('guardado'), []);   // referencia estable
  return (
    <div className="card col">
      <button onClick={() => setN(n + 1)}>Contador del padre: {n}</button>
      <Boton onClick={guardar} texto="Guardar" />
    </div>
  );
}
```

Ahora `Boton` no se re-renderiza cuando cambia `n`. **`useCallback` solo tiene sentido junto con `memo`** (o cuando la función es dependencia de un `useEffect`/otro hook).

## `useMemo`: cachear cálculos (o referencias)

`useMemo(() => cálculo, deps)` guarda el **resultado** y solo lo recalcula si cambian las dependencias.

```jsx run title="Cálculo costoso: escribe en el campo de abajo y observa el tiempo"
function esPrimo(n) {
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return n > 1;
}
function contarPrimos(hasta) {          // trabajo pesado simulado
  let c = 0;
  for (let i = 2; i < hasta; i++) if (esPrimo(i)) c++;
  return c;
}

function App() {
  const [limite, setLimite] = useState(300000);
  const [nota, setNota] = useState('');

  const inicio = performance.now();
  const primos = useMemo(() => contarPrimos(limite), [limite]);   // solo se recalcula si cambia `limite`
  const ms = (performance.now() - inicio).toFixed(1);

  return (
    <div className="card col">
      <p>Primos hasta {limite}: <strong>{primos}</strong> <small className="muted">(este render tardó {ms} ms)</small></p>
      <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Escribe una nota (no recalcula)" />
      <button onClick={() => setLimite(limite + 100000)}>Subir límite</button>
    </div>
  );
}
```

Al escribir en la nota, el render es instantáneo (usa la caché). Quita `useMemo` y notarás el retraso al teclear.

Otro uso: **estabilizar un objeto o array** que pasas como prop o dependencia:

```jsx
const opciones = useMemo(() => ({ orden, filtro }), [orden, filtro]);
<TablaMemo opciones={opciones} />
```

### ¿Cuándo SÍ usar estas herramientas?

| Herramienta | Úsala cuando… |
|---|---|
| `memo` | Un componente es costoso de renderizar **y** recibe con frecuencia las mismas props. |
| `useCallback` | La función se pasa a un hijo con `memo` o es dependencia de un efecto. |
| `useMemo` | El cálculo es realmente caro (miles de elementos) o necesitas una referencia estable. |

:::danger Errores frecuentes
- Memoizar **todo** "por si acaso".
- `useMemo` con dependencias incompletas → valores obsoletos.
- Usar `memo` y pasar `children` o props objeto creadas inline (se rompe la memoización).
- Creer que `useMemo` es una garantía semántica: React puede descartar la caché.
:::

## Técnicas sin memoizar (muchas veces mejores)

### 1. Mover el estado hacia abajo

Si solo una parte del árbol usa un estado que cambia mucho, **encapsúlalo en un componente propio**; el resto no se renderiza.

```jsx run title="Estado en un componente aislado"
function RelojLento() {
  const [n, setN] = useState(0);              // el estado vive aquí, no en App
  return <button onClick={() => setN(n + 1)}>Clics: {n}</button>;
}

function ParteCara() {
  const renders = useRef(0);
  renders.current++;
  return <p>Parte "costosa" renderizada {renders.current} vez/veces</p>;
}

function App() {
  return (
    <div className="card col">
      <RelojLento />
      <ParteCara />
    </div>
  );
}
```

### 2. Elevar el contenido con `children`

Un componente que recibe `children` ya creados **no vuelve a crearlos** cuando su propio estado cambia:

```jsx
function PanelConEstado({ children }) {
  const [x, setX] = useState(0);        // cambia a menudo
  return <div onMouseMove={(e) => setX(e.clientX)}>{children}</div>;   // children no se re-renderizan
}
```

### 3. Otras ideas

- **Virtualización** de listas enormes (`react-window`, `@tanstack/react-virtual`): solo se pintan las filas visibles.
- **`useDeferredValue` / `useTransition`** para mantener la UI fluida con cálculos pesados (lección de concurrencia).
- **Code splitting** con `lazy` y `Suspense`: carga el código bajo demanda.
- Keys estables y evitar crear componentes dentro de componentes.

## Medir con el Profiler

En React DevTools → pestaña **Profiler** → graba una interacción: verás qué componentes se renderizaron, cuánto tardaron y **por qué** ("Props changed", "Hooks changed"...). Esa información manda sobre cualquier intuición.

:::exercise Evita renders innecesarios
La lista usa un componente `Fila` por cada elemento. Cada `Fila` muestra su número de renders en `<span className="r">`. Ahora, al pulsar **Incrementar contador** (que no tiene que ver con la lista) **todas las filas se re-renderizan**. Arregla el código para que **no** se re-rendericen:

1. Envuelve `Fila` con `memo`.
2. Estabiliza `eliminar` con `useCallback` (usa la forma funcional `setItems(prev => ...)`).

```hint
`const Fila = memo(function Fila(...) {...})` y `const eliminar = useCallback((id) => setItems(prev => prev.filter(i => i.id !== id)), [])`.
```

```starter
function Fila({ item, onEliminar }) {
  const renders = useRef(0);
  renders.current++;
  return (
    <li>
      {item.nombre} <span className="r">{renders.current}</span>{' '}
      <button onClick={() => onEliminar(item.id)}>x</button>
    </li>
  );
}

function App() {
  const [items, setItems] = useState([{ id: 1, nombre: 'A' }, { id: 2, nombre: 'B' }, { id: 3, nombre: 'C' }]);
  const [contador, setContador] = useState(0);

  const eliminar = (id) => setItems(items.filter((i) => i.id !== id));

  return (
    <div className="card col">
      <button onClick={() => setContador(contador + 1)}>Incrementar contador ({contador})</button>
      <ul>{items.map((i) => <Fila key={i.id} item={i} onEliminar={eliminar} />)}</ul>
    </div>
  );
}
```

```solution
const Fila = memo(function Fila({ item, onEliminar }) {
  const renders = useRef(0);
  renders.current++;
  return (
    <li>
      {item.nombre} <span className="r">{renders.current}</span>{' '}
      <button onClick={() => onEliminar(item.id)}>x</button>
    </li>
  );
});

function App() {
  const [items, setItems] = useState([{ id: 1, nombre: 'A' }, { id: 2, nombre: 'B' }, { id: 3, nombre: 'C' }]);
  const [contador, setContador] = useState(0);

  const eliminar = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  return (
    <div className="card col">
      <button onClick={() => setContador(contador + 1)}>Incrementar contador ({contador})</button>
      <ul>{items.map((i) => <Fila key={i.id} item={i} onEliminar={eliminar} />)}</ul>
    </div>
  );
}
```

```checks
await click(btn('Incrementar')); await click(btn('Incrementar'));
await check('Tras 2 incrementos, cada fila sigue con 1 solo render', () => $$('.r').length === 3 && $$('.r').every(e => e.textContent === '1'));
await click($$('li button')[0]);
await check('Eliminar la primera fila deja 2 filas', () => $$('li').length === 2);
await check('Las filas restantes no se volvieron a renderizar', () => $$('.r').every(e => e.textContent === '1'));
```
:::

:::quiz
? ¿Qué compara `React.memo` para decidir si re-renderiza?
- El estado interno
+ Las props, de forma superficial (`Object.is` por cada prop)
- El árbol DOM completo
- El contexto
> Si todas las props son iguales referencialmente, se salta el render.

? ¿Para qué sirve `useCallback`?
+ Para mantener una función con la misma referencia entre renders mientras no cambien sus dependencias
- Para ejecutar una función en el montaje
- Para cachear el resultado de un cálculo
- Para llamar a una API
> Es útil junto con `memo` o en dependencias de efectos.

? ¿Cuál es la primera estrategia recomendada antes de memoizar?
- Usar `useMemo` en todas partes
+ Medir con el Profiler y, si hace falta, mover el estado hacia abajo o usar composición
- Eliminar los componentes
- Usar clases
> Muchos problemas se resuelven reestructurando.

? ¿Por qué `memo` no funciona si pasas `onClick={() => ...}` inline?
+ Porque cada render crea una función nueva y las props "cambian" por referencia
- Porque `memo` ignora funciones
- Porque inline está prohibido
- Porque es lento
> Estabilízala con `useCallback` o evita pasar la función.
:::

:::summary
- Render por: estado, padre, contexto. Mide antes de optimizar.
- `memo` + props estables (`useCallback`/`useMemo`) evitan renders; `useMemo` cachea cálculos caros.
- Antes de memoizar: baja el estado, usa `children`, virtualiza, carga bajo demanda.
:::
