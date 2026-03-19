const PDFDocument = require('pdfkit');

// ── Color palette ──
const C = {
  primary: '#1a365d',
  secondary: '#2b6cb0',
  accent: '#ed8936',
  dark: '#1a202c',
  gray: '#4a5568',
  lightGray: '#e2e8f0',
  white: '#ffffff',
  bg: '#f7fafc',
};

// ── Helpers ──
function fmtCurrency(val, moneda = 'USD') {
  if (!val && val !== 0) return '-';
  const sym = moneda === 'USD' ? 'USD' : moneda === 'ARS' ? 'ARS' : moneda;
  return `${sym} ${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtNum(val) {
  if (!val && val !== 0) return '-';
  return Number(val).toLocaleString('es-AR');
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtPct(val) {
  if (!val && val !== 0) return '-';
  return `${Number(val) >= 0 ? '+' : ''}${Number(val).toFixed(1)}%`;
}

function addPageFooter(doc, pageNum) {
  doc.save();
  doc.fontSize(8).fillColor(C.gray);
  doc.text(`Página ${pageNum}`, 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
  doc.restore();
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    return true;
  }
  return false;
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(C.primary).font('Helvetica-Bold').text(title);
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(C.accent).lineWidth(1.5).stroke();
  doc.moveDown(0.5);
}

function drawKeyValue(doc, label, value, opts = {}) {
  const { width = 240, indent = 0 } = opts;
  ensureSpace(doc, 16);
  const x = 50 + indent;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`${label}:`, x, doc.y, { continued: true, width });
  doc.font('Helvetica').fillColor(C.gray).text(` ${value || '-'}`, { width: 495 - indent });
}

function drawTwoCol(doc, pairs) {
  for (let i = 0; i < pairs.length; i += 2) {
    ensureSpace(doc, 16);
    const y = doc.y;
    const [l1, v1] = pairs[i];
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`${l1}:`, 50, y, { width: 130 });
    doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(String(v1 || '-'), 180, y, { width: 100 });
    if (pairs[i + 1]) {
      const [l2, v2] = pairs[i + 1];
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`${l2}:`, 300, y, { width: 130 });
      doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(String(v2 || '-'), 430, y, { width: 115 });
    }
    doc.y = y + 16;
  }
}

// ════════════════════════════════════════════════════════════
//  MARKET STUDY PDF
// ════════════════════════════════════════════════════════════
function generateMarketStudyPdf(study) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const mon = study.mercado?.moneda || study.resultado?.moneda || 'USD';

      // ── PORTADA ──
      doc.rect(0, 0, 595, 842).fill(C.primary);
      doc.fontSize(32).fillColor(C.white).font('Helvetica-Bold').text('ESTUDIO DE MERCADO', 50, 260, { align: 'center', width: 495 });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica').text('Análisis Comparativo de Mercado Inmobiliario', 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(2);
      doc.fontSize(11).text(study.inmueble?.direccion || 'Sin dirección', 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(0.5);
      doc.text(`${study.inmueble?.localidad || ''} ${study.inmueble?.provincia ? '- ' + study.inmueble.provincia : ''}`.trim(), 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(2);
      doc.rect(200, doc.y, 195, 1).fill(C.accent);
      doc.moveDown(1.5);
      doc.fontSize(10).text(`Código: ${study.codigo || '-'}`, 50, doc.y, { align: 'center', width: 495 });
      doc.text(`Fecha: ${fmtDate(study.createdAt)}`, 50, doc.y, { align: 'center', width: 495 });
      doc.text(`Agente: ${study.agenteName || '-'}`, 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(5);
      doc.fontSize(8).fillColor(C.lightGray).text('Documento generado automáticamente por el sistema de gestión inmobiliaria.', 50, doc.y, { align: 'center', width: 495 });

      // ── RESUMEN EJECUTIVO ──
      doc.addPage();
      drawSectionTitle(doc, 'Resumen Ejecutivo');
      if (study.resultado?.resumenEjecutivo) {
        doc.fontSize(10).font('Helvetica').fillColor(C.dark).text(study.resultado.resumenEjecutivo, 50, doc.y, { width: 495, lineGap: 4 });
      } else {
        doc.fontSize(10).font('Helvetica').fillColor(C.gray).text('Sin resumen ejecutivo cargado.', 50, doc.y, { width: 495 });
      }
      doc.moveDown(1);

      // Result summary box
      const r = study.resultado || {};
      ensureSpace(doc, 100);
      const boxY = doc.y;
      doc.rect(50, boxY, 495, 85).fill('#edf2f7');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary).text('Resultado del Estudio', 60, boxY + 8);
      doc.fontSize(9).font('Helvetica').fillColor(C.dark);
      doc.text(`Valor estimado por m²: ${fmtCurrency(r.valorEstimadoM2, mon)}`, 60, boxY + 26, { width: 220 });
      doc.text(`Rango conservador: ${fmtCurrency(r.rangoConservador, mon)}`, 60, boxY + 42, { width: 220 });
      doc.text(`Rango medio: ${fmtCurrency(r.rangoMedio, mon)}`, 60, boxY + 58, { width: 220 });
      doc.text(`Rango premium: ${fmtCurrency(r.rangoPremium, mon)}`, 300, boxY + 26, { width: 220 });
      doc.text(`Precio sugerido publicación: ${fmtCurrency(r.precioSugeridoPublicacion, mon)}`, 300, boxY + 42, { width: 230 });
      doc.text(`Precio sugerido mercado: ${fmtCurrency(r.precioSugeridoMercado, mon)}`, 300, boxY + 58, { width: 230 });
      doc.y = boxY + 95;

      // ── FICHA DEL INMUEBLE ──
      drawSectionTitle(doc, 'Ficha del Inmueble');
      const inm = study.inmueble || {};
      drawTwoCol(doc, [
        ['Dirección', inm.direccion], ['Localidad', inm.localidad],
        ['Barrio / Zona', inm.barrio], ['Provincia', inm.provincia],
        ['Tipo', inm.tipoInmueble], ['Subtipo', inm.subtipo],
        ['Uso', inm.uso], ['Estado general', inm.estadoGeneral],
        ['Sup. cubierta', `${fmtNum(inm.superficieCubierta)} m²`], ['Sup. total', `${fmtNum(inm.superficieTotal)} m²`],
        ['Ambientes', inm.ambientes], ['Dormitorios', inm.dormitorios],
        ['Baños', inm.banos], ['Cocheras', inm.cocheras],
        ['Antigüedad', `${inm.antiguedad || '-'} años`], ['Orientación', inm.orientacion],
        ['Disposición', inm.disposicion], ['Piso / Nivel', inm.pisoNivel],
        ['Apto crédito', inm.aptoCredito ? 'Sí' : 'No'], ['Apto profesional', inm.aptoProfesional ? 'Sí' : 'No'],
        ['Expensas', inm.expensas ? fmtCurrency(inm.expensas, 'ARS') : '-'], ['Amoblado', inm.amoblado ? 'Sí' : 'No'],
      ]);

      // ── ANÁLISIS DE ZONA ──
      drawSectionTitle(doc, 'Análisis de Zona y Localización');
      const loc = study.localizacion || {};
      drawTwoCol(doc, [
        ['Zona de uso', loc.zonaUso], ['Accesibilidad', loc.accesibilidad],
        ['Centros comerciales', loc.cercaniaCentrosComerciales], ['Escuelas', loc.cercaniaEscuelas],
        ['Hospitales', loc.cercaniaHospitales], ['Transporte', loc.cercaniaTransporte],
        ['Calidad entorno', loc.calidadEntorno], ['Consolidación', loc.consolidacionZona],
        ['Seguridad', loc.seguridadPercibida], ['Proyección desarrollo', loc.proyeccionDesarrollo],
      ]);

      // ── VARIABLES DEL MERCADO ──
      drawSectionTitle(doc, 'Variables del Mercado');
      const mkt = study.mercado || {};
      drawTwoCol(doc, [
        ['Valor prom. m²', fmtCurrency(mkt.valorPromedioM2, mon)], ['Rango inf. m²', fmtCurrency(mkt.rangoInferiorM2, mon)],
        ['Rango sup. m²', fmtCurrency(mkt.rangoSuperiorM2, mon)], ['Tendencia precios', mkt.tendenciaPrecios],
        ['Nivel demanda', mkt.nivelDemanda], ['Nivel oferta', mkt.nivelOferta],
        ['Tiempo prom. venta', `${mkt.tiempoPromedioVenta || '-'} días`], ['Liquidez', mkt.liquidezEstimada],
        ['Fuente datos', mkt.fuenteDatos], ['Fecha relevamiento', fmtDate(mkt.fechaRelevamiento)],
      ]);

      // ── COMPARABLES ──
      const comps = (study.comparables || []).filter((c) => c.incluido !== false);
      if (comps.length > 0) {
        drawSectionTitle(doc, `Comparables Incluidos (${comps.length})`);
        comps.forEach((comp, idx) => {
          ensureSpace(doc, 70);
          doc.rect(50, doc.y, 495, 60).fill(idx % 2 === 0 ? '#f7fafc' : '#edf2f7');
          const cy = doc.y + 5;
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`#${idx + 1} ${comp.direccion || comp.codigo || 'Sin ref.'}`, 55, cy, { width: 300 });
          doc.fontSize(8).font('Helvetica').fillColor(C.gray);
          doc.text(`Tipo: ${comp.tipoInmueble || '-'}  |  ${fmtNum(comp.superficieTotal)} m²  |  ${comp.ambientes || '-'} amb.  |  ${comp.dormitorios || '-'} dorm.`, 55, cy + 14, { width: 350 });
          doc.text(`Precio publicado: ${fmtCurrency(comp.precioPublicado, mon)}  |  Valor/m²: ${fmtCurrency(comp.valorPorM2, mon)}`, 55, cy + 28, { width: 350 });
          doc.text(`Fuente: ${comp.fuente || '-'}  |  Distancia: ${comp.distancia || '-'}`, 55, cy + 42, { width: 350 });
          if (comp.ponderacion !== 1) {
            doc.text(`Ponderación: ${comp.ponderacion}x`, 430, cy + 14, { width: 110 });
          }
          doc.y += 65;
        });
      }

      // ── AJUSTES ──
      const ajustes = study.ajustes || [];
      if (ajustes.length > 0) {
        drawSectionTitle(doc, 'Ajustes Aplicados');
        ajustes.forEach((aj) => {
          ensureSpace(doc, 18);
          const val = aj.tipo === 'porcentaje' ? fmtPct(aj.valor) : fmtCurrency(aj.valor, mon);
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`${aj.nombre}: `, 55, doc.y, { continued: true, width: 200 });
          doc.font('Helvetica').fillColor(aj.valor >= 0 ? '#38a169' : '#e53e3e').text(val, { continued: true });
          if (aj.observacion) {
            doc.fillColor(C.gray).text(`  — ${aj.observacion}`, { width: 300 });
          } else {
            doc.text('');
          }
        });
      }

      // ── OBSERVACIONES TÉCNICAS ──
      if (r.observacionesTecnicas) {
        drawSectionTitle(doc, 'Observaciones Técnicas');
        doc.fontSize(9).font('Helvetica').fillColor(C.dark).text(r.observacionesTecnicas, 50, doc.y, { width: 495, lineGap: 3 });
      }

      // ── FOOTER ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        addPageFooter(doc, i + 1);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ════════════════════════════════════════════════════════════
