import React, { useState } from 'react';
import { agenteService } from '../services/agenteService';
import type { AgentePayload, AgenteCreateWithUserResponse } from '../services/agenteService';

interface AgenteCreateModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgenteCreateModal({ show, onClose, onSuccess }: AgenteCreateModalProps) {
  const [form, setForm] = useState<AgentePayload>({
    nombre: '',
    email: '',
    telefono: '',
    username: '',
    password: '',
    role: 'agent',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setCreatedCredentials(null);
    try {
      const resp = await agenteService.create(form) as AgenteCreateWithUserResponse;
      setCreatedCredentials({ username: resp.user.username, password: resp.password });
      setMessage('✅ Agente creado. Guardá estas credenciales (se muestran una sola vez).');
      setForm({ nombre: '', email: '', telefono: '', username: '', password: '', role: 'agent' });
      onSuccess?.();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nuevo Agente</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  name="nombre"
                  type="text"
                  className="form-control"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  name="telefono"
                  type="tel"
                  className="form-control"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input
                  name="username"
                  type="text"
                  className="form-control"
                  value={form.username || ''}
                  onChange={handleChange}
                  placeholder="(opcional)"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="text"
                  className="form-control"
                  value={form.password || ''}
                  onChange={handleChange}
                  placeholder="(opcional: si lo dejás vacío se genera automáticamente)"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Rol</label>
                <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                  <option value="agent">Agente</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuario</option>
                </select>
              </div>
              {message && <div className="alert alert-info">{message}</div>}
              {createdCredentials && (
                <div className="alert alert-warning">
                  <div><strong>Usuario:</strong> {createdCredentials.username}</div>
                  <div><strong>Password:</strong> {createdCredentials.password}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Agente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
