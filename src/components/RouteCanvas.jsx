import { useEffect, useRef, useState, useCallback } from 'react';

// The Imgur direct image link (converted from album to direct image)
// The field image is 820x455 — we keep that aspect ratio for the canvas
const FIELD_IMG_SRC = 'https://i.imgur.com/2Y5cLE6.jpeg';
const CANVAS_W = 820;
const CANVAS_H = 350;
const ROUTE_COLORS = ['#22d3ee', '#f43f5e', '#a3e635', '#fb923c', '#a78bfa'];

export default function RouteCanvas({ value = [], onChange }) {
  const canvasRef   = useRef(null);
  const drawing     = useRef(false);
  const currentPath = useRef([]);
  const fieldImg    = useRef(null);
  const [paths, setPaths]     = useState(Array.isArray(value) ? value : []);
  const [imgReady, setImgReady] = useState(false);

  // Sync internal state with value prop (for edit mode)
  useEffect(() => {
    setPaths(Array.isArray(value) ? value : []);
  }, [value]);

  // Draw fallback background immediately on mount (before image loads)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = CANVAS_W, H = CANVAS_H;
    // Draw dark background with grid immediately
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2d3f55';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }, []);

  // Load the field image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { fieldImg.current = img; setImgReady(true); };
    img.onerror = () => { fieldImg.current = null; setImgReady(true); }; // fallback to dark bg
    img.src = FIELD_IMG_SRC;
  }, []);

  // Redraw whenever paths or image change
  useEffect(() => {
    if (!imgReady) return;
    drawAll(canvasRef.current, paths, fieldImg.current);
  }, [paths, imgReady]);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }, []);

  const onStart = (e) => {
    e.preventDefault();
    drawing.current = true;
    currentPath.current = [getPos(e)];
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    currentPath.current.push(getPos(e));
    // Live preview: redraw with in-progress stroke
    const canvas = canvasRef.current;
    drawAll(canvas, paths, fieldImg.current);
    if (currentPath.current.length >= 2) {
      const ctx = canvas.getContext('2d');
      const color = ROUTE_COLORS[paths.length % ROUTE_COLORS.length];
      ctx.beginPath();
      ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y);
      currentPath.current.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
  const onEnd = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPath.current.length > 3) {
      const next = [...paths, [...currentPath.current]];
      setPaths(next);
      onChange(next);
    }
    currentPath.current = [];
  };

  const clear = () => { setPaths([]); onChange([]); };
  const undoLast = () => {
    const next = paths.slice(0, -1);
    setPaths(next);
    onChange(next);
  };

  return (
    <div className="route-canvas-outer">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        style={{
          cursor: 'crosshair',
          borderRadius: 10,
          display: 'block',
          width: '100%',
          height: 'auto',
          touchAction: 'none',
          border: '1px solid #1e293b',
          backgroundColor: '#1a2332',
        }}
      />
      <div className="route-canvas-controls">
        <button className="canvas-clear-btn" onClick={undoLast} disabled={paths.length === 0}>
          ↩ Undo
        </button>
        <button className="canvas-clear-btn" onClick={clear} disabled={paths.length === 0}>
          🗑 Clear All
        </button>
        <span className="route-canvas-label">
          {paths.length === 0
            ? 'Draw routes on the field'
            : `${paths.length} route${paths.length !== 1 ? 's' : ''} drawn`}
        </span>
      </div>
    </div>
  );
}

function drawAll(canvas, paths, img) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = CANVAS_W, H = CANVAS_H;

  // Ensure paths is an array
  const safePaths = Array.isArray(paths) ? paths : [];

  ctx.clearRect(0, 0, W, H);

  if (img) {
    // Draw field image as background
    ctx.drawImage(img, 0, 0, W, H);
    // Slight dark overlay so routes pop
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Fallback dark background with grid
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2d3f55';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // Draw paths
  safePaths.forEach((path, i) => {
    if (!path || path.length < 2) return;
    const color = ROUTE_COLORS[i % ROUTE_COLORS.length];

    // Shadow for visibility
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Start dot
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Route number label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, path[0].x, path[0].y);
  });
}

// Export CANVAS_W/H so ViewingPage can use same coordinate space
export { CANVAS_W, CANVAS_H };