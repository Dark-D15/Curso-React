---
id: formularios-avanzados
nivel: 2
titulo: Formularios avanzados y validación
icono: 🧾
tiempo: 35 min
resumen: Validación por campo y al enviar, accesibilidad, un useForm casero y las librerías de referencia (React Hook Form + Zod).
---

:::goal
Diseñar formularios robustos: validar por **campo** y al **enviar**, mostrar errores accesibles, controlar el estado de envío y conocer **React Hook Form** y **Zod**.
:::

## Qué hace falta en un formulario real

- Validación **por campo** (al salir del campo) y **global** (al enviar).
- Mensajes de error claros y **accesibles**.
- Estado de **envío** (deshabilitar el botón, evitar doble envío).
- Errores del **servidor** (el email ya existe…).
- Campos dinámicos (listas), subida de archivos, valores por defecto.

## Un `useForm` casero

Vamos a construir la base para entender qué automatizan las librerías:

```jsx run title="Validación al salir del campo y al enviar"
function validar(v) {
  const e = {};
  if (!v.email) e.email = 'El email es obligatorio';
  else if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Formato de email no válido';
  if (v.password.length < 8) e.password = 'Mínimo 8 caracteres';
  if (v.confirmar !== v.password) e.confirmar = 'Las contraseñas no coinciden';
  return e;
}

function useForm(inicial, validador, alEnviar) {
  const [valores, setValores] = useState(inicial);
  const [tocados, setTocados] = useState({});
  const [enviando, setEnviando] = useState(false);
  const errores = validador(valores);                 // derivado: se calcula en cada render

  const onChange = (e) => setValores((v) => ({ ...v, [e.target.name]: e.target.value }));
  const onBlur = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }));

  async function onSubmit(e) {
    e.preventDefault();
    setTocados(Object.fromEntries(Object.keys(inicial).map((k) => [k, true])));  // mostrar todos los errores
    if (Object.keys(errores).length) return;
    setEnviando(true);
    await alEnviar(valores);
    setEnviando(false);
  }
  const error = (campo) => (tocados[campo] ? errores[campo] : undefined);
  return { valores, error, onChange, onBlur, onSubmit, enviando };
}

function Campo({ etiqueta, nombre, tipo = 'text', form }) {
  const err = form.error(nombre);
  return (
    <div className="col" style={{ gap: 2 }}>
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre} name={nombre} type={tipo}
        value={form.valores[nombre]} onChange={form.onChange} onBlur={form.onBlur}
        aria-invalid={!!err} aria-describedby={err ? nombre + '-err' : undefined}
        style={{ borderColor: err ? '#dc2626' : undefined }}
      />
      {err && <small id={nombre + '-err'} role="alert" className="bad">{err}</small>}
    </div>
  );
}

function App() {
  const [ok, setOk] = useState(false);
  const form = useForm(
    { email: '', password: '', confirmar: '' },
    validar,
    () => new Promise((r) => setTimeout(() => { setOk(true); r(); }, 700))
  );

  if (ok) return <p className="ok">✅ ¡Cuenta creada!</p>;
  return (
    <form className="card col" onSubmit={form.onSubmit} noValidate>
      <Campo etiqueta="Email" nombre="email" tipo="email" form={form} />
      <Campo etiqueta="Contraseña" nombre="password" tipo="password" form={form} />
      <Campo etiqueta="Repite la contraseña" nombre="confirmar" tipo="password" form={form} />
      <button disabled={form.enviando}>{form.enviando ? 'Enviando…' : 'Crear cuenta'}</button>
    </form>
  );
}
```

Puntos clave:

- Los **errores son derivados** del estado (no se guardan aparte).
- `tocados` evita gritar errores antes de que el usuario interactúe.
- `aria-invalid`, `aria-describedby` y `role="alert"` hacen el formulario **accesible** para lectores de pantalla.
- `noValidate` desactiva la validación nativa del navegador para usar la tuya.
- Se bloquea el botón durante el envío para **evitar duplicados**.

## React Hook Form

Es la librería más popular: **rinde mucho** (usa campos no controlados internamente, apenas re-renderiza) y reduce el código.

```bash
npm install react-hook-form
```

```jsx title="Formulario con React Hook Form"
import { useForm } from 'react-hook-form';

export default function Registro() {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (datos) => {
    await fetch('/api/registro', { method: 'POST', body: JSON.stringify(datos) });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input
        {...register('email', {
          required: 'Email obligatorio',
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email no válido' },
        })}
      />
      {errors.email && <small role="alert">{errors.email.message}</small>}

      <input type="password" {...register('password', { required: true, minLength: { value: 8, message: 'Mínimo 8' } })} />
      {errors.password && <small role="alert">{errors.password.message}</small>}

      <button disabled={isSubmitting}>Enviar</button>
    </form>
  );
}
```

- `register('campo', reglas)` conecta el input; devuelve `name`, `onChange`, `onBlur`, `ref`.
- `handleSubmit(fn)` valida y solo llama a `fn` si todo es correcto.
- Más: `watch` (observar valores), `setError` (errores del servidor), `useFieldArray` (listas dinámicas), `Controller` (para componentes controlados de terceros como selects de MUI).

