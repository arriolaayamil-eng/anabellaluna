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

const PAGE_H = 841.89; // A4 height in points
const PAGE_W = 595.28; // A4 width in points
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2; // 495.28

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

// Footer: skip page 0 (dark cover page)
function addPageFooter(doc, pageNum, skipFirst) {
  if (skipFirst && pageNum === 1) return;
  doc.save();
  doc.fontSize(8).fillColor(C.gray);
  doc.text(`Página ${pageNum}`, MARGIN, PAGE_H - 35, { align: 'center', width: CONTENT_W });
  doc.restore();
}

// Returns true and adds page if not enough vertical space
function ensureSpace(doc, needed) {
  if (doc.y + needed > PAGE_H - 60) {
    doc.addPage();
    doc.y = MARGIN;
    return true;
  }
  return false;
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  const titleY = doc.y;
  doc.fontSize(13).fillColor(C.primary).font('Helvetica-Bold').text(title, MARGIN, titleY, { width: CONTENT_W });
  // Draw underline right below the title text (doc.y has advanced after .text())
  const lineY = doc.y + 1;
  doc.save();
  doc.moveTo(MARGIN, lineY).lineTo(MARGIN + CONTENT_W, lineY).strokeColor(C.accent).lineWidth(1.5).stroke();
  doc.restore();
  doc.moveDown(0.6);
}

function drawKeyValue(doc, label, value, opts = {}) {
  const { indent = 0 } = opts;
  ensureSpace(doc, 18);
  const x = MARGIN + indent;
  const rowY = doc.y;
  // Label in bold
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(`${label}:`, x, rowY, { width: 130 });
  // Value below label or beside it — use absolute x to avoid pdfkit continued-mode issues
  doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(String(value || '-'), x + 140, rowY, { width: CONTENT_W - indent - 140 });
  // Advance cursor past tallest column
  const nextY = doc.y;
  if (nextY < rowY + 14) doc.text('', x, rowY + 14);
}

