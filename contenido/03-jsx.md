---
id: jsx
nivel: 1
titulo: JSX: HTML dentro de JavaScript
icono: 🧩
tiempo: 30 min
resumen: La sintaxis con la que describes la interfaz. Reglas, expresiones, atributos y qué ocurre "por debajo".
---

:::goal
Escribir JSX correctamente: expresiones con `{}`, atributos (`className`, `style`), fragmentos, listas de hijos y comprender que JSX es azúcar sintáctico de `createElement`.
:::

## ¿Qué es JSX?

**JSX** es una extensión de sintaxis de JavaScript que te deja escribir "marcado" parecido a HTML dentro de tu código. No es HTML ni un string: un compilador (Babel, SWC, esbuild, Sucrase…) lo transforma en llamadas JavaScript.

```jsx run
function App() {
  const titulo = 'Mi primera vista';
  return (
    <section className="card">
      <h1>{titulo}</h1>
      <p>2 + 2 = {2 + 2}</p>
    </section>
  );
}
```

La razón de ser: la lógica y el marcado de un componente **viven juntos** porque están acoplados (qué ves depende de los datos).

## Lo que ocurre por debajo

Cada etiqueta JSX se convierte en una llamada a `React.createElement` (o a la función `jsx` del *runtime* moderno), que devuelve un **objeto** descriptor:

```jsx
// Esto…
const el = <h1 className="titulo">Hola</h1>;

// …es equivalente a esto:
const el2 = React.createElement('h1', { className: 'titulo' }, 'Hola');

// Y produce un objeto parecido a:
// { type: 'h1', props: { className: 'titulo', children: 'Hola' } }
```

Por eso el JSX es una **expresión**: puedes guardarlo en variables, devolverlo desde funciones o pasarlo como argumento.

## Las reglas de JSX

### 1. Un solo elemento raíz (usa fragmentos)

Una función devuelve **un** valor, así que envuelve los hermanos en un contenedor o en un **fragmento** `<>…</>` (que no añade nodos extra al DOM).

```jsx run
function App() {
  return (
    <>
      <h1>Título</h1>
      <p>Sin &lt;div&gt; extra en el DOM.</p>
    </>
  );
}
```

### 2. Cierra todas las etiquetas

`<img />`, `<input />`, `<br />` necesitan la barra final. Los componentes sin hijos también: `<Boton />`.

### 3. Atributos en camelCase

Como JSX se convierte en JavaScript, los atributos son propiedades: `className` (no `class`), `htmlFor` (no `for`), `onClick`, `tabIndex`, `maxLength`…

| HTML | JSX |
|---|---|
| `class="x"` | `className="x"` |
| `for="id"` | `htmlFor="id"` |
| `onclick="..."` | `onClick={fn}` |
| `tabindex="0"` | `tabIndex={0}` |
| `style="color:red"` | `style={{ color: 'red' }}` |

:::info Excepciones
Los atributos `data-*` y `aria-*` mantienen su guion: `data-id="3"`, `aria-label="Cerrar"`.
:::

## Expresiones con llaves `{ }`

Dentro de `{ }` puedes poner **cualquier expresión JavaScript** (variables, operaciones, llamadas a funciones, ternarios). Funciona **como texto** o **como valor de atributo**.

```jsx run
function App() {
  const usuario = { nombre: 'Ana', apellido: 'Pérez', foto: 'https://placehold.co/80' };
  const nombreCompleto = (u) => u.nombre + ' ' + u.apellido;
  const hora = new Date().getHours();

  return (
    <div className="card row">
      <img src={usuario.foto} alt={'Foto de ' + usuario.nombre} width="64" height="64" style={{ borderRadius: '50%' }} />
      <div>
        <h2>{nombreCompleto(usuario)}</h2>
        <p className="muted">{hora < 12 ? 'Buenos días ☀️' : 'Buenas tardes 🌤️'}</p>
      </div>
    </div>
  );
}
```

:::warn No se pueden poner sentencias
Dentro de `{}` va **una expresión**, no una sentencia: no puedes escribir `if`, `for` ni declarar variables. Usa ternarios, `&&`, `map`, o prepara el valor **antes** del `return`.
:::

### El atributo `style` recibe un objeto

Las dobles llaves son la unión de dos cosas: las llaves de JSX `{}` y un objeto literal `{}`. Las propiedades CSS van en camelCase.

```jsx run
function App() {
  const estilo = { backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, fontSize: '1.2rem' };
  return (
    <div style={estilo}>
      <span style={{ color: 'crimson', fontWeight: 'bold' }}>Estilo en línea</span>
    </div>
  );
}
```

