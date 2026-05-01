// App-level defaults: aspect presets, swatches, sample dataset, localStorage key.

import { ENS } from './palette.js';

export const ASPECTS = {
  '1:1': { w: 1200, h: 1200, label: '1:1 · Square' },
  '16:9': { w: 1920, h: 1080, label: '16:9 · Wide' },
  '3:4': { w: 1200, h: 1600, label: '3:4 · Portrait' },
};

/** Color swatches for parent rows: [hex, darkInk?] */
export const SWATCHES = [
  [ENS.blue, false],
  [ENS.lapis400, false],
  [ENS.lapis300, true],
  [ENS.blueDark, false],
  [ENS.green, false],
  [ENS.peridot400, false],
  [ENS.magenta, false],
  [ENS.garnet400, false],
  [ENS.citrine, false],
  [ENS.citrine400, true],
  ['#FFEC3D', true],
  ['#191919', false],
  ['#737373', false],
  ['#E1E1E0', true],
  ['#FAF9F7', true],
];

export const DEFAULTS = [
  { key: 'world', label: 'World (world.id)', count: 17500000, color: ENS.green, darkInk: false },
  { key: 'caldera', label: 'Caldera (calderans.eth)', count: 9602145, color: ENS.citrine, darkInk: false },
  { key: 'base', label: 'Base (base.eth)', count: 2736542, color: ENS.lapis400, darkInk: false },
  { key: 'uni', label: 'Uniswap (uni.eth)', count: 2700000, color: ENS.magenta, darkInk: false },
  { key: 'eth', label: '.eth', count: 972494, color: ENS.blue, darkInk: false },
  { key: 'pinit', label: 'pinit.eth', count: 806002, color: ENS.citrine400, darkInk: true },
  { key: 'linea', label: 'Linea (linea.eth)', count: 570205, color: ENS.blueDark, darkInk: false },
];

export const STORAGE_KEY = 'ens-subname-viz-v1';
