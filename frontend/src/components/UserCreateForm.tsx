import React, { useState } from 'react';
import { userService } from '../services/userService';
import type { RegisterPayload } from '../services/userService';

export default function UserCreateForm() {
  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    password: '',
    role: 'agent',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await userService.register(form);
      setMessage('✅ Usuario de CRM creado con éxito');
      setForm({ username: '', password: '', role: 'agent' });
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Crear Usuario de CRM</h2>
      <p className="text-muted mb-3" style={{ fontSize: 14 }}>Este usuario podrá loggearse en el panel CRM (admin).</p>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password (mínimo 6 caracteres)</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Rol</label>
          <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%', padding: 8 }}>
            <option value="agent">Agente</option>
            <option value="admin">Admin</option>
            <option value="user">Usuario</option>
          </select>
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px', width: '100%' }}>
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </form>
      {message && <div style={{ marginTop: 12, fontSize: 14 }}>{message}</div>}
    </div>
  );
}
