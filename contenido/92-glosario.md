---
id: glosario
nivel: ref
titulo: Glosario
icono: 🔤
tiempo: Consulta
resumen: Los términos clave de React y su ecosistema en palabras sencillas.
---

Usa [[Ctrl]]+[[K]] para buscar términos concretos en todo el curso.

| Término | Significado |
|---|---|
| **Action** | Función (a menudo `async`) ejecutada en una transición para realizar una mutación; React gestiona su estado pendiente y errores (React 19). |
| **Activity** | Componente de React 19.2 que oculta UI conservando su estado. |
| **Batching** | Agrupación de varias actualizaciones de estado en un solo render. |
| **Bundle** | Archivo(s) JavaScript generado(s) en el *build* con tu código y dependencias. |
| **Client Component** | Componente que se hidrata y ejecuta en el navegador (puede usar estado y eventos). |
| **Commit (fase de)** | Momento en que React aplica los cambios al DOM y ejecuta efectos. |
| **Componente** | Función que recibe props y devuelve JSX; pieza reutilizable de UI. |
| **Componente controlado** | Campo cuyo valor lo dicta el estado de React (`value` + `onChange`). |
| **Composición** | Construir UI combinando componentes (hijos, slots) en vez de herencia. |
| **Concurrencia** | Capacidad de React de pausar, priorizar y reanudar renders para mantener la UI fluida. |
| **Contexto (Context)** | Mecanismo para compartir datos con un subárbol sin pasarlos por props. |
| **CSR / SSR / SSG** | Renderizado en cliente / en servidor por petición / estático en build. |
| **Custom hook** | Función `useAlgo` que reutiliza lógica con hooks. |
| **Dato derivado** | Valor que se calcula a partir de estado/props; no debe guardarse en estado. |
| **Declarativo** | Describir *qué* mostrar para un estado, no los pasos para modificar el DOM. |
| **Dependencias (array de)** | Lista de valores que, al cambiar, vuelven a ejecutar un efecto/memo. |
| **DOM** | Árbol de nodos de la página que el navegador renderiza. |
| **Efecto (Effect)** | Código que sincroniza el componente con algo externo, ejecutado tras el render (`useEffect`). |
| **Error Boundary** | Componente (clase) que captura errores de render de sus hijos y muestra un fallback. |
| **Estado (State)** | Memoria de un componente; al cambiar provoca un nuevo render. |
| **Fiber** | Arquitectura interna de React que permite dividir y priorizar el trabajo de render. |
| **Fragmento** | `<>…</>`: agrupa hijos sin añadir nodo al DOM. |
| **HOC** | Higher-Order Component: función que recibe un componente y devuelve otro. |
| **Hidratación** | Adjuntar eventos y estado de React al HTML generado en el servidor. |
| **Hook** | Función `use…` que permite usar estado/efectos/contexto en componentes de función. |
| **Inmutabilidad** | No modificar datos existentes; crear copias nuevas al cambiar. |
| **JSX** | Sintaxis tipo HTML dentro de JavaScript que se compila a llamadas `createElement`. |
| **Key** | Identificador estable de un elemento en una lista para que React lo siga entre renders. |
| **Lazy loading** | Carga de código/recursos solo cuando se necesitan. |
| **Levantar el estado** | Mover el estado al ancestro común de los componentes que lo comparten. |
| **Memoización** | Guardar el resultado de un cálculo/render para reutilizarlo (`memo`, `useMemo`, `useCallback`). |
| **Montar / Desmontar** | Crear / destruir un componente (y su estado) en el árbol. |
| **Pureza** | Mismos inputs → mismo output, sin efectos secundarios en el render. |
| **Portal** | Renderiza hijos en otro nodo del DOM manteniendo el árbol de React. |
| **Prop drilling** | Pasar props por muchos niveles intermedios que no las usan. |
| **Props** | Entradas de un componente, de solo lectura. |
| **Reconciliación** | Proceso de comparar el árbol nuevo con el anterior para actualizar lo mínimo. |
| **Reducer** | Función pura `(estado, acción) => nuevoEstado`. |
| **Ref** | Objeto `{ current }` persistente; da acceso al DOM o guarda valores sin provocar render. |
| **Render** | Ejecutar un componente para calcular qué debe mostrarse. |
| **Render props** | Prop con una función que devuelve JSX para delegar cómo se pinta algo. |
| **RSC** | React Server Components: componentes que se ejecutan solo en el servidor. |
| **Server Action** | Función `'use server'` invocable desde el cliente que se ejecuta en el servidor. |
| **SPA** | Single Page Application: una sola página HTML con navegación gestionada por JavaScript. |
| **Stale closure** | Función que "recuerda" valores obsoletos de un render anterior. |
| **StrictMode** | Modo de desarrollo que activa comprobaciones adicionales. |
| **Suspense** | Mecanismo para mostrar un fallback mientras algo (código, datos) no está listo. |
| **Transición** | Actualización de baja prioridad que no bloquea interacciones urgentes. |
| **Tree shaking** | Eliminación en el build del código que no se usa. |
| **Virtual DOM** | Representación en memoria (objetos) de la UI que React compara para actualizar el DOM real. |
| **Virtualización (windowing)** | Renderizar solo los elementos visibles de una lista larga. |
| **Web Vitals** | Métricas de experiencia: LCP, INP, CLS. |
