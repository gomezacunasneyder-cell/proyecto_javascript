const URL_INVENTARIO = "https://stock-flow-74480-default-rtdb.firebaseio.com/inventario/productos";
const URL_PRODUCCION = "https://stock-flow-74480-default-rtdb.firebaseio.com/produccion";

let productos = [];
let ordenActual = [];

const selectProducto = document.getElementById("selectProductoFabricar");
const cuerpoOrden = document.getElementById("cuerpoTablaOrden");
const cuerpoHistorial = document.getElementById("cuerpoTablaHistorial");
const tarjetaResumen = document.getElementById("tarjetaResumen");
const codigoResumen = document.getElementById("codigoResumen");
const contenidoResumen = document.getElementById("contenidoResumen");

const httpClient = async (url, method, payload = null) => {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload !== null ? JSON.stringify(payload) : undefined
  });
  return res.json();
};

const cargarProductos = async () => {
  const data = await httpClient(`${URL_INVENTARIO}.json`, "GET");
  productos = data ? Object.values(data) : [];

  const terminados = productos.filter(p => p.tipo === "Producto Terminado");
  selectProducto.innerHTML = terminados.map(p =>
    `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
  ).join("");
};

document.getElementById("btnAgregarOrden").addEventListener("click", () => {
  const codigo = selectProducto.value;
  const cantidad = Number(document.getElementById("cantidadFabricar").value);
  const producto = productos.find(p => p.codigo === codigo);

  if (!producto || !producto.formula) {
    alert("Este producto no tiene fórmula registrada.");
    return;
  }
  if (cantidad <= 0) {
    alert("La cantidad debe ser mayor a cero.");
    return;
  }

  const insumosUsados = producto.formula.map(insumo => ({
    codigoMP: insumo.codigoMP,
    cantidad: insumo.cantidad * cantidad,
    unidad: insumo.unidad
  }));

  ordenActual.push({
    codigoProducto: producto.codigo,
    nombreProducto: producto.nombre,
    cantidadFabricada: cantidad,
    insumosUsados
  });

  pintarOrden();
});

const pintarOrden = () => {
  cuerpoOrden.innerHTML = "";
  ordenActual.forEach((item, index) => {
    const insumosTexto = item.insumosUsados
      .map(i => {
        const mp = productos.find(p => p.codigo === i.codigoMP);
        return `${mp ? mp.nombre : i.codigoMP}: ${i.cantidad} ${i.unidad}`;
      })
      .join(", ");

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.nombreProducto}</td>
      <td>${item.cantidadFabricada}</td>
      <td>${insumosTexto}</td>
      <td><button type="button" data-index="${index}" class="btn-quitar-orden">Quitar</button></td>
    `;
    cuerpoOrden.appendChild(fila);
  });

  document.querySelectorAll(".btn-quitar-orden").forEach(btn => {
    btn.addEventListener("click", () => {
      ordenActual.splice(Number(btn.dataset.index), 1);
      pintarOrden();
    });
  });
};

document.getElementById("btnRegistrarProduccion").addEventListener("click", async () => {
  if (ordenActual.length === 0) {
    alert("Agrega al menos un producto a la orden.");
    return;
  }

  try {
    await cargarProductos(); // refresca stock antes de validar

    // Consolidar insumos totales requeridos usando Map
    const totales = new Map();
    ordenActual.forEach(item => {
      item.insumosUsados.forEach(insumo => {
        const acumulado = totales.get(insumo.codigoMP) || 0;
        totales.set(insumo.codigoMP, acumulado + insumo.cantidad);
      });
    });

    // Validar stock suficiente antes de modificar nada
    for (const [codigoMP, cantidadRequerida] of totales) {
      const materiaPrima = productos.find(p => p.codigo === codigoMP);
      if (!materiaPrima || (materiaPrima.stock || 0) < cantidadRequerida) {
        alert(`Stock insuficiente de "${materiaPrima ? materiaPrima.nombre : codigoMP}". Requerido: ${cantidadRequerida}, disponible: ${materiaPrima ? materiaPrima.stock : 0}.`);
        return;
      }
    }

    // Descontar materia prima
    for (const [codigoMP, cantidadRequerida] of totales) {
      const materiaPrima = productos.find(p => p.codigo === codigoMP);
      const nuevoStock = materiaPrima.stock - cantidadRequerida;
      await httpClient(`${URL_INVENTARIO}/${codigoMP}.json`, "PATCH", { stock: nuevoStock });
    }

    // Aumentar producto terminado
    for (const item of ordenActual) {
      const producto = productos.find(p => p.codigo === item.codigoProducto);
      const nuevoStock = (producto.stock || 0) + item.cantidadFabricada;
      await httpClient(`${URL_INVENTARIO}/${item.codigoProducto}.json`, "PATCH", { stock: nuevoStock });
    }

    // Generar consecutivo
    const consecutivoActual = await httpClient(`${URL_PRODUCCION}/consecutivo.json`, "GET");
    const nuevoConsecutivo = (consecutivoActual || 0) + 1;
    await httpClient(`${URL_PRODUCCION}/consecutivo.json`, "PUT", nuevoConsecutivo);

    const sesion = JSON.parse(sessionStorage.getItem("orbit_pc_sesion")) || {};

    const proceso = {
      codigo: nuevoConsecutivo,
      fecha: new Date().toLocaleString("es-CO"),
      responsable: sesion.fullName || "Desconocido",
      items: ordenActual
    };

    await httpClient(`${URL_PRODUCCION}/procesos/${nuevoConsecutivo}.json`, "PUT", proceso);

    mostrarResumen(proceso);
    ordenActual = [];
    pintarOrden();
    await cargarProductos();
    await cargarHistorial();

  } catch (error) {
    console.error("Error al registrar la producción:", error);
    alert("No se pudo registrar la producción. Revisa la consola para más detalles.");
  }
});

const mostrarResumen = (proceso) => {
  codigoResumen.textContent = proceso.codigo;
  contenidoResumen.innerHTML = proceso.items.map(item => {
    const insumos = item.insumosUsados.map(i => {
      const mp = productos.find(p => p.codigo === i.codigoMP);
      return `<li>${mp ? mp.nombre : i.codigoMP}: ${i.cantidad} ${i.unidad}</li>`;
    }).join("");

    return `<h4>${item.nombreProducto} — Fabricado: ${item.cantidadFabricada}</h4><ul>${insumos}</ul>`;
  }).join("");

  tarjetaResumen.classList.remove("hidden");
};

const cargarHistorial = async () => {
  try {
    const data = await httpClient(`${URL_PRODUCCION}/procesos.json`, "GET");
    const procesos = data ? Object.values(data) : [];

    const procesosValidos = procesos.filter(p => p && Array.isArray(p.items));

    if (procesosValidos.length === 0) {
      cuerpoHistorial.innerHTML = `<tr><td colspan="4">Aún no hay procesos de producción registrados.</td></tr>`;
      return;
    }

    cuerpoHistorial.innerHTML = procesosValidos
      .sort((a, b) => b.codigo - a.codigo)
      .map(p => `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.fecha}</td>
          <td>${p.responsable}</td>
          <td>${p.items.map(i => `${i.nombreProducto} (${i.cantidadFabricada})`).join(", ")}</td>
        </tr>
      `).join("");

  } catch (error) {
    console.error("Error al cargar historial:", error);
    cuerpoHistorial.innerHTML = `<tr><td colspan="4">No se pudo cargar el historial.</td></tr>`;
  }
};

(async () => {
  await cargarProductos();
  await cargarHistorial();
})();