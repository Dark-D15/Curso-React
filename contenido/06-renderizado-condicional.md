---
id: renderizado-condicional
nivel: 1
titulo: Renderizado condicional
icono: 🔀
tiempo: 25 min
resumen: Mostrar u ocultar partes de la interfaz según el estado: if, ternario, && y sus trampas.
---

:::goal
Elegir qué mostrar según una condición con `if`, el operador ternario y `&&`, evitando el clásico error del `0` en pantalla.
:::

En React no hay "directivas" especiales como `v-if`: usas **JavaScript normal**. Como ya sabes, `null`, `false` y `undefined` no pintan nada, y eso es todo lo que necesitas.

## 1. `if` con retorno anticipado

Ideal cuando hay casos totalmente distintos o estados de carga/error:

```jsx run
function Estado({ cargando, error }) {
  if (cargando) return <p>⏳ Cargando…</p>;
  if (error) return <p className="bad">❌ {error}</p>;
  return <p className="ok">✅ Datos listos</p>;
}

function App() {
  return (
    <div className="col">
      <Estado cargando />
      <Estado error="No se pudo conectar" />
      <Estado />
    </div>
  );
}
```

## 2. Operador ternario `condición ? A : B`

Perfecto para elegir **entre dos** resultados dentro del JSX:

```jsx run
function App() {
  const [conectado, setConectado] = useState(false);
  return (
    <div className="card row">
      <span>{conectado ? '🟢 En línea' : '⚪ Desconectado'}</span>
      <button onClick={() => setConectado(!conectado)}>
        {conectado ? 'Desconectar' : 'Conectar'}
      </button>
    </div>
  );
}
```

## 3. Operador `&&`: mostrar o nada

Si la condición es verdadera, renderiza lo de la derecha; si no, nada:

```jsx run
function App() {
  const [nuevos, setNuevos] = useState(2);
  return (
    <div className="card col">
      <h3>Bandeja {nuevos > 0 && <span className="badge">{nuevos} nuevos</span>}</h3>
      <div className="row">
        <button onClick={() => setNuevos(nuevos + 1)}>Llega correo</button>
        <button onClick={() => setNuevos(0)}>Leer todo</button>
      </div>
    </div>
  );
}
```

:::danger La trampa del `0`
```jsx
{cantidad && <Lista />}      // si cantidad = 0 → React renderiza "0"
{cantidad > 0 && <Lista />}  // ✅ condición booleana explícita
{!!cantidad && <Lista />}    // ✅ también funciona
```
`0` y `NaN` son valores falsy que **sí** se pintan. Usa siempre comparaciones que devuelvan un booleano.
:::

## 4. Asignar JSX a variables

Cuando la lógica es larga, prepara el contenido antes del `return`:

```jsx run
function App() {
  const [rol, setRol] = useState('invitado');

  let panel;
  if (rol === 'admin') panel = <p>🛠️ Panel de administración</p>;
  else if (rol === 'editor') panel = <p>✏️ Editor de contenido</p>;
  else panel = <p>👀 Solo lectura</p>;

  return (
    <div className="card col">
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="invitado">Invitado</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      {panel}
    </div>
  );
}
```

## 5. Muchos casos: objeto como mapa

Para más de 3 casos, un objeto es más limpio que ternarios anidados:

```jsx run
const ICONOS = { exito: '✅', aviso: '⚠️', error: '❌' };

function Alerta({ tipo = 'exito', children }) {
  return <p>{ICONOS[tipo] ?? 'ℹ️'} {children}</p>;
}

function App() {
  return (
    <div className="col">
      <Alerta tipo="exito">Guardado</Alerta>
      <Alerta tipo="aviso">Casi sin espacio</Alerta>
      <Alerta tipo="error">Fallo de red</Alerta>
      <Alerta tipo="otro">Mensaje genérico</Alerta>
    </div>
  );
}
```

## Clases y atributos condicionales

La misma idea sirve para atributos:

```jsx
<button className={activo ? 'btn activo' : 'btn'} disabled={cargando}>
  {cargando ? 'Enviando…' : 'Enviar'}
</button>
```

## Ocultar con CSS vs. no renderizar

| Técnica | Efecto |
|---|---|
| `{visible && <Panel />}` | El componente **no existe** en el DOM; **pierde su estado** al desaparecer. |
| `<Panel style={{ display: visible ? 'block' : 'none' }} />` | Sigue montado (conserva estado), solo oculto. Útil para pestañas costosas. |

:::exercise Sesión de usuario
`App` ya tiene el estado `logueado`. Haz que:

- Si **no** está logueado, muestre `Inicia sesión` y un botón **Entrar**.
- Si lo está, muestre `Bienvenido, Ana` y un botón **Salir**.

Ambos botones deben cambiar el estado.

```hint
Usa un ternario para el texto y otro para la etiqueta del botón, o dos retornos distintos.
```

```starter
function App() {
  const [logueado, setLogueado] = useState(false);

  return (
    <div className="card col">
      <p>Texto aquí</p>
      <button onClick={() => setLogueado(!logueado)}>Botón</button>
    </div>
  );
}
```

```solution
function App() {
  const [logueado, setLogueado] = useState(false);

  return (
    <div className="card col">
      <p>{logueado ? 'Bienvenido, Ana' : 'Inicia sesión'}</p>
      <button onClick={() => setLogueado(!logueado)}>
        {logueado ? 'Salir' : 'Entrar'}
      </button>
    </div>
  );
}
```

```checks
await check('Al inicio muestra "Inicia sesión" y un botón "Entrar"', () => text('p').includes('Inicia sesión') && btn('Entrar'));
await click(btn('Entrar'));
await check('Tras entrar muestra "Bienvenido, Ana" y un botón "Salir"', () => text('p').includes('Bienvenido, Ana') && btn('Salir'));
await click(btn('Salir'));
await check('Al salir vuelve a "Inicia sesión"', () => text('p').includes('Inicia sesión') && btn('Entrar'));
```
:::

:::quiz
? ¿Qué se renderiza con `{0 && <p>Hola</p>}`?
- Nada
- El párrafo
+ El número `0`
- Un error
> `0` es falsy pero React sí lo pinta. Usa `cantidad > 0 && ...`.

? ¿Qué diferencia hay entre `{visible && <Panel />}` y ocultarlo con CSS?
+ Con `&&` el componente se desmonta y pierde su estado; con CSS sigue montado
- Ninguna
- Con `&&` el componente es más rápido siempre
- Con CSS no se puede ocultar
> Desmontar destruye el estado interno del componente.

? ¿Cuál es la mejor opción para elegir entre dos valores dentro del JSX?
- `if` dentro de las llaves
+ El operador ternario
- `switch` dentro de las llaves
- Un `for`
> Dentro de JSX solo caben expresiones; el ternario lo es.
:::

:::summary
- Usa JavaScript normal: `if` + `return`, ternario, `&&`.
- Cuidado con valores falsy que sí se pintan (`0`).
- Para muchos casos: variables previas o un objeto-mapa.
:::
