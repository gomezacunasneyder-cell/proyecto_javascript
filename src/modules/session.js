const sesion = JSON.parse(sessionStorage.getItem("acme_produccion_sesion"));

if (!sesion) {
  window.location.href = "login.html";
}
