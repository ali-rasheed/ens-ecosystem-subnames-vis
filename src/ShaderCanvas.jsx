// ShaderCanvas — WebGL renderer for the shaderbox fragment (see shader-source.js).
// Vite: shader strings and pattern atlas come from ES modules (no globals).

import React from 'react';
import { VERTEX_SOURCE, FRAGMENT_SOURCE, PATTERNS, buildPatternTexture } from './shader-source.js';
// Uploads every uniform declared in the fragment program (with null checks) so drivers
// never see stale/undefined values — missing uploads were causing solid black tiles on some GPUs.

export function ShaderCanvas({ state, onCanvasRef }) {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return;

    const compile = (src, type) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(type === gl.VERTEX_SHADER ? 'VS' : 'FS', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(VERTEX_SOURCE, gl.VERTEX_SHADER);
    const fs = compile(FRAGMENT_SOURCE, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return () => {};
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return () => {};
    }
    gl.useProgram(prog);

    const loc = (name) => gl.getUniformLocation(prog, name);
    const U = {
      time: loc('u_time'),
      resolution: loc('u_resolution'),
      patternSampler: loc('u_patternSampler'),
      patternIndex: loc('u_patternIndex'),
      tileW: loc('u_tileW'),
      tileH: loc('u_tileH'),
      patternTexHeight: loc('u_patternTexHeight'),
      palette: loc('u_palette'),
      bgShade: loc('u_bgShade'),
      warpShade: loc('u_warpShade'),
      weftShade: loc('u_weftShade'),
      gridSize: loc('u_gridSize'),
      warpStart: loc('u_warpStart'),
      warpEnd: loc('u_warpEnd'),
      weftStart: loc('u_weftStart'),
      weftEnd: loc('u_weftEnd'),
      warpDir: loc('u_warpDir'),
      weftDir: loc('u_weftDir'),
      warpStartPos: loc('u_warpStartPos'),
      warpEndPos: loc('u_warpEndPos'),
      weftStartPos: loc('u_weftStartPos'),
      weftEndPos: loc('u_weftEndPos'),
      gradSteps: loc('u_gradSteps'),
      shimmer: loc('u_shimmer'),
      shimmerSpeed: loc('u_shimmerSpeed'),
      shimmerTime: loc('u_shimmerTime'),
      shimmerPhase: loc('u_shimmerPhase'),
      shimmerWidth: loc('u_shimmerWidth'),
      shimmerIntensity: loc('u_shimmerIntensity'),
      shimmerPosition: loc('u_shimmerPosition'),
      shimmerRotation: loc('u_shimmerRotation'),
      shimmerNoise: loc('u_shimmerNoise'),
      shimmerNoiseSeed: loc('u_shimmerNoiseSeed'),
      shimmerNoiseMin: loc('u_shimmerNoiseMin'),
      shimmerNoiseMax: loc('u_shimmerNoiseMax'),
      shimmerBlendMode: loc('u_shimmerBlendMode'),
      useAllColorways: loc('u_useAllColorways'),
      colorwaySeed: loc('u_colorwaySeed'),
      colorwayNoiseScale: loc('u_colorwayNoiseScale'),
      colorwayNoiseMode: loc('u_colorwayNoiseMode'),
      colorwayNoiseOctaves: loc('u_colorwayNoiseOctaves'),
      colorwayNoisePersistence: loc('u_colorwayNoisePersistence'),
      colorwayNoiseLacunarity: loc('u_colorwayNoiseLacunarity'),
      colorwayNoiseBias: loc('u_colorwayNoiseBias'),
      colorwayNoiseX: loc('u_colorwayNoiseX'),
      colorwayBleedAnisotropy: loc('u_colorwayBleedAnisotropy'),
      colorwayBleedRotation: loc('u_colorwayBleedRotation'),
      colorwayBleedCrossFiber: loc('u_colorwayBleedCrossFiber'),
      colorwayBleedDraftCoupled: loc('u_colorwayBleedDraftCoupled'),
      colorwayInclude0123: loc('u_colorwayInclude0123'),
      colorwayInclude4: loc('u_colorwayInclude4'),
      revealStartTime: loc('u_revealStartTime'),
      rectAspect: loc('u_rectAspect'),
      cornerRadius: loc('u_cornerRadius'),
      skipEntranceReveal: loc('u_skipEntranceReveal'),
      stitchRevealMode: loc('u_stitchRevealMode'),
      stitchRevealProgress: loc('u_stitchRevealProgress'),
      stitchRevealSeed: loc('u_stitchRevealSeed'),
      stitchRevealScale: loc('u_stitchRevealScale'),
      stitchRevealNoiseScale: loc('u_stitchRevealNoiseScale'),
      stitchRevealSoftness: loc('u_stitchRevealSoftness'),
      stitchRevealBleedAnisotropy: loc('u_stitchRevealBleedAnisotropy'),
      stitchRevealBleedRotation: loc('u_stitchRevealBleedRotation'),
      stitchRevealBleedCrossFiber: loc('u_stitchRevealBleedCrossFiber'),
      stitchRevealBleedDraftCoupled: loc('u_stitchRevealBleedDraftCoupled'),
      hoverReactive: loc('u_hoverReactive'),
      hoverRevealOnly: loc('u_hoverRevealOnly'),
      hoverMovementBoost: loc('u_hoverMovementBoost'),
      pointerUv: loc('u_pointerUv'),
      hoverStrength: loc('u_hoverStrength'),
      hoverVelocity: loc('u_hoverVelocity'),
      ripplePhase: loc('u_ripplePhase'),
      rippleWidth: loc('u_rippleWidth'),
    };

    const f1 = (l, v) => { if (l != null) gl.uniform1f(l, v); };
    const f2 = (l, a, b) => { if (l != null) gl.uniform2f(l, a, b); };
    const f4 = (l, a, b, c, d) => { if (l != null) gl.uniform4f(l, a, b, c, d); };

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const { data, width: texW, height: texH } = buildPatternTexture(PATTERNS);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texW, texH, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (U.patternSampler != null) gl.uniform1i(U.patternSampler, 0);

    const PALETTE_RGBA = [
      [[0.247, 0.114, 0.035, 1], [0.596, 0.302, 0.106, 1], [0.973, 0.969, 0.886, 1], [0.855, 0.725, 0.525, 1], [0, 0, 0, 0]],
      [[0.322, 0.024, 0.141, 1], [0.941, 0.216, 0.576, 1], [0.984, 0.922, 0.941, 1], [0.988, 0.706, 0.812, 1], [0, 0, 0, 0]],
      [[0.008, 0.161, 0.231, 1], [0.0, 0.502, 0.737, 1], [0.902, 0.953, 0.973, 1], [0.455, 0.725, 0.875, 1], [0, 0, 0, 0]],
      [[0.012, 0.188, 0.063, 1], [0.0, 0.486, 0.137, 1], [0.843, 0.914, 0.89, 1], [0.4549, 0.6745, 0.4902, 1], [0, 0, 0, 0]],
      [[0.098039, 0.098039, 0.098039, 1], [0.34902, 0.341176, 0.333333, 1], [0.933333, 0.929412, 0.929412, 1], [0.45098, 0.45098, 0.45098, 1], [0, 0, 0, 0]],
    ];
    const getColor = (p, s) => PALETTE_RGBA[Math.max(0, Math.min(4, p | 0))][Math.max(0, Math.min(4, s | 0))];

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      // Use layout box (clientWidth/Height), not getBoundingClientRect. The diagram
      // stage uses transform: scale(); getBoundingClientRect is post-transform and
      // undersizes the canvas vs the tile's layout box — shader bitmap then sits in
      // the top-left corner only.
      const cssW = Math.max(1, Math.round(container.clientWidth));
      const cssH = Math.max(1, Math.round(container.clientHeight));
      const w = Math.max(1, Math.round(cssW * DPR));
      const h = Math.max(1, Math.round(cssH * DPR));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      gl.viewport(0, 0, w, h);
    };

    const startTime = Date.now();
    let revealStart = 0;
    let lastPat = -1;
    let raf = 0;
    let shimmerTime = 0;
    let lastFrameMs = Date.now();

    const render = () => {
      const s = stateRef.current;
      const t = (Date.now() - startTime) / 1000;
      const dt = (Date.now() - lastFrameMs) / 1000;
      lastFrameMs = Date.now();
      if (s.shimmerPlaying !== false) shimmerTime += dt;

      const pat = PATTERNS[s.pattern] || PATTERNS[0];
      if (lastPat !== -1 && s.pattern !== lastPat) revealStart = t;
      lastPat = s.pattern;

      gl.useProgram(prog);
      f1(U.time, t);
      f2(U.resolution, canvas.width, canvas.height);
      f1(U.patternIndex, s.pattern);
      f1(U.tileW, pat.tileW);
      f1(U.tileH, pat.tileH);
      f1(U.patternTexHeight, texH);
      f1(U.palette, s.palette);
      f1(U.bgShade, s.bgShade);
      f1(U.warpShade, s.warpShade);
      f1(U.weftShade, s.weftShade);
      f1(U.gridSize, s.gridSize);

      const ws = getColor(s.palette, s.warpShade);
      const wes = getColor(s.palette, s.weftShade);
      f4(U.warpStart, ws[0], ws[1], ws[2], ws[3]);
      f4(U.warpEnd, ws[0], ws[1], ws[2], ws[3]);
      f4(U.weftStart, wes[0], wes[1], wes[2], wes[3]);
      f4(U.weftEnd, wes[0], wes[1], wes[2], wes[3]);
      f1(U.warpDir, 0);
      f1(U.weftDir, 0);
      f1(U.warpStartPos, 0);
      f1(U.warpEndPos, 1);
      f1(U.weftStartPos, 0);
      f1(U.weftEndPos, 1);
      f1(U.gradSteps, s.gradSteps || 0);

      f1(U.shimmer, s.shimmer ? 1 : 0);
      f1(U.shimmerSpeed, s.shimmerSpeed ?? 2);
      f1(U.shimmerTime, shimmerTime);
      f1(U.shimmerPhase, s.shimmerPhase ?? 0);
      f1(U.shimmerWidth, s.shimmerWidth ?? 2);
      f1(U.shimmerIntensity, s.shimmerIntensity ?? 0.35);
      f1(U.shimmerPosition, s.shimmerPosition ?? 0);
      f1(U.shimmerRotation, s.shimmerRotation ?? 0.125);
      f1(U.shimmerNoise, s.shimmerNoise ?? 0.3);
      f1(U.shimmerNoiseSeed, s.shimmerNoiseSeed ?? 0);
      f1(U.shimmerNoiseMin, s.shimmerNoiseMin ?? 0.5);
      f1(U.shimmerNoiseMax, s.shimmerNoiseMax ?? 1.5);
      f1(U.shimmerBlendMode, s.shimmerBlendMode ?? 2);

      f1(U.useAllColorways, s.useAllColorways ? 1 : 0);
      f1(U.colorwaySeed, s.colorwaySeed ?? 19);
      f1(U.colorwayNoiseScale, s.colorwayNoiseScale ?? 1);
      f1(U.colorwayNoiseMode, s.colorwayNoiseMode ?? 0);
      f1(U.colorwayNoiseOctaves, s.colorwayNoiseOctaves ?? 3);
      f1(U.colorwayNoisePersistence, s.colorwayNoisePersistence ?? 0.5);
      f1(U.colorwayNoiseLacunarity, s.colorwayNoiseLacunarity ?? 2);
      f1(U.colorwayNoiseBias, s.colorwayNoiseBias ?? 1);
      f1(U.colorwayNoiseX, s.colorwayNoiseX ?? 0);
      f1(U.colorwayBleedAnisotropy, s.colorwayBleedAnisotropy ?? 2);
      f1(U.colorwayBleedRotation, s.colorwayBleedRotation ?? 0);
      f1(U.colorwayBleedCrossFiber, s.colorwayBleedCrossFiber ?? 0);
      f1(U.colorwayBleedDraftCoupled, s.colorwayBleedDraftCoupled ? 1 : 0);
      f4(U.colorwayInclude0123, 1, 1, 1, 1);
      f1(U.colorwayInclude4, 1);

      f1(U.rectAspect, s.rectAspect ?? 0.9);
      f1(U.cornerRadius, s.cornerRadius ?? 0.18);
      f1(U.skipEntranceReveal, s.skipEntranceReveal ? 1 : 0);
      f1(U.revealStartTime, revealStart);

      f1(U.stitchRevealMode, s.stitchRevealMode ?? 0);
      f1(U.stitchRevealProgress, s.stitchRevealProgress ?? 1);
      f1(U.stitchRevealSeed, s.stitchRevealSeed ?? 0);
      f1(U.stitchRevealScale, s.stitchRevealScale ?? 1);
      f1(U.stitchRevealNoiseScale, s.stitchRevealNoiseScale ?? 1);
      f1(U.stitchRevealSoftness, s.stitchRevealSoftness ?? 0.15);
      f1(U.stitchRevealBleedAnisotropy, s.stitchRevealBleedAnisotropy ?? 2);
      f1(U.stitchRevealBleedRotation, s.stitchRevealBleedRotation ?? 0);
      f1(U.stitchRevealBleedCrossFiber, s.stitchRevealBleedCrossFiber ?? 0);
      f1(U.stitchRevealBleedDraftCoupled, s.stitchRevealBleedDraftCoupled ? 1 : 0);

      f1(U.hoverReactive, 0);
      f1(U.hoverRevealOnly, 0);
      f1(U.hoverMovementBoost, 0);
      f2(U.pointerUv, 0.5, 0.5);
      f1(U.hoverStrength, 0);
      f1(U.hoverVelocity, 0);
      f1(U.ripplePhase, 0);
      f1(U.rippleWidth, 0.22);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (U.patternSampler != null) gl.uniform1i(U.patternSampler, 0);

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    render();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <canvas
        ref={(el) => { canvasRef.current = el; onCanvasRef && onCanvasRef(el); }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          margin: 0,
        }}
      />
    </div>
  );
}

