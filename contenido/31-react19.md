---
id: react19
nivel: 3
titulo: Novedades de React 19: Actions, use, useOptimistic…
icono: 🆕
tiempo: 50 min
resumen: Actions en formularios, useActionState, useFormStatus, useOptimistic, use, ref como prop, metadatos del documento y las novedades de 19.2.
---

:::goal
Dominar las APIs modernas de **React 19** (y 19.2) para formularios y mutaciones: **Actions**, `useActionState`, `useFormStatus`, `useOptimistic`, `use`, y otras mejoras de la plataforma.
:::

:::info Este curso ya usa React 19
Todos los ejemplos del sitio se ejecutan con **React 19.2**. Las novedades de esta lección funcionan aquí mismo.
:::

## Actions: el nuevo modelo para mutaciones

Una **Action** es una función (normalmente `async`) que ejecutas dentro de una **transición** para realizar una mutación (enviar un formulario, guardar, borrar). React gestiona por ti:

- **Estado pendiente** (`isPending`), sin escribir `setCargando(true/false)`.
- **Errores** (con Error Boundaries) y **actualizaciones optimistas**.
- **Reinicio automático** de formularios no controlados al terminar con éxito.

### `<form action={fn}>`

Puedes pasar una **función** al atributo `action` del formulario. React la llama con el `FormData` al enviar (y hace `preventDefault` por ti):

```jsx run
function App() {
  const [saludo, setSaludo] = useState('');

  function enviar(formData) {                       // recibe FormData, no el evento
    const nombre = formData.get('nombre');
    setSaludo('¡Hola, ' + nombre + '! 👋');
  }

  return (
    <form action={enviar} className="card col">
      <input name="nombre" placeholder="Tu nombre" required />
      <button>Saludar</button>
      <p>{saludo}</p>
    </form>
  );
}
```

El formulario se **reinicia automáticamente** tras ejecutar la acción (campos no controlados).

## `useActionState`: estado + acción + pendiente

`const [estado, accion, pendiente] = useActionState(fn, estadoInicial)`

- `fn(estadoPrevio, formData)` devuelve el **nuevo estado** (mensaje de error, resultado…).
- `accion` es la función que pasas a `<form action>`.
- `pendiente` indica si se está ejecutando.

```jsx run title="Formulario con validación y 'servidor' simulado"
// Simula una llamada al servidor
const guardarEnServidor = (nombre) => new Promise((ok, fallo) => setTimeout(() => (nombre.toLowerCase() === 'admin' ? fallo(new Error('Ese nombre está reservado')) : ok(nombre)), 800));

async function registrar(estadoPrevio, formData) {
  const nombre = (formData.get('nombre') || '').trim();
  if (nombre.length < 3) return { error: 'Mínimo 3 caracteres', ok: null };
  try {
    await guardarEnServidor(nombre);
    return { error: null, ok: '✅ Usuario "' + nombre + '" creado' };
  } catch (e) {
    return { error: e.message, ok: null };
  }
}

function App() {
  const [estado, accion, pendiente] = useActionState(registrar, { error: null, ok: null });
  return (
    <form action={accion} className="card col">
      <input name="nombre" placeholder="Nombre de usuario (prueba 'admin')" disabled={pendiente} />
      <button disabled={pendiente}>{pendiente ? 'Guardando…' : 'Registrar'}</button>
      {estado.error && <small role="alert" className="bad">{estado.error}</small>}
      {estado.ok && <p className="ok">{estado.ok}</p>}
    </form>
  );
}
```

No hay `useState` para `cargando`, `error` ni `onSubmit` manual. Menos código y menos casos límite.

## `useFormStatus`: leer el estado del formulario padre

Desde un componente **hijo** del `<form>` (típicamente un botón de envío reutilizable) lees si el formulario está enviándose, **sin pasar props**:

```jsx run
function BotonEnviar({ children }) {
  const { pending } = useFormStatus();            // import { useFormStatus } from 'react-dom'
  return <button disabled={pending}>{pending ? '⏳ Enviando…' : children}</button>;
}

function App() {
  const [msg, setMsg] = useState('');
  async function enviar(fd) {
    await new Promise((r) => setTimeout(r, 900));
    setMsg('Mensaje enviado: ' + fd.get('texto'));
  }
  return (
    <form action={enviar} className="card col">
      <input name="texto" placeholder="Mensaje" />
      <BotonEnviar>Enviar</BotonEnviar>           {/* sabe solo si el form está pendiente */}
      <p className="ok">{msg}</p>
    </form>
  );
}
```

:::warn Solo funciona dentro del `<form>`
`useFormStatus` lee el estado del `<form>` **ancestro**; no sirve en el mismo componente que renderiza el `<form>`.
:::

## `useOptimistic`: UI optimista

