# Proyecto Acme Producción (Orbit PC Store) — JavaScript

Sistema de gestión de usuarios, inventario y producción para la planta de Acme en Macondo. Construido con HTML, CSS y JavaScript, usando Firebase Realtime Database como backend.

## Objetivo general

Automatizar el proceso productivo de la planta: registrar usuarios autorizados, mantener el inventario de materia prima y productos terminados, y ejecutar procesos de producción que consuman materia prima según una fórmula y generen producto terminado.

## Estado por módulo (checklist real, verificado contra el código)

### Módulo de Usuarios — Casi completo
- [x] Registro con identificación (`idNumber`), nombre completo (`fullName`), cargo (`position`) y contraseña
- [x] Doble validación de contraseña (`password` vs `confirmPassword`)
- [x] Validación de identificación duplicada (`existeUsuario`)
- [x] Cargo obligatorio (atributo `required` en el input)
- [x] Listar, editar y eliminar usuarios
- [x] Sincronización con Firebase (`/user/clientes`)
- [x ] El botón "Agregar usuario" (`btn-abrir-modal`) no tiene evento asignado — el modal nunca se abre
- [ ] Nota: el enunciado no pide un campo `rol` como tal; se está usando `position` (cargo). Si se quiere renombrar, hay que decidirlo antes de tocar Firebase.

### Login — Casi completo
- [x] Formulario de autenticación por identificación + contraseña
- [x] Protección de rutas: `session.js` verifica `sessionStorage` (`orbit_pc_sesion`) al cargar `usuarios.html`/`inventario.html` y redirige a `login.html` si no hay sesión activa
- [x] Botón "Cerrar sesión" funcional (`removeItem` de la sesión + redirección a `login.html`)
- [x] Se muestra el usuario activo (`usuarioActivo`) con `usuario.fullName`
- [x ] Inconsistencia de ruta en Firebase: login busca en `/user/usuarios/...` pero `usuarios.js` guarda en `/user/clientes/...` (**pendiente unificar**, sigue sin resolverse)

### Módulo de Inventario — Bastante avanzado
- [] Registrar producto: código, nombre, proveedor, tipo
- [] Definir fórmula/receta cuando el producto es tipo "terminado" (materia prima + cantidad + unidad)
- [] Aumentar stock por código de producto + cantidad
- [] Listado de productos con datos completos y saldo actual (tabla)
- [ ] Buscador/filtro de productos — pendiente
- [] Rutas de `inventario.html` corregidas (`css/` y `js/`, consistentes con el resto de páginas)

### Módulo de Producción — Sin iniciar
- [ ] Seleccionar producto(s) a fabricar y cantidad
- [ ] Descontar materia prima según la fórmula
- [ ] Incrementar stock del producto terminado
- [ ] Código consecutivo autoincremental por proceso de producción
- [ ] Resumen de producción (cantidad fabricada + materia prima consumida)
- [ ] No existen `produccion.html` ni `produccion.js` todavía

### Transversales — Sin iniciar
- [ ] Web Components para reutilización de UI (navbar/sesión, modal, filas de tabla/fórmula, buscador)
- [ ] Diseño responsive validado en móvil
- [ ] Wireframes de las 4 pantallas
- [ ] Cifrado de contraseñas antes de almacenarlas (actualmente se guardan y comparan en texto plano — documentado como riesgo de seguridad)
- [ ] `httpClient` duplicado en `inventario.js` y `usuarios.js` — pendiente extraer a archivo compartido
- [ ] URL base de Firebase hardcoded en cada archivo JS — pendiente centralizar

## Decisiones de nomenclatura

- El id del botón de cerrar sesión se cambió de `btn-logout` a `btnlogout` (sin guión) en HTML, CSS y JS, por consistencia entre los tres archivos. Si en el futuro se agregan más botones con guiones (como `btn-guardar-producto`), revisar si conviene volver a la convención con guiones para mantener todo el proyecto uniforme.

## Plan de trabajo (orden acordado)

1. **Bugs básicos**: corregir rutas, crear `session.js` (verificación de sesión + logout + nombre de usuario activo), arreglar el modal de usuarios.
2. **Refactor**: extraer `httpClient` a un archivo compartido (`js/api.js` o similar) y centralizar la URL base de Firebase.
3. **Web Components**: convertir piezas repetidas de la UI (barra de navegación/sesión, modal, filas de fórmula/tabla) en componentes reutilizables.
4. **Módulo de producción**: nueva vista y lógica para ejecutar procesos productivos (consumo de materia prima, generación de producto terminado, consecutivo de proceso, resumen de fabricación por producto).
5. **Pulido final**: buscador en inventario, responsive/UX, wireframes, documentación técnica de entrega.

## Cómo se está trabajando

Este README se irá actualizando a medida que se completen los pasos del plan. El código lo escribe el autor del proyecto; el asistente actúa como guía (pistas, revisión, preguntas), sin escribir la solución directamente, como parte del proceso de aprendizaje.
