# Manual Técnico y Guía del Proyecto: Acme Producción

Este documento sirve como manual explicativo paso a paso sobre el funcionamiento, flujo y arquitectura de la aplicación de **Gestión de Producción de Acme** en la ciudad de Macondo.

---

## 📌 Flujo de la Aplicación Paso a Paso

Aquí se detalla el recorrido que realiza un usuario en el sistema y qué ocurre internamente en cada paso:

### Paso 1: Registro de Usuarios (`index.html`)
El sistema requiere que los usuarios estén registrados para evitar accesos no autorizados.
1. **Acción del usuario:** El usuario ingresa su Número de Identificación, Nombre Completo, Cargo (Rol) y escribe su contraseña dos veces.
2. **Validación de Contraseña:** El script `registro.js` verifica que ambas contraseñas coincidan y que tengan al menos 6 caracteres.
3. **Validación de Identificación Duplicada:** Se envía una consulta GET a Firebase para verificar si ese Número de Identificación ya existe. Si existe, muestra un mensaje de alerta en rojo.
4. **Seguridad (Hashing):** Si todo está correcto, la contraseña se pasa por la función `window.api.hashPassword()` en `api.js`. Esta función aplica una codificación con salting en Base64 para evitar guardar texto plano en la base de datos.
5. **Guardado en Firebase:** Se realiza una petición PUT a la ruta `/usuarios/{idNumber}.json`.
6. **Autologin:** Guarda los datos del usuario en el navegador (`sessionStorage` con la clave `acme_produccion_sesion`) y redirige automáticamente al panel principal.

### Paso 2: Iniciar Sesión (`login.html`)
Si el usuario ya tiene una cuenta creada, ingresa directamente por aquí.
1. **Acción del usuario:** Introduce su Identificación y Contraseña.
2. **Consulta a la API:** El script `login.js` consulta a la base de datos de Firebase la información del usuario correspondiente a ese ID.
3. **Validación de Credenciales:**
   - Si no encuentra el usuario, muestra: *"El usuario no existe"*.
   - Si encuentra el usuario, codifica la contraseña ingresada y la compara con la contraseña almacenada. Si no coinciden, muestra: *"Contraseña incorrecta"*.
4. **Inicio de Sesión:** Si la validación es correcta, los datos del usuario se guardan en el `sessionStorage` y se le permite el ingreso a la aplicación.

### Paso 3: Gestión de Usuarios (`usuarios.html`)
Una vez logueado, el usuario tiene acceso a administrar el personal.
1. **Listado Automático:** Al cargar la página, se realiza un GET a `/usuarios.json` y se listan todos los usuarios en una tabla.
2. **Crear Usuario:** Al presionar "Agregar usuario" se abre un modal interactivo que reutiliza el formulario de registro.
3. **Modificar (Editar):** Al presionar "Editar" en un usuario de la lista, el modal se abre cargando sus datos previos. Para evitar errores, el ID de identificación se deshabilita (no se puede cambiar). La contraseña solo se actualiza si el administrador decide escribir una nueva.
4. **Eliminar:** Pide una confirmación. Al aceptar, realiza un DELETE en Firebase y vuelve a renderizar la tabla limpia.
5. **Mejora Visual:** Los botones de acción se encuentran organizados horizontalmente mediante la clase CSS `.celda-acciones`.

### Paso 4: Módulo de Inventario (`inventario.html`)
Aquí se administra toda la materia prima y los productos terminados.
1. **Creación de Producto Nuevo:** 
   - El administrador llena el Código (ej: `MP-01`), Nombre, Unidad de medida y Proveedor.
   - **Formulación Dinámica:** Si selecciona que el tipo de producto es **"Producto Terminado"**, el campo de Proveedor se oculta y aparece la sección de **Fórmula / Receta**. Aquí se pueden añadir materias primas (insumos) y asignar la cantidad exacta que requiere dicho producto para fabricarse (ej. 100 gramos de harina).
2. **Modificación de Stock Existente:** En lugar de crear un producto desde cero si ya existe, se introduce el código del producto, la cantidad y se presiona el botón **`+`** (para sumar inventario) o **`-`** (para restar inventario). Esto actualiza el stock directamente haciendo un PATCH a Firebase.
3. **Buscador con Filtro:** Un campo de texto en la parte superior de la tabla filtra la lista en tiempo real por Nombre o Código a medida que el usuario escribe.

### Paso 5: Módulo de Producción (`produccion.html`)
Este módulo es el núcleo del proceso de transformación de la planta en Macondo.
1. **Carga de Productos Fabricables:** El selector de la página solo muestra los productos que tienen tipo "Producto Terminado" y que tienen una receta registrada en el inventario.
2. **Agregar a la Orden:** El operario selecciona un producto, define la cantidad a fabricar y presiona "+ Agregar a la orden". La interfaz calcula automáticamente qué insumos de materia prima se requerirán y en qué cantidad, pintándolo en una tabla temporal.
3. **Verificación de Stock en Producción:** Al hacer clic en "Registrar Producción":
   - El sistema comprueba si hay suficiente stock de cada una de las materias primas necesarias. Si falta una sola cosa, la producción se cancela y avisa al operario qué material falta y cuánto.
4. **Proceso de Producción (Descuento e Incremento):**
   - Disminuye el stock de todas las materias primas consumidas (PATCH en `/inventario/productos/{codigo}`).
   - Incrementa el stock del producto fabricado terminado (PATCH en `/inventario/productos/{codigo}`).
5. **Consecutivo Automático:** Cada producción incrementa un consecutivo numérico único en la base de datos (iniciando en 1).
6. **Historial y Resumen:** El sistema guarda el registro de la producción con fecha, hora, responsable y un resumen del proceso que detalla la cantidad fabricada y la materia prima usada. Todo esto se añade en tiempo real a la tabla de historial en la parte inferior.

---

## 🛠️ Estructura y Arquitectura del Código

El proyecto está modularizado para separar las responsabilidades de forma limpia:

* **`js/api.js` (Módulo Central):** Centraliza la constante `FIREBASE_URL`, expone el método HTTP genérico `httpClient` (encargado de hacer Fetch PUT, GET, PATCH y DELETE con control de errores) y la función `hashPassword()` para la seguridad de credenciales.
* **`js/components.js` (Web Component):** Contiene el código de `<navbar-component>`. Este componente web genera el menú superior responsivo de forma dinámica en cada página e inicializa la lógica de visualización del usuario activo y el evento para cerrar sesión (`btnlogout`).
* **`js/session.js` (Guardia de Seguridad):** Un script sumamente ligero que se ejecuta al inicio de todas las páginas administrativas. Si detecta que no hay una sesión activa, redirige inmediatamente a `login.html`, bloqueando accesos no autorizados.
* **`css/styles.css` (Estilos y Responsividad):** Archivo central de estilos con reglas para la maquetación en tarjetas (`tarjeta-formulario`), modales y diseño responsive adaptable a tabletas y teléfonos mediante consultas de medios (`@media`).
