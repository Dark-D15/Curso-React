---
id: estilos
nivel: 1
titulo: Estilos en React
icono: 🎨
tiempo: 25 min
resumen: CSS global, className condicional, estilos en línea, CSS Modules, Tailwind y CSS-in-JS: cuándo usar cada uno.
---

:::goal
Conocer las opciones para dar estilo a tus componentes y aplicar clases y estilos **dinámicos** según el estado.
:::

React no impone cómo estilizar: son tecnologías web normales. Estas son las opciones más comunes.

## 1. CSS clásico con `className`

Importas el archivo CSS y asignas clases. Es lo más simple y suficiente para muchos proyectos.

```jsx title="Boton.jsx"
import './Boton.css';

export default function Boton({ children }) {
  return <button className="boton">{children}</button>;
}
```

```css title="Boton.css"
.boton { background: #4f46e5; color: white; border-radius: 8px; padding: 8px 16px; }
.boton:hover { background: #4338ca; }
```

:::warn El CSS importado es global
Aunque lo importes desde un componente, las reglas valen para **toda la página**. Dos componentes con la clase `.titulo` se pisarán. Para evitarlo: nombres (BEM), CSS Modules o utilidades.
:::

Aquí, en el sandbox, incluimos el CSS dentro de una etiqueta `<style>` para poder verlo todo junto:

```jsx run
const css = `
  .boton { background: #4f46e5; color: white; border: 0; border-radius: 8px; padding: 8px 16px; }
  .boton:hover { background: #4338ca; }
`;

function App() {
  return (
    <>
      <style>{css}</style>
      <button className="boton">Botón con clase</button>
    </>
  );
}
```

## 2. Clases condicionales

La clase depende del estado: construye el string con ternarios, plantillas o un array.

```jsx run
const css = `
  .chip { padding: 6px 14px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
  .chip.activo { background: #4f46e5; color: #fff; border-color: #4f46e5; }
`;

function App() {
  const [activo, setActivo] = useState('react');
  const temas = ['react', 'css', 'node'];
  return (
    <>
      <style>{css}</style>
      <div className="row">
        {temas.map((t) => (
          <button key={t} className={'chip ' + (t === activo ? 'activo' : '')} onClick={() => setActivo(t)}>{t}</button>
        ))}
      </div>
    </>
  );
}
```

Con muchas condiciones se usa la librería diminuta **clsx**: `clsx('chip', { activo: seleccionado, grande: size === 'lg' })`.

## 3. Estilos en línea (`style`)

Un objeto con propiedades en camelCase. Ideales para valores **dinámicos** (colores, anchos calculados), no para todo el diseño: no admiten `:hover`, media queries ni pseudo-elementos.

```jsx run
function App() {
  const [progreso, setProgreso] = useState(40);
  return (
    <div className="col">
      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 14, overflow: 'hidden' }}>
        <div style={{ width: progreso + '%', background: progreso > 70 ? '#16a34a' : '#4f46e5', height: '100%', transition: 'width .3s' }} />
      </div>
      <input type="range" min="0" max="100" value={progreso} onChange={(e) => setProgreso(+e.target.value)} />
      <small>{progreso}%</small>
    </div>
  );
}
```

También sirven para pasar **variables CSS** dinámicas: `style={{ '--color': color }}`.

## 4. CSS Modules

Archivos `Nombre.module.css`: Vite/webpack **generan nombres de clase únicos**, evitando colisiones.

```css title="Tarjeta.module.css"
.tarjeta { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.titulo  { margin: 0 0 8px; }
```

```jsx title="Tarjeta.jsx"
import estilos from './Tarjeta.module.css';

export default function Tarjeta({ titulo, children }) {
  return (
    <section className={estilos.tarjeta}>
      <h3 className={estilos.titulo}>{titulo}</h3>
      {children}
    </section>
  );
}
```

El resultado en el DOM será algo como `class="Tarjeta_tarjeta__x7Fa2"`. Muy recomendado cuando quieres CSS "de verdad" con alcance local.

## 5. Tailwind CSS (utilidades)

Escribes clases utilitarias directamente en el JSX. Muy productivo, con diseño consistente:

```jsx
<button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
  Guardar
</button>
```

Variantes responsive y de estado vienen incluidas: `md:flex`, `dark:bg-slate-900`, `focus:ring`.

## 6. CSS-in-JS y alternativas

| Enfoque | Ejemplos | Notas |
|---|---|---|
| CSS-in-JS en runtime | styled-components, Emotion | Estilos con props; coste en tiempo de ejecución, no ideal con Server Components. |
| CSS-in-JS sin runtime | vanilla-extract, Panda CSS, StyleX | Se compila a CSS estático. |
| Librerías de componentes | MUI, Chakra, Mantine, shadcn/ui, Radix | Componentes ya construidos y accesibles. |

## ¿Cuál elegir?

| Si necesitas… | Usa… |
|---|---|
| Algo simple o aprender | CSS normal o CSS Modules |
| Velocidad y consistencia | Tailwind |
| Valores dinámicos puntuales | `style` / variables CSS |
| UI completa ya hecha | Una librería de componentes |

## Animaciones

Combina cambios de clase/estilo con `transition` CSS. Para animaciones complejas (entradas/salidas, layouts) existen librerías como **Framer Motion** (`motion`).

:::exercise Alternar tema
Haz que el botón **Cambiar tema** alterne la clase `oscuro` en el `<div className="panel">`. Cuando esté activa, el panel debe verse con fondo oscuro (el CSS ya existe). Muestra en el botón `Tema: claro` / `Tema: oscuro`.

```hint
Guarda un booleano `oscuro` con `useState` y usa `className={'panel ' + (oscuro ? 'oscuro' : '')}`.
```

```starter
const css = `
  .panel { padding: 16px; border-radius: 12px; background: #f1f5f9; color: #0f172a; }
  .panel.oscuro { background: #0f172a; color: #f8fafc; }
`;

function App() {
  return (
    <>
      <style>{css}</style>
      <div className="panel">
        <p>Panel de ejemplo</p>
        <button>Cambiar tema</button>
      </div>
    </>
  );
}
```

```solution
const css = `
  .panel { padding: 16px; border-radius: 12px; background: #f1f5f9; color: #0f172a; }
  .panel.oscuro { background: #0f172a; color: #f8fafc; }
`;

function App() {
  const [oscuro, setOscuro] = useState(false);
  return (
    <>
      <style>{css}</style>
      <div className={'panel ' + (oscuro ? 'oscuro' : '')}>
        <p>Panel de ejemplo</p>
        <button onClick={() => setOscuro(!oscuro)}>Tema: {oscuro ? 'oscuro' : 'claro'}</button>
      </div>
    </>
  );
}
```

```checks
await check('Empieza sin la clase "oscuro"', () => !$('.panel').classList.contains('oscuro'));
await check('El botón muestra "Tema: claro"', () => btn('Tema: claro'));
await click(btn('Tema:'));
await check('Tras el clic el panel tiene la clase "oscuro"', () => $('.panel').classList.contains('oscuro'));
await check('El botón muestra "Tema: oscuro"', () => btn('Tema: oscuro'));
await click(btn('Tema:'));
await check('Un segundo clic la quita', () => !$('.panel').classList.contains('oscuro'));
```
:::

:::quiz
? ¿Qué problema tiene el CSS normal importado desde un componente?
- No funciona en React
+ Es global: las clases pueden colisionar con las de otros componentes
- No admite `:hover`
- Es más lento que cualquier otra opción
> Para alcance local usa CSS Modules u otras técnicas.

? ¿Cómo se escribe `background-color` en el objeto `style`?
- `'background-color'` sin comillas
+ `backgroundColor`
- `background_color`
- `BackgroundColor`
> Las propiedades CSS van en camelCase en el objeto `style`.

? ¿Cuándo es más adecuado `style` en línea?
+ Para valores dinámicos (por ejemplo, un ancho calculado)
- Para todo el diseño de la aplicación
- Para media queries
- Para pseudo-clases como `:hover`
> No admite media queries ni pseudo-clases.
:::

:::summary
- Opciones: CSS normal, Modules, Tailwind, CSS-in-JS, librerías de UI.
- Clases dinámicas con ternarios/`clsx`; `style` para valores dinámicos.
- CSS Modules da alcance local; el CSS importado normal es global.
:::
