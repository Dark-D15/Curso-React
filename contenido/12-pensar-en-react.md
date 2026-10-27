---
id: pensar-en-react
nivel: 1
titulo: Pensar en React y levantar el estado
icono: 🏗️
tiempo: 35 min
resumen: Un método de 5 pasos para diseñar una interfaz, decidir dónde vive el estado y compartirlo entre componentes.
---

:::goal
Aprender a **descomponer una UI en componentes**, identificar el **estado mínimo**, decidir **dónde debe vivir** y compartirlo con la técnica de *levantar el estado* (lifting state up).
:::

Saber la sintaxis no basta: lo difícil es **estructurar** bien una aplicación. Este es el método recomendado, aplicado a una **tabla de productos filtrable**.

## Paso 1: Divide la UI en una jerarquía de componentes

Dibuja cajas sobre el diseño. Cada caja suele ser un componente con **una única responsabilidad**:

```text
TablaProductosFiltrable      ← contenedor de todo
├── BarraBusqueda            ← input + checkbox
└── TablaProductos
    ├── FilaCategoria
    └── FilaProducto
```

## Paso 2: Construye una versión **estática**

Primero solo pinta datos que bajan por **props**, sin estado ni interactividad. Es mucho texto y poco pensar. Aquí aparece el flujo unidireccional de datos.

## Paso 3: Encuentra la representación **mínima** del estado

El estado debe ser lo mínimo imprescindible. Pregúntate por cada dato:

1. ¿Cambia con el tiempo? Si no → no es estado.
2. ¿Llega por props de un padre? → no es estado.
3. ¿Puedes **calcularlo** a partir de otro estado o props? → **no es estado** (es *dato derivado*).

En el ejemplo: la lista original, el texto de búsqueda y el checkbox. ¿La lista filtrada? **Derivada** → se calcula en el render.

:::danger No dupliques ni derives en estado
```jsx
const [productos, setProductos] = useState(lista);
const [filtrados, setFiltrados] = useState(lista);   // ❌ hay que mantenerlos sincronizados
```
Una sola fuente de verdad; lo demás, calculado durante el render.
:::

## Paso 4: ¿Dónde debe vivir el estado?

Para cada trozo de estado, busca el **ancestro común más cercano** de todos los componentes que lo necesitan; ahí va el `useState`. Los hijos lo reciben por props. A esto se le llama **levantar el estado**.

```text
          TablaProductosFiltrable  ← aquí vive { texto, soloStock }
              ↓ props         ↓ props
        BarraBusqueda     TablaProductos
              ↑ onCambio (funciones)
```

## Paso 5: Flujo inverso de datos

Los hijos no pueden modificar el estado del padre directamente; para **pedir un cambio** llaman a funciones recibidas por props (`onTextoChange`). Es el mismo patrón que viste en la lección de props.

## Ejemplo completo

Todo junto: estado en el padre, `BarraBusqueda` controlada y `TablaProductos` que **deriva** la lista filtrada.

```jsx run title="Tabla de productos filtrable"
const PRODUCTOS = [
  { id: 1, categoria: 'Frutas', precio: 1.5, stock: true, nombre: 'Manzana' },
  { id: 2, categoria: 'Frutas', precio: 2, stock: true, nombre: 'Fruta del dragón' },
  { id: 3, categoria: 'Frutas', precio: 3, stock: false, nombre: 'Maracuyá' },
  { id: 4, categoria: 'Verduras', precio: 2, stock: true, nombre: 'Espinaca' },
  { id: 5, categoria: 'Verduras', precio: 4, stock: false, nombre: 'Calabaza' },
  { id: 6, categoria: 'Verduras', precio: 1, stock: true, nombre: 'Guisantes' },
];

function BarraBusqueda({ texto, soloStock, onTextoChange, onStockChange }) {
  return (
    <form className="col">
      <input value={texto} onChange={(e) => onTextoChange(e.target.value)} placeholder="Buscar…" />
      <label>
        <input type="checkbox" checked={soloStock} onChange={(e) => onStockChange(e.target.checked)} /> Solo con stock
      </label>
    </form>
  );
}

function TablaProductos({ productos, texto, soloStock }) {
  // Dato DERIVADO: se calcula, no se guarda
  const visibles = productos.filter((p) =>
    p.nombre.toLowerCase().includes(texto.toLowerCase()) && (!soloStock || p.stock)
  );
  const categorias = [...new Set(visibles.map((p) => p.categoria))];

  return (
    <table style={{ width: '100%', marginTop: 8 }}>
      <thead><tr><th>Nombre</th><th>Precio</th></tr></thead>
      <tbody>
        {categorias.map((cat) => (
          <Fragment key={cat}>
            <tr><th colSpan="2">{cat}</th></tr>
            {visibles.filter((p) => p.categoria === cat).map((p) => (
              <tr key={p.id}>
                <td style={{ color: p.stock ? 'inherit' : 'crimson' }}>{p.nombre}</td>
                <td>${p.precio}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function App() {
  const [texto, setTexto] = useState('');          // estado levantado
  const [soloStock, setSoloStock] = useState(false);
  return (
    <div className="card">
      <BarraBusqueda texto={texto} soloStock={soloStock} onTextoChange={setTexto} onStockChange={setSoloStock} />
      <TablaProductos productos={PRODUCTOS} texto={texto} soloStock={soloStock} />
    </div>
  );
}
```

