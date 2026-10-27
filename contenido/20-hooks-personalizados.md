---
id: hooks-personalizados
nivel: 2
titulo: Hooks personalizados
icono: 🪝
tiempo: 35 min
resumen: Extrae y reutiliza lógica con estado entre componentes. Casos prácticos: useToggle, useDebounce, useLocalStorage y más.
---

:::goal
Crear tus propios hooks para **reutilizar lógica** (no UI), conocer el contrato (nombre `use…`, reglas) y construir una pequeña caja de herramientas.
:::

## ¿Qué es un hook personalizado?

Es una **función** cuyo nombre empieza por `use` y que **llama a otros hooks**. Te permite extraer lógica con estado o efectos y reutilizarla en varios componentes.

:::info Comparten la lógica, no el estado
Cada vez que llamas a un hook personalizado, obtienes **su propio estado independiente**. Dos componentes que usan `useToggle()` no comparten el valor; solo comparten el *código*.
:::

## Ejemplo 1: `useToggle`

Antes (repetido en cada componente):

```jsx
const [abierto, setAbierto] = useState(false);
const alternar = () => setAbierto((v) => !v);
```

Después, extraído:

```jsx run
function useToggle(inicial = false) {
  const [valor, setValor] = useState(inicial);
  const alternar = useCallback(() => setValor((v) => !v), []);
  return [valor, alternar, setValor];
}

function App() {
  const [menu, alternarMenu] = useToggle();
  const [oscuro, alternarOscuro] = useToggle(true);   // independiente del anterior

  return (
    <div className="card col">
      <button onClick={alternarMenu}>{menu ? 'Cerrar' : 'Abrir'} menú</button>
      {menu && <ul><li>Inicio</li><li>Acerca de</li></ul>}
      <label><input type="checkbox" checked={oscuro} onChange={alternarOscuro} /> Modo oscuro: {String(oscuro)}</label>
    </div>
  );
}
```

## Ejemplo 2: `useLocalStorage`

Un estado que **persiste** entre visitas. Observa que reutiliza `useState` y `useEffect`:

```jsx run
function useLocalStorage(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado !== null ? JSON.parse(guardado) : inicial;
    } catch { return inicial; }
  });

  useEffect(() => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
  }, [clave, valor]);

  return [valor, setValor];
}

function App() {
  const [nombre, setNombre] = useLocalStorage('demo-nombre', '');
  return (
    <div className="card col">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Escribe y recarga el ejemplo" />
      <p>Hola, {nombre || 'desconocido'} 👋 (se guarda en localStorage)</p>
    </div>
  );
}
```

## Ejemplo 3: `useDebounce`

Retrasa un valor hasta que el usuario deja de cambiarlo (típico en buscadores):

```jsx run
function useDebounce(valor, retraso = 500) {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), retraso);
    return () => clearTimeout(id);       // cada pulsación cancela el temporizador anterior
  }, [valor, retraso]);
  return debounced;
}

function App() {
  const [texto, setTexto] = useState('');
  const buscado = useDebounce(texto, 600);
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe rápido…" />
      <p>Escribiste: <b>{texto}</b></p>
      <p>Buscando (tras 600ms): <b>{buscado}</b></p>
    </div>
  );
}
```

## Ejemplo 4: `useOnline`, `useWindowSize`… con eventos del navegador

```jsx run
function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

function App() {
  const online = useOnline();
  return <p>{online ? '🟢 Con conexión' : '🔴 Sin conexión'}</p>;
}
```

## Ejemplo 5: `useFetch` (sencillo)

Combina varios hooks: estado + efecto + limpieza. (Para producción, usa TanStack Query.)

```jsx run
function useAsync(funcion, deps) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  useEffect(() => {
    let ignorar = false;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    funcion()
      .then((datos) => !ignorar && setEstado({ datos, error: null, cargando: false }))
      .catch((error) => !ignorar && setEstado({ datos: null, error, cargando: false }));
    return () => { ignorar = true; };
  }, deps);
  return estado;
}

const pedirChiste = (n) => new Promise((ok) => setTimeout(() => ok('Chiste #' + n + ': ¿Por qué React es tan sociable? Porque tiene muchos componentes.'), 500));

function App() {
  const [n, setN] = useState(1);
  const { datos, cargando } = useAsync(() => pedirChiste(n), [n]);
  return (
    <div className="card col">
      <p>{cargando ? '⏳ Cargando…' : datos}</p>
      <button onClick={() => setN(n + 1)}>Siguiente</button>
    </div>
  );
}
```

## Cómo diseñar un buen hook

1. **Nombre `use…`**: permite que el linter verifique las reglas de los hooks.
2. **Una responsabilidad** clara. Compón hooks pequeños en lugar de uno gigante.
3. **Devuelve lo que el consumidor necesita**: un array `[valor, acción]` (como `useState`) para 2 valores, un **objeto** `{ datos, error, cargando }` para más.
4. **Estabilidad**: si devuelves funciones, estabilízalas con `useCallback` cuando alguien pueda ponerlas en dependencias.
5. **Limpieza** de todo lo que abras en efectos.
6. **Argumentos configurables** con valores por defecto sensatos.

