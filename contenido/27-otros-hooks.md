---
id: otros-hooks
nivel: 3
titulo: Otros hooks: useId, useLayoutEffect, useImperativeHandle y más
icono: 🧰
tiempo: 35 min
resumen: Los hooks menos frecuentes pero imprescindibles en casos concretos: ids únicos, medición, API imperativa, efectos con eventos y más.
---

:::goal
Conocer los hooks "especializados": `useId`, `useLayoutEffect`, `useImperativeHandle`, `useEffectEvent`, `useSyncExternalStore`, `useDebugValue` e `useInsertionEffect`, y saber cuándo recurrir a cada uno.
:::

## `useId`: identificadores únicos y estables

Genera un id **único por instancia**, estable entre servidor y cliente (evita desajustes de hidratación). Ideal para asociar `label`/`input` o atributos ARIA en componentes reutilizables.

```jsx run
function CampoTexto({ etiqueta }) {
  const id = useId();                       // algo como ":r1:" — no lo uses como key ni como selector CSS
  return (
    <div className="col" style={{ gap: 2 }}>
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} />
    </div>
  );
}

function App() {
  return (
    <div className="card col">
      <CampoTexto etiqueta="Nombre" />
      <CampoTexto etiqueta="Apellido" />   {/* cada instancia tiene su propio id: clic en la etiqueta enfoca SU input */}
    </div>
  );
}
```

:::warn No uses `useId` para `key`
Las `key` de las listas deben venir de los **datos**. `useId` es para atributos del DOM (`id`, `aria-*`).
:::

## `useLayoutEffect`: medir antes de pintar

Se ejecuta **de forma síncrona tras actualizar el DOM y antes de que el navegador pinte**. Úsalo cuando necesites **leer el layout** (tamaño/posición) y **ajustar** algo antes de que el usuario lo vea, para evitar parpadeos.

```jsx run title="Tooltip que se posiciona según su tamaño real"
function Tooltip({ texto, children }) {
  const [visible, setVisible] = useState(false);
  const [izquierda, setIzquierda] = useState(0);
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!visible) return;
    const w = ref.current.getBoundingClientRect().width;
    setIzquierda(-w / 2 + 20);                // se centra con su ancho REAL, antes de pintar
  }, [visible, texto]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
          onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span ref={ref} style={{ position: 'absolute', top: '120%', left: izquierda, background: '#0f172a', color: '#fff', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', fontSize: 13 }}>
          {texto}
        </span>
      )}
    </span>
  );
}

function App() {
  return <div className="card"><Tooltip texto="Soy un tooltip con texto bastante largo"><button>Pasa el ratón</button></Tooltip><div style={{ height: 40 }} /></div>;
}
```

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Cuándo | Después de pintar (asíncrono) | Antes de pintar (síncrono, bloquea el pintado) |
| Uso | La inmensa mayoría de efectos | Medir/ajustar DOM sin parpadeo |
| SSR | Seguro | Avisa/no se ejecuta en servidor |

Úsalo con moderación: bloquea el pintado.

## `useImperativeHandle`: exponer una API propia

A veces el padre necesita **llamar métodos** del hijo (`focus()`, `reset()`, `play()`), pero no debes exponer todo el nodo DOM. Con `ref` como prop (React 19) defines exactamente qué métodos se exponen:

```jsx run
function CampoConSacudida({ ref, ...props }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    enfocar() { inputRef.current.focus(); },
    limpiar() { inputRef.current.value = ''; },
    sacudir() {
      inputRef.current.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], 250);
    },
  }), []);

  return <input ref={inputRef} {...props} />;
}

function App() {
  const campo = useRef(null);
  return (
    <div className="card row">
      <CampoConSacudida ref={campo} placeholder="Campo con API propia" />
      <button onClick={() => campo.current.enfocar()}>Enfocar</button>
      <button onClick={() => campo.current.sacudir()}>Sacudir</button>
      <button onClick={() => campo.current.limpiar()}>Limpiar</button>
    </div>
  );
}
```

:::tip Prefiere props declarativas
Antes de recurrir a API imperativa, ¿se puede resolver con una prop (`abierto`, `valor`)? Úsalo para casos como foco, scroll, animaciones o integraciones.
:::

## `useEffectEvent`: leer lo último sin re-sincronizar

Disponible en **React 19.2**. A veces un efecto necesita leer el **último valor** de una prop/estado (por ejemplo para un `console.log` o una notificación) **sin** que ese valor sea una dependencia que reinicie el efecto.

```jsx run title="La conexión no se reinicia al cambiar el tema"
function Sala({ sala, tema }) {
  // "Evento de efecto": siempre ve el último `tema`, pero no es reactivo
  const alConectar = useEffectEvent(() => {
    console.log('Conectado a ' + sala + ' con el tema ' + tema);
  });

  useEffect(() => {
    alConectar();                         // no se declara en las dependencias
    return () => console.log('Desconectado de ' + sala);
  }, [sala]);                             // solo se reconecta si cambia la sala

  return <p>Sala: {sala} · Tema: {tema}</p>;
}

function App() {
  const [sala, setSala] = useState('general');
  const [tema, setTema] = useState('claro');
  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => setSala(sala === 'general' ? 'react' : 'general')}>Cambiar sala</button>
        <button onClick={() => setTema(tema === 'claro' ? 'oscuro' : 'claro')}>Cambiar tema</button>
      </div>
      <Sala sala={sala} tema={tema} />
    </div>
  );
}
```

