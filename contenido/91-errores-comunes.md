---
id: errores-comunes
nivel: ref
titulo: Errores y advertencias comunes
icono: 🩺
tiempo: Consulta
resumen: Los mensajes de error más frecuentes de React: qué significan, por qué aparecen y cómo solucionarlos.
---

Guía de **diagnóstico**. Para cada mensaje: causa más probable y arreglo. Algunos ejemplos son editables: reproduce el error, léelo en la consola y corrígelo.

## 1. "Each child in a list should have a unique key prop"

**Causa**: una lista renderizada con `map` sin `key` (o con keys repetidas).
**Solución**: añade `key={item.id}` en el elemento devuelto por `map`.

```jsx run err title="Reproduce y corrige"
function App() {
  const frutas = ['Manzana', 'Pera', 'Uva'];
  return <ul>{frutas.map((f) => <li>{f}</li>)}</ul>;   // ← falta key
}
```

## 2. "Objects are not valid as a React child"

**Causa**: intentas renderizar un **objeto** (`{usuario}`) en vez de un string/número/elemento.
**Solución**: renderiza una propiedad (`{usuario.nombre}`) o conviértelo (`JSON.stringify`).

```jsx run err
function App() {
  const usuario = { nombre: 'Ana', edad: 30 };
  return <p>{usuario}</p>;      // ← arréglalo: {usuario.nombre}
}
```

## 3. "Too many re-renders. React limits the number of renders to prevent an infinite loop"

**Causa**: llamas a `setEstado` **durante el render**, o pasas `onClick={fn()}` (la llamas) en lugar de `onClick={fn}`.
**Solución**: mueve la actualización a un evento/efecto o pasa la función sin ejecutarla.

```jsx run err
function App() {
  const [n, setN] = useState(0);
  return <button onClick={setN(n + 1)}>Sumar {n}</button>;   // ← se ejecuta en el render
}
```

## 4. "Maximum update depth exceeded"

**Causa**: un `useEffect` que actualiza un estado **del que depende** (o sin dependencias) creando un bucle.
**Solución**: revisa el array de dependencias; calcula en el render lo que sea derivado; usa la forma funcional.

## 5. "Rendered more hooks than during the previous render" / "Invalid hook call"

**Causas**: hooks dentro de `if`/bucles/`return` anticipado; hooks en funciones normales; **dos copias de React** (versiones distintas) en el proyecto; `react` y `react-dom` con versiones desalineadas.
**Solución**: llama a los hooks siempre en el nivel superior; ejecuta `npm ls react` para detectar duplicados.

## 6. "Cannot read properties of undefined (reading 'map' / 'nombre')"

**Causa**: usar datos que **aún no han llegado** (primer render antes de la carga) o una propiedad que no existe.
**Solución**: valores iniciales seguros (`useState([])`), `?.` y `??`, y estados de carga.

```jsx
const [usuarios, setUsuarios] = useState([]);       // ✅ en vez de useState()
usuario?.perfil?.avatar ?? '/default.png'
```

## 7. "A component is changing an uncontrolled input to be controlled"

**Causa**: el `value` del input pasa de `undefined` a un string.
**Solución**: inicializa con `''` (no `undefined`/`null`): `useState('')`. Mantén el campo siempre controlado **o** siempre no controlado.

## 8. "You provided a `value` prop to a form field without an `onChange` handler"

**Causa**: `value` sin `onChange` → campo de solo lectura.
**Solución**: añade `onChange`, o usa `defaultValue` si no lo quieres controlar.

## 9. "Cannot update a component while rendering a different component"

**Causa**: llamar al `setState` de un padre **durante el render** de un hijo.
**Solución**: hazlo en un manejador de eventos o en `useEffect`; o eleva/deriva el dato.

## 10. "Warning: Can't perform a React state update on an unmounted component"

