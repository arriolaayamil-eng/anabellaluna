import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCamera, FaSave, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { authService } from '../services/authService';
import { crmService } from '../services/crmService';
import defaultAvatar from '../data/avatar.png';

const MiPerfil = () => {
  const { currentColor } = useStateContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    bio: '',
    direccion: '',
    especialidad: '',
    redesSociales: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Refresh user data from server to ensure we have the latest
      const freshUser = await authService.refreshUserData();
      const currentUser = freshUser || authService.getCurrentUser();
      
      if (currentUser) {
        setFormData({
          nombre: currentUser.nombre || currentUser.username || '',
          email: currentUser.email || '',
          telefono: currentUser.telefono || '',
          cargo: currentUser.cargo || 'Agente Inmobiliario',
          bio: currentUser.bio || '',
          direccion: currentUser.direccion || '',
          especialidad: currentUser.especialidad || '',
          redesSociales: currentUser.redesSociales || {
            linkedin: '',
            instagram: '',
            facebook: '',
          },
        });
        if (currentUser.avatar) {
          setPreviewImage(currentUser.avatar);
        }
      }
    } catch (e) {
      setError('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('redes.')) {
      const redName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        redesSociales: {
          ...prev.redesSociales,
          [redName]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentUser = authService.getCurrentUser();
      const agentId = currentUser?.agenteId;
      
      if (!agentId) {
        throw new Error('ID de agente no encontrado. Por favor, cierre sesión e ingrese nuevamente.');
      }

      const updateData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        cargo: formData.cargo,
        bio: formData.bio,
        direccion: formData.direccion,
        especialidad: formData.especialidad,
        redesSociales: formData.redesSociales,
      };

      // Handle avatar - convert to base64 if new file selected
      if (selectedFile) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(selectedFile);
        });
        updateData.avatar = base64;
      }

      // Update on server
      await crmService.agentes.update(agentId, updateData);

      // Refresh user data from server to ensure localStorage is in sync
      await authService.refreshUserData();

      // Check milestones (non-blocking)
      crmService.rewards.checkMilestones('profile').catch(() => {});

      setSelectedFile(null);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.message || 'Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentColor }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-xl transition-colors ${currentMode === 'Dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h2 className={`text-lg font-semibold ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>Mi Perfil</h2>
          <p className={`text-sm ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Configuración personal</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={previewImage || defaultAvatar}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor: currentColor }}
            />
            <button
              type="button"
              onClick={handleImageClick}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <FaCamera className="text-white text-2xl" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Haz clic para cambiar la foto
          </p>
          <h2 className="mt-2 text-2xl font-bold dark:text-gray-100">
            {formData.nombre || 'Mi Perfil'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{formData.cargo}</p>
        </div>

        {/* Información Personal */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
            <FaUser style={{ color: currentColor }} /> Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Cargo
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Ej: Agente Senior"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Especialidad
              </label>
              <select
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Seleccionar especialidad</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Terrenos">Terrenos</option>
                <option value="Lujo">Propiedades de Lujo</option>
                <option value="Alquileres">Alquileres</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Tu dirección"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Una breve descripción sobre ti..."
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
            <FaEnvelope style={{ color: currentColor }} /> Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
            <FaPhone style={{ color: currentColor }} /> Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                LinkedIn
              </label>
              <input
                type="url"
                name="redes.linkedin"
                value={formData.redesSociales?.linkedin || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Instagram
              </label>
              <input
                type="url"
                name="redes.instagram"
                value={formData.redesSociales?.instagram || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Facebook
              </label>
              <input
                type="url"
                name="redes.facebook"
                value={formData.redesSociales?.facebook || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: currentColor }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <FaSave /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MiPerfil;
