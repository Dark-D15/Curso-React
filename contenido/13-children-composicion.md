---
id: children-composicion
nivel: 2
titulo: Children y composición
icono: 🪆
tiempo: 30 min
resumen: Componentes contenedor, la prop children, "slots" con props con nombre y por qué React prefiere composición sobre herencia.
---

:::goal
Crear componentes **contenedor** reutilizables con `children`, definir "huecos" (slots) con props y aplicar la composición para evitar el *prop drilling*.
:::

## La prop `children`

Todo lo que escribas **entre la etiqueta de apertura y la de cierre** de un componente le llega en la prop especial `children`:

```jsx run
function Tarjeta({ titulo, children }) {
  return (
    <section className="card col">
      <h3 style={{ margin: 0 }}>{titulo}</h3>
      <div>{children}</div>
    </section>
  );
}

function App() {
  return (
    <div className="col">
      <Tarjeta titulo="Receta">
        <p>Mezcla harina, agua y sal.</p>
        <button>Guardar</button>
      </Tarjeta>
      <Tarjeta titulo="Nota">Basta con texto también.</Tarjeta>
    </div>
  );
}
```

`children` puede ser texto, un elemento, un array de elementos o incluso nada (`undefined`). `Tarjeta` **no sabe ni le importa** qué contiene: eso es lo que la hace reutilizable.

## Componentes contenedor (wrappers)

Patrón muy común: layouts, modales, tarjetas, secciones, botones con estilos, proveedores…

```jsx run
function Modal({ abierto, onCerrar, children }) {
  if (!abierto) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center' }} onClick={onCerrar}>
      <div className="card" style={{ minWidth: 240 }} onClick={(e) => e.stopPropagation()}>
        {children}
        <p><button onClick={onCerrar}>Cerrar</button></p>
      </div>
    </div>
  );
}

function App() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button onClick={() => setAbierto(true)}>Abrir modal</button>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)}>
        <h3>¡Hola!</h3>
        <p>Este contenido lo decide quien usa el modal.</p>
      </Modal>
    </>
  );
}
```

## Slots: varios "huecos" con props con nombre

Como JSX es una expresión, puedes pasarlo por **cualquier prop**, no solo `children`:

```jsx run
function Pagina({ cabecera, lateral, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
      <header style={{ gridColumn: '1 / -1', background: '#eef2ff', padding: 10, borderRadius: 8 }}>{cabecera}</header>
      <aside style={{ background: '#f1f5f9', padding: 10, borderRadius: 8 }}>{lateral}</aside>
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Pagina
      cabecera={<strong>🏠 Mi sitio</strong>}
      lateral={<ul style={{ margin: 0, paddingLeft: 16 }}><li>Inicio</li><li>Blog</li></ul>}
    >
      <p>Contenido principal de la página.</p>
    </Pagina>
  );
}
```

## Composición para evitar el *prop drilling*

Imagina pasar `usuario` a través de 4 niveles solo para que lo use un avatar. Una alternativa: **construir el elemento arriba y pasarlo ya hecho** hacia abajo.

```jsx
// ❌ Drilling: Layout y Cabecera reciben 'usuario' solo para reenviarlo
<Layout usuario={usuario} />   →   <Cabecera usuario={usuario} />   →   <Avatar usuario={usuario} />

// ✅ Composición: App crea el <Avatar/> y lo pasa como contenido
<Layout cabecera={<Cabecera avatar={<Avatar usuario={usuario} />} />} />
```

Layout y Cabecera ya no conocen `usuario`. Antes de saltar al Contexto, prueba la composición.

## Composición vs. herencia

En React **no se usa herencia** entre componentes. Para variar un componente se usa composición:

- **Contención**: el componente no sabe sus hijos (`Tarjeta`, `Modal`).
- **Especialización**: un componente "específico" es un caso del genérico con ciertas props.

