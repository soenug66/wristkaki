// Peningkatan progresif: halaman tetap berfungsi penuh tanpa JS.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- Jam LCD (waktu Singapore, SGT) ----
  const t = $('#lcdtime');
  if (t) {
    const fmt = new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short', day: '2-digit', month: 'short' });
    const tick = () => {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
      t.textContent = `${p.hour === '24' ? '00' : p.hour}:${p.minute}`; $('#lcdsec').textContent = p.second;
      $('#lcddow').textContent = p.weekday.toUpperCase(); $('#lcddate').textContent = `${p.day} ${p.month.toUpperCase()}`;
    };
    tick(); setInterval(tick, 1000);
  }

  // ---- Sort kategori ----
  const sort = $('#sort'), grid = $('#pgrid');
  if (sort && grid) sort.addEventListener('change', () => {
    const k = sort.value, items = $$('.card', grid);
    items.sort((a, b) => k === 'low' ? a.dataset.price - b.dataset.price : k === 'high' ? b.dataset.price - a.dataset.price : b.dataset.sold - a.dataset.sold);
    items.forEach(i => grid.appendChild(i));
  });

  // ---- Galeri produk ----
  const main = $('#mainimg');
  $$('.thumbs button').forEach(b => b.addEventListener('click', () => {
    main.src = b.dataset.full; $$('.thumbs button').forEach(x => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true');
  }));

  // ---- Case size finder: panduan umum, bukan aturan baku ----
  const W = $('#wrist'), out = $('#sizeout');
  if (W && out) {
    const calc = () => {
      const w = +W.value;
      if (!(w >= 11 && w <= 25)) { out.textContent = 'Enter your wrist circumference in cm (about 11 to 25).'; return; }
      const [lo, hi, where] = w < 14 ? [28, 36, ['/c/women/', "women's and Baby-G picks"]] : w < 15.5 ? [34, 40, ['/c/women/', "women's and slim picks"]] : w < 17 ? [38, 44, ['/c/analog/', 'analog and classic digital picks']] : w < 18.5 ? [41, 46, ['/c/gshock/', 'G-Shock picks']] : [44, 50, ['/c/gshock/', 'G-Shock and outdoor picks']];
      out.innerHTML = `For a <b>${w} cm</b> wrist, a case diameter of about <b>${lo} to ${hi} mm</b> is a sensible starting range. <a href="${where[0]}" style="color:#FF5A1F">See ${where[1]}</a>.`;
    };
    W.addEventListener('input', calc);
  }
})();
