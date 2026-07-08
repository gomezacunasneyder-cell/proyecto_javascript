# Acme Producción

Aplicación web para automatizar el proceso de producción de la planta Acme en Macondo: control de acceso por usuarios, gestión de inventario (materia prima y producto terminado) y motor de producción que transforma materia prima en producto terminado según receta.

Desarrollado con **HTML, CSS y JavaScript puro (Vanilla)**, usando **Web Components** para la interfaz y **Firebase Realtime Database** como capa de persistencia.

---

## 📁 Estructura del proyecto

```
explicacion_java/
├── src/
│   ├── components/              # Web Components reutilizables (encapsulados con Shadow DOM)
│   │   ├── acme-button.js         # Botón estandarizado (variantes primary/secondary)
│   │   ├── acme-input.js          # Campo de formulario con validación nativa integrada
│   │   ├── acme-navbar.js         # Barra de navegación superior + control de sesión
│   │   └── acme-toast.js          # Sistema de notificaciones emergentes (éxito/error)
│   │
│   ├── css/
│   │   └── styles.css             # Estilos globales de la aplicación
│   │
│   ├── data/
│   │   ├── api.js                 # Cliente HTTP genérico + hash de contraseñas (SHA-256)
│   │   └── dataManager.js         # Única capa con permiso de leer/escribir en la base de datos
│   │
│   ├── modules/                   # Lógica de negocio de cada módulo (una responsabilidad c/u)
│   │   ├── auth.js                 # Login y registro de usuarios
│   │   ├── inventory.js            # CRUD de inventario (materia prima / producto terminado)
│   │   ├── production.js           # Motor de producción (transformación + consecutivos)
│   │   ├── session.js              # Guardia de sesión (protege páginas internas)
│   │   └── usuarios.js             # CRUD del módulo de usuarios
│   │
│   ├── index.html                 # Registro de usuario (punto de entrada inicial)
│   ├── login.html                 # Inicio de sesión
│   ├── usuarios.html              # Módulo de gestión de usuarios
│   ├── inventario.html            # Módulo de inventario
│   └── produccion.html            # Módulo de producción
│
├── wireframes/                    # Bocetos de UI/UX previos a la codificación
├── README.md                      # Este archivo
```

---

## 🚀 Cómo ejecutar el proyecto

Al ser una aplicación 100% frontend (sin build ni backend propio), solo necesitas un servidor local para evitar restricciones del navegador con módulos y `fetch`.

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   ```
2. Abre la carpeta del proyecto en VS Code.
3. Instala la extensión **Live Server** (si no la tienes).
4. Clic derecho sobre `src/index.html` → **Open with Live Server**.
5. La aplicación abrirá en algo como `http://127.0.0.1:5501/src/index.html`.

> No requiere `npm install` ni dependencias adicionales: no se usan frameworks ni librerías externas más allá de la API nativa `fetch` y `crypto.subtle`.

---

## 🧩 Módulos y funcionalidades

### 1. Registro / Login (`index.html`, `login.html`)
- Registro de usuario nuevo solicitando: número de identificación, nombre completo, cargo y contraseña con **doble validación** (contraseña + confirmación, mínimo 6 caracteres).
- Login mediante número de identificación + contraseña.
- Las contraseñas se almacenan con **hash SHA-256 + salt**, nunca en texto plano.
- La sesión activa se guarda en `sessionStorage` y se valida en cada página protegida mediante `session.js`.

### 2. Módulo de Usuarios (`usuarios.html`)
- Listado de todos los usuarios registrados (ID, nombre, cargo).
- Crear, editar y eliminar usuarios desde un modal.
- Al editar, la contraseña es opcional: si se deja en blanco, se conserva la anterior.
- Notificaciones tipo *toast* para confirmar cada acción (creado, actualizado, eliminado, error).

### 3. Módulo de Inventario (`inventario.html`)
- Registro de **Materia Prima** (código, nombre, proveedor, unidad, stock inicial) y de **Producto Terminado** (con su receta/fórmula asociada).
- Al marcar un producto como "Producto Terminado", el formulario habilita dinámicamente la sección de fórmula, donde se seleccionan los insumos (materias primas ya existentes) y la cantidad requerida de cada uno.
- Botones `+` / `-` para ajustar el stock de un producto existente por código.
- Tabla con **buscador en tiempo real** por código o nombre.
- Acciones de **Editar** y **Eliminar** por fila.

