---
id: accesibilidad
nivel: 3
titulo: Accesibilidad (a11y) en React
icono: ♿
tiempo: 35 min
resumen: HTML semántico, etiquetas, foco, teclado, ARIA y cómo comprobar que tu app la puede usar todo el mundo.
---

:::goal
Construir interfaces **usables por todas las personas**: HTML semántico, formularios etiquetados, navegación por teclado, gestión del foco, ARIA bien usado y pruebas de accesibilidad.
:::

La accesibilidad (**a11y**) beneficia a personas con discapacidad visual, motora, auditiva o cognitiva… y también a quien usa solo teclado, un móvil bajo el sol o una conexión lenta. En muchos países es además **requisito legal**. La referencia técnica son las pautas **WCAG**.

## 1. HTML semántico primero

La **primera regla de ARIA**: *si puedes usar un elemento HTML nativo con el comportamiento que necesitas, úsalo en lugar de reutilizar otro y añadirle roles*. Los elementos nativos traen **teclado, foco y semántica gratis**.

| ❌ Evita | ✅ Usa |
|---|---|
| `<div onClick>` | `<button>` |
| `<div class="enlace" onClick>` | `<a href>` / `<Link>` |
| `<div class="titulo">` | `<h1>…<h6>` en orden jerárquico |
| `<div class="lista">` | `<ul>/<ol>` + `<li>` |
| `<div class="menu">` | `<nav>`, `<header>`, `<main>`, `<footer>`, `<aside>`, `<section>` |

```jsx run title="div clicable ❌ vs button ✅: prueba a navegar con Tab y Enter"
function App() {
  const [n, setN] = useState(0);
  return (
    <div className="card col">
      <div onClick={() => setN(n + 1)} style={{ cursor: 'pointer', padding: 8, background: '#fee2e2', borderRadius: 8 }}>
        ❌ Soy un div clicable (no recibe foco, no responde a Enter/Espacio)
      </div>
      <button onClick={() => setN(n + 1)}>✅ Soy un botón (foco, teclado y lector de pantalla)</button>
      <strong>Clics: {n}</strong>
    </div>
  );
}
```

## 2. Formularios: etiquetas y errores

- Todo campo necesita una **etiqueta** visible: `<label htmlFor>` (o envolverlo). El `placeholder` **no** es una etiqueta.
- Agrupa relacionados con `<fieldset>` + `<legend>` (radios).
- Los errores: `aria-invalid`, `aria-describedby` apuntando al mensaje, y `role="alert"` (o región `aria-live`).
- Indica los campos obligatorios (`required`, `aria-required`) **y** con texto, no solo con color.

```jsx run
function App() {
  const id = useId();
  const [correo, setCorreo] = useState('');
  const error = correo && !correo.includes('@') ? 'Introduce un correo válido (con @)' : '';

  return (
    <form className="card col" noValidate>
      <label htmlFor={id}>Correo electrónico <span aria-hidden="true">*</span></label>
      <input
        id={id} type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined}
      />
      {error && <small id={id + '-error'} role="alert" className="bad">{error}</small>}
    </form>
  );
}
```

## 3. Teclado y foco

Todo lo que se pueda hacer con el ratón debe poder hacerse con **teclado**:

- **Orden de tabulación lógico** (sigue el orden del DOM; evita `tabIndex` positivos).
- **Foco visible**: nunca quites el `outline` sin ofrecer una alternativa clara (`:focus-visible`).
- `tabIndex={0}` solo para elementos interactivos personalizados; `tabIndex={-1}` para enfocar por código.
- Atajos y componentes compuestos (menús, pestañas, listas) siguen los patrones de la **WAI-ARIA Authoring Practices** (teclas de flecha, Home/End, Esc).

### Gestionar el foco al abrir/cerrar elementos

Al abrir un modal, **mueve el foco dentro**; al cerrar, **devuélvelo** al elemento que lo abrió:

```jsx run title="Modal accesible (foco, Esc y devolución del foco)"
function Dialogo({ abierto, onCerrar, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement;                 // elemento que tenía el foco
    ref.current.focus();                                   // mover foco al diálogo
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previo?.focus(); };   // devolver el foco
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-dialogo" tabIndex={-1} ref={ref}
         style={{ border: '2px solid #4f46e5', borderRadius: 12, padding: 16, background: '#fff', marginTop: 8 }}>
      <h3 id="titulo-dialogo" style={{ marginTop: 0 }}>Confirmar acción</h3>
      {children}
      <button onClick={onCerrar}>Cerrar (Esc)</button>
    </div>
  );
}

function App() {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="card">
      <button onClick={() => setAbierto(true)}>Abrir diálogo</button>
      <Dialogo abierto={abierto} onCerrar={() => setAbierto(false)}><p>¿Seguro que quieres continuar?</p></Dialogo>
    </div>
  );
}
```

Para modales completos también hay que **atrapar el foco** dentro (focus trap) y hacer inerte el resto: usa `<dialog>` nativo o una librería (**Radix UI**, **React Aria**, **Headless UI**) en vez de reinventarlo.

### Navegación rápida: *skip links*

```jsx
<a href="#contenido" className="skip-link">Saltar al contenido principal</a>
<main id="contenido" tabIndex={-1}>…</main>
```

En una SPA, tras cambiar de ruta **mueve el foco** al `<h1>` o al `<main>` y anuncia la nueva página.

## 4. ARIA: complemento, no sustituto

**ARIA** añade semántica cuando HTML no basta (widgets personalizados):

| Tipo | Ejemplos |
|---|---|
| **Roles** | `role="dialog"`, `tablist`, `tab`, `alert`, `status` |
| **Estados** | `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-checked`, `aria-busy`, `aria-invalid` |
| **Propiedades** | `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls` |
| **Live regions** | `aria-live="polite" \| "assertive"` para anunciar cambios |

```jsx run title="Regiones en vivo: el lector de pantalla anuncia los cambios"
function App() {
  const [carrito, setCarrito] = useState(0);
  return (
    <div className="card col">
      <button onClick={() => setCarrito(carrito + 1)}>Añadir al carrito</button>
      {/* role="status" = aria-live="polite": se anuncia sin interrumpir */}
      <p role="status">{carrito === 0 ? 'Carrito vacío' : carrito + ' artículo(s) en el carrito'}</p>
    </div>
  );
}
```

:::danger "Más ARIA" no es mejor
ARIA incorrecta es **peor** que ninguna: promete comportamientos (teclado, estados) que tú debes implementar. `role="button"` en un `div` exige manejar Enter/Espacio y foco… usa `<button>`.
:::

## 5. Contenido, color y movimiento

- **Imágenes**: `alt` descriptivo; `alt=""` si son decorativas. Iconos sueltos: `aria-label`; decorativos: `aria-hidden="true"`.
- **Contraste** mínimo (4,5:1 texto normal en WCAG AA); no transmitas información **solo con color**.
- Texto redimensionable (usa `rem`), diseño responsive, objetivos táctiles grandes.
- Respeta `prefers-reduced-motion` y evita parpadeos:

```css
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

- Títulos en **orden** (`h1` único por página → `h2` → `h3`); no los elijas por su tamaño, sino por su nivel.
- Idioma del documento: `<html lang="es">`; cambios de idioma con `lang`.

## 6. Cómo comprobarlo

| Herramienta | Qué detecta |
|---|---|
| **`eslint-plugin-jsx-a11y`** | Errores comunes al escribir JSX (falta `alt`, `onClick` sin teclado…). |
| **axe DevTools / Lighthouse** | Auditorías automáticas (~30-40 % de los problemas). |
| **Pruebas** con `jest-axe` y Testing Library (`getByRole`) | Regresiones. |
| **Navegar solo con teclado** (Tab, Shift+Tab, Enter, Espacio, Esc, flechas) | Orden y trampas de foco. |
| **Lector de pantalla** (NVDA, VoiceOver, TalkBack) | La experiencia real. |
| **Zoom 200 %** y modo alto contraste | Reflujo y legibilidad. |

La automatización no basta: **prueba con teclado y lector de pantalla** de forma manual.

## 7. Librerías accesibles

Evita construir desde cero: modales, menús, comboboxes, tooltips o calendarios son difíciles de hacer bien. Apóyate en **Radix UI**, **React Aria / React Spectrum**, **Headless UI**, **Ariakit** o **shadcn/ui** (basado en Radix).

:::exercise Hazlo accesible
Arregla el componente:

1. El botón de silencio es un `<div>`: cámbialo por un `<button>` con `aria-pressed` que refleje si está silenciado.
2. El campo "Nombre" no tiene etiqueta asociada: añade un `<label>` conectado con `htmlFor`/`id`.

```hint
`<button aria-pressed={silenciado} onClick={...}>` y `<label htmlFor="nombre">Nombre</label>` + `<input id="nombre" />`.
```

```starter
function App() {
  const [silenciado, setSilenciado] = useState(false);
  return (
    <div className="card col">
      <div onClick={() => setSilenciado(!silenciado)} style={{ cursor: 'pointer' }}>
        {silenciado ? '🔇 Silenciado' : '🔊 Sonido'}
      </div>
      <span>Nombre</span>
      <input placeholder="Tu nombre" />
    </div>
  );
}
```

```solution
function App() {
  const [silenciado, setSilenciado] = useState(false);
  return (
    <div className="card col">
      <button aria-pressed={silenciado} onClick={() => setSilenciado(!silenciado)}>
        {silenciado ? '🔇 Silenciado' : '🔊 Sonido'}
      </button>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" placeholder="Tu nombre" />
    </div>
  );
}
```

```checks
const b = $('button');
await check('El control de sonido es un <button>', () => b && /Sonido/.test(b.textContent));
await check('El botón tiene aria-pressed="false" al inicio', () => b.getAttribute('aria-pressed') === 'false');
await click(b);
await check('Tras pulsar, aria-pressed="true" y el texto cambia', () => $('button').getAttribute('aria-pressed') === 'true' && /Silenciado/.test($('button').textContent));
const input = $('input');
await check('El input está asociado a una etiqueta <label>', () => input.labels && input.labels.length === 1 && /Nombre/.test(input.labels[0].textContent));
```
:::

:::quiz
? ¿Por qué es mejor un `<button>` que un `<div onClick>`?
+ Porque trae foco, teclado (Enter/Espacio) y semántica de botón para tecnologías de apoyo
- Porque es más rápido
- Porque se ve mejor
- Porque ocupa menos
> Reproducirlo con `div` exige mucho trabajo extra y es fácil equivocarse.

? ¿Para qué sirve `aria-describedby` en un campo con error?
+ Para asociar el campo con el texto del mensaje de error, que el lector de pantalla leerá
- Para estilizar el campo
- Para validar
- Para enfocarlo
> Apunta al `id` del mensaje.

? ¿Qué debes hacer con el foco al abrir un modal?
+ Moverlo dentro del modal y devolverlo al elemento que lo abrió al cerrarlo
- Dejarlo donde estaba
- Quitarlo de la página
- Enfocar siempre el `<body>`
> Es clave para usuarios de teclado y lectores de pantalla.

? ¿Qué es un `alt=""` en una imagen?
+ Indica que la imagen es decorativa y los lectores de pantalla pueden ignorarla
- Un error
- Una imagen rota
- Una imagen sin src
> Las imágenes informativas necesitan un `alt` descriptivo.
:::

:::summary
- HTML semántico primero; ARIA solo para complementar.
- Etiquetas, errores asociados (`aria-describedby`, `role="alert"`), teclado completo y foco visible/gestionado.
- Contraste, `alt`, `lang`, movimiento reducido; comprueba con eslint-plugin-jsx-a11y, axe y pruebas manuales.
:::
