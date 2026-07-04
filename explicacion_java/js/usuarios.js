const URL = 'https://stock-flow-74480-default-rtdb.firebaseio.com/user';

const formulario = document.getElementById("formulario-usuario");
const mensajeError = document.getElementById("mensajeError");
const tituloFormulario = document.getElementById("tituloFormulario");
const idOriginalInput = document.getElementById("idOriginal");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btncancelar");
const cuerpoTabla = document.getElementById("cuerpoTablaUsuarios");
const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const modalUsuario = document.getElementById("modalUsuario");

// Cliente HTTP genérico
const httpClient = async (url, method, payload = null) => {
  const opciones = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (payload) opciones.body = JSON.stringify(payload);

  const response = await fetch(url, opciones);
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return response.json();
};

const existeUsuario = async (idNumber) => {
  const data = await httpClient(`${URL}/usuarios/${idNumber}.json`, "GET");
  return data !== null;
};

// --- LISTAR ---
const listarUsuarios = async () => {
  try {
    const data = await httpClient(`${URL}/usuarios.json`, "GET");
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

      const btnEditar = document.createElement("button");
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => cargarParaEditar(usuario));

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.addEventListener("click", () => eliminarUsuario(usuario.idNumber));

      celdaAcciones.append(btnEditar, btnEliminar);
      fila.append(celdaId, celdaNombre, celdaCargo, celdaAcciones);
      cuerpoTabla.append(fila);
    });

  } catch (error) {
    console.error("Error al listar usuarios:", error);
    mensajeError.textContent = "No se pudo cargar la lista de usuarios.";
  }
};

// --- CREAR / MODIFICAR ---
const guardarUsuario = async (datos, esEdicion) => {
  mensajeError.textContent = "";

  try {
    if (!esEdicion) {
      const yaExiste = await existeUsuario(datos.idNumber);
      if (yaExiste) {
        mensajeError.textContent = "Ya existe un usuario registrado con ese número de identificación.";
        return;
      }
    }

    await httpClient(`${URL}/usuarios/${datos.idNumber}.json`, "PUT", datos);

    resetearFormulario();
    await listarUsuarios();

  } catch (error) {
    console.error("Error al guardar el usuario:", error);
    mensajeError.textContent = "No se pudo conectar con el servidor. Inténtalo de nuevo.";
  }
};

// --- ELIMINAR ---
const eliminarUsuario = async (idNumber) => {
  const confirmar = confirm(`¿Seguro que deseas eliminar al usuario ${idNumber}?`);
  if (!confirmar) return;

  try {
    await httpClient(`${URL}/usuarios/${idNumber}.json`, "DELETE");
    await listarUsuarios();
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    mensajeError.textContent = "No se pudo eliminar el usuario.";
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
  btnCancelar.classList.remove("hidden");
  modalUsuario.classList.remove("hidden")
};

const resetearFormulario = () => {
  formulario.reset();
  idOriginalInput.value = "";
  document.getElementById("idNumber").disabled = false;
  tituloFormulario.textContent = "Crear Usuario";
  btnGuardar.textContent = "Guardar Usuario";
  modalUsuario.classList.add("hidden");
};

btnCancelar.addEventListener("click", resetearFormulario);

btnAgregarUsuario.addEventListener("click", () => {
  resetearFormulario();
  modalUsuario.classList.remove("hidden");
});


formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fd = new FormData(formulario);
  const esEdicion = idOriginalInput.value !== "";

  const datos = {
    idNumber: fd.get("idNumber").trim(),
    fullName: fd.get("fullName").trim(),
    position: fd.get("position").trim(),
    password: fd.get("password"),
    confirmPassword: fd.get("confirmPassword")
  };

  mensajeError.textContent = "";

  // En edición, la contraseña es opcional (solo si se quiere cambiar)
  if (datos.password || datos.confirmPassword || !esEdicion) {
    if (datos.password !== datos.confirmPassword) {
      mensajeError.textContent = "Las contraseñas no coinciden. Verifícalas e intenta de nuevo.";
      return;
    }
    if (!esEdicion && datos.password.length < 6) {
      mensajeError.textContent = "La contraseña debe tener al menos 6 caracteres.";
      return;
    }
  }

  // Si es edición y no se escribió nueva contraseña, hay que conservar la anterior
  if (esEdicion && !datos.password) {
    const usuarioActual = await httpClient(`${URL}/usuarios/${datos.idNumber}.json`, "GET");
    datos.password = usuarioActual.password;
  }

  delete datos.confirmPassword;

  await guardarUsuario(datos, esEdicion);
});

listarUsuarios();