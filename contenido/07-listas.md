---
id: listas
nivel: 1
titulo: Listas y keys
icono: 📋
tiempo: 30 min
resumen: Renderiza colecciones con map, entiende por qué las keys son obligatorias y cómo elegirlas bien.
---

:::goal
Renderizar arrays con `map`, filtrar y ordenar antes de pintar, y elegir **keys estables** para evitar bugs.
:::

## Renderizar un array con `map`

Un array de elementos JSX es un hijo válido. Con `map` transformas datos en elementos:

```jsx run
function App() {
  const frutas = ['🍎 Manzana', '🍌 Plátano', '🍇 Uva'];
  return (
    <ul>
      {frutas.map((fruta) => (
        <li key={fruta}>{fruta}</li>
      ))}
    </ul>
  );
}
```

## Listas de objetos y la prop `key`

Normalmente tendrás objetos con un `id`. Cada elemento de la lista necesita una **`key` única entre hermanos**:

```jsx run
function App() {
  const productos = [
    { id: 1, nombre: 'Teclado', precio: 90 },
    { id: 2, nombre: 'Ratón', precio: 40 },
    { id: 3, nombre: 'Monitor', precio: 320 },
  ];

  return (
    <table>
      <tbody>
        {productos.map((p) => (
          <tr key={p.id}>
            <td>{p.nombre}</td>
            <td>S/ {p.precio}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### ¿Para qué sirve `key`?

La `key` es la **identidad** de cada elemento. Cuando la lista cambia (se añade, elimina o reordena), React usa las keys para saber *qué elemento es cuál* y así conservar su estado y reutilizar el DOM correctamente.

:::danger Reglas de las keys
1. Deben ser **únicas entre hermanos** (no globales).
2. Deben ser **estables**: la misma para el mismo dato en cada render.
3. **No uses `Math.random()`** ni `Date.now()` al renderizar: cambiarían siempre y se recrearía todo.
4. **Evita el índice** como key si la lista puede reordenarse, insertarse o borrarse.
5. `key` no se pasa al componente como prop; si la necesitas dentro, envía otro `id`.
:::

Las keys ideales vienen de tus datos: el `id` de la base de datos, un UUID generado **al crear** el elemento, etc.

## Demostración: por qué el índice como key es peligroso

Escribe algo en una caja, luego pulsa **Añadir al inicio**. Con `key={index}` el texto "se queda" en la posición, no en el elemento. Cambia a `key={item.id}` y verás la diferencia.

```jsx run title="Prueba key={index} vs key={item.id}"
function App() {
  const [items, setItems] = useState([
    { id: 1, nombre: 'Ana' },
    { id: 2, nombre: 'Luis' },
  ]);
  const siguiente = useRef(3);

  function agregarAlInicio() {
    setItems([{ id: siguiente.current, nombre: 'Nuevo ' + siguiente.current }, ...items]);
    siguiente.current++;
  }

  return (
    <div className="col">
      <button onClick={agregarAlInicio}>Añadir al inicio</button>
      {items.map((item, index) => (
        <div key={index} className="row">   {/* ← cambia por key={item.id} */}
          <strong style={{ width: 80 }}>{item.nombre}</strong>
          <input placeholder="Escribe algo aquí…" />
        </div>
      ))}
    </div>
  );
}
```

:::tip Cuándo SÍ puedes usar el índice
Si la lista es **estática** (nunca cambia de orden ni se edita) y no tiene estado interno, `key={index}` es inofensivo.
:::

## Filtrar y ordenar antes de pintar

`filter` y `sort` (sobre una copia) se hacen **antes** del `map`. Calcularlo durante el render es lo correcto: no necesitas guardar la lista filtrada en estado.

```jsx run
function App() {
  const [soloStock, setSoloStock] = useState(false);
  const [asc, setAsc] = useState(true);
  const productos = [
    { id: 1, nombre: 'Teclado', precio: 90, stock: true },
    { id: 2, nombre: 'Ratón', precio: 40, stock: false },
    { id: 3, nombre: 'Monitor', precio: 320, stock: true },
    { id: 4, nombre: 'Cable', precio: 12, stock: true },
  ];

  const visibles = productos
    .filter((p) => !soloStock || p.stock)
    .sort((a, b) => (asc ? a.precio - b.precio : b.precio - a.precio));

  return (
    <div className="card col">
      <div className="row">
        <label><input type="checkbox" checked={soloStock} onChange={(e) => setSoloStock(e.target.checked)} /> Solo con stock</label>
        <button onClick={() => setAsc(!asc)}>Precio {asc ? '↑' : '↓'}</button>
      </div>
      <ul>
        {visibles.map((p) => <li key={p.id}>{p.nombre} — S/ {p.precio}</li>)}
      </ul>
      {visibles.length === 0 && <p className="muted">Sin resultados</p>}
    </div>
  );
}
```

(Aquí `sort` muta el array resultante de `filter`, que ya es una copia, por eso es seguro.)

## Extraer el elemento de la lista a un componente

Si cada fila es compleja, crea un componente. **La `key` va en el elemento que devuelves dentro de `map`**, no dentro del componente hijo:

```jsx run
function Producto({ nombre, precio }) {
  return (
    <li className="row">
      <strong>{nombre}</strong> <span className="muted">S/ {precio}</span>
    </li>
  );
}

