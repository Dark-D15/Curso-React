---
id: testing
nivel: 3
titulo: Testing de aplicaciones React
icono: 🧪
tiempo: 40 min
resumen: Vitest/Jest + React Testing Library: probar comportamiento como lo usa el usuario, mocks, hooks, y E2E con Playwright.
---

:::goal
Escribir pruebas **útiles y mantenibles**: probar lo que ve y hace el usuario con **React Testing Library**, simular interacciones, manejar asincronía y mocks, probar hooks y conocer las pruebas **end-to-end**.
:::

:::info Lección con código para tu proyecto
Las pruebas se ejecutan en Node con un runner (Vitest/Jest) y **jsdom**. Aquí aprenderás el enfoque y la sintaxis; también puedes **ver el principio en acción** con las comprobaciones automáticas de los ejercicios de este curso: son básicamente pruebas que simulan un usuario.
:::

## ¿Qué probar? La pirámide

```text
        ▲  E2E (pocos)          Navegador real, flujos críticos: Playwright / Cypress
       ╱ ╲
      ╱   ╲ Integración (muchos)  Varios componentes juntos con RTL: formularios, páginas
     ╱     ╲
    ╱───────╲ Unitarias (muchas)  Funciones puras, reducers, utilidades, hooks
```

Principio de Testing Library: **«Cuanto más se parezcan tus pruebas a la forma en que se usa el software, más confianza te darán.»** Prueba **comportamiento visible**, no detalles de implementación (nombres de estado, métodos internos).

## Herramientas

| Pieza | Función |
|---|---|
| **Vitest** (o Jest) | Ejecutor de pruebas, `expect`, mocks, cobertura. Vitest se integra con Vite. |
| **React Testing Library** (`@testing-library/react`) | Renderiza componentes y los consulta como un usuario. |
| **user-event** (`@testing-library/user-event`) | Simula interacciones reales (escribir, clic, tab). |
| **jest-dom** (`@testing-library/jest-dom`) | Aserciones sobre el DOM: `toBeInTheDocument`, `toBeDisabled`… |
| **MSW** (Mock Service Worker) | Simula la API a nivel de red. |
| **Playwright / Cypress** | Pruebas end-to-end en navegador real. |

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

```js title="vite.config.js"
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.js', globals: true },
});
```

```js title="src/test/setup.js"
import '@testing-library/jest-dom/vitest';
```

## Tu primera prueba

```jsx title="Contador.jsx"
export default function Contador() {
  const [n, setN] = useState(0);
  return (
    <div>
      <p>Cuenta: {n}</p>
      <button onClick={() => setN(n + 1)}>Sumar</button>
    </div>
  );
}
```

```jsx title="Contador.test.jsx"
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Contador from './Contador';

describe('Contador', () => {
  it('empieza en 0', () => {
    render(<Contador />);
    expect(screen.getByText('Cuenta: 0')).toBeInTheDocument();
  });

  it('incrementa al pulsar el botón', async () => {
    const user = userEvent.setup();
    render(<Contador />);

    await user.click(screen.getByRole('button', { name: /sumar/i }));
    await user.click(screen.getByRole('button', { name: /sumar/i }));

    expect(screen.getByText('Cuenta: 2')).toBeInTheDocument();
  });
});
```

El patrón es siempre **Arrange – Act – Assert**: preparar (render), actuar (interacción), comprobar (resultado visible).

## Consultas: cómo "encontrar" elementos

Prioriza lo que usan **todos** los usuarios (incluidos lectores de pantalla). Orden recomendado:

| Prioridad | Consulta | Ejemplo |
|---|---|---|
| 1 | `getByRole` | `getByRole('button', { name: /guardar/i })` |
| 2 | `getByLabelText` | `getByLabelText('Correo')` |
| 3 | `getByPlaceholderText`, `getByText` | `getByText(/bienvenido/i)` |
| 4 | `getByDisplayValue`, `getByAltText`, `getByTitle` | |
| Último recurso | `getByTestId` | `data-testid="x"` |

Y tres familias según lo que esperas:

| Prefijo | Si no está… | Úsalo para |
|---|---|---|
| `getBy…` | **lanza error** | Elementos que deben existir ya |
| `queryBy…` | devuelve `null` | Comprobar que algo **no** existe |
| `findBy…` | espera (promesa) | Elementos que **aparecen** de forma asíncrona |

```jsx
expect(screen.queryByText('Error')).not.toBeInTheDocument();
const mensaje = await screen.findByText('¡Guardado!');          // espera hasta ~1 s por defecto
```

*Mira la sección "Consultas" y notarás que la misma idea la usan los `checks` de los ejercicios de este curso: `btn('Sumar')`, `text('p')`…*

## Formularios

```jsx
it('envía el formulario con los datos', async () => {
  const user = userEvent.setup();
  const alEnviar = vi.fn();                                    // función espía (mock)
  render(<Login onEnviar={alEnviar} />);

  await user.type(screen.getByLabelText(/correo/i), 'ana@mail.com');
  await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');
  await user.click(screen.getByRole('button', { name: /entrar/i }));

  expect(alEnviar).toHaveBeenCalledWith({ correo: 'ana@mail.com', password: 'secreto123' });
});

it('muestra error si el correo es inválido', async () => {
  const user = userEvent.setup();
  render(<Login onEnviar={() => {}} />);
  await user.type(screen.getByLabelText(/correo/i), 'no-es-correo');
  await user.click(screen.getByRole('button', { name: /entrar/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/correo no válido/i);
});
```

