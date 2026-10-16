import { pick, hash, sgd, shortTitle, clip } from './util.mjs';
import { sb } from './supabase.mjs';

const E = process.env;
const GUIDE = {
  digital: ['classic digital Casio guide', 'casio-f91w-vs-a168-vs-w218-classic-digitals'], gshock: ['G-Shock model comparison', 'g-shock-ga-2100-vs-dw-5600-vs-gmw-b5000'],
  analog: ['analog Casio guide', 'casio-analog-mtp-vs-edifice-singapore'], women: ['small wrist guide', 'best-casio-watches-for-small-wrists-singapore'],
  outdoor: ['solar vs battery guide', 'solar-vs-battery-casio-watches-singapore']
};
const g = c => `[${GUIDE[c][0]}](/guides/${GUIDE[c][1]}/)`;

// ---- Specs read straight from the listing title (never invented) ----
export function specsOf(p) {
  const t = p.raw, m = re => t.match(re);
  const model = (t.match(/\b[A-Z]{1,4}-?\d{2,4}[A-Z]{0,4}\d?(?:-[0-9][A-Z0-9]{0,3})?\b/g) || []).find(x => !/^(WR|ATM|IP|CR|LR|AAA|USB|H\d|PM|CO\d)/.test(x) && /[A-Z]-?\d/.test(x)) || null;
  const wrM = m(/\b(\d{2,3})\s*m(?:eters?)?\b/i)?.[1] || m(/\bwr\s?(\d{2,3})\b/i)?.[1] || (m(/\b(\d{1,2})\s*atm\b/i) ? m(/\b(\d{1,2})\s*atm\b/i)[1] * 10 : null);
  return {
    model, wr: wrM ? +wrM : null, solar: /solar/i.test(t), bt: /bluetooth|connected/i.test(t), radio: /multi ?band|wave ceptor|radio/i.test(t), world: /world ?time/i.test(t),
    steel: /stainless|steel|metal/i.test(t), resin: /resin/i.test(t), sapphire: /sapphire/i.test(t), carbon: /carbon/i.test(t), women: /women|ladies|lady|baby-?g|girl/i.test(t),
    gshock: /g-?shock|\b(ga|gm|gmw|gw|dw|gbd|gst|gwm)-?\d/i.test(t), mid: /edifice|pro ?trek|oceanus|\b(ef[a-z]?|prg|prw|ocw)-?\d/i.test(t), babyg: /baby-?g|\bb[ga][a-z]?-?\d/i.test(t)
  };
}
export function featuresOf(p) {
  const s = specsOf(p), f = [];
  if (s.model) f.push(`Model ${s.model}`); if (s.wr) f.push(`${s.wr} m water resistance`); if (s.solar) f.push('solar'); if (s.bt) f.push('Bluetooth'); if (s.radio) f.push('radio-controlled');
  if (s.world) f.push('world time'); if (s.steel) f.push('metal or steel'); if (s.resin) f.push('resin'); if (s.carbon) f.push('carbon'); if (s.sapphire) f.push('sapphire glass');
  return f.slice(0, 7);
}
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);
const tier = v => v < 40 ? 'about a mall dinner for two' : v < 90 ? 'about a weekend brunch plus a bubble tea run' : v < 180 ? 'about a night out at Clarke Quay, plus the cab home' : v < 350 ? 'a proper treat-yourself spend' : 'serious watch money, so verify everything';
const FAKE = '[guide to spotting a fake Casio](/guides/how-to-spot-fake-casio-watch-aliexpress/)';

