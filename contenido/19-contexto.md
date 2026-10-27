---
id: contexto
nivel: 2
titulo: Contexto (Context API)
icono: 🌍
tiempo: 35 min
resumen: Comparte datos con todo un subárbol sin pasarlos por props. Proveedores, hook personalizado, rendimiento y límites.
---

:::goal
Crear y consumir **contexto** para datos "globales" (tema, usuario, idioma), exponer también funciones para modificarlo y conocer sus **limitaciones de rendimiento**.
:::

## El problema: *prop drilling*

Si un dato (el tema, el usuario) lo necesita un componente muy profundo, pasarlo como prop por todos los niveles intermedios es tedioso y frágil.

```text
App → Layout → Sidebar → Menu → BotonTema    ← solo BotonTema necesita "tema"
   (tema pasa por Layout, Sidebar y Menu sin usarse)
```

El **Contexto** permite que un ancestro **provea** un valor y cualquier descendiente lo **lea** directamente.

## Tres pasos

1. **Crear** el contexto con `createContext(valorPorDefecto)`.
2. **Proveer** el valor con `<Contexto.Provider value={...}>` en un ancestro.
3. **Consumir** con `useContext(Contexto)` en cualquier descendiente.

```jsx run
// 1) crear
const TemaContext = createContext('claro');

function BotonTema() {
  // 3) consumir (sin props)
  const tema = useContext(TemaContext);
  const oscuro = tema === 'oscuro';
  return (
    <button style={{ background: oscuro ? '#1e293b' : '#fff', color: oscuro ? '#fff' : '#000', border: '1px solid #94a3b8' }}>
      Soy un botón con tema {tema}
    </button>
  );
}

function Menu()    { return <div><BotonTema /></div>; }
function Sidebar() { return <aside><Menu /></aside>; }
function Layout()  { return <section><Sidebar /></section>; }

function App() {
  const [tema, setTema] = useState('claro');
  return (
    // 2) proveer: todo lo que esté dentro puede leerlo
    <TemaContext.Provider value={tema}>
      <div className="card col">
        <Layout />
        <button onClick={() => setTema(tema === 'claro' ? 'oscuro' : 'claro')}>Alternar tema</button>
      </div>
    </TemaContext.Provider>
  );
}
```

`Layout`, `Sidebar` y `Menu` **no reciben ni conocen** el tema. Cuando el `value` del Provider cambia, todos los componentes que usan `useContext(TemaContext)` se vuelven a renderizar.

:::info Valor por defecto
El argumento de `createContext(valor)` solo se usa cuando un componente consume el contexto **sin tener un Provider por encima**. Útil para pruebas o valores "neutros".
:::

## Contexto con funciones para modificarlo

Lo habitual es proveer **un objeto** con el valor y las funciones que lo cambian. Extráelo a un componente `Provider` propio y a un **hook de consumo** que valide su uso:

```jsx run title="Patrón recomendado: Provider + hook personalizado"
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  const valor = {
    usuario,
    entrar: (nombre) => setUsuario({ nombre }),
    salir: () => setUsuario(null),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

function Cabecera() {
  const { usuario, salir } = useAuth();
  return (
    <header className="row">
      <strong>{usuario ? 'Hola, ' + usuario.nombre : 'Invitado'}</strong>
      {usuario && <button onClick={salir}>Salir</button>}
    </header>
  );
}

function Login() {
  const { usuario, entrar } = useAuth();
  if (usuario) return <p className="ok">Sesión iniciada ✅</p>;
  return <button onClick={() => entrar('Ana')}>Entrar como Ana</button>;
}

function App() {
  return (
    <AuthProvider>
      <div className="card col"><Cabecera /><Login /></div>
    </AuthProvider>
  );
}
```

Ventajas: los consumidores usan `useAuth()` (API clara), el estado vive en un solo sitio y un error de configuración se detecta enseguida.

## React 19: sintaxis más corta y `use`

En React 19 puedes renderizar el contexto directamente como proveedor y leerlo con `use`, que además se puede llamar **dentro de condicionales**:

```jsx run title="React 19: <Contexto value> y use(Contexto)"
const IdiomaContext = createContext('es');

function Saludo({ visible }) {
  if (!visible) return null;
  const idioma = use(IdiomaContext);       // use() sí puede ir después de un if / return anticipado
  return <p>{idioma === 'es' ? '¡Hola!' : 'Hello!'}</p>;
}

function App() {
  const [idioma, setIdioma] = useState('es');
  return (
    <IdiomaContext value={idioma}>
      <div className="card col">
        <Saludo visible />
        <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}>Idioma: {idioma}</button>
      </div>
    </IdiomaContext>
  );
}
```

## Rendimiento: el contexto y los re-renders

Todos los consumidores se re-renderizan cuando cambia el `value` (comparado con `Object.is`). Dos precauciones:

1. **Si el `value` es un objeto creado en cada render** (`value={{ a, b }}`), cambiará siempre. Para providers con muchos consumidores, memoízalo con `useMemo` (y las funciones con `useCallback`).
2. **Divide contextos** por frecuencia de cambio: uno para datos (cambian a menudo) y otro para acciones (estables).