## Asincronía y APIs: MSW

En lugar de *mockear* `fetch` a mano, **MSW** intercepta las peticiones de red y devuelve respuestas simuladas; tu código no cambia.

```jsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const servidor = setupServer(
  http.get('/api/usuarios', () => HttpResponse.json([{ id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Luis' }]))
);
beforeAll(() => servidor.listen());
afterEach(() => servidor.resetHandlers());
afterAll(() => servidor.close());

it('muestra los usuarios cargados', async () => {
  render(<Usuarios />);
  expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  expect(await screen.findByText('Ana')).toBeInTheDocument();
  expect(screen.getByText('Luis')).toBeInTheDocument();
});

it('muestra un error si la API falla', async () => {
  servidor.use(http.get('/api/usuarios', () => new HttpResponse(null, { status: 500 })));
  render(<Usuarios />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/error/i);
});
```

## Probar con proveedores (contexto, router, Query)

Crea una función `renderConProveedores` que envuelva con lo necesario:

```jsx
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function renderConProveedores(ui, { ruta = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });   // sin reintentos en tests
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}
```

## Probar hooks personalizados

```jsx
import { renderHook, act } from '@testing-library/react';

it('useToggle alterna el valor', () => {
  const { result } = renderHook(() => useToggle(false));
  expect(result.current[0]).toBe(false);

  act(() => result.current[1]());          // act: envuelve las actualizaciones de estado
  expect(result.current[0]).toBe(true);
});
```

## Mocks y espías (`vi.fn`, `vi.mock`, tiempo falso)

```jsx
vi.mock('./api', () => ({ obtenerClima: vi.fn().mockResolvedValue({ temp: 21 }) }));   // sustituye un módulo

vi.useFakeTimers();                                  // controla setTimeout/setInterval
act(() => vi.advanceTimersByTime(1000));
vi.useRealTimers();
```

## Qué evitar

- ❌ Probar **implementación** (estado interno, nombres de funciones) → se rompe al refactorizar sin que cambie el comportamiento.
- ❌ **Snapshots** gigantes: nadie los lee y se aprueban a ciegas. Úsalos en piezas pequeñas y estables.
- ❌ `getByTestId` como primera opción: ignora la accesibilidad.
- ❌ Pruebas que dependen del orden o de datos compartidos entre tests.
- ❌ Esperar con `setTimeout`: usa `findBy…` o `waitFor`.
- ❌ Perseguir el **100 % de cobertura**: cubre lo importante (reglas de negocio, flujos críticos).

## Pruebas end-to-end con Playwright

Controlan un **navegador real** y recorren flujos completos (registro → compra). Son más lentas y frágiles, así que **pocas pero críticas**.

```js title="tests/compra.spec.js"
import { test, expect } from '@playwright/test';

test('un usuario puede añadir un producto al carrito', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Añadir al carrito' }).first().click();
  await expect(page.getByRole('link', { name: /carrito \(1\)/i })).toBeVisible();
});
```

## Y la accesibilidad en los tests

Con `jest-axe` / `vitest-axe` puedes comprobar violaciones automáticas de accesibilidad (`expect(await axe(container)).toHaveNoViolations()`); y con `eslint-plugin-jsx-a11y` detectar problemas al escribir.

:::quiz
? ¿Qué consulta de Testing Library debes preferir para encontrar un botón?
+ `getByRole('button', { name: ... })`
- `getByTestId`
- `container.querySelector('.btn')`
- `getByClassName`
> Refleja cómo lo percibe un usuario (y la tecnología de apoyo).

? ¿Cómo compruebas que un elemento **no** está en pantalla?
+ `expect(screen.queryByText('x')).not.toBeInTheDocument()`
- `expect(screen.getByText('x')).toBeNull()`
- `expect(screen.findByText('x')).toBe(false)`
- No se puede
> `queryBy…` devuelve `null` en lugar de lanzar error.

? ¿Para qué sirve `findBy…`?
+ Para esperar a que aparezca un elemento de forma asíncrona
- Para buscar solo por ID
- Para encontrar el padre
- Para evitar `await`
> Combina `getBy` con reintentos hasta un tiempo límite.

? ¿Qué enfoque describe mejor el buen testing de componentes?
+ Probar comportamiento visible para el usuario, no detalles internos de implementación
- Probar que cada estado interno cambia
- Buscar el 100 % de cobertura con snapshots
- Probar solo funciones privadas
> Las pruebas resisten refactors y dan confianza real.
:::

:::summary
- Pirámide: muchas pruebas unitarias/integración (Vitest + RTL), pocas E2E (Playwright).
- Consulta por **rol/etiqueta**; `user-event` para interactuar; `findBy…` para asincronía; MSW para APIs.
- Evita probar implementación y snapshots enormes; prioriza flujos críticos.
:::