// Heuristic, not proof: price far below what we would expect for genuine versions of that line.
function priceFlag(p, s) {
  const low = s.babyg ? 55 : s.gshock ? 60 : s.mid ? 80 : 0;
  return low && p.price < low ? low : 0;
}
function insights(p, s) {
  const out = [];
  if (priceFlag(p, s)) out.push(`**Price check:** ${sgd(p.price)} is lower than we would expect for a genuine watch in this line, which is a classic counterfeit warning sign. It is not proof, but treat it as a reason to check the store carefully and read our ${FAKE} before you pay.`);
  if (!s.model) out.push('The title does not show a model code. Genuine listings usually name one (for example GA-2100 or F-91W), so look for it on the product page and match it to Casio\'s own model pages.');
  if (s.wr && s.wr < 100) out.push(`The ${s.wr} m rating means everyday splashes, not swimming. See our [water resistance guide](/guides/casio-water-resistance-singapore-humidity/).`);
  if (s.radio) out.push('The title mentions radio-controlled timekeeping. Time signals come from distant transmitters, so automatic syncing may not work reliably in Singapore. Check Casio\'s coverage information.');
  return out;
}
const AUTH = ['Authenticity: look for a store with "Casio Official Store" branding or a long, well-reviewed history, and compare the model code with Casio\'s own pages. A brand-new store selling a G-Shock at half price is not a bargain, it is a lottery.',
  'Authenticity: open reviews with photos and look at the caseback. Genuine Casios show a model number and module number there. If buyers post blurry or missing casebacks, be careful.',
  'Authenticity: be suspicious of wording like "style", "inspired" or "Casio-like", and of listings that never show the logo clearly. When unsure, buying from an authorised retailer costs more but removes the guesswork.'];
const WARR = ['Warranty: a watch bought from an overseas seller may not be covered by local authorised service in Singapore. Check what the seller offers, and keep the order screenshots.',
  'Warranty: Casio\'s warranty terms can differ by market. If local after-sales support matters to you, confirm coverage before buying from an overseas seller.'];
const SG_A = ['Delivery: AliExpress shows an estimated arrival date at checkout. Give yourself a buffer if the watch is a gift, because "arrives before the dinner" is a promise nobody can make.',
  'Delivery: check the date at checkout and whether tracked shipping to Singapore is offered. A birthday gift that arrives next month is just a very expensive apology.'];
const GST = ['GST: depending on the seller and order, GST may already be in the price or added at checkout. The total on the payment page is the only number that counts.',
  'Tax: the price you see may or may not include GST. Compare final totals, not headline prices.'];
const SG_B = ['Returns: read the seller\'s return terms and the Buyer Protection window before paying, and film yourself opening the package. For a watch, that thirty seconds is cheaper than a dispute later.',
  'Seller check: filter reviews to ones with photos and read the three-star ones first. They are usually the most honest about fit, finish and whether the watch matches the pictures.'];

