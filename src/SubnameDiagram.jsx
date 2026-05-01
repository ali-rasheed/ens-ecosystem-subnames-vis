// SubnameDiagram.jsx
// Spatial visualizations of subname registration counts across ENS parent names.
// Vite: palette + WebGL tile come from modules instead of window.*.

import React from 'react';
import { ENS } from './palette.js';
import { PATTERNS } from './shader-source.js';
import { ShaderCanvas } from './ShaderCanvas.jsx';
// Views, all driven by the same data array:
//   - treemap: area-proportional tiles
//   - packed:  circle-packing, area = count
//   - bars:    horizontal proportional bars, ordered desc

/** Map a swatch hex to ShaderCanvas state (treemap, bubbles, bars share this). */
function getShaderStateForColor(hex, darkInk, idx, minDim, opts = {}) {
  const { rectAspect = 1, cornerRadius = 0.18, animationSpeed = 0.28 } = opts;
  const normalizeHex = (v) => (v || '').trim().toUpperCase();
  const color = normalizeHex(hex);
  const directMap = {
    '#02293B': { palette: 2, warpShade: 0, weftShade: 1, bgShade: 2 },
    '#0082BB': { palette: 2, warpShade: 1, weftShade: 3, bgShade: 2 },
    '#39B4EA': { palette: 2, warpShade: 3, weftShade: 1, bgShade: 2 },
    '#80C4E0': { palette: 2, warpShade: 3, weftShade: 2, bgShade: 2 },
    '#033010': { palette: 3, warpShade: 0, weftShade: 1, bgShade: 2 },
    '#007C20': { palette: 3, warpShade: 1, weftShade: 3, bgShade: 2 },
    '#1CBF46': { palette: 3, warpShade: 3, weftShade: 1, bgShade: 2 },
    '#5A0024': { palette: 1, warpShade: 0, weftShade: 1, bgShade: 2 },
    '#E72A96': { palette: 1, warpShade: 1, weftShade: 3, bgShade: 2 },
    '#F569AB': { palette: 1, warpShade: 3, weftShade: 1, bgShade: 2 },
    '#441B03': { palette: 0, warpShade: 0, weftShade: 1, bgShade: 2 },
    '#984D1B': { palette: 0, warpShade: 1, weftShade: 3, bgShade: 2 },
    '#E7A259': { palette: 0, warpShade: 3, weftShade: 1, bgShade: 2 },
    '#191919': { palette: 4, warpShade: 0, weftShade: 1, bgShade: 2 },
    '#737373': { palette: 4, warpShade: 3, weftShade: 1, bgShade: 2 },
    '#595755': { palette: 4, warpShade: 1, weftShade: 3, bgShade: 2 },
    '#E1E1E0': { palette: 4, warpShade: 2, weftShade: 3, bgShade: 2 },
    '#FAF9F7': { palette: 4, warpShade: 2, weftShade: 3, bgShade: 2 },
    '#FFEC3D': { palette: 0, warpShade: 3, weftShade: 1, bgShade: 2 },
  };
  const mapped = directMap[color] || { palette: 2, warpShade: 1, weftShade: 3, bgShade: 2 };
  return {
    pattern: idx % (PATTERNS?.length || 1),
    palette: mapped.palette,
    bgShade: mapped.bgShade,
    warpShade: mapped.warpShade,
    weftShade: mapped.weftShade,
    gridSize: Math.max(16, Math.min(96, Math.round(minDim * 0.12))),
    rectAspect,
    cornerRadius,
    animationSpeed,
    gradSteps: 0,
    shimmer: !darkInk && idx % 3 === 0,
    skipEntranceReveal: true,
  };
}

