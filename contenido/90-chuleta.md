---
id: chuleta
nivel: ref
titulo: Chuleta (cheat sheet) de React
icono: 📄
tiempo: Consulta
resumen: Referencia rápida de JSX, hooks, APIs, eventos y patrones. Para tener a mano.
---

## JSX en una mirada

| Quiero… | Sintaxis |
|---|---|
| Expresión | `<p>{nombre}</p>` |
| Atributo dinámico | `<img src={url} alt={texto} />` |
| Clase | `<div className="a b">` · `className={ok ? 'a' : 'b'}` |
| Estilo | `style={{ color: 'red', fontSize: 14 }}` |
| Fragmento | `<>…</>` · `<Fragment key={id}>…</Fragment>` |
| Condicional | `{cond ? <A/> : <B/>}` · `{cond && <A/>}` |
| Lista | `{items.map(i => <Item key={i.id} {...i} />)}` |
| Evento | `onClick={() => hacer(id)}` |
| Spread de props | `<Comp {...props} />` |
| Hijos | `<Caja>contenido</Caja>` → `props.children` |
| Comentario | `{/* texto */}` |
| HTML crudo (¡cuidado!) | `dangerouslySetInnerHTML={{ __html: html }}` |

## Hooks: referencia rápida

| Hook | Firma | Para qué |
|---|---|---|
| `useState` | `const [v, setV] = useState(ini)` | Estado local |
| `useReducer` | `const [s, dispatch] = useReducer(reducer, ini)` | Estado complejo |
| `useEffect` | `useEffect(() => { …; return limpieza }, [deps])` | Sincronizar con el exterior |
| `useLayoutEffect` | igual que `useEffect` | Medir/ajustar antes de pintar |
| `useRef` | `const ref = useRef(ini)` | DOM / valor mutable sin render |
| `useContext` | `const v = useContext(Ctx)` | Leer contexto |
| `use` | `use(promesa)` · `use(Ctx)` | Leer promesas/contexto (puede ser condicional) |
| `useMemo` | `useMemo(() => calc, [deps])` | Cachear un valor |
| `useCallback` | `useCallback(fn, [deps])` | Cachear una función |
| `useId` | `const id = useId()` | Ids únicos y estables |
| `useImperativeHandle` | `useImperativeHandle(ref, () => api, [deps])` | Exponer API al padre |
| `useSyncExternalStore` | `useSyncExternalStore(sub, getSnap)` | Stores externos |
| `useTransition` | `const [pend, start] = useTransition()` | Actualizaciones no urgentes |
| `useDeferredValue` | `const v2 = useDeferredValue(v)` | Valor "retrasado" |
| `useEffectEvent` | `const ev = useEffectEvent(fn)` | Leer lo último dentro de efectos (19.2) |
| `useActionState` | `const [s, accion, pend] = useActionState(fn, ini)` | Estado de una Action/formulario |
| `useOptimistic` | `const [v, aplicar] = useOptimistic(real, reducer)` | UI optimista |
| `useFormStatus` | `const { pending } = useFormStatus()` | Estado del `<form>` padre (de `react-dom`) |
| `useDebugValue` | `useDebugValue(valor)` | Etiqueta en DevTools |

### Dependencias de `useEffect`

```jsx
useEffect(fn)            // tras CADA render
useEffect(fn, [])        // solo al montar (y limpieza al desmontar)
useEffect(fn, [a, b])    // al montar y cuando a o b cambian
```

## APIs de React

| API | Uso |
|---|---|
| `createContext(def)` | Crea un contexto → `<Ctx value>` / `<Ctx.Provider>` |
| `memo(Comp)` | Evita re-render si las props no cambian |
| `lazy(() => import('./X'))` | Carga diferida de un componente |
| `<Suspense fallback>` | Estado de carga para `lazy`/`use`/datos |
| `<StrictMode>` | Comprobaciones extra en desarrollo |
| `<Profiler id onRender>` | Medir renders |
| `<Activity mode>` | Ocultar conservando estado (19.2) |
| `startTransition(fn)` | Transición sin hook |
| `forwardRef` | (Antes de 19) pasar `ref` a un componente |
| `cloneElement`, `Children` | Manipular hijos (casos raros) |
| `createPortal(hijos, nodo)` | Renderizar en otro nodo del DOM (`react-dom`) |
| `flushSync(fn)` | Forzar actualización inmediata (`react-dom`) |
| `createRoot(el).render(<App/>)` | Montar la app (`react-dom/client`) |
| `hydrateRoot(el, <App/>)` | Hidratar HTML del servidor |

## Eventos más usados

`onClick` · `onDoubleClick` · `onChange` · `onInput` · `onSubmit` · `onFocus` · `onBlur` · `onKeyDown` · `onKeyUp` · `onMouseEnter` · `onMouseLeave` · `onScroll` · `onDrop` · `onPointerDown` · `onClickCapture`

`e.preventDefault()` cancela la acción por defecto · `e.stopPropagation()` detiene la propagación · `e.target` / `e.currentTarget`.

## Actualizar estado (inmutable)

| Operación | Código |
|---|---|
| Número (depende del anterior) | `setN(n => n + 1)` |
| Objeto: cambiar un campo | `setO({ ...o, campo: nuevo })` |
| Objeto anidado | `setO({ ...o, dir: { ...o.dir, calle: 'X' } })` |
| Array: añadir | `setL([...l, nuevo])` |
| Array: quitar | `setL(l.filter(x => x.id !== id))` |
| Array: modificar | `setL(l.map(x => x.id === id ? { ...x, ok: true } : x))` |
| Array: ordenar | `setL([...l].sort(cmp))` |

## Formularios controlados

```jsx
<input value={v} onChange={(e) => setV(e.target.value)} />
<input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
<select value={s} onChange={(e) => setS(e.target.value)}>…</select>
<form onSubmit={(e) => { e.preventDefault(); /* … */ }}>…</form>
<form action={async (formData) => { /* React 19 */ }}>…</form>
```

## Patrones esenciales

```jsx
// Provider + hook seguro
const Ctx = createContext(null);
export const useX = () => { const c = useContext(Ctx); if (!c) throw new Error('Falta <XProvider>'); return c; };

// Carga de datos con limpieza
useEffect(() => {
  let ignorar = false;
  cargar().then(d => { if (!ignorar) setDatos(d); });
  return () => { ignorar = true; };
}, [id]);

// Hook personalizado
function useToggle(ini = false) { const [v, setV] = useState(ini); return [v, () => setV(x => !x)]; }

// Render condicional por estados
if (cargando) return <Spinner />;
if (error) return <Error mensaje={error} />;
return <Lista datos={datos} />;
```

## Reglas de oro

1. Componentes con **Mayúscula**, definidos a nivel superior y **puros**.
2. **Hooks** en el nivel superior, mismo orden siempre.
3. **No mutar** estado ni props.
4. `key` **estable y única** en listas (no el índice si la lista cambia).
5. Dato derivado ⇒ **calcúlalo**, no lo guardes en estado.
6. Efectos: dependencias honestas y **limpieza**; antes pregunta si necesitas un efecto.
7. Estado lo más local posible; levántalo solo cuando haga falta.
8. Mide antes de optimizar.
