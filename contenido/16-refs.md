---
id: refs
nivel: 2
titulo: Referencias con useRef
icono: 🎯
tiempo: 25 min
resumen: Accede a elementos del DOM y guarda valores mutables que no provocan renders.
---

:::goal
Usar `useRef` para **acceder al DOM** (foco, medidas, scroll) y para **guardar valores mutables** entre renders sin re-renderizar.
:::

## ¿Qué es una ref?

`useRef(valorInicial)` devuelve un objeto **estable** `{ current: valorInicial }` que **persiste entre renders**. Cambiar `ref.current` **no provoca un nuevo render**. Es una "caja" donde guardar cosas que React no necesita saber para dibujar.

| | `useState` | `useRef` |
|---|---|---|
| Cambiar el valor | Provoca re-render | **No** provoca re-render |
| Se lee durante el render | ✅ Sí | ❌ Evítalo (impuro) |
| Persistente entre renders | ✅ | ✅ |
| Uso típico | Datos que se muestran | DOM, ids de timers, valores "ocultos" |

## Uso 1: acceder a un elemento del DOM

Pasas la ref al atributo `ref` del elemento; React asigna ahí el nodo DOM real tras el commit.

```jsx run
function App() {
  const inputRef = useRef(null);

  return (
    <div className="card row">
      <input ref={inputRef} placeholder="Escribe algo…" />
      <button onClick={() => inputRef.current.focus()}>Enfocar</button>
      <button onClick={() => { inputRef.current.value = ''; inputRef.current.focus(); }}>Limpiar</button>
    </div>
  );
}
```

Casos típicos: `focus()`, `scrollIntoView()`, reproducir un `<video>`, medir (`getBoundingClientRect`), integrar librerías externas (mapas, gráficos).

## Uso 2: guardar valores mutables sin renderizar

Perfecto para ids de timers/intervalos, el valor anterior, contadores internos, banderas…

```jsx run title="Cronómetro: el id del intervalo vive en una ref"
function App() {
  const [seg, setSeg] = useState(0);
  const idRef = useRef(null);

  function iniciar() {
    if (idRef.current) return;                          // ya está corriendo
    idRef.current = setInterval(() => setSeg((s) => s + 1), 1000);
  }
  function detener() {
    clearInterval(idRef.current);
    idRef.current = null;
  }
  useEffect(() => detener, []);                         // limpieza al desmontar

  return (
    <div className="card row">
      <strong>{seg}s</strong>
      <button onClick={iniciar}>Iniciar</button>
      <button onClick={detener}>Detener</button>
    </div>
  );
}
```

### Valor anterior

```jsx run
function usePrevio(valor) {
  const ref = useRef();
  useEffect(() => { ref.current = valor; });   // se actualiza DESPUÉS del render
  return ref.current;                            // durante el render, aún tiene el valor anterior
}

function App() {
  const [n, setN] = useState(0);
  const previo = usePrevio(n);
  return <button onClick={() => setN(n + 1)}>Ahora: {n} · Antes: {previo ?? '—'}</button>;
}
```

:::warn No leas ni escribas `ref.current` durante el render
Hacerlo vuelve el componente impuro y puede dar resultados inconsistentes. Lee y modifica las refs en **manejadores de eventos** o **efectos**. (La excepción es la inicialización perezosa: `if (ref.current === null) ref.current = crear();`.)
:::

## Refs a elementos de una lista

Para **varios** nodos, usa una *callback ref* que guarde cada nodo en un `Map` (o un array):

