class AcmeButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const type = this.getAttribute('type') || 'button';
    const variant = this.getAttribute('variant') || 'primary';
    const text = this.textContent.trim();

    this.shadowRoot.innerHTML = `
      <style>
        button {
          border: none; 
          padding: 0.7rem 1.2rem; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 500; 
          transition: 0.2s;
          font-family: 'Segoe UI', system-ui, sans-serif;
          width: 100%;
          box-sizing: border-box;
        }
        .primary {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .primary:hover { background-color: #bfdbfe; }
        .secondary {
          background-color: #f1f5f9;
          color: #334155;
        }
        .secondary:hover { background-color: #e2e8f0; }
      </style>
      <button class="${variant}" type="${type}">
        ${text}
      </button>
    `;

    // Si es tipo submit, programamos el envío del formulario contenedor
    if (type === 'submit') {
      this.shadowRoot.querySelector('button').addEventListener('click', (e) => {
        const form = this.closest('form');
        if (form) {
          e.preventDefault();
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      });
    }
  }
}

customElements.define('acme-button', AcmeButton);
