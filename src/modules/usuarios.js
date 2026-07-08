const formulario = document.getElementById("formulario-usuario");
const mensajeError = document.getElementById("mensajeError");
const tituloFormulario = document.getElementById("tituloFormulario");
const idOriginalInput = document.getElementById("idOriginal");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btncancelar");
const cuerpoTabla = document.getElementById("cuerpoTablaUsuarios");
const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const modalUsuario = document.getElementById("modalUsuario");

const existeUsuario = async (idNumber) => {
  const data = await window.dataManager.getUsuario(idNumber);
  return data !== null;
};

// --- LISTAR ---
const listarUsuarios = async () => {
  try {
    const data = await window.dataManager.getUsuarios();
    cuerpoTabla.innerHTML = "";

    if (!data) return;

    Object.values(data).forEach(usuario => {
      const fila = document.createElement("tr");

      const celdaId = document.createElement("td");
      celdaId.textContent = usuario.idNumber;

      const celdaNombre = document.createElement("td");
      celdaNombre.textContent = usuario.fullName;

      const celdaCargo = document.createElement("td");
      celdaCargo.textContent = usuario.position;

      const celdaAcciones = document.createElement("td");
      celdaAcciones.className = "celda-acciones";

      const btnEditar = document.createElement("acme-button");
      btnEditar.setAttribute("variant", "secondary");
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => cargarParaEditar(usuario));

      const btnEliminar = document.createElement("acme-button");
      btnEliminar.setAttribute("variant", "secondary");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.addEventListener("click", () => eliminarUsuario(usuario.idNumber));

      celdaAcciones.append(btnEditar, btnEliminar);
      fila.append(celdaId, celdaNombre, celdaCargo, celdaAcciones);
      cuerpoTabla.append(fila);
    });

  } catch (error) {
    console.error("Error al listar usuarios:", error);
    window.showToast("No se pudo cargar la lista de usuarios.", "error");
  }
};

// --- CREAR / MODIFICAR ---
const guardarUsuario = async (datos, esEdicion) => {
  try {
    if (!esEdicion) {
      const yaExiste = await existeUsuario(datos.idNumber);
      if (yaExiste) {
        window.showToast("Ya existe un usuario registrado con ese número de identificación.", "error");
        return;
      }
    }

    await window.dataManager.guardarUsuario(datos.idNumber, datos);
    window.showToast(esEdicion ? "Usuario actualizado con éxito" : "Usuario creado con éxito", "success");

    resetearFormulario();
    await listarUsuarios();

  } catch (error) {
    console.error("Error al guardar el usuario:", error);
    window.showToast("No se pudo conectar con el servidor. Inténtalo de nuevo.", "error");
  }
};

// --- ELIMINAR ---
const eliminarUsuario = async (idNumber) => {
  const confirmar = confirm(`¿Seguro que deseas eliminar al usuario ${idNumber}?`);
  if (!confirmar) return;

  try {
    await window.dataManager.eliminarUsuario(idNumber);
    window.showToast("Usuario eliminado con éxito", "success");
    await listarUsuarios();
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    window.showToast("No se pudo eliminar el usuario.", "error");
  }
};

// --- Cargar datos en el formulario para editar ---
const cargarParaEditar = (usuario) => {
  idOriginalInput.value = usuario.idNumber;
  document.getElementById("idNumber").value = usuario.idNumber;
  document.getElementById("fullName").value = usuario.fullName;
  document.getElementById("position").value = usuario.position;
  document.getElementById("password").value = "";
  document.getElementById("confirmPassword").value = "";

  document.getElementById("idNumber").disabled = true; // el ID es la clave, no se cambia
  tituloFormulario.textContent = "Editar Usuario";
  btnGuardar.textContent = "Actualizar Usuario";
  if (btnCancelar) btnCancelar.classList.remove("hidden");
  modalUsuario.classList.remove("hidden")
};

const resetearFormulario = () => {
  if (formulario) formulario.reset();
  idOriginalInput.value = "";
  document.getElementById("idNumber").disabled = false;
  tituloFormulario.textContent = "Crear Usuario";
  btnGuardar.textContent = "Guardar Usuario";
  modalUsuario.classList.add("hidden");
};

if (btnCancelar) btnCancelar.addEventListener("click", resetearFormulario);

if (btnAgregarUsuario) {
  btnAgregarUsuario.addEventListener("click", () => {
    resetearFormulario();
    modalUsuario.classList.remove("hidden");
  });
}

if (formulario) {
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const esEdicion = idOriginalInput.value !== "";
    const fullName = document.getElementById("fullName").value.trim();
    const position = document.getElementById("position").value.trim();

    if (!fullName) {
      window.showToast("El nombre completo no puede estar vacío ni contener solo espacios.", "error");
      return;
    }

    // Validar que el nombre sólo contenga letras (incluye acentos) y espacios
    const nombreValido = /^[A-Za-zÀ-ÿ\s]+$/.test(fullName);
    if (!nombreValido) {
      window.showToast("El nombre completo sólo puede contener letras y espacios.", "error");
      return;
    }

    if (!['Jefe', 'Usuario'].includes(position)) {
      window.showToast("El cargo debe ser Jefe o Usuario.", "error");
      return;
    }

    const idNumber = document.getElementById("idNumber").value.trim();

    // Validar que la identificación sea sólo dígitos
    if (!/^[0-9]+$/.test(idNumber)) {
      window.showToast("El número de identificación debe contener sólo dígitos.", "error");
      return;
    }

    const datos = {
      idNumber,
      fullName,
      position,
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value
    };

    // En edición, la contraseña es opcional (solo si se quiere cambiar)
    if (datos.password || datos.confirmPassword || !esEdicion) {
      if (datos.password !== datos.confirmPassword) {
        window.showToast("Las contraseñas no coinciden. Verifícalas e intenta de nuevo.", "error");
        return;
      }
      if (!esEdicion && datos.password.length < 6) {
        window.showToast("La contraseña debe tener al menos 6 caracteres.", "error");
        return;
      }
    }

    // Si es edición y no se escribió nueva contraseña, hay que conservar la anterior
    if (esEdicion && !datos.password) {
      const usuarioActual = await window.dataManager.getUsuario(datos.idNumber);
      datos.password = usuarioActual.password;
    } else if (datos.password) {
      datos.password = await window.api.hashPassword(datos.password);
    }

    delete datos.confirmPassword;

    await guardarUsuario(datos, esEdicion);
  });
}

if (cuerpoTabla) {
  listarUsuarios();
}

// Real-time input cleaning for Nombre Completo (permitir solo letras y espacios)
document.addEventListener('DOMContentLoaded', () => {
  const fullNameInput = document.getElementById('fullName');
  if (!fullNameInput) return;

  fullNameInput.addEventListener('input', () => {
    const current = fullNameInput.value || '';
    const cleaned = current.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
    if (current !== cleaned) fullNameInput.value = cleaned;
  });
});
