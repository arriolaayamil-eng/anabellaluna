import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ── Layout constants (A4 portrait in pt) ─────────────────────────── */
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;
const CONTENT_W = A4_W - MARGIN * 2;
const USABLE_H = A4_H - MARGIN * 2 - 30; // leave room for footer

/* ── Brand colours ────────────────────────────────────────────────── */
const PRIMARY = [59, 130, 246];
const PRIMARY_D = [37, 99, 235];
const DARK = [30, 41, 59];
const GRAY = [148, 163, 184];
const LIGHT_BG = [241, 245, 249];
const WHITE = [255, 255, 255];
const ACCENT = [16, 185, 129];

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function uid() {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${ts}-${r}`;
}

function fmtNum(v) {
  if (v == null) return '-';
  return Number(v).toLocaleString('es-AR');
}

function nowStr() {
  return new Date().toLocaleString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Wait until Syncfusion SVGs inside a container have dimensions > 0 */
async function waitForCharts(container, timeoutMs = 4000) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const svgs = container.querySelectorAll('svg');
    const pending = [...svgs].filter(
      (s) => !s.getAttribute('width') || s.getBoundingClientRect().height < 10,
    );
    if (pending.length === 0) break;
    if (Date.now() - start > timeoutMs) break;
    await new Promise((r) => setTimeout(r, 200));
  }
}

/** Capture a DOM element at high resolution */
async function capture(element, bgColor = '#FFFFFF') {
  await waitForCharts(element, 3000);
  return html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: bgColor,
    logging: false,
    removeContainer: true,
  });
}

/* ── PDF drawing primitives ───────────────────────────────────────── */

function footer(doc, page, total, reportId, timestamp) {
  const y = A4_H - 22;
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y - 8, A4_W - MARGIN, y - 8);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(`Página ${page} de ${total}`, MARGIN, y);
  doc.text(`${timestamp}  ·  v1.0.0  ·  ${reportId}`, A4_W - MARGIN, y, { align: 'right' });
}

function sectionBanner(doc, title, y) {
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 26, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 12, y + 17);
  return y + 34;
}

/* ── Cover page ───────────────────────────────────────────────────── */

function drawCover(doc, cfg) {
  const { year, month, type, reportId, selectedCount, totalCount, userName } = cfg;
  const monthName = MONTHS_ES[(month || 1) - 1] || '';

  // Top gradient band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, A4_W, 220, 'F');
  doc.setFillColor(...PRIMARY_D);
  doc.rect(0, 180, A4_W, 40, 'F');

  // Decorative circles
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  doc.circle(480, 50, 90, 'F');
  doc.circle(70, 190, 60, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE EJECUTIVO', A4_W / 2, 75, { align: 'center' });

  doc.setFontSize(15);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema ERP Inmobiliario', A4_W / 2, 102, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${monthName} ${year}`, A4_W / 2, 140, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`,
    A4_W / 2,
    165,
    { align: 'center' },
  );

  doc.setFontSize(9);
  doc.text(`ID: ${reportId}`, A4_W / 2, 200, { align: 'center' });

  // Info card
  let y = 250;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, 160, 6, 6, 'F');
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, CONTENT_W, 160, 6, 6, 'S');

  y += 22;
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Reporte', MARGIN + 16, y);
  y += 22;

  const rows = [
    ['Módulo', 'Reportes y Estadísticas'],
    ['Período', `${monthName} ${year}`],
    ['Tipo', type === 'annual' ? 'Reporte Anual' : 'Reporte Manual'],
    ['Reportes incluidos', `${selectedCount} de ${totalCount}`],
    ['Filtros activos', `Año: ${year}, Mes: ${monthName}`],
  ];
  if (userName) rows.push(['Generado por', userName]);

  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(label, MARGIN + 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(value, MARGIN + 150, y);
    y += 18;
  });

  // Disclaimer
  y = 440;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(MARGIN, y, CONTENT_W, 50, 4, 4, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA DE CONFIDENCIALIDAD', MARGIN + 16, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Este documento refleja el estado exacto del dashboard al momento de la exportación.',
    MARGIN + 16,
    y + 34,
  );

  // Index
  y = 520;
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Contenido del Reporte', MARGIN, y);
  y += 6;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(2);
  doc.line(MARGIN, y, MARGIN + 80, y);
  y += 18;

  doc.setFontSize(10);
  const sections = ['KPIs Principales', 'Gráficos y Métricas', 'Resumen Consolidado'];
  sections.forEach((s, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${i + 1}.  ${s}`, MARGIN + 8, y);
    y += 16;
  });
}

