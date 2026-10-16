# Wrist Kaki: minisite affiliate AliExpress untuk niche Casio Watch (Singapore)

Template yang sama dengan Bo Haze: AliExpress Affiliate API -> HTML statis -> GitHub -> Cloudflare Pages, cache di Supabase.
Bahasa Inggris (en-SG), harga S$, semua tombol Buy = `promotion_link` affiliate kamu.

## Beda dari minisite haze
- Fitur utama: **anti-KW**. Banner di atas, panduan "how to spot a fake Casio", dan peringatan otomatis di artikel produk kalau harga G-Shock/Baby-G/Edifice terlalu murah (ambang di `priceFlag()` di `scripts/lib/article.mjs`).
- Jam LCD live (waktu Singapore) di hero, **Case size finder** (`/tools/size/`) menggantikan kalkulator CADR.
- Filter exclude ketat: strap/parts/baterai, "G-Style", "inspired", brand tiruan. `mustMatch` mewajibkan kata Casio/G-Shock/model code di judul.
- Footer dan About memuat disclaimer **tidak berafiliasi dengan Casio**. Nama situs sengaja tidak memakai kata "Casio" (merek dagang).

## Preview & deploy
```
npm run preview   # data contoh + serve lokal (noindex)
npm run check     # build contoh + QA otomatis
```
Deploy sama persis dengan README minisite haze: Supabase `supabase.sql`, Cloudflare Pages (build `npm run build`, output `dist`), env var di `.env.example`. Ganti `domain` dan `contactEmail` di `config.json`.

## Cek setelah build pertama
- Log "Mata uang API": apakah SGD diterima atau dikonversi dari USD (lihat README haze untuk logika lengkap).
- Buka 5 produk acak di AliExpress dan bandingkan harga serta kecocokan judul.
- Tinjau manual produk yang kena peringatan harga. Heuristik, bukan bukti KW.
- Pakai `GEMINI_API_KEY` supaya artikel produk unik. Tanpa itu, artikel berbasis template per kategori + spesifikasi dari judul.
- Guide sudah 600+ kata (610-640 di body, 680-760 dengan FAQ). Tetap review manual: klaim sengaja dibuat umum dan berhedge, tambahkan data atau foto asli sendiri bila ada.
- Cek ketentuan program affiliate AliExpress soal penggunaan nama merek di konten.
