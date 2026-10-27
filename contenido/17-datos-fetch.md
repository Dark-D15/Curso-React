---
id: datos-fetch
nivel: 2
titulo: Obtener datos (fetch) y estados de carga
icono: 🌐
tiempo: 40 min
resumen: Pide datos a una API con useEffect, maneja carga/error, evita condiciones de carrera y conoce las alternativas modernas.
---

:::goal
Cargar datos asíncronos con `useEffect`, modelar los estados **cargando / error / datos**, **cancelar** peticiones obsoletas y saber cuándo conviene una librería.
:::

Casi toda aplicación real pide datos a un servidor. El patrón básico: **estado para los datos + efecto que los pide + UI para cada estado posible**.

:::info Sobre los ejemplos
Aquí no hay internet garantizado, así que usamos una **API simulada** con `Promise` y `setTimeout`. Con `fetch` real el código es idéntico: solo cambia la función que pide los datos.
:::

## El patrón básico

```jsx run
// API simulada: devuelve una promesa que tarda 800 ms
const pedirUsuarios = () =>
  new Promise((ok) =>
    setTimeout(() => ok([{ id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Luis' }, { id: 3, nombre: 'Marta' }]), 800)
  );

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;                       // evita actualizar si el componente se desmontó
    pedirUsuarios()
      .then((datos) => { if (!cancelado) setUsuarios(datos); })
      .catch((e) => { if (!cancelado) setError(e.message); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, []);

  if (cargando) return <p className="muted">⏳ Cargando usuarios…</p>;
  if (error) return <p className="bad">❌ {error}</p>;
  return <ul>{usuarios.map((u) => <li key={u.id}>{u.nombre}</li>)}</ul>;
}
```

Con `fetch` real quedaría así:

```jsx
useEffect(() => {
  const controlador = new AbortController();

  async function cargar() {
    try {
      const res = await fetch('https://api.ejemplo.com/usuarios', { signal: controlador.signal });
      if (!res.ok) throw new Error('Error ' + res.status);      // fetch NO lanza error en 404/500
      setUsuarios(await res.json());
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);          // ignorar cancelaciones
    } finally {
      setCargando(false);
    }
  }
  cargar();

  return () => controlador.abort();                              // cancela si cambia/desmonta
}, []);
```

:::warn `useEffect` no puede ser `async`
`useEffect(async () => {…})` devuelve una promesa en vez de una función de limpieza. Declara una función `async` **dentro** del efecto y llámala (como arriba).
:::

## Los tres estados siempre

Al pedir datos hay **al menos tres** escenarios que tu UI debe tratar:

| Estado | Qué mostrar |
|---|---|
| Cargando | Spinner / *skeleton* |
| Error | Mensaje claro + opción de **reintentar** |
| Éxito (con datos / vacío) | Los datos, o un "no hay resultados" |

## Condiciones de carrera (race conditions)

Si el efecto depende de un parámetro (una búsqueda, un id), el usuario puede cambiarlo **antes** de que termine la petición anterior. Si la respuesta vieja llega **después** de la nueva, pisaría los datos correctos. Solución: **ignorar o cancelar** las respuestas obsoletas con la limpieza del efecto.

```jsx run title="Búsqueda segura: prueba escribir rápido"
// Latencia aleatoria: las respuestas pueden llegar desordenadas
const buscar = (texto) =>
  new Promise((ok) =>
    setTimeout(() => ok(['React', 'Redux', 'Remix', 'Ruby', 'Rust'].filter((x) => x.toLowerCase().includes(texto.toLowerCase()))), Math.random() * 900)
  );

function App() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    let ignorar = false;
    setBuscando(true);
    buscar(texto).then((r) => {
      if (!ignorar) {              // solo la ÚLTIMA petición puede actualizar el estado
        setResultados(r);
        setBuscando(false);
      }
    });
    return () => { ignorar = true; };
  }, [texto]);

  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: re, r, ru…" />
      {buscando ? <p className="muted">Buscando…</p> : <ul>{resultados.map((r) => <li key={r}>{r}</li>)}</ul>}
    </div>
  );
}
```

Prueba a quitar el `if (!ignorar)`: con latencias aleatorias aparecerán resultados de una búsqueda anterior.

## Reintentar y recargar

Añade una pieza de estado que cambie para **volver a ejecutar** el efecto:

```jsx run
let intentos = 0;
const apiInestable = () => new Promise((ok, fallo) => setTimeout(() => (++intentos < 3 ? fallo(new Error('Servidor ocupado')) : ok('¡Datos recibidos! (intento ' + intentos + ')')), 600));

function App() {
  const [dato, setDato] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);        // cambiarlo vuelve a lanzar el efecto

  useEffect(() => {
    let ignorar = false;
    setCargando(true); setError(null);
    apiInestable()
      .then((d) => !ignorar && setDato(d))
      .catch((e) => !ignorar && setError(e.message))
      .finally(() => !ignorar && setCargando(false));
    return () => { ignorar = true; };
  }, [version]);

  return (
    <div className="card col">
      {cargando && <p>⏳ Cargando…</p>}
      {error && <p className="bad">❌ {error}</p>}
      {dato && !cargando && <p className="ok">✅ {dato}</p>}
      <button onClick={() => setVersion((v) => v + 1)} disabled={cargando}>Reintentar</button>
    </div>
  );
}
```

