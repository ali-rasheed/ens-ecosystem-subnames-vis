// Root app: responsive stage + controls, persisted state, PNG/SVG export (2× design pixels).
// Migrated from the original inline Babel HTML prototype.

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import domtoimage from 'dom-to-image-more';
import { ENS } from './palette.js';
import { ASPECTS, DEFAULTS, STORAGE_KEY } from './constants.js';
import { SubnameDiagram } from './SubnameDiagram.jsx';
import { ControlsPanel } from './ControlsPanel.jsx';
import logoSrc from './assets/Logo.svg';

/** PNG raster + SVG `width`/`height` multiplier vs on-screen diagram (W×H). */
const EXPORT_SCALE = 2;

// Stage — fixed-size diagram surface scaled to fit the preview area.
function Stage({ children, stageRef, W, H }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const pad = 64;
      const s = Math.max(0.001, Math.min((r.width - pad) / W, (r.height - pad) / H));
      setScale(s);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [W, H]);
  return (
    <div ref={wrapRef} style={{
      flex: 1,
      minHeight: 0,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: ENS.paper,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(1,26,37,0.07) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      <div style={{ width: W * scale, height: H * scale, position: 'relative' }}>
        <div ref={stageRef} style={{
          transform: `scale(${scale})`, transformOrigin: 'top left',
          width: W, height: H, background: ENS.paper,
          boxShadow: '0 1px 0 rgba(1,26,37,0.06), 0 12px 40px rgba(1,26,37,0.06)'
        }}>
          {children}
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 18, left: 22,
        fontSize: 11, color: '#A1A1A1', letterSpacing: 1.4, textTransform: 'uppercase',
        fontWeight: 500, fontFamily: 'var(--mono)', pointerEvents: 'none'
      }}>
        {W} × {H} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

// DiagramFrame — exportable frame: title, diagram, footer.
// Layout: column flex + minHeight:0 on the chart row so the treemap always fits between header
// and footer without measuring footer height (avoids legend/treemap overlap on soft reload).
function DiagramFrame({ state, W, H }) {
  const { title, items, view, showLabels, showCounts, showLegend } = state;
  const total = items.reduce((s, x) => s + (Number(x.count) || 0), 0);
  const totalApprox = `~${(Math.round(total / 1_000_000) * 1_000_000).toLocaleString()}`;

  const base = Math.min(W, H);
  // Equal inset from the frame edge on all sides (export “post”).
  const postPad = Math.round(base * 0.06);
  const titleSize = Math.round(base * 0.058);
  const totalLabelSize = Math.round(base * 0.014);
  const totalNumSize = Math.round(base * 0.050);
  const headerGap = Math.round(base * 0.03);

  const legendSize = Math.round(base * 0.017);
  const legendCountSize = Math.round(base * 0.015);
  const swatchSize = Math.round(base * 0.018);
  const footerPadY = Math.round(base * 0.01);

  const innerW = Math.max(1, W - 2 * postPad);
  const diagWrapRef = useRef(null);
  const [diagDims, setDiagDims] = useState(() => ({
    w: innerW,
    h: Math.max(80, Math.floor((H - 2 * postPad) * 0.72)),
  }));

  useLayoutEffect(() => {
    const el = diagWrapRef.current;
    if (!el) return;
    const measure = () => {
      // clientWidth/Height = layout box inside the scaled stage. getBoundingClientRect is
      // post-transform (too small when Stage uses transform: scale), shrinking the treemap.
      const w = Math.max(1, Math.round(el.clientWidth));
      const h = Math.max(1, Math.round(el.clientHeight));
      setDiagDims((d) => (d.w === w && d.h === h ? d : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const id = requestAnimationFrame(measure);
    document.fonts?.ready?.then(measure);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [W, H, items, showLegend, title]);

  const fmt = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 10e6 ? 1 : 2).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 10e3 ? 0 : 1).replace(/\.0+$|(\.\d*?)0+$/, '$1') + 'K';
    return String(n);
  };

  return (
    <div style={{
      width: W,
      height: H,
      boxSizing: 'border-box',
      background: ENS.paper,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: postPad,
    }}>
      <div style={{
        flexShrink: 0,
        marginBottom: headerGap,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title &&
            <div style={{
              fontFamily: 'var(--sans)', fontSize: titleSize, fontWeight: 500,
              letterSpacing: -titleSize * 0.025, color: ENS.ink, lineHeight: 1.02,
              textWrap: 'pretty'
            }}>
              {title}
            </div>
          }
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: totalLabelSize, fontWeight: 500,
            color: '#737373', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6
          }}>
            Total subnames
          </div>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: totalNumSize, fontWeight: 500,
            color: ENS.blue, letterSpacing: -totalNumSize * 0.025, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {totalApprox}
          </div>
        </div>
      </div>

      <div
        ref={diagWrapRef}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SubnameDiagram
          items={items} view={view}
          showLabels={showLabels} showCounts={showCounts}
          W={diagDims.w} H={diagDims.h}
        />
      </div>

      <div style={{
        flexShrink: 0,
        padding: `${footerPadY}px 0`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #E1E1E0',
      }}>
        <div style={{ display: 'flex', gap: Math.round(base * 0.015), flexWrap: 'wrap', alignItems: 'center', minHeight: Math.round(base * 0.02) }}>
          {showLegend !== false && [...items].sort((a, b) => b.count - a.count).map((it) =>
            <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: swatchSize, height: swatchSize, borderRadius: 2, background: it.color, flexShrink: 0 }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: legendSize, color: ENS.ink, fontWeight: 500 }}>
                {it.label}
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: legendCountSize, color: '#737373',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {fmt(it.count)}
              </div>
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
          marginLeft: 24,
          gap: 12,
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: Math.round(base * 0.013), color: '#A1A1A1',
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>
            ens.domains
          </div>
          <img
            src={logoSrc}
            alt="ENS"
            style={{
              height: Math.round(base * 0.048),
              width: 'auto',
              display: 'block',
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  );
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.items) {
        if (saved.view === 'orbit') return { ...saved, view: 'treemap' };
        return saved;
      }
    } catch { /* ignore */ }
    return {
      aspect: '1:1',
      view: 'treemap',
      showLabels: true,
      showCounts: true,
      showLegend: true,
      title: 'Subnames across the ENS ecosystem',
      items: DEFAULTS
    };
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const aspect = ASPECTS[state.aspect] || ASPECTS['1:1'];
  const W = aspect.w;
  const H = aspect.h;

  const stageRef = useRef(null);
  const [exporting, setExporting] = useState(null);

  const onReset = () => {
    if (confirm('Reset all counts and labels to defaults?')) {
      setState((s) => ({ ...s, items: DEFAULTS }));
    }
  };

  const buildSvgString = () => {
    const node = stageRef.current;
    if (!node) return null;
    const clone = node.cloneNode(true);
    clone.style.transform = 'none';
    const html = new XMLSerializer().serializeToString(clone);
    const w = W * EXPORT_SCALE;
    const h = H * EXPORT_SCALE;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
  };

  const exportSvg = () => {
    setExporting('svg');
    try {
      const svg = buildSvgString();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.download = `ens-subnames-${Date.now()}.svg`;
      a.href = URL.createObjectURL(blob);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      console.error(e);
      alert('SVG export failed: ' + e.message);
    } finally {
      setTimeout(() => setExporting(null), 400);
    }
  };

  const exportPng = async () => {
    setExporting('png');
    try {
      await new Promise((r) => setTimeout(r, 100));
      const node = stageRef.current;
      if (!node) throw new Error('Stage not ready');
      const blob = await domtoimage.toBlob(node, {
        bgcolor: ENS.paper,
        width: W,
        height: H,
        scale: EXPORT_SCALE,
        style: { transform: 'none', transformOrigin: 'top left' },
        cacheBust: true,
        quality: 1
      });
      const a = document.createElement('a');
      a.download = `ens-subnames-${Date.now()}.png`;
      a.href = URL.createObjectURL(blob);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      console.error(e);
      alert('PNG export failed: ' + e.message);
    } finally {
      setTimeout(() => setExporting(null), 400);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isNarrow ? 'column' : 'row',
      width: '100%',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Stage stageRef={stageRef} W={W} H={H}>
          <DiagramFrame state={state} W={W} H={H} />
        </Stage>
      </div>
      <ControlsPanel
        isNarrow={isNarrow}
        state={state} setState={setState}
        onExportPng={exportPng} onExportSvg={exportSvg}
        exporting={exporting} onReset={onReset} />
    </div>
  );
}