/* ── Summary / Totals page ────────────────────────────────────────── */

function drawSummary(doc, reportDefinitions, selectedReports, reportData) {
  doc.addPage();
  let y = MARGIN;
  y = sectionBanner(doc, 'Resumen Consolidado', y);

  const selectedDefs = reportDefinitions.filter((r) => selectedReports[r.id]);

  // Collect key metrics from each report
  const summaryRows = [];
  selectedDefs.forEach((def) => {
    const d = reportData[def.id];
    if (!d || d.error) {
      summaryRows.push({ name: def.name, metric: '-', color: def.color });
      return;
    }
    let metric = '';
    if (d.current !== undefined) metric = `${d.current}%`;
    else if (d.promedio !== undefined) metric = `${d.promedio}`;
    else if (d.total !== undefined) metric = fmtNum(d.total);
    else if (d.tasaCobro !== undefined) metric = `${d.tasaCobro}%`;
    else if (Array.isArray(d.chartData) && d.chartData.length > 0) {
      const keys = Object.keys(d.chartData[0]);
      const numKey = keys.find((k) => typeof d.chartData[0][k] === 'number');
      if (numKey) {
        const sum = d.chartData.reduce((a, r) => a + (Number(r[numKey]) || 0), 0);
        metric = fmtNum(sum);
      } else {
        metric = `${d.chartData.length} registros`;
      }
    } else {
      metric = '-';
    }
    summaryRows.push({ name: def.name, metric, color: def.color });
  });

  // Draw summary table
  const COL1 = MARGIN;
  const COL2 = MARGIN + CONTENT_W * 0.65;
  const ROW_H = 28;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(COL1, y, CONTENT_W, ROW_H, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Reporte', COL1 + 10, y + 18);
  doc.text('Métrica Principal', COL2, y + 18);
  y += ROW_H;

  summaryRows.forEach((row, i) => {
    if (y > A4_H - 80) {
      doc.addPage();
      y = MARGIN;
    }
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(COL1, y, CONTENT_W, ROW_H, 'F');
    }
    // Colour dot
    const [r, g, b] = hexToRgb(row.color);
    doc.setFillColor(r, g, b);
    doc.circle(COL1 + 12, y + ROW_H / 2, 4, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(row.name, COL1 + 22, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(row.metric, COL2, y + 18);
    y += ROW_H;
  });

  // Totals bar
  y += 12;
  doc.setFillColor(...ACCENT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 36, 4, 4, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de reportes analizados: ${summaryRows.length}`, MARGIN + 16, y + 22);
  doc.text(
    `Exportado: ${nowStr()}`,
    A4_W - MARGIN - 16,
    y + 22,
    { align: 'right' },
  );
}

/* ── Hex colour helper ────────────────────────────────────────────── */

function hexToRgb(hex) {
  const h = (hex || '#888888').replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/* ── Image → PDF placement with smart grouping ────────────────────── */

/**
 * Place captured chart images into the PDF, fitting 2 per page when
 * possible. If a single image is taller than the usable area it gets
 * a full page and is scaled to fit (never cropped).
 */
function placeCharts(doc, captures) {
  let y = MARGIN;
  let needsNewPage = true;

  for (let i = 0; i < captures.length; i++) {
    const { imgData, imgW, imgH, label } = captures[i];

    const bannerH = 34;
    const neededH = bannerH + imgH + 12;

    // Does it fit on the current page?
    const spaceLeft = needsNewPage ? USABLE_H : USABLE_H - (y - MARGIN);

    if (needsNewPage || neededH > spaceLeft) {
      doc.addPage();
      y = MARGIN;
      needsNewPage = false;
    }

    y = sectionBanner(doc, label, y);

    if (imgH > USABLE_H - bannerH) {
      // Scale down to fit one page
      const scaleFactor = (USABLE_H - bannerH) / imgH;
      const scaledW = imgW * scaleFactor;
      const scaledH = imgH * scaleFactor;
      const xOffset = MARGIN + (CONTENT_W - scaledW) / 2;
      doc.addImage(imgData, 'PNG', xOffset, y, scaledW, scaledH);
      y += scaledH + 12;
    } else {
      doc.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
      y += imgH + 12;
    }

    // Check if next chart could fit below (grouping 2 per page)
    const remaining = USABLE_H - (y - MARGIN);
    if (remaining < 180) {
      needsNewPage = true;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════ *
 *  PUBLIC API                                                        *
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Export the active dashboard to a professional PDF document.
 *
 * @param {Object}        config
 * @param {HTMLElement}   config.kpiContainer       - DOM ref to KPI cards section
 * @param {HTMLElement[]} config.chartElements       - DOM refs to each chart card
 * @param {Array}         config.reportDefinitions   - REPORT_DEFINITIONS array
 * @param {Object}        config.selectedReports     - { reportId: boolean }
 * @param {Object}        config.reportData          - { reportId: data }
 * @param {number}        config.year
 * @param {number}        config.month
 * @param {string}        [config.type='manual']
 * @param {string}        [config.userName]           - Display name of exporting user
 * @param {Function}      [config.onProgress]         - (0-100) progress callback
 * @returns {Promise<{ blob: Blob, reportId: string, period: string }>}
 */
export async function exportDashboardToPDF(config) {
  const {
    kpiContainer,
    chartElements = [],
    reportDefinitions = [],
    selectedReports = {},
    reportData = {},
    year,
    month,
    type = 'manual',
    userName = '',
    onProgress,
  } = config;

  const reportId = uid();
  const period = `${year}-${String(month).padStart(2, '0')}`;
  const timestamp = nowStr();

  const progress = (pct) => {
    if (typeof onProgress === 'function') onProgress(Math.round(pct));
  };

  progress(5);

  /* ── 1. Init PDF & cover ──────────────────────────────────────── */
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });

  const selectedIds = Object.entries(selectedReports)
    .filter(([, v]) => v)
    .map(([id]) => id);

  drawCover(doc, {
    year,
    month,
    type,
    reportId,
    selectedCount: selectedIds.length,
    totalCount: reportDefinitions.length,
    userName,
  });

  progress(10);

  /* ── 2. Capture KPIs ──────────────────────────────────────────── */
  if (kpiContainer) {
    const kpiCanvas = await capture(kpiContainer);
    const kpiImg = kpiCanvas.toDataURL('image/png');
    const kpiW = CONTENT_W;
    const kpiH = kpiW * (kpiCanvas.height / kpiCanvas.width);

    doc.addPage();
    let y = MARGIN;
    y = sectionBanner(doc, 'KPIs Principales', y);
    doc.addImage(kpiImg, 'PNG', MARGIN, y, kpiW, Math.min(kpiH, USABLE_H - 40));
  }

  progress(20);

  /* ── 3. Capture each chart card ───────────────────────────────── */
  const validEls = chartElements.filter(Boolean);
  const captures = [];

  for (let i = 0; i < validEls.length; i++) {
    const el = validEls[i];
    try {
      const canvas = await capture(el);
      const imgData = canvas.toDataURL('image/png');
      const imgW = CONTENT_W;
      const imgH = imgW * (canvas.height / canvas.width);
      const defId = el.dataset?.reportId;
      const def = reportDefinitions.find((r) => r.id === defId);
      captures.push({ imgData, imgW, imgH, label: def?.name || `Reporte ${i + 1}` });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to capture chart ${el.dataset?.reportId}:`, err);
    }
    progress(20 + ((i + 1) / validEls.length) * 55);
  }

  /* ── 4. Place charts with smart grouping ──────────────────────── */
  placeCharts(doc, captures);

  progress(80);

  /* ── 5. Summary / Totals page ─────────────────────────────────── */
  drawSummary(doc, reportDefinitions, selectedReports, reportData);

  progress(90);

  /* ── 6. Footers on every page ─────────────────────────────────── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    footer(doc, i, totalPages, reportId, timestamp);
  }

  progress(95);

  /* ── 7. Output ────────────────────────────────────────────────── */
  const blob = doc.output('blob');
  progress(100);

  return { blob, reportId, period };
}

export default exportDashboardToPDF;