### 4. Módulo de Producción (`produccion.html`)
Es el motor central del sistema. Flujo de una orden de producción:

1. Se selecciona el producto a fabricar (solo aparecen productos con fórmula registrada) y la cantidad.
2. El sistema calcula automáticamente los insumos requeridos (`cantidad_receta × cantidad_a_fabricar`) y los agrega a una orden temporal en pantalla.
3. Al registrar la producción:
   - Se **valida primero** que haya stock suficiente de **todos** los insumos de **todos** los ítems de la orden (consolidando cantidades si un mismo insumo se repite en varios productos).
   - Si falta stock de cualquier insumo, se aborta el proceso completo mediante una notificación de error y **no se modifica ningún dato**.
   - Si hay stock suficiente: se descuenta la materia prima, se aumenta el stock del producto terminado, se genera un **código consecutivo** (inicia en 1 e incrementa con cada proceso registrado) y se guarda el registro en el historial.
4. Se muestra un **resumen del proceso**: cantidad fabricada por producto y materia prima consumida.
5. Se mantiene un **historial de producción** con fecha, responsable (usuario en sesión), código consecutivo y productos fabricados.

---

## 🗄️ Modelo de datos

La persistencia se maneja a través de `dataManager.js`, que centraliza todas las operaciones de lectura/escritura. Es el **único archivo** de todo el proyecto con permiso para comunicarse con la base de datos; ningún módulo accede a ella directamente.

| Entidad | Estructura |
|---|---|
| `usuarios/{idNumber}` | `{ idNumber, fullName, position, password (hash SHA-256) }` |
| `inventario/productos/{codigo}` | `{ codigo, nombre, tipo, unidad, proveedor, stock, formula }` |
| `produccion/consecutivo` | Número entero, único contador global |
| `produccion/procesos/{consecutivo}` | `{ codigo, fecha, responsable, items: [{ codigoProducto, nombreProducto, cantidadFabricada, insumosUsados }] }` |

La fórmula/receta de un producto terminado **no es una colección aparte**: vive como una propiedad (`formula`) dentro del propio registro de inventario del producto, con la forma:
```json
"formula": [
  { "codigoMP": "MP-001", "cantidad": 100, "unidad": "g" },
  { "codigoMP": "MP-002", "cantidad": 100, "unidad": "g" }
]
```

---

## 🧱 Web Components

Se construyeron 4 componentes reutilizables, todos con **Shadow DOM** (`attachShadow({ mode: 'open' })`) para encapsular su estilo y marcado interno:

| Componente | Uso |
|---|---|
| `<acme-button>` | Botón con variantes `primary` / `secondary`. Si `type="submit"`, dispara automáticamente el evento `submit` del formulario contenedor. |
| `<acme-input>` | Campo de formulario con label, validación nativa (`required`, `minlength`, `min`, etc.) y getters/setters de `value` y `disabled` para integrarse con JS estándar (`document.getElementById(...).value`). |
| `<acme-navbar>` | Barra de navegación superior con enlaces a los 3 módulos, saludo al usuario en sesión y botón de cerrar sesión. |
| `<acme-toast>` | Sistema de notificaciones emergentes. Expone `window.showToast(mensaje, tipo)` de forma global para que cualquier módulo lo use sin acoplarse al componente. |

---

## 🔍 Explicación detallada del código

### `data/api.js` — Cliente HTTP y seguridad

```js
const httpClient = async (url, method, payload = null) => { ... }
```
Función genérica que envuelve `fetch`: arma las opciones de la petición (método, headers, body si hay payload), lanza un error si la respuesta HTTP no es exitosa (`response.ok`), y devuelve el JSON ya parseado. Todas las funciones de `dataManager.js` la usan por debajo, evitando repetir la lógica de `fetch` en cada una.

