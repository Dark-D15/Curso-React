---
id: use-reducer
nivel: 2
titulo: Estado complejo con useReducer
icono: 🎛️
tiempo: 30 min
resumen: Centraliza la lógica de actualización en una función pura (reducer) cuando el estado crece.
---

:::goal
Entender cuándo `useReducer` es mejor que `useState`, escribir **reducers puros** con acciones y combinarlo con otras piezas.
:::

## El problema

Cuando un componente tiene **muchos manejadores** que modifican el estado de formas parecidas, la lógica se dispersa. `useReducer` la concentra en **una función**: el *reducer*.

```text
 evento  →  dispatch(acción)  →  reducer(estadoActual, acción)  →  nuevoEstado  →  render
```

## Anatomía

```jsx
const [estado, dispatch] = useReducer(reducer, estadoInicial);

function reducer(estado, accion) {
  switch (accion.type) {
    case 'sumar': return { ...estado, n: estado.n + 1 };
    case 'restar': return { ...estado, n: estado.n - 1 };
    default: throw new Error('Acción desconocida: ' + accion.type);
  }
}
```

- **`reducer(estado, accion)`**: función **pura** que devuelve el **nuevo** estado. No muta, no hace peticiones, no usa `Date.now()`/`Math.random()`.
- **`accion`**: un objeto que describe **qué pasó**, no cómo cambiar (`{ type: 'agregar', producto }`).
- **`dispatch(accion)`**: envía la acción al reducer; programa un render.

```jsx run
function reducer(estado, accion) {
  switch (accion.type) {
    case 'sumar':    return { n: estado.n + accion.cantidad };
    case 'restar':   return { n: Math.max(0, estado.n - accion.cantidad) };
    case 'reiniciar': return { n: 0 };
    default: throw new Error('Acción desconocida: ' + accion.type);
  }
}

function App() {
  const [estado, dispatch] = useReducer(reducer, { n: 0 });
  return (
    <div className="card row">
      <button onClick={() => dispatch({ type: 'restar', cantidad: 1 })}>−1</button>
      <strong>{estado.n}</strong>
      <button onClick={() => dispatch({ type: 'sumar', cantidad: 1 })}>+1</button>
      <button onClick={() => dispatch({ type: 'sumar', cantidad: 10 })}>+10</button>
      <button onClick={() => dispatch({ type: 'reiniciar' })}>Reiniciar</button>
    </div>
  );
}
```

## Caso real: lista de tareas

Las operaciones (añadir, alternar, borrar, editar) quedan **en un solo sitio** y son fáciles de probar de forma aislada:

```jsx run
let siguienteId = 3;

function tareasReducer(tareas, accion) {
  switch (accion.type) {
    case 'agregada':
      return [...tareas, { id: siguienteId++, texto: accion.texto, hecha: false }];
    case 'alternada':
      return tareas.map((t) => (t.id === accion.id ? { ...t, hecha: !t.hecha } : t));
    case 'eliminada':
      return tareas.filter((t) => t.id !== accion.id);
    default:
      throw new Error('Acción desconocida: ' + accion.type);
  }
}

const iniciales = [{ id: 1, texto: 'Aprender useReducer', hecha: false }, { id: 2, texto: 'Beber agua', hecha: true }];

function App() {
  const [tareas, dispatch] = useReducer(tareasReducer, iniciales);
  const [texto, setTexto] = useState('');

  function agregar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    dispatch({ type: 'agregada', texto });
    setTexto('');
  }

  return (
    <div className="card col">
      <form className="row" onSubmit={agregar}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nueva tarea" />
        <button>Añadir</button>
      </form>
      <ul>
        {tareas.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.hecha} onChange={() => dispatch({ type: 'alternada', id: t.id })} />{' '}
              <span style={{ textDecoration: t.hecha ? 'line-through' : 'none' }}>{t.texto}</span>
            </label>{' '}
            <button onClick={() => dispatch({ type: 'eliminada', id: t.id })}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## `useState` vs `useReducer`

| | `useState` | `useReducer` |
|---|---|---|
| Código inicial | Menos | Algo más |
| Muchos manejadores que tocan lo mismo | Se dispersa la lógica | ✅ Centralizada |
| Estado con varios campos relacionados | Varios `useState` o objeto | ✅ Transiciones coherentes |
| Pruebas | Con el componente | ✅ El reducer se prueba solo (función pura) |
| Depuración | `console.log` | ✅ Registra cada acción fácilmente |
| Mejor para… | Valores simples independientes | Lógica compleja y transiciones con reglas |

:::tip Regla práctica
Empieza con `useState`. Cuando notes que varios manejadores repiten lógica o que hay estados que dependen entre sí, pasa a `useReducer`. Se puede migrar sin cambiar la UI.
:::

## Reglas de un buen reducer

1. **Puro**: mismo estado + misma acción = mismo resultado, sin efectos secundarios.
2. **Inmutable**: devuelve estado nuevo (spread, `map`, `filter`).
3. Las acciones describen **eventos del usuario** (`'tarea_agregada'`), no *setters* (`'set_texto'`).
4. Un `default` que lanza error ayuda a detectar acciones mal escritas.
5. Si una acción no cambia nada, devuelve el **mismo** `estado` (React evita el re-render).

## Inicialización perezosa

```jsx
const [estado, dispatch] = useReducer(reducer, argumento, (arg) => crearEstadoInicial(arg));
```

## Reducer + Contexto = estado global ligero

Es la combinación clásica para compartir estado en una rama del árbol sin librerías (la veremos en la lección de Contexto).

:::exercise Carrito con reducer
Completa el reducer del carrito. Acciones:

- `{ type: 'agregar', nombre, precio }`: añade un producto `{ nombre, precio }` al array.
- `{ type: 'quitar', indice }`: elimina el producto en esa posición.
- `{ type: 'vaciar' }`: deja el carrito vacío.

El componente ya muestra cuántos artículos hay y el total (`<p id="resumen">`).

```hint
`agregar`: `[...carrito, { nombre: accion.nombre, precio: accion.precio }]`. `quitar`: `carrito.filter((_, i) => i !== accion.indice)`.
```

```starter
function carritoReducer(carrito, accion) {
  switch (accion.type) {
    // tus casos aquí
    default:
      return carrito;
  }
}

