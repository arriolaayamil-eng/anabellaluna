import React from 'react';
import { toast } from 'react-toastify';

/**
 * Shows a confirmation toast with Confirmar/Cancelar buttons.
 * Returns a Promise<boolean> that resolves true if confirmed, false if cancelled.
 */
export const confirmToast = (message) => new Promise((resolve) => {
  toast(
    ({ closeToast }) => (
      <div>
        <p style={{ marginBottom: 12, fontWeight: 500 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => { closeToast(); resolve(false); }}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { closeToast(); resolve(true); }}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      position: 'top-center',
      onClose: () => resolve(false),
    },
  );
});
