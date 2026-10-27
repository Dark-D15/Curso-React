---
id: portales-errores
nivel: 3
titulo: Portales y Error Boundaries
icono: 🛡️
tiempo: 35 min
resumen: Renderiza fuera del flujo del DOM (modales, tooltips) y aísla fallos para que un error no tire toda la aplicación.
---

:::goal
Usar **portales** para modales/tooltips y **Error Boundaries** para capturar errores de renderizado y mostrar interfaces de respaldo, entendiendo qué errores **no** captura un boundary.
:::

## Portales: `createPortal`

Un **portal** renderiza hijos en **otro nodo del DOM** (normalmente `document.body`) manteniendo su lugar en el **árbol de React** (props, contexto y eventos funcionan como si estuvieran dentro).

¿Para qué? Los modales, menús desplegables y tooltips pueden quedar **recortados** por un ancestro con `overflow: hidden`, o tapados por problemas de `z-index`/`transform`. Un portal los saca de ahí.

```jsx run title="Modal con portal"
function Modal({ abierto, onCerrar, children }) {
  if (!abierto) return null;
  return createPortal(                              // import { createPortal } from 'react-dom'
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 14, minWidth: 240, boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}>
        {children}
        <p><button onClick={onCerrar}>Cerrar</button></p>
      </div>
    </div>,
    document.body                                   // el nodo de destino
  );
}

function App() {
  const [abierto, setAbierto] = useState(false);
  return (
    // Aunque este contenedor tenga overflow: hidden, el modal NO se recorta
    <div className="card" style={{ overflow: 'hidden', height: 70 }}>
      <button onClick={() => setAbierto(true)}>Abrir modal</button>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)}>
        <h3>🪟 Soy un portal</h3>
        <p>Vivo en <code>document.body</code>, pero sigo siendo hijo de <code>App</code> en React.</p>
      </Modal>
    </div>
  );
}
```

### Detalles importantes

- **Los eventos burbujean por el árbol de React**, no por el del DOM: un clic dentro del portal llega a los `onClick` de los componentes padre (por eso usamos `stopPropagation` arriba).
- El **contexto** funciona igual (un `ThemeContext` del padre llega al modal).
- Accesibilidad de modales: `role="dialog"`, `aria-modal`, **atrapar el foco**, cerrar con [[Esc]] y devolver el foco al abrir/cerrar. Considera el elemento nativo `<dialog>` o librerías (Radix, React Aria).

## Error Boundaries

Si un componente **lanza un error mientras renderiza**, React desmonta **toda** la aplicación (pantalla en blanco). Un **Error Boundary** es un componente que captura errores de sus **descendientes** y muestra una UI de respaldo.

:::info Siguen siendo componentes de clase
Los boundaries requieren los métodos `static getDerivedStateFromError` y/o `componentDidCatch`, que **no tienen equivalente en hooks**. Escribes la clase una vez y la reutilizas (o usas la librería `react-error-boundary`).
:::

```jsx run title="Un componente roto no tira a los demás"
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }

  static getDerivedStateFromError(error) {        // actualiza el estado para mostrar el fallback
    return { error };
  }
  componentDidCatch(error, info) {                // registrar el error (Sentry, logs…)
    console.log('Registrado:', error.message);
  }
  reiniciar = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="card col" role="alert" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <strong>😵 Algo salió mal</strong>
          <small>{this.state.error.message}</small>
          <button onClick={this.reiniciar}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Bomba({ explotar }) {
  if (explotar) throw new Error('¡Boom! Este componente falló al renderizar');
  return <p>💣 Todo en calma… por ahora.</p>;
}

function App() {
  const [explotar, setExplotar] = useState(false);
  return (
    <div className="col">
      <button onClick={() => setExplotar(true)}>Romper el componente</button>
      <ErrorBoundary key={String(explotar)}>
        <Bomba explotar={explotar} />
      </ErrorBoundary>
      <p id="estable">✅ Esta parte de la app sigue funcionando.</p>
    </div>
  );
}
```

### ¿Dónde colocar los boundaries?

- Uno **global** (para no dejar nunca la pantalla en blanco).
- Otros **granulares** alrededor de widgets independientes (un gráfico, un comentario, un panel), para que el fallo quede **aislado**.
- Alrededor de cada **ruta** y de cada zona con `lazy`/`Suspense`.

### Lo que un Error Boundary NO captura

| No captura | Qué hacer |
|---|---|
| Errores en **manejadores de eventos** (`onClick`) | `try/catch` y guarda el error en estado (`setError(e)`, y luego lánzalo en el render si quieres que lo atrape el boundary) |
| Código **asíncrono** (`setTimeout`, promesas) | `try/catch` o `.catch`, o el mismo truco del estado |
| **SSR** | Manejo propio del framework |
| Errores **del propio boundary** | Un boundary superior |

