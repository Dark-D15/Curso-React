---
id: formularios
nivel: 1
titulo: Formularios y componentes controlados
icono: 📝
tiempo: 35 min
resumen: Inputs controlados con estado, texto, select, checkbox, radio, un solo handler para muchos campos, envío y validación básica.
---

:::goal
Manejar formularios con **componentes controlados**: sincronizar inputs con el estado, enviar datos y validar de forma sencilla.
:::

## Input controlado

En HTML, el propio `<input>` guarda su valor. En React, lo habitual es que **el estado sea la única fuente de la verdad**: el input muestra `value` y cada pulsación actualiza el estado con `onChange`.

```jsx run
function App() {
  const [nombre, setNombre] = useState('');

  return (
    <div className="card col">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Escribe tu nombre"
      />
      <p>Hola, <strong>{nombre || 'desconocido'}</strong> ({nombre.length} caracteres)</p>
    </div>
  );
}
```

:::warn Sin `onChange` el campo queda bloqueado
Si pones `value` sin `onChange`, el input es de solo lectura y React avisa en consola. Si quieres un valor inicial sin controlarlo, usa `defaultValue`.
:::

Ventajas: puedes validar mientras escribes, formatear el texto, deshabilitar el botón según el contenido, resetear el formulario... todo desde el estado.

## Distintos tipos de campo

```jsx run
function App() {
  const [bio, setBio] = useState('');
  const [pais, setPais] = useState('pe');
  const [acepto, setAcepto] = useState(false);
  const [plan, setPlan] = useState('free');

  return (
    <div className="card col">
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos de ti" rows={2} />

      <select value={pais} onChange={(e) => setPais(e.target.value)}>
        <option value="pe">Perú</option>
        <option value="mx">México</option>
        <option value="es">España</option>
      </select>

      <label><input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} /> Acepto términos</label>

      <div className="row">
        {['free', 'pro'].map((p) => (
          <label key={p}>
            <input type="radio" name="plan" value={p} checked={plan === p} onChange={(e) => setPlan(e.target.value)} /> {p}
          </label>
        ))}
      </div>

      <pre className="muted" style={{ margin: 0 }}>{JSON.stringify({ bio, pais, acepto, plan }, null, 1)}</pre>
    </div>
  );
}
```

Diferencias a recordar:

| Campo | Propiedad que lees/controlas | Evento |
|---|---|---|
| `text`, `email`, `textarea`, `select` | `value` / `e.target.value` | `onChange` |
| `checkbox` | `checked` / `e.target.checked` | `onChange` |
| `radio` | `checked={valor === opcion}` | `onChange` |
| `file` | `e.target.files` (no se controla) | `onChange` |

En React, `<textarea>` y `<select>` usan el atributo `value` (no hijos ni `selected`).

## Muchos campos, un solo manejador

Guarda el formulario como **un objeto** y usa el atributo `name` de cada campo como clave:

```jsx run
function App() {
  const [form, setForm] = useState({ nombre: '', email: '', suscrito: false });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });  // [name] = clave dinámica
  }

  return (
    <div className="card col">
      <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <label><input name="suscrito" type="checkbox" checked={form.suscrito} onChange={handleChange} /> Recibir novedades</label>
      <code>{JSON.stringify(form)}</code>
    </div>
  );
}
```

## Enviar el formulario

Usa `onSubmit` en el `<form>` (así funciona también con la tecla Enter) y `preventDefault`.

```jsx run
function App() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setEnviado(email);
    setEmail('');            // limpiar el formulario
  }

  return (
    <form className="card col" onSubmit={handleSubmit}>
      <label htmlFor="mail">Correo</label>
      <input id="mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" disabled={!email}>Suscribirme</button>
      {enviado && <p className="ok">✅ ¡Gracias! Te escribiremos a {enviado}</p>}
    </form>
  );
}
```

:::tip Accesibilidad
Asocia siempre cada campo con su `<label>` mediante `htmlFor` + `id` (o envolviéndolo). Mejora la usabilidad y la accesibilidad.
:::

## Validación básica

Calcula los errores **a partir del estado** durante el render; así no hace falta guardarlos aparte:

```jsx run
function App() {
  const [pass, setPass] = useState('');
  const [tocado, setTocado] = useState(false);

  const errores = [];
  if (pass.length < 8) errores.push('Mínimo 8 caracteres');
  if (!/[0-9]/.test(pass)) errores.push('Debe incluir un número');
  if (!/[A-Z]/.test(pass)) errores.push('Debe incluir una mayúscula');

  return (
    <div className="card col">
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onBlur={() => setTocado(true)} placeholder="Contraseña" />
      {tocado && errores.map((er) => <small key={er} className="bad">• {er}</small>)}
      <button disabled={errores.length > 0}>Crear cuenta</button>
    </div>
  );
}
```

