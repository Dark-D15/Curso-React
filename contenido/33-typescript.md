---
id: typescript
nivel: 3
titulo: TypeScript con React
icono: 🔷
tiempo: 45 min
resumen: Tipa props, estado, eventos, refs, reducers, contexto y componentes genéricos para detectar errores antes de ejecutar.
---

:::goal
Escribir componentes React en **TypeScript**: tipar props, `children`, estado, eventos, refs, reducers y contexto, y crear **componentes genéricos** reutilizables.
:::

TypeScript añade **tipos estáticos** a JavaScript: tu editor detecta errores (props mal escritas, `undefined` sin comprobar, valores incorrectos) **antes** de ejecutar. En React se usa en archivos **`.tsx`**. Los ejemplos de esta lección son editables y se ejecutan aquí mismo (los tipos se eliminan al compilar; este sitio **no** comprueba tipos, tu editor/`tsc` sí lo harán).

## Empezar

```bash
npm create vite@latest mi-app -- --template react-ts
```

Instala los tipos de React si usas JS→TS gradual: `npm i -D @types/react @types/react-dom`.

## Tipar props

```tsx run
interface BotonProps {
  texto: string;
  variante?: 'primario' | 'secundario';      // unión de literales: solo estos valores
  deshabilitado?: boolean;                    // ? = opcional
  onPulsar: () => void;                       // función sin argumentos ni retorno
}

function Boton({ texto, variante = 'primario', deshabilitado = false, onPulsar }: BotonProps) {
  return (
    <button disabled={deshabilitado} onClick={onPulsar}
      style={{ background: variante === 'primario' ? '#4f46e5' : '#e2e8f0', color: variante === 'primario' ? '#fff' : '#0f172a', border: 0 }}>
      {texto}
    </button>
  );
}

function App() {
  return (
    <div className="row">
      <Boton texto="Guardar" onPulsar={() => alert('Guardado')} />
      <Boton texto="Cancelar" variante="secundario" onPulsar={() => {}} />
      {/* <Boton texto="X" variante="rojo" />  ← error de tipos: "rojo" no es una variante válida */}
    </div>
  );
}
```

- Usa **`interface`** o **`type`** (ambos valen; ten un criterio de equipo).
- Evita `React.FC`: tipar los parámetros directamente es más simple y no añade `children` implícito.

## `children` y tipos de React

```tsx
import type { ReactNode } from 'react';

interface TarjetaProps {
  titulo: string;
  children: ReactNode;          // cualquier cosa renderizable: JSX, string, número, null, arrays…
  pie?: ReactNode;
}
```

| Tipo | Uso |
|---|---|
| `ReactNode` | Cualquier cosa que React pueda renderizar (lo más común para `children`) |
| `ReactElement` | Un único elemento JSX |
| `JSX.Element` | Resultado de una expresión JSX |
| `ComponentProps<'button'>` | Todas las props de una etiqueta/componente |
| `CSSProperties` | Objeto de estilos en línea |

### Extender las props de un elemento HTML

```tsx run
import type { ComponentProps } from 'react';

type InputEtiquetadoProps = ComponentProps<'input'> & { etiqueta: string };   // todas las props de <input> + la nuestra

function InputEtiquetado({ etiqueta, id, ...resto }: InputEtiquetadoProps) {
  const auto = useId();
  const identificador = id ?? auto;
  return (
    <div className="col" style={{ gap: 2 }}>
      <label htmlFor={identificador}>{etiqueta}</label>
      <input id={identificador} {...resto} />            {/* placeholder, onChange, type… ya vienen tipados */}
    </div>
  );
}

function App() {
  return <InputEtiquetado etiqueta="Correo" type="email" placeholder="tu@email.com" />;
}
```

## Tipar el estado

TypeScript **infiere** el tipo desde el valor inicial. Debes indicarlo cuando el valor inicial no basta (`null`, `[]` vacío, uniones):

```tsx run
interface Usuario {
  id: number;
  nombre: string;
}

function App() {
  const [contador, setContador] = useState(0);                           // inferido: number
  const [usuario, setUsuario] = useState<Usuario | null>(null);          // explícito: puede ser null
  const [lista, setLista] = useState<Usuario[]>([]);                     // array vacío necesita tipo

  return (
    <div className="card col">
      <button onClick={() => setContador(contador + 1)}>Contador: {contador}</button>
      <button onClick={() => setUsuario({ id: 1, nombre: 'Ana' })}>Cargar usuario</button>
      <button onClick={() => setLista([...lista, { id: lista.length + 1, nombre: 'U' + (lista.length + 1) }])}>Agregar a lista ({lista.length})</button>
      <p>{usuario ? usuario.nombre : 'Sin usuario'}</p>          {/* TS obliga a comprobar null antes de usar usuario.nombre */}
    </div>
  );
}
```

