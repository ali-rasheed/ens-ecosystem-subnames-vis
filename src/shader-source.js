// shader-source.js
// Synced shader runtime from personal/shaderbox (vertex + fragment + pattern registry).

export const VERTEX_SOURCE = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const FRAGMENT_SOURCE = `precision mediump float;
uniform float u_time; uniform vec2 u_resolution;
uniform sampler2D u_patternSampler; uniform float u_patternIndex; uniform float u_tileW; uniform float u_tileH; uniform float u_patternTexHeight;
uniform float u_palette; uniform float u_bgShade; uniform float u_warpShade; uniform float u_weftShade; uniform float u_gridSize;
uniform vec4 u_warpStart; uniform vec4 u_warpEnd; uniform vec4 u_weftStart; uniform vec4 u_weftEnd;
uniform float u_warpDir; uniform float u_weftDir; uniform float u_warpStartPos; uniform float u_warpEndPos; uniform float u_weftStartPos; uniform float u_weftEndPos;
uniform float u_gradSteps; uniform float u_shimmer; uniform float u_shimmerSpeed; uniform float u_shimmerTime; uniform float u_shimmerPhase;
uniform float u_shimmerWidth; uniform float u_shimmerIntensity; uniform float u_shimmerPosition; uniform float u_shimmerRotation;
uniform float u_shimmerNoise; uniform float u_shimmerNoiseSeed; uniform float u_shimmerNoiseMin; uniform float u_shimmerNoiseMax; uniform float u_shimmerBlendMode;
uniform float u_useAllColorways; uniform float u_colorwaySeed; uniform float u_colorwayNoiseScale; uniform float u_colorwayNoiseMode; uniform float u_colorwayNoiseOctaves;
uniform float u_colorwayNoisePersistence; uniform float u_colorwayNoiseLacunarity; uniform float u_colorwayNoiseBias; uniform float u_colorwayNoiseX;
uniform float u_colorwayBleedAnisotropy; uniform float u_colorwayBleedRotation; uniform float u_colorwayBleedCrossFiber; uniform float u_colorwayBleedDraftCoupled;
uniform vec4 u_colorwayInclude0123; uniform float u_colorwayInclude4;
uniform float u_revealStartTime; uniform float u_rectAspect; uniform float u_cornerRadius;
uniform float u_skipEntranceReveal;
uniform float u_stitchRevealMode; uniform float u_stitchRevealProgress; uniform float u_stitchRevealSeed; uniform float u_stitchRevealScale; uniform float u_stitchRevealNoiseScale;
uniform float u_stitchRevealSoftness; uniform float u_stitchRevealBleedAnisotropy; uniform float u_stitchRevealBleedRotation; uniform float u_stitchRevealBleedCrossFiber; uniform float u_stitchRevealBleedDraftCoupled;
uniform float u_hoverReactive; uniform float u_hoverRevealOnly; uniform float u_hoverMovementBoost; uniform vec2 u_pointerUv; uniform float u_hoverStrength; uniform float u_hoverVelocity; uniform float u_ripplePhase; uniform float u_rippleWidth;

float roundedRect(vec2 p, vec2 halfSize, float radius) { vec2 d = abs(p) - halfSize + radius; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius; }
float getPatternFromTexture(float row, float col) { float r = mod(row, u_tileH); float c = mod(col, u_tileW); float stripY = u_patternIndex * 10.0; float texX = (c + 0.5) / 10.0; float texY = (stripY + r + 0.5) / u_patternTexHeight; return texture2D(u_patternSampler, vec2(texX, texY)).r; }
vec4 getPaletteColor(float palette, float shade) {
  int p = int(mod(floor(palette + 0.01), 5.0)); int s = int(mod(floor(shade + 0.01), 6.0));
  if (s == 4) return vec4(0.0, 0.0, 0.0, 0.0); if (s == 5) return vec4(0.933, 0.933, 0.933, 1.0);
  if (p == 0) { if (s == 0) return vec4(0.247, 0.114, 0.035, 1.0); if (s == 1) return vec4(0.596, 0.302, 0.106, 1.0); if (s == 2) return vec4(0.973, 0.969, 0.886, 1.0); return vec4(0.855, 0.725, 0.525, 1.0); }
  if (p == 1) { if (s == 0) return vec4(0.322, 0.024, 0.141, 1.0); if (s == 1) return vec4(0.941, 0.216, 0.576, 1.0); if (s == 2) return vec4(0.984, 0.922, 0.941, 1.0); return vec4(0.988, 0.706, 0.812, 1.0); }
  if (p == 2) { if (s == 0) return vec4(0.008, 0.161, 0.231, 1.0); if (s == 1) return vec4(0.0, 0.502, 0.737, 1.0); if (s == 2) return vec4(0.902, 0.953, 0.973, 1.0); return vec4(0.455, 0.725, 0.875, 1.0); }
  if (p == 3) { if (s == 0) return vec4(0.012, 0.188, 0.063, 1.0); if (s == 1) return vec4(0.0, 0.486, 0.137, 1.0); if (s == 2) return vec4(0.843, 0.914, 0.890, 1.0); return vec4(0.4549, 0.6745, 0.4902, 1.0); }
  if (s == 0) return vec4(0.098039, 0.098039, 0.098039, 1.0); if (s == 1) return vec4(0.34902, 0.341176, 0.333333, 1.0); if (s == 2) return vec4(0.933333, 0.929412, 0.929412, 1.0); return vec4(0.45098, 0.45098, 0.45098, 1.0);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float perlin01(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f); vec2 g00=hash22(i)*2.0-1.0, g10=hash22(i+vec2(1,0))*2.0-1.0, g01=hash22(i+vec2(0,1))*2.0-1.0, g11=hash22(i+vec2(1,1))*2.0-1.0; float n00=dot(g00,f), n10=dot(g10,f-vec2(1,0)), n01=dot(g01,f-vec2(0,1)), n11=dot(g11,f-vec2(1,1)); return clamp(mix(mix(n00,n10,u.x),mix(n01,n11,u.x),u.y)*0.65+0.5,0.0,1.0); }
float fbm(vec2 p, float offsetX){ float per=clamp(u_colorwayNoisePersistence,0.15,0.95), lac=clamp(u_colorwayNoiseLacunarity,1.05,4.0), oct=clamp(floor(u_colorwayNoiseOctaves+0.01),1.0,4.0); float sum=0.0, amp=0.5, norm=0.0, freq=1.0; for(int i=0;i<4;i++){ float w=step(float(i)+0.5,oct); sum += w*amp*perlin01(p*freq + vec2(offsetX*freq,0.0)); norm += w*amp; amp*=per; freq*=lac; } return sum/max(norm,1e-4); }
float includeCount(){ return u_colorwayInclude0123.x + u_colorwayInclude0123.y + u_colorwayInclude0123.z + u_colorwayInclude0123.w + u_colorwayInclude4; }
float pickPalette(float u01){ float n=includeCount(); if(n<0.5) return u_palette; float kk=floor(clamp(u01,0.0,1.0-1e-5)*n); if(u_colorwayInclude0123.x>0.5){if(kk<0.5)return 0.0; kk-=1.0;} if(u_colorwayInclude0123.y>0.5){if(kk<0.5)return 1.0; kk-=1.0;} if(u_colorwayInclude0123.z>0.5){if(kk<0.5)return 2.0; kk-=1.0;} if(u_colorwayInclude0123.w>0.5){if(kk<0.5)return 3.0; kk-=1.0;} if(u_colorwayInclude4>0.5){if(kk<0.5)return 4.0;} return u_palette; }
float quantizePalette(float tRaw){ float b=max(0.08,min(4.0,u_colorwayNoiseBias)); return pickPalette(pow(clamp(tRaw,0.0,1.0),b)); }
vec4 sampleGradient2(vec4 startColor, vec4 endColor, float dir, float startPos, float endPos, float tRaw) { float t=(dir>0.5)?(1.0-tRaw):tRaw; float span=endPos-startPos; float tGrad=(span<0.001)?0.5:clamp((t-startPos)/span,0.0,1.0); if(u_gradSteps>=2.0){ float steps=floor(u_gradSteps); tGrad=floor(tGrad*steps)/max(steps-1.0,1.0);} return mix(startColor,endColor,tGrad); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution; float aspect = u_resolution.x / u_resolution.y; uv.x *= aspect;
  float gridSize = clamp(u_gridSize, 2.0, 256.0); vec2 gridUV = uv * gridSize; vec2 cellUV = fract(gridUV); vec2 cellID = floor(gridUV); vec2 cellCenter = cellID + vec2(0.5);
  float isWeft = getPatternFromTexture(cellID.y, cellID.x);
  vec2 p = cellUV - 0.5; float halfY = 0.5; float aspectClamped = clamp(u_rectAspect, 0.3, 1.0); float halfX = halfY * aspectClamped;
  float d = roundedRect(p, isWeft > 0.5 ? vec2(halfY, halfX) : vec2(halfX, halfY), clamp(u_cornerRadius, 0.0, 0.5));
  float edge = gridSize / min(u_resolution.x, u_resolution.y); float cell = 1.0 - smoothstep(-edge, edge, d);

  vec2 pointerGrid = vec2(u_pointerUv.x * aspect, u_pointerUv.y) * gridSize; float pointerDist = length(cellCenter - pointerGrid);
  float rippleSignal = 0.0; if (u_hoverReactive > 0.5) { float wave = sin(pointerDist * 2.7 - u_ripplePhase); float wave01 = wave * 0.5 + 0.5; float ring = smoothstep(1.0 - max(0.02, u_rippleWidth), 1.0, wave01); float stepped = floor(clamp(ring,0.0,0.999)*4.0)/3.0; rippleSignal = stepped * clamp(u_hoverStrength, 0.0, 1.0); if (u_hoverMovementBoost > 0.5) rippleSignal += stepped * clamp(u_hoverVelocity, 0.0, 1.0) * 0.85; rippleSignal = clamp(rippleSignal, 0.0, 1.0); }

  if (u_stitchRevealMode > 0.5) { float scale=max(0.001,u_stitchRevealScale); float nfreq=max(0.05,u_stitchRevealNoiseScale); vec2 seedOff=vec2(u_stitchRevealSeed*0.103511,u_stitchRevealSeed*0.097369); float orderT = fbm((cellID*scale+seedOff) * nfreq, 0.0); if (u_stitchRevealMode > 1.5) { float ani=max(0.35,min(12.0,u_stitchRevealBleedAnisotropy)); vec2 pH=vec2(cellID.x*ani,cellID.y/ani)*scale+seedOff, pV=vec2(cellID.x/ani,cellID.y*ani)*scale+seedOff; float tMix=mix(fbm(pH*nfreq,0.0),fbm(pV*nfreq,0.0),isWeft); vec2 pIso=cellID*scale+seedOff+vec2(17.13,23.71); orderT = mix(tMix, fbm(pIso*nfreq,0.0), clamp(u_stitchRevealBleedCrossFiber,0.0,1.0)); } cell *= smoothstep(orderT - max(0.001,u_stitchRevealSoftness), orderT + max(0.001,u_stitchRevealSoftness), u_stitchRevealProgress); }

  vec4 bgVec = getPaletteColor(u_palette, u_bgShade); float tWarp = cellID.y / max(gridSize - 1.0, 1.0); float tWeft = cellID.x / max(gridSize * aspect - 1.0, 1.0);
  vec4 warpColor; vec4 weftColor;
  if (u_useAllColorways > 0.5) {
    float scale=max(0.001,u_colorwayNoiseScale); vec2 seedOff=vec2(u_colorwaySeed*0.103511,u_colorwaySeed*0.097369); float xMicro=u_colorwayNoiseX*0.04;
    float cellPalette; if (u_colorwayNoiseMode < 0.5) { cellPalette = pickPalette(hash(cellID * scale + vec2(u_colorwaySeed + xMicro, 0.0))); }
    else if (u_colorwayNoiseMode < 1.5) { cellPalette = quantizePalette(fbm(cellID * scale + seedOff, xMicro)); }
    else { float ani=max(0.35,min(12.0,u_colorwayBleedAnisotropy)); vec2 pH=vec2(cellID.x*ani,cellID.y/ani)*scale+seedOff, pV=vec2(cellID.x/ani,cellID.y*ani)*scale+seedOff; float tMix=mix(fbm(pH,xMicro),fbm(pV,xMicro),isWeft); vec2 pIso=cellID*scale+seedOff+vec2(17.13,23.71); cellPalette = quantizePalette(mix(tMix, fbm(pIso,xMicro), clamp(u_colorwayBleedCrossFiber,0.0,1.0))); }
    warpColor = getPaletteColor(cellPalette, u_warpShade); weftColor = getPaletteColor(cellPalette, u_weftShade);
  } else {
    warpColor = sampleGradient2(u_warpStart, u_warpEnd, u_warpDir, u_warpStartPos, u_warpEndPos, tWarp);
    weftColor = sampleGradient2(u_weftStart, u_weftEnd, u_weftDir, u_weftStartPos, u_weftEndPos, tWeft);
  }
  vec4 threadVec = mix(warpColor, weftColor, isWeft); if (u_hoverReactive > 0.5) threadVec.rgb = mix(threadVec.rgb, getPaletteColor(u_palette, 3.0).rgb, rippleSignal * 0.42);
  vec4 inRectVec = threadVec.a > 0.001 ? threadVec : vec4(bgVec.rgb, 1.0);

  if (u_skipEntranceReveal < 0.5) {
    float elapsed = u_time - u_revealStartTime; float wave = (cellID.x + cellID.y) - elapsed * (2.0 * gridSize / 1.8);
    // GLSL ES: smoothstep requires edge0 < edge1; inverted range is undefined on some GPUs (black tiles).
    cell *= 1.0 - smoothstep(0.0, 1.0, clamp(wave, 0.0, 1.0));
  }
  if (u_hoverReactive > 0.5 && u_hoverRevealOnly > 0.5) cell *= clamp(u_hoverStrength * 0.25 + rippleSignal, 0.0, 1.0);
  vec4 outColor = mix(bgVec, inRectVec, cell);

  if (u_shimmer > 0.5) {
    float speed=max(0.001,u_shimmerSpeed), width=max(0.01,u_shimmerWidth), angle=u_shimmerRotation*6.28318530718, cosA=cos(angle), sinA=sin(angle);
    float period=max(gridSize*(aspect*abs(cosA)+abs(sinA)),1.0); float bandCenter=u_shimmerPhase*period + u_shimmerPosition*period; float along=cellID.x*cosA+cellID.y*sinA;
    float phase=mod(along-bandCenter+0.5*period,period)-0.5*period; float band=1.0-smoothstep(0.0,width,abs(phase));
    float shotNoise=hash(vec2(floor(along)+u_shimmerNoiseSeed*43758.5453, floor(u_shimmerTime*speed)));
    float rawFactor=1.0+(shotNoise-0.5)*2.0*max(0.0,u_shimmerNoise); float noiseFactor=clamp(rawFactor, min(u_shimmerNoiseMin,u_shimmerNoiseMax), max(u_shimmerNoiseMin,u_shimmerNoiseMax));
    float blendFactor=band*u_shimmerIntensity*noiseFactor; int mode=int(clamp(u_shimmerBlendMode,0.0,10.0)+0.5); vec3 o=outColor.rgb;
    if(mode==0) outColor.rgb += blendFactor; else if(mode==1) outColor.rgb *= 1.0-blendFactor; else if(mode==2) outColor.rgb = 1.0-(1.0-o)*(1.0-blendFactor);
    else if(mode==3) outColor.rgb = mix(o*(1.0+blendFactor), o+blendFactor*(1.0-o), step(0.5,o)); else if(mode==4) outColor.rgb = o + blendFactor*o*(1.0-o);
    else if(mode==5) outColor.rgb = mix(2.0*o*blendFactor, blendFactor+o*(1.0-blendFactor), step(0.5,o)); else if(mode==6) outColor.rgb = min(vec3(1.0), o/(1.0-blendFactor+1e-6));
    else if(mode==7) outColor.rgb = max(vec3(0.0), 1.0-(1.0-o)/(blendFactor+1e-6)); else if(mode==8) outColor.rgb = max(vec3(0.0), o+blendFactor-1.0);
    else if(mode==9) outColor.rgb = abs(o-blendFactor); else outColor.rgb = o + blendFactor - 2.0 * o * blendFactor;
  }

  if (u_hoverReactive > 0.5 && u_hoverRevealOnly > 0.5) outColor.a = cell;
  gl_FragColor = outColor;
}`;

