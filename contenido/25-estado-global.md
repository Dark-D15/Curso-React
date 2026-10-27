---
id: estado-global
nivel: 3
titulo: Estado global: Redux Toolkit, Zustand y stores
icono: 🗄️
tiempo: 40 min
resumen: Cuándo necesitas un store, tipos de estado, cómo funcionan por dentro (useSyncExternalStore) y las librerías de referencia.
---

:::goal
Decidir **qué tipo de estado** tienes y con qué herramienta gestionarlo; entender cómo funciona un *store externo* (`useSyncExternalStore`) y conocer **Redux Toolkit**, **Zustand** y **Jotai**.
:::

## Hay cuatro tipos de estado

La mayoría de los problemas de "estado global" vienen de mezclar tipos de estado. Clasifica primero:

| Tipo | Ejemplos | Herramienta recomendada |
|---|---|---|
| **UI local** | Menú abierto, valor del input | `useState` / `useReducer` |
| **Estado del servidor** | Usuarios, productos, pedidos | **TanStack Query**, SWR, loaders |
| **Estado de la URL** | Filtros, página, pestaña | Router (`useSearchParams`) |
| **Estado global del cliente** | Sesión, carrito, preferencias, notificaciones | Contexto, **Zustand**, **Redux Toolkit**, Jotai |

:::tip
Una vez separado el estado del servidor (caché) y el de la URL, el "estado global" que queda suele ser **pequeño**. Quizás con Context o un store ligero basta.
:::

## ¿Cómo funciona un store externo?

Un store es un objeto **fuera de React** con tres cosas: un estado, una forma de **leerlo** y de **suscribirse** a cambios. React ofrece `useSyncExternalStore(subscribe, getSnapshot)` para conectarlo de forma segura (también con renderizado concurrente y SSR). Así funcionan por dentro Zustand, Redux, Jotai...

```jsx run title="Un mini-Zustand en 20 líneas"
function crearStore(inicial) {
  let estado = inicial;
  const oyentes = new Set();
  return {
    get: () => estado,
    set: (parcial) => {
      estado = { ...estado, ...(typeof parcial === 'function' ? parcial(estado) : parcial) };
      oyentes.forEach((l) => l());                      // avisa a los suscriptores
    },
    subscribe: (l) => { oyentes.add(l); return () => oyentes.delete(l); },
  };
}

const store = crearStore({ a: 0, b: 0 });

// Hook con SELECTOR: el componente solo se re-renderiza si cambia lo que selecciona
function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

function ContadorA() {
  const a = useStore((s) => s.a);
  const renders = useRef(0); renders.current++;
  return <button onClick={() => store.set((s) => ({ a: s.a + 1 }))}>A: {a} (renders: {renders.current})</button>;
}
function ContadorB() {
  const b = useStore((s) => s.b);
  const renders = useRef(0); renders.current++;
  return <button onClick={() => store.set((s) => ({ b: s.b + 1 }))}>B: {b} (renders: {renders.current})</button>;
}

function App() {
  return <div className="card row"><ContadorA /><ContadorB /></div>;
}
```

Pulsa **A** varias veces: `ContadorB` **no se re-renderiza**. Eso es lo que el Contexto no puede hacer (todos los consumidores se re-renderizan cuando cambia el `value`). Esta es la razón principal para usar un store con selectores.

:::info Estabilidad del snapshot
`getSnapshot` debe devolver el **mismo valor** (referencia) mientras el estado no cambie; por eso el selector devuelve valores primitivos. Si seleccionas un objeto nuevo en cada llamada obtendrás un bucle infinito.
:::

## Zustand: lo mínimo

La opción más simple y popular hoy para estado global del cliente. Sin Provider, sin *boilerplate*.

```bash
npm install zustand
```