Observa que las categorías usan `<Fragment key={cat}>` (el fragmento corto `<>` no admite `key`) y que `visibles` se **calcula** en cada render: no hay un segundo estado con la lista filtrada.

## Levantar el estado: ejemplo mínimo

Dos componentes hermanos que deben mostrar **el mismo dato** → el estado sube a su padre.

```jsx run title="Dos vistas sincronizadas"
function Entrada({ valor, onCambio }) {
  return <input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder="Escribe…" />;
}

function Vista({ valor }) {
  return <p>Vista previa: <strong>{valor.toUpperCase()}</strong></p>;
}

function App() {
  const [valor, setValor] = useState('');       // vive en el ancestro común
  return (
    <div className="card col">
      <Entrada valor={valor} onCambio={setValor} />
      <Vista valor={valor} />
    </div>
  );
}
```

## Cuándo NO levantar más

Subir estado demasiado alto provoca *prop drilling* y renders innecesarios. Si dos componentes lejanos comparten datos, considera **Contexto** o un gestor de estado (próximas lecciones). Y recuerda el consejo inverso: **mantén el estado lo más cerca posible** de quien lo usa.

:::exercise Levanta el estado
`Buscador` y `Resultados` son hermanos pero no se comunican. Mueve el estado a `App`:

- `Buscador` recibe `texto` y `onTextoChange`, y es un input controlado.
- `Resultados` recibe `texto` y muestra en `<li>` solo las frutas cuyo nombre **incluye** el texto (sin distinguir mayúsculas).

```hint
En `App`: `const [texto, setTexto] = useState('')` y pasa `texto={texto}` a ambos y `onTextoChange={setTexto}` al buscador.
```

```starter
const FRUTAS = ['Manzana', 'Mango', 'Pera', 'Plátano', 'Mandarina'];

function Buscador() {
  return <input placeholder="Buscar fruta" />;
}

function Resultados() {
  return <ul>{FRUTAS.map((f) => <li key={f}>{f}</li>)}</ul>;
}

function App() {
  return (
    <div className="card col">
      <Buscador />
      <Resultados />
    </div>
  );
}
```

```solution
const FRUTAS = ['Manzana', 'Mango', 'Pera', 'Plátano', 'Mandarina'];

function Buscador({ texto, onTextoChange }) {
  return <input placeholder="Buscar fruta" value={texto} onChange={(e) => onTextoChange(e.target.value)} />;
}

function Resultados({ texto }) {
  const visibles = FRUTAS.filter((f) => f.toLowerCase().includes(texto.toLowerCase()));
  return <ul>{visibles.map((f) => <li key={f}>{f}</li>)}</ul>;
}

function App() {
  const [texto, setTexto] = useState('');
  return (
    <div className="card col">
      <Buscador texto={texto} onTextoChange={setTexto} />
      <Resultados texto={texto} />
    </div>
  );
}
```

```checks
await check('Al inicio se muestran las 5 frutas', () => $$('li').length === 5);
await type($('input'), 'ma');
await check('Con "ma" quedan Manzana, Mango y Mandarina', () => JSON.stringify($$('li').map(l => l.textContent)) === JSON.stringify(['Manzana', 'Mango', 'Mandarina']));
await type($('input'), 'PERA');
await check('El filtro no distingue mayúsculas ("PERA" → Pera)', () => $$('li').length === 1 && text('li') === 'Pera');
```
:::

:::quiz
? ¿Cuál de estos datos NO debería guardarse en estado?
- El texto que escribe el usuario
+ La lista filtrada que se calcula a partir de la lista original y el texto
- El producto seleccionado por el usuario
- Si un menú está abierto
> Los datos derivados se calculan durante el render.

? ¿Dónde debe vivir un estado que necesitan dos componentes hermanos?
- En cada hermano, sincronizado con `useEffect`
- En una variable global
+ En su ancestro común más cercano, pasándolo por props
- En el hijo más profundo
> Es la técnica de "levantar el estado".

? ¿Cómo "pide" un hijo un cambio en el estado del padre?
- Modificando la prop directamente
+ Llamando a una función que el padre le pasó por props
- Con `document.querySelector`
- No puede
> Es el flujo inverso de datos: eventos que suben mediante callbacks.
:::

:::summary
1. Divide la UI en componentes. 2. Versión estática con props. 3. Estado **mínimo**. 4. Ubícalo en el ancestro común. 5. Flujo inverso con callbacks.
- Lo calculable **no** es estado. Una sola fuente de la verdad.
:::