// ---- Copy pools per category. {n}=name {p}=price {t}=price tier {g}=guide link ----
const POOL = {
  digital: {
    hook: ['The {n} costs {p} ({t}) and belongs to the kind of watch that outlives three phones and two jobs. Classic Casio digitals are the 7-Eleven of the watch world: always there, always working.',
      'A digital Casio is the lowest-stakes watch purchase there is. The {n} is {p}, which is {t}, and it will still show the right time when your smartwatch is begging for a charger.',
      'Retro is in, but the {n} was never trying to be retro. At {p}, it is an LCD, a backlight and an alarm loud enough to wake an entire HDB corridor.'],
    fitH: 'Does a classic digital suit Singapore life?',
    fit: ['Slim, light LCD Casios suit our heat: no heavy case sticking to your wrist on the MRT. Check the case size against your wrist with the [case size finder](/tools/size/), and read our {g}.',
      'Look at the features that matter day to day: backlight, alarm, stopwatch and the water resistance number. Basic models handle splashes, not laps, so check the rating before the pool.',
      'Classics are also the most copied models. A real one has a clear model code you can match on Casio\'s own pages. More in our {g}.'],
    suit: 'Anyone who wants a light, cheap, dependable everyday watch, or a second watch for gym, hikes and rough days.',
    skip: 'Anyone who needs a swim-ready watch, smart features or a dressy look for formal events.',
    careH: 'Water resistance, battery and upkeep',
    care: 'Classic digitals typically run for years on a single battery, but the exact figure depends on the model, so check the spec. Rinse after sweaty runs, dry the strap, and avoid pressing buttons underwater. Our [water resistance guide](/guides/casio-water-resistance-singapore-humidity/) has the details.',
    pros: ['Light and slim', 'Simple, readable display', 'Very low entry price'], cons: ['Often only splash resistant', 'Plain look', 'Heavily copied, so verify the seller'],
    quick: 'A classic Casio digital at {p}. Great value if it is genuine and the water resistance fits how you will use it.',
    faq: [['Is this watch suitable for swimming?', 'Only if the listing gives a suitable rating, such as 100 m or 200 m. Many basic digitals are splash-resistant only.'], ['How can I tell if a classic Casio is real?', 'Match the model code, check the caseback markings in buyer photos, and buy from a store with a solid track record. See our guide on spotting fakes.']],
    verdict: ['The {n} is a cheap, cheerful classic. Buy it if the store checks out. If the price looks too good, it probably is.', 'At {p}, the {n} is hard to argue with on paper. The real question is whether it is genuine, so do the seller homework first.', 'A solid everyday pick if the listing is clear about the model and the store has proper history. If not, keep scrolling.']
  },
  gshock: {
    hook: ['G-Shocks are bought by people who want to stop worrying about their watch. The {n} ({p}, {t}) is meant to be that, if the listing is the real thing.',
      'Singapore is hot, sweaty and full of crowded MRT carriages. The {n} at {p} is the kind of tough watch that shrugs that off, provided it is genuine.',
      'The {n} costs {p}. For a G-Shock, that price either means a smart find or a warning sign, so let us look at both.'],
    fitH: 'Is a G-Shock right for you?',
    fit: ['G-Shocks are chunky by design. Check the case diameter and thickness against your wrist with the [case size finder](/tools/size/), especially if you wear shirts with fitted cuffs. Our {g} compares the main shapes.',
      'Pay attention to water resistance, whether the model is solar, and which strap material it uses. Features vary a lot across the range, so read the title and product page carefully.',
      'This is the most counterfeited Casio family. A fake can look great in photos and fall apart in weeks. Read our {g} before you buy.'],
    suit: 'People who want a tough everyday watch for work, sports or travel, and are comfortable with a bigger case.',
    skip: 'Anyone with a very small wrist, anyone who needs a dressy watch, or anyone tempted by a suspiciously low price.',
    careH: 'Water resistance, battery and upkeep',
    care: 'Rinse with fresh water after sweat or sea, dry the resin strap, and keep the buttons clean. Battery and solar details vary by model. See our [water resistance guide](/guides/casio-water-resistance-singapore-humidity/).',
    pros: ['Tough, shock-resistant design', 'Strong water resistance on many models', 'Wide choice of styles'], cons: ['Chunky on small wrists', 'Heavily counterfeited', 'Prices vary a lot between sellers'],
    quick: 'A G-Shock at {p}. Verify the store and model code first, then check the case size.',
    faq: [['Is this G-Shock genuine?', 'We cannot verify any individual listing. Check the store, match the model code and read our guide on spotting fakes.'], ['Will it fit a small wrist?', 'G-Shocks run large. Use our [case size finder](/tools/size/) and compare the listing\'s case diameter.']],
    verdict: ['The {n} is worth considering if the store is trustworthy and the model code matches. At {p}, price alone should not make the decision.', 'Buy it if the listing is clear and the seller is solid. If the discount feels unreal, trust that feeling.', 'A tough watch for Singapore life, but only the genuine one. Do the homework first.']
  },
  analog: {
    hook: ['The {n} ({p}, {t}) is for desks, dinners and weddings: simple, readable and unlikely to start a conversation about your wallet.',
      'Not every Casio has to survive a drop test. The {n} at {p} is for days when your watch needs to look sorted and keep time without fuss.',
      'Analog Casios are the quiet overachievers of the range. The {n} costs {p} and aims at the office crowd.'],
    fitH: 'Will it work with work clothes?',
    fit: ['Dress-style Casios are slim enough to slide under a shirt cuff. Check the case diameter with our [case size finder](/tools/size/) and compare with the strap width in the listing. Our {g} explains how the lines differ.',
      'Look at the glass (mineral or sapphire), strap type and water resistance. Many budget models are splash-proof, not swim-proof, so check the rating.',
      'Analog classics are also faked, though less than G-Shocks. Read our {g} and verify the store before buying.'],
    suit: 'Anyone who needs a presentable everyday watch without a luxury price, or a first "proper" watch.',
    skip: 'Anyone who wants a heavy-duty sports watch, or who expects premium finishing at a budget price.',
    careH: 'Glass, strap and upkeep',
    care: 'Metal straps may need sizing, which a watch stall can usually do. Keep the watch away from steam and hot showers, and rinse sweat off the strap. Water resistance ratings on dress models are often modest, so check the number.',
    pros: ['Clean, versatile look', 'Affordable compared with most analog brands', 'Easy to read'], cons: ['Usually modest water resistance', 'Mineral glass on many models', 'Finishing varies by line'],
    quick: 'An analog Casio at {p}. A sensible work watch if the model code and store check out.',
    faq: [['Is this suitable for the office?', 'Slim analog models usually are. Check case diameter and strap width in the listing.'], ['Can I swim with it?', 'Only if the listing gives a suitable rating. Many dress models are splash-resistant only.']],
    verdict: ['The {n} is a sensible daily watch if the details check out. At {p}, it is good value for presentable timekeeping.', 'Buy it for the look and the price, not for rugged specs. Verify the seller first.', 'A low-key, practical pick. Make sure the model code matches before paying.']
  },
  women: {
    hook: ['Smaller wrists deserve better than "men\'s watch, but pink". The {n} ({p}, {t}) is aimed at a more sensible fit.',
      'Baby-G, Sheen and slim digitals cover plenty of ground. The {n} costs {p}, and here is what to check before you buy.',
      'The {n} at {p} is a Casio sized for smaller wrists. The question is whether it fits yours and whether it is genuine.'],
    fitH: 'Will it fit your wrist?',
    fit: ['Ignore the gender label and check the numbers: case diameter, thickness and strap length. Our [case size finder](/tools/size/) gives a starting range, and the [small wrist guide](/guides/best-casio-watches-for-small-wrists-singapore/) goes deeper.',
      'Features still matter: water resistance, backlight, alarm and strap material. A Baby-G is usually tougher than a Sheen, which is dressier.',
      'Fakes target popular colours and styles. Read our {g} and verify the store before buying.'],
    suit: 'Anyone with a smaller wrist who wants a Casio that is not oversized, from rugged to dressy.',
    skip: 'Anyone who wants a large, chunky look, or who needs strong dive-level water resistance.',
    careH: 'Strap, battery and upkeep',
    care: 'Light-coloured straps stain faster in humid weather, so rinse after sweat and let the strap dry. Check the water resistance number before swimming. Battery life varies by model.',
    pros: ['Sizes made for smaller wrists', 'Range from rugged to dressy', 'Casio build quality at friendly prices'], cons: ['Style choices vary widely', 'Light colours stain easily', 'Fakes copy popular colours'],
    quick: 'A Casio for smaller wrists at {p}. Check case size, store and model code before buying.',
    faq: [['What case size suits a small wrist?', 'Roughly 28 to 38 mm for many small wrists, but it depends on style. Use our [case size finder](/tools/size/).'], ['Is Baby-G durable?', 'Baby-G follows the shock-resistant idea of G-Shock. Details vary by model, so read the listing.']],
    verdict: ['The {n} is worth a look if the size suits you and the store checks out. At {p}, it is a sensible buy.', 'Buy it if the case size and features fit. Skip it if the seller looks shaky.', 'A good option for smaller wrists, as long as it is genuine. Do the homework first.']
  },
  outdoor: {
    hook: ['Singapore is hot, humid and sunny, which makes it a long exam for watches. The {n} ({p}, {t}) is meant for that, or for weekend dives.',
      'East Coast Park runs, Sentosa swims and the occasional MacRitchie hike all take a toll. The {n} at {p} is built for the sweaty life.',
      'Solar, dive and trek Casios cost more than basic ones. The {n} is {p}, and we will check what it really offers.'],
    fitH: 'Does it suit Singapore weather?',
    fit: ['Heat, humidity and sweat are tough on watches. Look for a high water resistance rating and a resin strap that rinses easily. Our [water resistance guide](/guides/casio-water-resistance-singapore-humidity/) explains the ratings.',
      'Solar models can charge from indoor light, but far more slowly than outdoors. See our {g} for what that means in practice.',
      'Dive and outdoor models are popular targets for fakes. Read our [fake-spotting guide](/guides/how-to-spot-fake-casio-watch-aliexpress/) and verify the store before buying.'],
    suit: 'Runners, swimmers, hikers and weekend divers who want a watch that is not precious about water and sun.',
    skip: 'Anyone who wants a slim dress watch, or who expects certified dive performance from a listing that does not state it.',
    careH: 'Water resistance, solar and upkeep',
    care: 'Rinse with fresh water after sea or pool use. Keep solar models exposed to light regularly. A watch rated for diving still needs its seals checked occasionally, so keep service in mind.',
    pros: ['Strong water resistance on many models', 'Solar options reduce battery worries', 'Built for heat and sweat'], cons: ['Higher prices attract fakes', 'Bigger cases', 'Radio sync may not work in Singapore'],
    quick: 'An outdoor Casio at {p}. Good for sweat and sun if the specs are real, so verify the store and rating first.',
    faq: [['Is this watch suitable for diving?', 'Only if the listing and model confirm a dive-grade rating. Check the product page and Casio\'s model information before relying on it.'], ['Does solar work in Singapore?', 'Yes, solar models charge well in our sunshine, and slower under indoor light.']],
    verdict: ['The {n} is a sensible pick for active Singapore life if the store and model check out.', 'Buy it for sweat, sun and splashes. Do the authenticity check first.', 'At {p}, the {n} could be a solid outdoor watch. Verify before you rely on its water rating.']
  }
};