```jsx title="store/carrito.js"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCarrito = create(
  persist(
    (set, get) => ({
      items: [],
      agregar: (producto) => set((s) => ({ items: [...s.items, producto] })),
      quitar: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      vaciar: () => set({ items: [] }),
      total: () => get().items.reduce((suma, i) => suma + i.precio, 0),
    }),
    { name: 'carrito' }          // persiste en localStorage
  )
);
```

```jsx title="Uso en componentes"
function BotonCarrito() {
  const cantidad = useCarrito((s) => s.items.length);        // selector: solo re-renderiza si cambia la cantidad
  return <button>🛒 {cantidad}</button>;
}

function Producto({ p }) {
  const agregar = useCarrito((s) => s.agregar);
  return <button onClick={() => agregar(p)}>Añadir {p.nombre}</button>;
}
```

## Redux Toolkit (RTK)

El estándar en grandes aplicaciones: flujo predecible, **DevTools** con viaje en el tiempo, ecosistema y convenciones claras. **Redux Toolkit** elimina el boilerplate del Redux clásico y trae Immer (puedes "mutar" dentro de los reducers).

```bash
npm install @reduxjs/toolkit react-redux
```

```jsx title="store.js"
import { configureStore, createSlice } from '@reduxjs/toolkit';

const carritoSlice = createSlice({
  name: 'carrito',
  initialState: { items: [] },
  reducers: {
    agregado(state, action) { state.items.push(action.payload); },           // Immer permite "mutar"
    quitado(state, action) { state.items = state.items.filter((i) => i.id !== action.payload); },
    vaciado(state) { state.items = []; },
  },
});

export const { agregado, quitado, vaciado } = carritoSlice.actions;

export const store = configureStore({ reducer: { carrito: carritoSlice.reducer } });
```

```jsx title="main.jsx"
import { Provider } from 'react-redux';
<Provider store={store}><App /></Provider>
```

```jsx title="Componentes"
import { useSelector, useDispatch } from 'react-redux';

function BotonCarrito() {
  const cantidad = useSelector((s) => s.carrito.items.length);
  return <button>🛒 {cantidad}</button>;
}

function Producto({ p }) {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(agregado(p))}>Añadir</button>;
}
```

### Datos asíncronos: `createAsyncThunk` y **RTK Query**

Redux Toolkit incluye **RTK Query** (caché de datos del servidor integrada, similar a TanStack Query) y `createAsyncThunk` para lógica asíncrona. Si ya usas Redux, RTK Query evita añadir otra librería.

## Jotai y atoms

Estado **atómico** (inspirado en Recoil): pequeñas piezas independientes que se combinan. Genial para estado "granular" con dependencias derivadas.

```jsx
import { atom, useAtom, useAtomValue } from 'jotai';

const textoAtom = atom('');
const longitudAtom = atom((get) => get(textoAtom).length);     // atom derivado

function Campo() { const [t, setT] = useAtom(textoAtom); return <input value={t} onChange={(e) => setT(e.target.value)} />; }
function Contador() { const n = useAtomValue(longitudAtom); return <small>{n} caracteres</small>; }
```

## ¿Cuál elegir?

| Necesidad | Opción |
|---|---|
| Poco estado compartido que cambia poco (tema, idioma, sesión) | **Context** |
| Estado global simple, sin ceremonias | **Zustand** |
| App grande, equipo grande, convenciones estrictas, DevTools potentes | **Redux Toolkit** |
| Estado granular y derivado | **Jotai** |
| Datos del servidor | **TanStack Query / RTK Query** (no un store global) |
| Máquinas de estados complejas (flujos con reglas) | **XState** |

## Reglas de oro

1. **No metas todo en el store global**: solo lo que de verdad comparten componentes lejanos.
2. **No copies datos del servidor** al store: déjalos en la caché de la librería de datos.
3. Usa **selectores** pequeños para limitar re-renders.
4. Mantén el estado **normalizado** (por `id`) y **serializable** cuando uses Redux.
5. Deriva en vez de guardar (igual que con `useState`).

:::exercise Implementa el hook con selector
Tienes un store ya creado. Completa `useStore(selector)` usando `useSyncExternalStore` para que cada contador solo se re-renderice cuando cambie **su** parte del estado.