```jsx run
function Boton({ variante = 'normal', ...resto }) {
  const estilos = {
    normal: { background: '#f1f5f9', color: '#0f172a' },
    primario: { background: '#4f46e5', color: '#fff' },
    peligro: { background: '#dc2626', color: '#fff' },
  };
  return <button style={{ ...estilos[variante], border: 0, borderRadius: 8, padding: '8px 14px' }} {...resto} />;
}

// Especialización: un componente más concreto basado en el genérico
function BotonEliminar(props) {
  return <Boton variante="peligro" {...props}>🗑 Eliminar</Boton>;
}

function App() {
  return (
    <div className="row">
      <Boton>Normal</Boton>
      <Boton variante="primario">Primario</Boton>
      <BotonEliminar onClick={() => alert('Eliminado')} />
    </div>
  );
}
```

El patrón `{ variante, ...resto }` + `{...resto}` permite que tu componente **reenvíe** cualquier atributo (`onClick`, `disabled`, `aria-label`…) al elemento HTML interno.

## Funciones como hijos (adelanto)

`children` también puede ser una **función** (patrón *render props*, lo veremos en patrones avanzados): `<Datos>{(info) => <p>{info.nombre}</p>}</Datos>`.

## La API `Children` (rara vez la necesitarás)

`React.Children.map/count/toArray` permiten manipular `children`; suelen ser frágiles. Casi siempre hay una alternativa mejor (props con datos, composición, contexto).

:::exercise Componente Panel con slots
Crea el componente `Panel` que reciba `titulo` (texto), `acciones` (JSX opcional) y `children`. Debe renderizar:

- Un `<h3>` con el título.
- Un `<div className="acciones">` con las acciones **solo si se proporcionan**.
- Un `<div className="contenido">` con los hijos.

```hint
Desestructura `{ titulo, acciones, children }` y usa `{acciones && <div className="acciones">{acciones}</div>}`.
```

```starter
function Panel() {
  return <div className="card"></div>;
}

function App() {
  return (
    <div className="col">
      <Panel titulo="Mensajes" acciones={<button>Nuevo</button>}>
        <p>No tienes mensajes.</p>
      </Panel>
      <Panel titulo="Sin acciones">
        <p>Panel simple.</p>
      </Panel>
    </div>
  );
}
```

```solution
function Panel({ titulo, acciones, children }) {
  return (
    <div className="card">
      <h3>{titulo}</h3>
      {acciones && <div className="acciones">{acciones}</div>}
      <div className="contenido">{children}</div>
    </div>
  );
}

function App() {
  return (
    <div className="col">
      <Panel titulo="Mensajes" acciones={<button>Nuevo</button>}>
        <p>No tienes mensajes.</p>
      </Panel>
      <Panel titulo="Sin acciones">
        <p>Panel simple.</p>
      </Panel>
    </div>
  );
}
```

```checks
await check('Hay dos paneles con título <h3>', () => $$('h3').length === 2 && $$('h3')[0].textContent === 'Mensajes');
await check('Los hijos se muestran en .contenido', () => $$('.contenido').length === 2 && $$('.contenido')[0].textContent.includes('No tienes mensajes'));
await check('Las acciones aparecen solo en el primer panel', () => $$('.acciones').length === 1 && btn('Nuevo'));
```
:::

:::quiz
? ¿Qué es `children`?
- Una prop que debes declarar siempre
+ El contenido que se escribe entre las etiquetas de apertura y cierre de un componente
- Los componentes hijos del árbol del DOM
- Una función de React
> Llega automáticamente como `props.children`.

? ¿Qué patrón prefiere React para reutilizar y variar componentes?
- Herencia de clases
+ Composición
- Variables globales
- Duplicar código
> Con props, children y composición se logra la misma flexibilidad sin herencia.

? ¿Cómo defines varios "huecos" en un componente de layout?
+ Con props con nombre que reciben JSX (`cabecera={<Header />}`)
- Solo se permite un `children`
- Con `document.querySelector`
- Con herencia
> Cualquier prop puede recibir JSX.
:::

:::summary
- `children` = contenido entre etiquetas; hace reutilizables los contenedores.
- Props con nombre = slots; la composición evita *prop drilling*.
- Nada de herencia: especializa con props y envolviendo componentes.
:::
