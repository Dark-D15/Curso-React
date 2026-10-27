---
id: estado
nivel: 1
titulo: Estado con useState
icono: 🧠
tiempo: 40 min
resumen: La memoria de un componente: cómo funciona useState, el "snapshot" del estado y cómo actualizar números, objetos y arrays.
---

:::goal
Usar `useState` con soltura: entender el re-renderizado, las actualizaciones funcionales, la inmutabilidad en objetos/arrays y la **instantánea** (snapshot) del estado.
:::

## ¿Por qué no bastan las variables normales?

Intentemos un contador con una variable local:

```jsx run title="❌ No funciona: la pantalla no se actualiza"
function App() {
  let cuenta = 0;
  function sumar() {
    cuenta = cuenta + 1;
    console.log('cuenta vale', cuenta);   // sube en la consola…
  }
  return (
    <div className="card row">
      <button onClick={sumar}>Sumar</button>
      <span>Cuenta: {cuenta}</span>       {/* …pero aquí siempre 0 */}
    </div>
  );
}
```

Hay **dos problemas**:

1. Las variables locales **no persisten** entre renderizados (cada render ejecuta la función desde cero).
2. Cambiarlas **no avisa a React** de que debe volver a dibujar.

`useState` resuelve ambos.

## `useState`

```jsx run
function App() {
  const [cuenta, setCuenta] = useState(0);

  return (
    <div className="card row">
      <button onClick={() => setCuenta(cuenta + 1)}>Sumar</button>
      <span>Cuenta: {cuenta}</span>
    </div>
  );
}
```

`useState(0)` devuelve **un par**: el valor actual (`cuenta`) y la función para cambiarlo (`setCuenta`). Cuando llamas a `setCuenta`, React **recuerda el nuevo valor y vuelve a renderizar** el componente.

### Anatomía

```text
const [ valor, setValor ] = useState( valorInicial );
        │         │                        └─ solo se usa en el primer render
        │         └─ función que programa un nuevo render con otro valor
        └─ el estado en ESTE render
```

### El ciclo de vida de una actualización

```text
1. Evento (clic)  →  2. setState(nuevo)  →  3. React vuelve a llamar a tu componente
                                              4. Nuevo JSX  →  5. Se actualiza el DOM (solo diferencias)
```

## Reglas de los hooks (adelanto)

Los hooks (funciones que empiezan por `use`) solo se llaman **en el nivel superior** de un componente o de otro hook: nunca dentro de `if`, bucles o funciones anidadas. Lo ampliamos en la lección de *Reglas de los hooks*.

## El estado es una **instantánea** (snapshot)

Dentro de cada render, el valor de `cuenta` es **fijo**. `setCuenta` no cambia la variable actual: programa el **siguiente** render. Observa el resultado de este ejemplo:

```jsx run title="¿Cuánto suma el botón?"
function App() {
  const [n, setN] = useState(0);

  function sumarTres() {
    setN(n + 1);   // n vale 0 en este render → setN(1)
    setN(n + 1);   // sigue siendo 0 → setN(1)
    setN(n + 1);   // sigue siendo 0 → setN(1)
    console.log('Dentro del manejador n sigue valiendo', n);
  }

  return (
    <div className="card row">
      <button onClick={sumarTres}>+3 (versión ingenua)</button>
      <strong>{n}</strong>
    </div>
  );
}
```

Solo suma 1. Para encadenar cambios basados en el valor anterior usa la **forma funcional**: pasa una función que recibe el estado pendiente.

```jsx run title="Actualización funcional"
function App() {
  const [n, setN] = useState(0);

  function sumarTres() {
    setN((prev) => prev + 1);   // 0 → 1
    setN((prev) => prev + 1);   // 1 → 2
    setN((prev) => prev + 1);   // 2 → 3
  }

  return (
    <div className="card row">
      <button onClick={sumarTres}>+3 (funcional)</button>
      <strong>{n}</strong>
    </div>
  );
}
```

:::tip Regla práctica
Si el nuevo valor **depende del anterior**, usa `setX(prev => ...)`. Si no depende (por ejemplo, `setNombre(e.target.value)`), pasa el valor directo.
:::

## Varios estados en un componente

Puedes usar `useState` tantas veces como necesites. Un estado por "cosa que cambia de forma independiente":

