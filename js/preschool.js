// Motion and small behaviors for the St. Matthias Preschool site.
// Adapted from the parish site's js/motion.js: same reveal, word-split,
// word-light, photo-flight and poster-fan vocabulary, plus a pausable hero photo crossfade
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

    // Feather point for the photo shading: the shading is clear at the top of the photo
    // and reaches near-solid just above the first line of text (see .home-hero-media::after).
    // offsetTop ignores the load animation's transforms, so this is the settled position.
    var inner = hero.querySelector(".home-hero-inner");
    var firstLine = hero.querySelector(".home-hero-inner .overline");
    var setFeather = function () {
      if (!inner || !firstLine) return;
      var textTop = inner.offsetTop + firstLine.offsetTop;
      hero.style.setProperty("--hero-solid", Math.max(0, hero.offsetHeight - textTop + 20) + "px");
    };
    setFeather();
    window.addEventListener("resize", setFeather);
    window.addEventListener("load", setFeather);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setFeather);
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

  // ----- Photo flight (from the parish motion.js updateMinistryFlight):
  // as the mission band scrolls away, three of its photos lift off, travel
  // down the page and land on the three Programs by age cards, then crossfade
  // into each card's own photo. Flight tile n starts on the mission photo
  // named by its data-flight-from and lands on age card n.
  var flightLayer = document.querySelector("[data-ministry-flight]");
  var flightImages = flightLayer ? Array.prototype.slice.call(flightLayer.querySelectorAll("[data-flight-image]")) : [];
  var flightSources = flightImages.map(function (img) { return document.querySelector(img.getAttribute("data-flight-from")); });
  var flightTargets = Array.prototype.slice.call(document.querySelectorAll("#programs .age-card-media img"));
  var flightReady = !!(flightLayer && wordSection && flightTargets.length && flightSources.every(Boolean));

  // Where a mission photo sits once the band has scrolled to the top of the
  // screen (the moment the flight begins): its untransformed box and tilt.
  function flightStart(img, missionRect, missionTravel) {
    var r = img.getBoundingClientRect();
    var w = img.offsetWidth;
    var h = img.offsetHeight;
    var tilt = parseFloat(getComputedStyle(img).getPropertyValue("--tilt")) || 0;
    return {
      x: r.left + r.width / 2 - w / 2,
      y: r.top - missionRect.top - missionTravel + r.height / 2 - h / 2,
      w: w, h: h, r: tilt
    };
  }

  // Mid-air stops, as on the parish site: one out to each side, one high in the middle.
  function flightWaypoints(vw, vh) {
    var width = Math.min(240, Math.max(136, vw * .17));
    var sideWidth = Math.min(vw * .29, width * 1.55);
    var sideHeight = sideWidth * .66;
    var smallWidth = width * .92;
    var smallHeight = smallWidth * .75;
    return [
      { x: -sideWidth * .20, y: vh * .50, w: sideWidth, h: sideHeight, r: 2 },
      { x: (vw - smallWidth) / 2, y: vh * .08, w: smallWidth, h: smallHeight, r: 1 },
      { x: vw - sideWidth * .80, y: vh * .47, w: sideWidth, h: sideHeight, r: -2 }
    ];
  }

  function updateFlight(vw, vh) {
    if (!flightReady) return;
    var scrollY = window.scrollY || window.pageYOffset;
    var missionRect = wordSection.getBoundingClientRect();
    var missionTop = scrollY + missionRect.top;
    var missionTravel = Math.max(1, missionRect.height - vh);
    var motionStart = missionTop + missionTravel;
    // Land when the cards' photos sit in the middle of the screen.
    var cardsTop = scrollY + flightTargets[0].getBoundingClientRect().top;
    var motionEnd = Math.max(motionStart + vh * .5, cardsTop - vh * .45);
    var raw = clamp01((scrollY - motionStart) / Math.max(1, motionEnd - motionStart));
    var inJourney = scrollY >= motionStart && scrollY < motionEnd + vh * .08;
    var waypoints = flightWaypoints(vw, vh);
    var firstLeg = ease(raw / .70);
    var secondLeg = ease((raw - .70) / .30);
    var crossfade = ease((raw - .975) / .025);

    flightLayer.style.visibility = inJourney ? "visible" : "hidden";
    flightSources.forEach(function (img) { img.style.visibility = inJourney ? "hidden" : "visible"; });

    flightImages.forEach(function (image, i) {
      if (i >= flightTargets.length) { image.style.display = "none"; return; }
      image.style.display = "";
      var start = flightStart(flightSources[i], missionRect, missionTravel);
      var waypoint = waypoints[i % waypoints.length];
      var tr = flightTargets[i].getBoundingClientRect();
      var target = {
        x: tr.left,
        y: Math.min(tr.top, vh - Math.min(tr.height, waypoint.h) * .45),
        w: tr.width, h: tr.height, r: 0
      };
      var from = raw < .70 ? start : waypoint;
      var to = raw < .70 ? waypoint : target;
      var t = raw < .70 ? firstLeg : secondLeg;
      image.style.left = lerp(from.x, to.x, t) + "px";
      image.style.top = lerp(from.y, to.y, t) + "px";
      image.style.width = lerp(from.w, to.w, t) + "px";
      image.style.height = lerp(from.h, to.h, t) + "px";
      image.style.opacity = String(1 - crossfade);
      image.style.transform = "rotate(" + lerp(from.r, to.r, t) + "deg)";
      image.style.borderRadius = lerp(24, 16, raw) + "px";
      flightTargets[i].style.opacity = String(crossfade);
    });
  }

  function resetFlight() {
    if (!flightReady) return;
    flightLayer.style.visibility = "hidden";
    flightSources.forEach(function (img) { img.style.visibility = ""; });
    flightTargets.forEach(function (img) { img.style.opacity = ""; });
  }

  // The flight places the cards itself, so the grid skips its fade-up reveal
  // whenever the flight runs (phones and reduced motion keep the reveal).
  function syncFlightReveal() {
    if (!flightReady) return;
    var grid = flightTargets[0].closest("[data-reveal-stagger]");
    if (grid && desktop.matches && !reduce.matches) grid.classList.add("is-in");
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (!desktop.matches || reduce.matches) {
      resetFlight();
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
    syncFlightReveal();
    updateFlight(window.innerWidth, vh);
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
