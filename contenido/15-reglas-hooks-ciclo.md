---
id: reglas-hooks-ciclo
nivel: 2
titulo: Reglas de los hooks y cómo renderiza React
icono: 🔬
tiempo: 30 min
resumen: Por qué los hooks tienen reglas, las fases render/commit, el batching y el modo estricto. Mapa desde los componentes de clase.
---

:::goal
Entender **por qué** existen las reglas de los hooks y cómo funciona el ciclo *disparar → renderizar → confirmar (commit)*, para depurar con criterio.
:::

## Las dos reglas de los hooks

Un **hook** es una función cuyo nombre empieza por `use` (`useState`, `useEffect`, `useMemo`, o los tuyos). Se rigen por dos reglas:

1. **Llámalos solo en el nivel superior**: nunca dentro de `if`, bucles, funciones anidadas, `try/catch` ni después de un `return` anticipado.
2. **Llámalos solo desde componentes de función o desde otros hooks**, nunca desde funciones JavaScript normales ni clases.

```jsx
function Mal({ activo }) {
  if (activo) {
    const [x, setX] = useState(0);   // ❌ dentro de un if
  }
  for (const i of lista) { useEffect(() => {}); }  // ❌ en un bucle
}

function Bien({ activo }) {
  const [x, setX] = useState(0);     // ✅ siempre, en el mismo orden
  useEffect(() => { if (activo) { /* la condición va DENTRO */ } }, [activo]);
}
```

### ¿Por qué? Porque React identifica los hooks por su **orden**

React no sabe el "nombre" de tus variables de estado: guarda para cada componente una lista ordenada. En cada render, la primera llamada a `useState` recibe la primera casilla, la segunda recibe la segunda… Si el orden cambia entre renders (por un `if`), todo se desalinea.

```text
Render 1:  useState(0)  →  casilla 1     useState('')  →  casilla 2
Render 2 (con un if que salta el primero):
           useState('') →  casilla 1 ❌ (¡recibe el valor del otro!)
```

Instala **`eslint-plugin-react-hooks`**: detecta ambas reglas y las dependencias de `useEffect`.

## Demostración: el error del hook condicional

```jsx run err title="Pulsa 'Entrar': verás el error de React" 
function Perfil({ logueado }) {
  const [nombre] = useState('Ana');           // hook 1: siempre se llama
  if (!logueado) return <p>Invitado</p>;      // ← return anticipado ANTES del hook 2
  const [n, setN] = useState(0);              // ❌ hook 2: a veces se llama, a veces no
  return <button onClick={() => setN(n + 1)}>{nombre}: visitas {n}</button>;
}

function App() {
  const [logueado, setLogueado] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setLogueado(!logueado)}>{logueado ? 'Salir' : 'Entrar'}</button>
      <Perfil logueado={logueado} />
    </div>
  );
}
```

La solución es mover los hooks **arriba**, antes de cualquier `return` condicional.

## Cómo renderiza React: 3 fases

```text
 1. DISPARAR              2. RENDERIZAR                 3. CONFIRMAR (commit)
 ───────────              ─────────────                 ──────────────────────
 • render inicial         • React llama a tus           • React aplica los cambios
 • setState                 componentes                   mínimos al DOM real
 • (props del padre)      • Calcula el nuevo árbol      • Ejecuta efectos
                          • Debe ser PURO               (useLayoutEffect → pinta → useEffect)
```

- **Renderizar** ≠ actualizar el DOM. "Renderizar" es *llamar a tu función* para saber qué debe mostrarse.
- Si el resultado es igual al anterior, React **no toca el DOM** aunque el componente se haya renderizado.
- Los **efectos** corren después del commit.

```jsx run title="Mide cuántas veces se renderiza"
function Hijo({ nombre }) {
  const renders = useRef(0);
  renders.current += 1;                   // (solo para demostración)
  return <p>{nombre}: renderizado {renders.current} veces</p>;
}

function App() {
  const [n, setN] = useState(0);
  return (
    <div className="card col">
      <button onClick={() => setN(n + 1)}>Re-render del padre ({n})</button>
      <Hijo nombre="Hijo" />
    </div>
  );
}
```

Cuando el padre se renderiza, **todos sus hijos se renderizan también** por defecto (aunque sus props no cambien). Es rápido casi siempre; la lección de rendimiento explica cuándo y cómo evitarlo.

## Batching: React agrupa las actualizaciones