Para formularios grandes existen librerías (**React Hook Form**, **Formik**) y de esquemas (**Zod**, **Yup**); las veremos en la lección de formularios avanzados.

## Componentes no controlados (alternativa)

Si no necesitas reaccionar a cada tecla, puedes leer el valor al enviar con `FormData` o con una **ref**:

```jsx run
function App() {
  const [resultado, setResultado] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    setResultado(JSON.stringify(datos));
  }

  return (
    <form className="card col" onSubmit={handleSubmit}>
      <input name="usuario" defaultValue="ana" />
      <select name="tema" defaultValue="oscuro"><option>claro</option><option>oscuro</option></select>
      <button>Guardar</button>
      <code>{resultado}</code>
    </form>
  );
}
```

| | Controlado | No controlado |
|---|---|---|
| Fuente de la verdad | Estado de React | El DOM |
| Validar al teclear | ✅ Fácil | ⚠️ Más manual |
| Rendimiento (formularios enormes) | Re-render por tecla | ✅ Menos renders |
| Valor inicial | `value` | `defaultValue` |

:::exercise Formulario de registro
Crea un formulario controlado con dos campos: **nombre** (`<input name="nombre">`) y **email** (`<input name="email">`). Debajo, un `<p id="vista">` que muestre en vivo `Nombre: <nombre> | Email: <email>`. El botón `Registrar` debe estar **deshabilitado** hasta que ambos campos tengan texto; al enviar, muestra en un `<p id="ok">` el mensaje `Registrado: <nombre>`.

```hint
Usa un objeto de estado `{ nombre, email }` y un único `handleChange` con `[e.target.name]: e.target.value`.
```
```hint
`disabled={!form.nombre || !form.email}` y `onSubmit` con `preventDefault()` guardando el nombre enviado en otro estado.
```

```starter
function App() {
  return (
    <form className="card col">
      <input name="nombre" placeholder="Nombre" />
      <input name="email" placeholder="Email" />
      <p id="vista"></p>
      <button type="submit">Registrar</button>
    </form>
  );
}
```

```solution
function App() {
  const [form, setForm] = useState({ nombre: '', email: '' });
  const [enviado, setEnviado] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    setEnviado(form.nombre);
  }

  return (
    <form className="card col" onSubmit={handleSubmit}>
      <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
      <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
      <p id="vista">Nombre: {form.nombre} | Email: {form.email}</p>
      <button type="submit" disabled={!form.nombre || !form.email}>Registrar</button>
      {enviado && <p id="ok">Registrado: {enviado}</p>}
    </form>
  );
}
```

```checks
await check('El botón "Registrar" empieza deshabilitado', () => btn('Registrar').disabled === true);
await type($('input[name=nombre]'), 'Ana');
await type($('input[name=email]'), 'ana@mail.com');
await check('La vista previa se actualiza en vivo', () => text('#vista').replace(/\s+/g, ' ') === 'Nombre: Ana | Email: ana@mail.com');
await check('El botón se habilita cuando hay datos', () => btn('Registrar').disabled === false);
await click(btn('Registrar'));
await check('Al enviar muestra "Registrado: Ana"', () => text('#ok') === 'Registrado: Ana');
```
:::

:::quiz
? ¿Qué hace que un input sea "controlado"?
- Que tenga validación HTML
+ Que su `value` venga del estado de React y se actualice con `onChange`
- Que use una ref
- Que esté dentro de un `<form>`
> El estado es la única fuente de verdad del campo.

? ¿Qué propiedad se usa para un checkbox controlado?
- `value`
+ `checked`
- `selected`
- `defaultValue`
> Para checkbox y radio se controla `checked`.

? ¿Para qué sirve `[e.target.name]: e.target.value`?
+ Para actualizar la propiedad del objeto de estado cuyo nombre coincide con el campo
- Para crear un array
- Para validar el formulario
- Para evitar el re-render
> Es una clave calculada (computed property) que permite un único manejador.

? ¿Cuándo es útil un campo no controlado (`defaultValue` + `FormData`)?
+ Cuando solo necesitas el valor al enviar y no reaccionar en cada pulsación
- Nunca
- Cuando necesitas validar mientras escribes
- Solo con checkbox
> Menos código y menos renders en formularios simples o enormes.
:::

:::summary
- Controlado: `value` + `onChange` (o `checked`). El estado manda.
- Un objeto de estado + `name` + `[name]: value` para muchos campos.
- `onSubmit` + `preventDefault`; calcula errores durante el render.
- Existen alternativas no controladas (`FormData`, refs) y librerías para formularios complejos.
:::
