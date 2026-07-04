// Configuración de la URL de Firebase (Ajusta con tu link real de Realtime Database)
const FIREBASE_URL = "https://stock-flow-74480-default-rtdb.firebaseio.com/";

let listaProductosLocal = [];

// --- Elementos del DOM ---
const cuerpoTabla = document.getElementById('cuerpoTablaInventario');
const buscador = document.getElementById('buscadorProducto');
const formProducto = document.getElementById('formProducto');
const selectTipo = document.getElementById('prodTipo');
const contenedorProveedor = document.getElementById('contenedorProveedor');
const seccionFormula = document.getElementById('seccionFormula');
const btnAgregarInsumo = document.getElementById('btnAgregarInsumo');
const listaInsumosFormula = document.getElementById('listaInsumosFormula');

// --- Carga Inicial ---
document.addEventListener('DOMContentLoaded', () => {
    cargarInventarioDesdeFirebase();
    configurarComportamientoTipo();
});

// --- Obtener datos desde Firebase ---
async function cargarInventarioDesdeFirebase() {
    try {
        const response = await fetch(`${FIREBASE_URL}.json`);
        const data = await response.json();
        
        // Convertir objeto indexado de Firebase a un Array para manipularlo fácil
        listaProductosLocal = data ? Object.values(data) : [];
        
        renderizarTabla(listaProductosLocal);
    } catch (error) {
        console.error("Error al leer datos de Firebase:", error);
    }
}

// --- Renderizar la Tabla de Productos ---
function renderizarTabla(productos) {
    cuerpoTabla.innerHTML = '';
    
    if (productos.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="4" style="text-align:center;">No se encontraron productos</td></tr>`;
        return;
    }

    productos.forEach(prod => {
        // Si por algún motivo algún nodo en Firebase quedó vacío o mal estructurado, lo saltamos para evitar errores
        if (!prod || !prod.codigo) return;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${prod.codigo}</strong></td>
            <td>${prod.nombre || 'Sin nombre'}</td>
            <td>
                ${prod.proveedor || 'Interno'} 
                <br><small style="color: #777; font-weight: bold;">(${prod.tipo || 'Materia Prima'})</small>
            </td>
            <td><span class="badge-stock">${prod.stock ?? 0}</span></td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

// --- Buscador / Filtro en tiempo real ---
buscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = listaProductosLocal.filter(p => 
        p.codigo.toLowerCase().includes(texto) || 
        p.nombre.toLowerCase().includes(texto)
    );
    renderizarTabla(filtrados);
});

// --- Mostrar/Ocultar campos según el Tipo de Producto ---
function configurarComportamientoTipo() {
    selectTipo.addEventListener('change', () => {
        if (selectTipo.value === 'Producto Terminado') {
            contenedorProveedor.style.display = 'none';
            seccionFormula.style.display = 'block';
            listaInsumosFormula.innerHTML = ''; // Limpiar
            agregarFilaInsumo(); // Poner la primera fila vacía
        } else {
            contenedorProveedor.style.display = 'block';
            seccionFormula.style.display = 'none';
            listaInsumosFormula.innerHTML = '';
        }
    });

    btnAgregarInsumo.addEventListener('click', agregarFilaInsumo);
}

// --- Agregar filas dinámicas para la receta ---
function agregarFilaInsumo() {
    // Filtrar solo las materias primas registradas para que sean las opciones del select
    const materiasPrimas = listaProductosLocal.filter(p => p.tipo === "Materia Prima");
    
    if (materiasPrimas.length === 0) {
        alert(" ATENCIÓN: Primero debes registrar al menos una Materia Prima antes de crear una receta para un Producto Terminado.");
        selectTipo.value = "Materia Prima";
        contenedorProveedor.style.display = 'block';
        seccionFormula.style.display = 'none';
        return;
    }

    const divFila = document.createElement('div');
    divFila.className = 'fila-insumo-dinamica';
    divFila.style.display = 'flex';
    divFila.style.gap = '10px';
    divFila.style.marginBottom = '10px';
    
    const opcionesSelect = materiasPrimas.map(mp => 
        `<option value="${mp.codigo}">${mp.nombre} (${mp.codigo})</option>`
    ).join('');

    divFila.innerHTML = `
        <select class="receta-mp-codigo" style="flex: 2;" required>
            ${opcionesSelect}
        </select>
        <input type="number" class="receta-mp-cantidad" placeholder="Cant" min="1" style="flex: 1;" required>
        <input type="text" class="receta-mp-unidad" placeholder="g, ud, ml" style="flex: 1;" required>
        <button type="button" class="btn-quitar" onclick="this.parentElement.remove()" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">X</button>
    `;
    
    listaInsumosFormula.appendChild(divFila);
}

// --- Guardar Producto en Firebase ---
formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const codigo = document.getElementById('prodCodigo').value.trim().toUpperCase();
    const nombre = document.getElementById('prodNombre').value.trim();
    const tipo = selectTipo.value;
    
    // Validación de duplicados local antes de hacer la petición
    if (listaProductosLocal.some(p => p.codigo === codigo)) {
        alert(" Error: Ese código de producto ya existe.");
        return;
    }

    let nuevoProducto = {
        codigo,
        nombre,
        tipo,
        stock: 0 // Inicia en 0 hasta que se ingrese stock o se produzca
    };

    if (tipo === 'Producto Terminado') {
        nuevoProducto.proveedor = "Planta Macondo (Interno)";
        
        // Recopilar todos los insumos agregados en el bloque de la receta
        const filas = document.querySelectorAll('.fila-insumo-dinamica');
        let formula = [];
        
        filas.forEach(f => {
            formula.push({
                codigoMP: f.querySelector('.receta-mp-codigo').value,
                cantidad: parseFloat(f.querySelector('.receta-mp-cantidad').value),
                unidad: f.querySelector('.receta-mp-unidad').value.trim()
            });
        });

        if (formula.length === 0) {
            alert("Por favor, agrega al menos un insumo a la fórmula.");
            return;
        }
        
        nuevoProducto.formula = formula;
    } else {
        nuevoProducto.proveedor = document.getElementById('prodProveedor').value.trim() || "Proveedor Externo";
        nuevoProducto.formula = null;
    }

    // Guardar usando el método PUT para que el ID del nodo sea el propio código
    try {
        const response = await fetch(`${FIREBASE_URL}/${codigo}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProducto)
        });

        if (response.ok) {
            alert("✅ Producto e inventario guardados exitosamente.");
            formProducto.reset();
            contenedorProveedor.style.display = 'block';
            seccionFormula.style.display = 'none';
            listaInsumosFormula.innerHTML = '';
            
            // Recargar tabla desde la base de datos actualizada
            cargarInventarioDesdeFirebase();
        } else {
            alert("Hubo un problema al guardar en Firebase.");
        }
    } catch (error) {
        console.error("Error en la conexión con el servidor:", error);
    }
});