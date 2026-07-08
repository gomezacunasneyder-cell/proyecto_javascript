// src/modules/auth.js

const formularioLogin = document.getElementById("formularioLogin");
const formularioRegistro = document.getElementById("formularioRegistro");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", async (event) => {
    event.preventDefault();
    const idNumber = document.getElementById("username").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
      const hash = await window.api.hashPassword(contrasena);
      const resultUser = await window.dataManager.getUsuario(idNumber);

      if (resultUser != null) {
        if (hash === resultUser.password) {
          sessionStorage.setItem("acme_produccion_sesion", JSON.stringify(resultUser));
          window.showToast("Sesión iniciada con éxito", "success");
          setTimeout(() => {
            window.location.href = "usuarios.html";
          }, 1000);
        } else {
          window.showToast("Contraseña incorrecta", "error");
        }
      } else {
        window.showToast("El usuario no existe", "error");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      window.showToast("Error de conexión con el servidor", "error");
    }
  });
}

if (formularioRegistro) {
  formularioRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idNumber = document.getElementById("idNumber").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const position = document.getElementById("position").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validar que la identificación sea sólo dígitos
    if (!/^[0-9]+$/.test(idNumber)) {
      window.showToast("El número de identificación debe contener sólo dígitos.", "error");
      return;
    }

    if (!['Jefe', 'Usuario'].includes(position)) {
      window.showToast("El cargo debe ser Jefe o Usuario.", "error");
      return;
    }

    if (!fullName) {
      window.showToast("El nombre completo no puede estar vacío ni contener solo espacios.", "error");
      return;
    }

    if (password !== confirmPassword) {
      window.showToast("Las contraseñas no coinciden", "error");
      return;
    }
    if (password.length < 6) {
      window.showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    try {
      const existe = await window.dataManager.getUsuario(idNumber);
      if (existe) {
        window.showToast("Ya existe un usuario con esa identificación", "error");
        return;
      }

      const hash = await window.api.hashPassword(password);
      const nuevoUsuario = {
        idNumber,
        fullName,
        position,
        password: hash
      };

      await window.dataManager.guardarUsuario(idNumber, nuevoUsuario);
      window.showToast("Registro exitoso", "success");
      
      sessionStorage.setItem("acme_produccion_sesion", JSON.stringify(nuevoUsuario));
      setTimeout(() => {
        window.location.href = "usuarios.html";
      }, 1000);

    } catch (error) {
      console.error("Error al registrar:", error);
      window.showToast("Error de conexión con el servidor", "error");
    }
  });
}
