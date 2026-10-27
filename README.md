# ⚛️ Aprende React — curso interactivo

Sitio web para aprender **React de cero a avanzado** con explicaciones didácticas, ejemplos de código **editables y ejecutables en vivo**, ejercicios con **corrección automática**, quizzes y un playground libre.

## ▶️ Cómo abrirlo

1. Descomprime el ZIP.
2. Haz **doble clic en `index.html`** (Chrome, Edge, Firefox o Safari).

No necesita instalar nada, ni Node, ni internet: React 19 y el compilador JSX vienen incluidos en `vendor/`.

> Opcional: si prefieres servirlo por HTTP: `python -m http.server 8080` dentro de la carpeta y abre `http://localhost:8080`.

## 📚 Contenido (43 páginas)

| Nivel | Temas |
|---|---|
| **Preparación** | Qué es React · JavaScript moderno · Entorno (Vite) y `createRoot` |
| **Fundamentos** | JSX · Componentes · Props · Renderizado condicional · Listas y keys · Eventos · `useState` · Formularios controlados · Estilos · Pensar en React / levantar el estado |
| **Intermedio** | `children` y composición · `useEffect` · Reglas de hooks y ciclo de render · `useRef` · Fetch y estados de carga · `useReducer` · Context · Hooks personalizados · `memo`/`useMemo`/`useCallback` · React Router · Formularios avanzados (RHF + Zod) |
| **Avanzado** | Patrones (compound, render props, HOC, headless) · Estado global (Zustand/Redux Toolkit/`useSyncExternalStore`) · TanStack Query · Otros hooks · Portales y Error Boundaries · Suspense, `lazy` y `use` · Concurrencia · **React 19/19.2** (Actions, `useActionState`, `useOptimistic`, `Activity`…) · Server Components y Next.js · TypeScript · Testing · Rendimiento avanzado · Accesibilidad · Arquitectura y producción · **Proyecto final** |
| **Referencia** | Chuleta · Errores comunes · Glosario · Siguientes pasos |

Cada lección incluye objetivos, explicación, diagramas, ejemplos ejecutables, ejercicios (39 en total, todos verificados automáticamente) y un quiz.

## ✨ Funciones del sitio

- **Editor de código** con resaltado de sintaxis, números de línea, tabulación y `Ctrl+Enter` para ejecutar.
- **Vista previa en vivo** (React 19 real dentro de un `<iframe>`) y **consola** integrada.
- **Ejercicios con comprobación automática**, pistas progresivas y solución.
- **Playground** con plantillas.
- **Progreso guardado** en tu navegador (localStorage), tema claro/oscuro y **búsqueda** (`Ctrl+K` o `/`).
- Diseño responsive (móvil, tablet, escritorio).

## 🗂️ Estructura del proyecto

```
index.html              → página única (SPA con rutas por #hash)
css/styles.css          → estilos (tema claro/oscuro)
js/
  app.js                → router, vistas, progreso, búsqueda, ejercicios, quizzes
  markdown.js           → parser de Markdown extendido (lecciones)
  highlight.js          → resaltador de sintaxis
  editor.js             → editor de código
  sandbox.js            → compila JSX y ejecuta en iframe; motor de comprobaciones
  contenido.js          → (GENERADO) lecciones empaquetadas
vendor/
  react.dev.js          → React 19.2 + ReactDOM (build de desarrollo)
  sucrase.min.js        → compilador JSX/TypeScript para el navegador
contenido/              → las lecciones en Markdown (¡edítalas!)
build_contenido.py      → regenera js/contenido.js desde contenido/*.md
```

## ✏️ Cómo añadir o editar lecciones

1. Edita o crea un archivo en `contenido/` (por ejemplo `39-mi-leccion.md`). El orden lo marca el prefijo numérico.
2. Ejecuta `python build_contenido.py` (necesita Python 3, sin dependencias).
3. Recarga `index.html`.

### Formato de una lección

````markdown
---
id: mi-leccion
nivel: 2            # 0 Preparación · 1 Fundamentos · 2 Intermedio · 3 Avanzado · ref Referencia
titulo: Mi lección
icono: 🧩
tiempo: 20 min
resumen: Una frase descriptiva.
---

## Sección
Texto con **negrita**, *cursiva*, `código` y [enlaces](https://react.dev).

```jsx run title="Ejemplo editable"     ← 'run' lo hace ejecutable (define function App)
function App() { return <h1>Hola</h1>; }
```

```js run                              ← JavaScript puro con consola
console.log('hola');
```

```bash                                ← sin 'run': solo se muestra (con botón Copiar)
npm install react
```

:::tip Título opcional                 ← tip · info · warn · danger · idea · goal · summary
Texto del aviso.
:::

:::exercise Título del ejercicio       ← también: exercisejs (JS puro) y exercisets (TSX)
Instrucciones en Markdown.

```hint
Primera pista.
```
```starter
function App() { return null; }
```
```solution
function App() { return <p>Hecho</p>; }
```
```checks
await check('Hay un párrafo', () => $('p'));
await click(btn('Enviar'));
```
:::

:::quiz
? Pregunta
- Opción incorrecta
+ Opción correcta
> Explicación
:::
````

**Ayudantes disponibles en `checks`**: `check(desc, fn|bool)`, `$`, `$$`, `text(sel)`, `byText(txt)`, `btn(txt)`, `click(el)`, `type(el, valor)`, `wait(ms)`, `waitFor(fn, ms)`, `logs()`, `doc`, `win`, `code`.

## ℹ️ Notas

- Los ejemplos ejecutables no necesitan `import`: `useState`, `useEffect`, `useRef`, `createContext`, `memo`, etc. están disponibles automáticamente.
- Define un componente llamado `App`: el sitio lo renderiza solo (o usa `createRoot` tú mismo).
- Si un ejemplo con un bucle infinito congela la pestaña, recarga la página.
- El sitio compila TypeScript quitando los tipos, pero **no los comprueba**.