function drawTwoCol(doc, pairs) {
  const COL1_LABEL_X = MARGIN;       // 50
  const COL1_VAL_X   = MARGIN + 130; // 180
  const COL2_LABEL_X = MARGIN + 250; // 300
  const COL2_VAL_X   = MARGIN + 380; // 430
  const LABEL_W = 125;
  const VAL_W   = 115;

  for (let i = 0; i < pairs.length; i += 2) {
    ensureSpace(doc, 16);
    const rowY = doc.y;

    const [l1, v1] = pairs[i];
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
      .text(`${l1}:`, COL1_LABEL_X, rowY, { width: LABEL_W, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(C.gray)
      .text(String(v1 || '-'), COL1_VAL_X, rowY, { width: VAL_W, lineBreak: false });

    if (pairs[i + 1]) {
      const [l2, v2] = pairs[i + 1];
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
        .text(`${l2}:`, COL2_LABEL_X, rowY, { width: LABEL_W, lineBreak: false });
      doc.fontSize(9).font('Helvetica').fillColor(C.gray)
        .text(String(v2 || '-'), COL2_VAL_X, rowY, { width: VAL_W, lineBreak: false });
    }

    // Explicitly advance cursor to next row
    doc.text('', MARGIN, rowY + 16);
  }
}

// ════════════════════════════════════════════════════════════
//  MARKET STUDY PDF
// ════════════════════════════════════════════════════════════
function generateMarketStudyPdf(study) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const mon = study.mercado?.moneda || study.resultado?.moneda || 'USD';

      // ── PORTADA ──
      // Draw background first, then overlay text using absolute coordinates
      doc.save();
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.primary);
      doc.restore();

      // Title block (positioned absolutely over the background)
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(32)
        .text('ESTUDIO DE MERCADO', MARGIN, 240, { align: 'center', width: CONTENT_W });
      doc.font('Helvetica').fontSize(14)
        .text('Análisis Comparativo de Mercado Inmobiliario', MARGIN, 290, { align: 'center', width: CONTENT_W });

      // Property address
      doc.fontSize(12)
        .text(study.inmueble?.direccion || 'Sin dirección', MARGIN, 350, { align: 'center', width: CONTENT_W });
      const localProv = `${study.inmueble?.localidad || ''}${study.inmueble?.provincia ? ' — ' + study.inmueble.provincia : ''}`.trim();
      if (localProv) {
        doc.fontSize(11).text(localProv, MARGIN, 370, { align: 'center', width: CONTENT_W });
      }

      // Accent divider
      doc.save();
      doc.moveTo(200, 405).lineTo(395, 405).strokeColor(C.accent).lineWidth(2).stroke();
      doc.restore();

      // Meta info
      doc.fillColor(C.lightGray).font('Helvetica').fontSize(10)
        .text(`Código: ${study.codigo || '-'}`, MARGIN, 420, { align: 'center', width: CONTENT_W });
      doc.text(`Fecha: ${fmtDate(study.createdAt)}`, MARGIN, 438, { align: 'center', width: CONTENT_W });
      doc.text(`Agente: ${study.agenteName || '-'}`, MARGIN, 456, { align: 'center', width: CONTENT_W });

      // Footer note on cover
      doc.fontSize(8).fillColor('#718096')
        .text('Documento generado automáticamente por el sistema de gestión inmobiliaria.', MARGIN, PAGE_H - 50, { align: 'center', width: CONTENT_W });

      // ── RESUMEN EJECUTIVO ──
      doc.addPage();
      drawSectionTitle(doc, 'Resumen Ejecutivo');
      if (study.resultado?.resumenEjecutivo) {
        doc.fontSize(10).font('Helvetica').fillColor(C.dark)
          .text(study.resultado.resumenEjecutivo, MARGIN, doc.y, { width: CONTENT_W, lineGap: 4 });
      } else {
        doc.fontSize(10).font('Helvetica').fillColor(C.gray)
          .text('Sin resumen ejecutivo cargado.', MARGIN, doc.y, { width: CONTENT_W });
      }
      doc.moveDown(1);

      // Result summary box
      const r = study.resultado || {};
      ensureSpace(doc, 105);
      const boxY = doc.y;
      const BOX_H = 90;
      doc.save();
      doc.rect(MARGIN, boxY, CONTENT_W, BOX_H).fill('#edf2f7');
      doc.restore();
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary)
        .text('Resultado del Estudio', MARGIN + 10, boxY + 8, { width: CONTENT_W - 20 });
      doc.fontSize(9).font('Helvetica').fillColor(C.dark);
      doc.text(`Valor estimado por m²: ${fmtCurrency(r.valorEstimadoM2, mon)}`, MARGIN + 10, boxY + 26, { width: 220, lineBreak: false });
      doc.text(`Rango conservador: ${fmtCurrency(r.rangoConservador, mon)}`, MARGIN + 10, boxY + 42, { width: 220, lineBreak: false });
      doc.text(`Rango medio: ${fmtCurrency(r.rangoMedio, mon)}`, MARGIN + 10, boxY + 58, { width: 220, lineBreak: false });
      doc.text(`Rango premium: ${fmtCurrency(r.rangoPremium, mon)}`, MARGIN + 250, boxY + 26, { width: 230, lineBreak: false });
      doc.text(`Precio publicación: ${fmtCurrency(r.precioSugeridoPublicacion, mon)}`, MARGIN + 250, boxY + 42, { width: 230, lineBreak: false });
      doc.text(`Precio mercado: ${fmtCurrency(r.precioSugeridoMercado, mon)}`, MARGIN + 250, boxY + 58, { width: 230, lineBreak: false });
      // Advance cursor past box
      doc.text('', MARGIN, boxY + BOX_H + 8);

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
          const ROW_H = 68;
          ensureSpace(doc, ROW_H + 4);
          const ry = doc.y;
          // Background stripe
          doc.save();
          doc.rect(MARGIN, ry, CONTENT_W, ROW_H).fill(idx % 2 === 0 ? '#f7fafc' : '#edf2f7');
          doc.restore();
          // Row content — all absolute y positions relative to ry
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
            .text(`#${idx + 1} ${comp.direccion || comp.codigo || 'Sin ref.'}`, MARGIN + 5, ry + 5, { width: 380, lineBreak: false });
          doc.fontSize(8).font('Helvetica').fillColor(C.gray)
            .text(`Tipo: ${comp.tipoInmueble || '-'}  |  ${fmtNum(comp.superficieTotal)} m²  |  ${comp.ambientes || '-'} amb.  |  ${comp.dormitorios || '-'} dorm.`, MARGIN + 5, ry + 20, { width: 360, lineBreak: false });
          doc.text(`Precio publicado: ${fmtCurrency(comp.precioPublicado, mon)}  |  Valor/m²: ${fmtCurrency(comp.valorPorM2, mon)}`, MARGIN + 5, ry + 35, { width: 360, lineBreak: false });
          doc.text(`Fuente: ${comp.fuente || '-'}  |  Distancia: ${comp.distancia || '-'}`, MARGIN + 5, ry + 50, { width: 280, lineBreak: false });
          if (comp.ponderacion && comp.ponderacion !== 1) {
            doc.text(`Pond.: ${comp.ponderacion}x`, MARGIN + 380, ry + 20, { width: 100, lineBreak: false });
          }
          // Move cursor past this row
          doc.text('', MARGIN, ry + ROW_H + 2);
        });
      }

      // ── AJUSTES ──
      const ajustes = study.ajustes || [];
      if (ajustes.length > 0) {
        drawSectionTitle(doc, 'Ajustes Aplicados');
        ajustes.forEach((aj) => {
          ensureSpace(doc, 18);
          const ajY = doc.y;
          const val = aj.tipo === 'porcentaje' ? fmtPct(aj.valor) : fmtCurrency(aj.valor, mon);
          const color = Number(aj.valor) >= 0 ? '#38a169' : '#e53e3e';
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
            .text(`${aj.nombre}:`, MARGIN + 5, ajY, { width: 180, lineBreak: false });
          doc.font('Helvetica').fillColor(color)
            .text(val, MARGIN + 190, ajY, { width: 80, lineBreak: false });
          if (aj.observacion) {
            doc.fillColor(C.gray)
              .text(`— ${aj.observacion}`, MARGIN + 280, ajY, { width: 210, lineBreak: false });
          }
          doc.text('', MARGIN, ajY + 16);
        });
      }

      // ── OBSERVACIONES TÉCNICAS ──
      if (r.observacionesTecnicas) {
        drawSectionTitle(doc, 'Observaciones Técnicas');
        doc.fontSize(9).font('Helvetica').fillColor(C.dark)
          .text(r.observacionesTecnicas, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
      }

      // ── FOOTER (skip cover page 1) ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        addPageFooter(doc, i + 1, true);
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
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const mon = appraisal.resultado?.moneda || appraisal.economico?.moneda || 'USD';

      // ── PORTADA ──
      // Draw background first, then overlay text using absolute coordinates
      doc.save();
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.primary);
      doc.restore();

      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(32)
        .text('TASACIÓN PROFESIONAL', MARGIN, 240, { align: 'center', width: CONTENT_W });
      doc.font('Helvetica').fontSize(14)
        .text('Informe de Tasación Inmobiliaria', MARGIN, 290, { align: 'center', width: CONTENT_W });

      doc.fontSize(12)
        .text(appraisal.dominial?.ubicacionExacta || 'Sin dirección', MARGIN, 350, { align: 'center', width: CONTENT_W });

      // Accent divider
      doc.save();
      doc.moveTo(200, 380).lineTo(395, 380).strokeColor(C.accent).lineWidth(2).stroke();
      doc.restore();

      doc.fillColor(C.lightGray).font('Helvetica').fontSize(10)
        .text(`Código: ${appraisal.codigo || '-'}`, MARGIN, 395, { align: 'center', width: CONTENT_W });
      doc.text(`Fecha: ${fmtDate(appraisal.fechaTasacion)}`, MARGIN, 413, { align: 'center', width: CONTENT_W });
      doc.text(`Agente: ${appraisal.agenteName || '-'}`, MARGIN, 431, { align: 'center', width: CONTENT_W });
      if (appraisal.certificacion?.matriculadoNombre) {
        doc.text(`Matriculado: ${appraisal.certificacion.matriculadoNombre} (Mat. ${appraisal.certificacion.matricula || '-'})`, MARGIN, 449, { align: 'center', width: CONTENT_W });
      }

      const estadoLabel = { borrador: 'BORRADOR', en_revision: 'EN REVISIÓN', validada: 'VALIDADA', certificada: 'CERTIFICADA', archivada: 'ARCHIVADA' };
      doc.fontSize(12).font('Helvetica-Bold').fillColor(C.accent)
        .text(estadoLabel[appraisal.estado] || 'BORRADOR', MARGIN, 490, { align: 'center', width: CONTENT_W });

      doc.fontSize(8).fillColor('#718096')
        .text('Documento generado automáticamente por el sistema de gestión inmobiliaria.', MARGIN, PAGE_H - 50, { align: 'center', width: CONTENT_W });

      // ── RESUMEN EJECUTIVO ──
      doc.addPage();
      drawSectionTitle(doc, 'Resumen Ejecutivo');
      const res = appraisal.resultado || {};
      ensureSpace(doc, 105);
      const boxY = doc.y;
      const BOX_H = 90;
      doc.save();
      doc.rect(MARGIN, boxY, CONTENT_W, BOX_H).fill('#edf2f7');
      doc.restore();
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary)
        .text('Resultado de la Tasación', MARGIN + 10, boxY + 8, { width: CONTENT_W - 20 });
      doc.fontSize(9).font('Helvetica').fillColor(C.dark);
      doc.text(`Valor final estimado: ${fmtCurrency(res.valorFinal, mon)}`, MARGIN + 10, boxY + 26, { width: 220, lineBreak: false });
      doc.text(`Rango: ${fmtCurrency(res.rangoInferior, mon)} — ${fmtCurrency(res.rangoSuperior, mon)}`, MARGIN + 10, boxY + 42, { width: 220, lineBreak: false });
      doc.text(`Valor por m²: ${fmtCurrency(res.valorPorM2Final, mon)}`, MARGIN + 10, boxY + 58, { width: 220, lineBreak: false });
      doc.text(`Precio publicación: ${fmtCurrency(res.valorPublicacion, mon)}`, MARGIN + 250, boxY + 26, { width: 230, lineBreak: false });
      doc.text(`Cierre esperado: ${fmtCurrency(res.valorCierreEsperado, mon)}`, MARGIN + 250, boxY + 42, { width: 230, lineBreak: false });
      doc.text(`Realización rápida: ${fmtCurrency(res.valorRealizacionRapida, mon)}`, MARGIN + 250, boxY + 58, { width: 230, lineBreak: false });
      // Advance cursor past box
      doc.text('', MARGIN, boxY + BOX_H + 8);

      if (res.justificacion) {
        doc.fontSize(9).font('Helvetica').fillColor(C.dark).text(res.justificacion, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
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
        ensureSpace(doc, 65);
        doc.moveDown(1);
        const discY = doc.y;
        const DISC_H = 55;
        doc.save();
        doc.rect(MARGIN, discY, CONTENT_W, DISC_H).fill('#fffbeb');
        doc.restore();
        doc.fontSize(7).font('Helvetica').fillColor('#92400e')
          .text(appraisal.disclaimerLegal, MARGIN + 5, discY + 5, { width: CONTENT_W - 10, lineGap: 2 });
        doc.text('', MARGIN, discY + DISC_H + 4);
      }

      // ── PAGE FOOTERS (skip cover page 1) ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        addPageFooter(doc, i + 1, true);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateMarketStudyPdf, generateAppraisalPdf };
