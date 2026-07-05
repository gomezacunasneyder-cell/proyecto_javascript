const usuarioActivo = document.getElementById("usuarioActivo");
const btnlogout = document.getElementById("btnlogout");



const datoGuardado = sessionStorage.getItem("orbit_pc_sesion");
if (datoGuardado === null) {
  window.location.href = "login.html";
}
else {
    const usuario = JSON.parse(datoGuardado);
    usuarioActivo.textContent = usuario.fullName;
    btnlogout.addEventListener("click", () => {
        sessionStorage.removeItem("orbit_pc_sesion");
        window.location.href = "login.html";
    });
}