function row8(v) { const a = []; for (let c = 0; c < 8; c++) a.push((v >> c) & 1); return a; }
export const PATTERNS = [
  { id: 'plain', name: 'Plain Weave', tileW: 2, tileH: 2, rows: [170, 85, 170, 85, 170, 85, 170, 85].map(row8) },
  { id: 'matt-rib-irregular', name: 'Matt Rib Weave Irregular', tileW: 4, tileH: 4, rows: [3, 12, 6, 9, 12, 3, 9, 6].map(row8) },
  { id: 'weft-rib-regular', name: 'Weft Rib Weave Regular', tileW: 3, tileH: 1, rows: [219, 219, 219, 219, 219, 219, 219, 219].map(row8) },
  { id: 'satin', name: 'Satin Weave', tileW: 5, tileH: 5, rows: [33, 132, 16, 66, 8, 33, 132, 16, 66, 8].map(row8) },
  { id: 'sateen', name: 'Sateen Weave', tileW: 5, tileH: 5, rows: [17, 136, 34, 80, 4, 17, 136, 34, 80, 4].map(row8) },
  { id: 'twill-2-2', name: '2/2 Twill Weave', tileW: 4, tileH: 4, rows: [51, 102, 204, 153, 51, 102, 204, 153].map(row8) },
  { id: 'twill-3-3', name: '3/3 Twill Weave', tileW: 6, tileH: 6, rows: [7, 14, 28, 56, 49, 35, 7, 14, 28, 56].map(row8) },
  { id: 'weft-rib-irregular', name: 'Weft Rib Weave Irregular', tileW: 4, tileH: 4, rows: [6, 2, 14, 2].map(row8) },
  { id: 'warp-rib-regular', name: 'Warp Rib Weave Regular', tileW: 3, tileH: 3, rows: [51, 51, 204, 51, 51, 204, 51, 51].map(row8) },
  { id: 'warp-rib-irregular', name: 'Warp Rib Weave Irregular', tileW: 4, tileH: 4, rows: [51, 204, 51, 204, 204, 51, 204, 51].map(row8) },
  { id: 'basket', name: 'Basket Weave', tileW: 4, tileH: 4, rows: [3, 3, 12, 12, 3, 3, 12, 12].map(row8) },
  { id: 'point-twill', name: 'Point Twill Weave', tileW: 8, tileH: 8, rows: [51, 102, 204, 153, 153, 204, 102, 51].map(row8) },
  { id: 'royal-oxford', name: 'Royal Oxford Weave', tileW: 6, tileH: 6, rows: [3, 3, 12, 9, 6, 24].map(row8) },
  { id: 'houndstooth', name: 'Houndstooth Weave', tileW: 8, tileH: 8, rows: [195, 150, 60, 105, 60, 105, 195, 150].map(row8) },
  { id: 'herringbone', name: 'Herringbone Weave', tileW: 8, tileH: 8, rows: [51, 102, 204, 153, 153, 204, 102, 51].map(row8) },
  { id: 'pattern-738', name: '738 (Diagonal Plus & Dots)', tileW: 6, tileH: 6, rows: [6, 7, 18, 17, 56, 20].map(row8) },
  { id: 'ens-vertical-pairs', name: 'ENS Vertical Pairs', tileW: 4, tileH: 10, rows: [row8(3), row8(9), ...Array(8).fill(row8(12))] },
  { id: 'curtain', name: 'Curtain', tileW: 4, tileH: 10, rows: [15, 9, 6, 9, 6, 9, 6, 9, 6, 15].map(row8) },
];
const TILE_MAX = 10;
export function buildPatternTexture(patterns = PATTERNS) {
  const w = TILE_MAX;
  const h = TILE_MAX * Math.max(1, patterns.length);
  const data = new Uint8Array(w * h * 4);
  patterns.forEach((pat, pi) => {
    const baseY = pi * TILE_MAX;
    for (let row = 0; row < pat.tileH; row++) {
      const r = pat.rows[row] ?? [];
      for (let col = 0; col < pat.tileW; col++) {
        const v = r[col] ? 255 : 0;
        const i = (baseY + row) * w * 4 + col * 4;
        data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
      }
    }
  });
  return { data, width: w, height: h };
}

