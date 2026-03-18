const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Document = require('../models/Document');
const { authenticateToken, agentScopeId } = require('../auth');
const IMAGE_MIMETYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/bmp', 'image/tiff', 'image/avif',
]);

function buildProxyUrl(req, bucket, key) {
  const host = req.get('X-Forwarded-Host') || req.get('Host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = req.get('X-Forwarded-Proto') || (isLocal ? 'http' : 'https');
  return `${proto}://${host}/editor/file?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
}

function enrichDocsWithThumbnails(docs, req) {
  const plain = docs.map(d => (typeof d.toObject === 'function' ? d.toObject() : { ...d }));
  plain.forEach((doc) => {
    if (!doc.object_key || !doc.bucket) return;
    const isImage = doc.tipo === 'Imagen'
      || IMAGE_MIMETYPES.has((doc.mimetype || '').toLowerCase())
      || /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(doc.object_key);
    if (!isImage) return;
    doc.thumbnailUrl = buildProxyUrl(req, doc.bucket, doc.object_key);
  });
  return plain;
}

// --------------- FOLDERS ---------------

// List folders (optionally filter by parent)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const parent = req.query.parent || null;
    const filter = { parent: parent || null };
    if (scopeId) filter.agenteId = scopeId;
    const folders = await Folder.find(filter).sort({ name: 1 }).exec();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create folder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { name, parent, color } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });
    if (parent) {
      const parentFolder = await Folder.findById(parent).exec();
      if (!parentFolder) return res.status(404).json({ error: 'Parent folder not found' });
      if (scopeId && String(parentFolder.agenteId || '') !== scopeId) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }
    const folder = new Folder({
      name: String(name).trim(),
      parent: parent || null,
      agenteId: scopeId || '',
      color: color || '',
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename folder
router.patch('/:id/rename', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folder = await Folder.findById(req.params.id).exec();
    if (!folder) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(folder.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });
    folder.name = String(name).trim();
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move folder
router.patch('/:id/move', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folder = await Folder.findById(req.params.id).exec();
    if (!folder) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(folder.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const { parent } = req.body;
    // prevent moving folder into itself
    if (parent && String(parent) === String(folder._id)) {
      return res.status(400).json({ error: 'Cannot move folder into itself' });
    }
    folder.parent = parent || null;
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle star folder
router.patch('/:id/star', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folder = await Folder.findById(req.params.id).exec();
    if (!folder) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(folder.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    folder.starred = !folder.starred;
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete folder (recursive)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folder = await Folder.findById(req.params.id).exec();
    if (!folder) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(folder.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });

    // Recursively collect folder IDs
    const idsToDelete = [folder._id];
    const collectChildren = async (parentId) => {
      const children = await Folder.find({ parent: parentId }).exec();
      for (const child of children) {
        idsToDelete.push(child._id);
        await collectChildren(child._id);
      }
    };
    await collectChildren(folder._id);

    // Move documents in those folders to root
    await Document.updateMany({ folder: { $in: idsToDelete } }, { $set: { folder: null } });
    await Folder.deleteMany({ _id: { $in: idsToDelete } });

    res.json({ deletedIds: idsToDelete });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get breadcrumb path for a folder
router.get('/:id/path', authenticateToken, async (req, res) => {
  try {
    const path = [];
    let current = await Folder.findById(req.params.id).exec();
    while (current) {
      path.unshift({ _id: current._id, name: current.name });
      current = current.parent ? await Folder.findById(current.parent).exec() : null;
    }
    res.json(path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------- DOCUMENT EXTENSIONS ---------------

// Rename document
router.patch('/documents/:id/rename', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const doc = await Document.findById(req.params.id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const { nombre } = req.body;
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ error: 'nombre is required' });
    doc.nombre = String(nombre).trim();
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move document to folder
router.patch('/documents/:id/move', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const doc = await Document.findById(req.params.id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const { folder } = req.body;
    if (folder) {
      const target = await Folder.findById(folder).exec();
      if (!target) return res.status(404).json({ error: 'Target folder not found' });
    }
    doc.folder = folder || null;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle star document
router.patch('/documents/:id/star', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const doc = await Document.findById(req.params.id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    doc.starred = !doc.starred;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Browse: list folders + documents inside a folder
router.get('/browse', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const parent = req.query.folder || null;
    const q = req.query.q || '';

    const folderFilter = { parent: parent || null };
    const docFilter = { folder: parent || null };
    if (scopeId) {
      folderFilter.agenteId = scopeId;
      docFilter.agenteId = scopeId;
    }
    if (q) {
      docFilter.nombre = new RegExp(q, 'i');
    }

    const [folders, rawDocs] = await Promise.all([
      Folder.find(folderFilter).sort({ name: 1 }).exec(),
      Document.find(docFilter).sort({ fecha: -1 }).limit(500).exec(),
    ]);
    const documents = enrichDocsWithThumbnails(rawDocs, req);

    res.json({ folders, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search across all folders
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const q = req.query.q || '';
    if (!q) return res.json({ folders: [], documents: [] });

    const folderFilter = { name: new RegExp(q, 'i') };
    const docFilter = { nombre: new RegExp(q, 'i') };
    if (scopeId) {
      folderFilter.agenteId = scopeId;
      docFilter.agenteId = scopeId;
    }

    const [folders, rawDocs] = await Promise.all([
      Folder.find(folderFilter).sort({ name: 1 }).limit(50).exec(),
      Document.find(docFilter).sort({ fecha: -1 }).limit(200).exec(),
    ]);
    const documents = enrichDocsWithThumbnails(rawDocs, req);

    res.json({ folders, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Starred items
router.get('/starred', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folderFilter = { starred: true };
    const docFilter = { starred: true };
    if (scopeId) {
      folderFilter.agenteId = scopeId;
      docFilter.agenteId = scopeId;
    }

    const [folders, rawDocs] = await Promise.all([
      Folder.find(folderFilter).sort({ name: 1 }).exec(),
      Document.find(docFilter).sort({ fecha: -1 }).exec(),
    ]);
    const documents = enrichDocsWithThumbnails(rawDocs, req);

    res.json({ folders, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent documents
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    const rawDocs = await Document.find(filter).sort({ fecha: -1 }).limit(30).exec();
    const docs = enrichDocsWithThumbnails(rawDocs, req);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storage stats
router.get('/storage', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;

    const docs = await Document.find(filter, 'tamano tipo mimetype').exec();
    let totalMB = 0;
    const byType = {};
    for (const d of docs) {
      const size = d.tamano || 0;
      totalMB += size;
      const key = d.tipo || 'Otro';
      byType[key] = (byType[key] || 0) + size;
    }

    res.json({
      totalFiles: docs.length,
      totalMB: Math.round(totalMB * 100) / 100,
      byType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
