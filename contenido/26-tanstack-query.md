---
id: tanstack-query
nivel: 3
titulo: Datos del servidor con TanStack Query
icono: 🔄
tiempo: 40 min
resumen: Caché, revalidación, mutaciones y actualizaciones optimistas: la forma moderna de manejar datos remotos.
---

:::goal
Entender el concepto de **estado del servidor** y usar **TanStack Query** (`useQuery`, `useMutation`, `invalidateQueries`) en lugar de `useEffect` + `fetch` manuales.
:::

## El problema que resuelve

En la lección de `fetch` vimos que hacerlo a mano exige: estados de carga/error, cancelación, condiciones de carrera, reintentos, caché, evitar peticiones duplicadas, refrescar al volver a la pestaña, paginación… **TanStack Query** (antes *React Query*) resuelve todo eso.

Los datos del servidor son **estado asíncrono, compartido y que puede quedar obsoleto**: no son como un `useState` cualquiera. Por eso se tratan con una herramienta específica.

## Instalación y configuración

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

```jsx title="main.jsx"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

## `useQuery`: leer datos

Se identifica con una **`queryKey`** (como una clave de caché) y una **`queryFn`** que devuelve una promesa.

```jsx
import { useQuery } from '@tanstack/react-query';

async function obtenerUsuarios() {
  const res = await fetch('/api/usuarios');
  if (!res.ok) throw new Error('Error ' + res.status);       // ¡lanza el error tú!
  return res.json();
}

function Usuarios() {
  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: obtenerUsuarios,
  });

  if (isPending) return <p>Cargando…</p>;
  if (isError) return <p>Error: {error.message} <button onClick={() => refetch()}>Reintentar</button></p>;

  return (
    <>
      {isFetching && <small>Actualizando en segundo plano…</small>}
      <ul>{data.map((u) => <li key={u.id}>{u.nombre}</li>)}</ul>
    </>
  );
}
```

### Claves con parámetros

La `queryKey` **incluye todo lo que hace cambiar los datos**. Si cambia la clave, es otra consulta (otra entrada en la caché):

```jsx
function Usuario({ id }) {
  const { data } = useQuery({
    queryKey: ['usuario', id],                  // ['usuario', 7]
    queryFn: () => obtenerUsuario(id),
    enabled: id != null,                        // consulta dependiente: solo si hay id
  });
  return <h2>{data?.nombre}</h2>;
}
```

## Conceptos clave

| Concepto | Significado |
|---|---|
| **`staleTime`** | Cuánto tiempo los datos se consideran "frescos" (no se refetchean). Por defecto `0`. |
| **`gcTime`** | Cuánto se conserva en memoria una consulta sin observadores (por defecto 5 min). |
| **stale-while-revalidate** | Muestra los datos en caché **al instante** y los actualiza en segundo plano. |
| **Estados** | `isPending` (sin datos aún), `isError`, `isFetching` (cualquier petición en curso), `isSuccess`. |
| **Refetch automático** | Al volver a enfocar la ventana, al reconectar o al montar (según configuración). |
| **Deduplicación** | Varios componentes con la misma clave → **una** sola petición. |
| **Reintentos** | Por defecto reintenta fallos con *backoff* exponencial. |

## Experimenta: una mini-implementación

Para entender el *por qué*, aquí tienes una versión casera con caché y *stale-while-revalidate* (¡no la uses en producción!):

```jsx run title="Mini useQuery con caché"
const cache = new Map();
let llamadasApi = 0;

const apiPaises = (codigo) => new Promise((ok) => setTimeout(() => {
  llamadasApi++;
  ok({ PE: 'Perú 🇵🇪 — Lima', MX: 'México 🇲🇽 — CDMX', ES: 'España 🇪🇸 — Madrid' }[codigo]);
}, 700));

function useQueryLite(clave, fn) {
  const [, forzar] = useReducer((x) => x + 1, 0);
  const entrada = cache.get(clave);

  useEffect(() => {
    if (cache.get(clave)?.datos !== undefined) return;       // ya en caché: no repetir
    let vivo = true;
    fn().then((datos) => { cache.set(clave, { datos }); if (vivo) forzar(); });
    return () => { vivo = false; };
  }, [clave]);

  return { data: entrada?.datos, isPending: entrada === undefined };
}