// ─────────────────────────────────────────────────────────────
// Packed circle layout — front-loaded greedy packing
// Place largest first at center, then each subsequent circle in a
// position that touches two existing circles (Apollonian-style).
// Simple and deterministic.
// ─────────────────────────────────────────────────────────────
function packCircles(items, W, H) {
  // items: [{ key, count, color, ... }] presorted by count desc
  if (items.length === 0) return [];
  const total = items.reduce((s, x) => s + x.count, 0);
  if (total === 0) return items.map(it => ({ ...it, x: W / 2, y: H / 2, r: 0 }));

  // Pick a target maximum radius based on smaller viewport dim, then
  // derive radii from sqrt(count) — area-proportional.
  const maxDim = Math.min(W, H);
  const maxR = maxDim * 0.36;
  const maxCount = items[0].count;
  const radii = items.map(it => Math.sqrt(it.count / maxCount) * maxR);
  // Floor — keep tiny entries visible
  const floorR = Math.max(18, maxDim * 0.035);
  const finalR = radii.map(r => Math.max(r, floorR));

  const placed = [];
  const cx = W / 2, cy = H / 2;

  // First circle at center
  placed.push({ ...items[0], r: finalR[0], x: cx, y: cy });

  for (let i = 1; i < items.length; i++) {
    const r = finalR[i];
    let best = null, bestScore = Infinity;

    // Candidate positions: tangent to each pair of placed circles
    const tryCandidate = (cxC, cyC) => {
      // reject if overlaps anything
      for (const p of placed) {
        const dx = cxC - p.x, dy = cyC - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < p.r + r - 0.5) return;
      }
      // score: closeness to centroid of placed (compactness)
      const dx = cxC - cx, dy = cyC - cy;
      const score = Math.sqrt(dx * dx + dy * dy);
      if (score < bestScore) { bestScore = score; best = { x: cxC, y: cyC }; }
    };

    // Tangent against single circle: many positions on its boundary
    for (const p of placed) {
      const targetD = p.r + r;
      const N = 36;
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2;
        tryCandidate(p.x + Math.cos(a) * targetD, p.y + Math.sin(a) * targetD);
      }
    }

    // Tangent against pairs of circles — exact two-circle intersection
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const A = placed[a], B = placed[b];
        const d1 = A.r + r, d2 = B.r + r;
        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > d1 + d2 || d < Math.abs(d1 - d2)) continue;
        const aLen = (d1 * d1 - d2 * d2 + d * d) / (2 * d);
        const hSq = d1 * d1 - aLen * aLen;
        if (hSq < 0) continue;
        const h = Math.sqrt(hSq);
        const px = A.x + (aLen * dx) / d;
        const py = A.y + (aLen * dy) / d;
        const ox = -(dy * h) / d;
        const oy = (dx * h) / d;
        tryCandidate(px + ox, py + oy);
        tryCandidate(px - ox, py - oy);
      }
    }

    if (best) placed.push({ ...items[i], r, x: best.x, y: best.y });
    else placed.push({ ...items[i], r, x: cx, y: cy + (i * 60) }); // fallback (shouldn't trigger)
  }

  // Center the cluster within the viewport
  const xs = placed.map(p => p.x);
  const ys = placed.map(p => p.y);
  const rs = placed.map(p => p.r);
  const minX = Math.min(...xs.map((x, i) => x - rs[i]));
  const maxX = Math.max(...xs.map((x, i) => x + rs[i]));
  const minY = Math.min(...ys.map((y, i) => y - rs[i]));
  const maxY = Math.max(...ys.map((y, i) => y + rs[i]));
  const bw = maxX - minX, bh = maxY - minY;
  const dx = W / 2 - (minX + bw / 2);
  const dy = H / 2 - (minY + bh / 2);
  return placed.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

