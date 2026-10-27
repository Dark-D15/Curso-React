---
id: js-esencial
nivel: 0
titulo: JavaScript moderno que necesitas
icono: 🟨
tiempo: 35 min
resumen: Repaso de las características de JavaScript (ES6+) que React usa constantemente. Con consola interactiva.
---

:::goal
Dominar lo justo de JavaScript moderno para leer y escribir React con soltura: `const/let`, funciones flecha, desestructuración, *spread*, métodos de arrays, módulos, asincronía y **closures**.
:::

React **es** JavaScript. Quien domina estas bases aprende React mucho más rápido. Los bloques de esta lección se ejecutan como JavaScript puro: mira la **consola** a la derecha.

## Variables: `const` y `let`

Usa `const` por defecto; usa `let` solo si vas a reasignar. Evita `var`. En React casi todo es `const`.

```js run
const nombre = 'Ana';        // no se puede reasignar
let contador = 0;            // sí se puede
contador = contador + 1;

console.log(nombre, contador);

// OJO: const no hace el valor inmutable, solo impide reasignar la variable
const lista = [1, 2];
lista.push(3);               // permitido (se muta el array)
console.log(lista);
```

## Plantillas de texto y funciones flecha

```js run
const producto = 'Café';
const precio = 3.5;

// Template literal: interpola expresiones con ${ }
console.log(`El ${producto} cuesta $${precio.toFixed(2)}`);

// Función tradicional vs. flecha
function sumar(a, b) { return a + b; }
const sumarFlecha = (a, b) => a + b;        // retorno implícito
const doble = n => n * 2;                    // un parámetro: paréntesis opcionales
const crear = (n) => ({ id: n, activo: true }); // para devolver un objeto, envuélvelo en ( )

console.log(sumar(2, 3), sumarFlecha(2, 3), doble(4), crear(7));
```

## Desestructuración

Extrae valores de objetos y arrays en una sola línea. **Lo verás en cada componente** (`const { nombre } = props`, `const [valor, setValor] = useState()`).

```js run
const usuario = { nombre: 'Luis', edad: 30, ciudad: 'Lima' };

// Objetos: por nombre de propiedad
const { nombre, edad } = usuario;
const { ciudad: city = 'Desconocida', pais = 'Perú' } = usuario; // renombrar y valor por defecto
console.log(nombre, edad, city, pais);

// Arrays: por posición
const colores = ['rojo', 'verde', 'azul'];
const [primero, , tercero] = colores;
console.log(primero, tercero);

// En parámetros de función
function saludar({ nombre, edad }) {
  return `${nombre} tiene ${edad} años`;
}
console.log(saludar(usuario));
```

## Spread `...` y rest

El *spread* copia elementos o propiedades. En React lo usarás para **actualizar estado sin mutar**.

```js run
const base = { a: 1, b: 2 };
const copia = { ...base, b: 99, c: 3 };   // lo último gana
console.log(base, copia);                 // base NO cambió

const nums = [1, 2, 3];
const masNums = [...nums, 4];
const sinElPrimero = nums.slice(1);
console.log(masNums, sinElPrimero);

// rest: agrupa "el resto"
const [cabeza, ...cola] = [10, 20, 30];
const { a, ...resto } = { a: 1, x: 2, y: 3 };
console.log(cabeza, cola, a, resto);
```

## Métodos de arrays (los más importantes)

`map`, `filter`, `find`, `some`, `every`, `reduce` y `sort` son la base para **renderizar listas**. Todos (salvo `sort`) devuelven un array nuevo en vez de modificar el original.

```js run
const productos = [
  { id: 1, nombre: 'Pan', precio: 2, stock: true },
  { id: 2, nombre: 'Leche', precio: 4, stock: false },
  { id: 3, nombre: 'Queso', precio: 9, stock: true },
];

console.log(productos.map(p => p.nombre));                  // transforma cada elemento
console.log(productos.filter(p => p.stock).length);         // se queda con los que cumplen
console.log(productos.find(p => p.id === 3));               // primero que cumple (o undefined)
console.log(productos.some(p => !p.stock));                 // ¿alguno cumple?
console.log(productos.every(p => p.precio > 1));            // ¿todos cumplen?
console.log(productos.reduce((total, p) => total + p.precio, 0)); // acumula

// sort MUTA el array: copia antes de ordenar
const ordenados = [...productos].sort((a, b) => b.precio - a.precio);
console.log(ordenados.map(p => p.nombre));
```

## Operadores útiles: ternario, `&&`, `||`, `??`, `?.`

```js run
const edad = 20;
console.log(edad >= 18 ? 'adulto' : 'menor');       // ternario

const user = { perfil: { avatar: null } };
console.log(user.perfil?.avatar);                    // ?. evita errores si algo es null/undefined
console.log(user.direccion?.calle);                  // undefined (no explota)

console.log(0 || 'valor por defecto');               // || trata 0 como "falso" → 'valor por defecto'
console.log(0 ?? 'valor por defecto');               // ?? solo reemplaza null/undefined → 0

const tieneSesion = true;
console.log(tieneSesion && 'Bienvenido');            // && devuelve el segundo si el primero es truthy
console.log(false && 'nunca se evalúa');
```