function Pais({ codigo }) {
  const { data, isPending } = useQueryLite('pais-' + codigo, () => apiPaises(codigo));
  return <p>{isPending ? '⏳ Cargando…' : data}</p>;
}

function App() {
  const [codigo, setCodigo] = useState('PE');
  return (
    <div className="card col">
      <div className="row">{['PE', 'MX', 'ES'].map((c) => <button key={c} onClick={() => setCodigo(c)}>{c}</button>)}</div>
      <Pais codigo={codigo} />
      <small className="muted">Vuelve a una pestaña ya vista: aparece al instante desde la caché.</small>
    </div>
  );
}
```

Cambia entre PE → MX → PE: la segunda vez que ves PE **no hay "Cargando"**. TanStack Query hace esto (y muchísimo más: refetch, invalidar, reintentos…) de forma robusta.

## `useMutation`: escribir datos

Para crear/editar/borrar. Tras el éxito, **invalida** las consultas afectadas para que se refresquen:

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function NuevoUsuario() {
  const queryClient = useQueryClient();

  const mutacion = useMutation({
    mutationFn: (nuevo) => fetch('/api/usuarios', { method: 'POST', body: JSON.stringify(nuevo) }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),   // refresca la lista
  });

  return (
    <button disabled={mutacion.isPending} onClick={() => mutacion.mutate({ nombre: 'Nuevo' })}>
      {mutacion.isPending ? 'Guardando…' : 'Crear usuario'}
    </button>
  );
}
```

### Actualizaciones optimistas

Muestra el resultado **antes** de que responda el servidor y revierte si falla:

```jsx
useMutation({
  mutationFn: actualizarTarea,
  onMutate: async (tarea) => {
    await queryClient.cancelQueries({ queryKey: ['tareas'] });
    const previas = queryClient.getQueryData(['tareas']);                 // copia de seguridad
    queryClient.setQueryData(['tareas'], (lista) => lista.map((t) => (t.id === tarea.id ? tarea : t)));
    return { previas };
  },
  onError: (_err, _tarea, contexto) => queryClient.setQueryData(['tareas'], contexto.previas),  // rollback
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['tareas'] }),
});
```

## Paginación e *infinite scroll*

```jsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => obtenerPosts(pageParam),
  initialPageParam: 0,
  getNextPageParam: (ultima) => ultima.siguiente ?? undefined,
});
```

Para paginación clásica, usa `placeholderData: keepPreviousData` y evita parpadeos entre páginas.

## Buenas prácticas

1. **Crea hooks por recurso**: `useUsuarios()`, `useUsuario(id)`; encapsulan clave + función.
2. **Centraliza las claves** (fábrica de keys) para invalidar sin errores.
3. **No copies** `data` a `useState`: úsalo directamente.
4. Configura `staleTime` según lo cambiante que sea el dato.
5. Lanza **errores** en `queryFn` cuando `!res.ok`.
6. Combina con **Suspense** (`useSuspenseQuery`) y *Error Boundaries* si te gusta ese estilo.
7. En SSR/Next.js: **prefetch en el servidor** y deshidrata la caché en el cliente.

## Alternativas

**SWR** (Vercel) es más ligera; **RTK Query** va dentro de Redux Toolkit; los **loaders** de React Router/Next resuelven la carga por ruta. Los conceptos (clave, caché, revalidación, invalidación) son los mismos.

:::exercise Cachea las consultas
`useQueryLite` vuelve a pedir los datos **cada vez** que cambias de pestaña. Haz que use la caché: si ya hay datos para esa `clave`, devuélvelos al instante **sin llamar a la API**. Debajo, `<span id="llamadas">` muestra cuántas peticiones se hicieron.

```hint
Guarda los datos en un objeto/Map `cache` a nivel de módulo, léelos antes de lanzar la petición y no la lances si ya existen.
```