// ─────────────────────────────────────────────────────────────
// PackedView — circles, area = count; woven shader like treemap (WebGL under labels).
// ─────────────────────────────────────────────────────────────
function PackedView({ items, W, H, showLabels, showCounts, total }) {
  const sorted = [...items].sort((a, b) => b.count - a.count).filter(it => it.count > 0);
  const packed = React.useMemo(() => packCircles(sorted, W, H), [JSON.stringify(sorted), W, H]);

  const fmt = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 10e6 ? 1 : 2).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 10e3 ? 0 : 1).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'K';
    return String(n);
  };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
      {packed.map((p, i) => {
        const diam = p.r * 2;
        const minDim = diam;
        const pct = total > 0 ? (p.count / total) * 100 : 0;
        const labelFits = p.r > 44;
        const fontSize = Math.max(11, Math.min(p.r * 0.22, 36));
        const countSize = Math.max(13, Math.min(p.r * 0.32, 56));
        const ink = p.darkInk ? ENS.ink : '#fff';
        const subInk = p.darkInk ? ENS.blueMid : 'rgba(255,255,255,0.78)';
        return (
          <React.Fragment key={p.key}>
            <div style={{
              position: 'absolute',
              left: p.x - p.r,
              top: p.y - p.r,
              width: diam,
              height: diam,
              borderRadius: '50%',
              overflow: 'hidden',
              background: p.color,
              boxSizing: 'border-box',
            }}>
              <div style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                minWidth: 0, minHeight: 0, overflow: 'hidden', opacity: 0.25,
              }}>
                <ShaderCanvas state={getShaderStateForColor(p.color, p.darkInk, i, minDim)} />
              </div>
              {showLabels && labelFits && (
                <div style={{
                  position: 'absolute', left: '50%', top: `calc(50% - ${showCounts ? countSize * 0.42 : 0}px)`,
                  transform: 'translate(-50%, -50%)', fontFamily: 'var(--mono)', fontWeight: 500,
                  fontSize, color: ink, pointerEvents: 'none', whiteSpace: 'nowrap', textAlign: 'center',
                }}>
                  {p.label}
                </div>
              )}
              {showCounts && labelFits && (
                <div style={{
                  position: 'absolute', left: '50%', top: `calc(50% + ${showLabels ? countSize * 0.35 : 0}px)`,
                  transform: 'translate(-50%, -50%)', fontFamily: 'var(--sans)', fontWeight: 500,
                  fontSize: countSize, color: ink, letterSpacing: -countSize * 0.025,
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>
                  {fmt(p.count)}
                </div>
              )}
              {showCounts && labelFits && p.r > 70 && (
                <div style={{
                  position: 'absolute', left: '50%', top: `calc(50% + ${showLabels ? countSize * 0.35 : 0}px + ${countSize * 0.55}px)`,
                  transform: 'translate(-50%, -50%)', fontFamily: 'var(--mono)', fontWeight: 400,
                  fontSize: fontSize * 0.7, color: subInk, pointerEvents: 'none',
                }}>
                  {pct.toFixed(1)}%
                </div>
              )}
            </div>
            {!labelFits && showLabels && (
              <div style={{
                position: 'absolute', left: p.x, top: p.y + p.r + 14, transform: 'translateX(-50%)',
                fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 11, color: ENS.blueMid,
                pointerEvents: 'none', whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                {p.label}{showCounts ? ` · ${fmt(p.count)}` : ''}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BarsView — horizontal proportional bars; shader fill like treemap (SVG grid under HTML bars).
// ─────────────────────────────────────────────────────────────
function BarsView({ items, W, H, showLabels, showCounts, total }) {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const padX = 40, padTop = 40, padBot = 60;
  const labelGutter = 120;
  const barAreaX = padX + labelGutter;
  const barAreaW = W - padX - barAreaX;
  const barAreaH = H - padTop - padBot;
  const rowH = barAreaH / Math.max(sorted.length, 1);
  const barH = Math.min(rowH * 0.66, 64);
  const max = Math.max(...sorted.map(s => s.count), 1);

  const fmt = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 10e6 ? 1 : 2).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 10e3 ? 0 : 1).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'K';
    return String(n);
  };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      >
        <line x1={barAreaX} y1={padTop} x2={barAreaX} y2={H - padBot}
          stroke={ENS.blueDark} strokeOpacity="0.15" strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const x = barAreaX + t * barAreaW;
          return (
            <g key={t}>
              <line x1={x} y1={padTop} x2={x} y2={H - padBot}
                stroke={ENS.blueDark} strokeOpacity="0.07" strokeWidth="1" strokeDasharray="2 4" />
              <text x={x} y={H - padBot + 22} textAnchor="middle"
                fontFamily="var(--mono)" fontSize="11" fill={ENS.quartz}>
                {fmt(Math.round(max * t))}
              </text>
            </g>
          );
        })}
      </svg>

      {sorted.map((it, i) => {
        const cy = padTop + rowH * i + rowH / 2;
        const bw = Math.max((it.count / max) * barAreaW, 2);
        const pct = total > 0 ? (it.count / total) * 100 : 0;
        const minDim = Math.min(bw, barH);
        const ra = Math.max(0.2, Math.min(8, bw / Math.max(barH, 1)));
        return (
          <React.Fragment key={it.key}>
            {showLabels && (
              <div style={{
                position: 'absolute',
                left: padX,
                width: barAreaX - padX - 16,
                top: cy - 8,
                textAlign: 'right',
                fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 15, color: ENS.ink,
                pointerEvents: 'none', zIndex: 2, lineHeight: 1.2,
              }}>
                {it.label}
              </div>
            )}
            <div style={{
              position: 'absolute',
              left: barAreaX,
              top: cy - barH / 2,
              width: bw,
              height: barH,
              borderRadius: 2,
              overflow: 'hidden',
              background: it.color,
              zIndex: 1,
              boxSizing: 'border-box',
            }}>
              <div style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                minWidth: 0, minHeight: 0, overflow: 'hidden', opacity: 0.25,
              }}>
                <ShaderCanvas
                  state={getShaderStateForColor(it.color, it.darkInk, i, minDim, {
                    rectAspect: ra,
                    cornerRadius: 0.06,
                  })}
                />
              </div>
            </div>
            {showCounts && (
              <div style={{
                position: 'absolute',
                left: barAreaX + bw + 12,
                top: cy - barH / 2,
                height: barH,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2,
              }}>
                <div style={{
                  fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 22, color: ENS.ink, letterSpacing: -0.4,
                }}>
                  {fmt(it.count)}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontWeight: 400, fontSize: 11, color: ENS.quartz, marginTop: 2,
                }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TreemapView — squarified treemap. Rectangles, area = count.
// Outer tile corners use a fixed CSS radius (clamped by the browser when rects are tiny).
const TREEMAP_TILE_RADIUS_PX = 12;
/** Must match tile `border` width — markers sit in the padding box; `rw`/`rh` are border-box sizes. */
const TREEMAP_TILE_BORDER_PX = 4;
// Each rect gets a shader-inspired woven texture background,
// plus corner markers and big numerals + serif italic label.
// Visual reference: ENS Ecosystem Names Graphic.
// Gutters: avoid a large fixed px inset — it steals more relative area from small tiles than
// from large ones and skews perceived value ratios. Use a 1px inner hairline + full squarify geometry.
// ─────────────────────────────────────────────────────────────

// Squarified treemap algorithm (Bruls et al, 2000) — produces
// nicely-proportioned rectangles instead of long slivers.
function squarify(items, x, y, w, h) {
  // items: [{ key, count, ... }] sorted desc
  if (items.length === 0) return [];
  const total = items.reduce((s, it) => s + it.count, 0);
  if (total === 0) return [];

  const out = [];
  const norm = items.map(it => ({ ...it, area: (it.count / total) * (w * h) }));

  const worst = (row, side) => {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const max = Math.max(...row.map(r => r.area));
    const min = Math.min(...row.map(r => r.area));
    const s2 = side * side;
    const sum2 = sum * sum;
    return Math.max((s2 * max) / sum2, sum2 / (s2 * min));
  };

  const layoutRow = (row, side, rectX, rectY, rectW, rectH, vertical) => {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const rowThickness = sum / side;
    let off = 0;
    for (const r of row) {
      const len = r.area / rowThickness;
      if (vertical) {
        out.push({ ...r, x: rectX, y: rectY + off, w: rowThickness, h: len });
      } else {
        out.push({ ...r, x: rectX + off, y: rectY, w: len, h: rowThickness });
      }
      off += len;
    }
    return rowThickness;
  };

  let cx = x, cy = y, cw = w, ch = h;
  let queue = norm.slice();

  while (queue.length) {
    const vertical = ch < cw;        // shorter side
    const side = vertical ? ch : cw;
    let row = [queue[0]];
    let i = 1;
    while (i < queue.length) {
      const trial = [...row, queue[i]];
      if (worst(trial, side) <= worst(row, side)) {
        row = trial; i++;
      } else break;
    }
    const thickness = layoutRow(row, side, cx, cy, cw, ch, vertical);
    if (vertical) { cx += thickness; cw -= thickness; }
    else { cy += thickness; ch -= thickness; }
    queue = queue.slice(row.length);
  }

  return out;
}

function TreemapView({ items, W, H, showLabels, showCounts, total }) {
  const sorted = [...items].sort((a, b) => b.count - a.count).filter(it => it.count > 0);
  const rects = React.useMemo(() => squarify(sorted, 0, 0, W, H), [JSON.stringify(sorted), W, H]);

  const fmt = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 10e6 ? 1 : 2).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 10e3 ? 0 : 1).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'K';
    return String(n);
  };

  // Per-tile shader implementation:
  // each treemap rect owns an isolated ShaderCanvas so texture animates independently.
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
      {rects.map((r, i) => {
        const rx = r.x, ry = r.y;
        const rw = Math.max(r.w, 1), rh = Math.max(r.h, 1);
        const ink = r.darkInk ? '#011a25' : '#fff';
        const subInk = r.darkInk ? 'rgba(1,26,37,0.7)' : 'rgba(255,255,255,0.85)';

        // Fit numerals to the rect: scale by min dimension
        const minDim = Math.min(rw, rh);
        const numSize = Math.max(16, Math.min(minDim * 0.32, rw * 0.22, 130));
        const labelSize = Math.max(11, Math.min(numSize * 0.42, 36));
        const labelFits = minDim > 50;

        // Corner markers — small filled squares, scale with rect (positions use inner box;
        // border-box + border otherwise shifts bottom/right corners past the padding edge).
        const markerSize = 12;
        const markerInset = Math.max(8, Math.min(minDim * 0.05, 18));
        const innerW = rw - 2 * TREEMAP_TILE_BORDER_PX;
        const innerH = rh - 2 * TREEMAP_TILE_BORDER_PX;

        return (
          <div key={r.key} style={{
            position: 'absolute', left: rx, top: ry, width: rw, height: rh, overflow: 'hidden', background: r.color,
            border: `${TREEMAP_TILE_BORDER_PX}px solid ${ENS.paper}`,
            boxSizing: 'border-box',
            borderRadius: TREEMAP_TILE_RADIUS_PX,

          }}>
            {/* Shader state is slightly varied per tile to avoid repeated texture lockstep. */}
            <div style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              minWidth: 0, minHeight: 0, overflow: 'hidden', opacity: 0.25,
            }}>
              <ShaderCanvas state={getShaderStateForColor(r.color, r.darkInk, i, minDim)} />
            </div>
            {[
              [markerInset, markerInset],
              [innerW - markerInset - markerSize, markerInset],
              [markerInset, innerH - markerInset - markerSize],
              [innerW - markerInset - markerSize, innerH - markerInset - markerSize],
            ].map(([mx, my], k) => (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: mx,
                  top: my,
                  width: markerSize,
                  height: markerSize,
                  background: ink,
                  borderRadius: 4,
                }}
              />
            ))}
            {showCounts && labelFits &&
              <div style={{
                position: 'absolute', left: '50%', top: `calc(50% - ${showLabels ? labelSize * 0.35 : 0}px)`,
                transform: 'translate(-50%, -50%)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: numSize,
                color: ink, letterSpacing: -numSize * 0.025, pointerEvents: 'none', whiteSpace: 'nowrap'
              }}>
                {fmt(r.count)}
              </div>
            }
            {showLabels && labelFits &&
              <div style={{
                position: 'absolute', left: '50%', top: `calc(50% + ${showCounts ? numSize * 0.7 : 0}px)`,
                transform: 'translate(-50%, -50%)', fontFamily: 'var(--serif)',
                // fontStyle: 'italic',
                fontWeight: 400,
                fontSize: labelSize, color: subInk, pointerEvents: 'none', whiteSpace: 'nowrap'
              }}>
                {r.label}
              </div>
            }
            {!labelFits && (showLabels || showCounts) &&
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                fontFamily: 'var(--mono)', fontSize: 11, color: ink, pointerEvents: 'none',
                textAlign: 'center', padding: '0 6px'
              }}>
                {showLabels ? r.label : ''}{showLabels && showCounts ? ' · ' : ''}{showCounts ? fmt(r.count) : ''}
              </div>
            }
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SubnameDiagram — main wrapper. Picks a view; sizes via parent.
// ─────────────────────────────────────────────────────────────
export function SubnameDiagram({ items, view, showLabels, showCounts, W, H }) {
  const total = items.reduce((s, x) => s + x.count, 0);
  const View = view === 'treemap' ? TreemapView
    : view === 'bars' ? BarsView
      : PackedView;
  return <View items={items} W={W} H={H} showLabels={showLabels} showCounts={showCounts} total={total} />;
}
