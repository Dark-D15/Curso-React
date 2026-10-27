---
id: patrones
nivel: 3
titulo: Patrones avanzados de componentes
icono: 🧬
tiempo: 45 min
resumen: Compound components, render props, HOC, componentes controlados/no controlados y diseño de APIs flexibles.
---

:::goal
Reconocer y aplicar los patrones más usados para construir **componentes reutilizables y flexibles**: *compound components*, *render props*, *HOC*, componentes controlables, polimórficos y headless.
:::

Los patrones son soluciones recurrentes a problemas de diseño. Hoy los **hooks** resuelven muchos casos que antes requerían HOC o render props, pero seguirás encontrándolos (y algunos son insustituibles al diseñar librerías de UI).

## 1. Compound Components (componentes compuestos)

Varios componentes que **colaboran** compartiendo estado implícito mediante contexto, como `<select>` y `<option>`. El consumidor decide la estructura y el orden:

```jsx run
const TabsContext = createContext(null);

function Tabs({ defecto, children }) {
  const [activa, setActiva] = useState(defecto);
  return <TabsContext.Provider value={{ activa, setActiva }}><div className="card">{children}</div></TabsContext.Provider>;
}

function Lista({ children }) { return <div className="row" role="tablist" style={{ marginBottom: 8 }}>{children}</div>; }

function Tab({ id, children }) {
  const { activa, setActiva } = useContext(TabsContext);
  return (
    <button role="tab" aria-selected={activa === id} onClick={() => setActiva(id)}
      style={{ fontWeight: activa === id ? 700 : 400, borderColor: activa === id ? '#4f46e5' : undefined }}>
      {children}
    </button>
  );
}

function Panel({ id, children }) {
  const { activa } = useContext(TabsContext);
  return activa === id ? <div role="tabpanel">{children}</div> : null;
}

// Se adjuntan como propiedades para una API tipo <Tabs.Tab>
Tabs.Lista = Lista; Tabs.Tab = Tab; Tabs.Panel = Panel;

function App() {
  return (
    <Tabs defecto="uno">
      <Tabs.Lista>
        <Tabs.Tab id="uno">Descripción</Tabs.Tab>
        <Tabs.Tab id="dos">Reseñas</Tabs.Tab>
        <Tabs.Tab id="tres">Envío</Tabs.Tab>
      </Tabs.Lista>
      <Tabs.Panel id="uno">Contenido de la descripción.</Tabs.Panel>
      <Tabs.Panel id="dos">⭐⭐⭐⭐ Muy bueno.</Tabs.Panel>
      <Tabs.Panel id="tres">Llega en 48 h.</Tabs.Panel>
    </Tabs>
  );
}
```

**Ventajas**: API declarativa y flexible (puedes reordenar, insertar elementos entre medias), sin una maraña de props. Es el patrón de Radix, Reach UI, Headless UI, MUI…

## 2. Render props

Un componente encapsula **lógica** y delega **cómo se pinta** a una función que recibe como prop (a menudo `children`):

```jsx run
function Raton({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
         style={{ height: 120, border: '2px dashed #94a3b8', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
      {children(pos)}          {/* el padre decide qué hacer con la posición */}
    </div>
  );
}

function App() {
  return (
    <Raton>
      {({ x, y }) => <p>Mueve el ratón aquí 🐭 → x: <b>{x}</b>, y: <b>{y}</b></p>}
    </Raton>
  );
}
```

Hoy un **hook personalizado** (`useRaton()`) suele ser más simple. Las render props siguen útiles cuando la lógica también necesita **renderizar** algo propio (listas virtualizadas, formularios como Formik/RHF `Controller`, `<Downshift>`).

## 3. Higher-Order Components (HOC)

Una **función que recibe un componente y devuelve otro** con comportamiento extra. Convención: `conAlgo(Componente)`.

