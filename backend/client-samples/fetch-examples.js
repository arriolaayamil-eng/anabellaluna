// Examples to interact with the document backend
// List documents
async function listDocs(q = '') {
  const res = await fetch(`http://localhost:4000/documents${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  return res.json();
}

// Upload files (browser)
async function uploadFiles(files) {
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const res = await fetch('http://localhost:4000/documents', { method: 'POST', body: fd });
  return res.json();
}

// Download file (opens in new tab)
function downloadDocument(id) {
  window.open(`http://localhost:4000/documents/${id}/download`, '_blank');
}

// Delete document
async function deleteDoc(id) {
  const res = await fetch(`http://localhost:4000/documents/${id}`, { method: 'DELETE' });
  return res.json();
}

window.backendClient = { listDocs, uploadFiles, downloadDocument, deleteDoc };