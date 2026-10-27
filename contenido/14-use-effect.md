---
id: use-effect
nivel: 2
titulo: Efectos con useEffect
icono: ⚡
tiempo: 45 min
resumen: Sincroniza tu componente con sistemas externos: dependencias, limpieza, errores típicos y cuándo NO usar un efecto.
---

:::goal
Usar `useEffect` para **sincronizar** con el exterior (título, timers, eventos, suscripciones), dominar el *array de dependencias* y la **función de limpieza**, y saber cuándo un efecto *no* es la solución.
:::

## ¿Qué es un efecto?

El render debe ser **puro**. Pero a veces necesitas hacer algo *fuera* de React: cambiar el título de la pestaña, abrir una conexión, iniciar un temporizador, escuchar eventos del navegador… Eso son **efectos secundarios**, y `useEffect` te permite ejecutarlos **después de que React pintó** el componente.

```jsx run
function App() {
  const [n, setN] = useState(0);

  useEffect(() => {
    document.title = 'Clics: ' + n;    // sincronizamos el título con el estado
  });

  return <button onClick={() => setN(n + 1)}>Clics: {n} (mira el título de la pestaña del iframe)</button>;
}
```

:::idea Piensa en "sincronizar", no en "ciclo de vida"
La pregunta correcta no es "¿cuándo se monta?", sino "**¿con qué valores debe estar sincronizado este efecto?**" El efecto describe cómo sincronizar; React decide cuándo volver a hacerlo.
:::

## Sintaxis

```jsx
useEffect(() => {
  // 1) código del efecto (se ejecuta después del render)
  return () => {
    // 2) limpieza (opcional): se ejecuta antes del siguiente efecto y al desmontar
  };
}, [dependencias]);  // 3) cuándo volver a ejecutarlo
```

## El array de dependencias

| Forma | Cuándo se ejecuta |
|---|---|
| `useEffect(fn)` | Después de **cada** render |
| `useEffect(fn, [])` | Solo tras el **primer** render (montaje) |
| `useEffect(fn, [a, b])` | Tras el primer render y cuando `a` o `b` **cambian** |

Lo mejor para verlo: un componente que registra cada fase. Pulsa los botones y mira la consola.

```jsx run title="Observa el orden: render → efecto → limpieza"
function Sonda({ nombre }) {
  console.log('🎨 render con', nombre);

  useEffect(() => {
    console.log('✅ efecto: conectar a', nombre);
    return () => console.log('🧹 limpieza: desconectar de', nombre);
  }, [nombre]);

  return <strong>Conectado a {nombre}</strong>;
}

function App() {
  const [sala, setSala] = useState('general');
  const [visible, setVisible] = useState(true);
  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => setSala('general')}>#general</button>
        <button onClick={() => setSala('react')}>#react</button>
        <button onClick={() => setVisible(!visible)}>{visible ? 'Desmontar' : 'Montar'}</button>
      </div>
      {visible && <Sonda nombre={sala} />}
    </div>
  );
}
```

Verás que al cambiar de sala se ejecuta primero la **limpieza del efecto anterior** y luego el nuevo efecto. Al desmontar, también se limpia.

## La limpieza (cleanup)

Todo lo que "abres" en un efecto debes "cerrarlo": intervalos, listeners, suscripciones, conexiones.

```jsx run title="Temporizador con limpieza"
function App() {
  const [seg, setSeg] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(id);        // sin esto, el intervalo seguiría tras desmontar
  }, []);

  return <h2>⏱ {seg} s</h2>;
}
```

Fíjate también en `setSeg(s => s + 1)`: la forma funcional evita depender de `seg` (si lo usáramos, tendríamos que ponerlo en las dependencias y el intervalo se reiniciaría cada segundo).

```jsx run title="Escuchar eventos del navegador"
function App() {
  const [ancho, setAncho] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setAncho(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return <p>Ancho de la ventana: <strong>{ancho}px</strong> (cambia el tamaño del navegador)</p>;
}
```

## Dependencias: di la verdad

Si tu efecto **usa** una variable reactiva (props, estado, o valores derivados), debe estar en el array. La regla `react-hooks/exhaustive-deps` de ESLint te avisa; **no la silencies**: cambia el código.

