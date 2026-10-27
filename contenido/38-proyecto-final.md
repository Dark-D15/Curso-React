---
id: proyecto-final
nivel: 3
titulo: Proyecto final: gestor de tareas completo
icono: 🏁
tiempo: 60 min
resumen: Integra todo lo aprendido en una aplicación: reducer + contexto, hooks propios, persistencia, filtros, formularios accesibles y estadísticas.
---

:::goal
Construir **TareaFlow**, un gestor de tareas que reúne los conceptos del curso: componentes, props, estado con `useReducer`, contexto, hooks personalizados, efectos, listas con keys, formularios controlados, accesibilidad y datos derivados.
:::

## Qué vamos a construir

```text
┌────────────────────────────────────────────┐
│ TareaFlow                       3 pendientes│
│ [ Nueva tarea…                 ] [Añadir]   │
│ (Todas) (Pendientes) (Hechas)               │
│ ☐ Aprender hooks             [✎] [✕]        │
│ ☑ Terminar el curso          [✎] [✕]        │
│ [Limpiar completadas]                       │
└────────────────────────────────────────────┘
```

**Requisitos**: añadir, completar, editar, eliminar; filtrar; contador de pendientes; limpiar completadas; persistencia en `localStorage`; accesible con teclado.

## Arquitectura (en un solo archivo, como en un proyecto real separado en módulos)

| Pieza | Responsabilidad | Lección relacionada |
|---|---|---|
| `tareasReducer` | Toda la lógica de actualización | `useReducer` |
| `TareasProvider` + `useTareas` | Estado compartido sin *prop drilling* | Contexto |
| `useLocalStorage` | Persistencia reutilizable | Hooks personalizados |
| `FormularioTarea` | Entrada controlada y validación | Formularios |
| `ListaTareas` / `Tarea` | Listas con `key`, edición en línea | Listas, eventos |
| `Filtros` | Estado derivado, botones con `aria-pressed` | Estado, accesibilidad |

## Paso 1 · El reducer

La lógica vive en una **función pura**: fácil de leer y probar.

```jsx
let siguiente = 100;

function tareasReducer(tareas, accion) {
  switch (accion.type) {
    case 'agregar':
      return [...tareas, { id: siguiente++, texto: accion.texto, hecha: false }];
    case 'alternar':
      return tareas.map((t) => (t.id === accion.id ? { ...t, hecha: !t.hecha } : t));
    case 'editar':
      return tareas.map((t) => (t.id === accion.id ? { ...t, texto: accion.texto } : t));
    case 'eliminar':
      return tareas.filter((t) => t.id !== accion.id);
    case 'limpiar_hechas':
      return tareas.filter((t) => !t.hecha);
    default:
      throw new Error('Acción desconocida: ' + accion.type);
  }
}
```

## Paso 2 · Persistencia con un hook propio y contexto

```jsx
function useLocalStorage(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try { const g = localStorage.getItem(clave); return g ? JSON.parse(g) : inicial; }
    catch { return inicial; }
  });
  useEffect(() => { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {} }, [clave, valor]);
  return [valor, setValor];
}
```

Para combinarlo con `useReducer`, guardamos el estado del reducer en `localStorage` mediante un efecto, e inicializamos de forma perezosa:

```jsx
const TareasContext = createContext(null);

function TareasProvider({ children }) {
  const [tareas, dispatch] = useReducer(tareasReducer, null, () => {
    try { return JSON.parse(localStorage.getItem('tareaflow')) ?? SEMILLA; } catch { return SEMILLA; }
  });
  useEffect(() => { try { localStorage.setItem('tareaflow', JSON.stringify(tareas)); } catch {} }, [tareas]);

  const valor = useMemo(() => ({ tareas, dispatch }), [tareas]);
  return <TareasContext.Provider value={valor}>{children}</TareasContext.Provider>;
}

function useTareas() {
  const ctx = useContext(TareasContext);
  if (!ctx) throw new Error('useTareas debe usarse dentro de <TareasProvider>');
  return ctx;
}
```

## Paso 3 · Componentes y todo junto