```js
const hashPassword = async (password) => { ... }
```
Genera un hash **SHA-256** de la contraseña concatenada con un salt fijo (`"AcmeSalt2024"`), usando la Web Crypto API nativa del navegador (`crypto.subtle.digest`). El resultado se convierte de `ArrayBuffer` a una cadena hexadecimal. Es asíncrona porque `crypto.subtle` trabaja con Promesas. Esto es lo que se guarda en la base de datos en vez de la contraseña en texto plano.

### `data/dataManager.js` — Única puerta de acceso a los datos

Expone un objeto `dataManager` con un método por cada operación posible sobre cada entidad (`usuarios`, `productos`, `producción`). Todos siguen el mismo patrón: arman la URL de Firebase para el recurso puntual y delegan en `httpClient` con el verbo HTTP correspondiente:

- `GET` → leer (`getUsuarios`, `getProductos`, `getConsecutivoProduccion`, etc.)
- `PUT` → crear o **reemplazar por completo** un registro (`guardarUsuario`, `guardarProducto`)
- `PATCH` → actualizar **solo algunos campos** sin tocar el resto (`patchProducto`, usado para modificar únicamente el `stock`)
- `DELETE` → eliminar (`eliminarUsuario`, `eliminarProducto`)

Ningún otro módulo del proyecto hace `fetch` directamente: todos pasan por aquí, lo que permite que si mañana cambias de proveedor de base de datos, solo se edite este archivo.

### `modules/auth.js` — Login y registro

**Login (`formularioLogin`):**
1. Toma `username` (ID) y `contrasena` del formulario.
2. Hashea la contraseña ingresada con `hashPassword`.
3. Busca el usuario por ID con `dataManager.getUsuario`.
4. Compara el hash calculado contra el hash guardado. Si coincide, guarda el usuario completo en `sessionStorage` bajo la clave `acme_produccion_sesion` y redirige a `usuarios.html`. Si no, muestra un toast de error sin revelar si el problema fue el ID o la contraseña específicamente para el ID (mensaje "Contraseña incorrecta" solo se muestra si el usuario sí existe).

**Registro (`formularioRegistro`):**
1. Valida que `password === confirmPassword` y que tenga mínimo 6 caracteres (doble validación pedida en el enunciado).
2. Verifica que el ID no exista ya (`dataManager.getUsuario`).
3. Hashea la contraseña y guarda el nuevo usuario.
4. Inicia sesión automáticamente y redirige.

### `modules/session.js` — Guardia de rutas

Archivo mínimo pero crítico: se ejecuta al cargar cualquier página protegida (`usuarios.html`, `inventario.html`, `produccion.html`). Revisa si existe una sesión activa en `sessionStorage`; si no la hay, redirige de inmediato a `login.html`. Esto evita que alguien acceda a los módulos internos escribiendo la URL directamente sin haber iniciado sesión.

### `modules/usuarios.js` — CRUD de usuarios

- `listarUsuarios()`: pide todos los usuarios a `dataManager.getUsuarios()` y construye la tabla dinámicamente con `document.createElement`, agregando por cada fila botones `<acme-button>` de Editar/Eliminar con su propio `addEventListener`.
- `guardarUsuario(datos, esEdicion)`: si es un usuario nuevo, primero valida que el ID no exista (`existeUsuario`); si es edición, sobrescribe directamente. Llama a `dataManager.guardarUsuario` y refresca la tabla.
- `eliminarUsuario(idNumber)`: pide confirmación con `confirm()` antes de borrar.
- `cargarParaEditar(usuario)`: rellena el formulario del modal con los datos del usuario seleccionado, deshabilita el campo de ID (es la clave, no debe cambiar) y deja los campos de contraseña vacíos —si el usuario no escribe una nueva, se conserva el hash anterior (ver el bloque `if (esEdicion && !datos.password)` dentro del listener de `submit`).
- El listener de `submit` del formulario es el punto donde confluye toda la validación: contraseñas coincidentes, longitud mínima solo si es un usuario nuevo, y decide si hashear una contraseña nueva o conservar la existente.

### `modules/inventory.js` — CRUD de inventario + fórmulas