Mira la consola: cambiar el **tema** no reconecta; cambiar la **sala** sí. Reglas: solo se llama **desde dentro de efectos** y no se pasa a otros componentes.

## `useSyncExternalStore`

Ya lo viste en la lección de estado global. Sirve también para suscribirse a **APIs del navegador** de forma consistente:

```jsx run
function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(consulta); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(consulta).matches,
    () => false                        // valor para el servidor (SSR)
  );
}

function App() {
  const ancho = useMediaQuery('(min-width: 500px)');
  return <p>{ancho ? '🖥️ Pantalla ancha (≥ 500px)' : '📱 Pantalla estrecha (< 500px)'}</p>;
}
```

## `useDebugValue`

Muestra una etiqueta en **React DevTools** junto a tu hook personalizado:

```jsx
function useOnline() {
  const online = useSyncExternalStore(suscribir, () => navigator.onLine);
  useDebugValue(online ? 'En línea' : 'Sin conexión');
  return online;
}
```

## `useInsertionEffect`

Se ejecuta **antes** de cualquier mutación del DOM. Está pensado para autores de librerías **CSS-in-JS** que inyectan reglas `<style>`. Si no escribes una librería de estilos, no lo necesitarás.

## Resumen de cuándo usar cada hook

| Hook | Caso |
|---|---|
| `useState` / `useReducer` | Estado local |
| `useEffect` | Sincronizar con sistemas externos |
| `useLayoutEffect` | Medir y ajustar layout antes de pintar |
| `useRef` | DOM y valores mutables |
| `useImperativeHandle` | Exponer métodos controlados al padre |
| `useContext` / `use` | Leer contexto (y promesas con `use`) |
| `useMemo` / `useCallback` | Memoización puntual |
| `useId` | Ids únicos/accesibles |
| `useEffectEvent` | Leer lo último dentro de un efecto |
| `useSyncExternalStore` | Stores externos y APIs del navegador |
| `useTransition` / `useDeferredValue` | UI fluida (lección de concurrencia) |
| `useActionState` / `useOptimistic` / `useFormStatus` | Formularios y mutaciones (lección React 19) |

:::exercise Etiquetas accesibles con useId
`CampoSwitch` debe asociar su `<label>` con el `<input type="checkbox">` mediante un id generado con `useId`. Así hacer clic en el texto debe activar el checkbox, incluso con **dos** campos a la vez.

```hint
`const id = useId();` → `<input id={id} .../>` y `<label htmlFor={id}>`.
```

```starter
function CampoSwitch({ etiqueta }) {
  return (
    <div>
      <input type="checkbox" />
      <label>{etiqueta}</label>
    </div>
  );
}

function App() {
  return (
    <div className="card col">
      <CampoSwitch etiqueta="Notificaciones" />
      <CampoSwitch etiqueta="Newsletter" />
    </div>
  );
}
```

```solution
function CampoSwitch({ etiqueta }) {
  const id = useId();
  return (
    <div>
      <input id={id} type="checkbox" />
      <label htmlFor={id}>{etiqueta}</label>
    </div>
  );
}

function App() {
  return (
    <div className="card col">
      <CampoSwitch etiqueta="Notificaciones" />
      <CampoSwitch etiqueta="Newsletter" />
    </div>
  );
}
```

```checks
const cajas = $$('input[type=checkbox]');
await check('Hay dos checkboxes con ids distintos', () => cajas.length === 2 && cajas[0].id && cajas[1].id && cajas[0].id !== cajas[1].id);
await check('Cada checkbox tiene su <label> asociado', () => cajas.every(c => c.labels && c.labels.length === 1));
await click(byText('Newsletter', 'label'));
await check('Pulsar la etiqueta "Newsletter" marca SU checkbox (y no el otro)', () => cajas[1].checked && !cajas[0].checked);
```
:::

:::quiz
? ¿Para qué sirve `useId`?
+ Para generar ids únicos y estables (válidos también con SSR) para atributos como `htmlFor` o `aria-*`
- Para generar `key` de listas
- Para identificar usuarios
- Para ids de base de datos
> Cada instancia del componente obtiene un id propio.

? ¿Cuándo usar `useLayoutEffect` en lugar de `useEffect`?
+ Cuando necesitas medir o ajustar el DOM antes de que el navegador pinte, para evitar parpadeos
- Siempre, es más rápido
- Para peticiones HTTP
- Para suscripciones
> Bloquea el pintado, así que úsalo solo cuando haga falta.

? ¿Qué hace `useImperativeHandle`?
+ Define qué valores/métodos expone un componente a través de su `ref`
- Crea un estado imperativo
- Ejecuta efectos en el servidor
- Memoiza un componente
> Útil para APIs como `enfocar()` o `reiniciar()`.

? ¿Qué problema resuelve `useEffectEvent`?
+ Leer el último valor de props/estado dentro de un efecto sin convertirlo en dependencia reactiva
- Hacer peticiones más rápido
- Evitar el uso de `useRef`
- Memoizar funciones para `memo`
> Evita reconexiones/reinicios innecesarios del efecto.
:::

:::summary
- `useId` (ids/ARIA), `useLayoutEffect` (medir antes de pintar), `useImperativeHandle` (API del hijo).
- `useEffectEvent` para leer lo último sin re-sincronizar; `useSyncExternalStore` para stores y APIs del navegador.
- `useDebugValue` e `useInsertionEffect` para herramientas y librerías.
:::
