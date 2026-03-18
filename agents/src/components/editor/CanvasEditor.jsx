import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { PRESETS } from './editorConstants';

let fabricModule = null;
const loadFabric = async () => {
  if (fabricModule) return fabricModule;
  const mod = await import('fabric');
  fabricModule = mod.fabric || mod;
  return fabricModule;
};

const CanvasEditor = forwardRef(({ accentColor, onOriginalMeta }, ref) => {
  const canvasElRef = useRef(null);
  const containerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const bgImageRef = useRef(null);
  const wmObjectRef = useRef(null);
  const wmTilesRef = useRef([]);
  const canvasRatioRef = useRef(1);
  const cachedWmImageRef = useRef(null);
  const cachedWmUrlRef = useRef(null);

  useEffect(() => () => {
    if (fabricCanvasRef.current) {
      try { fabricCanvasRef.current.dispose(); } catch (e) { /* ignore */ }
      fabricCanvasRef.current = null;
    }
  }, []);

  const getOrCreateCanvas = useCallback(async () => {
    const F = await loadFabric();
    if (fabricCanvasRef.current) return { canvas: fabricCanvasRef.current, F };
    const el = canvasElRef.current;
    if (!el) return { canvas: null, F };
    const canvas = new F.Canvas(el, {
      backgroundColor: '#1a1a1a',
      selection: false,
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = canvas;
    return { canvas, F };
  }, []);

  const clearWatermark = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (wmObjectRef.current) {
      canvas.remove(wmObjectRef.current);
      wmObjectRef.current = null;
    }
    wmTilesRef.current.forEach((tile) => { try { canvas.remove(tile); } catch (_e) { /* noop */ } });
    wmTilesRef.current = [];
  }, []);

  const loadCachedWmImage = useCallback(async (url, F) => {
    if (cachedWmUrlRef.current === url && cachedWmImageRef.current) {
      return cachedWmImageRef.current;
    }
    return new Promise((resolve) => {
      F.Image.fromURL(url, (img) => {
        if (img) {
          cachedWmImageRef.current = img;
          cachedWmUrlRef.current = url;
        }
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });
  }, []);

  const doApplyPattern = useCallback((canvas, F, sourceImg, cW, cH, ratio, props) => {
    const { opacity = 0.3, scale = 0.2, rotation = -30, patternSpacing = 200 } = props || {};
    const tileSize = cW * scale * 0.5;
    const aspect = sourceImg.width / sourceImg.height;
    const tw = tileSize;
    const th = tw / aspect;
    const gap = patternSpacing * ratio;

    const tiles = [];
    const counter = { value: 0 };
    const onCloned = (cx, cy, clonedTile) => {
      clonedTile.set({
        left: cx,
        top: cy,
        scaleX: tw / clonedTile.width,
        scaleY: th / clonedTile.height,
        opacity,
        angle: rotation || -30,
        selectable: false,
        evented: false,
      });
      canvas.add(clonedTile);
      tiles.push(clonedTile);
      counter.value -= 1;
      if (counter.value === 0) canvas.renderAll();
    };
    for (let y = -th; y < cH + th; y += gap) {
      for (let x = -tw; x < cW + tw; x += gap) {
        counter.value += 1;
        const cx = x;
        const cy = y;
        sourceImg.clone((clonedTile) => onCloned(cx, cy, clonedTile));
      }
    }
    wmTilesRef.current = tiles;
  }, []);

  useImperativeHandle(ref, () => ({
    async loadImage(url) {
      const { canvas, F } = await getOrCreateCanvas();
      if (!canvas || !F) return false;
      canvas.clear();
      canvas.setBackgroundColor('#1a1a1a', canvas.renderAll.bind(canvas));
      clearWatermark();
      bgImageRef.current = null;
      cachedWmImageRef.current = null;
      cachedWmUrlRef.current = null;

      // Wait for container to have real layout dimensions
      const getContainerSize = () => new Promise((res) => {
        const check = (tries) => {
          const c = containerRef.current;
          if (c && c.clientWidth > 50 && c.clientHeight > 50) {
            res({ w: c.clientWidth, h: c.clientHeight });
          } else if (tries > 0) {
            requestAnimationFrame(() => check(tries - 1));
          } else {
            res({ w: 800, h: 600 });
          }
        };
        check(30);
      });

      const { w: containerW, h: containerH } = await getContainerSize();

      return new Promise((resolve) => {
        F.Image.fromURL(url, (fabricImg) => {
          if (!fabricImg) { resolve(false); return; }
          const maxW = Math.max(containerW - 40, 200);
          const maxH = Math.max(containerH - 40, 200);
          const imgW = fabricImg.width;
          const imgH = fabricImg.height;
          if (onOriginalMeta) onOriginalMeta({ width: imgW, height: imgH });

          const ratio = Math.min(maxW / imgW, maxH / imgH, 1);
          canvasRatioRef.current = ratio;
          const cW = Math.max(Math.round(imgW * ratio), 1);
          const cH = Math.max(Math.round(imgH * ratio), 1);

          canvas.setWidth(cW);
          canvas.setHeight(cH);
          fabricImg.set({
            left: 0,
            top: 0,
            scaleX: ratio,
            scaleY: ratio,
            selectable: false,
            evented: false,
            hoverCursor: 'default',
          });
          canvas.add(fabricImg);
          bgImageRef.current = fabricImg;
          canvas.renderAll();
          resolve(true);
        }, { crossOrigin: 'anonymous' });
      });
    },

    async addWatermark(wmUrl, props) {
      const { canvas, F } = await getOrCreateCanvas();
      if (!canvas || !F || !bgImageRef.current) return;
      clearWatermark();

      const cW = canvas.getWidth();
      const cH = canvas.getHeight();
      const ratio = canvasRatioRef.current;
      const { preset = 'bottom-right', opacity = 0.7, scale = 0.2, rotation = 0, margin = 20, lockAspect = true } = props || {};

      const sourceImg = await loadCachedWmImage(wmUrl, F);
      if (!sourceImg) return;

      if (preset === 'pattern') {
        doApplyPattern(canvas, F, sourceImg, cW, cH, ratio, props);
        return;
      }

      const wmW = cW * scale;
      const aspect = sourceImg.width / sourceImg.height;
      const wmH = wmW / aspect;

      const presetDef = PRESETS.find((p) => p.id === preset) || PRESETS[7];
      const pos = presetDef.getPos(cW, cH, wmW, wmH, margin * ratio);

      const cloneImg = await new Promise((resolve) => { sourceImg.clone((c) => resolve(c)); });
      cloneImg.set({
        left: pos.left || 0,
        top: pos.top || 0,
        scaleX: wmW / cloneImg.width,
        scaleY: wmH / cloneImg.height,
        opacity,
        angle: pos.angle || rotation,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: accentColor || '#007AFF',
        cornerStyle: 'circle',
        cornerSize: 10,
        transparentCorners: false,
        borderColor: accentColor || '#007AFF',
        lockUniScaling: lockAspect,
      });
      canvas.add(cloneImg);
      canvas.setActiveObject(cloneImg);
      wmObjectRef.current = cloneImg;
      canvas.renderAll();
    },

    updateWatermarkProps(props) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const { preset, opacity, scale, rotation, margin, lockAspect } = props;
      const isPattern = preset === 'pattern';

      if (isPattern) {
        wmTilesRef.current.forEach((tile) => {
          if (opacity != null) tile.set('opacity', opacity);
          if (rotation != null) tile.set('angle', rotation);
          // eslint-disable-next-line no-param-reassign
          tile.dirty = true;
          tile.setCoords();
        });
        canvas.renderAll();
        return;
      }

      const wmObj = wmObjectRef.current;
      if (!wmObj) return;

      const cW = canvas.getWidth();
      const cH = canvas.getHeight();
      const ratio = canvasRatioRef.current;

      if (opacity != null) wmObj.set('opacity', opacity);
      if (rotation != null) wmObj.set('angle', rotation);
      if (lockAspect != null) wmObj.set('lockUniScaling', lockAspect);

      if (scale != null) {
        const cachedImg = cachedWmImageRef.current;
        if (cachedImg) {
          const wmW = cW * scale;
          const aspect = cachedImg.width / cachedImg.height;
          const wmH = wmW / aspect;
          wmObj.set('scaleX', wmW / wmObj.width);
          wmObj.set('scaleY', wmH / wmObj.height);
        }
      }

      if (preset && preset !== 'custom') {
        const presetDef = PRESETS.find((p) => p.id === preset);
        if (presetDef && presetDef.id !== 'pattern') {
          const cachedImg = cachedWmImageRef.current;
          const sc = scale || 0.2;
          const wmW = cW * sc;
          const aspect = cachedImg ? cachedImg.width / cachedImg.height : 1;
          const wmH = wmW / aspect;
          const m = (margin != null ? margin : 20) * ratio;
          const pos = presetDef.getPos(cW, cH, wmW, wmH, m);
          if (pos.left != null) wmObj.set('left', pos.left);
          if (pos.top != null) wmObj.set('top', pos.top);
          if (pos.angle != null) wmObj.set('angle', pos.angle);
        }
      }

      wmObj.dirty = true;
      wmObj.setCoords();
      canvas.renderAll();
    },

    needsFullRebuild(prevPreset, newPreset) {
      const wasPattern = prevPreset === 'pattern';
      const isPattern = newPreset === 'pattern';
      return wasPattern !== isPattern;
    },

    getWatermarkConfig(/* origMeta */) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      const ratio = canvasRatioRef.current;
      const cW = canvas.getWidth();

      if (wmTilesRef.current.length > 0) {
        const tile = wmTilesRef.current[0];
        return {
          mode: 'pattern',
          patternOpacity: tile ? tile.opacity : 0.3,
          patternAngle: tile ? tile.angle : -30,
          patternScale: tile ? ((tile.scaleX * tile.width) / (cW / ratio)) * 2 : 0.12,
          patternSpacingX: 200,
          patternSpacingY: 200,
        };
      }

      const wmObj = wmObjectRef.current;
      if (!wmObj) return null;

      return {
        mode: 'single',
        left: Math.round(wmObj.left / ratio),
        top: Math.round(wmObj.top / ratio),
        width: Math.round((wmObj.width * wmObj.scaleX) / ratio),
        height: Math.round((wmObj.height * wmObj.scaleY) / ratio),
        angle: wmObj.angle || 0,
        opacity: wmObj.opacity || 1,
      };
    },

    clearCanvas() {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      canvas.clear();
      canvas.setBackgroundColor('#1a1a1a', canvas.renderAll.bind(canvas));
      bgImageRef.current = null;
      wmObjectRef.current = null;
      wmTilesRef.current = [];
      cachedWmImageRef.current = null;
      cachedWmUrlRef.current = null;
    },

    hasWatermark() {
      return !!(wmObjectRef.current || wmTilesRef.current.length > 0);
    },

    hasBgImage() {
      return !!bgImageRef.current;
    },
  }), [getOrCreateCanvas, clearWatermark, loadCachedWmImage, doApplyPattern, accentColor, onOriginalMeta]);

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: 300 }}>
      <canvas ref={canvasElRef} />
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';
export default CanvasEditor;
