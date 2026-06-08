# OrionSystems — kompaniya sayti

Professional, **3 tilli (UZ/RU/EN)** statik sayt. IT/DevOps/monitoring xizmatlari, loyihalar (Orion turkumi ko'rinishida), ORIONDB paketlari va narxlari, mijozlar, tavsiyanomalar va admin panel.

## Tezkor ishga tushirish
```bash
cd orionsystems
python -m http.server 8125
# http://localhost:8125
```
Build kerak emas — toza HTML/CSS/JS.

## Asosiy imkoniyatlar
- 🌌 **Yulduzli fon** — miltillaydi, uchar yulduzlar, **sichqoncha bilan parallaks**
- ✨ **Loyihalar turkumi** — markazda OrionSystems logosi, loyihalar Orion yulduzlari kabi o'rgimchak to'riday bog'langan; tugunni bossangiz alohida tabda to'liq ma'lumot
- 🧩 **ORIONDB tafsiloti** — imkoniyatlar, **Oracle EM / ASHviewer bilan farqi**, release tarixi, paketlar
- 💳 **Narxlar** — Basic / Pro / Max + 4 litsenziya turi (1 oy bepul, yillik, bir martalik, doimiy support)
- 🏢 **Mijozlar** — logolar + tavsiyanomalar
- 🌐 **3 til** — UZ / RU / EN to'liq
- 🛠 **Admin panel** — kontentni kengaytirish (loyiha/xizmat/mijoz/tavsiya/narx/aloqa qo'shish)

## Admin panel
Footer'dagi **qalqon ikonkasi** (yoki URL'ga `#admin`) → parol.
- **Parol:** `orion2026` — ⚠️ `js/admin.js` boshida o'zgartiring (`ADMIN_PASS`).
- O'zgarishlar shu brauzerda saqlanadi (localStorage). Boshqa qurilmaga: **Ma'lumot → Eksport / Import**.
- Doimiy, hammaga ko'rinadigan kontent uchun `js/data.js` ni tahrirlang.

## Struktura
```
index.html              — asosiy sahifa
project.html            — loyiha tafsiloti (?id=oriondb)
css/styles.css          — asosiy dizayn
css/constellation.css   — turkum komponenti
js/i18n.js              — UI matnlar (3 til)
js/data.js              — kontent (xizmat/loyiha/narx/mijoz…)
js/store.js             — localStorage saqlash
js/stars.js             — yulduzli fon + parallaks
js/constellation.js     — loyihalar turkumi
js/main.js              — render + til almashtirish
js/admin.js             — admin panel
js/project-detail.js    — loyiha tafsilot sahifasi
assets/                 — logo, ikonka, maketlar, mijoz logolari
DOCS.md                 — to'liq texnik dokumentatsiya
```

To'liq tushuntirish: **[DOCS.md](DOCS.md)** (qaysi kod nima qiladi, xavfsizlik, joylashtirish).

## Joylashtirish
Statik papka — GitHub Pages, Cloudflare Pages, Netlify yoki o'z nginx serveringizga qo'ying. `index.html` ildizda tursin.

---
© OrionSystems — Shuxratov Behruz · [Telegram](https://t.me/Shuxratov_Behruz) · [LinkedIn](https://www.linkedin.com/in/shuxratov-behruz-2323233a6/)