// Pilih template judul pertama yang muat <= 60 karakter; kalau semua kepanjangan, potong NAMA produknya, bukan kalimatnya.
function fitTitle(name, price, id) {
  const T = [n => `${n}: Worth It in Singapore? (${price})`, n => `${n} Price in Singapore (${price})`, n => `Is the ${n} Worth ${price}?`];
  const start = hash(id) % T.length, order = [0, 1, 2].map(i => T[(start + i) % T.length]);
  const fit = order.find(f => f(name).length <= 60);
  if (fit) return fit(name);
  const f = order[0];
  return f(clip(name, Math.max(12, 60 - f('').length)).replace(/…$/, ''));
}

function fallback(p, cfg, c) {
  const C = POOL[p.cat], s = specsOf(p), feats = featuresOf(p), name = shortTitle(p.title), price = sgd(p.price);
  const f = t => t.replaceAll('{n}', name).replaceAll('{p}', price).replaceAll('{t}', tier(p.price)).replaceAll('{g}', g(p.cat));
  const ins = insights(p, s);
  return {
    title: fitTitle(name, price, p.id),
    meta: clip(`${name} at ${price} on AliExpress, shipping to Singapore. How to check it is genuine, plus water resistance, warranty and GST before you buy.`, 155),
    h1: `${name}: what to know before you buy in Singapore`,
    quick: f(C.quick),
    intro: f(pick(C.hook, p.id, 1)),
    sections: [
      { h: `What you get with the ${name}`, b: [`It is a Casio-branded watch listed at ${price}${p.was > p.price ? ` (marked down from ${sgd(p.was)})` : ''}, with ${p.sold.toLocaleString('en-US')}+ recent orders${p.rate ? ` and a ${p.rate} positive rating` : ''}.`,
        feats.length ? `The listing title mentions: ${list(feats)}. Confirm the details on the product page, because titles are written by sellers, not by an editor with a conscience.` : 'The title does not give much to go on, so check the product page for the model code, water resistance and materials before you commit.', ...ins] },
      { h: C.fitH, b: f(pick(C.fit, p.id, 2)) },
      { h: 'Who should buy it, and who should skip it', b: [`**Good fit:** ${C.suit}`, `**Skip it if:** ${C.skip}`] },
      { h: C.careH, b: f(C.care) },
      { h: 'Is it genuine? Buying from AliExpress in Singapore', b: [pick(AUTH, p.id, 3), pick(WARR, p.id, 4), pick(SG_A, p.id, 5), pick(GST, p.id, 6), pick(SG_B, p.id, 7)] },
      { h: 'The verdict', b: f(pick(C.verdict, p.id, 8)) }
    ],
    pros: C.pros, cons: C.cons,
    faq: [...C.faq.map(([q, a]) => ({ q, a })), { q: 'Does this ship to Singapore?', a: 'Listings on this site are requested for Singapore delivery and shown in S$. Confirm the delivery estimate, GST and final price at checkout.' }]
  };
}