:::warn No todo es un hook
Si una función no usa ningún hook por dentro, **no necesita llamarse `use…`**; es una función normal. Y si lo que quieres reutilizar es **UI**, eso es un componente, no un hook.
:::

## Hooks de terceros que conviene conocer

Librerías como **usehooks-ts**, **react-use** o **@uidotdev/usehooks** incluyen decenas de hooks listos (`useMediaQuery`, `useClickOutside`, `useCopyToClipboard`…). Antes de escribir uno, revisa si ya existe una versión probada.

:::exercise Crea useToggle
Implementa el hook `useToggle(inicial = false)`: devuelve `[valor, alternar]`. `App` ya lo usa para mostrar u ocultar un mensaje con un botón **Mostrar / Ocultar**.

```hint
Usa `useState` dentro del hook y devuelve `[valor, () => setValor(v => !v)]`.
```

```starter
function useToggle(inicial = false) {
  // implementa aquí
  return [false, () => {}];
}

function App() {
  const [visible, alternar] = useToggle(false);
  return (
    <div className="card col">
      <button onClick={alternar}>{visible ? 'Ocultar' : 'Mostrar'}</button>
      {visible && <p id="secreto">🎉 ¡Mensaje secreto!</p>}
    </div>
  );
}
```

```solution
function useToggle(inicial = false) {
  const [valor, setValor] = useState(inicial);
  const alternar = () => setValor((v) => !v);
  return [valor, alternar];
}

function App() {
  const [visible, alternar] = useToggle(false);
  return (
    <div className="card col">
      <button onClick={alternar}>{visible ? 'Ocultar' : 'Mostrar'}</button>
      {visible && <p id="secreto">🎉 ¡Mensaje secreto!</p>}
    </div>
  );
}
```

```checks
await check('Al inicio el mensaje está oculto y el botón dice "Mostrar"', () => !$('#secreto') && btn('Mostrar'));
await click(btn('Mostrar'));
await check('Tras pulsar se ve el mensaje y el botón dice "Ocultar"', () => $('#secreto') && btn('Ocultar'));
await click(btn('Ocultar'));
await check('Un segundo clic lo vuelve a ocultar', () => !$('#secreto'));
```
:::

:::exercise Crea useDebounce
Implementa `useDebounce(valor, ms)`: devuelve el valor **solo después de que haya pasado `ms` sin cambios**. Usa `useState` + `useEffect` con `setTimeout` y limpia el temporizador.

```hint
`useEffect(() => { const id = setTimeout(() => setDeb(valor), ms); return () => clearTimeout(id); }, [valor, ms]);`
```

```starter
function useDebounce(valor, ms) {
  return valor;   // ← ahora no hay ningún retraso
}

function App() {
  const [texto, setTexto] = useState('');
  const buscado = useDebounce(texto, 400);
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe" />
      <p id="vivo">{texto}</p>
      <p id="deb">{buscado}</p>
    </div>
  );
}
```

```solution
function useDebounce(valor, ms) {
  const [deb, setDeb] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDeb(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return deb;
}

function App() {
  const [texto, setTexto] = useState('');
  const buscado = useDebounce(texto, 400);
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe" />
      <p id="vivo">{texto}</p>
      <p id="deb">{buscado}</p>
    </div>
  );
}
```

```checks
await type($('input'), 'hola');
await check('El texto en vivo se actualiza al instante', () => text('#vivo') === 'hola');
await check('El valor "debounced" aún NO se ha actualizado', () => text('#deb') === '');
const ok = await waitFor(() => text('#deb') === 'hola', 1500);
await check('Pasado el retraso, el valor debounced se actualiza', () => ok);
```
:::

:::quiz
? ¿Qué requisito tiene un hook personalizado?
- Debe devolver JSX
+ Su nombre empieza por `use` y puede llamar a otros hooks
- Debe ser asíncrono
- Debe estar en su propio paquete npm
> El prefijo `use` permite al linter aplicar las reglas de los hooks.

? Si dos componentes llaman a `useToggle()`, ¿comparten el estado?
- Sí, es global
+ No, cada llamada crea su propio estado independiente
- Solo si están en el mismo archivo
- Solo si son hermanos
> Los hooks personalizados reutilizan lógica, no estado.

? ¿Cuál de estas cosas NO es buen candidato a hook personalizado?
- Escuchar el tamaño de la ventana
+ Un botón con estilos
- Persistir un valor en `localStorage`
- Un temporizador con limpieza
> La UI reutilizable se hace con componentes.
:::

:::summary
- Hook personalizado = función `useAlgo` que compone otros hooks para reutilizar **lógica**.
- Estado independiente en cada uso; limpieza de lo que abras; API clara.
- Empieza extrayendo cuando repites lógica; revisa librerías de hooks existentes.
:::