## Tipar eventos

```tsx run
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';

function App() {
  const [texto, setTexto] = useState('');

  function alCambiar(e: ChangeEvent<HTMLInputElement>) {
    setTexto(e.target.value);                   // e.target es HTMLInputElement → .value existe
  }
  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('Enviado:', texto);
  }
  function alPulsar(e: MouseEvent<HTMLButtonElement>) {
    console.log('Botón con coordenadas', e.clientX, e.clientY);
  }

  return (
    <form className="card row" onSubmit={alEnviar}>
      <input value={texto} onChange={alCambiar} />
      <button onClick={alPulsar}>Enviar</button>
    </form>
  );
}
```

:::tip Truco
Si escribes el manejador **inline**, TypeScript infiere el tipo del evento solo: `onChange={(e) => setTexto(e.target.value)}`. Solo necesitas tiparlo explícitamente al extraerlo a una función aparte.
:::

## Tipar refs

```tsx
const inputRef = useRef<HTMLInputElement>(null);       // ref a un elemento: inicia en null
inputRef.current?.focus();                             // hay que comprobar null (o usar !)

const contador = useRef(0);                            // ref de valor mutable: useRef<number>
```

## Reducers con uniones discriminadas

Cada acción tiene un `type` literal y TypeScript **estrecha** el tipo en cada `case`:

```tsx run
type Estado = { cuenta: number };
type Accion =
  | { type: 'sumar'; cantidad: number }
  | { type: 'restar'; cantidad: number }
  | { type: 'reiniciar' };

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'sumar': return { cuenta: estado.cuenta + accion.cantidad };      // aquí TS sabe que existe `cantidad`
    case 'restar': return { cuenta: estado.cuenta - accion.cantidad };
    case 'reiniciar': return { cuenta: 0 };                               // y aquí NO existe
  }
}

function App() {
  const [estado, dispatch] = useReducer(reducer, { cuenta: 0 });
  return (
    <div className="card row">
      <button onClick={() => dispatch({ type: 'restar', cantidad: 1 })}>−</button>
      <strong>{estado.cuenta}</strong>
      <button onClick={() => dispatch({ type: 'sumar', cantidad: 1 })}>+</button>
      <button onClick={() => dispatch({ type: 'reiniciar' })}>0</button>
    </div>
  );
}
```

## Contexto tipado (con hook seguro)

```tsx
interface AuthContextValor { usuario: string | null; entrar: (n: string) => void; salir: () => void; }

const AuthContext = createContext<AuthContextValor | null>(null);

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');   // estrecha null → AuthContextValor
  return ctx;
}
```

## Componentes genéricos

Cuando un componente trabaja con **cualquier tipo de dato** pero quiere conservar el tipo concreto:

```tsx run
interface ListaProps<T> {
  items: T[];
  clave: (item: T) => string | number;
  render: (item: T) => React.ReactNode;
}

function Lista<T>({ items, clave, render }: ListaProps<T>) {
  return <ul>{items.map((item) => <li key={clave(item)}>{render(item)}</li>)}</ul>;
}

interface Producto { sku: string; nombre: string; precio: number }

function App() {
  const productos: Producto[] = [{ sku: 'A1', nombre: 'Teclado', precio: 90 }, { sku: 'B2', nombre: 'Ratón', precio: 40 }];
  return (
    <div className="card">
      {/* T se infiere como Producto: `p.precio` está tipado dentro de render */}
      <Lista items={productos} clave={(p) => p.sku} render={(p) => <span>{p.nombre} — S/ {p.precio}</span>} />
    </div>
  );
}
```

## Utilidades de tipos que usarás a diario

| Utilidad | Efecto |
|---|---|
| `Partial<T>` | Todas las propiedades opcionales |
| `Required<T>` | Todas obligatorias |
| `Pick<T, 'a' \| 'b'>` | Solo algunas propiedades |
| `Omit<T, 'a'>` | Todas menos algunas |
| `Record<K, V>` | Objeto con claves `K` y valores `V` |
| `ReturnType<typeof fn>` | Tipo de retorno de una función |
| `typeof x` / `keyof T` | Tipo de un valor / unión de claves |

