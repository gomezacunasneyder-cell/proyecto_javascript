# Revisión del Proyecto: Orbit PC Store

Se ha realizado una revisión exhaustiva de los archivos del proyecto (HTML, CSS, JS). A continuación, se detallan los problemas encontrados, la razón por la cual se generan y las sugerencias para solucionarlos de manera efectiva.

## 1. Problemas Críticos de Seguridad 🚨

### Autenticación en el Cliente (Frontend)
- **Problema:** En el archivo de inicio de sesión, se descarga la información del usuario desde la base de datos y se compara la contraseña directamente en el navegador.
- **Por qué ocurre:** Se está delegando la responsabilidad de validar las credenciales al cliente (navegador) en lugar de hacerlo en un servidor seguro.
- **Solución:** Implementar un servicio de autenticación real (como Firebase Authentication). El frontend debe enviar las credenciales a un backend o servicio auth, y este debe devolver un token de sesión si son válidas. Nunca se deben descargar contraseñas en texto plano.

### Exposición de la Base de Datos
- **Problema:** La base de datos de Firebase (Realtime Database) parece estar configurada con reglas públicas, permitiendo lectura y escritura directa desde cualquier lugar utilizando la URL.
- **Por qué ocurre:** Las reglas de seguridad de Firebase están configuradas en modo prueba o públicas para facilitar el desarrollo, pero no se cambiaron para producción.
- **Solución:** Configurar las reglas de Firebase para requerir autenticación (`auth != null`) antes de permitir leer o escribir datos.

## 2. Errores de Rutas y Archivos Faltantes (Errores 404) 📁

### Referencias a Archivos Inexistentes
- **Problema:** Existen varios enlaces a archivos que no se encuentran en la estructura del proyecto.
  - El archivo `session.js` es referenciado en múltiples archivos HTML, pero no existe.
  - Existen enlaces hacia `index.html` (página de registro) y `produccion.html`, los cuales no han sido creados en el proyecto.
- **Por qué ocurre:** Es común al maquetar la interfaz colocar enlaces a páginas futuras o archivos planeados que aún no se han desarrollado.
- **Solución:** Crear los archivos faltantes o eliminar/comentar los enlaces temporalmente hasta que se desarrollen.

### Rutas Relativas Incorrectas
- **Problema:** En el archivo `inventario.html`, los scripts y estilos están referenciados sin sus carpetas correspondientes (por ejemplo, `href="styles.css"` en lugar de `css/styles.css`, y `src="inventario.js"` en lugar de `js/inventario.js`). 
- **Por qué ocurre:** Las rutas relativas no están apuntando a las subcarpetas correctas donde realmente se encuentran los archivos.
- **Solución:** Corregir las rutas en las etiquetas `<link>` y `<script>` para que incluyan los directorios correctos.

## 3. Problemas de Interfaz y Funcionalidad ⚙️

### Inconsistencia en las Rutas de la Base de Datos
- **Problema:** Al iniciar sesión se busca al usuario en la ruta `/user/usuarios/...`, pero en el módulo de creación de usuarios (`usuarios.js`) los datos se guardan y consultan en la ruta `/user/clientes/...`.
- **Por qué ocurre:** Falta de unificación en la estructura de datos planeada para Firebase, posiblemente porque los módulos fueron hechos en distintos momentos.
- **Solución:** Unificar las rutas. Decidir si la colección principal será `usuarios` o `clientes` y aplicarlo de forma consistente en todo el proyecto.

### Botones y Acciones que No Hacen Nada
- **Problema:** 
  - En `usuarios.html`, el botón "Agregar usuario" (`btn-abrir-modal`) no funciona.
  - En `inventario.html` y `usuarios.html`, el botón de "Cerrar sesión" no tiene ninguna acción asignada.
- **Por qué ocurre:** No existen eventos ("event listeners") programados en JavaScript para estos botones. En el caso del cierre de sesión, probablemente la lógica iba a estar en el archivo faltante `session.js`. Para el modal de usuarios, falta la lógica en `usuarios.js` para quitar la clase visual que lo oculta.
- **Solución:** Agregar los eventos correspondientes en JavaScript. Para el modal, detectar el clic y remover la clase que lo oculta. Para el cierre de sesión, limpiar el almacenamiento del navegador (`sessionStorage`) y redirigir al login.

## 4. Deuda Técnica y Buenas Prácticas 🛠️

### Código Duplicado
- **Problema:** La función `httpClient` (que se encarga de hacer las peticiones a la base de datos) está duplicada en los archivos `inventario.js` y `usuarios.js`.
- **Por qué ocurre:** Desarrollo de módulos por separado sin refactorizar el código común, lo que dificulta el mantenimiento a largo plazo.
- **Solución:** Crear un archivo de utilidades separado (ej. `js/api.js` o `js/utils.js`), colocar allí las funciones compartidas e importarlas en los demás archivos.

### Variables Globales Quemadas (Hardcoded)
- **Problema:** La URL de la base de datos está escrita directamente (hardcoded) en la primera línea de todos los archivos de JavaScript.
- **Por qué ocurre:** Es rápido para prototipar, pero difícil de mantener. Si la URL cambia en el futuro, habrá que buscar y modificar archivo por archivo.
- **Solución:** Centralizar la configuración de la URL base en un solo archivo común y hacer referencia a esa variable global en el resto de la aplicación.