function App() {
  const productos = [{ id: 1, nombre: 'Teclado', precio: 90 }, { id: 2, nombre: 'Ratón', precio: 40 }];
  return (
    <ul>
      {productos.map((p) => (
        <Producto key={p.id} nombre={p.nombre} precio={p.precio} />
      ))}
    </ul>
  );
}
```

## Fragmentos con key

Para devolver varios elementos por ítem necesitas la sintaxis larga del fragmento si requiere `key`:

```jsx
import { Fragment } from 'react';

{items.map((i) => (
  <Fragment key={i.id}>
    <dt>{i.termino}</dt>
    <dd>{i.definicion}</dd>
  </Fragment>
))}
```

:::exercise Lista de tareas pendientes
Muestra en un `<ul>` **solo las tareas no completadas** (`hecha === false`), ordenadas alfabéticamente por `titulo`. Cada `<li>` debe tener una `key` basada en `id` y mostrar solo el título.

```hint
`tareas.filter(t => !t.hecha)` y luego `.sort((a, b) => a.titulo.localeCompare(b.titulo))`.
```

```starter
function App() {
  const tareas = [
    { id: 1, titulo: 'Regar plantas', hecha: false },
    { id: 2, titulo: 'Comprar pan', hecha: true },
    { id: 3, titulo: 'Aprender React', hecha: false },
    { id: 4, titulo: 'Estudiar hooks', hecha: false },
  ];

  return (
    <ul>
      {/* tu código */}
    </ul>
  );
}
```

```solution
function App() {
  const tareas = [
    { id: 1, titulo: 'Regar plantas', hecha: false },
    { id: 2, titulo: 'Comprar pan', hecha: true },
    { id: 3, titulo: 'Aprender React', hecha: false },
    { id: 4, titulo: 'Estudiar hooks', hecha: false },
  ];

  const pendientes = tareas
    .filter((t) => !t.hecha)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  return (
    <ul>
      {pendientes.map((t) => <li key={t.id}>{t.titulo}</li>)}
    </ul>
  );
}
```

```checks
const lis = $$('li').map(l => l.textContent.trim());
await check('Se muestran 3 tareas (solo las pendientes)', () => lis.length === 3);
await check('No aparece la tarea completada', () => !lis.includes('Comprar pan'));
await check('Están ordenadas alfabéticamente', () => JSON.stringify(lis) === JSON.stringify(['Aprender React', 'Estudiar hooks', 'Regar plantas']));
await check('Sin advertencias de "key" en la consola', () => !logs().some(l => /key/i.test(l) && /unique|única/i.test(l)));
```
:::

:::quiz
? ¿Para qué sirve la prop `key` en una lista?
- Para dar estilos a cada elemento
+ Para que React identifique cada elemento entre renders y conserve su estado correctamente
- Para ordenar la lista
- Para evitar usar `map`
> La key es la identidad estable del elemento.

? ¿Cuál es la peor opción de `key` para una lista que se reordena?
- `item.id`
- Un UUID creado al crear el elemento
+ `Math.random()`
- Un código de producto único
> Cambia en cada render, así que React recrea todo (y se pierde el estado).

? ¿Dónde debe ir la `key` cuando mapeas a un componente?
+ En el elemento devuelto por `map`: `<Producto key={p.id} />`
- Dentro del JSX interno del componente `Producto`
- En el `<ul>` padre
- No es necesaria
> La key pertenece al elemento de la lista en el sitio donde haces `map`.

? ¿Está bien guardar en estado el array ya filtrado?
- Sí, siempre
+ Normalmente no: calcula el filtrado durante el render a partir del estado original
- Solo si es muy largo
- Es obligatorio
> Guardar datos derivados duplica la fuente de la verdad y genera desincronizaciones.
:::

:::summary
- `array.map(item => <Elemento key={item.id} />)`.
- Keys únicas entre hermanos, estables y no aleatorias; evita el índice si la lista cambia.
- `filter`/`sort` antes de `map`, sin guardar el resultado en estado.
:::