```tsx
type UsuarioForm = Omit<Usuario, 'id'>;                       // para formularios de creación (sin id)
type Parcial = Partial<Usuario>;                              // para PATCH
const colores = { rojo: '#f00', azul: '#00f' } as const;
type Color = keyof typeof colores;                            // 'rojo' | 'azul'
```

## Buenas prácticas

1. Activa **`strict: true`** en `tsconfig.json`.
2. **Evita `any`**; usa `unknown` y estrecha con comprobaciones.
3. Deja que TS **infiera** lo que pueda; anota **fronteras** (props, funciones exportadas, respuestas de API).
4. Valida los datos externos en **tiempo de ejecución** (Zod): los tipos no existen en producción. `z.infer<typeof esquema>` te da el tipo gratis.
5. Modela estados con **uniones discriminadas** para eliminar combinaciones imposibles.

```tsx
// ✅ Estados imposibles imposibles
type Peticion<T> =
  | { estado: 'cargando' }
  | { estado: 'error'; error: string }
  | { estado: 'ok'; datos: T };
```

:::exercisets Tipa un componente
Escribe un `interface InsigniaProps` con `texto: string` y `tono?: 'ok' | 'aviso' | 'error'` (opcional, por defecto `'ok'`) y úsalo en `Insignia`. Cada insignia debe ser un `<span className="insignia">` con la clase adicional del tono (por ejemplo `tono-ok`).

```hint
`function Insignia({ texto, tono = 'ok' }: InsigniaProps) { return <span className={'insignia tono-' + tono}>{texto}</span>; }`
```

```starter
function Insignia(props: any) {
  return <span>{props.texto}</span>;
}

function App() {
  return (
    <div className="row">
      <Insignia texto="Listo" />
      <Insignia texto="Revisa" tono="aviso" />
      <Insignia texto="Falló" tono="error" />
    </div>
  );
}
```

```solution
interface InsigniaProps {
  texto: string;
  tono?: 'ok' | 'aviso' | 'error';
}

function Insignia({ texto, tono = 'ok' }: InsigniaProps) {
  return <span className={'insignia tono-' + tono}>{texto}</span>;
}

function App() {
  return (
    <div className="row">
      <Insignia texto="Listo" />
      <Insignia texto="Revisa" tono="aviso" />
      <Insignia texto="Falló" tono="error" />
    </div>
  );
}
```

```checks
await check('Defines un interface/type InsigniaProps con la unión de tonos', () => /(interface|type)\s+InsigniaProps/.test(code) && /'ok'\s*\|\s*'aviso'\s*\|\s*'error'/.test(code));
await check('No usas `any`', () => !/:\s*any\b/.test(code));
const s = $$('span.insignia');
await check('Hay 3 insignias', () => s.length === 3);
await check('La primera usa el tono por defecto "ok"', () => s[0] && s[0].classList.contains('tono-ok'));
await check('La segunda es "aviso" y la tercera "error"', () => s[1].classList.contains('tono-aviso') && s[2].classList.contains('tono-error'));
```
:::

:::quiz
? ¿Cómo tipas un estado que empieza en `null` y luego guarda un usuario?
- `useState(null)`
+ `useState<Usuario | null>(null)`
- `useState<any>()`
- `useState: Usuario`
> Sin el genérico, TS inferiría `null` como único tipo posible.

? ¿Qué tipo es el adecuado para la prop `children` más general?
- `string`
- `JSX.Element`
+ `ReactNode`
- `HTMLElement`
> Cubre elementos, texto, números, `null`, arrays, etc.

? ¿Qué ventaja tienen las uniones discriminadas en un reducer?
+ TypeScript estrecha el tipo de la acción en cada `case`, evitando acceder a campos inexistentes
- Hacen el reducer más rápido
- Evitan escribir `switch`
- Son obligatorias
> Cada acción tiene un `type` literal que identifica su forma.

? ¿Por qué hay que validar datos de una API en tiempo de ejecución aunque uses TypeScript?
+ Porque los tipos desaparecen al compilar y la API puede devolver cualquier cosa
- Porque TypeScript no funciona con `fetch`
- No hace falta
- Porque React lo exige
> Zod/Valibot validan en ejecución y pueden generar los tipos.
:::

:::summary
- Tipa **props** (interface/type), `children` (`ReactNode`), estado (`useState<T>`), eventos (`ChangeEvent<…>`), refs (`useRef<HTMLInputElement>(null)`).
- Reducers con uniones discriminadas; contexto con hook que estrecha `null`.
- Genéricos (`Lista<T>`), utilidades (`Omit`, `Partial`…), `strict`, nada de `any`, validación en runtime con Zod.
:::
