---
id: intro
nivel: 0
titulo: ¿Qué es React y por qué usarlo?
icono: ⚛️
tiempo: 15 min
resumen: Entiende qué problema resuelve React, cómo piensa y cómo vas a aprender con este curso.
---

:::goal
Al terminar esta lección sabrás **qué es React**, qué problema resuelve, qué significan *componentes*, *declarativo* y *Virtual DOM*, y verás tu primer componente funcionando.
:::

## ¿Qué es React?

**React** es una biblioteca de JavaScript para construir **interfaces de usuario**. La creó Meta (Facebook) y hoy es una de las herramientas más usadas del desarrollo web. Con React no manipulas la página a mano: **describes cómo debe verse la interfaz según los datos** y React se encarga de actualizarla.

Piensa en una hoja de cálculo: cuando cambias una celda, las fórmulas que dependen de ella se recalculan solas. En React ocurre algo parecido: cuando cambian los datos (el **estado**), la interfaz se vuelve a calcular y se actualiza.

## El problema que resuelve

Sin React, para mostrar un contador tendrías que buscar el elemento, escuchar el clic, actualizar el texto y no olvidar ningún caso. En apps grandes eso se vuelve inmanejable:

```js title="Estilo imperativo (sin React)"
const boton = document.querySelector('#sumar');
const texto = document.querySelector('#contador');
let n = 0;
boton.addEventListener('click', () => {
  n++;
  texto.textContent = 'Contador: ' + n; // tú actualizas el DOM a mano
});
```

Con React describes el resultado y listo. Pruébalo, **este código es editable**: cambia el texto o el valor inicial.

```jsx run title="Estilo declarativo (con React)"
function App() {
  const [n, setN] = useState(0);

  return (
    <div className="card row">
      <button onClick={() => setN(n + 1)}>Sumar</button>
      <strong>Contador: {n}</strong>
    </div>
  );
}
```

No dijimos *cómo* actualizar la pantalla; solo dijimos **qué mostrar para cada valor de `n`**. Eso es ser **declarativo**.

## Las 4 ideas clave de React

| Idea | Qué significa |
|---|---|
| **Componentes** | La UI se divide en piezas reutilizables (botón, tarjeta, formulario…) que se combinan como bloques de LEGO. |
| **Declarativo** | Describes *qué* quieres ver, no los pasos para lograrlo. |
| **Flujo de datos unidireccional** | Los datos bajan de padres a hijos mediante *props*. Es fácil seguir el rastro de un dato. |
| **Estado** | La memoria de un componente. Cuando cambia, React vuelve a dibujar lo necesario. |

### Componentes: pensar en piezas

Una página típica se descompone en un árbol de componentes:

```text
App
├── Cabecera
│   ├── Logo
│   └── Menu
├── ListaDeProductos
│   ├── Producto
│   ├── Producto
│   └── Producto
└── PiePagina
```

Cada `Producto` es el **mismo componente** usado varias veces con datos distintos. Escribes una vez, reutilizas muchas.

## ¿Cómo actualiza React la pantalla? (Virtual DOM)

Tocar el DOM real es costoso. React mantiene una **representación ligera en memoria** de la interfaz (el *Virtual DOM*, es decir, un árbol de objetos). Cuando el estado cambia:

1. React vuelve a ejecutar tus componentes y genera un **nuevo árbol**.
2. Lo **compara** con el anterior (proceso llamado *reconciliación*).
3. Aplica en el DOM real **solo las diferencias mínimas**.

:::info Para recordar
No necesitas manejar el Virtual DOM tú mismo: es un detalle interno. Lo importante es la idea: *tú describes el resultado, React calcula los cambios*.
:::

## React vs. frameworks

React es una **biblioteca** (se centra en la UI). Para una aplicación completa se combina con otras piezas: enrutado, datos, estilos, etc. Existen *frameworks* construidos sobre React (como **Next.js** o **React Router en modo framework**) que ya integran todo eso. En este curso empezamos por React puro y llegamos hasta esos temas.

## ¿Qué necesito saber antes?

- **HTML y CSS** básicos.
- **JavaScript**: variables, funciones, arrays y objetos. En la siguiente lección repasamos lo moderno que React usa a diario.

## Cómo usar este curso

- 📖 **Lee** cada lección en orden; los niveles se apoyan unos en otros.
- ⚡ **Edita los ejemplos**: tocar el código es la mejor forma de aprender. Con [[Ctrl]]+[[Enter]] lo ejecutas.
- 🏋️ **Haz los ejercicios**: tienen comprobación automática y pistas.
- 🧪 **Responde los quizzes** para fijar conceptos.
- 🔎 Busca cualquier tema con [[Ctrl]]+[[K]] y experimenta libremente en el **Playground**.

:::tip
En los ejemplos no necesitas escribir `import`: `useState`, `useEffect`, `useRef`, etc. ya están disponibles. En un proyecto real sí los importarás de `'react'`; lo verás en la lección del entorno.
:::

:::exercise Tu primer cambio
Modifica el componente para que muestre **tu nombre** dentro de la etiqueta `<h1>` en lugar de `Mundo`, y añade un párrafo `<p>` debajo con cualquier frase.

```hint
Cambia el texto entre `<h1>` y `</h1>`. Recuerda que JSX se parece a HTML.
```

```starter
function App() {
  return (
    <div className="card">
      <h1>Hola, Mundo</h1>
    </div>
  );
}
```

```solution
function App() {
  return (
    <div className="card">
      <h1>Hola, Ana</h1>
      <p>¡Estoy aprendiendo React!</p>
    </div>
  );
}
```

```checks
await check('Hay un <h1> con un texto distinto de "Mundo"', () => $('h1') && !text('h1').includes('Mundo') && text('h1').length > 0);
await check('Hay un párrafo <p> con texto', () => text('p').length > 2);
```
:::

:::quiz
? ¿Qué significa que React sea **declarativo**?
- Que debes escribir los pasos exactos para modificar el DOM
+ Que describes cómo debe verse la UI para un estado dado y React se encarga de actualizarla
- Que solo funciona en el servidor
- Que no usa JavaScript
> En el enfoque declarativo describes el resultado deseado; React calcula y aplica los cambios.

? ¿Qué es un componente?
- Un archivo CSS
+ Una pieza reutilizable de interfaz que puede recibir datos y tener su propio estado
- Una base de datos
- Un tipo especial de variable global
> Los componentes son los bloques con los que se construye toda la UI.

? ¿Qué hace React con el Virtual DOM cuando cambia el estado?
- Recarga la página completa
+ Compara el árbol nuevo con el anterior y aplica solo las diferencias en el DOM real
- Borra el DOM y lo vuelve a crear siempre
- Nada, el navegador lo hace solo
> Esa comparación se llama reconciliación.
:::

:::summary
- React = biblioteca para construir interfaces con **componentes**.
- Es **declarativo**: describes el resultado, no los pasos.
- El **estado** cambia → React recalcula la UI y actualiza solo lo necesario.
:::
