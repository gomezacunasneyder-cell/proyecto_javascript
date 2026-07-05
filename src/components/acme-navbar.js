class AcmeNavbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const activePage = this.getAttribute('active-page') || '';
    
    this.shadowRoot.innerHTML = `
      <style>
        .barra-navegacion {
          background-color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .logo h1 {
          font-size: 1.5rem;
          margin: 0;
          color: #334155;
        }
        .logo h1 span { color: #93c5fd; }
        .enlaces-nav { display: flex; list-style: none; gap: 1.5rem; margin: 0; padding: 0; }
        .enlaces-nav a { 
          text-decoration: none; 
          padding: 0.5rem 1rem; 
          border-radius: 6px; 
          transition: 0.2s;
          color: #334155;
          font-weight: 500;
        }
        .enlaces-nav a:hover, .enlaces-nav a.activo { background-color: #dbeafe; }
        .barra-sesion {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        #usuarioActivo {
          font-size: 0.9rem;
          font-weight: 500;
          color: #64748b;
        }
        button {
          background-color: #f1f5f9;
          border: none; 
          padding: 0.7rem 1.2rem; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 500; 
          transition: 0.2s;
          color: #334155;
        }
        button:hover { background-color: #e2e8f0; }
      </style>
      <header class="barra-navegacion">
        <div class="logo">
          <h1>Acme <span>Producción</span></h1>
        </div>
        <nav>
          <ul class="enlaces-nav">
            <li><a href="usuarios.html" class="${activePage === 'usuarios' ? 'activo' : ''}">Usuarios</a></li>
            <li><a href="inventario.html" class="${activePage === 'inventario' ? 'activo' : ''}">Inventario</a></li>
            <li><a href="produccion.html" class="${activePage === 'produccion' ? 'activo' : ''}">Producción</a></li>
          </ul>
        </nav>
        <div class="barra-sesion">
          <span id="usuarioActivo"></span>
          <button id="btnlogout">Cerrar sesión</button>
        </div>
      </header>
    `;

    this.configurarSesion();
  }

  configurarSesion() {
    const btnLogout = this.shadowRoot.querySelector('#btnlogout');
    const spanUsuario = this.shadowRoot.querySelector('#usuarioActivo');

    const sesionInfo = sessionStorage.getItem("acme_produccion_sesion");
    if (sesionInfo && spanUsuario) {
      const usuario = JSON.parse(sesionInfo);
      spanUsuario.textContent = `Hola, ${usuario.fullName}`;
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem("acme_produccion_sesion");
        window.location.href = "login.html";
      });
    }
  }
}

customElements.define('acme-navbar', AcmeNavbar);