```hint
`return useSyncExternalStore(store.subscribe, () => selector(store.get()));`
```

```starter
function crearStore(inicial) {
  let estado = inicial;
  const oyentes = new Set();
  return {
    get: () => estado,
    set: (fn) => { estado = { ...estado, ...fn(estado) }; oyentes.forEach((l) => l()); },
    subscribe: (l) => { oyentes.add(l); return () => oyentes.delete(l); },
  };
}
const store = crearStore({ a: 0, b: 0 });

function useStore(selector) {
  // completa aquí
  return 0;
}

function Contador({ campo }) {
  const valor = useStore((s) => s[campo]);
  const renders = useRef(0); renders.current++;
  return (
    <button onClick={() => store.set((s) => ({ [campo]: s[campo] + 1 }))}>
      {campo}: <span className={'v-' + campo}>{valor}</span> (renders: <span className={'r-' + campo}>{renders.current}</span>)
    </button>
  );
}

function App() {
  return <div className="card row"><Contador campo="a" /><Contador campo="b" /></div>;
}
```

```solution
function crearStore(inicial) {
  let estado = inicial;
  const oyentes = new Set();
  return {
    get: () => estado,
    set: (fn) => { estado = { ...estado, ...fn(estado) }; oyentes.forEach((l) => l()); },
    subscribe: (l) => { oyentes.add(l); return () => oyentes.delete(l); },
  };
}
const store = crearStore({ a: 0, b: 0 });

function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

function Contador({ campo }) {
  const valor = useStore((s) => s[campo]);
  const renders = useRef(0); renders.current++;
  return (
    <button onClick={() => store.set((s) => ({ [campo]: s[campo] + 1 }))}>
      {campo}: <span className={'v-' + campo}>{valor}</span> (renders: <span className={'r-' + campo}>{renders.current}</span>)
    </button>
  );
}

function App() {
  return <div className="card row"><Contador campo="a" /><Contador campo="b" /></div>;
}
```

```checks
await click($$('button')[0]); await click($$('button')[0]);
await check('El contador A sube a 2', () => text('.v-a') === '2');
await check('El contador B sigue en 0', () => text('.v-b') === '0');
await check('B NO se re-renderizó (sigue en 1 render)', () => text('.r-b') === '1');
await check('A se renderizó 3 veces (inicial + 2 cambios)', () => text('.r-a') === '3');
```
:::

:::quiz
? ¿Para qué tipo de estado NO es buena idea usar Redux/Zustand como primera opción?
- Preferencias del usuario
- Carrito de compra
+ Datos del servidor que se pueden cachear (mejor TanStack Query)
- Estado de sesión
> El estado del servidor tiene necesidades propias: caché, revalidación, reintentos.

? ¿Qué ventaja tienen los stores con selectores frente a Context?
+ Un componente solo se re-renderiza cuando cambia la parte del estado que selecciona
- Son más antiguos
- No necesitan JavaScript
- Evitan usar hooks
> Context re-renderiza a todos los consumidores cuando cambia su `value`.

? ¿Qué hook de React permite conectar de forma segura un store externo?
- `useEffect`
- `useRef`
+ `useSyncExternalStore`
- `useContext`
> Es el que usan internamente las librerías de estado.

? ¿Qué aporta Immer en Redux Toolkit?
+ Permite escribir "mutaciones" en los reducers que se convierten en actualizaciones inmutables
- Hace peticiones HTTP
- Genera componentes
- Optimiza imágenes
> `state.items.push(x)` es seguro dentro de `createSlice`.
:::

:::summary
- Clasifica el estado: UI local, servidor, URL, global del cliente.
- `useSyncExternalStore` es la base de los stores; los selectores evitan re-renders.
- Zustand (simple), Redux Toolkit (grande/estricto), Jotai (atómico); datos remotos → TanStack Query/RTK Query.
:::
