// Header scroll state, desktop dropdowns, and the mobile drawer. No dependencies.
// The header and drawer markup is generated from data/site.json by scripts/build.py,
// so both menus always share the same labels, order, and destinations.
(function () {
  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.getElementById("drawer");
  if (!header) return;
  root.classList.add("nav-js");

  // Keep the header light over the dark hero, then settle into parchment.
  var solid = false;
  function onScroll() {
    var hero = document.querySelector(".scroll-hero");
    var threshold = hero ? Math.max(40, hero.offsetHeight - window.innerHeight - 24) : 40;
    var next = window.scrollY > threshold;
    if (next !== solid) {
      solid = next;
      header.classList.toggle("is-solid", solid);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ----- Desktop dropdowns (disclosure pattern: the label is a link, the chevron is a button)
  var items = Array.prototype.slice.call(header.querySelectorAll(".nav-item.has-sub"));
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  var closeTimer = 0;

  function setItem(item, open) {
    var button = item.querySelector(".sub-toggle");
    item.classList.toggle("is-open", open);
    if (button) button.setAttribute("aria-expanded", String(open));
  }
  function closeAll(except) {
    items.forEach(function (item) { if (item !== except) setItem(item, false); });
  }

  items.forEach(function (item) {
    var button = item.querySelector(".sub-toggle");
    var sub = item.querySelector(".subnav");
    if (!button || !sub) return;

    button.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      closeAll(item);
      setItem(item, open);
    });

    button.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        closeAll(item);
        setItem(item, true);
        var first = sub.querySelector("a");
        if (first) first.focus();
      }
    });

    sub.addEventListener("keydown", function (e) {
      var links = Array.prototype.slice.call(sub.querySelectorAll("a"));
      var i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i > -1) { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      if (e.key === "ArrowUp" && i > -1) { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
    });

    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && item.classList.contains("is-open")) {
        e.stopPropagation();
        setItem(item, false);
        button.focus();
      }
    });

    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) setItem(item, false);
    });

    item.addEventListener("mouseenter", function () {
      if (!canHover.matches) return;
      window.clearTimeout(closeTimer);
      closeAll(item);
      setItem(item, true);
    });
    item.addEventListener("mouseleave", function () {
      if (!canHover.matches) return;
      closeTimer = window.setTimeout(function () {
        if (!item.contains(document.activeElement)) setItem(item, false);
      }, 180);
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".nav-item.has-sub")) closeAll();
  });

  // ----- Mobile and tablet drawer
  if (!toggle || !drawer) return;

  var closeBtn = drawer.querySelector(".drawer-close");
  var scrim = drawer.querySelector(".drawer-scrim");
  var focusable = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var lastFocus = null;
  var open = false;

  drawer.querySelectorAll(".drawer-nav > ul > li").forEach(function (li, i) {
    li.style.setProperty("--i", i);
  });

  drawer.querySelectorAll(".drawer-sub-toggle").forEach(function (button) {
    var sub = document.getElementById(button.getAttribute("aria-controls"));
    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      if (sub) sub.hidden = expanded;
    });
  });

  function setOpen(next) {
    if (next === open) return;
    open = next;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    root.classList.toggle("drawer-open", open);
    if (open) {
      lastFocus = document.activeElement;
      window.setTimeout(function () { closeBtn && closeBtn.focus(); }, 60);
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  toggle.addEventListener("click", function () { setOpen(!open); });
  closeBtn && closeBtn.addEventListener("click", function () { setOpen(false); });
  scrim && scrim.addEventListener("click", function () { setOpen(false); });
  drawer.querySelectorAll("a[href]").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !open) { closeAll(); return; }
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key !== "Tab") return;
    var list = Array.prototype.filter.call(drawer.querySelectorAll(focusable), function (el) {
      return el.offsetParent !== null;
    });
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  var mq = window.matchMedia("(min-width: 1200px)");
  var onChange = function (e) { if (e.matches) setOpen(false); };
  mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
})();