Este es el proyecto completo y **editable**. Léelo de arriba abajo, cambia cosas y rómpelo a propósito: es la mejor forma de aprender.

```jsx run title="TareaFlow.jsx" h=460
const SEMILLA = [
  { id: 1, texto: 'Aprender JSX y componentes', hecha: true },
  { id: 2, texto: 'Dominar useState y useEffect', hecha: true },
  { id: 3, texto: 'Construir mi proyecto final', hecha: false },
];
let siguiente = 100;

function tareasReducer(tareas, accion) {
  switch (accion.type) {
    case 'agregar': return [...tareas, { id: siguiente++, texto: accion.texto, hecha: false }];
    case 'alternar': return tareas.map((t) => (t.id === accion.id ? { ...t, hecha: !t.hecha } : t));
    case 'editar': return tareas.map((t) => (t.id === accion.id ? { ...t, texto: accion.texto } : t));
    case 'eliminar': return tareas.filter((t) => t.id !== accion.id);
    case 'limpiar_hechas': return tareas.filter((t) => !t.hecha);
    default: throw new Error('Acción desconocida: ' + accion.type);
  }
}

const TareasContext = createContext(null);

function TareasProvider({ children }) {
  const [tareas, dispatch] = useReducer(tareasReducer, null, () => {
    try { return JSON.parse(localStorage.getItem('tareaflow-demo')) ?? SEMILLA; } catch { return SEMILLA; }
  });
  useEffect(() => { try { localStorage.setItem('tareaflow-demo', JSON.stringify(tareas)); } catch {} }, [tareas]);
  const valor = useMemo(() => ({ tareas, dispatch }), [tareas]);
  return <TareasContext.Provider value={valor}>{children}</TareasContext.Provider>;
}

function useTareas() {
  const ctx = useContext(TareasContext);
  if (!ctx) throw new Error('useTareas debe usarse dentro de <TareasProvider>');
  return ctx;
}

function FormularioTarea() {
  const { dispatch } = useTareas();
  const [texto, setTexto] = useState('');
  const id = useId();

  function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    dispatch({ type: 'agregar', texto: texto.trim() });
    setTexto('');
  }
  return (
    <form className="row" onSubmit={enviar}>
      <label htmlFor={id} style={{ position: 'absolute', left: -9999 }}>Nueva tarea</label>
      <input id={id} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nueva tarea…" style={{ flex: 1 }} />
      <button disabled={!texto.trim()}>Añadir</button>
    </form>
  );
}

function Tarea({ tarea }) {
  const { dispatch } = useTareas();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(tarea.texto);

  function guardar() {
    if (borrador.trim()) dispatch({ type: 'editar', id: tarea.id, texto: borrador.trim() });
    setEditando(false);
  }

  return (
    <li className="row" style={{ padding: '4px 0' }}>
      <input type="checkbox" checked={tarea.hecha} onChange={() => dispatch({ type: 'alternar', id: tarea.id })} aria-label={'Completar: ' + tarea.texto} />
      {editando ? (
        <>
          <input autoFocus value={borrador} onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') { setBorrador(tarea.texto); setEditando(false); } }} />
          <button onClick={guardar}>Guardar</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, textDecoration: tarea.hecha ? 'line-through' : 'none', color: tarea.hecha ? '#94a3b8' : 'inherit' }}>{tarea.texto}</span>
          <button onClick={() => setEditando(true)} aria-label={'Editar: ' + tarea.texto}>✎</button>
          <button onClick={() => dispatch({ type: 'eliminar', id: tarea.id })} aria-label={'Eliminar: ' + tarea.texto}>✕</button>
        </>
      )}
    </li>
  );
}

function App() {
  return (
    <TareasProvider>
      <Tablero />
    </TareasProvider>
  );
}

function Tablero() {
  const { tareas, dispatch } = useTareas();
  const [filtro, setFiltro] = useState('todas');

  // Datos DERIVADOS: se calculan, no se guardan
  const pendientes = tareas.filter((t) => !t.hecha).length;
  const visibles = tareas.filter((t) => filtro === 'todas' || (filtro === 'hechas' ? t.hecha : !t.hecha));

  return (
    <main className="card col" style={{ maxWidth: 480 }}>
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>TareaFlow</h2>
        <span className="badge" role="status">{pendientes} pendiente{pendientes !== 1 && 's'}</span>
      </header>

      <FormularioTarea />

      <div className="row" role="group" aria-label="Filtrar tareas">
        {['todas', 'pendientes', 'hechas'].map((f) => (
          <button key={f} aria-pressed={filtro === f} onClick={() => setFiltro(f)}
            style={{ fontWeight: filtro === f ? 700 : 400, borderColor: filtro === f ? '#4f46e5' : undefined }}>{f}</button>
        ))}
      </div>

      {visibles.length === 0
        ? <p className="muted">No hay tareas en esta vista.</p>
        : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{visibles.map((t) => <Tarea key={t.id} tarea={t} />)}</ul>}

      <button onClick={() => dispatch({ type: 'limpiar_hechas' })} disabled={pendientes === tareas.length}>Limpiar completadas</button>
    </main>
  );
}
```

