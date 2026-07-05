let productos = [];
let ordenActual = [];

const selectProducto = document.getElementById("selectProductoFabricar");
const cuerpoOrden = document.getElementById("cuerpoTablaOrden");
const cuerpoHistorial = document.getElementById("cuerpoTablaHistorial");
const tarjetaResumen = document.getElementById("tarjetaResumen");
const codigoResumen = document.getElementById("codigoResumen");
const contenidoResumen = document.getElementById("contenidoResumen");
const btnAgregarOrden = document.getElementById("btnAgregarOrden");
const btnRegistrarProduccion = document.getElementById("btnRegistrarProduccion");

const cargarProductos = async () => {
  const data = await window.dataManager.getProductos();
  productos = data ? Object.values(data) : [];

  const terminados = productos.filter(p => p.tipo === "Producto Terminado");
  if (selectProducto) {
    selectProducto.innerHTML = terminados.map(p =>
      `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
    ).join("");
  }
};

if (btnAgregarOrden) {
  btnAgregarOrden.addEventListener("click", () => {
    const codigo = selectProducto.value;
    const cantidad = Number(document.getElementById("cantidadFabricar").value);
    const producto = productos.find(p => p.codigo === codigo);

    if (!producto || !producto.formula) {
      window.showToast("Este producto no tiene fórmula registrada.", "error");
      return;
    }
    if (cantidad <= 0) {
      window.showToast("La cantidad debe ser mayor a cero.", "error");
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
}

const pintarOrden = () => {
  if (!cuerpoOrden) return;
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
      <td><acme-button button-id="btn-quitar-orden-${index}" variant="secondary" class="btn-quitar-orden" data-index="${index}">Quitar</acme-button></td>
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

if (btnRegistrarProduccion) {
  btnRegistrarProduccion.addEventListener("click", async () => {
    if (ordenActual.length === 0) {
      window.showToast("Agrega al menos un producto a la orden.", "error");
      return;
    }

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
        window.showToast(`Stock insuficiente de "${materiaPrima ? materiaPrima.nombre : codigoMP}". Requerido: ${cantidadRequerida}, disponible: ${materiaPrima ? materiaPrima.stock : 0}.`, "error");
        return;
      }
    }

    // Descontar materia prima
    for (const [codigoMP, cantidadRequerida] of totales) {
      const materiaPrima = productos.find(p => p.codigo === codigoMP);
      const nuevoStock = materiaPrima.stock - cantidadRequerida;
      await window.dataManager.patchProducto(codigoMP, { stock: nuevoStock });
    }

    // Aumentar producto terminado
    for (const item of ordenActual) {
      const producto = productos.find(p => p.codigo === item.codigoProducto);
      const nuevoStock = (producto.stock || 0) + item.quantity || item.cantidadFabricada;
      await window.dataManager.patchProducto(item.codigoProducto, { stock: nuevoStock });
    }

    // Generar consecutivo
    const consecutivoActual = await window.dataManager.getConsecutivoProduccion();
    const nuevoConsecutivo = (consecutivoActual || 0) + 1;
    await window.dataManager.putConsecutivoProduccion(nuevoConsecutivo);

    const sesion = JSON.parse(sessionStorage.getItem("acme_produccion_sesion")) || {};

    const proceso = {
      codigo: nuevoConsecutivo,
      fecha: new Date().toLocaleString("es-CO"),
      responsable: sesion.fullName || "Desconocido",
      items: ordenActual
    };

    await window.dataManager.guardarProcesoProduccion(nuevoConsecutivo, proceso);
    window.showToast("Producción registrada con éxito", "success");

    mostrarResumen(proceso);
    ordenActual = [];
    pintarOrden();
    await cargarProductos();
    await cargarHistorial();
  });
}

const mostrarResumen = (proceso) => {
  if (!codigoResumen || !contenidoResumen || !tarjetaResumen) return;
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
  if (!cuerpoHistorial) return;
  const data = await window.dataManager.getProcesosProduccion();
  const procesos = data ? Object.values(data).filter(p => p !== null) : [];

  cuerpoHistorial.innerHTML = procesos
    .sort((a, b) => b.codigo - a.codigo)
    .map(p => `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.fecha}</td>
        <td>${p.responsable}</td>
        <td>${p.items.map(i => `${i.nombreProducto} (${i.cantidadFabricada})`).join(", ")}</td>
      </tr>
    `).join("");
};

(async () => {
  await cargarProductos();
  await cargarHistorial();
})();
