const dataManager = {
  // --- USUARIOS ---
  async getUsuarios() {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/usuarios.json`, "GET");
  },
  
  async getUsuario(idNumber) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/usuarios/${idNumber}.json`, "GET");
  },

  async guardarUsuario(idNumber, datos) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/usuarios/${idNumber}.json`, "PUT", datos);
  },

  async eliminarUsuario(idNumber) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/usuarios/${idNumber}.json`, "DELETE");
  },

  // --- PRODUCTOS (INVENTARIO) ---
  async getProductos() {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/inventario/productos.json`, "GET");
  },

  async guardarProducto(codigo, datos) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/inventario/productos/${codigo}.json`, "PUT", datos);
  },

  async eliminarProducto(codigo) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/inventario/productos/${codigo}.json`, "DELETE");
  },

  async patchProducto(codigo, datosPatch) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/inventario/productos/${codigo}.json`, "PATCH", datosPatch);
  },

  // --- PRODUCCION ---
  async getConsecutivoProduccion() {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/produccion/consecutivo.json`, "GET");
  },

  async putConsecutivoProduccion(nuevoConsecutivo) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/produccion/consecutivo.json`, "PUT", nuevoConsecutivo);
  },

  async guardarProcesoProduccion(consecutivo, proceso) {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/produccion/procesos/${consecutivo}.json`, "PUT", proceso);
  },

  async getProcesosProduccion() {
    return window.api.httpClient(`${window.api.FIREBASE_URL}/produccion/procesos.json`, "GET");
  }
};

window.dataManager = dataManager;