```jsx
function Boton() {
  const [, setError] = useState();
  async function guardar() {
    try { await api.guardar(); }
    catch (e) { setError(() => { throw e; }); }    // relanza durante el render → lo atrapa el Error Boundary
  }
  return <button onClick={guardar}>Guardar</button>;
}
```

## `react-error-boundary`

La librería más usada evita escribir la clase y añade utilidades (reiniciar al cambiar `resetKeys`, `useErrorBoundary`):

```jsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div role="alert"><p>{error.message}</p><button onClick={resetErrorBoundary}>Reintentar</button></div>
  )}
  onError={(error, info) => logAServicio(error, info)}
  resetKeys={[usuarioId]}
>
  <Perfil id={usuarioId} />
</ErrorBoundary>
```

## React 19: mejor reporte de errores

`createRoot` acepta callbacks globales para centralizar el registro de errores:

```jsx
createRoot(contenedor, {
  onCaughtError: (error, info) => registrar('capturado', error, info.componentStack),   // atrapados por un boundary
  onUncaughtError: (error, info) => registrar('no capturado', error, info.componentStack),
  onRecoverableError: (error) => registrar('recuperable', error),
});
```

:::exercise Aísla el fallo
`Grafico` lanza un error al pulsar el botón. Crea un `ErrorBoundary` (clase con `getDerivedStateFromError`) que muestre `<p id="fallback">Gráfico no disponible</p>` y envuélvelo alrededor de `Grafico`, de modo que `<p id="estable">` siga visible.

```hint
`static getDerivedStateFromError() { return { fallo: true }; }` y en `render`: `this.state.fallo ? <p id="fallback">…</p> : this.props.children`.
```

```starter
class ErrorBoundary extends React.Component {
  render() {
    return this.props.children;
  }
}

function Grafico({ roto }) {
  if (roto) throw new Error('Datos corruptos');
  return <p id="grafico">📈 Gráfico</p>;
}

function App() {
  const [roto, setRoto] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setRoto(true)}>Romper</button>
      <Grafico roto={roto} />
      <p id="estable">Contenido estable</p>
    </div>
  );
}
```

```solution
class ErrorBoundary extends React.Component {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? <p id="fallback">Gráfico no disponible</p> : this.props.children;
  }
}

function Grafico({ roto }) {
  if (roto) throw new Error('Datos corruptos');
  return <p id="grafico">📈 Gráfico</p>;
}

function App() {
  const [roto, setRoto] = useState(false);
  return (
    <div className="card col">
      <button onClick={() => setRoto(true)}>Romper</button>
      <ErrorBoundary>
        <Grafico roto={roto} />
      </ErrorBoundary>
      <p id="estable">Contenido estable</p>
    </div>
  );
}
```

```checks
await check('Al inicio se ve el gráfico', () => $('#grafico'));
await click(btn('Romper'));
await check('Tras el error aparece el fallback "Gráfico no disponible"', () => text('#fallback') === 'Gráfico no disponible');
await check('El resto de la app sigue visible (#estable)', () => text('#estable') === 'Contenido estable');
```
:::

:::quiz
? ¿Qué ocurre con los eventos que se disparan dentro de un portal?
+ Burbujean por el árbol de React hacia los componentes padre, no por el del DOM
- No burbujean
- Solo burbujean si usas `stopPropagation`
- Se pierden
> Por eso un `onClick` en el padre recibe los clics del modal.

? ¿Por qué los Error Boundaries siguen siendo componentes de clase?
+ Porque `getDerivedStateFromError`/`componentDidCatch` no tienen equivalente en hooks
- Porque las clases son más rápidas
- Porque los hooks están prohibidos en boundaries
- Es solo tradición
> Puedes usar `react-error-boundary` para no escribirla.

? ¿Qué error NO captura un Error Boundary?
- Un error al renderizar un hijo
+ Un error lanzado dentro de un manejador de eventos (`onClick`)
- Un error en el constructor de un hijo
- Un error en un `lazy` fallido
> Para eventos y async usa `try/catch`.

? ¿Dónde conviene colocar boundaries?
+ Uno global y varios alrededor de partes independientes (rutas, widgets)
- Solo uno global
- Uno por cada línea
- No son necesarios
> Aísla fallos sin perder el resto de la UI.
:::

:::summary
- `createPortal(hijos, nodo)` renderiza fuera del DOM padre pero dentro del árbol de React.
- Error Boundary (clase) = `getDerivedStateFromError` + `componentDidCatch`; granular + global.
- Eventos/async: `try/catch`; React 19 añade `onCaughtError`/`onUncaughtError` en `createRoot`.
:::
