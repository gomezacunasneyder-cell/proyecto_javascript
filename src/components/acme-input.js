class AcmeInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get value() {
    const input = this.shadowRoot.querySelector('input');
    return input ? input.value : '';
  }

  set value(val) {
    const input = this.shadowRoot.querySelector('input');
    if (input) input.value = val;
  }

  get disabled() {
    const input = this.shadowRoot.querySelector('input');
    return input ? input.disabled : false;
  }

  set disabled(val) {
    const input = this.shadowRoot.querySelector('input');
    if (input) input.disabled = val;
  }

  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const id = this.id || 'acme-input-field';
    const placeholder = this.getAttribute('placeholder') || '';
    const required = this.hasAttribute('required') ? 'required' : '';
    const min = this.getAttribute('min') || '';
    const step = this.getAttribute('step') || '';
    const minlength = this.getAttribute('minlength') || '';

    this.shadowRoot.innerHTML = `
      <style>
        .grupo-input { 
          margin-bottom: 1.2rem; 
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        label { 
          display: block; 
          margin-bottom: 0.4rem; 
          font-size: 0.9rem; 
          font-weight: 500; 
          color: #334155;
        }
        input {
          width: 100%;
          padding: 0.85rem 0.95rem;
          border: 1px solid rgba(124,58,237,0.18);
          border-radius: 14px;
          outline: none;
          box-sizing: border-box;
          color: #2b2b3c;
          background: rgba(255,255,255,0.98);
          font-size: 0.95rem;
        }
        input::placeholder {
          color: rgba(94, 76, 137, 0.55);
        }
        input:focus {
          border-color: rgba(139,92,246,0.65);
          box-shadow: 0 0 0 4px rgba(196,181,253,0.18);
        }
        input:disabled {
          background-color: #f7f4ff;
          color: #8f86a8;
          cursor: not-allowed;
        }
      </style>
      <div class="grupo-input">
        <label for="input-${id}">${label}</label>
        <input 
          type="${type}" 
          id="input-${id}" 
          placeholder="${placeholder}" 
          ${required}
          ${min ? `min="${min}"` : ''}
          ${step ? `step="${step}"` : ''}
          ${minlength ? `minlength="${minlength}"` : ''}
        >
      </div>
    `;
  }
}

customElements.define('acme-input', AcmeInput);
