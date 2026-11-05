# St. Matthias Preschool Website: Architecture and Maintenance

Updated: 2026-11-05
Status: local build, not deployed. Replaces https://stmatthiaspreschool.org/ (eCatholic).
Open questions and unconfirmed facts: `docs/needs-preschool-confirmation.md`.

---

## 1. Built on the parish foundation

The site uses the St. Matthias Parish website (`../St_Matthias_Website`) as its base, so the two read as one family.

| File | Source | Rule |
|---|---|---|
| `css/tokens.css` | Parish, unchanged | Colors, type scale, spacing, motion tokens. Copy over again when the parish updates it. |
| `css/site.css` | Parish, unchanged | Header, dropdowns, drawer, buttons, cards, page hero, page grid, FAQ, footer, mission band, poster fan. |
| `js/nav.js` | Parish, unchanged | Header scroll state, dropdown menus, mobile drawer. |
| `css/preschool.css` | Preschool only | Home hero, age cards, video cards, tuition cards, steps, gallery, tour band. Adds one accent (`--sun`, from the preschool logo) for decoration only. |
| `js/preschool.js` | Adapted from parish `js/motion.js` | Reveals, headline word reveal, mission word-light, enrichment fan, pausable hero crossfade, click-to-play videos. |

Same fonts (Newsreader and Source Sans 3), same navy/terracotta/parchment palette, same header behavior (light over the hero, parchment on scroll), same 1200 px desktop-nav breakpoint. The header and footer carry the preschool's own sun logo (on a white tile, since the logo has a white background and black lettering), and the browser-tab icon is the same logo. The header text reads "St. Matthias Preschool / A ministry of St. Matthias Parish".

## 2. Site map and navigation

Old site: 6 top-level items in capitals and 33 menu entries, many of them one-paragraph pages (two STEM pages with swapped labels, three separate video pages, a "Home" menu that hid About and Contact). Prospective-parent and current-family content was mixed together, and tuition sat under "Tours."

New site: 5 topics plus one action, each a single page with anchored sections. Labels use parents' words.

| Route | Purpose | Sections |
|---|---|---|
| `/` | Home | Hero with at-a-glance facts · `#mission` · `#programs` · `#enrichment` · `#outdoors` · `#stories` · `#visit` |
| `/about/` | Who we are | `#mission` · `#director` · `#teachers` · `#parish` · `#contact` |
| `/programs/` | What children learn, by age | `#approach` · `#toddlers` · `#preschool` · `#pre-k` · `#toilet-training` · `#outdoors` |
| `/enrichment/` | The extras | `#music-movement` · `#stem` · `#spanish` · `#gardening` · `#faith` |
| `/admissions/` | Deciding and enrolling | `#tour` · `#tuition` · `#enroll` · `#faq` · `#after-preschool` |
| `/families/` | Social proof and current families | `#stories` · `#staying-in-touch` · `#events` · `#workshops` |
| `/privacy/` | Privacy Policy | Linked from the footer |

- Desktop bar: About Us ▾ · Programs ▾ · Enrichment ▾ · Admissions ▾ · Families ▾ · **Schedule a Tour** (the one filled button) · **St. Matthias Parish** (last; outline button, opens the parish site in a new tab; reads "Parish" between 1200 and 1359 px so the bar fits). This mirrors the parish site, whose last item is an outline "Preschool" button.
- The drawer lists St. Matthias Parish after Families.
- Tablet: logo, a "Tour" button, and the menu. Phone: logo and the menu; the drawer opens with Schedule a Tour at the top and hours and address at the bottom.
- Core facts (ages, hours, days, address) sit in the homepage hero. Tuition is one click from the hero.
- Every inner page ends with the same next-step band (Schedule a Tour plus a call or related link), so there are no dead ends.
- `vercel.json` redirects every old eCatholic URL to its new section.

## 3. One source for shared pieces

`data/site.json` holds the school facts, navigation and footer. `scripts/build.py` (Python 3, standard library only) writes the header, drawer and footer into every page between `<!-- build:header -->` / `<!-- /build:header -->` and `<!-- build:footer -->` / `<!-- /build:footer -->`. Never hand-edit inside the markers.

```bash
python3 scripts/build.py           # regenerate pages
python3 scripts/build.py --check   # fail if any page is out of date
```

Page body copy (tuition, programs, staff) lives in each page's HTML.

## 4. Images

- `docs/source-images/`: every image downloaded from the live site, untouched, plus `_manifest.tsv` (original URL for each file). Not published.
- `images/photos/`, `images/staff/`: resized web copies (JPEG, at most 1440 px for the hero and 1000 px elsewhere). Every `<img>` has `alt`, `width` and `height`; everything below the hero loads lazily.
- Crops are anchored to the top of each photo (`object-position: 50% 0%` by default, tuned per photo) so no head is cut off at the top at any screen width, and the home hero's photos start below the header bar. The 4:1 banner crops from the old homepage slideshow were not used, because their faces are already cut off at the top. Phone and tablet page heroes use 4:3 instead of 16:9 so portrait photos keep more height.
- Flyers with past dates (2024–2025 event invitations, a February 2025 Spanish word list) and generic eCatholic stock banners were not reused.
- Parent videos show a local thumbnail. YouTube loads only after a click, through youtube-nocookie.com. Without JavaScript the thumbnail is a normal link to YouTube.

## 5. Preview locally

```bash
python3 -m http.server 8788 --bind 127.0.0.1
```

Run it from the project folder, then open http://127.0.0.1:8788/. Every route is a folder with an `index.html`.

## 6. Accessibility and motion

- One `<h1>` per page, ordered headings, landmarks, skip link, visible focus.
- The hero photo crossfade has a visible Pause/Play button, stops when the hero is off-screen or the tab is hidden, and does not run under `prefers-reduced-motion`. The mission word-light and enrichment fan show their finished state on phones and under reduced motion.
- Tested at 375 px (no horizontal scroll, 17 px body text) and 1440 px. Automated audit: 0 broken internal links or anchors; all 7 external links return 200.

## 7. Deployment

`.vercelignore` (same as the parish) keeps `docs/`, `data/`, `scripts/` and `.claude/` off the public site. The published site is the HTML pages plus `css/`, `js/` and `images/`.