```jsx run
function App() {
  const [nombre, setNombre] = useState('');
  const [aceptado, setAceptado] = useState(false);
  const [vistas, setVistas] = useState(0);

  return (
    <div className="card col">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
      <label><input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)} /> Acepto los términos</label>
      <button onClick={() => setVistas((v) => v + 1)}>Vistas: {vistas}</button>
      <p className="muted">Hola {nombre || '…'} {aceptado ? '✅' : ''}</p>
    </div>
  );
}
```

## Estado con objetos: no mutar

El estado se trata como **inmutable**. Para cambiar un objeto, crea **uno nuevo** con *spread*:

```jsx run
function App() {
  const [usuario, setUsuario] = useState({ nombre: 'Ana', ciudad: 'Lima', edad: 28 });

  function cumplir() {
    // ❌ usuario.edad++ (mutación: React no detecta el cambio)
    setUsuario({ ...usuario, edad: usuario.edad + 1 });   // ✅ copia + cambio
  }

  return (
    <div className="card col">
      <p>{usuario.nombre} ({usuario.edad}) — {usuario.ciudad}</p>
      <div className="row">
        <button onClick={cumplir}>🎂 Cumplir años</button>
        <button onClick={() => setUsuario({ ...usuario, ciudad: 'Cusco' })}>Mudarse a Cusco</button>
      </div>
    </div>
  );
}
```

Para objetos **anidados**, copia cada nivel que cambia: `{ ...u, direccion: { ...u.direccion, calle: 'Nueva' } }`.

## Estado con arrays

| Acción | Forma inmutable |
|---|---|
| Agregar | `setLista([...lista, nuevo])` |
| Quitar | `setLista(lista.filter(x => x.id !== id))` |
| Modificar | `setLista(lista.map(x => x.id === id ? { ...x, hecho: true } : x))` |
| Ordenar | `setLista([...lista].sort(...))` |
| Insertar al inicio | `setLista([nuevo, ...lista])` |

```jsx run
function App() {
  const [nombres, setNombres] = useState(['Ana', 'Luis']);
  const [n, setN] = useState(1);

  return (
    <div className="card col">
      <div className="row">
        <button onClick={() => { setNombres([...nombres, 'Persona ' + n]); setN(n + 1); }}>Añadir</button>
        <button onClick={() => setNombres(nombres.slice(0, -1))}>Quitar último</button>
        <button onClick={() => setNombres([...nombres].reverse())}>Invertir</button>
      </div>
      <ul>{nombres.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}
```

:::info Immer
Si el estado anidado se vuelve engorroso, la librería **Immer** (`useImmer`) permite escribir "mutaciones" y produce copias inmutables por ti.
:::

## Inicialización perezosa

Si calcular el valor inicial es caro, pasa una **función**: solo se ejecuta en el primer render.

```jsx
const [datos, setDatos] = useState(() => JSON.parse(localStorage.getItem('datos')) ?? []);
// useState(calcularCaro()) ❌ se calcula en CADA render aunque se ignore
```

## Estado aislado y reinicio con `key`

Cada **instancia** de un componente tiene su estado independiente. Y si cambias la `key` de un componente, React lo trata como uno nuevo y **reinicia** su estado:

```jsx run
function Contador({ etiqueta }) {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{etiqueta}: {n}</button>;
}

function App() {
  const [version, setVersion] = useState(1);
  return (
    <div className="card col">
      <div className="row"><Contador etiqueta="A" /><Contador etiqueta="B" /></div>
      <Contador key={version} etiqueta={'Reiniciable v' + version} />
      <button onClick={() => setVersion(version + 1)}>♻️ Reiniciar el tercero (nueva key)</button>
    </div>
  );
}
```

## Errores comunes

:::danger Errores típicos con el estado
- **Mutar directamente**: `lista.push(x); setLista(lista)` → misma referencia, no hay re-render.
- **Llamar al setter durante el render**: `setN(1)` suelto dentro del componente produce un bucle infinito.
- **Esperar el valor nuevo justo después de `setX`**: sigue siendo el antiguo hasta el próximo render.
- **Copiar props al estado** sin necesidad: `useState(props.valor)` ignora cambios posteriores de la prop.
:::

:::exercise Contador con límites
Haz un contador con tres botones: **+**, **−** y **Reiniciar**. El valor nunca debe bajar de 0 (el botón **−** no hace nada en 0). Muestra el valor en un `<strong>`.