```starter
let llamadas = 0;
const cache = new Map();
const api = (clave) => new Promise((ok) => setTimeout(() => { llamadas++; ok('Datos de ' + clave); }, 250));

function useQueryLite(clave) {
  const [datos, setDatos] = useState(undefined);

  useEffect(() => {
    let vivo = true;
    setDatos(undefined);
    api(clave).then((d) => vivo && setDatos(d));
    return () => { vivo = false; };
  }, [clave]);

  return datos;
}

function App() {
  const [clave, setClave] = useState('A');
  const datos = useQueryLite(clave);
  return (
    <div className="card col">
      <div className="row"><button onClick={() => setClave('A')}>A</button><button onClick={() => setClave('B')}>B</button></div>
      <p id="dato">{datos === undefined ? 'Cargando…' : datos}</p>
      <small>Peticiones: <span id="llamadas">{llamadas}</span></small>
    </div>
  );
}
```

```solution
let llamadas = 0;
const cache = new Map();
const api = (clave) => new Promise((ok) => setTimeout(() => { llamadas++; ok('Datos de ' + clave); }, 250));

function useQueryLite(clave) {
  const [datos, setDatos] = useState(() => cache.get(clave));

  useEffect(() => {
    if (cache.has(clave)) { setDatos(cache.get(clave)); return; }
    let vivo = true;
    setDatos(undefined);
    api(clave).then((d) => {
      cache.set(clave, d);
      if (vivo) setDatos(d);
    });
    return () => { vivo = false; };
  }, [clave]);

  return datos;
}

function App() {
  const [clave, setClave] = useState('A');
  const datos = useQueryLite(clave);
  return (
    <div className="card col">
      <div className="row"><button onClick={() => setClave('A')}>A</button><button onClick={() => setClave('B')}>B</button></div>
      <p id="dato">{datos === undefined ? 'Cargando…' : datos}</p>
      <small>Peticiones: <span id="llamadas">{llamadas}</span></small>
    </div>
  );
}
```

```checks
await waitFor(() => text('#dato') === 'Datos de A', 2000);
await click(btn('B'));
await waitFor(() => text('#dato') === 'Datos de B', 2000);
await click(btn('A'));
await check('Al volver a A los datos aparecen al instante (sin "Cargando…")', () => text('#dato') === 'Datos de A');
await click(btn('B'));
await check('Y B también viene de la caché', () => text('#dato') === 'Datos de B');
await check('Solo se hicieron 2 peticiones en total', () => llamadasTotales() === 2);
function llamadasTotales() { return Number(text('#llamadas')) || 0; }
```
:::

:::quiz
? ¿Qué significa *stale-while-revalidate*?
+ Mostrar datos en caché inmediatamente y actualizarlos en segundo plano
- Borrar la caché en cada petición
- Esperar a que el servidor responda siempre
- No reintentar nunca
> Mejora la sensación de velocidad.

? ¿Qué debe incluir la `queryKey`?
+ Todo lo que haga cambiar los datos (por ejemplo, el `id` o los filtros)
- Solo un nombre fijo
- La URL completa siempre
- Nada
> Si cambia la clave, es otra consulta con su propia caché.

? ¿Qué se hace normalmente tras una mutación exitosa?
+ Invalidar las consultas afectadas con `invalidateQueries`
- Recargar la página
- Borrar `localStorage`
- Reiniciar el servidor
> Así la lista se vuelve a pedir y se actualiza.

? ¿Qué NO conviene hacer con `data` de `useQuery`?
- Renderizarlo
+ Copiarlo a un `useState` y mantenerlo sincronizado a mano
- Pasarlo como prop
- Derivar valores de él
> Duplicarlo rompe la fuente única de la verdad.
:::

:::summary
- Estado del servidor ≠ estado local: necesita caché, revalidación, reintentos y deduplicación.
- `useQuery({ queryKey, queryFn })`, `useMutation` + `invalidateQueries`, actualizaciones optimistas.
- Claves bien diseñadas, hooks por recurso y no copiar `data` a estado.
:::