Muestra el resultado esperado **al instante** mientras la petición real sigue en curso; si falla o termina, React vuelve al estado real.

```jsx run title="Un 'me gusta' instantáneo aunque el servidor tarde"
function App() {
  const [likes, setLikes] = useState(10);
  const [likesOptimistas, anadirOptimista] = useOptimistic(likes, (actual, delta) => actual + delta);

  async function darLike() {
    anadirOptimista(1);                                     // se ve +1 YA
    await new Promise((r) => setTimeout(r, 1200));          // el "servidor" tarda
    setLikes((l) => l + 1);                                 // estado real confirmado
  }

  return (
    <form action={darLike} className="card row">
      <button>👍 Me gusta</button>
      <strong>{likesOptimistas}</strong>
    </form>
  );
}
```

Debe llamarse **dentro de una Action/transición** (por eso el `<form action>` o `startTransition`).

## `use`: leer promesas y contexto en el render

Lo viste en Suspense y Contexto: `use(promesa)` suspende hasta resolverse; `use(Contexto)` lee contexto incluso **condicionalmente** (a diferencia de los hooks, `use` puede ir dentro de `if` o bucles).

## `ref` como prop y limpieza de refs

```jsx
function Entrada({ ref, ...props }) { return <input ref={ref} {...props} />; }   // sin forwardRef

<div ref={(nodo) => {
  // se ejecuta al montar…
  return () => { /* …y esta limpieza al desmontar (nuevo en 19) */ };
}} />
```

## `<Contexto>` como proveedor

```jsx
const TemaContext = createContext('claro');
<TemaContext value="oscuro">…</TemaContext>        // ya no hace falta .Provider
```

## Metadatos del documento: `<title>`, `<meta>`, `<link>`

Puedes renderizar estas etiquetas **desde cualquier componente**; React las **eleva (hoist) al `<head>`** automáticamente:

```jsx
function Articulo({ post }) {
  return (
    <article>
      <title>{post.titulo} | Mi blog</title>
      <meta name="description" content={post.resumen} />
      <link rel="canonical" href={post.url} />
      <h1>{post.titulo}</h1>
    </article>
  );
}
```

Mira cómo lo hace aquí (el título del documento del iframe cambia):

```jsx run
function App() {
  const [n, setN] = useState(1);
  return (
    <div className="card col">
      <title>{'Vista ' + n + ' | Aprende React'}</title>
      <button onClick={() => setN(n + 1)}>Cambiar título (vista {n})</button>
    </div>
  );
}
```

## Hojas de estilo y recursos

- `<link rel="stylesheet" href="…" precedence="default" />` controla el **orden** y evita duplicados.
- Scripts `async` se deduplican.
- APIs para **precargar** recursos: `preload`, `preinit`, `preconnect`, `prefetchDNS` (de `react-dom`).

## Otras mejoras de 19

- **Mejor manejo de errores**: sin duplicados y con `onCaughtError` / `onUncaughtError` (lección de errores).
- **Custom Elements** (Web Components) soportados de forma completa.
- **`useDeferredValue(valor, valorInicial)`**: valor inicial para el primer render.
- **Mejores mensajes de hidratación** con diferencias claras.
- **`<Suspense>`** pre-calienta *siblings*: mejoras de rendimiento en carga.

## Novedades de React 19.2

| Novedad | Qué aporta |
|---|---|
| **`<Activity>`** | Oculta partes de la UI **conservando su estado** y pausando efectos/actualizaciones de baja prioridad (`mode="visible" \| "hidden"`). |
| **`useEffectEvent`** | Lee lo último dentro de efectos sin añadirlo a las dependencias (lección *Otros hooks*). |
| **Pre-rendering parcial** | Pre-renderiza la parte estática en CDN y reanuda el resto en servidor. |
| **Performance tracks** | Pistas de React en el perfilador de Chrome DevTools. |

```jsx run title="<Activity>: ocultar sin perder el estado"
function Contador() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clics: {n}</button>;
}

function App() {
  const [visible, setVisible] = useState(true);
  return (
    <div className="card col">
      <button onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'} contador</button>
      <Activity mode={visible ? 'visible' : 'hidden'}>
        <Contador />        {/* al ocultarlo conserva sus clics; con && los perdería */}
      </Activity>
    </div>
  );
}
```

## React Compiler

El **React Compiler** (herramienta de build, estable) analiza tus componentes y **memoiza automáticamente** (`useMemo`/`useCallback`/`memo` implícitos) siguiendo las reglas de React. Resultado: menos código de optimización manual.

```bash
npm install -D babel-plugin-react-compiler eslint-plugin-react-hooks
```

```js title="vite.config.js (con @vitejs/plugin-react)"
react({ babel: { plugins: ['babel-plugin-react-compiler'] } })
```