```hint
`setN(prev => Math.max(0, prev - 1))` evita pasar de 0.
```

```starter
function App() {
  // Crea el estado aquí

  return (
    <div className="card row">
      <button>−</button>
      <strong>0</strong>
      <button>+</button>
      <button>Reiniciar</button>
    </div>
  );
}
```

```solution
function App() {
  const [n, setN] = useState(0);

  return (
    <div className="card row">
      <button onClick={() => setN((prev) => Math.max(0, prev - 1))}>−</button>
      <strong>{n}</strong>
      <button onClick={() => setN((prev) => prev + 1)}>+</button>
      <button onClick={() => setN(0)}>Reiniciar</button>
    </div>
  );
}
```

```checks
await check('Empieza en 0', () => text('strong') === '0');
await click(btn('−'));
await check('Pulsar "−" en 0 no baja de 0', () => text('strong') === '0');
await click(btn('+')); await click(btn('+')); await click(btn('+'));
await check('Tras 3 clics en "+" vale 3', () => text('strong') === '3');
await click(btn('−'));
await check('Pulsar "−" resta 1 (queda 2)', () => text('strong') === '2');
await click(btn('Reiniciar'));
await check('"Reiniciar" vuelve a 0', () => text('strong') === '0');
```
:::

:::exercise Botón "Me gusta"
Crea un botón con **dos estados**: `liked` (booleano) y `likes` (número, inicia en 10). Al hacer clic: alterna `liked` y suma 1 si pasa a "me gusta" o resta 1 si se quita. El botón muestra `❤️ Quitar` cuando está activo y `🤍 Me gusta` cuando no; junto a él, un `<span>` con el total.

```hint
Puedes calcular `likes` directamente: `setLikes(l => liked ? l - 1 : l + 1)` y `setLiked(!liked)`.
```

```starter
function App() {
  return (
    <div className="card row">
      <button>🤍 Me gusta</button>
      <span>10</span>
    </div>
  );
}
```

```solution
function App() {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(10);

  function alternar() {
    setLiked(!liked);
    setLikes((l) => (liked ? l - 1 : l + 1));
  }

  return (
    <div className="card row">
      <button onClick={alternar}>{liked ? '❤️ Quitar' : '🤍 Me gusta'}</button>
      <span>{likes}</span>
    </div>
  );
}
```

```checks
await check('Inicia con "Me gusta" y 10', () => btn('Me gusta') && text('span') === '10');
await click(btn('Me gusta'));
await check('Tras el clic muestra "Quitar" y 11', () => btn('Quitar') && text('span') === '11');
await click(btn('Quitar'));
await check('Al quitar vuelve a 10 y "Me gusta"', () => btn('Me gusta') && text('span') === '10');
```
:::

:::quiz
? ¿Qué devuelve `useState(0)`?
- Solo el valor
- Solo la función
+ Un array con el valor actual y la función para actualizarlo
- Un objeto con `get` y `set`
> Normalmente se desestructura: `const [valor, setValor] = useState(0)`.

? Si `n` vale 0 y ejecutas `setN(n+1)` tres veces seguidas en el mismo manejador, ¿cuánto vale `n` en el siguiente render?
- 3
+ 1
- 0
- Depende del navegador
> Cada llamada usa el mismo valor "instantánea" de `n` (0). Con `setN(prev => prev + 1)` serían 3.

? ¿Cuál actualiza correctamente el estado de un array?
- `lista.push(x); setLista(lista)`
+ `setLista([...lista, x])`
- `lista[0] = x`
- `setLista.push(x)`
> Debes crear un nuevo array para que React detecte el cambio.

? ¿Qué pasa si llamas a `setN(5)` directamente en el cuerpo del componente (fuera de eventos/efectos)?
- Funciona normal
+ Provoca un bucle de renderizados infinito (error)
- No hace nada
- Cambia el valor sin renderizar
> Actualizar estado durante el render lo vuelve a disparar sin fin.
:::

:::summary
- `useState(inicial)` → `[valor, setValor]`; cambiarlo vuelve a renderizar.
- El valor es una **instantánea** por render; usa `setX(prev => …)` cuando dependes del anterior.
- Objetos y arrays: **inmutables** (spread, `map`, `filter`).
- Cada instancia tiene su estado; cambiar la `key` lo reinicia.
:::
