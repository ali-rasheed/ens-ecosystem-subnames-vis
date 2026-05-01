// Nameplate themes — primary / bg / links only (ENS tokens). Matches Figma nameplate table:
// lapis, pink (garnet), peridot, citrine, unthemed (quartz). Values reference :root in index.css.

/** @typedef {{ primary: string, bg: string, links: string }} NameplateTheme */

/** @type {Record<'lapis' | 'pink' | 'peridot' | 'citrine' | 'unthemed', NameplateTheme & { token: string }>} */
export const NAMEPLATE_COLORWAYS = {
  lapis: {
    token: 'lapis',
    primary: 'var(--lapis-500)',
    bg: 'var(--lapis-50)',
    links: 'var(--lapis-900)',
  },
  pink: {
    token: 'garnet',
    primary: 'var(--garnet-500)',
    bg: 'var(--garnet-50)',
    links: 'var(--garnet-900)',
  },
  peridot: {
    token: 'peridot',
    primary: 'var(--peridot-500)',
    bg: 'var(--peridot-50)',
    links: 'var(--peridot-900)',
  },
  citrine: {
    token: 'citrine',
    primary: 'var(--citrine-500)',
    bg: 'var(--citrine-50)',
    links: 'var(--citrine-900)',
  },
  unthemed: {
    token: 'quartz',
    primary: 'var(--quartz-700)',
    bg: 'var(--quartz-50)',
    links: 'var(--quartz-900)',
  },
};

export const NAMEPLATE_COLORWAY_KEYS = /** @type {const} */ ([
  'lapis',
  'pink',
  'peridot',
  'citrine',
  'unthemed',
]);
