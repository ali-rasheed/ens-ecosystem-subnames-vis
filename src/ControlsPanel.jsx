// controls-panel.jsx — control surface for diagram rendering and export.
// Includes view toggles, data editing, legend visibility, and export actions.

import React from 'react';
import { ENS } from './palette.js';
import { SWATCHES } from './constants.js';

const Section = ({ title, children, hint }) => (
  <div style={{ borderBottom: '1px solid #E1E1E0', padding: '20px 22px' }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4, color: '#737373', marginBottom: hint ? 4 : 14, fontWeight: 500, fontFamily: 'var(--mono)' }}>{title}</div>
    {hint && <div style={{ fontSize: 11, color: '#A1A1A1', marginBottom: 14, fontFamily: 'var(--mono)' }}>{hint}</div>}
    {children}
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer', fontSize: 13, color: '#011a25', fontFamily: 'var(--mono)' }}>
    <span>{label}</span>
    <div onClick={() => onChange(!value)} style={{
      width: 32, height: 18, borderRadius: 10, background: value ? ENS.blue : '#C7C6C4',
      position: 'relative', transition: 'background 0.15s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 16 : 2, width: 14, height: 14, borderRadius: 7,
        background: '#fff', transition: 'left 0.15s',
      }} />
    </div>
  </label>
);

const Seg = ({ options, value, onChange, label }) => (
  <div style={{ marginBottom: 0 }}>
    {label && <div style={{ fontSize: 12, color: '#737373', marginBottom: 6, fontFamily: 'var(--mono)' }}>{label}</div>}
    <div style={{ display: 'flex', gap: 0, background: '#fff', padding: 3, borderRadius: 4, border: '1px solid #E1E1E0' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, border: 'none', background: value === o.value ? ENS.blueDark : 'transparent',
          color: value === o.value ? '#fff' : '#011a25', padding: '8px 4px', borderRadius: 3,
          fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--mono)',
          transition: 'all 0.1s', letterSpacing: 0,
        }}>{o.label}</button>
      ))}
    </div>
  </div>
);