// ---- Gemini (optional) ----
let cand;
async function models() {
  if (cand) return cand;
  if (E.GEMINI_MODEL) return (cand = [E.GEMINI_MODEL]);
  const fb = ['gemini-2.5-flash', 'gemini-3-flash-preview'];
  try {
    const r = await (await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': E.GEMINI_API_KEY } })).json();
    const v = n => +(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] || 0);
    const names = (r.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => m.name.replace('models/', ''))
      .filter(n => /flash/.test(n) && !/lite|tts|image|live|audio|computer|embed|thinking|exp/.test(n)).sort((a, b) => (/preview/.test(a) - /preview/.test(b)) || v(b) - v(a));
    cand = names.length ? names.slice(0, 3) : fb;
  } catch { cand = fb; }
  return cand;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const tidy = s => typeof s === 'string' ? s.replace(/\s*—\s*|\s+–\s+/g, ', ') : s;

export async function article(p, cfg, c) {
  const id = `sg${cfg.articleVersion}-${p.id}`;
  const hit = await sb('GET', `articles?id=eq.${id}&select=data`);
  if (hit?.[0]) return hit[0].data;
  let a = fallback(p, cfg, c), ok = false;
  const name = shortTitle(p.title);
  const prompt = `Write a 700-word SEO buyer's-guide style article (NOT a hands-on review: never claim to have tested, worn, used or received the watch; base it on the listing and general know-how) for shoppers in Singapore about this Casio-branded watch listed on AliExpress: "${p.raw}", price ${sgd(p.price)} (SGD), ${p.sold} recent orders, positive rating ${p.rate || 'n/a'}. Category: ${c.label} (${c.mood}). Details visible in the title: ${featuresOf(p).join(', ') || 'none stated'}.
Reader: Singapore resident, 20-45, wants a reliable everyday or sports watch at a sensible price, worried about fakes.
Voice: casual, witty, relatable to Singaporeans (MRT, kopitiam, humid weather, East Coast Park runs, HDB life). Singlish at most once or twice and only if natural. BANNED: marketing cliches ("elevate", "must-have", "game changer", "timeless elegance", "make a statement", "say goodbye to", "perfect for any occasion"), emojis, em dashes. Be honest and include real cons.
Rules: only state specs you can infer from the title; never invent model details, materials, battery life, water ratings or certifications. If a detail is unknown, say to check the listing. Never say the watch is genuine or guaranteed authentic: AliExpress has counterfeits, so cover how to check (official store, model code and caseback in buyer photos, price sanity, store age and reviews). Mention Singapore buying points: GST and delivery estimate shown at checkout, warranty from an overseas seller may not be honoured by local authorised service, seller return terms. Do not use medical claims.
Primary keyword: "${name}" (use it in the intro, one H2 and the verdict). Natural internal links allowed with markdown: [how to spot a fake Casio](/guides/how-to-spot-fake-casio-watch-aliexpress/), [case size finder](/tools/size/), [water resistance guide](/guides/casio-water-resistance-singapore-humidity/), [buying a Casio on AliExpress in Singapore](/guides/buying-casio-on-aliexpress-singapore-warranty-gst/).
Return ONLY JSON: {"title":"<=58 chars, includes 'Singapore' and either 'Worth It' or the price","meta":"<=155 chars","h1":"","quick":"one-sentence short version, <=200 chars","intro":"","sections":[{"h":"","b":""}] (5-6 sections, last is 'The verdict'),"pros":["","",""],"cons":["","",""],"faq":[{"q":"","a":""}] (3 items)}`;
  if (E.GEMINI_API_KEY) for (let t = 0; t < 3 && !ok; t++) try {
    await wait(5000 * (t + 1));
    const ms = await models(), m = ms[t % ms.length];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST',
      headers: { 'x-goog-api-key': E.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4500 } }) });
    if (!res.ok) throw new Error(`HTTP ${res.status} (${m}): ${(await res.text()).slice(0, 200)}`);
    const j = JSON.parse((await res.json()).candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());
    if (!j.h1 || !j.sections?.length || !j.faq?.length) throw new Error('bad JSON shape');
    a = { ...a, ...j, title: clip(tidy(j.title || a.title), 60), meta: clip(tidy(j.meta || a.meta), 155), h1: tidy(j.h1), quick: tidy(j.quick), intro: tidy(j.intro),
      sections: j.sections.map(s => ({ h: tidy(s.h), b: tidy(s.b) })), faq: j.faq.map(x => ({ q: tidy(x.q), a: tidy(x.a) })) };
    ok = true;
  } catch (e) { console.warn(`Gemini attempt ${t + 1} failed for ${p.id}: ${e.message}`); }
  if (ok) await sb('POST', 'articles', { id, data: a }, { Prefer: 'resolution=merge-duplicates' });
  return a;
}