- `cargarInventarioDesdeFirebase()`: trae todos los productos y los guarda en la variable local `listaProductosLocal`, que actúa como caché en memoria para no repetir peticiones cada vez que se filtra o se arma un `<select>`.
- `renderizarTabla(productos)`: pinta la tabla completa; por cada fila agrega botones de Editar y Eliminar identificados por `data-codigo`, y usa delegación de eventos (`querySelectorAll` + `addEventListener` después de pintar) porque los botones se crean dinámicamente.
- `configurarComportamientoTipo()`: escucha cambios en el `<select>` de tipo de producto. Si el usuario elige "Producto Terminado", oculta el campo de proveedor y muestra la sección de fórmula (agregando automáticamente una primera fila de insumo); si elige "Materia Prima", hace lo contrario.
- `agregarFilaInsumo()` / `agregarFilaInsumoConDatos()`: generan dinámicamente una fila con un `<select>` de materias primas disponibles, un input de cantidad y un input de unidad (que se autocompleta según el insumo elegido, tomándolo del atributo `data-unidad` de la opción seleccionada). La segunda variante existe para poder **precargar** valores ya guardados cuando se está editando un producto existente.
- `cargarParaEditar(codigo)`: busca el producto en la caché local, llena el formulario y, si tiene fórmula, reconstruye visualmente cada fila de insumo con `agregarFilaInsumoConDatos`.
- En el `submit` del formulario: si el tipo es "Producto Terminado", recorre todas las filas de insumos dinámicas (`.fila-insumo-dinamica`), arma el arreglo `formula` y valida que no haya insumos duplicados (usando un `Set` para llevar registro de códigos ya vistos). Si el producto ya existe y no se está en modo edición, bloquea la creación y sugiere usar los botones de stock en su lugar.
- `modificarStockExistente(operacion)`: implementa los botones `+`/`-` de la sección de stock; busca el producto por código, calcula el nuevo stock sumando o restando, e impide que quede en negativo.

### `modules/production.js` — El motor de producción

Este es el módulo más importante funcionalmente, porque implementa el flujo exacto pedido en el enunciado:

1. **`cargarProductos()`**: trae el inventario completo y filtra solo los productos de `tipo === "Producto Terminado"` para llenar el `<select>` de fabricación (no tendría sentido "fabricar" una materia prima).

2. **Agregar a la orden (`btnAgregarOrden`)**: cuando el usuario elige un producto y una cantidad, se calcula cuánto de cada insumo se necesita multiplicando la receta original por la cantidad a fabricar (`insumo.cantidad * cantidad`), y se agrega ese ítem a un arreglo temporal `ordenActual` (en memoria, aún no persistido). Esto permite armar una orden con **varios productos distintos antes de confirmar todo junto**.

3. **Registrar producción (`btnRegistrarProduccion`)** — el corazón del algoritmo, siguiendo exactamente el flowchart del profesor:
   - Refresca el inventario (`cargarProductos()`) para validar contra el stock más reciente, evitando condiciones de carrera si alguien más modificó el inventario mientras se armaba la orden.
   - **Consolida** con un `Map` cuánto se necesita en total de cada insumo, sumando entre todos los productos de la orden (si dos productos de la orden comparten un mismo insumo, sus cantidades se suman antes de validar).
   - **Valida stock suficiente de todos los insumos antes de modificar cualquier dato.** Si falta cualquiera, se aborta todo el proceso con un toast de error y **no se toca la base de datos** — esta es la validación estricta que pedía el diagrama del profesor.
   - Si todo es válido: primero descuenta cada insumo consolidado del inventario (`patchProducto` con el nuevo stock restado), luego aumenta el stock de cada producto terminado fabricado.
   - Genera el **código consecutivo**: lee el contador actual, le suma 1 y lo vuelve a guardar.
   - Arma el objeto `proceso` con fecha, responsable (tomado de la sesión activa) y el detalle de la orden, y lo guarda en el historial de producción.
   - Limpia la orden en pantalla, refresca el inventario y el historial, y muestra el resumen del proceso recién creado.

4. **`mostrarResumen(proceso)`**: pinta, por cada producto fabricado en la orden, la cantidad producida y la lista de insumos consumidos con sus cantidades — el resumen que pedía el enunciado.