:::warn Falsy que sorprenden
En JavaScript son *falsy*: `false`, `0`, `''`, `null`, `undefined`, `NaN`. En React, `{contador && <p>Hay items</p>}` con `contador = 0` **pinta un `0`** en pantalla. Lo veremos en renderizado condicional.
:::

## Módulos: `import` / `export`

En un proyecto real cada archivo es un módulo. Estos bloques no se ejecutan aquí, pero los verás en todos los proyectos:

```js title="utils.js"
export const IVA = 0.18;                       // export nombrado
export function conIva(precio) { return precio * (1 + IVA); }
export default function formatear(n) { return n.toFixed(2); } // export por defecto (uno por archivo)
```

```js title="main.js"
import formatear, { IVA, conIva } from './utils.js';  // default sin llaves, nombrados con llaves
import * as utils from './utils.js';                  // todo como objeto
```

## Asincronía: Promesas y `async/await`

Pedir datos a un servidor toma tiempo. JavaScript no se bloquea: usa **promesas**.

```js run
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function cargarUsuario() {
  console.log('Cargando…');
  await esperar(600);                           // "pausa" esta función sin bloquear la página
  return { id: 1, nombre: 'Ana' };
}

async function main() {
  try {
    const usuario = await cargarUsuario();
    console.log('Listo:', usuario);
  } catch (error) {
    console.error('Falló', error);
  } finally {
    console.log('Fin');
  }
}
main();
```

Con `fetch` real sería: `const res = await fetch(url); const datos = await res.json();`. Recuerda comprobar `res.ok`.

## Closures (clave para entender los hooks)

Una función **recuerda las variables del lugar donde fue creada**. Cada renderizado de un componente React es una función nueva con sus propias variables; entender esto evita muchos errores con `useState` y `useEffect`.

```js run
function crearContador() {
  let cuenta = 0;               // variable "capturada"
  return () => {
    cuenta++;
    return cuenta;
  };
}
const a = crearContador();
const b = crearContador();
console.log(a(), a(), a());     // 1 2 3
console.log(b());               // 1 → cada closure tiene su propia copia
```

## Inmutabilidad: no mutes, copia

React detecta cambios comparando **referencias**. Si mutas un objeto/array existente, React puede no darse cuenta. Crea copias nuevas:

| ❌ Mutar | ✅ Copiar |
|---|---|
| `arr.push(x)` | `[...arr, x]` |
| `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| `obj.nombre = 'X'` | `{ ...obj, nombre: 'X' }` |
| `arr[i] = y` | `arr.map((v, idx) => idx === i ? y : v)` |
| `arr.sort()` | `[...arr].sort()` o `arr.toSorted()` |

:::exercisejs Practica con arrays
Tienes una lista de productos. Calcula:

1. `nombres`: un array con los nombres de **solo los productos con stock**.
2. `total`: la suma de los precios de esos mismos productos.

Muestra cada resultado con `console.log` (primero `nombres`, luego `total`).

```hint
Encadena `.filter(...)` y luego `.map(...)` para los nombres; usa `.reduce(...)` para el total.
```

```starter
const productos = [
  { nombre: 'Pan', precio: 2, stock: true },
  { nombre: 'Leche', precio: 4, stock: false },
  { nombre: 'Queso', precio: 9, stock: true },
];

const nombres = [];   // ← reemplázame
const total = 0;      // ← reemplázame

console.log(nombres);
console.log(total);
```

```solution
const productos = [
  { nombre: 'Pan', precio: 2, stock: true },
  { nombre: 'Leche', precio: 4, stock: false },
  { nombre: 'Queso', precio: 9, stock: true },
];

const disponibles = productos.filter(p => p.stock);
const nombres = disponibles.map(p => p.nombre);
const total = disponibles.reduce((suma, p) => suma + p.precio, 0);

console.log(nombres);
console.log(total);
```

```checks
const l = logs();
await check('Muestra los nombres ["Pan", "Queso"]', () => (l[0] || '').replace(/\s/g, '') === '["Pan","Queso"]');
await check('Muestra el total 11', () => (l[1] || '').trim() === '11');
```
:::

:::quiz
? ¿Cuál es la forma correcta de **agregar** un elemento a un array guardado en el estado de React?
- `lista.push(nuevo)`
+ `[...lista, nuevo]`
- `lista[lista.length] = nuevo`
- `lista.concat = nuevo`
> Debes crear un array nuevo para que React detecte el cambio por referencia.

? ¿Qué devuelve `0 ?? 'x'`?
+ `0`
- `'x'`
- `undefined`
- `null`
> `??` solo usa el valor de la derecha si la izquierda es `null` o `undefined`; `0` es un valor válido.

? En `const [a, b] = useState(0)` se está usando…
- Spread de objetos
- Una función flecha
+ Desestructuración de arrays
- Una promesa
> `useState` devuelve un array de dos posiciones y lo desestructuras con nombres propios.

? ¿Qué método devuelve un **nuevo array** con los elementos que cumplen una condición?
- `map`
+ `filter`
- `find`
- `reduce`
> `filter` conserva solo los elementos para los que la función devuelve `true`.
:::

:::summary
- `const` por defecto; funciones flecha; template literals.
- Desestructuración y spread son el pan de cada día en React.
- `map/filter/reduce` para transformar datos; **no mutar**, copiar.
- Closures: cada función recuerda su entorno (muy importante en hooks).
:::
