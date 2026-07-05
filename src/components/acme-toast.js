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
    window.showToast = (message, type = 'success') => {
      const container = this.shadowRoot.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.addEventListener('transitionend', () => {
          toast.remove();
        });
      }, 3000);
    };
  }
}

customElements.define('acme-toast', AcmeToast);