```jsx run
function conCarga(Componente) {
  return function ConCarga({ cargando, ...props }) {
    if (cargando) return <p className="muted">⏳ Cargando…</p>;
    return <Componente {...props} />;
  };
}

function Perfil({ nombre }) { return <h3>👤 {nombre}</h3>; }
const PerfilConCarga = conCarga(Perfil);

function App() {
  const [cargando, setCargando] = useState(true);
  return (
    <div className="card col">
      <PerfilConCarga cargando={cargando} nombre="Ana" />
      <button onClick={() => setCargando(!cargando)}>Alternar carga</button>
    </div>
  );
}
```

Ejemplos reales: `connect()` de Redux (antiguo), `withRouter`, `React.memo` (es un HOC). Inconvenientes: "wrapper hell", colisión de props, difícil de tipar. **Prefiere hooks.**

:::warn Define el HOC fuera del render
Nunca llames a `conCarga(Componente)` dentro de otro componente: crearías un componente nuevo en cada render y perderías su estado.
:::

## 4. Componentes controlados y no controlados (en tus propios componentes)

Imita a `<input>`: permite que el padre **controle** el valor (`value` + `onChange`) o, si no, que el componente lo gestione solo (`defaultValue`):

```jsx run
function useControlable({ value, defaultValue, onChange }) {
  const [interno, setInterno] = useState(defaultValue);
  const controlado = value !== undefined;
  const actual = controlado ? value : interno;
  const cambiar = (nuevo) => { if (!controlado) setInterno(nuevo); onChange?.(nuevo); };
  return [actual, cambiar];
}

function Interruptor({ value, defaultValue = false, onChange }) {
  const [encendido, cambiar] = useControlable({ value, defaultValue, onChange });
  return <button role="switch" aria-checked={encendido} onClick={() => cambiar(!encendido)}>{encendido ? '🟢 ON' : '⚪ OFF'}</button>;
}

function App() {
  const [padre, setPadre] = useState(true);
  return (
    <div className="card col">
      <p>No controlado: <Interruptor /></p>
      <p>Controlado por el padre: <Interruptor value={padre} onChange={setPadre} /> (padre dice: {String(padre)})</p>
      <button onClick={() => setPadre(!padre)}>Cambiarlo desde fuera</button>
    </div>
  );
}
```

## 5. Componentes polimórficos (prop `as`)

Permite elegir **qué etiqueta/componente** se renderiza manteniendo estilos y comportamiento:

```jsx run
function Texto({ as: Etiqueta = 'p', grande, children, ...resto }) {
  return <Etiqueta style={{ fontSize: grande ? '1.4rem' : '1rem', fontWeight: 600 }} {...resto}>{children}</Etiqueta>;
}

function App() {
  return (
    <div className="card col">
      <Texto>Un párrafo normal</Texto>
      <Texto as="h2" grande>Soy un h2 con el mismo estilo</Texto>
      <Texto as="a" href="#destino">Soy un enlace</Texto>
    </div>
  );
}
```

## 6. Headless components y hooks de comportamiento

Separan **comportamiento/accesibilidad** (qué ocurre, atributos ARIA, teclado) de la **presentación**. Librerías: **Radix UI**, **React Aria**, **Headless UI**, **Downshift**, **TanStack Table**. Tú aportas el diseño.

```jsx run title="Hook headless: toda la lógica, sin ningún estilo"
function useDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return {
    abierto,
    propsBoton: { 'aria-expanded': abierto, 'aria-controls': id, onClick: () => setAbierto((a) => !a) },
    propsPanel: { id, hidden: !abierto },
  };
}

function App() {
  const d = useDesplegable();
  return (
    <div className="card col">
      <button {...d.propsBoton}>Detalles {d.abierto ? '▲' : '▼'}</button>
      <div {...d.propsPanel}>Aquí van los detalles (tú decides el diseño).</div>
    </div>
  );
}
```

Es el patrón **prop getters**: el hook entrega los props que deben aplicarse a cada elemento.

## 7. Otros patrones útiles

