const sharp = require('sharp');

const FORMAT_OPTIONS = {
  png: { quality: 100 },
  jpeg: { quality: 92, mozjpeg: true },
  webp: { quality: 90 },
};

/**
 * Render a watermarked image at original resolution using Sharp.
 *
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Buffer} watermarkBuffer - Watermark asset buffer (PNG or SVG)
 * @param {Object} config - Watermark placement configuration from the frontend canvas
 * @param {string} [outputFormat='png'] - Output format: png, jpeg, webp
 * @returns {Promise<{buffer: Buffer, width: number, height: number, format: string}>}
 *
 * config shape:
 * {
 *   mode: 'single' | 'pattern',
 *   // For single mode:
 *   left: number,     // px from left edge (at original resolution)
 *   top: number,      // px from top edge
 *   width: number,    // watermark width in px at original resolution
 *   height: number,   // watermark height in px at original resolution
 *   angle: number,    // rotation in degrees
 *   opacity: number,  // 0-1
 *   // For pattern mode:
 *   patternSpacingX: number, // horizontal gap between tiles
 *   patternSpacingY: number, // vertical gap between tiles
 *   patternAngle: number,
 *   patternOpacity: number,
 *   patternScale: number,    // scale factor relative to image width
 * }
 */
async function renderWatermark(imageBuffer, watermarkBuffer, config = {}, outputFormat = 'png') {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const imgW = meta.width;
  const imgH = meta.height;

  const mode = config.mode || 'single';
  const opacity = Math.max(0, Math.min(1, config.opacity != null ? config.opacity : 1));

  let composites = [];

  if (mode === 'pattern') {
    composites = await buildPatternComposites(watermarkBuffer, imgW, imgH, config);
  } else {
    composites = await buildSingleComposite(watermarkBuffer, imgW, imgH, config);
  }

  if (composites.length === 0) {
    // No watermark to apply, return original in requested format
    const fmt = FORMAT_OPTIONS[outputFormat] ? outputFormat : 'png';
    const result = await image.toFormat(fmt, FORMAT_OPTIONS[fmt] || {}).toBuffer({ resolveWithObject: true });
    return { buffer: result.data, width: imgW, height: imgH, format: fmt };
  }

  const fmt = FORMAT_OPTIONS[outputFormat] ? outputFormat : 'png';
  const result = await image
    .composite(composites)
    .toFormat(fmt, FORMAT_OPTIONS[fmt] || {})
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: fmt,
  };
}

async function buildSingleComposite(watermarkBuffer, imgW, imgH, config) {
  const opacity = Math.max(0, Math.min(1, config.opacity != null ? config.opacity : 1));
  const angle = config.angle || 0;
  const ww = Math.round(config.width || imgW * 0.2);
  const wh = Math.round(config.height || imgW * 0.2);
  const left = Math.round(config.left || 0);
  const top = Math.round(config.top || 0);

  let wmBuf = await prepareWatermark(watermarkBuffer, ww, wh, opacity, angle);

  // Clamp position so composite doesn't go out of bounds causing Sharp errors
  const wmMeta = await sharp(wmBuf).metadata();
  const clampedLeft = Math.max(0, Math.min(left, imgW - (wmMeta.width || 1)));
  const clampedTop = Math.max(0, Math.min(top, imgH - (wmMeta.height || 1)));

  return [{
    input: wmBuf,
    left: clampedLeft,
    top: clampedTop,
  }];
}

async function buildPatternComposites(watermarkBuffer, imgW, imgH, config) {
  const opacity = Math.max(0, Math.min(1, config.patternOpacity != null ? config.patternOpacity : (config.opacity != null ? config.opacity : 0.3)));
  const angle = config.patternAngle != null ? config.patternAngle : (config.angle || -30);
  const scale = config.patternScale || 0.12;
  const spacingX = config.patternSpacingX || Math.round(imgW * 0.25);
  const spacingY = config.patternSpacingY || Math.round(imgH * 0.25);

  const tileW = Math.round(imgW * scale);
  const tileH = Math.round(imgW * scale);

  let wmBuf = await prepareWatermark(watermarkBuffer, tileW, tileH, opacity, angle);
  const wmMeta = await sharp(wmBuf).metadata();
  const tW = wmMeta.width || tileW;
  const tH = wmMeta.height || tileH;

  const composites = [];
  // Extend grid bounds to cover rotation overflow
  const margin = Math.max(tW, tH);
  for (let y = -margin; y < imgH + margin; y += spacingY) {
    for (let x = -margin; x < imgW + margin; x += spacingX) {
      const left = Math.round(x);
      const top = Math.round(y);
      // Only add if at least partially visible
      if (left + tW > 0 && left < imgW && top + tH > 0 && top < imgH) {
        // Clamp
        const cl = Math.max(0, left);
        const ct = Math.max(0, top);
        // If clamped, we need to crop the watermark tile
        if (cl !== left || ct !== top || cl + tW > imgW || ct + tH > imgH) {
          const cropLeft = cl - left;
          const cropTop = ct - top;
          const cropW = Math.min(tW - cropLeft, imgW - cl);
          const cropH = Math.min(tH - cropTop, imgH - ct);
          if (cropW > 0 && cropH > 0) {
            const cropped = await sharp(wmBuf).extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH }).toBuffer();
            composites.push({ input: cropped, left: cl, top: ct });
          }
        } else {
          composites.push({ input: wmBuf, left: cl, top: ct });
        }
      }
    }
  }
  return composites;
}

async function prepareWatermark(buffer, width, height, opacity, angle) {
  let wm = sharp(buffer).resize(width, height, { fit: 'inside', withoutEnlargement: false });

  // Apply opacity via alpha channel manipulation
  if (opacity < 1) {
    wm = wm.ensureAlpha();
    const buf = await wm.raw().toBuffer({ resolveWithObject: true });
    const { data, info } = buf;
    const pixels = new Uint8Array(data);
    // Multiply existing alpha by opacity
    for (let i = 3; i < pixels.length; i += 4) {
      pixels[i] = Math.round(pixels[i] * opacity);
    }
    wm = sharp(Buffer.from(pixels), { raw: { width: info.width, height: info.height, channels: 4 } }).png();
  }

  let result = await wm.toBuffer();

  // Apply rotation if needed
  if (angle && angle !== 0) {
    result = await sharp(result)
      .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
  }

  return result;
}

/**
 * Generate a low-res preview thumbnail from a MinIO image buffer.
 */
async function generateThumbnail(buffer, maxWidth = 400) {
  return sharp(buffer)
    .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}

module.exports = {
  renderWatermark,
  generateThumbnail,
  FORMAT_OPTIONS,
};