## Buenas prácticas

- **Siempre** maneja `loading` y `error`. Comprueba `res.ok` con `fetch`.
- **Cancela o ignora** respuestas obsoletas (`AbortController` o bandera).
- No dupliques los datos del servidor en varios estados: guárdalos una vez y deriva lo demás.
- Para **mutaciones** (crear/editar/borrar) usa manejadores de eventos, no efectos.
- Evita cascadas (*waterfalls*): pedir datos hijo solo cuando el padre ya cargó es lento si podían pedirse a la vez.

## ¿Y las librerías?

Escribir esto a mano en cada componente es repetitivo y propenso a errores: caché, reintentos, refresco al volver a la pestaña, deduplicación, paginación, actualización optimista… Por eso en proyectos reales se usa:

| Opción | Para qué |
|---|---|
| **TanStack Query** (React Query) | Caché y estado del servidor en SPAs (lección avanzada). |
| **SWR** | Alternativa más ligera, "stale-while-revalidate". |
| **Loaders de React Router / Next.js** | Datos cargados por la ruta, antes de renderizar. |
| **`use` + Suspense** (React 19) | Leer promesas directamente en el render. |
| **Server Components** | Pedir datos en el servidor, sin enviar JS al cliente. |

:::exercise Carga con error y reintento
La API `pedirDatos` falla la **primera** vez y funciona la segunda. Implementa el componente para que:

- Mientras carga muestre `Cargando…`.
- Si falla muestre el mensaje de error en `<p id="error">` y un botón **Reintentar**.
- Si funciona muestre la lista de `<li>` con los nombres.

```hint
Usa tres estados (`datos`, `cargando`, `error`) y un contador `intento` en las dependencias del `useEffect`; el botón hace `setIntento(i => i + 1)`.
```
```hint
Al empezar cada carga: `setCargando(true); setError(null);`.
```

```starter
let llamadas = 0;
const pedirDatos = () =>
  new Promise((ok, fallo) =>
    setTimeout(() => (++llamadas === 1 ? fallo(new Error('Sin conexión')) : ok(['Ana', 'Luis', 'Marta'])), 300)
  );

function App() {
  // Estados, efecto y UI aquí
  return <div className="card"></div>;
}
```

```solution
let llamadas = 0;
const pedirDatos = () =>
  new Promise((ok, fallo) =>
    setTimeout(() => (++llamadas === 1 ? fallo(new Error('Sin conexión')) : ok(['Ana', 'Luis', 'Marta'])), 300)
  );

function App() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let ignorar = false;
    setCargando(true);
    setError(null);
    pedirDatos()
      .then((d) => { if (!ignorar) setDatos(d); })
      .catch((e) => { if (!ignorar) setError(e.message); })
      .finally(() => { if (!ignorar) setCargando(false); });
    return () => { ignorar = true; };
  }, [intento]);

  return (
    <div className="card col">
      {cargando && <p>Cargando…</p>}
      {error && <p id="error">{error}</p>}
      {error && <button onClick={() => setIntento((i) => i + 1)}>Reintentar</button>}
      {!cargando && !error && <ul>{datos.map((n) => <li key={n}>{n}</li>)}</ul>}
    </div>
  );
}
```

```checks
await check('Al inicio muestra "Cargando…"', () => text('p').includes('Cargando'));
const err = await waitFor(() => $('#error'), 2000);
await check('Tras fallar muestra el error "Sin conexión"', () => err && text('#error') === 'Sin conexión');
await check('Aparece el botón Reintentar', () => btn('Reintentar'));
await click(btn('Reintentar'));
const ok = await waitFor(() => $$('li').length === 3, 2000);
await check('Al reintentar se muestran 3 nombres', () => ok);
await check('Ya no se muestra el error', () => !$('#error'));
```
:::

:::quiz
? ¿Qué problema evita la bandera `ignorar`/`cancelado` en la limpieza del efecto?
+ Que una respuesta antigua (o de un componente desmontado) actualice el estado
- Que la API devuelva errores
- Que el efecto se ejecute dos veces
- Que fetch sea lento
> Es la solución clásica a las *race conditions*.

? ¿`fetch` lanza error automáticamente en respuestas 404 o 500?
- Sí
+ No: solo rechaza por errores de red; debes comprobar `res.ok`
- Solo en 500
- Depende del navegador
> Lanza tú el error cuando `!res.ok`.

? ¿Por qué no se puede pasar una función `async` directamente a `useEffect`?
+ Porque devolvería una promesa en lugar de una función de limpieza
- Porque `async` no existe en React
- Porque bloquea el render
- Por seguridad
> Declara la función async dentro y llámala.

? ¿Cuál es la principal ventaja de TanStack Query frente a `useEffect` + `fetch`?
+ Caché, reintentos, deduplicación y refresco automáticos ya resueltos
- Que no necesita servidor
- Que es nativo del navegador
- Que sustituye a React
> Gestiona el *estado del servidor* de forma robusta.
:::

:::summary
- Patrón: estados `datos/cargando/error` + `useEffect` con limpieza.
- Cancela/ignora respuestas obsoletas; comprueba `res.ok`.
- Para apps reales: TanStack Query, SWR, loaders del framework o `use` + Suspense.
:::
