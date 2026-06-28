/* ════════════════════════════════════════════════════════════════════════
   scroll.js — Lenis + GSAP ScrollTrigger (todas as animações de scroll)
   Pin+zoom do hero, mask reveals por palavra, batch reveal, entrada do
   wordmark, barra de progresso, parallax, footer wordmark, marquee.
   Expõe window.GothamScroll.init(globe) -> { lenis }.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function splitWords(el) {
    var text = el.textContent;
    el.textContent = "";
    var parts = text.split(/(\s+)/),
      items = [];
    parts.forEach(function (w) {
      if (w === "") return;
      if (/^\s+$/.test(w)) {
        el.appendChild(document.createTextNode(w));
        return;
      }
      var mw = document.createElement("span");
      mw.className = "mw";
      var mi = document.createElement("span");
      mi.className = "mi";
      mi.textContent = w;
      mw.appendChild(mi);
      el.appendChild(mw);
      items.push(mi);
    });
    return items;
  }

  window.GothamScroll = {
    init: function (globe) {
      var gsap = window.gsap,
        ST = window.ScrollTrigger,
        Lenis = window.Lenis;
      if (!gsap || !ST) {
        if (globe) globe.start();
        return null;
      }
      gsap.registerPlugin(ST);
      document.body.classList.add("gsap");

      // ── Lenis smooth scroll, sincronizado ao ticker do GSAP ──────────────
      var lenis = null;
      if (Lenis) {
        lenis = new Lenis({ smoothWheel: true, lerp: 0.18 });
        lenis.on("scroll", ST.update);
        gsap.ticker.add(function (t) {
          lenis.raf(t * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
          a.addEventListener("click", function (e) {
            var id = a.getAttribute("href");
            if (id.length > 1) {
              var el = document.querySelector(id);
              if (el) {
                e.preventDefault();
                lenis.scrollTo(el, { offset: -40 });
              }
            }
          });
        });
      }

      if (globe) globe.start();

      // ── mask reveal por palavra nos headings/quote [data-split] ──────────
      document.querySelectorAll("[data-split]").forEach(function (el) {
        var items = splitWords(el);
        gsap.set(items, { yPercent: 110 });
        gsap.to(items, {
          yPercent: 0,
          duration: 0.45,
          ease: "power3.out",
          stagger: 0.022,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
      });

      // ── batch reveal (substitui o IntersectionObserver) ──────────────────
      gsap.set(".reveal", { autoAlpha: 0, y: 40 });
      ST.batch(".reveal", {
        start: "top 88%",
        once: true,
        onEnter: function (b) {
          gsap.to(b, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.055,
            overwrite: true,
          });
        },
      });

      // ── entrada do wordmark gigante (mask wipe de baixo p/ cima) ─────────
      var big = document.getElementById("bigword");
      if (big)
        gsap.fromTo(
          big,
          { clipPath: "inset(100% 0 0 0)", webkitClipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            webkitClipPath: "inset(0% 0 0 0)",
            duration: 0.6,
            ease: "expo.out",
            delay: 0.12,
          },
        );

      // ── hero: pin + zoom da câmera (quickSetter no scrub) ────────────────
      var heroUI = document.querySelector(".hero-ui"),
        mask = document.querySelector(".hero-mask");
      var setBigOp = big ? gsap.quickSetter(big, "opacity") : null;
      var setBigY = big ? gsap.quickSetter(big, "y", "%") : null;
      var setUIOp = heroUI ? gsap.quickSetter(heroUI, "opacity") : null;
      var setMaskOp = mask ? gsap.quickSetter(mask, "opacity") : null;
      if (globe) {
        ST.create({
          trigger: "#hero",
          start: "top top",
          end: "+=70%",
          pin: true,
          pinSpacing: true,
          scrub: true,
          onUpdate: function (self) {
            var p = self.progress,
              f = Math.min(1, p / 0.35);
            globe.setProgress(p);
            if (setBigOp) setBigOp(1 - f);
            if (setBigY) setBigY(26 + p * 22);
            // parte de 26% (= translateY(26%) do CSS) p/ saída contínua, sem salto, na nova ancoragem
            if (setUIOp) setUIOp(1 - f);
            if (setMaskOp) setMaskOp(Math.max(0, (p - 0.82) / 0.18));
          },
          onLeave: function () {
            globe.stop();
          },
          onEnterBack: function () {
            globe.start();
          },
        });
      }

      // ── barra de progresso de scroll ─────────────────────────────────────
      gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });

      // ── dot-rail do brand film: acende o dot do bloco em vista ───────────
      var filmDots = Array.prototype.slice.call(document.querySelectorAll("#film-dots .fdot"));
      if (filmDots.length) {
        gsap.utils.toArray("[data-film]").forEach(function (sec) {
          var idx = parseInt(sec.getAttribute("data-film"), 10);
          var dot = filmDots[idx];
          if (!dot) return;
          ST.create({
            trigger: sec,
            start: "top center",
            end: "bottom center",
            onToggle: function (self) {
              dot.classList.toggle("on", self.isActive);
            },
          });
        });
      }

      // ── parallax sutil das mídias ────────────────────────────────────────
      gsap.utils.toArray("[data-parallax]").forEach(function (el) {
        gsap.fromTo(
          el,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // ── footer wordmark: reveal por scrub (eco do hero) ──────────────────
      var fw = document.getElementById("foot-word");
      if (fw)
        gsap.fromTo(
          fw,
          { yPercent: 55, opacity: 0.25 },
          {
            yPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".foot-word-wrap",
              start: "top 95%",
              end: "top 50%",
              scrub: true,
            },
          },
        );

      // ── marquee infinito + reativo à velocidade do scroll ────────────────
      var mq = document.getElementById("marquee");
      if (mq) {
        var loop = gsap.to(mq, { xPercent: -50, duration: 20, ease: "none", repeat: -1 });
        ST.create({
          trigger: ".trust",
          start: "top bottom",
          end: "bottom top",
          onUpdate: function (self) {
            loop.timeScale(1 + Math.min(5, Math.abs(self.getVelocity()) / 1600));
          },
        });
      }

      // recalibrar offsets após fontes/imagens
      if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(function () {
          ST.refresh();
        });
      window.addEventListener("load", function () {
        ST.refresh();
      });

      return { lenis: lenis };
    },
  };
})();
