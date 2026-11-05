// Motion and small behaviors for the St. Matthias Preschool site.
// Adapted from the parish site's js/motion.js: same reveal, word-split,
// word-light and poster-fan vocabulary, plus a pausable hero photo crossfade
// and click-to-play parent videos. Every effect has a static fallback and
// respects prefers-reduced-motion. No dependencies.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 768px)");
  doc.classList.add("js");

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp01(t); return t * t * (3 - 2 * t); }

  function splitWords(el, className) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var outer = document.createElement("span");
            outer.className = className;
            var inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", n++);
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  }

  // ----- Headline word reveal and page-load stagger
  document.querySelectorAll("[data-split]").forEach(function (el) {
    splitWords(el, "w");
    el.classList.add("split");
  });
  var ready = false;
  function markReady() { if (!ready) { ready = true; doc.classList.add("is-ready"); } }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.setTimeout(markReady, 40); });
  window.setTimeout(markReady, 800);

  // ----- Scroll reveals (each element once, never re-hidden)
  document.querySelectorAll("[data-reveal-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) { child.style.setProperty("--i", i); });
  });
  var revealTargets = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .07 });
    revealTargets.forEach(function (t) { io.observe(t); });
  } else {
    revealTargets.forEach(function (t) { t.classList.add("is-in"); });
  }

  // ----- Home hero: slow photo crossfade with a visible pause control
  var hero = document.querySelector("[data-hero-rotator]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var toggle = hero.querySelector("[data-hero-toggle]");
    var label = toggle ? toggle.querySelector("[data-hero-toggle-label]") : null;
    var index = 0;
    var timer = 0;
    var playing = !reduce.matches && slides.length > 1;

    var show = function (i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        var active = n === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
    };
    var inView = function () {
      var r = hero.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    var schedule = function () {
      window.clearTimeout(timer);
      if (!playing) return;
      timer = window.setTimeout(function () {
        if (!document.hidden && inView()) show(index + 1);
        schedule();
      }, 7000);
    };
    var setPlaying = function (next) {
      playing = next;
      hero.classList.toggle("is-paused", !playing);
      if (toggle) toggle.setAttribute("aria-pressed", String(!playing));
      if (label) label.textContent = playing ? "Pause photos" : "Play photos";
      schedule();
    };

    if (slides.length < 2 && toggle) toggle.hidden = true;
    if (toggle) toggle.addEventListener("click", function () { setPlaying(!playing); });
    document.addEventListener("visibilitychange", schedule);
    reduce.addEventListener && reduce.addEventListener("change", function () { setPlaying(!reduce.matches); });
    show(0);
    setPlaying(playing);
  }

  // ----- Scroll-linked: mission word light and the enrichment poster fan
  var missionWords = [];
  document.querySelectorAll("[data-word-light] h2").forEach(function (el) {
    splitWords(el, "lit-word");
    missionWords = missionWords.concat(Array.prototype.slice.call(el.querySelectorAll(".lit-word")));
  });
  var wordSection = document.querySelector("[data-word-light]");
  var fanSection = document.querySelector("[data-fan]");
  var ticking = false;

  function wordProgress(el, vh) {
    var heading = el.querySelector("h2");
    if (!heading) return 1;
    var r = heading.getBoundingClientRect();
    return clamp01((vh - r.top) / (r.height + 100));
  }

  function fanProgress(el, vh) {
    var button = el.querySelector(".events-intro .btn");
    var sectionTop = el.getBoundingClientRect().top;
    var sectionEntry = clamp01((vh - sectionTop) / (vh * .72)) * .78;
    if (!button) return sectionEntry;
    var buttonEntry = clamp01((vh - 150 - button.getBoundingClientRect().top) / (vh * .34));
    return Math.max(sectionEntry, buttonEntry);
  }

  function animateFan(el, p) {
    var posters = el.querySelectorAll(".event-poster");
    var count = posters.length;
    Array.prototype.forEach.call(posters, function (poster, i) {
      var offset = i - (count - 1) / 2;
      var delay = i * .05;
      var ep = ease((p - delay) / .58);
      var q = 1 - ep;
      var rotation = lerp(offset ? offset * 7.5 : 2, offset * 4, ep);
      poster.style.opacity = String(clamp01((p - delay) * 7));
      poster.style.transform = "translate3d(" + (-offset * 14 * q) + "vw," + (q * 62) + "vh,0) rotate(" + rotation + "deg) scale(" + (.78 + .22 * ep) + ")";
    });
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (!desktop.matches || reduce.matches) {
      missionWords.forEach(function (w) { w.style.removeProperty("--word-light"); w.classList.add("is-lit"); });
      if (fanSection) {
        fanSection.style.setProperty("--p", 1);
        fanSection.querySelectorAll(".event-poster").forEach(function (p) { p.style.opacity = ""; p.style.transform = ""; });
      }
      return;
    }
    if (wordSection && missionWords.length) {
      var p = wordProgress(wordSection, vh);
      var pos = p * missionWords.length;
      missionWords.forEach(function (w, i) {
        var wp = clamp01(pos - i);
        w.style.setProperty("--word-light", (.18 + .82 * wp).toFixed(3));
        w.classList.toggle("is-lit", wp >= 1);
      });
    }
    if (fanSection) {
      var fp = fanProgress(fanSection, vh);
      fanSection.style.setProperty("--p", fp.toFixed(4));
      animateFan(fanSection, fp);
    }
  }
  function requestUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  if (wordSection || fanSection) {
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    desktop.addEventListener && desktop.addEventListener("change", requestUpdate);
    reduce.addEventListener && reduce.addEventListener("change", requestUpdate);
    update();
  }

  // ----- Parent videos: a plain YouTube link until someone presses play,
  // then a privacy-enhanced (youtube-nocookie) player in place.
  document.querySelectorAll("[data-video-id]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(link.getAttribute("data-video-id")) + "?autoplay=1&rel=0";
      frame.title = link.getAttribute("data-video-title") || "Video";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      link.parentNode.replaceChild(frame, link);
      frame.focus();
    });
  });
})();
