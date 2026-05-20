/**
 * RBAC Middleware centralizado.
 *
 * Extiende el sistema JWT existente SIN romperlo.
 * JWT payload existente: { sub, username, role, agenteId }
 * Rol de marketing nuevo: User.metadata.marketingRole → incluido en JWT como 'marketingRole'
 *
 * Los roles de marketing son ADITIVOS — no reemplazan rol existente.
 */

// ── Permisos por rol de marketing ─────────────────────────────────────────────

const MARKETING_PERMISSIONS = {
  MARKETING_ADMIN: ['marketing:read', 'marketing:write', 'marketing:admin', 'crm:read'],
  MEDIA_BUYER:     ['marketing:read', 'marketing:write', 'crm:read'],
  ANALYST:         ['marketing:read', 'crm:read'],
  VIEWER:          ['marketing:read'],
};

// ── Permisos base por rol del sistema ─────────────────────────────────────────

const ROLE_BASE_PERMISSIONS = {
  admin: [
    'marketing:read', 'marketing:write', 'marketing:admin',
    'crm:read', 'crm:write',
    'admin:all',
  ],
  agent: [
    'crm:read', 'crm:write',
    'marketing:read',
  ],
  user: [],
};

/**
 * Resuelve los permisos efectivos combinando rol base + marketingRole opcional.
 * Compatible con JWT payload existente.
 */
function resolvePermissions(jwtPayload) {
  if (!jwtPayload) return [];

  const base = ROLE_BASE_PERMISSIONS[jwtPayload.role] || [];
  const mktPerms = MARKETING_PERMISSIONS[jwtPayload.marketingRole] || [];

  return [...new Set([...base, ...mktPerms])];
}

/**
 * Middleware factory — requiere uno o más permisos.
 *
 * Uso:
 *   router.post('/campaigns', requirePermission('marketing:write'), handler)
 *   router.get('/metrics',    requirePermission('marketing:read'),  handler)
 */
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = resolvePermissions(req.user);
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermissions,
        role: req.user.role,
        marketingRole: req.user.marketingRole || null,
      });
    }

    // Adjuntar permisos al request para uso posterior (toolRegistry, etc.)
    req.permissions = userPermissions;
    next();
  };
}

/**
 * Scoping de agente centralizado.
 * Devuelve agenteId si el usuario es un agente, null si es admin.
 *
 * Reemplaza agentScopeId() duplicado en múltiples rutas existentes.
 * Compatible con la función agentScopeId() de auth.js — misma lógica.
 */
function agentScope(req) {
  if (req.user && req.user.role === 'agent') {
    return req.user.agenteId || null;
  }
  return null; // admin ve todo sin scoping
}

/**
 * Middleware que verifica si el usuario es admin.
 * Misma lógica que requireAdmin() duplicado en routes/globalConfig.js.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = {
  requirePermission,
  resolvePermissions,
  agentScope,
  requireAdmin,
  MARKETING_PERMISSIONS,
  ROLE_BASE_PERMISSIONS,
};