5. **`cargarHistorial()`**: trae todos los procesos de producción guardados y los pinta ordenados del más reciente al más antiguo (`sort` descendente por código consecutivo).

### `components/*.js` — Web Components

Los 4 componentes (`acme-button`, `acme-input`, `acme-navbar`, `acme-toast`) siguen el mismo patrón de ciclo de vida de un Custom Element:

- **`constructor()`**: llama a `super()` y crea el Shadow Root con `this.attachShadow({ mode: 'open' })`, lo que aísla su HTML/CSS interno del resto de la página (nadie fuera del componente puede estilarlo sin querer, ni sus estilos internos se filtran hacia afuera).
- **`connectedCallback()`**: se ejecuta automáticamente cuando el navegador inserta el elemento en el DOM. Aquí se leen los atributos HTML (`getAttribute`) y se construye el `innerHTML` del `shadowRoot` con el marcado y los estilos `<style>` propios del componente.

Detalles particulares:
- `acme-input` define **getters y setters** de `value` y `disabled` que leen/escriben directamente sobre el `<input>` interno del Shadow DOM. Esto es lo que permite que código externo siga usando la sintaxis estándar `document.getElementById("idNumber").value` como si fuera un input nativo, sin que el resto del proyecto necesite saber que por dentro es un Web Component.
- `acme-button` detecta si `type="submit"` y, en ese caso, agrega un listener que dispara manualmente un evento `submit` sobre el formulario más cercano (`this.closest('form')`) — esto es necesario porque un botón dentro de Shadow DOM no dispara el envío nativo de un `<form>` normal por sí solo.
- `acme-navbar` lee la sesión activa de `sessionStorage` para mostrar el nombre del usuario logueado y gestiona el botón de cerrar sesión (borra la sesión y redirige a `login.html`).
- `acme-toast` expone `window.showToast(mensaje, tipo)` como función global: cualquier módulo puede llamarla sin importar ni instanciar nada, solo necesita que `<acme-toast>` esté presente una vez en el `<body>` de la página.

---

## ⚙️ Decisiones técnicas y desviaciones del material de apoyo

Estas son decisiones de arquitectura tomadas conscientemente durante el desarrollo:

- **Persistencia en Firebase Realtime Database en lugar de `localStorage`.** Se optó por esta alternativa para tener persistencia real accesible desde cualquier dispositivo/navegador, en vez de datos atados a un único navegador local. El acceso sigue estando centralizado exclusivamente en `dataManager.js`, respetando el principio de una sola capa de datos.
- **Arquitectura multipágina** (una página HTML por módulo) en lugar de una única SPA orquestada por un `main.js` central. Cada página carga únicamente los scripts que necesita, lo que simplifica la depuración y el mantenimiento de cada módulo de forma independiente.
- **La receta/fórmula se almacena como parte del registro de inventario del producto**, en lugar de vivir en una colección `recetas` separada. Esto simplifica el modelo porque la fórmula y el producto que la usa siempre viajan juntos.

---

## ⚠️ Limitaciones conocidas

- El hash de contraseña (SHA-256 + salt fijo) es funcional pero no reemplaza un esquema de autenticación de producción (idealmente usaría `bcrypt`/`argon2` en un backend real, con salt único por usuario).
- El registro de usuarios desde `index.html` es público (no requiere sesión previa), pensado para poder crear el primer usuario del sistema. En un entorno productivo real, la creación de usuarios adicionales debería quedar restringida exclusivamente al módulo de Usuarios ya autenticado.
- La generación del consecutivo de producción (lectura + escritura en dos pasos) no es atómica; en un escenario de múltiples usuarios escribiendo simultáneamente podría producirse una colisión. Firebase permite resolver esto con transacciones (`runTransaction`), pendiente como mejora futura.

---

## 🖥️ Tecnologías utilizadas

- HTML5 semántico
- CSS3 (diseño responsive)
- JavaScript (ES6+, Web Components API, Shadow DOM, `fetch`, `crypto.subtle`)
- Firebase Realtime Database (persistencia)

---

## 👤 Autor

**[Nombre Apellido]**
Proyecto individual — Gestión de Producción Acme
Repositorio: `ProyectoAcmeProduccion_JavaScript_[Apellido][Nombre]`