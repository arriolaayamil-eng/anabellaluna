#!/usr/bin/env node
/**
 * One-time migration: create Folder + Document records for existing EditedImage entries
 * so they appear in the file manager under "Imágenes con marca de agua".
 *
 * Usage:  node scripts/migrateEditedToFolders.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('../models/Document');
const EditedImage = require('../models/EditedImage');
const Folder = require('../models/Folder');
const Agente = require('../models/Agente');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anabella';

async function findOrCreateFolder(name, parent, agenteId) {
  let folder = await Folder.findOne({ name, parent: parent || null, agenteId: agenteId || '' }).exec();
  if (!folder) {
    folder = await Folder.create({ name, parent: parent || null, agenteId: agenteId || '' });
    console.log(`  [+] Created folder "${name}" (agenteId=${agenteId || 'admin'}, parent=${parent || 'root'})`);
  }
  return folder;
}

async function getAgenteName(agenteId) {
  if (!agenteId) return null;
  const agente = await Agente.findById(agenteId, 'nombre').lean();
  return agente ? agente.nombre : null;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const allEdited = await EditedImage.find({}).lean();
  console.log(`Found ${allEdited.length} EditedImage records.\n`);

  let created = 0, skipped = 0, errors = 0;

  for (const record of allEdited) {
    try {
      // Check if Document already exists for this edited image
      const existing = await Document.findOne({
        object_key: record.outputObjectKey,
        documentType: 'edited-image',
      }).lean();

      if (existing) {
        skipped++;
        continue;
      }

      const ownerAgenteId = record.agenteId || '';
      const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
      const mime = mimeMap[record.outputFormat] || 'image/png';

      // 1) Root admin folder
      const rootFolder = await findOrCreateFolder('Imágenes con marca de agua', null, '');

      // 2) Agent subfolder (admin-visible)
      let targetFolder = rootFolder;
      if (ownerAgenteId) {
        const agentName = await getAgenteName(ownerAgenteId) || `Agente ${ownerAgenteId}`;
        const agentSubfolder = await findOrCreateFolder(agentName, rootFolder._id, '');
        targetFolder = agentSubfolder;

        // 3) Agent's own scoped folder
        const agentOwnFolder = await findOrCreateFolder('Imágenes con marca de agua', null, ownerAgenteId);
        await Document.create({
          nombre: record.outputFilename,
          tipo: 'Imagen',
          mimetype: mime,
          categoria: 'Marca de agua',
          tamano: Math.round((record.outputSize || 0) / 1024 / 1024 * 100) / 100,
          bucket: record.outputBucket,
          object_key: record.outputObjectKey,
          folder: agentOwnFolder._id,
          agenteId: ownerAgenteId,
          sourceModule: 'editor',
          documentType: 'edited-image',
          uploadedBy: record.userName || '',
          tags: ['marca-de-agua', 'editada'],
          metadata: { editedImageId: record._id, originalFilename: record.originalFilename },
        });
        console.log(`  [doc] Agent-scoped doc: ${record.outputFilename} → folder "${agentOwnFolder.name}" (agent: ${ownerAgenteId})`);
      }

      // 4) Admin-visible document
      await Document.create({
        nombre: record.outputFilename,
        tipo: 'Imagen',
        mimetype: mime,
        categoria: 'Marca de agua',
        tamano: Math.round((record.outputSize || 0) / 1024 / 1024 * 100) / 100,
        bucket: record.outputBucket,
        object_key: record.outputObjectKey,
        folder: targetFolder._id,
        agenteId: '',
        sourceModule: 'editor',
        documentType: 'edited-image',
        uploadedBy: record.userName || '',
        tags: ['marca-de-agua', 'editada'],
        metadata: { editedImageId: record._id, originalFilename: record.originalFilename },
      });
      console.log(`  [doc] Admin doc: ${record.outputFilename} → folder "${targetFolder.name}"`);

      created++;
    } catch (e) {
      console.error(`  [!] Error for ${record._id}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n════════════════════════════════`);
  console.log(`Migration complete:`);
  console.log(`  Total EditedImages: ${allEdited.length}`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already existed): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`════════════════════════════════\n`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