```jsx run title="Efecto que depende de una prop"
function Mensaje({ usuario }) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    setTexto('Hola, ' + usuario + '!');
  }, [usuario]);                  // se vuelve a ejecutar cuando cambia `usuario`

  return <p>{texto}</p>;
}

function App() {
  const [usuario, setUsuario] = useState('Ana');
  return (
    <div className="card col">
      <input value={usuario} onChange={(e) => setUsuario(e.target.value)} />
      <Mensaje usuario={usuario} />
    </div>
  );
}
```

(Ese ejemplo es didáctico, pero ¿necesita realmente un efecto? Mira la siguiente sección.)

### Trampa: objetos y funciones como dependencias

Un objeto o función creado **dentro del componente** es nuevo en cada render, así que el efecto se ejecutaría siempre:

```jsx
function Chat({ id }) {
  const opciones = { id };                 // objeto nuevo en CADA render
  useEffect(() => conectar(opciones), [opciones]);   // ❌ se reconecta siempre
  useEffect(() => conectar({ id }), [id]);           // ✅ depende del valor primitivo
}
```

Soluciones: crea el objeto **dentro** del efecto, depende de valores primitivos, o mueve la función fuera del componente.

### Bucle infinito

```jsx
useEffect(() => {
  setContador(contador + 1);   // ❌ cambia el estado → re-render → efecto → cambia el estado…
});                             // (sin dependencias: se ejecuta tras cada render)
```

## 🚫 Quizás no necesitas un efecto

Los efectos son una **vía de escape** para hablar con sistemas externos. Muchos usos habituales son innecesarios:

| Quieres… | ❌ Con efecto | ✅ Mejor |
|---|---|---|
| Calcular un valor a partir de estado/props | `useEffect(() => setTotal(a+b))` | `const total = a + b;` en el render |
| Reaccionar a un clic/envío | `useEffect` observando un flag | Hacerlo en el **manejador de eventos** |
| Reiniciar estado cuando cambia una prop | `useEffect(() => setX(0), [id])` | Usar `key={id}` en el componente |
| Cachear un cálculo caro | efecto + estado | `useMemo` |
| Enviar datos al servidor al pulsar | efecto | Manejador de eventos |

```jsx run title="❌ Efecto innecesario vs ✅ cálculo directo"
function App() {
  const [nombre, setNombre] = useState('Ana');
  const [apellido, setApellido] = useState('Pérez');

  // ❌ const [completo, setCompleto] = useState(''); useEffect(() => setCompleto(nombre + ' ' + apellido), [nombre, apellido]);
  const completo = nombre + ' ' + apellido;    // ✅ derivado en el render

  return (
    <div className="card col">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input value={apellido} onChange={(e) => setApellido(e.target.value)} />
      <strong>{completo}</strong>
    </div>
  );
}
```

## Qué sí son buenos usos

- Sincronizar con **APIs del navegador**: título, `localStorage`, `document`, observadores (`IntersectionObserver`), media queries.
- Conexiones (WebSocket, suscripciones a stores) con su limpieza.
- Librerías no-React (mapas, gráficos) que necesitan un nodo del DOM.
- **Obtener datos** al montar o al cambiar un parámetro (aunque hoy lo ideal es una librería como TanStack Query o el framework; lo veremos).

## StrictMode: el efecto se ejecuta dos veces en desarrollo

En desarrollo, `StrictMode` monta → desmonta → monta cada componente para **comprobar que tu limpieza es correcta**. Si ves el efecto ejecutarse dos veces: no es un bug de React; es una prueba para que el efecto sea *simétrico* (lo que abre, lo cierra).

```jsx run title="StrictMode: observa los logs duplicados"
function Conexion() {
  useEffect(() => {
    console.log('🔌 conectar');
    return () => console.log('🔌 desconectar');
  }, []);
  return <p>Mira la consola: conectar → desconectar → conectar</p>;
}

function App() {
  return <StrictMode><Conexion /></StrictMode>;
}
```

## `useLayoutEffect` (nota)

Se ejecuta **antes de pintar** (sincrónico tras el DOM actualizado). Útil para medir elementos y reposicionar sin parpadeo. Es raro; lo veremos en "Otros hooks".

