class AcmeToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .container {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .toast {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease forwards;
          transition: opacity 0.3s ease, transform 0.3s ease;
          font-weight: 500;
          font-size: 0.95rem;
          min-width: 250px;
        }
        .success {
          background-color: #10b981;
        }
        .error {
          background-color: #ef4444;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
      <div class="container" id="toastContainer"></div>
    `;

    // Exponer la función globalmente para que cualquier módulo pueda usarla
    // showToast(message, type = 'success', durationMs = 2000)
    window.showToast = (message, type = 'success', durationMs = 2000) => {
      const container = this.shadowRoot.getElementById('toastContainer');
      if (!container) return;

      // Evitar duplicados exactos: si ya hay un toast con el mismo texto, ignorar
      const existing = Array.from(container.children).find(t => t.textContent === message);
      if (existing) return;

      // Limitar número de toasts visibles (ej. 3). Si hay más, quitar el más antiguo.
      const MAX_TOASTS = 3;
      while (container.children.length >= MAX_TOASTS) {
        const oldest = container.children[0];
        if (oldest) oldest.remove();
        else break;
      }

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;

      // inicio visible
      toast.style.opacity = '1';
      container.appendChild(toast);

      // programar ocultado después de durationMs
      const hideAfter = typeof durationMs === 'number' && durationMs > 0 ? durationMs : 2000;
      const doHide = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
      };

      const removalFallback = setTimeout(() => {
        // fallback: asegurarse de quitar el elemento tras la transición
        if (toast.parentNode) toast.remove();
      }, hideAfter + 400);

      // Cuando termine la transición, limpiar el fallback y remover
      const onTransitionEnd = (ev) => {
        if (ev.propertyName === 'opacity') {
          clearTimeout(removalFallback);
          if (toast.parentNode) toast.remove();
        }
      };

      // programar la acción de ocultar
      setTimeout(() => {
        doHide();
      }, hideAfter);

      toast.addEventListener('transitionend', onTransitionEnd);
    };
  }
}

customElements.define('acme-toast', AcmeToast);
