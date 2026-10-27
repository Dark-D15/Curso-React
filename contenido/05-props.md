---
id: props
nivel: 1
titulo: Props: pasar datos a los componentes
icono: 🎁
tiempo: 30 min
resumen: Cómo los componentes se comunican de padre a hijo, valores por defecto, funciones como props y la regla de solo lectura.
---

:::goal
Configurar componentes mediante **props**, usar desestructuración y valores por defecto, pasar funciones y comprender por qué las props son de solo lectura.
:::

## Props: los argumentos de un componente

Las **props** (*properties*) son la forma en que un componente **padre** pasa información a un **hijo**. Se escriben como atributos y llegan al hijo en **un único objeto**.

```jsx run
function Saludo(props) {
  return <h2>Hola, {props.nombre} 👋 (tienes {props.edad} años)</h2>;
}

function App() {
  return (
    <div className="card">
      <Saludo nombre="Ana" edad={28} />
      <Saludo nombre="Luis" edad={35} />
    </div>
  );
}
```

- Un **string** va entre comillas: `nombre="Ana"`.
- Cualquier otro valor (números, booleanos, arrays, objetos, funciones, JSX) va entre **llaves**: `edad={28}`.

## Desestructurar las props

Lo habitual es desestructurar en la firma de la función:

```jsx run
function Tarjeta({ titulo, precio, enOferta = false }) {
  return (
    <div className="card col">
      <strong>{titulo}</strong>
      <span>S/ {precio.toFixed(2)}</span>
      {enOferta && <span className="badge">¡Oferta!</span>}
    </div>
  );
}

function App() {
  return (
    <div className="row">
      <Tarjeta titulo="Teclado" precio={89.9} />
      <Tarjeta titulo="Ratón" precio={39.5} enOferta />
    </div>
  );
}
```

Observa dos cosas:

- `enOferta = false` es un **valor por defecto** cuando la prop no se envía.
- Escribir `enOferta` sin valor equivale a `enOferta={true}`.

## Pasar objetos y arrays

```jsx run
function Perfil({ usuario, habilidades }) {
  return (
    <div className="card">
      <h3>{usuario.nombre}</h3>
      <p className="muted">{usuario.rol}</p>
      <p>{habilidades.join(' · ')}</p>
    </div>
  );
}

function App() {
  const u = { nombre: 'Marta', rol: 'Frontend' };
  return <Perfil usuario={u} habilidades={['React', 'CSS', 'Git']} />;
}
```

## Spread de props

Cuando ya tienes un objeto con todas las props:

```jsx
const datos = { titulo: 'Teclado', precio: 89.9 };
<Tarjeta {...datos} />   // equivale a <Tarjeta titulo="Teclado" precio={89.9} />
```

Úsalo con moderación: oculta qué props recibe el componente.

## Pasar funciones: el hijo "avisa" al padre

Los datos bajan por props; los **eventos suben** llamando a funciones que el padre pasó. Es el patrón fundamental de comunicación en React.

```jsx run
function BotonLike({ onLike }) {
  return <button onClick={onLike}>👍 Me gusta</button>;
}

function App() {
  const [likes, setLikes] = useState(0);
  return (
    <div className="card row">
      <BotonLike onLike={() => setLikes(likes + 1)} />
      <span>{likes} likes</span>
    </div>
  );
}
```

:::info Convención de nombres
Las props que reciben funciones de evento empiezan con `on` (`onLike`, `onChange`, `onDelete`). Los manejadores que defines en el padre suelen empezar con `handle` (`handleLike`).
:::

## Las props son de solo lectura

Un componente **nunca debe modificar sus props**. Si necesita "recordar" algo que cambia, usará **estado** (siguiente tema).

```jsx
function Mal({ nombre }) {
  nombre = nombre.toUpperCase();   // ⚠️ reasignar el parámetro es confuso; mejor crear una variable nueva
  props.nombre = 'x';               // ❌ nunca mutes props (están congeladas en desarrollo)
}
```

```jsx
function Bien({ nombre }) {
  const mayus = nombre.toUpperCase();   // ✅ derivar un valor nuevo
  return <p>{mayus}</p>;
}
```

## Props especiales

- `key` y `ref` **no llegan** como props normales a tu componente (`key` nunca; `ref` desde React 19 sí se recibe como prop en componentes de función).
- `children`: el contenido entre las etiquetas de apertura y cierre. Tiene su propia lección.

## Prop drilling

Pasar props por muchos niveles intermedios solo para que lleguen a un nieto se llama **prop drilling**. Para casos así existen la **composición** (lección de `children`) y el **Contexto** (nivel intermedio).

:::exercise Componente Avatar configurable
Crea el componente `Avatar` con las props `nombre` y `size` (por defecto `48`). Debe renderizar un `<div className="avatar">` con **la inicial del nombre en mayúscula**, de ancho y alto igual a `size` píxeles (usa `style`). En `App` ya se usa dos veces.

```hint
La inicial es `nombre[0].toUpperCase()` (o `nombre.charAt(0)`).
```
```hint
`style={{ width: size, height: size }}`; define `size = 48` en la desestructuración.
```

```starter
function Avatar() {
  // completa
  return <div></div>;
}

function App() {
  return (
    <div className="row">
      <Avatar nombre="ana" />
      <Avatar nombre="Beto" size={80} />
    </div>
  );
}
```

```solution
function Avatar({ nombre, size = 48 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
      {nombre[0].toUpperCase()}
    </div>
  );
}

function App() {
  return (
    <div className="row">
      <Avatar nombre="ana" />
      <Avatar nombre="Beto" size={80} />
    </div>
  );
}
```

```checks
const av = $$('.avatar');
await check('Se renderizan dos avatares', () => av.length === 2);
await check('El primero muestra la inicial "A" (en mayúscula)', () => av[0] && av[0].textContent.trim() === 'A');
await check('El segundo muestra "B"', () => av[1] && av[1].textContent.trim() === 'B');
await check('El primero mide 48px por defecto', () => av[0] && av[0].style.width === '48px' && av[0].style.height === '48px');
await check('El segundo mide 80px', () => av[1] && av[1].style.width === '80px');
```
:::

:::quiz
? ¿En qué dirección fluyen los datos mediante props?
- De hijo a padre
+ De padre a hijo
- Entre hermanos directamente
- En ambos sentidos
> Es un flujo unidireccional. El hijo comunica al padre llamando a funciones recibidas por props.

? ¿Cómo se pasa el número 5 a la prop `cantidad`?
- `cantidad="5"` (es un string)
+ `cantidad={5}`
- `cantidad=(5)`
- `cantidad:5`
> Todo lo que no sea string literal va entre llaves.

? ¿Puede un componente modificar sus propias props?
- Sí, con asignación directa
+ No, son de solo lectura; para valores que cambian se usa estado
- Solo si son números
- Solo con `useEffect`
> Las props representan la entrada del componente y deben tratarse como inmutables.

? ¿Qué hace `function Boton({ color = 'azul' })`?
+ Define `'azul'` como valor por defecto si no se pasa `color`
- Obliga a pasar siempre `color`
- Convierte `color` en estado
- Declara una constante global
> El valor por defecto aplica cuando la prop es `undefined`.
:::

:::summary
- Props = argumentos del componente: datos que bajan de padre a hijo.
- Desestructúralas y dales valores por defecto.
- Los hijos avisan al padre con **funciones** pasadas por props.
- Son **inmutables**: para datos cambiantes usa estado.
:::