:::exercise Actualiza el título del documento
Haz que `document.title` sea siempre `Clics: N` (con el valor actual del contador) usando un efecto con las dependencias correctas.

```hint
`useEffect(() => { document.title = 'Clics: ' + n; }, [n]);`
```

```starter
function App() {
  const [n, setN] = useState(0);

  // tu efecto aquí

  return <button onClick={() => setN(n + 1)}>Sumar ({n})</button>;
}
```

```solution
function App() {
  const [n, setN] = useState(0);

  useEffect(() => {
    document.title = 'Clics: ' + n;
  }, [n]);

  return <button onClick={() => setN(n + 1)}>Sumar ({n})</button>;
}
```

```checks
await check('Inicialmente el título es "Clics: 0"', () => doc.title === 'Clics: 0');
await click(btn('Sumar'));
await click(btn('Sumar'));
await check('Tras 2 clics el título es "Clics: 2"', () => doc.title === 'Clics: 2');
```
:::

:::exercise Cronómetro con limpieza
Construye un cronómetro: el botón **Iniciar/Detener** alterna `corriendo`. Mientras corre, `seg` sube cada segundo (en un `<strong>`). Crea el intervalo **dentro de un `useEffect` que depende de `corriendo`** y límpialo con `clearInterval`.

```hint
Si `!corriendo` haz `return` temprano. Si no: `const id = setInterval(() => setSeg(s => s + 1), 1000); return () => clearInterval(id);`
```

```starter
function App() {
  const [seg, setSeg] = useState(0);
  const [corriendo, setCorriendo] = useState(false);

  // useEffect con intervalo aquí

  return (
    <div className="card row">
      <strong>{seg}</strong>
      <button onClick={() => setCorriendo(!corriendo)}>{corriendo ? 'Detener' : 'Iniciar'}</button>
    </div>
  );
}
```

```solution
function App() {
  const [seg, setSeg] = useState(0);
  const [corriendo, setCorriendo] = useState(false);

  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [corriendo]);

  return (
    <div className="card row">
      <strong>{seg}</strong>
      <button onClick={() => setCorriendo(!corriendo)}>{corriendo ? 'Detener' : 'Iniciar'}</button>
    </div>
  );
}
```

```checks
await check('Empieza en 0 y quieto', () => text('strong') === '0');
await click(btn('Iniciar'));
const ok = await waitFor(() => Number(text('strong')) >= 2, 4000);
await check('Al iniciar, el contador avanza cada segundo', () => ok);
await click(btn('Detener'));
const v = text('strong');
await wait(1300);
await check('Al detener, el contador deja de avanzar', () => text('strong') === v);
await check('Usas useEffect y clearInterval (limpieza)', () => /useEffect/.test(code) && /clearInterval/.test(code));
```
:::

:::quiz
? ¿Cuándo se ejecuta `useEffect(fn, [])`?
- Después de cada render
+ Solo tras el primer render (montaje) y su limpieza al desmontar
- Antes del primer render
- Nunca en desarrollo
> Con array vacío, el efecto no depende de nada reactivo.

? ¿Para qué sirve la función que retorna un efecto?
+ Para limpiar (cerrar intervalos, listeners, conexiones) antes del siguiente efecto o al desmontar
- Para devolver JSX
- Para actualizar el estado
- Para evitar dependencias
> Es la función de limpieza (*cleanup*).

? ¿Cuál de estos casos NO requiere un efecto?
- Cambiar `document.title`
- Suscribirse a `window.resize`
+ Calcular `total = precio * cantidad`
- Abrir un WebSocket
> Los valores derivados se calculan directamente durante el render.

? ¿Por qué un efecto puede ejecutarse dos veces en desarrollo?
+ Porque `StrictMode` monta, desmonta y vuelve a montar para comprobar que la limpieza es correcta
- Es un bug de React
- Porque el navegador lo duplica
- Porque hay dependencias vacías
> Solo ocurre en desarrollo, nunca en producción.
:::

:::summary
- Efectos = sincronizar con sistemas externos **tras** el render.
- Dependencias honestas; limpia lo que abres; cuidado con objetos/funciones nuevas en cada render.
- Antes de usar un efecto, pregúntate si basta con **calcular en el render** o usar un **manejador de eventos**.
:::
