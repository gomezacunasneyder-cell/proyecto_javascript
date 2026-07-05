const FIREBASE_URL = "https://stock-flow-74480-default-rtdb.firebaseio.com";

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

// Función para hashear de forma real usando SHA-256 (asíncrona)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "AcmeSalt2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Exportar globalmente
window.api = {
  FIREBASE_URL,
  httpClient,
  hashPassword
};
