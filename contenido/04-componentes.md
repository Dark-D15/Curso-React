---
id: componentes
nivel: 1
titulo: Componentes
icono: 🧱
tiempo: 30 min
resumen: Crea piezas de interfaz reutilizables, compónlas entre sí y entiende por qué deben ser puras.
---

:::goal
Crear componentes de función, nombrarlos bien, anidarlos y reutilizarlos, y entender la regla de la **pureza**.
:::

## Un componente es una función que devuelve JSX

```jsx run
function Saludo() {
  return <h2>👋 ¡Hola desde un componente!</h2>;
}

function App() {
  return (
    <div className="card">
      <Saludo />
      <Saludo />
      <Saludo />
    </div>
  );
}
```

Escribiste `Saludo` una vez y lo usaste tres veces. Esa es la gran idea: **reutilización**.

### Reglas básicas

1. El nombre empieza con **Mayúscula** (`Saludo`, `TarjetaProducto`). Si no, React lo interpreta como etiqueta HTML.
2. Devuelve **JSX** (o `null` si no quiere mostrar nada).
3. Se usa como una etiqueta: `<Saludo />`.
4. Se **define en el nivel superior** del archivo, no dentro de otro componente.

:::danger Componentes definidos dentro de otros
```jsx
function Padre() {
  function Hijo() { return <p>hola</p>; }   // ❌ se crea una función NUEVA en cada render
  return <Hijo />;                           // React lo ve como otro componente y pierde su estado
}
```
Cada render de `Padre` crearía un `Hijo` distinto, destruyendo y recreando su DOM y su estado. Defínelo fuera.
:::

## Componiendo componentes

Los componentes se anidan formando un **árbol**. Los pequeños se combinan en otros mayores:

```jsx run
function Estrella() { return <span>⭐</span>; }

function Puntuacion() {
  return (
    <p>
      <Estrella /><Estrella /><Estrella /><Estrella /><span style={{ opacity: .3 }}>⭐</span>
    </p>
  );
}

function Resena() {
  return (
    <article className="card">
      <h3>Excelente curso</h3>
      <Puntuacion />
      <p className="muted">Muy claro y con ejemplos prácticos.</p>
    </article>
  );
}

function App() {
  return (
    <div className="col">
      <Resena />
      <Resena />
    </div>
  );
}
```

## Cómo organizar archivos

En un proyecto real, normalmente **un componente por archivo**, exportado y luego importado:

```jsx title="src/components/Saludo.jsx"
export default function Saludo() {
  return <h2>Hola</h2>;
}
```

```jsx title="src/App.jsx"
import Saludo from './components/Saludo.jsx';

export default function App() {
  return <Saludo />;
}
```

Convención habitual: archivos `PascalCase.jsx` para componentes y carpetas por funcionalidad. Más adelante veremos arquitectura.

## Pureza: el componente como fórmula matemática

Una función **pura** con las mismas entradas devuelve siempre la misma salida y **no tiene efectos secundarios** durante el renderizado. Los componentes de React deben ser puros respecto a sus **props, estado y contexto**.

```jsx run
// ❌ IMPURO: modifica una variable externa durante el render
let invitado = 0;
function TazaMala() {
  invitado = invitado + 1;
  return <p>Taza para el invitado #{invitado}</p>;
}

// ✅ PURO: solo depende de lo que recibe
function TazaBuena({ numero }) {
  return <p>Taza para el invitado #{numero}</p>;
}

function App() {
  return (
    <div className="card">
      <TazaBuena numero={1} />
      <TazaBuena numero={2} />
      <TazaBuena numero={3} />
    </div>
  );
}
```

:::info ¿Por qué importa?
React puede **renderizar un componente más de una vez** (por ejemplo, en `StrictMode`, o al pausar y reanudar renders en modo concurrente). Si el render es puro, el resultado siempre es el mismo y nada se rompe. Los efectos secundarios (peticiones, suscripciones, cambiar el título) van en **manejadores de eventos** o en `useEffect`.
:::

## Componentes de clase (solo para reconocerlos)

Antes de los hooks (React 16.8) se usaban clases con `extends Component`. Hoy **todo se escribe con funciones**. Las clases siguen funcionando y se usan en un caso: los **Error Boundaries** (lo verás en el nivel avanzado).

```jsx
class Saludo extends React.Component {
  render() { return <h1>Hola</h1>; }
}
```

## El árbol de renderizado

React renderiza de arriba hacia abajo: `App` → hijos → nietos. Cuando algo cambia, **vuelve a renderizar ese componente y sus hijos**. Entender este árbol es la base para la lección de rendimiento.

```text
        App
       /   \
  Cabecera  Contenido
              |
            Tarjeta × 3
```

:::exercise Crea y reutiliza un componente
Crea un componente `Insignia` que devuelva un `<span className="badge">` con el texto `Nuevo`. Úsalo **tres veces** dentro de `App`.

```hint
Define `function Insignia() { return <span className="badge">Nuevo</span>; }` fuera de `App`, y escribe `<Insignia />` tres veces.
```

```starter
// 1) Define Insignia aquí


function App() {
  return (
    <div className="row">
      {/* 2) Úsalo tres veces */}
    </div>
  );
}
```

```solution
function Insignia() {
  return <span className="badge">Nuevo</span>;
}

function App() {
  return (
    <div className="row">
      <Insignia />
      <Insignia />
      <Insignia />
    </div>
  );
}
```

```checks
await check('Hay 3 insignias (span.badge)', () => $$('span.badge').length === 3);
await check('Cada insignia dice "Nuevo"', () => $$('span.badge').every(e => e.textContent.trim() === 'Nuevo'));
```
:::

:::quiz
? ¿Por qué los componentes deben empezar con mayúscula?
- Es solo una costumbre sin efecto
+ Porque React distingue `<Boton />` (componente) de `<button>` (etiqueta HTML)
- Para que sean más rápidos
- Porque lo exige el navegador
> Con minúscula, React lo trata como un elemento del DOM.

? ¿Cuál de estas cosas NO debe hacerse durante el renderizado?
- Calcular un valor a partir de las props
+ Modificar una variable global o hacer una petición de red
- Devolver JSX
- Usar `map` sobre un array de props
> El render debe ser puro; los efectos van en eventos o `useEffect`.

? ¿Dónde se debe definir un componente?
- Dentro de otro componente
+ En el nivel superior del módulo (fuera de otros componentes)
- Dentro de un `if`
- Dentro de un `useEffect`
> Definirlo dentro lo recrea en cada render y se pierde su estado.
:::

:::summary
- Componente = función con nombre en Mayúscula que devuelve JSX.
- Se componen formando un árbol; escribe una vez, reutiliza muchas.
- Mantén el render **puro** y define los componentes fuera de otros.
:::
