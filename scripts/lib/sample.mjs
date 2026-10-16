// Data contoh untuk PREVIEW LOKAL saja (SAMPLE=1). Tidak pernah dipakai di build produksi.
// Beberapa judul sengaja "jebakan" (strap pengganti, gaya G-Shock, harga mencurigakan) untuk menguji filter dan peringatan.
import { mkdir, writeFile } from 'node:fs/promises';
import { cleanTitle, slugify } from './util.mjs';

const strap = c => `<rect x="158" y="20" width="84" height="120" rx="14" fill="${c}"/><rect x="158" y="260" width="84" height="120" rx="14" fill="${c}"/><g fill="#0003"><circle cx="200" cy="300" r="4"/><circle cx="200" cy="326" r="4"/><circle cx="200" cy="352" r="4"/></g>`;
const kinds = {
  digital: (c1, c2) => `${strap(c1)}<rect x="132" y="120" width="136" height="160" rx="18" fill="${c1}"/><rect x="146" y="150" width="108" height="76" rx="6" fill="#BCC7A3"/><g fill="#1b2216"><rect x="156" y="170" width="20" height="36" rx="2"/><rect x="182" y="170" width="20" height="36" rx="2"/><rect x="212" y="170" width="20" height="36" rx="2"/></g><circle cx="152" cy="252" r="6" fill="${c2}"/><circle cx="248" cy="252" r="6" fill="${c2}"/>`,
  gshock: (c1, c2) => `${strap(c1)}<rect x="116" y="104" width="168" height="192" rx="34" fill="${c1}"/><rect x="134" y="124" width="132" height="152" rx="22" fill="${c2}"/><rect x="146" y="150" width="108" height="76" rx="6" fill="#0d1210"/><text x="200" y="198" text-anchor="middle" font-family="monospace" font-weight="700" font-size="34" fill="#7CF7C0">10:09</text><circle cx="200" cy="252" r="8" fill="#FF5A1F"/>`,
  analog: (c1, c2) => `${strap(c1)}<circle cx="200" cy="200" r="86" fill="${c2}"/><circle cx="200" cy="200" r="70" fill="#F5F3EC"/><g stroke="#13231F" stroke-width="5" stroke-linecap="round"><path d="M200 200V152"/><path d="M200 200L232 218"/></g><g stroke="#13231F" stroke-width="3">${Array.from({ length: 12 }, (_, i) => `<path d="M200 138v8" transform="rotate(${i * 30} 200 200)"/>`).join('')}</g><circle cx="200" cy="200" r="5" fill="#13231F"/>`,
  baby: (c1, c2) => `${strap(c1)}<rect x="130" y="124" width="140" height="152" rx="40" fill="${c2}"/><circle cx="200" cy="200" r="52" fill="#F7F1F1"/><g stroke="#13231F" stroke-width="4" stroke-linecap="round"><path d="M200 200V164"/><path d="M200 200L224 212"/></g><circle cx="200" cy="200" r="4" fill="#13231F"/>`,
  diver: (c1, c2) => `${strap(c1)}<circle cx="200" cy="200" r="92" fill="${c2}"/><circle cx="200" cy="200" r="72" fill="#0d1b17"/><g stroke="#F0F0E6" stroke-width="5" stroke-linecap="round"><path d="M200 200V150"/><path d="M200 200L236 220"/></g><g fill="#FF5A1F"><circle cx="200" cy="140" r="5"/></g><circle cx="200" cy="200" r="5" fill="#F0F0E6"/>`
};
const svg = (k, c1, c2, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/><ellipse cx="200" cy="372" rx="100" ry="10" fill="#101312" opacity=".12"/>${kinds[k](c1, c2)}</svg>`;

const D = [
  ['digital', 'Casio F-91W-1 Classic Digital Watch Resin Strap Alarm Stopwatch 30M', 24.9, 32, 22400, 'digital', '#2A2D2C', '#888'],
  ['digital', 'Casio A168WA-1 Vintage Digital Watch Stainless Steel Retro Unisex', 58, 78, 6100, 'digital', '#B9BBB6', '#555'],
  ['digital', 'Casio W-218H-1A Digital Watch Men 50M Backlight Resin', 39, 52, 3300, 'digital', '#1E2A3A', '#6A7C99'],
  ['digital', 'Casio AE-1200WH-1A Digital Watch 100M World Time Illuminator', 48.5, 66, 4100, 'digital', '#3A3A3A', '#999'],
  ['digital', 'Replacement Strap for Casio F-91W Resin Band', 6.9, 12, 15000, 'digital', '#fff', '#ccc'],
  ['gshock', 'Casio G-Shock GA-2100-1A1 Carbon Core Guard 200M Men Watch', 148, 189, 5600, 'gshock', '#1B1B1B', '#2C2C2C'],
  ['gshock', 'Casio G-Shock DW-5600E-1V Digital 200M Square Men Watch', 98, 128, 4800, 'gshock', '#202020', '#363636'],
  ['gshock', 'Casio G-Shock GMW-B5000D-1 Full Metal Bluetooth Solar Men Watch', 520, 640, 1100, 'gshock', '#A8ABAE', '#C7CACD'],
  ['gshock', 'G-Shock Style Sport Watch Men Waterproof LED', 14, 30, 9000, 'gshock', '#fff', '#ccc'],
  ['gshock', 'Casio G-Shock GA-2100 Special Offer 200M Men Watch', 39, 120, 2400, 'gshock', '#2B3A2F', '#3E5244'],
  ['gshock', 'Casio G-Shock GA-110-1B 200M Men Watch Big Case', 135, 170, 2000, 'gshock', '#111', '#2A2A2A'],
  ['analog', 'Casio MTP-1374D-1AV Men Analog Watch Stainless Steel Day Date', 78, 105, 3900, 'analog', '#C4C6C9', '#8B8F94'],
  ['analog', 'Casio Edifice EFR-556DB-1A Chronograph 100M Men Watch', 168, 220, 1500, 'analog', '#26364D', '#1C2635'],
  ['analog', 'Casio MTP-V002L-1B Leather Strap Men Analog Dress Watch', 52, 70, 2700, 'analog', '#4A3426', '#B8BCC0'],
  ['analog', 'Casio MTP-1183A-7A Men Dress Watch Day Date', 61, 82, 1800, 'analog', '#BFC1C4', '#9AA0A6'],
  ['women', 'Casio Baby-G BGA-110-1B Women Watch 100M Shock Resistant', 109, 140, 3200, 'baby', '#222', '#F06292'],
  ['women', 'Casio LW-203-1A Ladies Digital Watch Resin Slim', 42, 58, 2100, 'digital', '#2A2A2A', '#999'],
  ['women', 'Casio Sheen SHE-4529D-7A Women Analog Watch Stainless Steel', 189, 245, 800, 'analog', '#D8D2C8', '#C9A66B'],
  ['women', 'Casio Baby-G BA-110-4A1 Women 100M Pink', 125, 160, 1700, 'baby', '#D98BA4', '#EAA7BD'],
  ['outdoor', 'Casio Duro MDV-106-1A Diver Watch 200M Men Analog', 74, 98, 5200, 'diver', '#1A1A1A', '#2B2B2B'],
  ['outdoor', 'Casio Pro Trek PRG-340-1 Solar Triple Sensor Men Watch', 288, 360, 640, 'gshock', '#2E3B2F', '#1E2820'],
  ['outdoor', 'Casio G-Shock GW-M5610U-1 Solar Multi Band 200M Men Watch', 245, 300, 1300, 'gshock', '#181818', '#262626'],
  ['outdoor', 'Casio Standard AQ-S810W-1A Solar Digital Watch 100M', 62, 85, 2500, 'digital', '#25303A', '#7E8FA3']
];

export async function sampleCatalog(dir) {
  await mkdir(`${dir}/sample`, { recursive: true });
  const out = [];
  for (const [i, [cat, raw, price, was, sold, kind, c1, c2]] of D.entries()) {
    const id = String(9100000 + i), title = cleanTitle(raw);
    await writeFile(`${dir}/sample/${id}-a.svg`, svg(kind, c1, c2, '#F4F3EA'));
    await writeFile(`${dir}/sample/${id}-b.svg`, svg(kind, c2, c1, '#E3E6D8'));
    out.push({ id, raw, title, img: `/sample/${id}-a.svg`, gallery: [`/sample/${id}-a.svg`, `/sample/${id}-b.svg`], price, was, rate: `${92 + (i % 6)}.${i % 10}%`, sold,
      link: `https://example.com/sample-affiliate/${id}`, hot: sold > 5000, cat, slug: slugify(title, id) });
  }
  return out;
}