## Valores que React no pinta

`true`, `false`, `null` y `undefined` **no se renderizan** (por eso sirven para mostrar/ocultar). Números y strings sí. Los **objetos** no son válidos como hijo (lanzan error).

```jsx run
function App() {
  return (
    <ul>
      <li>Número: {42}</li>
      <li>Texto: {'hola'}</li>
      <li>Booleano (no se ve): [{true}]</li>
      <li>Null (no se ve): [{null}]</li>
      <li>Array: {['a', 'b', 'c']}</li>
    </ul>
  );
}
```

## Seguridad: React escapa el contenido

El texto que insertas con `{}` **se escapa** automáticamente, lo que previene ataques XSS. Si necesitas HTML crudo existe `dangerouslySetInnerHTML` (el nombre es un aviso): úsalo solo con contenido de confianza o saneado.

## Comentarios y espacios

```jsx
return (
  <div>
    {/* Así se comenta dentro de JSX */}
    <p>
      Texto en
      varias líneas se colapsa en espacios.
    </p>
  </div>
);
```

JSX elimina espacios y saltos de línea al inicio y final de las líneas. Para forzar un espacio entre elementos usa `{' '}`.

## Componentes en JSX: mayúscula inicial

- `<div>` (minúscula) → elemento HTML del navegador.
- `<Boton>` (Mayúscula) → componente que tú definiste.

React usa esa diferencia para saber qué hacer. Lo veremos en la próxima lección.

:::exercise Construye una ficha con JSX
Completa el componente. Requisitos:

- Un `<h2>` que muestre el **nombre** (`nombre`).
- Un `<p>` que diga `Edad: ` seguido de la edad y, si la edad es 18 o más, el texto ` (mayor de edad)`.
- El contenedor `<div>` debe tener `className="card"` y el `<h2>` el color `teal` usando `style`.

```hint
Usa llaves para las expresiones: `{nombre}`, y un ternario: `{edad >= 18 ? ' (mayor de edad)' : ''}`.
```
```hint
Para el color: `style={{ color: 'teal' }}`. Las dobles llaves son normales.
```

```starter
function App() {
  const nombre = 'Lucía';
  const edad = 21;

  return (
    <div>
      <h2>Nombre aquí</h2>
      <p>Edad aquí</p>
    </div>
  );
}
```

```solution
function App() {
  const nombre = 'Lucía';
  const edad = 21;

  return (
    <div className="card">
      <h2 style={{ color: 'teal' }}>{nombre}</h2>
      <p>Edad: {edad}{edad >= 18 ? ' (mayor de edad)' : ''}</p>
    </div>
  );
}
```

```checks
await check('El contenedor tiene la clase "card"', () => $('div.card'));
await check('El <h2> muestra "Lucía"', () => text('h2') === 'Lucía');
await check('El <h2> tiene color teal', () => { const c = win.getComputedStyle($('h2')).color; return c === 'rgb(0, 128, 128)'; });
await check('El párrafo muestra la edad y "mayor de edad"', () => /Edad:\s*21/.test(text('p')) && text('p').includes('mayor de edad'));
```
:::

:::quiz
? ¿Cómo se escribe correctamente la clase CSS en JSX?
- `class="caja"`
+ `className="caja"`
- `css="caja"`
- `classname="caja"`
> `class` es palabra reservada en JavaScript, por eso JSX usa `className`.

? ¿Qué es incorrecto dentro de las llaves `{ }` de JSX?
- `{a + b}`
- `{usuario.nombre}`
+ `{if (x) { ... }}`
- `{lista.map(...)}`
> Solo caben expresiones; las sentencias como `if` o `for` no.

? ¿Para qué sirve `<>...</>`?
- Para comentar código
+ Para devolver varios hermanos sin añadir un nodo extra al DOM
- Para importar componentes
- Para activar el modo estricto
> Es la sintaxis corta de `<Fragment>`.

? ¿Qué muestra React para `{false}`, `{null}` y `{undefined}`?
+ Nada
- La palabra "false"
- Un error
- Un espacio
> Esos valores se ignoran, lo que permite el renderizado condicional.
:::

:::summary
- JSX = sintaxis que se compila a `createElement`; produce objetos.
- Un solo raíz o fragmento; todas las etiquetas cerradas; atributos en camelCase.
- `{ }` admite **expresiones**; `style` recibe un objeto.
- `true/false/null/undefined` no se pintan; el texto se escapa por seguridad.
:::
