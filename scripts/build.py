#!/usr/bin/env python3
"""Regenerate the shared regions of the St. Matthias Preschool site.

The site is plain static HTML built on the St. Matthias Parish foundation
(css/tokens.css, css/site.css and js/nav.js are shared with the parish site).
The header, mobile drawer and footer live between marker comments:

    <!-- build:NAME -->  ...generated...  <!-- /build:NAME -->

Source (edit this, never the generated HTML):
    data/site.json   school facts, navigation, footer

Usage:
    python3 scripts/build.py           rewrite the pages
    python3 scripts/build.py --check   exit 1 if any page is out of date

Standard library only. Python 3.8+.
"""

import argparse
import json
import re
import sys
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# page file -> nav id that gets aria-current (None for none)
PAGES = {
    "index.html": None,
    "about/index.html": "about",
    "programs/index.html": "programs",
    "enrichment/index.html": "enrichment",
    "admissions/index.html": "admissions",
    "families/index.html": "families",
    "privacy/index.html": None,
}

CHEVRON = (
    '<svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">'
    '<path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" '
    'stroke-linecap="round" stroke-linejoin="round"/></svg>'
)
NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>'


def e(text):
    return escape(text, quote=True)


def ext_attrs(href):
    return ' target="_blank" rel="noopener"' if href.startswith("http") else ""


def link(label, href, external=None, cls=""):
    external = href.startswith("http") if external is None else external
    c = f' class="{cls}"' if cls else ""
    tail = NEW_TAB if external else ""
    attrs = ' target="_blank" rel="noopener"' if external else ""
    return f'<a{c} href="{e(href)}"{attrs}>{e(label)}{tail}</a>'


def short_label(label):
    """'St. Matthias Parish' -> the first words collapse on narrower desktops, the last word stays."""
    head, _, last = label.rpartition(" ")
    # A no-break space: the button is a flex box, which would drop an ordinary trailing space.
    return f'<span class="nav-long">{e(head)}&nbsp;</span>{e(last)}' if head else e(label)


def header(site, current):
    s = site["school"]
    items = []
    for item in site["nav"]:
        cur = ' aria-current="page"' if item["id"] == current else ""
        if item.get("style") == "cta":
            items.append(
                f'        <li class="nav-item nav-item-external nav-item-cta"><a class="nav-link nav-external" '
                f'href="{e(item["href"])}">{e(item["label"])}</a></li>'
            )
            continue
        if item.get("style") == "external":
            items.append(
                f'        <li class="nav-item nav-item-external nav-item-parish"><a class="nav-link nav-external" '
                f'href="{e(item["href"])}" target="_blank" rel="noopener">{short_label(item["label"])}{NEW_TAB}</a></li>'
            )
            continue
        kids = item.get("children") or []
        if not kids:
            items.append(f'        <li class="nav-item"><a class="nav-link" href="{e(item["href"])}"{cur}>{e(item["label"])}</a></li>')
            continue
        sub = "".join(f'<li><a href="{e(k["href"])}">{e(k["label"])}</a></li>' for k in kids)
        items.append(
            f'        <li class="nav-item has-sub"><a class="nav-link" href="{e(item["href"])}"{cur}>{e(item["label"])}</a>'
            f'<button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-{item["id"]}">'
            f'<span class="visually-hidden">{e(item["label"])} menu</span>{CHEVRON}</button>'
            f'<ul class="subnav" id="sub-{item["id"]}">{sub}</ul></li>'
        )

    drawer = []
    for item in site["nav"]:
        if item.get("style") == "cta":
            continue
        if item.get("style") == "external":
            drawer.append(
                f'        <li class="drawer-item drawer-item-external"><div class="drawer-row">'
                f'{link(item["label"], item["href"], True)}</div></li>'
            )
            continue
        cur = ' aria-current="page"' if item["id"] == current else ""
        kids = item.get("children") or []
        row = f'<div class="drawer-row"><a href="{e(item["href"])}"{cur}>{e(item["label"])}</a>'
        if kids:
            row += (
                f'<button class="drawer-sub-toggle" type="button" aria-expanded="false" aria-controls="dsub-{item["id"]}">'
                f'<span class="visually-hidden">Show {e(item["label"])} links</span>{CHEVRON}</button></div>'
                f'<ul class="drawer-sub" id="dsub-{item["id"]}" hidden>'
                + "".join(f'<li><a href="{e(k["href"])}">{e(k["label"])}</a></li>' for k in kids)
                + "</ul>"
            )
        else:
            row += "</div>"
        drawer.append(f'        <li class="drawer-item">{row}</li>')

    return f"""<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="{e(s["name"])} home" data-load style="--d:0ms">
      <img class="brand-mark brand-logo" src="/images/logo-preschool-sm.jpg" width="240" height="203" alt="">
      <span class="brand-text"><span class="brand-name">{e(s["name"])}</span><span class="brand-tag">{e(s["tagline"])}</span></span>
    </a>
    <nav class="nav-primary" aria-label="Primary" data-load style="--d:120ms">
      <ul class="nav-list">
{chr(10).join(items)}
      </ul>
    </nav>
    <div class="header-actions" data-load style="--d:120ms">
      <a class="header-cta" href="{e(s["tourHref"])}">Schedule a Tour</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="drawer" id="drawer" aria-hidden="true">
  <div class="drawer-scrim"></div>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer-top">
      <a class="drawer-title" href="/">{e(s["name"])}</a>
      <button class="drawer-close" type="button" aria-label="Close menu">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <a class="btn btn-primary drawer-cta" href="{e(s["tourHref"])}">Schedule a Tour</a>
    <nav class="drawer-nav" aria-label="Mobile">
      <ul>
{chr(10).join(drawer)}
      </ul>
    </nav>
    <div class="drawer-meta">
      <strong>Open year-round</strong>
      <div class="pills"><span class="pill"><span class="pill-day">{e(s["days"])}</span><span class="pill-time">{e(s["hours"])}</span></span></div>
      <address>{e(s["street"])}<br>{e(s["city"])}, {e(s["region"])} {e(s["postalCode"])}<br><a href="{e(s["phoneHref"])}">{e(s["phone"])}</a></address>
    </div>
  </div>
</div>"""