## Qué has aplicado

- ✅ **Componentes y props** (`Tarea`, `FormularioTarea`) y **composición** (`TareasProvider` envuelve la app).
- ✅ **useReducer** para la lógica y **Contexto** para compartirla sin *prop drilling*.
- ✅ **useEffect** para sincronizar con `localStorage`; inicialización perezosa.
- ✅ **Datos derivados** (`pendientes`, `visibles`) en lugar de estado duplicado.
- ✅ **Formularios controlados**, edición en línea con teclado (Enter/Esc).
- ✅ **Accesibilidad**: etiquetas, `aria-pressed`, `aria-label`, `role="status"`.
- ✅ **Listas con `key` estable**.

## Retos para mejorarlo

Elige los que quieras; cada uno practica algo distinto:

1. **Prioridad y fechas**: añade `prioridad` (baja/media/alta) y fecha límite; ordena por ellas (`useMemo`).
2. **Deshacer**: guarda un historial en el reducer (`pasado`, `presente`, `futuro`) y añade ⟲ y ⟳.
3. **Arrastrar y soltar** para reordenar (HTML5 DnD o `dnd-kit`).
4. **Búsqueda con `useDeferredValue`** para listas grandes.
5. **Sincronizar con una API** (con TanStack Query y actualizaciones optimistas).
6. **Rutas** con React Router: `/`, `/pendientes`, `/hechas` (filtro en la URL).
7. **Tema claro/oscuro** con contexto + `localStorage` + `prefers-color-scheme`.
8. **Pruebas** con Vitest + Testing Library: reducer y flujo completo.
9. **TypeScript**: tipa tareas, acciones y contexto (uniones discriminadas).
10. **Desplegar** en Vercel/Netlify y medir con Lighthouse.

## Ideas de proyectos propios

| Proyecto | Conceptos que practica |
|---|---|
| **Buscador de películas / recetas** (API pública) | `fetch`, loading/error, debounce, TanStack Query |
| **Carrito de compras** | Estado global, reducer, formularios, persistencia |
| **Dashboard con gráficos** | Datos derivados, memo, lazy loading, charts |
| **Chat en tiempo real** | Efectos, WebSocket, refs (scroll automático) |
| **Blog con Next.js** | Server Components, rutas dinámicas, metadatos |
| **Quiz / juego de memoria** | Estado complejo, temporizadores, accesibilidad |

:::exercise Añade "Limpiar completadas" y el contador
Este mini-tablero ya tiene añadir y completar. Completa el reducer con la acción `limpiar` (elimina las tareas hechas) y muestra en `<p id="pendientes">` el texto `N pendientes` calculado como **dato derivado**. El botón **Limpiar completadas** debe despachar `limpiar`.

```hint
En el reducer: `case 'limpiar': return tareas.filter(t => !t.hecha);`. Para el contador: `const pendientes = tareas.filter(t => !t.hecha).length;`.
```

