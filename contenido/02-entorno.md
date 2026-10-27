---
id: entorno
nivel: 0
titulo: Tu entorno y tu primer proyecto
icono: 🛠️
tiempo: 20 min
resumen: Instala las herramientas, crea un proyecto con Vite, conoce su estructura y cómo React se "monta" en la página.
---

:::goal
Saber crear un proyecto React moderno, entender cada archivo importante y cómo `createRoot` conecta React con tu HTML.
:::

## Qué necesitas instalar

1. **Node.js** (versión LTS) — incluye `npm`. Descárgalo desde [nodejs.org](https://nodejs.org).
2. Un editor: **Visual Studio Code** es el estándar. Extensiones útiles: *ESLint*, *Prettier*, *ES7+ React snippets*.
3. Un navegador con **React Developer Tools** (extensión para Chrome/Edge/Firefox) para inspeccionar componentes.

Comprueba que todo está listo:

```bash
node -v
npm -v
```

## Crear un proyecto con Vite

**Vite** es el empaquetador/servidor de desarrollo más usado para apps React (rapidísimo, con recarga en caliente). La herramienta antigua *Create React App* ya está **descontinuada**; hoy se usa Vite o un framework (Next.js, React Router).

```bash
npm create vite@latest mi-app -- --template react
cd mi-app
npm install
npm run dev
```

Abre la URL que aparece en la terminal (normalmente `http://localhost:5173`). Cada vez que guardes un archivo, la página se actualizará sola (*Fast Refresh*, conservando el estado cuando es posible).

:::tip ¿JavaScript o TypeScript?
Vite ofrece plantillas `react` (JavaScript) y `react-ts` (TypeScript). Aprende primero con JavaScript; en el nivel avanzado hay una lección de TypeScript con React.
:::

## Estructura del proyecto

```text
mi-app/
├── index.html          ← única página HTML; contiene <div id="root">
├── package.json        ← dependencias y scripts
├── vite.config.js      ← configuración de Vite
├── public/             ← archivos estáticos (favicon, imágenes)
└── src/
    ├── main.jsx        ← punto de entrada: monta React en #root
    ├── App.jsx         ← tu componente raíz
    ├── App.css
    └── assets/
```

### `index.html` y `main.jsx`

React toma control de **un contenedor** de tu HTML y dibuja ahí toda la interfaz:

```html title="index.html (fragmento)"
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
```

```jsx title="src/main.jsx"
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

```jsx title="src/App.jsx"
import { useState } from 'react';

export default function App() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clics: {n}</button>;
}
```

- `createRoot(contenedor)` crea la **raíz** de React sobre un elemento del DOM.
- `.render(<App />)` dibuja el componente raíz.
- `StrictMode` activa comprobaciones extra **solo en desarrollo** (por ejemplo, ejecuta ciertos efectos dos veces para detectar errores). No cambia lo que ves en producción.

### Imports: nombrados vs. por defecto

`import { useState } from 'react'` (nombrado, con llaves) frente a `import App from './App.jsx'` (por defecto, sin llaves). Los archivos locales llevan ruta relativa (`./`); los paquetes de npm, solo su nombre.

## Scripts de `package.json`

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera la versión optimizada en `dist/` |
| `npm run preview` | Sirve localmente el build para probarlo |
| `npm run lint` | Revisa el código con ESLint |

## Instalar librerías

```bash
npm install react-router-dom      # añade una dependencia
npm install -D vitest             # dependencia de desarrollo
```

## Alternativas para empezar

| Opción | Cuándo elegirla |
|---|---|
| **Vite + React** | SPA, aprendizaje, dashboards. Control total. |
| **Next.js** | Sitios con SEO, renderizado en servidor, rutas por carpetas. |
| **React Router (modo framework)** | Quieres el enrutador y datos integrados, estilo "full-stack". |
| **Expo / React Native** | Apps móviles nativas con la misma filosofía. |

## Mismo concepto, aquí mismo

En este curso, los ejemplos ya traen React cargado y renderizan tu componente `App` automáticamente. Pero también puedes ver el flujo real con `createRoot`; fíjate que aquí hay un contenedor con `id="root"` igual que en `index.html`:

```jsx run title="main.jsx (simulado)"
function App() {
  return <h2>🚀 Mi primera app montada con createRoot</h2>;
}

const contenedor = document.getElementById('root');
createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

:::exercise Monta tu propia raíz
Completa el código para que `App` se muestre usando `createRoot` sobre el elemento `#root`.

```hint
`createRoot(document.getElementById('root')).render(<App />)`
```

```starter
function App() {
  return <h1>¡Funciona!</h1>;
}

// Escribe aquí la línea que monta App en #root
```

```solution
function App() {
  return <h1>¡Funciona!</h1>;
}

createRoot(document.getElementById('root')).render(<App />);
```

```checks
await check('Usas createRoot(...).render(...) en tu código', () => /createRoot\s*\(/.test(code) && /\.render\s*\(/.test(code));
await check('Se muestra un <h1> con "Funciona"', () => text('h1').includes('Funciona'));
```
:::

:::quiz
? ¿Para qué sirve `createRoot`?
- Para crear un componente
+ Para que React tome control de un elemento del DOM y renderice ahí la aplicación
- Para instalar librerías
- Para crear estilos
> `createRoot(elemento).render(<App />)` enlaza React con tu HTML.

? ¿Qué es Vite?
- Una librería de componentes
- Un navegador
+ Una herramienta de desarrollo y empaquetado rápida, muy usada para proyectos React
- Una base de datos
> Ofrece servidor de desarrollo con recarga instantánea y build optimizado.

? ¿Qué hace `<StrictMode>`?
- Hace que la app corra más rápido en producción
+ Activa comprobaciones adicionales solo en desarrollo para detectar problemas
- Obliga a usar TypeScript
- Impide usar hooks
> No afecta a producción; ayuda a detectar efectos impuros o sin limpieza.
:::

:::summary
- Necesitas Node.js, un editor y (opcional) React DevTools.
- `npm create vite@latest` crea un proyecto en segundos.
- `main.jsx` monta `<App />` en `#root` con `createRoot`.
- Hay alternativas (Next.js, React Router, Expo) según el tipo de proyecto.
:::
