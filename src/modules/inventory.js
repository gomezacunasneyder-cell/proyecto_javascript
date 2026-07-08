let listaProductosLocal = [];
let esEdicion = false;

const cuerpoTabla = document.getElementById('cuerpoTablaInventario');
const buscador = document.getElementById('buscadorProducto');
const formProducto = document.getElementById('formProducto');
const selectTipo = document.getElementById('prodTipo');
const contenedorProveedor = document.getElementById('contenedorProveedor');
const seccionFormula = document.getElementById('seccionFormula');
const btnAgregarInsumo = document.getElementById('btnAgregarInsumo');
const listaInsumosFormula = document.getElementById('listaInsumosFormula');
const btnGuardarProducto = document.getElementById('btnGuardarProducto');

document.addEventListener('DOMContentLoaded', () => {
  cargarInventarioDesdeFirebase();
  configurarComportamientoTipo();
  configurarBotonesStock();
});

async function cargarInventarioDesdeFirebase() {
  try {
    const data = await window.dataManager.getProductos();
    listaProductosLocal = data ? Object.values(data) : [];
    renderizarTabla(listaProductosLocal);
  } catch (error) {
    console.error("Error al leer datos de Firebase:", error);
  }
}

function renderizarTabla(productos) {
  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = '';
  if (productos.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="5">No se encontraron productos</td></tr>`;
    return;
  }

  productos.forEach(prod => {
    if (!prod || !prod.codigo) return;
    const fila = document.createElement('tr');
    const unidad = prod.unidad || 'ud';
    fila.innerHTML = `
      <td><strong>${prod.codigo}</strong></td>
      <td>${prod.nombre || 'Sin nombre'}</td>
      <td>${prod.proveedor || 'Interno'} <br><small>(${prod.tipo || 'Materia Prima'})</small></td>
      <td><span class="badge-stock">${prod.stock ?? 0} ${unidad}</span></td>
      <td class="celda-acciones">
        <acme-button button-id="btn-editar-${prod.codigo}" variant="secondary" class="btn-editar-producto" data-codigo="${prod.codigo}">Editar</acme-button>
        <acme-button button-id="btn-eliminar-${prod.codigo}" variant="secondary" class="btn-eliminar-producto" data-codigo="${prod.codigo}">Eliminar</acme-button>
      </td>
    `;
    cuerpoTabla.appendChild(fila);
  });

  // Event Listeners para Editar
  document.querySelectorAll('.btn-editar-producto').forEach(btn => {
    btn.addEventListener('click', () => {
      const codigo = btn.dataset.codigo;
      cargarParaEditar(codigo);
    });
  });

  // Event Listeners para Eliminar
  document.querySelectorAll('.btn-eliminar-producto').forEach(btn => {
    btn.addEventListener('click', () => {
      const codigo = btn.dataset.codigo;
      eliminarProducto(codigo);
    });
  });
}

function cargarParaEditar(codigo) {
  const prod = listaProductosLocal.find(p => p.codigo === codigo);
  if (!prod) return;

  esEdicion = true;
  document.getElementById('prodCodigo').value = prod.codigo;
  document.getElementById('prodCodigo').disabled = true;
  document.getElementById('prodNombre').value = prod.nombre;
  selectTipo.value = prod.tipo;
  document.getElementById('prodUnidad').value = prod.unidad;
  document.getElementById('prodStock').value = prod.stock || 0;

  // Cambiar comportamiento segun tipo
  if (prod.tipo === 'Producto Terminado') {
    contenedorProveedor.style.display = 'none';
    seccionFormula.style.display = 'block';
    listaInsumosFormula.innerHTML = '';
    
    if (prod.formula && prod.formula.length > 0) {
      prod.formula.forEach(insumo => {
        agregarFilaInsumoConDatos(insumo.codigoMP, insumo.cantidad, insumo.unidad);
      });
    }
  } else {
    contenedorProveedor.style.display = 'block';
    seccionFormula.style.display = 'none';
    listaInsumosFormula.innerHTML = '';
    document.getElementById('prodProveedor').value = prod.proveedor || '';
  }

  if (btnGuardarProducto) {
    btnGuardarProducto.textContent = "Actualizar Producto";
  }
  window.showToast("Producto cargado para edición", "success");
}

function agregarFilaInsumoConDatos(codigoMP, cantidad, unidad) {
  const materiasPrimas = listaProductosLocal.filter(p => p.tipo === "Materia Prima");
  const divFila = document.createElement('div');
  divFila.className = 'fila-insumo-dinamica';
  
  const opcionesSelect = `
    <option value="" disabled>Seleccione insumo...</option>
    ${materiasPrimas.map(mp => 
      `<option value="${mp.codigo}" data-unidad="${mp.unidad || 'g'}" ${mp.codigo === codigoMP ? 'selected' : ''}>${mp.nombre} (${mp.codigo})</option>`
    ).join('')}
  `;

  divFila.innerHTML = `
    <select class="receta-mp-codigo" required>${opcionesSelect}</select>
    <input type="number" class="receta-mp-cantidad" placeholder="Cant" min="0.01" step="any" value="${cantidad}" required>
    <input type="text" class="receta-mp-unidad" placeholder="Unidad" value="${unidad}" readonly required>
    <acme-button variant="secondary" class="btn-quitar" onclick="this.parentElement.remove()">X</acme-button>
  `;

  const selectElement = divFila.querySelector('.receta-mp-codigo');
  const inputUnidad = divFila.querySelector('.receta-mp-unidad');

  selectElement.addEventListener('change', () => {
    const opcionSeleccionada = selectElement.options[selectElement.selectedIndex];
    if (opcionSeleccionada) {
      inputUnidad.value = opcionSeleccionada.getAttribute('data-unidad');
    }
  });

  listaInsumosFormula.appendChild(divFila);
}

async function eliminarProducto(codigo) {
  const producto = listaProductosLocal.find(p => p.codigo === codigo);
  const nombre = producto ? producto.nombre : codigo;

  const confirmar = confirm(`¿Seguro que deseas eliminar "${nombre}" (${codigo}) del inventario? Esta acción no se puede deshacer.`);
  if (!confirmar) return;

  try {
    await window.dataManager.eliminarProducto(codigo);
    window.showToast(`🗑️ Producto "${nombre}" eliminado correctamente.`, "success");
    cargarInventarioDesdeFirebase();
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    window.showToast("No se pudo conectar con el servidor.", "error");
  }
}

if (buscador) {
  buscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = listaProductosLocal.filter(p => {
      if (!p || !p.codigo || !p.nombre) return false;
      return p.codigo.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto);
    });
    renderizarTabla(filtrados);
  });
}

function configurarComportamientoTipo() {
  if (!selectTipo) return;
  selectTipo.addEventListener('change', () => {
    if (selectTipo.value === 'Producto Terminado') {
      contenedorProveedor.style.display = 'none';
      seccionFormula.style.display = 'block';
      listaInsumosFormula.innerHTML = '';
      agregarFilaInsumo();
    } else {
      contenedorProveedor.style.display = 'block';
      seccionFormula.style.display = 'none';
      listaInsumosFormula.innerHTML = '';
    }
  });
  if (btnAgregarInsumo) {
    btnAgregarInsumo.addEventListener('click', agregarFilaInsumo);
  }
}

function agregarFilaInsumo() {
  const materiasPrimas = listaProductosLocal.filter(p => p.tipo === "Materia Prima");

  if (materiasPrimas.length === 0) {
    window.showToast("⚠️ Primero debes registrar al menos una Materia Prima.", "error");
    selectTipo.value = "Materia Prima";
    contenedorProveedor.style.display = 'block';
    seccionFormula.style.display = 'none';
    return;
  }

  const divFila = document.createElement('div');
  divFila.className = 'fila-insumo-dinamica';
  
  const opcionesSelect = `
    <option value="" disabled selected>Seleccione insumo...</option>
    ${materiasPrimas.map(mp => 
      `<option value="${mp.codigo}" data-unidad="${mp.unidad || 'g'}">${mp.nombre} (${mp.codigo})</option>`
    ).join('')}
  `;

  divFila.innerHTML = `
    <select class="receta-mp-codigo" required>${opcionesSelect}</select>
    <input type="number" class="receta-mp-cantidad" placeholder="Cant" min="0.01" step="any" required>
    <input type="text" class="receta-mp-unidad" placeholder="Unidad" readonly required>
    <acme-button variant="secondary" class="btn-quitar" onclick="this.parentElement.remove()">X</acme-button>
  `;

  const selectElement = divFila.querySelector('.receta-mp-codigo');
  const inputUnidad = divFila.querySelector('.receta-mp-unidad');

  selectElement.addEventListener('change', () => {
    const opcionSeleccionada = selectElement.options[selectElement.selectedIndex];
    if (opcionSeleccionada) {
      inputUnidad.value = opcionSeleccionada.getAttribute('data-unidad');
    }
  });

  listaInsumosFormula.appendChild(divFila);
}

function configurarBotonesStock() {
  const btnSumar = document.getElementById('btnSumarStock');
  const btnRestar = document.getElementById('btnRestarStock');
  if (btnSumar) btnSumar.addEventListener('click', () => handleStockButton('sumar'));
  if (btnRestar) btnRestar.addEventListener('click', () => handleStockButton('restar'));
}

async function modificarStockExistente(operacion) {
  const codigo = document.getElementById('prodCodigo').value.trim().toUpperCase();
  const stockIngresado = parseFloat(document.getElementById('prodStock').value);

  if (!codigo) return window.showToast("⚠️ Ingresa el Código del Producto.", "error");
  if (!Number.isFinite(stockIngresado) || stockIngresado <= 0) return window.showToast("⚠️ Ingresa una cantidad mayor a 0.", "error");

  const productoExistente = listaProductosLocal.find(p => p && p.codigo === codigo);
  if (!productoExistente) return window.showToast(`❌ El producto "${codigo}" no existe.`, "error");

  let nuevoStock = productoExistente.stock ?? 0;
  nuevoStock = operacion === 'sumar' ? nuevoStock + stockIngresado : nuevoStock - stockIngresado;

  if (nuevoStock < 0) return window.showToast(`⚠️ Stock insuficiente. Actual: ${productoExistente.stock}`, "error");

  try {
    await window.dataManager.patchProducto(codigo, { stock: nuevoStock });
    window.showToast(`Stock actualizado. Nuevo total: ${nuevoStock}`, "success");
    limpiarFormulario();
    cargarInventarioDesdeFirebase();
  } catch (error) {
    console.error("Error al conectar con Firebase:", error);
  }
}

function handleStockButton(operacion) {
  // Si existe un código y el producto está en la lista, ejecutar la modificación remota
  const codigo = document.getElementById('prodCodigo').value.trim().toUpperCase();
  const stockIngresado = parseFloat(document.getElementById('prodStock').value);

  const productoExistente = listaProductosLocal.find(p => p && p.codigo === codigo);
  if (codigo && productoExistente) {
    // usar la ruta que parchea Firebase
    modificarStockExistente(operacion);
    return;
  }

  // Si no hay producto existente, ajustar el input localmente
  const inputStock = document.getElementById('prodStock');
  if (!inputStock) return;

  // Determinar paso (step) si existe, sino usar 1
  let step = 1;
  try {
    const stepAttr = inputStock.getAttribute('step');
    if (stepAttr && stepAttr !== 'any') step = parseFloat(stepAttr) || 1;
  } catch (e) { /* ignore */ }

  const current = Number(inputStock.value) || 0;
  let next = operacion === 'sumar' ? current + step : current - step;
  if (next < 0) next = 0;

  // Si step es entero, mostrar entero; si no, mantener decimales del step
  if (Number.isInteger(step)) inputStock.value = String(Math.round(next));
  else inputStock.value = String(Number(next.toFixed(6)).toString());
}

if (formProducto) {
  formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const codigo = document.getElementById('prodCodigo').value.trim().toUpperCase();
    const nombre = document.getElementById('prodNombre').value.trim();
    const tipo = selectTipo.value;
    const unidad = document.getElementById('prodUnidad').value;
    const stockIngresado = parseFloat(document.getElementById('prodStock').value);

    if (!Number.isFinite(stockIngresado) || stockIngresado < 0) {
      return window.showToast("⚠️ El stock no puede ser negativo.", "error");
    }

    const productoExistente = listaProductosLocal.find(p => p && p.codigo === codigo);
    if (productoExistente && !esEdicion) {
      return window.showToast(`💡 El producto ${codigo} ya existe. Usa los botones (+) / (-) para ajustar stock.`, "error");
    }

    try {
      let nuevoProducto = { codigo, nombre, tipo, unidad, stock: stockIngresado };

      if (tipo === 'Producto Terminado') {
        nuevoProducto.proveedor = "Planta Macondo (Interno)";
        const filas = document.querySelectorAll('.fila-insumo-dinamica');
        let formula = [];
        let codigosVistos = new Set();
        let errorDuplicados = false;

        filas.forEach(f => {
          const codigoMP = f.querySelector('.receta-mp-codigo').value;
          const cantidad = parseFloat(f.querySelector('.receta-mp-cantidad').value);
          const unidadMP = f.querySelector('.receta-mp-unidad').value;

          if (!codigoMP) return;

          if (codigosVistos.has(codigoMP)) {
            errorDuplicados = true;
            return;
          }
          codigosVistos.add(codigoMP);

          formula.push({
            codigoMP: codigoMP,
            cantidad: cantidad,
            unidad: unidadMP
          });
        });

        if (errorDuplicados) {
          return window.showToast("⚠️ Tienes insumos repetidos en la fórmula.", "error");
        }

        if (formula.length === 0) return window.showToast("Agrega al menos un insumo a la fórmula.", "error");
        nuevoProducto.formula = formula;
      } else {
        nuevoProducto.proveedor = document.getElementById('prodProveedor').value.trim() || "Proveedor Externo";
        nuevoProducto.formula = null;
      }

      await window.dataManager.guardarProducto(codigo, nuevoProducto);
      window.showToast(esEdicion ? "✅ Producto actualizado correctamente." : "✅ Producto registrado exitosamente.", "success");
      limpiarFormulario();
      await cargarInventarioDesdeFirebase();
    } catch (error) {
      console.error("Error en la comunicación con el servidor:", error);
    }
  });
}

function limpiarFormulario() {
  esEdicion = false;
  document.getElementById('prodCodigo').disabled = false;
  if (formProducto) formProducto.reset();
  if (contenedorProveedor) contenedorProveedor.style.display = 'block';
  if (seccionFormula) seccionFormula.style.display = 'none';
  if (listaInsumosFormula) listaInsumosFormula.innerHTML = '';
  if (btnGuardarProducto) {
    btnGuardarProducto.textContent = "Registrar Producto Nuevo";
  }
}