```starter
let id = 10;
function reducer(tareas, a) {
  switch (a.type) {
    case 'agregar': return [...tareas, { id: id++, texto: a.texto, hecha: false }];
    case 'alternar': return tareas.map((t) => (t.id === a.id ? { ...t, hecha: !t.hecha } : t));
    // añade aquí la acción 'limpiar'
    default: return tareas;
  }
}

function App() {
  const [tareas, dispatch] = useReducer(reducer, [
    { id: 1, texto: 'Leer', hecha: true },
    { id: 2, texto: 'Escribir', hecha: false },
    { id: 3, texto: 'Practicar', hecha: false },
  ]);

  return (
    <div className="card col">
      <p id="pendientes">? pendientes</p>
      <ul>
        {tareas.map((t) => (
          <li key={t.id}>
            <label><input type="checkbox" checked={t.hecha} onChange={() => dispatch({ type: 'alternar', id: t.id })} /> {t.texto}</label>
          </li>
        ))}
      </ul>
      <button>Limpiar completadas</button>
    </div>
  );
}
```

```solution
let id = 10;
function reducer(tareas, a) {
  switch (a.type) {
    case 'agregar': return [...tareas, { id: id++, texto: a.texto, hecha: false }];
    case 'alternar': return tareas.map((t) => (t.id === a.id ? { ...t, hecha: !t.hecha } : t));
    case 'limpiar': return tareas.filter((t) => !t.hecha);
    default: return tareas;
  }
}

function App() {
  const [tareas, dispatch] = useReducer(reducer, [
    { id: 1, texto: 'Leer', hecha: true },
    { id: 2, texto: 'Escribir', hecha: false },
    { id: 3, texto: 'Practicar', hecha: false },
  ]);
  const pendientes = tareas.filter((t) => !t.hecha).length;

  return (
    <div className="card col">
      <p id="pendientes">{pendientes} pendientes</p>
      <ul>
        {tareas.map((t) => (
          <li key={t.id}>
            <label><input type="checkbox" checked={t.hecha} onChange={() => dispatch({ type: 'alternar', id: t.id })} /> {t.texto}</label>
          </li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: 'limpiar' })}>Limpiar completadas</button>
    </div>
  );
}
```

```checks
await check('Muestra "2 pendientes" al inicio', () => text('#pendientes') === '2 pendientes');
await click($$('input[type=checkbox]')[1]);
await check('Al completar "Escribir" queda "1 pendientes"', () => text('#pendientes') === '1 pendientes');
await click(btn('Limpiar completadas'));
await check('"Limpiar completadas" elimina las hechas (quedan 1 tarea)', () => $$('li').length === 1 && text('li') === 'Practicar');
await check('El contador sigue correcto: 1 pendientes', () => text('#pendientes') === '1 pendientes');
```
:::

:::quiz
? En el proyecto, ¿por qué `pendientes` y `visibles` NO se guardan en estado?
+ Porque son datos derivados que se calculan a partir de `tareas` y `filtro`, evitando desincronizaciones
- Porque React no permite más de un estado
- Porque son números
- Por rendimiento solamente
> Una sola fuente de la verdad.

? ¿Qué ventaja ofrece combinar `useReducer` con Contexto?
+ Lógica centralizada y accesible desde cualquier componente sin pasar props por todos los niveles
- Que no hace falta usar `key`
- Que evita el re-render siempre
- Que funciona sin React
> Es un "mini-Redux" para una parte de la aplicación.

? ¿Qué rol cumple `useMemo` al crear el `value` del Provider?
+ Mantiene la referencia estable mientras `tareas` no cambie, evitando renders innecesarios de los consumidores
- Guarda el valor en `localStorage`
- Valida las tareas
- Crea el contexto
> Un objeto nuevo en cada render provocaría re-renders de todos los consumidores.
:::

:::summary
- Un proyecto real combina: componentes pequeños, estado con reducer, contexto, hooks propios, efectos para persistir, formularios accesibles y datos derivados.
- Para seguir creciendo: **construye proyectos propios**, léelos con ojo crítico (Profiler, Lighthouse, accesibilidad) y publícalos.
:::
