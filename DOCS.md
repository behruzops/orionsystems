# OrionSystems sayti — texnik dokumentatsiya

> Bu hujjat saytning **har bir qismi qanday ishlashini** va **qaysi kod qaysi vazifani bajarishini** to'liq tushuntiradi. Sayt — statik (HTML/CSS/JS), backend yo'q; barcha kontent `js/data.js` + brauzerdagi `localStorage` (admin) dan keladi.

---

## 1. Umumiy arxitektura

```
                 ┌─────────────── index.html ───────────────┐
                 │  (bo'limlar: hero, services, projects,    │
                 │   pricing, clients, contact, admin modal) │
                 └───────────────────────────────────────────┘
                                    │ yuklaydi
   ┌──────────┬──────────┬─────────┼─────────┬───────────┬──────────┐
   │ i18n.js  │ data.js  │ store.js│ stars.js│constellat.│ main.js  │ admin.js
   │ UI matn  │ kontent  │ saqlash │  fon    │  turkum   │ render   │ tahrir
   └──────────┴──────────┴─────────┴─────────┴───────────┴──────────┘

   project.html  ── project-detail.js  (loyiha tafsiloti, alohida tab)
```

**Ma'lumot oqimi:** `data.js` (asos) → `store.js` admin o'zgarishlarini ustiga qo'shadi (`Store.apply()`) → `main.js` / `constellation.js` / `project-detail.js` ekranga chizadi. Til tanlovi `localStorage["orionsys_lang"]` da, kontent o'zgarishlari `localStorage["orionsys_data"]` da saqlanadi.

---

## 2. Fayllar va vazifalari

### `index.html` — asosiy sahifa
Barcha bo'limlarning **bo'sh karkasi** (containerlar). Kontent JS bilan to'ldiriladi. Har bir matn `data-i18n="kalit"` atributi orqali tarjima oladi. Skriptlar tartibi muhim: `i18n → data → store → stars → constellation → main → admin`.

### `js/i18n.js` — interfeys matnlari
`window.I18N = { uz:{...}, ru:{...}, en:{...} }`. Faqat **UI yorliqlar** (nav, tugmalar, bo'lim sarlavhalari, narx yorliqlari, admin). `main.js` dagi `applyStatic()` har bir `[data-i18n]` elementiga mos matnni qo'yadi.

### `js/data.js` — strukturali kontent (3 tilda)
`window.DATA` ichida:
| Kalit | Nima |
|-------|------|
| `services[]` | 18 xizmat (icon slug, title/desc 3 tilda) |
| `projects[]` | turkum tugunlari (id, x/y joylashuv 0..1, accent rang, image, name/tagline/desc, tags) |
| `constellationEdges[]` | qaysi tugunlar bir-biriga bog'langan (o'rgimchak to'ri) |
| `oriondb` | ORIONDB chuqur ma'lumoti: `features[]`, `comparison[]` (EM/ASHviewer farqi), `releases[]` |
| `pricing.packages[]` | basic/pro/max — narx, imkoniyatlar, integratsiyalar |
| `clients[]` | mijoz logolari |
| `testimonials[]` | tavsiyanomalar |
| `contact` | telefon, telegram, email, linkedin, rezyume |

**Tarjima formati:** har matn `{uz:"…", ru:"…", en:"…"}`. `main.js` dagi `tr(obj)` joriy tilni oladi (yo'q bo'lsa `uz` ga qaytadi).

### `js/store.js` — saqlash qatlami (localStorage)
`window.Store`:
- `apply()` — `localStorage` dagi admin o'zgarishlarini `DATA` ustiga **deep-merge** qiladi (massivlar to'liq almashtiriladi, obyektlar birlashtiriladi). `main.js` yuklanishda chaqiradi.
- `set(section, value)` / `patchObject(section, partial)` — admin yozadi.
- `replace(full)` / `clear()` — import / tozalash.
- Kalit: `localStorage["orionsys_data"]` (shakli `DATA` ga mos).

