const URL_FIREBASE = "https://stock-flow-74480-default-rtdb.firebaseio.com";

const formularioLogin = document.getElementById("formularioLogin");

formularioLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  const idNumber = document.getElementById("username").value;
  const contrasena = document.getElementById("contrasena").value;

  const resultUser = await addUser(idNumber);

  if (resultUser != null) {
    if (contrasena === resultUser.password) {
      sessionStorage.setItem("orbit_pc_sesion", JSON.stringify(resultUser));
      window.location.href = "usuarios.html";
    }
    else {
      document.getElementById("mensajeError").textContent = "Contraseña incorrecta";
    }
  }

});

async function addUser(idNumber) {
  const response = await fetch(`${URL_FIREBASE}/user/usuarios/${idNumber}.json`);
  return await response.json();
}