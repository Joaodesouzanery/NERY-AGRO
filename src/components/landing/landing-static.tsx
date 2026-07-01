import { useEffect } from "react";
import { LANDING_HTML } from "@/components/landing/landing-html";

// Vendor + app scripts da landing (clássicos, não-ESM), NA ORDEM exigida:
// three -> gsap -> ScrollTrigger -> lenis -> globe -> scroll -> main.
const LANDING_SCRIPTS = [
  "/js/vendor/three.min.js",
  "/js/vendor/gsap.min.js",
  "/js/vendor/ScrollTrigger.min.js",
  "/js/vendor/lenis.min.js",
  "/js/globe.js",
  "/js/scroll.js",
  "/js/main.js",
];

declare global {
  interface Window {
    __agroTorreLandingScripts?: boolean;
  }
}

/**
 * Home pública: renderiza a landing pronta (HTML/CSS/JS vanilla) verbatim.
 * O markup vai via dangerouslySetInnerHTML (visual idêntico, sem conversão JSX);
 * os vendor scripts são injetados em ordem no cliente (async=false → ordem garantida),
 * depois que o DOM da landing já existe. window.THREE/gsap/Lenis ficam globais p/ o globo 3D.
 */
export function LandingStatic() {
  useEffect(() => {
    if (typeof window === "undefined" || window.__agroTorreLandingScripts) return;
    window.__agroTorreLandingScripts = true;
    for (const src of LANDING_SCRIPTS) {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      document.body.appendChild(script);
    }
    // Defensivo: ao sair da "/" via SPA, não vazar classes globais (overflow:hidden etc.).
    return () => {
      document.body.classList.remove("menu-open", "gsap", "no3d");
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />;
}
