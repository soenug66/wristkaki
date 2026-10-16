import { esc, sgd, orders, thumb, md, plain } from './util.mjs';
import { featuresOf, specsOf } from './article.mjs';

const NAV = { digital: 'Digital', gshock: 'G-Shock', analog: 'Analog', women: "Women's", outdoor: 'Outdoor' };

export function makeTemplates(cfg, ctx) {
  const { TODAY, SAMPLE, guides, fx } = ctx;
  const off = p => (p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0);

  const logo = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="8" fill="#101312"/><rect x="7" y="12" width="26" height="16" rx="3" fill="#BCC7A3"/><g fill="#101312"><rect x="10" y="15" width="4" height="10" rx="1"/><rect x="16" y="15" width="4" height="10" rx="1"/><rect x="22" y="15" width="4" height="10" rx="1"/><rect x="28" y="15" width="2" height="10" rx="1"/></g><circle cx="33" cy="31" r="2.4" fill="#FF5A1F"/></svg>`;

  // Jam LCD: waktu Singapore (SGT) diisi app.js. Tanpa JS tetap tampil rapi sebagai kartu "cek sebelum beli".
  const gauge = () => `<div class="lcd" id="lcd"><div class="face"><div class="day"><span id="lcddow">SGT</span><span id="lcddate">SINGAPORE</span></div><div class="time"><span id="lcdtime">--:--</span><span class="s" id="lcdsec">--</span></div></div>
<p class="lcdcap">Singapore time. Now, the checks that matter before you pay:</p>
<ul class="lcdlist"><li><b>Store</b><span>Official badge or long, clean history</span></li><li><b>Price</b><span>Far below retail is a warning sign</span></li><li><b>Model code</b><span>Must match Casio's own pages</span></li><li><b>Caseback</b><span>Look at buyer photos, not the hero shot</span></li></ul>
<a class="btn buy sm" href="/guides/how-to-spot-fake-casio-watch-aliexpress/">Read the fake-spotting guide</a></div>`;

  const img = (src, alt, w, h, extra = '', size = 400) => `<img src="${esc(thumb(src, size))}" data-full="${esc(src)}" onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full" alt="${esc(alt)}" width="${w}" height="${h}" ${extra}>`;
  const buy = (p, cls = '', label = 'Buy on AliExpress') => `<a class="btn buy ${cls}" href="${esc(p.link)}" target="_blank" rel="sponsored nofollow noopener" data-pid="${p.id}">${label}</a>`;
  const priceRow = p => `<p class="pr"><b>${sgd(p.price)}</b>${off(p) ? `<s>${sgd(p.was)}</s>` : ''}</p>`;
  const meta = p => `<p class="meta"><span>${orders(p.sold)}</span>${featuresOf(p).slice(0, 2).map(f => `<span>${esc(f)}</span>`).join('')}</p>`;
  const tag = p => (p.hot ? '<span class="tag hot">Hot in SG</span>' : off(p) >= 5 ? `<span class="tag">-${off(p)}%</span>` : '');

  const card = (p, lazy = true) => `<article class="card" data-price="${p.price}" data-sold="${p.sold}"><a class="ph" href="/p/${p.slug}/" tabindex="-1" aria-hidden="true">${img(p.img, p.title, 400, 400, lazy ? 'loading="lazy"' : '')}</a>${tag(p)}
<h3><a href="/p/${p.slug}/">${esc(p.title)}</a></h3>${meta(p)}${priceRow(p)}<div class="acts">${buy(p, 'sm', 'Buy now')}<a class="btn sm ghost" href="/p/${p.slug}/">Our take</a></div></article>`;

  const row = (p, i) => `<li class="brow"><span class="rank">${String(i + 1).padStart(2, '0')}</span><a class="bimg" href="/p/${p.slug}/" tabindex="-1" aria-hidden="true">${img(p.img, p.title, 96, 96, 'loading="lazy"', 200)}</a>
<div class="binfo"><a href="/p/${p.slug}/">${esc(p.title)}</a>${meta(p)}</div><div class="bprice">${priceRow(p)}</div><div class="acts">${buy(p, 'sm', 'Buy now')}<a class="btn sm ghost" href="/p/${p.slug}/">Our take</a></div></li>`;

  const specs = p => {
    const s = specsOf(p), r = [];
    r.push(['Model code', s.model || 'Not in title. Check listing']); if (s.wr) r.push(['Water resistance', `${s.wr} m (as listed)`]);
    const mat = [s.steel && 'metal or steel', s.resin && 'resin', s.carbon && 'carbon', s.sapphire && 'sapphire glass'].filter(Boolean); if (mat.length) r.push(['Materials', mat.join(', ')]);
    const ft = [s.solar && 'solar', s.bt && 'Bluetooth', s.radio && 'radio-controlled', s.world && 'world time'].filter(Boolean); if (ft.length) r.push(['Features', ft.join(', ')]);
    r.push(['Authenticity', 'Not verified. Check store and caseback photos']);
    return `<dl class="specs">${r.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="cap">Read from the listing title, not tested by us.</p>`;
  };

  const faqHtml = f => `<div class="faq">${f.map(q => `<details><summary>${esc(plain(q.q))}</summary><p>${md(q.a)}</p></details>`).join('')}</div>`;
  const ld = a => `<script type="application/ld+json">${JSON.stringify(a).replace(/</g, '\\u003c')}</script>`;
  const crumbLd = l => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: l.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: cfg.domain + x[1] })) });
  const faqLd = f => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(q => ({ '@type': 'Question', name: plain(q.q), acceptedAnswer: { '@type': 'Answer', text: plain(q.a) } })) });
  const crumb = l => `<nav class="crumb" aria-label="Breadcrumb">${l.map(([t, u]) => u ? `<a href="${u}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join('<i>/</i>')}</nav>`;

  const navItems = [['Hot in SG', '/hot/'], ...cfg.categories.map(c => [NAV[c.id] || c.label, `/c/${c.id}/`]), ['Guides', '/guides/'], ['Size finder', '/tools/size/']];
  const cur = (u, path) => (u === path || (u.length > 3 && path.startsWith(u) && u !== '/c/') ? ' aria-current="page"' : '');

  const page = ({ title, desc, path, body, schema = '', image = '', cls = '', type = 'website', noindex = false }) => `<!doctype html>
<html lang="en-SG"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${cfg.domain}${path}">
<link rel="alternate" hreflang="en-sg" href="${cfg.domain}${path}"><link rel="alternate" hreflang="x-default" href="${cfg.domain}${path}">
${SAMPLE || noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${cfg.domain}${path}"><meta property="og:site_name" content="${esc(cfg.siteName)}"><meta property="og:locale" content="en_SG">${image ? `<meta property="og:image" content="${esc(image.startsWith('http') ? image : cfg.domain + image)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#F5F1E8"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">${schema}</head>
<body class="${cls}"><a class="skip" href="#main">Skip to content</a>
<div class="psibar"><div class="wrap"><i class="dot" style="background:#FF5A1F"></i><span>Counterfeit Casios are common online. Check before you pay.</span><a href="/guides/how-to-spot-fake-casio-watch-aliexpress/">How to spot a fake &rarr;</a></div></div>
<header class="top"><div class="wrap"><a href="/" class="logo">${logo}<span>${esc(cfg.siteName)}</span></a><nav aria-label="Main">${navItems.map(([t, u]) => `<a href="${u}"${cur(u, path)}>${esc(t)}</a>`).join('')}</nav></div></header>
${SAMPLE ? '<p class="sample">SAMPLE PREVIEW: demo products and placeholder links. Never publish this build.</p>' : ''}
<main id="main">${body}</main>
<footer><div class="wrap"><div class="fcols">
<div><h2>${esc(cfg.siteName)}</h2><p>${esc(cfg.description)}</p><p><b>Affiliate disclosure:</b> we are an independent site, not run by AliExpress. When you buy through our links we may earn a commission, at no extra cost to you. <a href="/disclosure/">Read more</a>.</p></div>
<div><h2>Shop</h2><ul><li><a href="/hot/">Hot in Singapore</a></li>${cfg.categories.map(c => `<li><a href="/c/${c.id}/">${esc(c.label)}</a></li>`).join('')}${ctx.buds.map(b => `<li><a href="/best/under-${b}/">Under S$${b}</a></li>`).join('')}</ul></div>
<div><h2>Read</h2><ul>${guides.slice(0, 6).map(g => `<li><a href="/guides/${g.slug}/">${esc(g.h1)}</a></li>`).join('')}<li><a href="/guides/">All guides</a></li><li><a href="/tools/size/">Case size finder</a></li><li><a href="/about/">About</a></li></ul></div></div>
<p class="fine">Rankings use recent AliExpress order counts on listings that ship to Singapore. Prices are in Singapore dollars, checked ${TODAY}, and can change.${fx ? ` Prices are converted from USD at about 1 USD = S$${fx.toFixed(2)} and may differ slightly at checkout.` : ''} GST, delivery and the final total are confirmed at checkout. Not affiliated with, endorsed by or sponsored by Casio; brand names belong to their owners. &copy; ${new Date().getFullYear()} ${esc(cfg.siteName)}</p></div></footer>
<script src="/app.js" defer></script></body></html>`;

  return { off, gauge, img, buy, priceRow, card, row, specs, faqHtml, ld, crumbLd, faqLd, crumb, page, tag, meta };
}
