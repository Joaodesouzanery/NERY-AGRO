/* ════════════════════════════════════════════════════════════════════════
   main.js — bootstrap e interações
   Detecta capacidade; inicializa globo+scroll, fallback estático ou modo lite.
   count-up, nav (blur+hide), cookie, mega-menu, magnetic, spotlight, video modal.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile =
    matchMedia("(max-width: 768px)").matches || matchMedia("(pointer: coarse)").matches;
  var pointerFine = matchMedia("(pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }
  var libsOK = typeof window.THREE !== "undefined";
  var enable3D = libsOK && hasWebGL() && !reducedMotion && !isMobile;

  var lenisRef = null;

  // ── orquestração ─────────────────────────────────────────────────────────
  if (reducedMotion) {
    document.body.classList.add("no3d");
    countUpAll(true);
  } else if (enable3D) {
    bootGlobeAndScroll();
    countUpAll(false);
    pointerEffects();
  } else if (!isMobile) {
    // desktop sem WebGL
    document.body.classList.add("no3d");
    var a = window.GothamScroll && window.GothamScroll.init(null);
    lenisRef = a && a.lenis;
    countUpAll(false);
    pointerEffects();
  } else {
    // mobile (lite)
    document.body.classList.add("no3d");
    ioReveals();
    countUpAll(false);
  }

  function bootGlobeAndScroll() {
    var canvas = document.getElementById("globe-gl");
    try {
      var markers = [].slice.call(document.querySelectorAll(".gmarkers .gm"));
      var globe = window.GothamGlobe.init(canvas, { markers: markers });
      var a = window.GothamScroll ? window.GothamScroll.init(globe) : (globe.start(), null);
      lenisRef = a && a.lenis;
    } catch (e) {
      console.warn("Globo 3D falhou, usando fallback:", e);
      document.body.classList.add("no3d");
      var a2 = window.GothamScroll && window.GothamScroll.init(null);
      lenisRef = a2 && a2.lenis;
    }
  }

  // ── reveals lite (mobile, sem GSAP) ──────────────────────────────────────
  function ioReveals() {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  }

  // ── count-up das métricas ────────────────────────────────────────────────
  function fmt(v, dec) {
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function animateCount(el) {
    var end = parseFloat(el.getAttribute("data-count") || "0");
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var dur = 1200,
      t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function countUpAll(instant) {
    var els = [].slice.call(document.querySelectorAll("[data-count]"));
    if (instant) {
      els.forEach(function (el) {
        el.textContent = fmt(
          parseFloat(el.getAttribute("data-count")),
          parseInt(el.getAttribute("data-decimals") || "0", 10),
        );
      });
      return;
    }
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            animateCount(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 },
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  // ── micro-interações de ponteiro (desktop) ───────────────────────────────
  function pointerEffects() {
    if (!pointerFine || reducedMotion) return;
    // magnetic buttons (precisa de gsap)
    if (hasGSAP) {
      document.querySelectorAll(".btn[data-magnetic]").forEach(function (btn) {
        var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
        var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
        });
        btn.addEventListener("mouseleave", function () {
          xTo(0);
          yTo(0);
        });
      });
    }
    // cursor spotlight nos cards (custom props, sem JS por frame pesado)
    document.querySelectorAll(".off, .ncard").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
    });
  }

  // ── nav: blur + hide-on-scroll + tema adaptativo (claro/escuro) ──────────
  var nav = document.getElementById("nav");
  var lastY = 0;
  var themeSecs = [].slice.call(document.querySelectorAll("[data-theme]"));
  var navMid =
    (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 64) /
    2;
  function updateNavTheme() {
    var found = null;
    for (var i = 0; i < themeSecs.length; i++) {
      var r = themeSecs[i].getBoundingClientRect();
      if (r.top <= navMid && r.bottom > navMid) {
        found = themeSecs[i];
        break;
      }
    }
    // sem seção (hero) ou seção dark → nav clara (texto branco); senão nav escura
    nav.classList.toggle("nav-light", !!found && found.getAttribute("data-theme") !== "dark");
  }
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    nav.classList.toggle("scrolled", y > 30);
    if (y > 220 && y > lastY + 4) nav.classList.add("nav-hidden");
    else if (y < lastY - 4 || y < 220) nav.classList.remove("nav-hidden");
    lastY = y;
    updateNavTheme();
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateNavTheme, { passive: true });

  // ── wordmark do hero: ajusta p/ preencher ~97vw em UMA linha (mede o SPAN, não o bloco) ──
  var TARGET_VW = 0.97; // largura-alvo (96–98vw), na escala do "Gotham"
  var PROBE = 200; // font-size de medição (px) — mais estável p/ subpixel
  function fitBigword() {
    var el = document.getElementById("bigword");
    if (!el) return;
    var span = el.querySelector(".bw-fit");
    if (!span) return; // precisa do <span class="bw-fit"> (ver index.html)
    el.style.fontSize = PROBE + "px";
    // largura INTRÍNSECA do texto (o span é inline-block → não estica até a borda)
    var w = span.getBoundingClientRect().width;
    if (!w) return;
    var fs = (PROBE * (window.innerWidth * TARGET_VW)) / w;
    el.style.fontSize = fs + "px";
    // publica a altura do topo VISUAL do wordmark (a partir da base do hero) p/ o HUD se ancorar acima dele.
    // soma ~12% do font-size porque line-height<1 deixa as ascendentes transbordarem a caixa.
    var r = el.getBoundingClientRect();
    var fromBottom = Math.max(0, window.innerHeight - r.top + fs * 0.12);
    document.documentElement.style.setProperty("--bw-top", fromBottom.toFixed(0) + "px");
  }
  // refit com debounce via rAF (evita thrash em resize contínuo)
  var bwRaf = 0;
  function scheduleFit() {
    if (bwRaf) return;
    bwRaf = requestAnimationFrame(function () {
      bwRaf = 0;
      fitBigword();
    });
  }
  fitBigword();
  window.addEventListener("resize", scheduleFit, { passive: true });
  window.addEventListener("load", fitBigword); // segurança pós-layout
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBigword); // Inter Tight troca a métrica
  if (document.fonts && document.fonts.load)
    document.fonts
      .load('300 1em "Inter Tight"')
      .then(fitBigword)
      .catch(function () {});

  // ── cookie banner ────────────────────────────────────────────────────────
  var cookie = document.getElementById("cookie");
  if (cookie) {
    if (!localStorage.getItem("gotham-cookie-consent"))
      setTimeout(function () {
        cookie.classList.add("show");
      }, 1000);
    cookie.querySelectorAll("[data-consent]").forEach(function (b) {
      b.addEventListener("click", function () {
        localStorage.setItem("gotham-cookie-consent", b.getAttribute("data-consent"));
        cookie.classList.remove("show");
      });
    });
  }

  // ── mega-menu ────────────────────────────────────────────────────────────
  var mega = document.getElementById("mega"),
    openBtn = document.getElementById("menu-open"),
    closeBtn = document.getElementById("menu-close");
  function openMenu() {
    if (!mega) return;
    mega.classList.add("open");
    mega.setAttribute("aria-hidden", "false");
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    mega.querySelectorAll("a.mi").forEach(function (it, i) {
      it.style.transitionDelay = 0.05 + i * 0.03 + "s";
    });
  }
  function closeMenu() {
    if (!mega) return;
    mega.classList.remove("open");
    mega.setAttribute("aria-hidden", "true");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (mega) {
    mega.addEventListener("click", function (e) {
      if (e.target === mega) closeMenu();
    });
    mega.querySelectorAll("a.mi").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  // ── video modal ──────────────────────────────────────────────────────────
  var vmodal = document.getElementById("vmodal"),
    vopen = document.getElementById("video-open"),
    vclose = document.getElementById("vclose");
  function openVideo() {
    if (!vmodal) return;
    vmodal.classList.add("open");
    vmodal.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    if (lenisRef) lenisRef.stop();
  }
  function closeVideo() {
    if (!vmodal) return;
    vmodal.classList.remove("open");
    vmodal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    if (lenisRef) lenisRef.start();
  }
  if (vopen) {
    vopen.addEventListener("click", openVideo);
    vopen.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openVideo();
      }
    });
  }
  if (vclose) vclose.addEventListener("click", closeVideo);
  if (vmodal)
    vmodal.addEventListener("click", function (e) {
      if (e.target === vmodal) closeVideo();
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenu();
      closeVideo();
    }
  });

  /* telemetria sutil da coordenada do hero (HUD) */
  (function () {
    var lat = document.getElementById("hud-lat"),
      lon = document.getElementById("hud-lon");
    if (!lat || !lon || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    var bLat = -15.78,
      bLon = -47.93;
    setInterval(function () {
      lat.textContent = "−" + Math.abs(bLat + (Math.random() - 0.5) * 0.04).toFixed(2);
      lon.textContent = "−" + Math.abs(bLon + (Math.random() - 0.5) * 0.04).toFixed(2);
    }, 2200);
  })();
})();
