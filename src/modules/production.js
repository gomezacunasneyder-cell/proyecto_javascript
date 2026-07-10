let productos = [];
let historialProcesos = [];
const maxHistorialVisibles = 5;

const selectProducto = document.getElementById("selectProductoFabricar");
const cantidadFabricarInput = document.getElementById("cantidadFabricar");
const cuerpoHistorial = document.getElementById("cuerpoTablaHistorial");
const historialNota = document.getElementById("historialNota");
const inputBuscarHistorial = document.getElementById("inputBuscarHistorial");
const infoProduccion = document.getElementById("infoProduccion");
const btnRegistrarProduccion = document.getElementById("btnRegistrarProduccion");
const contenedorRanking = document.getElementById("contenedorRanking");

const cargarProductos = async () => {
  const data = await window.dataManager.getProductos();
  productos = data ? Object.values(data) : [];

  const terminados = productos.filter(p => p.tipo === "Producto Terminado");
  if (selectProducto) {
    selectProducto.innerHTML = terminados.map(p =>
      `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
    ).join("");
    selectProducto.addEventListener("change", calcularProduccion);
  }

  if (cantidadFabricarInput) {
    cantidadFabricarInput.addEventListener("input", calcularProduccion);
    cantidadFabricarInput.addEventListener("change", calcularProduccion);
  }

  calcularProduccion();
};

const calcularProduccion = () => {
  if (!infoProduccion || !selectProducto || !cantidadFabricarInput) return;

  const codigo = selectProducto.value;
  const valorCantidad = cantidadFabricarInput.value.trim();
  const cantidad = Number(valorCantidad);
  const producto = productos.find(p => p.codigo === codigo);

  if (!producto || !producto.formula) {
    infoProduccion.classList.add("hidden");
    infoProduccion.innerHTML = "";
    return;
  }

  if (!valorCantidad || !Number.isFinite(cantidad) || cantidad < 1) {
    infoProduccion.classList.remove("hidden");
    infoProduccion.innerHTML = `
      <p class="nota compacta">Ingrese una cantidad válida para ver los insumos necesarios.</p>
    `;
    return;
  }

  const insumosNecesarios = producto.formula.map(insumo => {
    const materiaPrima = productos.find(p => p.codigo === insumo.codigoMP);
    const stock = materiaPrima ? materiaPrima.stock || 0 : 0;
    const cantidadRequerida = insumo.cantidad * cantidad;
    const posible = stock > 0 ? Math.floor(stock / insumo.cantidad) : 0;

    return {
      nombre: materiaPrima ? materiaPrima.nombre : insumo.codigoMP,
      cantidadRequerida,
      unidad: materiaPrima ? materiaPrima.unidad || insumo.unidad : insumo.unidad,
      stock,
      posible
    };
  });

  const posiblePorStock = Math.min(...insumosNecesarios.map(i => i.posible));

  infoProduccion.classList.remove("hidden");
  infoProduccion.innerHTML = `
    <div class="info-produccion-card">
      <p class="info-titulo">Materia prima requerida</p>
      <ul>
        ${insumosNecesarios.map(i => `<li>${i.nombre}: ${i.cantidadRequerida} ${i.unidad} (stock: ${i.stock})</li>`).join("")}
      </ul>
      <p class="info-titulo">Producción posible con stock disponible: <strong>${posiblePorStock}</strong></p>
    </div>
  `;
};

if (btnRegistrarProduccion) {
  btnRegistrarProduccion.addEventListener("click", async () => {
    const codigo = selectProducto.value;
    const valorCantidad = cantidadFabricarInput.value.trim();
    const cantidad = Number(valorCantidad);
    const producto = productos.find(p => p.codigo === codigo);

    if (!producto || !producto.formula) {
      window.showToast("Selecciona un producto válido con fórmula registrada.", "error");
      return;
    }
    if (!valorCantidad || !Number.isFinite(cantidad) || cantidad < 1) {
      window.showToast("La cantidad debe ser un número mayor o igual a 1.", "error");
      return;
    }

    const totales = new Map();
    producto.formula.forEach(insumo => {
      const cantidadRequerida = insumo.cantidad * cantidad;
      const acumulado = totales.get(insumo.codigoMP) || 0;
      totales.set(insumo.codigoMP, acumulado + cantidadRequerida);
    });

    for (const [codigoMP, cantidadRequerida] of totales) {
      const materiaPrima = productos.find(p => p.codigo === codigoMP);
      if (!materiaPrima || (materiaPrima.stock || 0) < cantidadRequerida) {
        window.showToast(`Stock insuficiente de "${materiaPrima ? materiaPrima.nombre : codigoMP}". Requerido: ${cantidadRequerida}, disponible: ${materiaPrima ? materiaPrima.stock : 0}.`, "error");
        return;
      }
    }

    for (const [codigoMP, cantidadRequerida] of totales) {
      const materiaPrima = productos.find(p => p.codigo === codigoMP);
      const nuevoStock = materiaPrima.stock - cantidadRequerida;
      await window.dataManager.patchProducto(codigoMP, { stock: nuevoStock });
    }

    const nuevoStockProducto = (producto.stock || 0) + cantidad;
    await window.dataManager.patchProducto(producto.codigo, { stock: nuevoStockProducto });

    const consecutivoActual = await window.dataManager.getConsecutivoProduccion();
    const nuevoConsecutivo = (consecutivoActual || 0) + 1;
    await window.dataManager.putConsecutivoProduccion(nuevoConsecutivo);

    const sesion = JSON.parse(sessionStorage.getItem("acme_produccion_sesion")) || {};

    const proceso = {
      codigo: nuevoConsecutivo,
      fecha: new Date().toLocaleString("es-CO"),
      responsable: sesion.fullName || "Desconocido",
      items: [{
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        cantidadFabricada: cantidad,
        insumosUsados: producto.formula.map(insumo => ({
          codigoMP: insumo.codigoMP,
          cantidad: insumo.cantidad * cantidad,
          unidad: insumo.unidad
        }))
      }]
    };

    await window.dataManager.guardarProcesoProduccion(nuevoConsecutivo, proceso);
    window.showToast("Producción registrada con éxito", "success");

    if (infoProduccion) {
      infoProduccion.classList.add("hidden");
      infoProduccion.innerHTML = "";
    }

    cantidadFabricarInput.value = "";
    await cargarProductos();
    await cargarHistorial();
    await actualizarRankingTop5();
  });
}


const renderHistorial = (procesos, isBusqueda = false) => {
  if (!cuerpoHistorial) return;
  if (!procesos || procesos.length === 0) {
    cuerpoHistorial.innerHTML = `
      <tr>
        <td colspan="4">No se encontraron procesos con ese criterio.</td>
      </tr>
    `;
    if (historialNota) historialNota.textContent = "";
    return;
  }

  const procesosOrdenados = [...procesos].sort((a, b) => (b.codigo || 0) - (a.codigo || 0));
  const mostrar = !isBusqueda && procesosOrdenados.length > maxHistorialVisibles
    ? procesosOrdenados.slice(0, maxHistorialVisibles)
    : procesosOrdenados;

  cuerpoHistorial.innerHTML = mostrar
    .map(p => `
      <tr>
        <td>${p.codigo ?? "N/A"}</td>
        <td>${p.fecha ?? "-"}</td>
        <td>${p.responsable ?? "-"}</td>
        <td>${Array.isArray(p.items) ? p.items.map(i => `${i.nombreProducto} (${i.cantidadFabricada})`).join(", ") : "-"}</td>
      </tr>
    `).join("");

  if (historialNota) {
    if (isBusqueda) {
      historialNota.textContent = `Mostrando ${mostrar.length} resultado(s) de búsqueda.`;
    } else if (procesosOrdenados.length > maxHistorialVisibles) {
      historialNota.textContent = `Mostrando ${maxHistorialVisibles} de ${procesosOrdenados.length} registros. Busca para ver más.`;
    } else {
      historialNota.textContent = "";
    }
  }
};

const cargarHistorial = async () => {
  if (!cuerpoHistorial) return;
  const data = await window.dataManager.getProcesosProduccion();
  historialProcesos = data
    ? (Array.isArray(data) ? data : Object.values(data)).filter(Boolean)
    : [];

  if (historialProcesos.length === 0) {
    cuerpoHistorial.innerHTML = `
      <tr>
        <td colspan="4">Aún no hay procesos de producción registrados.</td>
      </tr>
    `;
    if (historialNota) historialNota.textContent = "";
    return;
  }

  renderHistorial(historialProcesos, false);
};

const actualizarRankingTop5 = async () => {
  if (!contenedorRanking) return;

  try {
    const dataProcesos = await window.dataManager.getProcesosProduccion();
    const dataProductosInventario = await window.dataManager.getProductos();

    const procesos = dataProcesos
      ? Object.values(dataProcesos).filter(p => p && Array.isArray(p.items))
      : [];

    // Normalizar productos a un objeto { codigo: producto }
    let productosMap = {};
    if (dataProductosInventario) {
      if (Array.isArray(dataProductosInventario)) {
        productosMap = Object.fromEntries(dataProductosInventario.map(p => [p.codigo, p]));
      } else if (typeof dataProductosInventario === 'object') {
        // Si ya está en formato {codigo: producto} úsalo directamente
        productosMap = dataProductosInventario;
      }
    }

    if (procesos.length === 0) {
      contenedorRanking.innerHTML = `<p>Aún no hay procesos de producción registrados.</p>`;
      return;
    }

    const acumulado = new Map();

    procesos.forEach(proceso => {
      proceso.items.forEach(item => {
        if (!acumulado.has(item.codigoProducto)) {
          acumulado.set(item.codigoProducto, {
            nombre: item.nombreProducto,
            cantidadTotal: 0,
            insumosTotales: new Map()
          });
        }

        const registro = acumulado.get(item.codigoProducto);
        registro.cantidadTotal += item.cantidadFabricada;

        item.insumosUsados.forEach(insumo => {
          const previo = registro.insumosTotales.get(insumo.codigoMP) || 0;
          registro.insumosTotales.set(insumo.codigoMP, previo + insumo.cantidad);
        });
      });
    });

    const ranking = Array.from(acumulado.entries())
      .map(([codigo, datos]) => ({ codigo, ...datos }))
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 5);

    renderizarRanking(ranking, productosMap);

  } catch (error) {
    console.error("Error al generar el reporte:", error);
  }
};

const renderizarRanking = (ranking, productosMap) => {
  contenedorRanking.innerHTML = "";

  ranking.forEach((producto, index) => {
    const posicion = index + 1;

    const filasInsumos = Array.from(producto.insumosTotales.entries())
      .map(([codigoMP, cantidad]) => {
        const materiaPrima = productosMap[codigoMP];
        const nombre = materiaPrima ? materiaPrima.nombre : codigoMP;
        const unidad = materiaPrima ? (materiaPrima.unidad || "ud") : "";
        return `<li>${nombre}: ${cantidad} ${unidad}</li>`;
      })
      .join("");

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-ranking";
    tarjeta.innerHTML = `
      <div class="ranking-header">
        <span class="ranking-position">${posicion}°</span>
        <div>
          <h3>${producto.nombre}</h3>
          <p class="ranking-total">Total producidas: ${producto.cantidadTotal}</p>
        </div>
      </div>
      <div class="ranking-body">
        <p class="ranking-subtitle">Materia prima total consumida</p>
        <ul>${filasInsumos}</ul>
      </div>
    `;
    contenedorRanking.appendChild(tarjeta);
  });
};

if (inputBuscarHistorial) {
  inputBuscarHistorial.addEventListener("input", () => {
    const query = inputBuscarHistorial.value.trim().toLowerCase();

    if (!query) {
      renderHistorial(historialProcesos);
      return;
    }

    const resultados = historialProcesos.filter(p => {
      const texto = [
        p.codigo,
        p.fecha,
        p.responsable,
        Array.isArray(p.items) ? p.items.map(i => `${i.nombreProducto} ${i.cantidadFabricada}`).join(" ") : ""
      ].join(" ").toLowerCase();

      return texto.includes(query);
    });

    renderHistorial(resultados, true);
  });
}

(async () => {
  await cargarProductos();
  await cargarHistorial();
  await actualizarRankingTop5();
})();