### `js/stars.js` — animatsion yulduzli fon + parallaks
- `#starfield` canvas'iga chizadi (fixed, butun ekran).
- **3 ta chuqurlik qatlami** (parallaks): yaqin qatlam kattaroq/yorqinroq va sichqoncha bilan ko'proq siljiydi.
- `mousemove` → `mouse.tx/ty` (-1..1) → har qatlam `depth` ga ko'paytirib siljiydi (silliq `lerp` bilan). **Sichqonchani qimirlatganda yulduzlar qimirlaydi.**
- `deviceorientation` → mobil qurilmada qiyalik bilan parallaks.
- Miltillash (sinus) + tasodifiy **uchar yulduzlar** (shooting stars).
- `prefers-reduced-motion` hurmat qilinadi (animatsiyani kamaytiradi).

### `js/constellation.js` — loyihalar turkumi (markaziy vizual)
`window.Constellation.render(lang)`:
- O'rtada **OrionSystems logosi** (`.cn-center`, sekin aylanadi + nafas oladi).
- Har loyiha — **tugun** (`.cn-node`), `data.js` dagi `x/y` foiz joylashuvda.
- **SVG qatlami** (0..100 viewBox) chiziqlarni chizadi: markazdan har tugunga "spoke" + `constellationEdges` bo'yicha tugunlararo "web" (o'rgimchak to'ri).
- Hover → tugun kattalashadi, bog'langan chiziqlar yonadi, tooltip chiqadi.
- Tugunni bosish → `project.html?id=<id>` **yangi tabda** ochiladi.
- Til o'zgarsa faqat yorliqlarni yangilaydi (`relabel`); loyiha soni o'zgarsa qaytadan quradi (admin qo'shganda).

### `js/main.js` — bootstrap va render
`window.App`:
- `applyStatic()` — i18n matnlar.
- `renderServices/ProjectCards/Pricing/Models/Clients/Contact()` — `DATA` dan har bo'limni chizadi.
- `iconEl(icon)` — `_` bilan boshlangan ikonka → ichki SVG (brendsiz xizmatlar uchun); aks holda `cdn.simpleicons.org/<slug>` dan brend logosi (yuklanmasa fallback).
- `setLang()` — tilni almashtiradi, hammasini qayta chizadi, `Constellation.render()` chaqiradi.
- `observeReveals()` — scroll bilan paydo bo'lish animatsiyasi (IntersectionObserver).
- `App.refresh()` — admin o'zgartirgandan keyin qayta chizish uchun.

### `js/admin.js` — admin panel (kontentni kengaytirish)
- Footer'dagi **qalqon tugmasi** yoki `#admin` hash → ochiladi.
- Parol darvozasi (`ADMIN_PASS`, fayl boshida — **o'zgartiring!**). Sessiya `sessionStorage` da.
- 7 bo'lim: **Loyihalar, Xizmatlar, Mijozlar, Tavsiyalar, Narxlar, Aloqa, Ma'lumot**.
- Har matn maydoni 3 tilli (UZ/RU/EN) — `triField()` / `triVal()`.
- Rasm yuklash → `fileToDataURL()` avtomatik kichraytiradi (dataURL).
- Yangi loyiha avtomatik turkumga joylashtiriladi (oltin burchak bo'yicha tashqi halqaga).
- **Eksport / Import / Tozalash** — `Ma'lumot` bo'limida.
- Saqlash → `Store` → `App.refresh()`.

### `project.html` + `js/project-detail.js` — loyiha tafsiloti
- `?id=<id>` bo'yicha istalgan loyihani chizadi (hero + tags + CTA).
- `id==="oriondb"` bo'lsa qo'shimcha: **imkoniyatlar gridi**, **EM/ASHviewer/ORIONDB taqqoslash jadvali**, **release timeline**, **paketlar**.
- O'z til almashtirgichiga ega.

### `css/styles.css` — asosiy dizayn
Tokenlar (`:root`), nav, hero, bo'limlar, xizmat kartalari, narx jadvallari, mijozlar, tavsiyalar, aloqa, footer, **admin modal**, **loyiha tafsilot sahifasi**, responsive. Kosmik qorong'i mavzu (cyan + violet aksent).

### `css/constellation.css` — turkum dizayni
Container (aspect-ratio), SVG chiziqlar, markaziy logo (glow + aylanish), tugunlar (suzish animatsiyasi, accent glow), tooltip, mobil moslashuv (kichik ekranda turkum o'rniga kartalar).

---

## 3. Kontent qo'shish / o'zgartirish

**Variant A — Admin panel (tez, lokal):** footer qalqon tugmasi → parol (`orion2026`) → kerakli bo'lim → qo'shish/tahrirlash. **Eslatma:** o'zgarishlar **shu brauzerda** saqlanadi (localStorage), global emas. Boshqa qurilmaga ko'chirish uchun **Ma'lumot → Eksport** → boshqa joyda **Import**.

**Variant B — Kod (doimiy, hammaga):** `js/data.js` ni tahrirlang. Bu o'zgarishlar saytga "pishirilgan" — har bir ko'ruvchi ko'radi. Doimiy kontent uchun **shu yo'l tavsiya etiladi**.

Yangi tilni qo'shish: `i18n.js` ga 4-til obyekti + `data.js` matnlariga shu til kaliti + nav'ga til tugmasi.

---

## 4. Xavfsizlik

| Jihat | Holat |
|-------|-------|
| Backend yo'q | ✅ Hujum yuzasi minimal — faqat statik fayllar |
| XSS himoyasi | ✅ Barcha foydalanuvchi/kontent matni `escapeHtml()`/`esc()` orqali chiqariladi |
| Tashqi havolalar | ✅ `target="_blank"` + `rel="noopener"` |
| Admin paroli | ⚠️ **Mijoz tomonida** (`admin.js`). Bu jiddiy himoya EMAS — kod ochiq, texnik odam aylanib o'tishi mumkin. Faqat tasodifiy tahrirdan saqlaydi. **Parolni o'zgartiring** va public repo'da haqiqiy maxfiy ma'lumot saqlamang. |
| Tashqi resurslar | Shriftlar (Google Fonts) va ikonkalar (simpleicons CDN) tashqaridan yuklanadi; internetsiz ham sayt ishlaydi (fallback ikonka). |

**Tavsiya:** agar admin orqali kiritilgan kontent **hammaga ko'rinishi** kerak bo'lsa, uni `data.js` ga ko'chiring (admin faqat lokal localStorage'ga yozadi). Haqiqiy himoyalangan tahrirlash kerak bo'lsa — alohida backend + autentifikatsiya kerak.

---

## 5. Ishga tushirish va joylashtirish

**Lokal:**
```bash
cd C:/Users/user/Desktop/orionsystems
python -m http.server 8125
# brauzer: http://localhost:8125
```

**Joylashtirish (har qanday statik hosting):** papkani GitHub Pages / Cloudflare Pages / Netlify / o'z nginx serveringizga qo'ying. Build kerak emas — `index.html` ildizda turishi kifoya.

**Nginx namuna:**
```nginx
server {
    listen 80;
    root /var/www/orionsystems;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

---

## 6. Tezkor xulosa — "qaysi kod nima qiladi"

| Vazifa | Fayl | Asosiy joy |
|--------|------|------------|
| UI matnlar (3 til) | `js/i18n.js` | `I18N` |
| Kontent (xizmat/loyiha/narx…) | `js/data.js` | `DATA` |
| Admin o'zgarishlarni saqlash | `js/store.js` | `Store.apply/set` |
| Yulduzli fon + sichqoncha parallaks | `js/stars.js` | `mousemove` → `layers` |
| Loyihalar turkumi (o'rgimchak to'ri) | `js/constellation.js` | `Constellation.render` |
| Bo'limlarni chizish + til almashtirish | `js/main.js` | `App.renderAll/setLang` |
| Admin panel (kengaytirish) | `js/admin.js` | `tabAct` |
| ORIONDB tafsiloti (release/farq) | `js/project-detail.js` | `render()` |
| Vizual dizayn | `css/styles.css`, `css/constellation.css` | — |
```