## Validación con esquemas: Zod

En lugar de reglas sueltas, defines un **esquema** (una sola fuente de la verdad, reutilizable en cliente y servidor, y que genera tipos TypeScript):

```bash
npm install zod @hookform/resolvers
```

```jsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const esquema = z
  .object({
    email: z.string().email('Email no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmar: z.string(),
    edad: z.coerce.number().int().min(18, 'Debes ser mayor de edad'),
  })
  .refine((d) => d.password === d.confirmar, { message: 'No coinciden', path: ['confirmar'] });

const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(esquema) });
```

## Listas dinámicas con `useFieldArray`

```jsx
const { control, register } = useForm({ defaultValues: { telefonos: [{ numero: '' }] } });
const { fields, append, remove } = useFieldArray({ control, name: 'telefonos' });

{fields.map((campo, i) => (
  <div key={campo.id}>                       {/* usa campo.id, no el índice */}
    <input {...register(`telefonos.${i}.numero`)} />
    <button type="button" onClick={() => remove(i)}>Quitar</button>
  </div>
))}
<button type="button" onClick={() => append({ numero: '' })}>Añadir teléfono</button>
```

## Errores del servidor y UX

- Muestra los errores del backend junto al campo (`setError('email', { message: 'Ya está registrado' })`) o en un resumen accesible.
- Mantén el foco: al fallar, enfoca el primer campo con error.
- No borres lo que escribió el usuario en caso de error.
- Valida **siempre también en el servidor**: la validación del cliente es solo comodidad.

## Y en React 19…

React 19 añade **Actions** para formularios (`<form action={fn}>`, `useActionState`, `useFormStatus`), que simplifican el estado de envío; los verás en la lección de React 19.

:::exercise Validación al enviar
Haz que el formulario valide **al enviar**: si el nombre está vacío muestra `<small id="e-nombre">Nombre obligatorio</small>`; si el email no contiene `@` muestra `<small id="e-email">Email no válido</small>`. Si todo es correcto muestra `<p id="ok">¡Enviado!</p>`.

```hint
En `handleSubmit`: `e.preventDefault()`, calcula un objeto `errores`, guárdalo con `setErrores`; si no hay claves, `setEnviado(true)`.
```

```starter
function App() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // valida aquí
  }

  return (
    <form className="card col" onSubmit={handleSubmit} noValidate>
      <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button>Enviar</button>
    </form>
  );
}
```

```solution
function App() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const nuevos = {};
    if (!nombre.trim()) nuevos.nombre = 'Nombre obligatorio';
    if (!email.includes('@')) nuevos.email = 'Email no válido';
    setErrores(nuevos);
    setEnviado(Object.keys(nuevos).length === 0);
  }

  return (
    <form className="card col" onSubmit={handleSubmit} noValidate>
      <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      {errores.nombre && <small id="e-nombre">{errores.nombre}</small>}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {errores.email && <small id="e-email">{errores.email}</small>}
      <button>Enviar</button>
      {enviado && <p id="ok">¡Enviado!</p>}
    </form>
  );
}
```

```checks
await click(btn('Enviar'));
await check('Con el formulario vacío aparecen ambos errores', () => text('#e-nombre') === 'Nombre obligatorio' && text('#e-email') === 'Email no válido');
await check('No se muestra "¡Enviado!" si hay errores', () => !$('#ok'));
await type($('input[placeholder=Nombre]'), 'Ana');
await type($('input[placeholder=Email]'), 'ana@mail.com');
await click(btn('Enviar'));
await check('Con datos válidos desaparecen los errores', () => !$('#e-nombre') && !$('#e-email'));
await check('Se muestra "¡Enviado!"', () => text('#ok') === '¡Enviado!');
```
:::

:::quiz
? ¿Por qué conviene calcular los errores a partir del estado en vez de guardarlos como estado aparte?
+ Porque son datos derivados y así nunca se desincronizan
- Porque React lo exige
- Porque es más rápido siempre
- Porque evita el uso de `onChange`
> Una sola fuente de la verdad: los valores del formulario.

? ¿Para qué sirve `aria-invalid` junto con `role="alert"`?
+ Para informar a tecnologías de apoyo de que el campo tiene un error
- Para estilizar el campo
- Para validar en el servidor
- Para evitar el envío
> Es parte de un formulario accesible.

? ¿Qué aporta Zod a un formulario?
+ Un esquema único de validación reutilizable en cliente y servidor (y con tipos TypeScript)
- Estilos automáticos
- Enrutado
- Gestión de estado global
> Se integra con React Hook Form mediante `zodResolver`.

? ¿La validación en el cliente es suficiente?
- Sí
+ No: siempre hay que validar también en el servidor
- Solo si usas Zod
- Solo con TypeScript
> El cliente puede ser manipulado.
:::

:::summary
- Errores derivados del estado, `touched`, estado de envío y accesibilidad (`aria-*`).
- React Hook Form (`register`, `handleSubmit`, `useFieldArray`) + Zod (`zodResolver`) es la combinación estándar.
- Valida siempre en el servidor y muestra sus errores junto al campo.
:::
