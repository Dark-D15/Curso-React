---
id: eventos
nivel: 1
titulo: Eventos
icono: 🖱️
tiempo: 25 min
resumen: Responder a clics, teclado y formularios. Pasar funciones (no llamarlas), el objeto evento y la propagación.
---

:::goal
Manejar eventos con `onClick`, `onChange`, `onSubmit`…, pasar argumentos, usar el objeto del evento, y entender la propagación y `preventDefault`.
:::

## Manejadores de eventos

Se añaden como props con **camelCase** y reciben **una función**:

```jsx run
function App() {
  function handleClick() {
    console.log('¡Clic!');
    alert('Hola 👋');
  }
  return <button onClick={handleClick}>Pulsa aquí</button>;
}
```

### ⚠️ Pasa la función, no la llames

```jsx
<button onClick={handleClick}>OK</button>      // ✅ pasas la función: se ejecutará al hacer clic
<button onClick={handleClick()}>MAL</button>   // ❌ la llamas AHORA, en cada render
<button onClick={() => handleClick()}>OK</button> // ✅ una función flecha que la llamará luego
```

## Pasar argumentos

Envuelve la llamada en una función flecha:

```jsx run
function App() {
  function saludar(nombre) {
    console.log('Hola, ' + nombre);
  }
  return (
    <div className="row">
      <button onClick={() => saludar('Ana')}>Saluda a Ana</button>
      <button onClick={() => saludar('Luis')}>Saluda a Luis</button>
    </div>
  );
}
```

## El objeto evento

React entrega al manejador un **evento sintético** (envoltorio multinavegador del evento nativo), con las propiedades que ya conoces: `target`, `currentTarget`, `key`, `clientX`, etc.

```jsx run
function App() {
  function handleKey(e) {
    console.log('Tecla:', e.key, '| valor actual:', e.target.value);
  }
  return <input onKeyDown={handleKey} placeholder="Escribe y mira la consola" />;
}
```

## Eventos más usados

| Categoría | Eventos |
|---|---|
| Ratón | `onClick`, `onDoubleClick`, `onMouseEnter`, `onMouseLeave`, `onContextMenu` |
| Teclado | `onKeyDown`, `onKeyUp` |
| Formularios | `onChange`, `onInput`, `onSubmit`, `onFocus`, `onBlur` |
| Arrastrar | `onDragStart`, `onDrop` |
| Táctil / puntero | `onPointerDown`, `onTouchStart` |
| Scroll / otros | `onScroll`, `onWheel`, `onCopy`, `onPaste` |

:::info `onChange` en React
A diferencia del HTML nativo (donde `change` se dispara al salir del campo), en React `onChange` se dispara **en cada pulsación**, como `input`.
:::

## `preventDefault`: evitar el comportamiento por defecto

El ejemplo clásico: un formulario recarga la página al enviarse. Lo evitas con `e.preventDefault()`:

```jsx run
function App() {
  function handleSubmit(e) {
    e.preventDefault();
    const datos = new FormData(e.target);
    console.log('Enviado:', datos.get('nombre'));
  }
  return (
    <form className="row" onSubmit={handleSubmit}>
      <input name="nombre" placeholder="Tu nombre" />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Propagación (bubbling)

Los eventos **suben** del elemento más interno hacia sus padres. `e.stopPropagation()` detiene esa subida.

```jsx run
function App() {
  return (
    <div className="card" onClick={() => console.log('1) clic en el DIV')} style={{ cursor: 'pointer' }}>
      <p>Haz clic en el texto (el div también lo recibe)</p>
      <button onClick={(e) => { e.stopPropagation(); console.log('2) clic en el BOTÓN (no sube)'); }}>
        Botón que detiene la propagación
      </button>
    </div>
  );
}
```

Para escuchar en la fase de **captura** (de padre a hijo) existe la variante `onClickCapture`.

## Eventos en tus propios componentes

Los componentes propios **no tienen eventos mágicos**: tú decides los nombres de las props.

```jsx run
function Boton({ onPulsar, children }) {
  return <button className="btn" onClick={onPulsar}>{children}</button>;
}

function App() {
  return <Boton onPulsar={() => console.log('¡Pulsado desde el padre!')}>Pulsa</Boton>;
}
```

:::exercise Botones con argumentos
Completa los manejadores: cada botón debe llamar a `registrar` con **su propio nombre** al hacer clic (`'rojo'` o `'azul'`). `registrar` ya hace `console.log('Color: ' + color)`.

```hint
`onClick={() => registrar('rojo')}`. No llames a la función directamente: pásala dentro de una flecha.
```

```starter
function App() {
  function registrar(color) {
    console.log('Color: ' + color);
  }

  return (
    <div className="row">
      <button>rojo</button>
      <button>azul</button>
    </div>
  );
}
```

```solution
function App() {
  function registrar(color) {
    console.log('Color: ' + color);
  }

  return (
    <div className="row">
      <button onClick={() => registrar('rojo')}>rojo</button>
      <button onClick={() => registrar('azul')}>azul</button>
    </div>
  );
}
```

```checks
await check('Al montar no se ejecuta registrar (no la llamaste directamente)', () => logs().length === 0);
await click(btn('rojo'));
await check('Pulsar "rojo" registra "Color: rojo"', () => logs().includes('Color: rojo'));
await click(btn('azul'));
await check('Pulsar "azul" registra "Color: azul"', () => logs().includes('Color: azul'));
```
:::

:::quiz
? ¿Cuál es la forma correcta de asignar el manejador?
- `onClick={guardar()}`
+ `onClick={guardar}`
- `onclick={guardar}`
- `onClick="guardar()"`
> Se pasa la referencia de la función; con paréntesis se ejecuta durante el render.

? ¿Cómo evitas que un formulario recargue la página al enviarse?
- `e.stop()`
+ `e.preventDefault()` en `onSubmit`
- `return false` en JSX
- `onSubmit={null}`
> `preventDefault` cancela el comportamiento nativo del navegador.

? ¿Qué hace `e.stopPropagation()`?
+ Impide que el evento siga subiendo a los elementos padres
- Cancela el envío del formulario
- Elimina el elemento
- Detiene el renderizado
> Es independiente de `preventDefault`.
:::

:::summary
- Props en camelCase (`onClick`) que reciben **funciones**.
- Argumentos: `() => fn(arg)`; nunca `onClick={fn()}`.
- `e.preventDefault()` y `e.stopPropagation()` para controlar el comportamiento.
- Tus componentes eligen los nombres de sus props de evento (`onPulsar`, `onGuardar`…).
:::