function App() {
  const [carrito, dispatch] = useReducer(carritoReducer, []);
  const total = carrito.reduce((s, p) => s + p.precio, 0);

  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => dispatch({ type: 'agregar', nombre: 'Café', precio: 5 })}>+ Café</button>
        <button onClick={() => dispatch({ type: 'agregar', nombre: 'Pan', precio: 2 })}>+ Pan</button>
        <button onClick={() => dispatch({ type: 'vaciar' })}>Vaciar</button>
      </div>
      <ul>
        {carrito.map((p, i) => (
          <li key={i}>{p.nombre} (${p.precio}) <button onClick={() => dispatch({ type: 'quitar', indice: i })}>✕</button></li>
        ))}
      </ul>
      <p id="resumen">{carrito.length} artículos · Total ${total}</p>
    </div>
  );
}
```

```solution
function carritoReducer(carrito, accion) {
  switch (accion.type) {
    case 'agregar':
      return [...carrito, { nombre: accion.nombre, precio: accion.precio }];
    case 'quitar':
      return carrito.filter((_, i) => i !== accion.indice);
    case 'vaciar':
      return [];
    default:
      return carrito;
  }
}

function App() {
  const [carrito, dispatch] = useReducer(carritoReducer, []);
  const total = carrito.reduce((s, p) => s + p.precio, 0);

  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => dispatch({ type: 'agregar', nombre: 'Café', precio: 5 })}>+ Café</button>
        <button onClick={() => dispatch({ type: 'agregar', nombre: 'Pan', precio: 2 })}>+ Pan</button>
        <button onClick={() => dispatch({ type: 'vaciar' })}>Vaciar</button>
      </div>
      <ul>
        {carrito.map((p, i) => (
          <li key={i}>{p.nombre} (${p.precio}) <button onClick={() => dispatch({ type: 'quitar', indice: i })}>✕</button></li>
        ))}
      </ul>
      <p id="resumen">{carrito.length} artículos · Total ${total}</p>
    </div>
  );
}
```

```checks
await check('Empieza vacío', () => text('#resumen').startsWith('0 artículos'));
await click(btn('+ Café')); await click(btn('+ Pan')); await click(btn('+ Café'));
await check('Con 3 productos el total es $12', () => text('#resumen') === '3 artículos · Total $12');
await click($$('li button')[1]);
await check('Quitar el 2º producto deja 2 artículos y $10', () => text('#resumen') === '2 artículos · Total $10');
await click(btn('Vaciar'));
await check('Vaciar deja el carrito en 0', () => text('#resumen') === '0 artículos · Total $0');
```
:::

:::quiz
? ¿Qué debe ser un reducer?
- Una función asíncrona
+ Una función pura que recibe estado y acción y devuelve el nuevo estado
- Un componente
- Un efecto
> Sin efectos secundarios y sin mutar el estado.

? ¿Qué envías a `dispatch`?
- El nuevo estado
+ Una acción: un objeto que describe lo ocurrido
- Un componente
- Una promesa
> El reducer decide cómo cambia el estado según la acción.

? ¿Cuándo es preferible `useReducer`?
+ Cuando varios manejadores actualizan el mismo estado complejo con reglas relacionadas
- Siempre que haya un `useState`
- Cuando solo hay un booleano
- Cuando quieres peticiones HTTP
> Para estados simples `useState` es suficiente.
:::

:::summary
- `useReducer(reducer, inicial)` → `[estado, dispatch]`.
- Reducer puro e inmutable; acciones = eventos con significado.
- Centraliza la lógica y se prueba fácilmente; combínalo con Contexto para estado compartido.
:::