//  APPRAISAL PDF
// ════════════════════════════════════════════════════════════
function generateAppraisalPdf(appraisal, marketStudy) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const mon = appraisal.resultado?.moneda || appraisal.economico?.moneda || 'USD';

      // ── PORTADA ──
      doc.rect(0, 0, 595, 842).fill(C.primary);
      doc.fontSize(32).fillColor(C.white).font('Helvetica-Bold').text('TASACIÓN PROFESIONAL', 50, 240, { align: 'center', width: 495 });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica').text('Informe de Tasación Inmobiliaria', 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(2);
      doc.fontSize(11).text(appraisal.dominial?.ubicacionExacta || 'Sin dirección', 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(2);
      doc.rect(200, doc.y, 195, 1).fill(C.accent);
      doc.moveDown(1.5);
      doc.fontSize(10).text(`Código: ${appraisal.codigo || '-'}`, 50, doc.y, { align: 'center', width: 495 });
      doc.text(`Fecha: ${fmtDate(appraisal.fechaTasacion)}`, 50, doc.y, { align: 'center', width: 495 });
      doc.text(`Agente: ${appraisal.agenteName || '-'}`, 50, doc.y, { align: 'center', width: 495 });
      if (appraisal.certificacion?.matriculadoNombre) {
        doc.text(`Matriculado: ${appraisal.certificacion.matriculadoNombre} (Mat. ${appraisal.certificacion.matricula || '-'})`, 50, doc.y, { align: 'center', width: 495 });
      }
      doc.moveDown(2);
      const estadoLabel = { borrador: 'BORRADOR', en_revision: 'EN REVISIÓN', validada: 'VALIDADA', certificada: 'CERTIFICADA', archivada: 'ARCHIVADA' };
      doc.fontSize(12).font('Helvetica-Bold').fillColor(C.accent).text(estadoLabel[appraisal.estado] || 'BORRADOR', 50, doc.y, { align: 'center', width: 495 });
      doc.moveDown(4);
      doc.fontSize(8).fillColor(C.lightGray).text('Documento generado automáticamente por el sistema de gestión inmobiliaria.', 50, doc.y, { align: 'center', width: 495 });

      // ── RESUMEN EJECUTIVO ──
      doc.addPage();
      drawSectionTitle(doc, 'Resumen Ejecutivo');
      const res = appraisal.resultado || {};
      ensureSpace(doc, 100);
      const boxY = doc.y;
      doc.rect(50, boxY, 495, 85).fill('#edf2f7');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary).text('Resultado de la Tasación', 60, boxY + 8);
      doc.fontSize(9).font('Helvetica').fillColor(C.dark);
      doc.text(`Valor final estimado: ${fmtCurrency(res.valorFinal, mon)}`, 60, boxY + 26, { width: 220 });
      doc.text(`Rango: ${fmtCurrency(res.rangoInferior, mon)} — ${fmtCurrency(res.rangoSuperior, mon)}`, 60, boxY + 42, { width: 220 });
      doc.text(`Valor por m²: ${fmtCurrency(res.valorPorM2Final, mon)}`, 60, boxY + 58, { width: 220 });
      doc.text(`Precio publicación: ${fmtCurrency(res.valorPublicacion, mon)}`, 300, boxY + 26, { width: 230 });
      doc.text(`Cierre esperado: ${fmtCurrency(res.valorCierreEsperado, mon)}`, 300, boxY + 42, { width: 230 });
      doc.text(`Realización rápida: ${fmtCurrency(res.valorRealizacionRapida, mon)}`, 300, boxY + 58, { width: 230 });
      doc.y = boxY + 95;

      if (res.justificacion) {
        doc.fontSize(9).font('Helvetica').fillColor(C.dark).text(res.justificacion, 50, doc.y, { width: 495, lineGap: 3 });
        doc.moveDown(0.5);
      }

      // ── DATOS DOMINIALES ──
      drawSectionTitle(doc, 'Datos Dominiales y Descriptivos');
      const dom = appraisal.dominial || {};
      drawTwoCol(doc, [
        ['Tipo inmueble', dom.tipoInmueble], ['Destino', dom.destino],
        ['Ocupación', dom.ocupacion], ['Estado posesión', dom.estadoPosesion],
        ['Nomenclatura', dom.nomenclatura], ['Datos catastrales', dom.datosCatastrales],
        ['Sup. título', `${fmtNum(dom.superficieTitulo)} m²`], ['Sup. relevada', `${fmtNum(dom.superficieRelevada)} m²`],
        ['Ubicación exacta', dom.ubicacionExacta],
      ]);
      if (dom.observacionesDocumentales) {
        drawKeyValue(doc, 'Observaciones', dom.observacionesDocumentales);
      }

      // ── VARIABLES TÉCNICAS ──
      drawSectionTitle(doc, 'Variables Técnicas del Inmueble');
      const tec = appraisal.tecnico || {};
      drawTwoCol(doc, [
        ['Tipología', tec.tipologia], ['Cat. constructiva', tec.categoriaConstructiva],
        ['Calidad materiales', tec.calidadMateriales], ['Estado conservación', tec.estadoConservacion],
        ['Antigüedad real', `${tec.antiguedadReal || '-'} años`], ['Reciclado', tec.reciclado ? 'Sí' : 'No'],
        ['Terminaciones', tec.calidadTerminaciones], ['Carpinterías', tec.carpinterias],
        ['Pisos', tec.pisos], ['Cocina', tec.cocina],
        ['Baños', tec.banos], ['Climatización', tec.climatizacion],
        ['Iluminación', tec.iluminacionNatural], ['Ventilación', tec.ventilacion],
        ['Orientación', tec.orientacion], ['Vista', tec.vista],
        ['Ruido', tec.ruido], ['Entorno', tec.entorno],
        ['Cochera', tec.cochera], ['Baulera', tec.baulera ? 'Sí' : 'No'],
        ['Ascensor', tec.ascensor ? 'Sí' : 'No'], ['Expensas', tec.expensas ? fmtCurrency(tec.expensas, 'ARS') : '-'],
      ]);

      // ── TERRENO ──
      const ter = appraisal.terreno || {};
      if (ter.superficieLote) {
        drawSectionTitle(doc, 'Variables del Terreno');
        drawTwoCol(doc, [
          ['Superficie lote', `${fmtNum(ter.superficieLote)} m²`], ['Frente', `${fmtNum(ter.frente)} m`],
          ['Fondo', `${fmtNum(ter.fondo)} m`], ['Forma', ter.formaLote],
          ['Topografía', ter.topografia], ['Orientación', ter.orientacion],
          ['FOT', ter.fot || '-'], ['FOS', ter.fos || '-'],
          ['Esquina', ter.esquina ? 'Sí' : 'No'], ['Valor terreno est.', fmtCurrency(ter.valorTerrenoEstimado, mon)],
        ]);
      }

      // ── VARIABLES ECONÓMICAS ──
      drawSectionTitle(doc, 'Variables Económicas');
      const eco = appraisal.economico || {};
      drawTwoCol(doc, [
        ['Valor ref. m²', fmtCurrency(eco.valorReferenciaM2, mon)], ['Incidencia terreno', `${fmtNum(eco.incidenciaTerreno)}%`],
        ['Incidencia mejoras', `${fmtNum(eco.incidenciaMejoras)}%`], ['Depreciación', `${fmtNum(eco.depreciacion)}%`],
        ['Obsolescencia', `${fmtNum(eco.obsolescencia)}%`], ['Potencial renta', eco.potencialRenta],
        ['Renta est. mensual', fmtCurrency(eco.rentaEstimadaMensual, mon)], ['Tasa cap.', `${eco.tasaCapitalizacion || '-'}%`],
        ['Valor técnico', fmtCurrency(eco.valorTecnico, mon)], ['Valor mercado', fmtCurrency(eco.valorMercado, mon)],
      ]);

      // ── METODOLOGÍA ──
      drawSectionTitle(doc, 'Metodología Aplicada');
      const met = appraisal.metodologia || {};
      const metodos = [];
      if (met.comparativaMercado) metodos.push('Comparativa de mercado');
      if (met.costoReposicion) metodos.push('Costo de reposición depreciado');
      if (met.capitalizacionRenta) metodos.push('Capitalización de renta');
      if (met.metodoMixto) metodos.push('Método mixto');
      if (met.ajusteProfesional) metodos.push('Ajuste profesional manual');
      doc.fontSize(9).font('Helvetica').fillColor(C.dark).text(`Métodos utilizados: ${metodos.join(', ') || '-'}`, 50, doc.y, { width: 495 });
      doc.moveDown(0.3);
      doc.text(`Método principal: ${met.principal?.replace(/_/g, ' ') || '-'}`);
      if (met.descripcion) {
        doc.moveDown(0.3);
        doc.text(met.descripcion, { width: 495, lineGap: 3 });
      }

      // ── COMENTARIOS ──
      if (res.comentariosAgente || res.comentariosMatriculado) {
        drawSectionTitle(doc, 'Comentarios');
        if (res.comentariosAgente) {
          drawKeyValue(doc, 'Agente', res.comentariosAgente);
        }
        if (res.comentariosMatriculado) {
          drawKeyValue(doc, 'Matriculado', res.comentariosMatriculado);
        }
      }

      // ── CERTIFICACIÓN ──
      const cert = appraisal.certificacion || {};
      if (cert.matriculadoNombre || appraisal.estado === 'certificada') {
        drawSectionTitle(doc, 'Certificación Profesional');
        drawTwoCol(doc, [
          ['Matriculado', cert.matriculadoNombre], ['Matrícula', cert.matricula],
          ['Firma', cert.firmaTexto], ['Fecha cert.', fmtDate(cert.fechaCertificacion)],
        ]);
        if (cert.observaciones) {
          drawKeyValue(doc, 'Observaciones del profesional', cert.observaciones);
        }
      }

      // ── DISCLAIMER ──
      if (appraisal.disclaimerLegal) {
        ensureSpace(doc, 60);
        doc.moveDown(1);
        doc.rect(50, doc.y, 495, 50).fill('#fffbeb');
        doc.fontSize(7).font('Helvetica').fillColor('#92400e').text(appraisal.disclaimerLegal, 55, doc.y + 5, { width: 485, lineGap: 2 });
        doc.y += 55;
      }

      // ── PAGE FOOTERS ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        addPageFooter(doc, i + 1);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateMarketStudyPdf, generateAppraisalPdf };