```jsx
function CarritoProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, []);
  const valor = useMemo(() => ({ estado, dispatch }), [estado]);   // referencia estable si estado no cambia
  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
```

:::warn El contexto no es un gestor de estado completo
No tiene selectores: un consumidor se re-renderiza aunque solo le interese **una parte** del valor. Para estado global con actualizaciones muy frecuentes, usa una librería con suscripción selectiva (Zustand, Redux Toolkit, Jotai). El contexto brilla con datos que cambian **poco**: tema, idioma, usuario autenticado, configuración.
:::

## Combinación con `useReducer`

`Provider` + `useReducer` es una forma ligera de tener un "mini-Redux" para una parte de tu app:

```jsx
const TareasContext = createContext(null);
const DispatchContext = createContext(null);   // dos contextos: datos y acciones

function TareasProvider({ children }) {
  const [tareas, dispatch] = useReducer(tareasReducer, []);
  return (
    <TareasContext.Provider value={tareas}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </TareasContext.Provider>
  );
}
```

`dispatch` es estable (nunca cambia), así que los componentes que solo **envían** acciones no se re-renderizan cuando cambian las tareas.

## Cuándo usar contexto

- ✅ Tema, idioma, usuario/sesión, configuración, formularios compuestos, componentes compuestos (compound components).
- ❌ Para evitar pasar props **una o dos** capas (basta con props o composición).
- ❌ Estado que cambia decenas de veces por segundo.

:::exercise Tema compartido
Hay un `TemaContext` ya creado y un componente `Boton` profundo. Haz que:

- `App` provea el valor `{ tema, alternar }` con el estado `tema` (`'claro'` inicial) y una función `alternar`.
- `Boton` consuma el contexto con `useContext`, muestre `Tema: <tema>` y al pulsarlo llame a `alternar`.

```hint
En `App`: `<TemaContext.Provider value={{ tema, alternar }}>`. En `Boton`: `const { tema, alternar } = useContext(TemaContext);`.
```

```starter
const TemaContext = createContext(null);

function Boton() {
  return <button>Tema: ?</button>;
}

function Nivel2() { return <div><Boton /></div>; }
function Nivel1() { return <section><Nivel2 /></section>; }

function App() {
  const [tema, setTema] = useState('claro');
  const alternar = () => setTema(tema === 'claro' ? 'oscuro' : 'claro');

  return (
    <div className="card">
      <Nivel1 />
    </div>
  );
}
```

```solution
const TemaContext = createContext(null);

function Boton() {
  const { tema, alternar } = useContext(TemaContext);
  return <button onClick={alternar}>Tema: {tema}</button>;
}

function Nivel2() { return <div><Boton /></div>; }
function Nivel1() { return <section><Nivel2 /></section>; }

function App() {
  const [tema, setTema] = useState('claro');
  const alternar = () => setTema(tema === 'claro' ? 'oscuro' : 'claro');

  return (
    <TemaContext.Provider value={{ tema, alternar }}>
      <div className="card">
        <Nivel1 />
      </div>
    </TemaContext.Provider>
  );
}
```

```checks
await check('El botón muestra "Tema: claro"', () => btn('Tema: claro'));
await click(btn('Tema:'));
await check('Tras pulsar muestra "Tema: oscuro"', () => btn('Tema: oscuro'));
await click(btn('Tema:'));
await check('Pulsar otra vez vuelve a "Tema: claro"', () => btn('Tema: claro'));
```
:::

:::quiz
? ¿Qué problema principal resuelve el Contexto?
+ El *prop drilling*: pasar datos por muchos niveles que no los usan
- La lentitud del renderizado
- Las peticiones HTTP
- El enrutado
> Permite que un descendiente lea un valor provisto por un ancestro.

? ¿Cuándo se re-renderizan los consumidores de un contexto?
- Nunca
+ Cuando cambia el `value` del Provider (comparación por referencia)
- Solo al montar
- Cuando cambia cualquier estado de la app
> Por eso conviene memoizar el objeto `value` y dividir contextos.

? ¿Para qué sirve el valor por defecto de `createContext(valor)`?
+ Se usa solo si no hay Provider por encima del consumidor
- Es el valor inicial del Provider
- Es obligatorio
- Se ejecuta en cada render
> Con Provider siempre manda su `value`.

? ¿Qué ventaja ofrece `use(Contexto)` en React 19?
+ Puede llamarse dentro de condicionales o tras un `return` anticipado
- Es más rápido siempre
- Sustituye a `createContext`
- Permite escribir en el contexto
> `useContext` obedece las reglas de los hooks; `use` es más flexible.
:::

:::summary
- `createContext` → `Provider value` → `useContext`.
- Provee objetos con valores **y** funciones; encapsula en `XProvider` + `useX`.
- Cuidado con re-renders: memoiza `value` y separa contextos. Para estado global muy dinámico, una librería.
:::