| Patrón | Idea |
|---|---|
| **Provider** | Un componente que provee contexto a un subárbol (tema, auth). |
| **Slots** | Props con JSX para "huecos" (`cabecera`, `pie`). |
| **State reducer** | Permite al consumidor intervenir en el `reducer` interno del componente. |
| **Container / Presentational** | Separar datos de presentación (hoy se logra con hooks). |
| **Error boundaries** | Aislar fallos de una zona (lección propia). |
| **Composición > configuración** | Prefiere hijos y slots antes que 20 props booleanas. |

:::tip Criterio de diseño de APIs
- Una prop booleana más = una combinación más que probar. Si superas ~5, replantea con **composición**.
- Elige **nombres por significado** (`variante="peligro"`) y no por apariencia (`rojo`).
- Haz los casos comunes **fáciles** y los raros **posibles** (permite pasar `...resto` al elemento raíz).
:::

:::exercise Render prop: Contador
Crea el componente `Contador` que mantenga un número (inicia en `inicial`, por defecto 0) y llame a `children` con un objeto `{ valor, sumar, restar }`. `App` ya lo usa para pintar la interfaz.

```hint
`function Contador({ inicial = 0, children }) { const [valor, setValor] = useState(inicial); ... return children({ valor, sumar: () => ..., restar: () => ... }); }`
```

```starter
function Contador({ inicial = 0, children }) {
  return null;
}

function App() {
  return (
    <Contador inicial={5}>
      {({ valor, sumar, restar }) => (
        <div className="card row">
          <button onClick={restar}>−</button>
          <strong>{valor}</strong>
          <button onClick={sumar}>+</button>
        </div>
      )}
    </Contador>
  );
}
```

```solution
function Contador({ inicial = 0, children }) {
  const [valor, setValor] = useState(inicial);
  return children({
    valor,
    sumar: () => setValor((v) => v + 1),
    restar: () => setValor((v) => v - 1),
  });
}

function App() {
  return (
    <Contador inicial={5}>
      {({ valor, sumar, restar }) => (
        <div className="card row">
          <button onClick={restar}>−</button>
          <strong>{valor}</strong>
          <button onClick={sumar}>+</button>
        </div>
      )}
    </Contador>
  );
}
```

```checks
await check('Empieza en el valor inicial 5', () => text('strong') === '5');
await click(btn('+')); await click(btn('+'));
await check('Dos clics en + → 7', () => text('strong') === '7');
await click(btn('−'));
await check('Un clic en − → 6', () => text('strong') === '6');
```
:::

:::quiz
? ¿Qué caracteriza a los *compound components*?
+ Componentes que comparten estado implícito (normalmente por contexto) y se usan juntos con estructura libre
- Componentes que se compilan juntos
- Componentes con muchas props booleanas
- Componentes de clase
> Ejemplo: `<Tabs>`, `<Tabs.Tab>`, `<Tabs.Panel>`.

? ¿Qué es un HOC?
+ Una función que recibe un componente y devuelve un componente nuevo con comportamiento añadido
- Un hook especial
- Un tipo de contexto
- Un componente de clase
> `React.memo` es un ejemplo.

? ¿Qué sustituye hoy a la mayoría de HOC y render props para compartir lógica?
+ Los hooks personalizados
- Las clases
- Redux obligatoriamente
- `document.querySelector`
> Más simples, componibles y fáciles de tipar.

? ¿Qué significa que un componente sea "headless"?
+ Aporta comportamiento y accesibilidad pero deja el diseño visual al consumidor
- No tiene JSX
- Solo funciona en servidor
- No usa estado
> Radix UI y React Aria son ejemplos.
:::

:::summary
- *Compound components* + contexto para APIs declarativas; render props cuando la lógica también renderiza; HOC como legado/utilidad.
- Componentes **controlables**, **polimórficos** (`as`) y **headless** para librerías de UI.
- Prefiere composición y hooks; diseña APIs pequeñas y claras.
:::