// One row per parent name: swatch · label · numeric input.
function CountRow({ item, onChange, onColor, onRemove, paletteOpen, onPaletteOpen }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.label);

  React.useEffect(() => { setDraft(item.label); }, [item.label]);

  const fmt = (n) => {
    if (n === '' || n == null) return '';
    return Number(n).toLocaleString();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ position: 'relative' }}>
        <button onClick={onPaletteOpen} style={{
          width: 22, height: 22, borderRadius: 4, border: 'none',
          background: item.color, cursor: 'pointer', padding: 0, flexShrink: 0,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }} title="Change color" />
        {paletteOpen && (
          <div style={{ position: 'absolute', top: 28, left: 0, zIndex: 10,
            background: '#fff', border: '1px solid #E1E1E0', borderRadius: 6, padding: 6,
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {SWATCHES.map(([col, dark]) => (
              <button key={col} onClick={() => { onColor(col, dark); onPaletteOpen(); }}
                style={{ width: 22, height: 22, borderRadius: 3, border: item.color === col ? '2px solid ' + ENS.ink : '1px solid rgba(0,0,0,0.1)',
                  background: col, cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        )}
      </div>
      {editing ? (
        <input type="text" value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onChange({ label: draft }); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(item.label); setEditing(false); }}}
          style={{
            flex: 1, minWidth: '100%', background: '#fff', color: '#011a25',
            border: '1px solid ' + ENS.blue, borderRadius: 3, padding: '6px 8px',
            fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 500, outline: 'none',
          }} />
      ) : (
        <div onClick={() => setEditing(true)}
          style={{ flex: 1, minWidth: 0, padding: '6px 8px', fontSize: 13, fontFamily: 'var(--mono)',
            fontWeight: 500, color: '#011a25', cursor: 'text', borderRadius: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            border: '1px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FAF9F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Click to rename">
          {item.label}
        </div>
      )}
      <input type="number" min="0" value={item.count}
        onChange={e => {
          const v = e.target.value;
          onChange({ count: v === '' ? 0 : Math.max(0, Number(v)) });
        }}
        style={{
          width: 92, background: '#fff', color: '#011a25', border: '1px solid #E1E1E0',
          borderRadius: 3, padding: '6px 8px', fontSize: 13, fontFamily: 'var(--mono)',
          fontWeight: 500, outline: 'none', textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
        onFocus={e => e.currentTarget.style.borderColor = ENS.blue}
        onBlur={e => e.currentTarget.style.borderColor = '#E1E1E0'} />
      <button onClick={onRemove} title="Remove row"
        style={{ width: 22, height: 22, borderRadius: 3, border: 'none', background: 'transparent',
          color: '#A1A1A1', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FEEAF0'; e.currentTarget.style.color = ENS.magenta || '#E72A96'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1A1'; }}>
        ×
      </button>
    </div>
  );
}

export function ControlsPanel({ state, setState, onExportPng, onExportSvg, exporting, onReset, isNarrow = false }) {
  const update = (patch) => setState(s => ({ ...s, ...patch }));
  const updateItem = (key, patch) => setState(s => ({
    ...s, items: s.items.map(it => it.key === key ? { ...it, ...patch } : it)
  }));
  const removeItem = (key) => setState(s => ({ ...s, items: s.items.filter(it => it.key !== key) }));
  const addItem = () => setState(s => {
    const newKey = 'item-' + Date.now();
    const palette = SWATCHES || [];
    const usedColors = new Set(s.items.map(it => it.color));
    const swatch = palette.find(([c]) => !usedColors.has(c)) || palette[0] || ['#0082BB', false];
    return {
      ...s,
      items: [...s.items, { key: newKey, label: 'New parent', count: 0, color: swatch[0], darkInk: swatch[1] }],
    };
  });
  const [openPalette, setOpenPalette] = React.useState(null);

  const total = state.items.reduce((s, x) => s + (Number(x.count) || 0), 0);

  return (
    <div style={{
      width: isNarrow ? '100%' : 340,
      maxWidth: '100%',
      background: ENS.paperWarm, color: ENS.ink,
      borderLeft: isNarrow ? 'none' : '1px solid #E1E1E0',
      borderTop: isNarrow ? '1px solid #E1E1E0' : 'none',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--sans)',
      height: isNarrow ? '45vh' : '100%',
      minHeight: isNarrow ? 280 : 0,
      maxHeight: isNarrow ? undefined : '100%',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      <div style={{ padding: '24px 22px 18px', borderBottom: '1px solid #E1E1E0' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4, color: ENS.blue, marginBottom: 6, fontFamily: 'var(--mono)', fontWeight: 500 }}>ENS · Ecosysteme</div>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.05 }}>Subname Visualizer</div>
        <div style={{ fontSize: 12, color: '#737373', marginTop: 6, fontFamily: 'var(--mono)' }}>
          Spatial diagram of registered subnames — proportional to count.
        </div>
      </div>

      <Section title="Format" hint="Aspect ratio for export. Optimized for social platforms.">
        <Seg options={[
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '4:3', label: '4:3' },
        ]} value={state.aspect || '1:1'} onChange={v => update({ aspect: v })} />
        <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 11, color: '#A1A1A1' }}>
          {({ '1:1': '1200 × 1200 · IG, LinkedIn', '16:9': '1920 × 1080 · X / Twitter', '4:3': '1600 × 1200 · Carousel' })[state.aspect || '1:1']}
        </div>
      </Section>

      <Section title="View">
        <Seg options={[
          { value: 'treemap', label: 'Tiles' },
          { value: 'packed', label: 'Bubbles' },
          { value: 'bars', label: 'Bars' },
        ]} value={state.view} onChange={v => update({ view: v })} />
        <div style={{ height: 12 }} />
        <Toggle label="Show labels" value={state.showLabels} onChange={v => update({ showLabels: v })} />
        <Toggle label="Show counts" value={state.showCounts} onChange={v => update({ showCounts: v })} />
        <Toggle label="Show legend" value={state.showLegend !== false} onChange={v => update({ showLegend: v })} />
      </Section>

      <Section title="Counts" hint="Click any name to rename. Edit numbers freely.">
        {state.items.map(it => (
          <CountRow key={it.key} item={it}
            onChange={p => updateItem(it.key, p)}
            onColor={(c, dark) => updateItem(it.key, { color: c, darkInk: dark })}
            onRemove={() => removeItem(it.key)}
            paletteOpen={openPalette === it.key}
            onPaletteOpen={() => setOpenPalette(openPalette === it.key ? null : it.key)} />
        ))}
        <button onClick={addItem} style={{
          width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 3,
          border: '1px dashed #C7C6C4', background: 'transparent', color: '#737373',
          fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ENS.blue; e.currentTarget.style.color = ENS.blue; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7C6C4'; e.currentTarget.style.color = '#737373'; }}>
          + Add parent
        </button>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #C7C6C4',
          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)' }}>
          <span style={{ fontSize: 12, color: '#737373' }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: ENS.ink, fontVariantNumeric: 'tabular-nums' }}>
            {total.toLocaleString()}
          </span>
        </div>
        <button onClick={onReset} style={{
          width: '100%', marginTop: 14, padding: '8px 12px', borderRadius: 3,
          border: '1px solid #E1E1E0', background: 'transparent', color: '#737373',
          fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer',
        }}>Reset to defaults</button>
      </Section>

      <Section title="Title">
        <input type="text" value={state.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Title (optional)"
          style={{
            width: '100%', background: '#fff', color: ENS.ink, border: '1px solid #E1E1E0',
            borderRadius: 3, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--mono)',
            fontWeight: 500, outline: 'none',
          }} />
      </Section>

      <Section title="Export">
        <button onClick={onExportPng} disabled={exporting} style={{
          width: '100%', padding: '12px 14px', borderRadius: 4, border: 'none',
          background: ENS.blue, color: '#fff', fontWeight: 500, fontSize: 14,
          cursor: exporting ? 'wait' : 'pointer', fontFamily: 'var(--mono)',
          letterSpacing: -0.2, marginBottom: 8,
        }}>
          {exporting === 'png' ? 'Rendering…' : 'Download PNG'}
        </button>
        <button onClick={onExportSvg} disabled={exporting} style={{
          width: '100%', padding: '12px 14px', borderRadius: 4,
          border: '1px solid #E1E1E0', background: 'transparent', color: ENS.ink,
          fontWeight: 500, fontSize: 14, cursor: exporting ? 'wait' : 'pointer',
          fontFamily: 'var(--mono)', letterSpacing: -0.2,
        }}>
          {exporting === 'svg' ? 'Rendering…' : 'Download SVG'}
        </button>
        <div style={{ fontSize: 11, color: '#A1A1A1', marginTop: 12, lineHeight: 1.5, fontFamily: 'var(--mono)' }}>
          PNG & SVG export at 2× canvas size (e.g. 1:1 → 2400 × 2400).
        </div>
      </Section>

      <div style={{ flex: 1 }} />
      <div style={{ padding: '14px 22px 18px', fontSize: 10, color: '#A1A1A1',
        fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
subname visualizer v1.0       </div>
    </div>
  );
}