def footer(site):
    s = site["school"]
    nav = {i["id"]: i for i in site["nav"]}
    explore = "".join(f'<li><a href="{e(nav[i]["href"])}">{e(nav[i]["label"])}</a></li>' for i in site["footer"]["explore"])
    action = "".join(f"<li>{link(a['label'], a['href'], a.get('external', False))}</li>" for a in site["footer"]["takeAction"])
    year = date.today().year
    return f"""<footer class="site-footer on-dark">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img class="footer-badge footer-logo" src="/images/logo-preschool.jpg" width="640" height="543" alt="St. Matthias Preschool logo" loading="lazy">
        <div>
          <h2>Contact</h2>
          <strong>{e(s["name"])}</strong>
          <address>{e(s["street"])}<br>{e(s["city"])}, {e(s["region"])} {e(s["postalCode"])}<br>
            <a href="{e(s["phoneHref"])}">{e(s["phone"])}</a><br>
            <a href="mailto:{e(s["email"])}">{e(s["email"])}</a></address>
        </div>
      </div>
      <div>
        <h2>Hours</h2>
        <ul class="footer-times"><li><span>{e(s["days"])}</span><strong>{e(s["hours"])}</strong></li><li><span>Calendar</span><strong>Year-round</strong></li></ul>
        <ul class="footer-links footer-links-tight">
          <li>{link("Get directions", s["directionsUrl"])}</li>
        </ul>
      </div>
      <div>
        <h2>Explore</h2>
        <ul class="footer-links">{explore}</ul>
      </div>
      <div>
        <h2>Take Action</h2>
        <ul class="footer-links">{action}</ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-identity">
        <p>&copy; {year} {e(s["name"])} &middot; {e(s["tagline"])} &middot; Archdiocese of San Francisco</p>
      </div>
      <p class="footer-social">{link("St. Matthias Parish website", s["parishUrl"])}</p>
    </div>
  </div>
</footer>"""


def replace_region(html, name, content, page):
    pattern = re.compile(rf"(<!-- build:{name} -->\n).*?(<!-- /build:{name} -->)", re.S)
    if not pattern.search(html):
        sys.exit(f"{page}: missing <!-- build:{name} --> markers")
    return pattern.sub(lambda m: m.group(1) + content + "\n" + m.group(2), html)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--check", action="store_true", help="exit 1 if any page is out of date")
    args = parser.parse_args()

    site = json.loads((DATA / "site.json").read_text(encoding="utf-8"))
    stale = []
    for page, current in PAGES.items():
        path = ROOT / page
        if not path.exists():
            sys.exit(f"{page}: page listed in PAGES but missing")
        html = path.read_text(encoding="utf-8")
        out = replace_region(html, "header", header(site, current), page)
        out = replace_region(out, "footer", footer(site), page)
        if out != html:
            stale.append(page)
            if not args.check:
                path.write_text(out, encoding="utf-8")
    if args.check:
        if stale:
            print("Out of date: " + ", ".join(stale))
            sys.exit(1)
        print("All pages up to date.")
    else:
        print(("Updated: " + ", ".join(stale)) if stale else "Nothing to update.")


if __name__ == "__main__":
    main()