**Causa**: (versiones antiguas) un efecto asíncrono actualiza estado después de desmontarse.
**Solución**: limpia en el `return` del efecto (cancela/ignora). En React 18+ el aviso se eliminó, pero conviene cancelar igualmente peticiones obsoletas.

## 11. "Text content did not match" / "Hydration failed" (SSR)

**Causa**: el HTML del servidor difiere del primer render del cliente (`Date.now()`, `Math.random()`, `window`, `localStorage`, formatos locales).
**Solución**: render inicial determinista; lo dependiente del navegador, en `useEffect` o con `suppressHydrationWarning` puntual.

## 12. El estado "no se actualiza" justo después de `setX`

```jsx run title="Leer el estado tras el setter"
function App() {
  const [n, setN] = useState(0);

  function sumar() {
    setN(n + 1);
    console.log('n vale', n);      // ← sigue valiendo el valor del render actual (instantánea)
  }
  return <button onClick={sumar}>n = {n}</button>;
}
```

**Causa**: el estado es una **instantánea** por render. **Solución**: usa una variable local (`const siguiente = n + 1`) o un efecto que observe `n`.

## 13. Estado obsoleto en closures (stale state)

**Síntoma**: un `setInterval`, `setTimeout` o *listener* "ve" siempre el valor viejo.
**Causa**: la función capturó el valor del render en que se creó.
**Solución**: forma funcional `setX(prev => …)`, incluir la variable en las dependencias, o `useEffectEvent` / una ref con el valor más reciente.

```jsx run title="El intervalo se queda con el valor inicial"
function App() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN(n + 1), 500);   // ← n siempre es 0 aquí; cambia a setN(x => x + 1)
    return () => clearInterval(id);
  }, []);
  return <h2>{n}</h2>;
}
```

## 14. Mutar el estado directamente

```jsx
lista.push(nuevo); setLista(lista);          // ❌ misma referencia → React no ve cambio
setLista([...lista, nuevo]);                  // ✅
```

## 15. `useEffect` se ejecuta dos veces en desarrollo

**Causa**: `StrictMode` monta → desmonta → monta para verificar tu limpieza. **No es un bug**; asegúrate de que el efecto sea simétrico (limpia lo que abres). En producción ocurre una vez.

## 16. Un componente pierde su estado sin motivo

**Causas**: definido **dentro** de otro componente; cambia de **tipo/posición/key** en el árbol; renderizado condicional que lo desmonta.
**Solución**: defínelo a nivel superior; revisa `key`; usa `<Activity>` o CSS para ocultar conservando estado.

## 17. `props.children` es `undefined`, o los estilos "no aplican"

- `children`: solo existe si hay contenido entre las etiquetas del componente.
- Estilos: `class` en vez de `className`, `style="…"` en vez de `style={{…}}`, CSS global pisado, o `style` con propiedades en kebab-case.

## 18. "Module not found" / "X is not defined" / "X is not exported"

- Revisa la **ruta** (`./Componente.jsx`), mayúsculas/minúsculas y extensión.
- **Export por defecto vs. nombrado**: `import X from` (default) vs `import { X } from` (nombrado).
- Falta importar `React`/hooks: `import { useState } from 'react'`.

## 19. La página se queda en blanco

1. Abre la **consola del navegador** (F12): casi siempre hay un error rojo.
2. ¿Falta `<div id="root">`? ¿`createRoot` apunta a un elemento que no existe?
3. Añade un **Error Boundary** global para mostrar fallos en pantalla.
4. En producción con rutas: ¿el servidor devuelve `index.html` en cualquier ruta?

## 20. Método de depuración general

1. **Lee** el mensaje completo y el *stack*: indica el componente y la línea.
2. **Reduce** el problema: comenta partes hasta que desaparezca el error.
3. `console.log` de **props y estado** al inicio del componente.
4. **React DevTools** → Components: inspecciona props/estado/hooks reales.
5. **Profiler**: ¿por qué se renderizó?
6. Revisa que respetas las **reglas de React** (pureza, hooks, inmutabilidad) y activa **ESLint**.