- Funciona si tu código **respeta las reglas** (render puro, no mutar props/estado, reglas de los hooks). El plugin de ESLint te avisa de las violaciones.
- Puedes excluir un componente con la directiva `"use no memo"`.
- No elimina la necesidad de entender el rendimiento: arregla *renders* innecesarios, no cálculos O(n²) ni listas gigantes.

## Cómo actualizar desde React 18

Revisa la **guía oficial de actualización** de react.dev: hay *codemods* para los cambios principales. Los más relevantes: `ReactDOM.render` y `hydrate` desaparecen (usa `createRoot`/`hydrateRoot`), `propTypes` y `defaultProps` en funciones se eliminan (usa TypeScript/valores por defecto), `forwardRef` pasa a ser innecesario, y los *refs string* y `createFactory` se retiran.

:::exercise Formulario con useActionState
Convierte el formulario para usar `useActionState`. La acción debe: si el campo `email` no contiene `@`, devolver `{ error: 'Email no válido' }`; si es válido, devolver `{ ok: 'Suscrito: <email>' }`. Muestra el error en `<p id="error">` y el éxito en `<p id="ok">`.

```hint
`const [estado, accion] = useActionState(suscribir, {})` y `<form action={accion}>`. La función recibe `(prev, formData)` y debe **devolver** el nuevo estado.
```

```starter
async function suscribir(prev, formData) {
  return {};
}

function App() {
  return (
    <form className="card col">
      <input name="email" placeholder="tu@email.com" />
      <button>Suscribirme</button>
    </form>
  );
}
```

```solution
async function suscribir(prev, formData) {
  const email = formData.get('email') || '';
  if (!email.includes('@')) return { error: 'Email no válido' };
  return { ok: 'Suscrito: ' + email };
}

function App() {
  const [estado, accion] = useActionState(suscribir, {});
  return (
    <form action={accion} className="card col">
      <input name="email" placeholder="tu@email.com" />
      <button>Suscribirme</button>
      {estado.error && <p id="error">{estado.error}</p>}
      {estado.ok && <p id="ok">{estado.ok}</p>}
    </form>
  );
}
```

```checks
await check('Usas useActionState y <form action>', () => /useActionState/.test(code) && /action=\{/.test(code));
await type($('input[name=email]'), 'correo-sin-arroba');
await click(btn('Suscribirme'));
const e = await waitFor(() => $('#error'), 2000);
await check('Un email sin @ muestra "Email no válido"', () => e && text('#error') === 'Email no válido');
await type($('input[name=email]'), 'ana@mail.com');
await click(btn('Suscribirme'));
const o = await waitFor(() => $('#ok'), 2000);
await check('Un email válido muestra "Suscrito: ana@mail.com"', () => o && text('#ok') === 'Suscrito: ana@mail.com');
```
:::

:::quiz
? ¿Qué recibe como argumento una función usada en `<form action={fn}>`?
+ Un objeto `FormData` con los campos del formulario
- El evento `submit`
- El estado del formulario
- Nada
> No hace falta `preventDefault`; React lo gestiona.

? ¿Para qué sirve `useOptimistic`?
+ Para mostrar al instante el resultado esperado de una mutación mientras se completa la petición real
- Para optimizar el rendimiento de listas
- Para memoizar valores
- Para cancelar peticiones
> Si la mutación falla, la UI vuelve al estado real.

? ¿Dónde debe usarse `useFormStatus`?
+ En un componente hijo de un `<form>`, para leer si el formulario está pendiente
- En el mismo componente que renderiza el `<form>`
- Solo en el servidor
- Fuera de cualquier formulario
> Lee el estado del `<form>` ancestro más cercano.

? ¿Qué hace `<Activity mode="hidden">` (React 19.2)?
+ Oculta la UI conservando su estado y pausando trabajo no esencial
- Desmonta el componente y borra su estado
- Cambia el título de la página
- Elimina el componente del bundle
> Es una alternativa al renderizado condicional cuando quieres preservar el estado.

? ¿Qué es el React Compiler?
+ Una herramienta de build que memoiza automáticamente componentes y valores que cumplen las reglas de React
- Un nuevo lenguaje
- Un reemplazo de Vite
- Un servidor
> Reduce la necesidad de `useMemo`/`useCallback`/`memo` manuales.
:::

:::summary
- **Actions**: `<form action={fn}>` + `useActionState` + `useFormStatus` + `useOptimistic` = formularios con menos código.
- `use` lee promesas y contexto; `ref` como prop; `<Contexto>` como proveedor; metadatos en cualquier componente.
- 19.2: `<Activity>`, `useEffectEvent`, pre-rendering parcial. **React Compiler** memoiza por ti.
:::
