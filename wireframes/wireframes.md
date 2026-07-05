# Wireframes de la Aplicación

Debido a que este repositorio se enfoca en código fuente, los wireframes visuales se describen en este documento. Para un proyecto real, aquí se anexarían imágenes `.png` o archivos de Figma.

## 1. Login (`login.html`)
- **Estructura**: Centrado en pantalla.
- **Elementos**:
  - Logo/Título arriba: "Acme Producción - Inicio de Sesión".
  - Subtítulo indicando propósito.
  - Inputs: "Número de Identificación" y "Contraseña" (tipo password).
  - Botón: "Ingresar" ocupando el 100% del ancho del formulario.
  - Mensaje de error (rojo) debajo del botón si las credenciales fallan.
  - Enlace al final: "¿No tienes cuenta? Regístrate aquí".

## 2. Módulo de Usuarios (`usuarios.html`)
- **Estructura**: 
  - **Header/Navbar**: Logo a la izquierda, pestañas centrales (Usuarios, Inventario, Producción), saludo y botón logout a la derecha.
  - **Contenido Central**: Tabla que ocupa gran parte de la pantalla.
- **Elementos**:
  - Título "Gestión de Usuarios".
  - Botón a la derecha "Agregar usuario".
  - Tabla con columnas: Número de identificación, Nombre completo, Cargo, Acciones (Editar/Eliminar).
  - **Modal**: Flotante sobre la pantalla oscurecida (fondo negro al 30%). Contiene inputs para ID, Nombre, Cargo, Contraseña y Confirmar Contraseña, botones "Guardar" y "Cancelar".

## 3. Módulo de Inventario (`inventario.html`)
- **Estructura**: Similar a usuarios (Header compartido).
- **Elementos**:
  - **Sección Superior (Formulario de Registro)**: Inputs para Código, Nombre, Tipo (Select), Unidad, Proveedor. 
    - Input de Stock con botones `+` y `-` adyacentes para control rápido.
    - Sección de Fórmula (solo visible si el tipo es Producto Terminado), permite agregar N insumos dinámicamente (Select + Cantidad).
    - Botón "Registrar Producto Nuevo".
  - **Sección Inferior (Tabla)**: 
    - Buscador integrado para filtrar.
    - Tabla con columnas: Código, Nombre, Proveedor/Tipo, Stock Actual (resaltado con badge) y botón de eliminar.

## 4. Módulo de Producción (`produccion.html`)
- **Estructura**: Dividido en 4 paneles/tarjetas visuales verticales.
- **Elementos**:
  - **Nueva Orden**: Select de Producto Terminado, input numérico de cantidad y botón "+ Agregar a la orden".
  - **Orden Actual**: Tabla temporal con el desglose de lo que se fabricará y qué insumos tomará. Botón global "Registrar Producción".
  - **Resumen**: Panel destacado que aparece al registrar exitosamente, mostrando un id de proceso único y un detalle de lo consumido y fabricado.
  - **Historial**: Tabla de solo lectura que lista todos los procesos pasados ordenados del más reciente al más antiguo, mostrando fecha, responsable y detalle.