```jsx run
function App() {
  const nodos = useRef(new Map());
  const items = ['Uno', 'Dos', 'Tres', 'Cuatro'];

  function irA(nombre) {
    nodos.current.get(nombre).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="col">
      <div className="row">{items.map((i) => <button key={i} onClick={() => irA(i)}>Ir a {i}</button>)}</div>
      <div style={{ height: 120, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
        {items.map((i) => (
          <div
            key={i}
            ref={(nodo) => {
              nodo ? nodos.current.set(i, nodo) : nodos.current.delete(i);
            }}
            style={{ height: 90, background: '#eef2ff', margin: '8px 0', display: 'grid', placeItems: 'center', borderRadius: 8 }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Refs en componentes propios

En **React 19**, `ref` es una **prop normal** para los componentes de función; ya no necesitas `forwardRef`:

```jsx run title="React 19: ref como prop"
function CampoTexto({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

function App() {
  const campo = useRef(null);
  return (
    <div className="card row">
      <CampoTexto ref={campo} placeholder="Campo con ref" />
      <button onClick={() => campo.current.focus()}>Enfocar</button>
    </div>
  );
}
```

:::info Antes de React 19
Había que envolver el componente con `forwardRef((props, ref) => …)`. Sigue funcionando, pero está en camino de quedar obsoleto. Para exponer métodos propios en vez del nodo DOM se usa `useImperativeHandle` (lección "Otros hooks").
:::

## Cuándo usar (y cuándo no) una ref

- ✅ Foco, scroll, medidas, reproducción multimedia, integración con APIs imperativas del navegador.
- ✅ Ids de timers, instancias de librerías externas, valores previos.
- ❌ Para datos que **se muestran** en pantalla → eso es **estado**.
- ❌ Para manipular el DOM que React ya controla (añadir/quitar nodos a mano).

:::exercise Enfocar y contar
Completa el componente:

1. El botón **Enfocar** debe poner el foco en el `<input>` usando una ref.
2. Cada vez que se pulsa **Enfocar**, aumenta un contador guardado en otra ref (no en estado) y muéstralo en `<p id="veces">` **solo cuando pulses el botón "Mostrar"** (que fuerza un render con un estado).

```hint
`const inputRef = useRef(null)` y `inputRef.current.focus()`. Para el contador: `const veces = useRef(0)`; `veces.current++`.
```
```hint
El botón "Mostrar" puede hacer `setMostrar(veces.current)` con un estado `mostrar`.
```

```starter
function App() {
  const [mostrar, setMostrar] = useState(0);

  return (
    <div className="card col">
      <input placeholder="Campo" />
      <div className="row">
        <button>Enfocar</button>
        <button>Mostrar</button>
      </div>
      <p id="veces">Veces: {mostrar}</p>
    </div>
  );
}
```

```solution
function App() {
  const [mostrar, setMostrar] = useState(0);
  const inputRef = useRef(null);
  const veces = useRef(0);

  function enfocar() {
    veces.current++;
    inputRef.current.focus();
  }

  return (
    <div className="card col">
      <input ref={inputRef} placeholder="Campo" />
      <div className="row">
        <button onClick={enfocar}>Enfocar</button>
        <button onClick={() => setMostrar(veces.current)}>Mostrar</button>
      </div>
      <p id="veces">Veces: {mostrar}</p>
    </div>
  );
}
```

```checks
await check('Al inicio muestra "Veces: 0"', () => text('#veces') === 'Veces: 0');
await click(btn('Enfocar'));
await check('Enfocar pone el foco en el input', () => doc.activeElement === $('input'));
await click(btn('Enfocar')); await click(btn('Enfocar'));
await check('Pulsar Enfocar NO actualiza la pantalla por sí solo (sigue en 0)', () => text('#veces') === 'Veces: 0');
await click(btn('Mostrar'));
await check('Mostrar revela el valor de la ref: 3', () => text('#veces') === 'Veces: 3');
```
:::

:::quiz
? ¿Qué ocurre al cambiar `ref.current`?
- Se vuelve a renderizar el componente
+ No se provoca ningún render
- Se reinicia el estado
- Se desmonta el componente
> Por eso son ideales para valores que no afectan a lo que se dibuja.

? ¿Cuándo está disponible `ref.current` de un elemento del DOM?
- Durante el render
+ Después del commit (en efectos y manejadores de eventos)
- Antes del montaje
- Nunca
> Antes de montar es `null`.

? ¿Cómo se pasa una ref a un componente de función propio en React 19?
- Con `forwardRef` obligatoriamente
+ Como una prop normal llamada `ref`
- Con `useContext`
- No se puede
> React 19 permite recibir `ref` como prop.
:::

:::summary
- `useRef` = caja `{ current }` persistente sin re-render.
- DOM: foco, scroll, medidas. Valores mutables: timers, previos.
- No leas/escribas refs durante el render; lo que se muestra va en estado.
:::
