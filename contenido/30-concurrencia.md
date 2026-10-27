---
id: concurrencia
nivel: 3
titulo: Renderizado concurrente: useTransition y useDeferredValue
icono: 🚦
tiempo: 35 min
resumen: Mantén la interfaz fluida priorizando lo urgente (teclear, clicar) sobre lo costoso (filtrar, renderizar listas enormes).
---

:::goal
Entender las **actualizaciones urgentes vs. transiciones** y usar `useTransition` y `useDeferredValue` para que la UI responda al instante aunque haya trabajo pesado.
:::

## El problema: un render lento bloquea todo

JavaScript corre en **un solo hilo**. Si renderizar una lista tarda 300 ms, el navegador no puede procesar tus pulsaciones de teclado en ese tiempo: el input se siente **congelado**.

```jsx run title="Sin concurrencia: escribe rápido y notarás el retraso"
function Lenta({ texto }) {
  const filas = [];
  for (let i = 0; i < 250; i++) {
    const t = performance.now();
    while (performance.now() - t < 1) {}                 // simula 1 ms de trabajo por fila
    filas.push(<li key={i}>{texto} #{i}</li>);
  }
  return <ul style={{ height: 120, overflow: 'auto' }}>{filas}</ul>;
}

function App() {
  const [texto, setTexto] = useState('');
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe aquí (250 ms por pulsación)" />
      <Lenta texto={texto} />
    </div>
  );
}
```

## Actualizaciones urgentes vs. transiciones

React 18+ distingue:

| Tipo | Ejemplos | Prioridad |
|---|---|---|
| **Urgente** | Teclear, hacer clic, arrastrar | Alta: debe sentirse instantáneo |
| **Transición** | Cambiar de vista, filtrar una lista enorme, resultados de búsqueda | Baja: puede esperar y ser **interrumpida** |

En modo concurrente, React puede **pausar** el render de una transición si llega una actualización urgente, atenderla y retomar después (o descartar el trabajo obsoleto). Tú solo marcas qué es "no urgente".

## `useTransition`

```jsx
const [pendiente, empezarTransicion] = useTransition();

empezarTransicion(() => {
  setResultados(filtrar(texto));          // este setState es de baja prioridad
});
```

- `pendiente` (`isPending`) es `true` mientras la transición está en curso → perfecto para un indicador.
- Todo `setState` dentro del callback se marca como **no urgente**.
- Para usarlo sin hook: `import { startTransition } from 'react'` (sin `isPending`).

```jsx run title="Con useTransition el input responde al instante"
function Lenta({ texto }) {
  const filas = [];
  for (let i = 0; i < 250; i++) {
    const t = performance.now();
    while (performance.now() - t < 1) {}
    filas.push(<li key={i}>{texto} #{i}</li>);
  }
  return <ul style={{ height: 120, overflow: 'auto' }}>{filas}</ul>;
}

function App() {
  const [entrada, setEntrada] = useState('');      // urgente: lo que ve el input
  const [texto, setTexto] = useState('');          // no urgente: lo que alimenta la lista lenta
  const [pendiente, empezarTransicion] = useTransition();

  function cambiar(e) {
    setEntrada(e.target.value);                           // se aplica ya
    empezarTransicion(() => setTexto(e.target.value));    // se aplica "cuando pueda"
  }

  return (
    <div className="card col">
      <input value={entrada} onChange={cambiar} placeholder="Escribe: ahora fluye" />
      <small className="muted">{pendiente ? '⏳ Actualizando lista…' : '✅ Lista al día'}</small>
      <div style={{ opacity: pendiente ? 0.5 : 1 }}><Lenta texto={texto} /></div>
    </div>
  );
}
```

## `useDeferredValue`

Cuando **no controlas** el `setState` (por ejemplo, el valor viene de una prop) o quieres algo más simple, difieres **el valor**: React devuelve primero el valor anterior y, en segundo plano, renderiza con el nuevo.

```jsx run title="useDeferredValue: la versión corta"
const Lenta = memo(function Lenta({ texto }) {          // memo: si 'texto' no cambia, no se re-renderiza
  const filas = [];
  for (let i = 0; i < 250; i++) {
    const t = performance.now();
    while (performance.now() - t < 1) {}
    filas.push(<li key={i}>{texto} #{i}</li>);
  }
  return <ul style={{ height: 120, overflow: 'auto' }}>{filas}</ul>;
});

function App() {
  const [texto, setTexto] = useState('');
  const textoDiferido = useDeferredValue(texto);        // se "retrasa" respecto a texto
  const desfasado = texto !== textoDiferido;

  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe: input fluido" />
      <div style={{ opacity: desfasado ? 0.5 : 1 }}><Lenta texto={textoDiferido} /></div>
    </div>
  );
}
```