Varias llamadas a `set…` dentro del mismo evento producen **un solo** re-render (desde React 18, también en promesas, timeouts y eventos nativos).

```jsx run
function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  console.log('render');                    // ¿cuántas veces al pulsar?

  function handle() {
    setA((x) => x + 1);
    setB((x) => x + 1);                      // ambos cambios → un único render
  }
  return <button onClick={handle}>a={a}, b={b}</button>;
}
```

Si necesitas forzar el volcado inmediato al DOM (muy raro), existe `flushSync` de `react-dom`.

## Del componente de clase a los hooks

Quizás encuentres código antiguo. Equivalencias aproximadas:

| Clase | Hooks |
|---|---|
| `this.state` / `setState` | `useState` / `useReducer` |
| `componentDidMount` | `useEffect(() => {…}, [])` |
| `componentDidUpdate` | `useEffect(() => {…}, [dep])` |
| `componentWillUnmount` | función de limpieza del efecto |
| `shouldComponentUpdate` / `PureComponent` | `React.memo` |
| `this.props` | props (argumento) |
| `contextType` | `useContext` |
| `getDerivedStateFromError` | *(aún requiere clase)* Error Boundary |

:::info Mentalidad
Los hooks no replican el ciclo de vida: describen **sincronización**. No traduzcas línea a línea; piensa en "qué debe estar sincronizado con qué".
:::

## Depurar: React DevTools

La extensión **React Developer Tools** añade dos pestañas: **Components** (árbol, props, estado y hooks en vivo) y **Profiler** (qué se renderizó y cuánto tardó). Imprescindible para entender renders innecesarios.

:::exercise Arregla el hook condicional
Este componente falla al pulsar **Entrar** porque llama a `useState` después de un `return` anticipado. Mueve el hook para que funcione y siga mostrando `Invitado` cuando no hay sesión.

```hint
Declara `const [n, setN] = useState(0);` junto al primer hook, antes de cualquier `if`/`return`.
```

```starter
function Perfil({ logueado }) {
  const [nombre] = useState('Ana');
  if (!logueado) return <p>Invitado</p>;
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{nombre}: visitas {n}</button>;
}

function App() {
  const [logueado, setLogueado] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setLogueado(!logueado)}>{logueado ? 'Salir' : 'Entrar'}</button>
      <Perfil logueado={logueado} />
    </div>
  );
}
```

```solution
function Perfil({ logueado }) {
  const [nombre] = useState('Ana');
  const [n, setN] = useState(0);
  if (!logueado) return <p>Invitado</p>;
  return <button onClick={() => setN(n + 1)}>{nombre}: visitas {n}</button>;
}

function App() {
  const [logueado, setLogueado] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setLogueado(!logueado)}>{logueado ? 'Salir' : 'Entrar'}</button>
      <Perfil logueado={logueado} />
    </div>
  );
}
```

```checks
await check('Al inicio se ve "Invitado"', () => text('p') === 'Invitado');
await click(btn('Entrar'));
await check('Tras entrar aparece el botón "Ana: visitas 0"', () => btn('Ana: visitas 0'));
await click(btn('visitas'));
await check('El contador funciona (visitas 1)', () => btn('Ana: visitas 1'));
```
:::

:::quiz
? ¿Por qué no se pueden llamar hooks dentro de un `if`?
- Por rendimiento
+ Porque React identifica cada hook por su orden de llamada, que debe ser idéntico en cada render
- Porque el compilador lo prohíbe
- Porque los `if` son lentos
> Si el orden cambia, el estado se asigna a hooks equivocados.

? ¿Qué ocurre cuando un componente padre se vuelve a renderizar?
+ Por defecto sus hijos también se renderizan, aunque sus props no cambien
- Solo se renderiza el padre
- Nunca se renderizan los hijos
- Se recarga la página
> `React.memo` puede evitarlo cuando es necesario.

? ¿Cuál es el orden correcto de las fases?
- Confirmar → Renderizar → Disparar
- Renderizar → Disparar → Confirmar
+ Disparar → Renderizar → Confirmar (commit)
- Disparar → Confirmar → Renderizar
> El trabajo de renderizado es puro y los efectos se ejecutan tras el commit.
:::

:::summary
- Hooks: solo en el nivel superior y desde componentes/hooks (orden estable).
- Ciclo: disparar → renderizar (puro) → commit (DOM + efectos).
- Los renders se agrupan (batching); un padre re-renderiza a sus hijos.
- Usa React DevTools y el plugin ESLint de hooks.
:::