:::info `memo` es importante aquí
`useDeferredValue` re-renderiza dos veces (primero con el valor viejo, luego con el nuevo). El componente lento debe estar envuelto en `memo` para que el primer render (con valor idéntico) sea gratis.
:::

### ¿Cuál elegir?

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| Qué marca | **La actualización** de estado (el *setter*) | **El valor** que consumes |
| Cuándo | Controlas el código que llama a `setState` | Recibes el valor (props) o quieres menos código |
| Indicador de espera | `isPending` | Comparar `valor !== valorDiferido` |

## Qué es (y qué no es) la concurrencia en React

- No es multihilo: sigue habiendo **un hilo**. React **divide** el trabajo de render en trozos y cede el control al navegador entre ellos.
- **No acelera** un render lento: lo hace **no bloqueante**. Si el cálculo es muy pesado, optimiza (memo, virtualización, Web Workers).
- Las transiciones **no** deben usarse para controlar inputs (el valor controlado siempre debe ser urgente).
- Si un estado dentro de una transición **suspende**, React mantiene la UI previa en lugar de mostrar el fallback (lo viste en la lección de Suspense).

## Reglas y límites de `startTransition`

- El callback debe ser **síncrono** en React 18; en React 19 puede ser **`async`** (se tratan como *Actions*, siguiente lección).
- Las actualizaciones dentro **no pueden controlar inputs de texto**.
- No sirven para rutinas de efectos ni para tareas que no sean actualizaciones de estado.

:::exercise Transición para el filtrado
`Resultados` es costoso. Haz que escribir en el input sea siempre fluido: usa **`useDeferredValue`** (o `useTransition`) para que la lista dependa de un valor diferido. Al final, la lista debe mostrar solo los elementos que contienen el texto.

```hint
`const textoDiferido = useDeferredValue(texto);` y pasa `textoDiferido` a `Resultados`; envuelve `Resultados` en `memo`.
```

```starter
function Resultados({ texto }) {
  const todos = Array.from({ length: 30 }, (_, i) => 'elemento ' + i);
  const visibles = todos.filter((x) => x.includes(texto));
  return <ul>{visibles.map((x) => <li key={x}>{x}</li>)}</ul>;
}

function App() {
  const [texto, setTexto] = useState('');
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} />
      <Resultados texto={texto} />
    </div>
  );
}
```

```solution
const Resultados = memo(function Resultados({ texto }) {
  const todos = Array.from({ length: 30 }, (_, i) => 'elemento ' + i);
  const visibles = todos.filter((x) => x.includes(texto));
  return <ul>{visibles.map((x) => <li key={x}>{x}</li>)}</ul>;
});

function App() {
  const [texto, setTexto] = useState('');
  const textoDiferido = useDeferredValue(texto);
  return (
    <div className="card col">
      <input value={texto} onChange={(e) => setTexto(e.target.value)} />
      <Resultados texto={textoDiferido} />
    </div>
  );
}
```

```checks
await check('Usas useDeferredValue o useTransition', () => /useDeferredValue|useTransition/.test(code));
await type($('input'), 'elemento 2');
const ok = await waitFor(() => $$('li').length === 11, 2000);
await check('El filtrado final es correcto ("elemento 2" → 11 resultados: 2, 20-29)', () => ok);
```
:::

:::quiz
? ¿Qué problema resuelven `useTransition` y `useDeferredValue`?
+ Mantener la UI responsiva cuando un render costoso bloquearía las interacciones urgentes
- Hacer que el código se ejecute en varios hilos
- Reducir el tamaño del bundle
- Evitar el uso de estado
> Priorizan lo urgente (teclear) sobre lo no urgente (renderizar la lista).

? ¿Qué devuelve `isPending` de `useTransition`?
+ `true` mientras la transición está en curso
- El resultado de la transición
- El número de renders
- Un error
> Sirve para mostrar un indicador de carga ligero.

? ¿Debe el valor de un `<input>` controlado ir dentro de `startTransition`?
- Sí, siempre
+ No: el estado del input debe actualizarse de forma urgente
- Solo si es numérico
- Solo con `useDeferredValue`
> Si no, el campo se sentiría "pegajoso".

? ¿Por qué se recomienda `memo` en el componente que recibe un valor diferido?
+ Para que el primer render con el valor antiguo no repita el trabajo costoso
- Porque es obligatorio
- Para que sea asíncrono
- Para evitar errores de hooks
> `useDeferredValue` provoca dos renders: uno con el valor viejo y otro con el nuevo.
:::

:::summary
- Urgente (input) vs. transición (resultado costoso, interrumpible).
- `useTransition` marca **la actualización**; `useDeferredValue` difiere **el valor**.
- No acelera el trabajo, solo evita bloquear; combínalo con `memo`, virtualización y Suspense.
:::
