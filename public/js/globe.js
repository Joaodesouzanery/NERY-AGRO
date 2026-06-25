/* ════════════════════════════════════════════════════════════════════════
   globe.js — cena Three.js do hero (globo escurecido + atmosfera + dots)
   Expõe window.GothamGlobe.init(canvas, opts) -> { setProgress, start, stop,
   resize, dispose }. Sem dependência de módulo (lê window.THREE).
   v3.1: atmosfera "respirando", luz orbitando (terminador vivo), dots
   reagindo ao progresso do scroll.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CAM_Z_FAR = 2.5,
    CAM_Z_NEAR = 1.08;
  var FOV_FAR = 46,
    FOV_NEAR = 62;
  var COMPOSE_Y = -0.72;
  var GLOBE_R = 1.0;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hexToRGB(h) {
    return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  }

  var GLOBE_VERT = [
    "varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;",
    "void main(){",
    "  vUv = uv;",
    "  vNormalW = normalize(mat3(modelMatrix) * normal);",
    "  vec4 wp = modelMatrix * vec4(position,1.0); vPosW = wp.xyz;",
    "  gl_Position = projectionMatrix * viewMatrix * wp;",
    "}",
  ].join("\n");

  var GLOBE_FRAG = [
    "precision highp float;",
    "uniform sampler2D uMap; uniform float uHasMap; uniform vec3 uLightDir; uniform vec3 uCool;",
    "varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;",
    "void main(){",
    "  vec3 base = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(0.05,0.06,0.08);",
    "  float lum = dot(base, vec3(0.299,0.587,0.114));",
    "  vec3 desat = mix(vec3(lum), base, 0.55);",
    "  vec3 col = desat * 0.20;",
    "  col = mix(col, uCool * (lum*0.9 + 0.1), 0.35);",
    "  float ndl = dot(normalize(vNormalW), normalize(uLightDir));",
    "  float term = smoothstep(-0.55, 0.7, ndl);",
    "  col *= mix(0.45, 1.25, term);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  var ATMO_VERT = [
    "varying vec3 vNormalW; varying vec3 vPosW;",
    "void main(){",
    "  vNormalW = normalize(mat3(modelMatrix) * normal);",
    "  vec4 wp = modelMatrix * vec4(position,1.0); vPosW = wp.xyz;",
    "  gl_Position = projectionMatrix * viewMatrix * wp;",
    "}",
  ].join("\n");

  var ATMO_FRAG = [
    "precision highp float;",
    "uniform vec3 uColor; uniform float uIntensity; uniform float uTime; uniform float uProgress;",
    "varying vec3 vNormalW; varying vec3 vPosW;",
    "void main(){",
    "  vec3 viewDir = normalize(cameraPosition - vPosW);",
    "  float fres = pow(1.0 - clamp(dot(normalize(vNormalW), viewDir),0.0,1.0), 3.0);",
    "  float breathe = 0.85 + 0.15 * sin(uTime * 0.6);", // atmosfera 'respira'
    "  gl_FragColor = vec4(uColor, fres * uIntensity * breathe * (1.0 + uProgress * 0.5));",
    "}",
  ].join("\n");

  var DOT_VERT = [
    "attribute vec3 aColor; attribute float aPhase; attribute float aSize;",
    "uniform float uTime; uniform float uPixelRatio;",
    "varying vec3 vColor; varying float vTw;",
    "void main(){",
    "  vColor = aColor;",
    "  vTw = 0.45 + 0.55 * sin(uTime * 2.0 + aPhase);",
    "  vec4 mv = modelViewMatrix * vec4(position,1.0);",
    "  gl_Position = projectionMatrix * mv;",
    "  gl_PointSize = aSize * uPixelRatio * (3.2 / -mv.z);",
    "}",
  ].join("\n");

  var DOT_FRAG = [
    "precision highp float;",
    "uniform float uProgress;",
    "varying vec3 vColor; varying float vTw;",
    "void main(){",
    "  float d = length(gl_PointCoord - vec2(0.5));",
    "  if(d > 0.5) discard;",
    "  float core = smoothstep(0.5, 0.0, d);",
    "  float glow = smoothstep(0.5, 0.15, d) * 0.6;",
    "  float a = clamp(core + glow, 0.0, 1.0) * vTw * (1.0 + uProgress * 0.9);", // 'acende' ao mergulhar
    "  gl_FragColor = vec4(vColor, a);",
    "}",
  ].join("\n");

  window.GothamGlobe = {
    init: function (canvas, opts) {
      opts = opts || {};
      var THREE = window.THREE;
      var markerEls = opts.markers || opts.reticles || [];

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(FOV_FAR, 1, 0.01, 100);
      camera.position.set(0, 0, CAM_Z_FAR);

      var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

      var group = new THREE.Group();
      group.position.y = COMPOSE_Y;
      scene.add(group);

      var uniforms = {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uLightDir: { value: new THREE.Vector3(-0.6, 0.35, 0.8) },
        uCool: { value: new THREE.Color(0x2a3f63) },
      };
      var globeMat = new THREE.ShaderMaterial({
        vertexShader: GLOBE_VERT,
        fragmentShader: GLOBE_FRAG,
        uniforms: uniforms,
      });
      var globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R, 128, 128), globeMat);
      group.add(globe);

      var atmoMat = new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(0x8fb4ff) },
          uIntensity: { value: 0.9 },
          uTime: { value: 0 },
          uProgress: { value: 0 },
        },
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      var atmo = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R * 1.045, 96, 96), atmoMat);
      group.add(atmo);

      try {
        new THREE.TextureLoader().load(
          opts.texture || "/textures/earth-equirect.jpg",
          function (tex) {
            if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
            else if (tex.encoding !== undefined) tex.encoding = THREE.sRGBEncoding;
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            uniforms.uMap.value = tex;
            uniforms.uHasMap.value = 1;
          },
          undefined,
          function () {
            uniforms.uHasMap.value = 0;
          },
        );
      } catch (e) {
        uniforms.uHasMap.value = 0;
      }

      var N = 260;
      var palette = [0x46d369, 0x46d369, 0x8fd14f, 0xffb020, 0x46d369, 0xbfe3a0];
      var pos = new Float32Array(N * 3),
        col = new Float32Array(N * 3),
        pha = new Float32Array(N),
        siz = new Float32Array(N);
      var anchors = [];
      for (var i = 0; i < N; i++) {
        var u = Math.random(),
          v = Math.random();
        var theta = u * Math.PI * 2,
          phi = Math.acos(2 * v - 1);
        var x = Math.sin(phi) * Math.cos(theta),
          y = Math.cos(phi) * 0.7 + 0.25,
          z = Math.sin(phi) * Math.sin(theta);
        var len = Math.sqrt(x * x + y * y + z * z) || 1;
        x /= len;
        y /= len;
        z /= len;
        var r = GLOBE_R * 1.006;
        pos[i * 3] = x * r;
        pos[i * 3 + 1] = y * r;
        pos[i * 3 + 2] = z * r;
        var c = hexToRGB(palette[(Math.random() * palette.length) | 0]);
        col[i * 3] = c[0];
        col[i * 3 + 1] = c[1];
        col[i * 3 + 2] = c[2];
        pha[i] = Math.random() * 6.28;
        // tamanho com cauda: maioria fina, alguns "faróis" maiores -> campo fervilhante
        siz[i] = Math.random() < 0.18 ? 6.5 + Math.random() * 4.5 : 2.6 + Math.random() * 3.2;
      }
      var dotGeo = new THREE.BufferGeometry();
      dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      dotGeo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      dotGeo.setAttribute("aPhase", new THREE.BufferAttribute(pha, 1));
      dotGeo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
      var dotMat = new THREE.ShaderMaterial({
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uProgress: { value: 0 } },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      var dots = new THREE.Points(dotGeo, dotMat);
      group.add(dots);

      // ── CASCA ORBITAL: enxame denso de "satélites/objetos" em torno da borda ──
      // verde agro dominante + âmbar, poucos vermelhos = "alertas".
      var SHELL_N = 900;
      var shellPalette = [
        0x46d369, 0x46d369, 0x46d369, 0x8fd14f, 0x8fd14f, 0xbfe3a0, 0x9fe870, 0xffb020, 0xffb020,
        0xffd166, 0x2fe6c8, 0xff4d4f,
      ]; // ~58% verdes, ~17% âmbar/dourado, ~8% ciano, ~8% vermelho (alerta), resto verde-claro
      var sPos = new Float32Array(SHELL_N * 3),
        sCol = new Float32Array(SHELL_N * 3),
        sPha = new Float32Array(SHELL_N),
        sSiz = new Float32Array(SHELL_N);
      for (var s = 0; s < SHELL_N; s++) {
        // direção uniforme na esfera (acos para evitar acúmulo nos polos)
        var su = Math.random(),
          sv = Math.random();
        var sTheta = su * Math.PI * 2,
          sPhi = Math.acos(2 * sv - 1);
        var sx = Math.sin(sPhi) * Math.cos(sTheta);
        var sy = Math.cos(sPhi);
        var sz = Math.sin(sPhi) * Math.sin(sTheta);
        // banda/casca em raio variável -> dá espessura à "nuvem em órbita"
        var sr = GLOBE_R * (1.06 + Math.random() * 0.1); // 1.06 .. 1.16
        sPos[s * 3] = sx * sr;
        sPos[s * 3 + 1] = sy * sr;
        sPos[s * 3 + 2] = sz * sr;
        var sc = hexToRGB(shellPalette[(Math.random() * shellPalette.length) | 0]);
        sCol[s * 3] = sc[0];
        sCol[s * 3 + 1] = sc[1];
        sCol[s * 3 + 2] = sc[2];
        sPha[s] = Math.random() * 6.28;
        // pontos pequenos e brilhantes; raros maiores piscam como faróis
        sSiz[s] = Math.random() < 0.12 ? 4.0 + Math.random() * 3.0 : 1.6 + Math.random() * 2.2;
      }
      var shellGeo = new THREE.BufferGeometry();
      shellGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
      shellGeo.setAttribute("aColor", new THREE.BufferAttribute(sCol, 3));
      shellGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPha, 1));
      shellGeo.setAttribute("aSize", new THREE.BufferAttribute(sSiz, 1));
      var shellMat = new THREE.ShaderMaterial({
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG, // reutiliza shader dos dots
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uProgress: { value: 0 } },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      var shell = new THREE.Points(shellGeo, shellMat);
      group.add(shell); // herda translação/rotação do grupo; ainda gira sozinho no frame

      // âncoras dos marcadores de ícone (espalhados no hemisfério da frente)
      for (var mk = 0; mk < markerEls.length; mk++) {
        var ma = ((mk + 0.5) / Math.max(1, markerEls.length)) * Math.PI * 2;
        var mlat = 0.55 + (mk % 2) * 0.32; // faixa alta = parte visível de cima
        var cph = Math.cos(mlat);
        var mvx = cph * Math.sin(ma),
          mvy = Math.sin(mlat),
          mvz = cph * Math.cos(ma);
        var mvl = Math.sqrt(mvx * mvx + mvy * mvy + mvz * mvz) || 1;
        anchors.push(
          new THREE.Vector3(
            (mvx / mvl) * GLOBE_R * 1.012,
            (mvy / mvl) * GLOBE_R * 1.012,
            (mvz / mvl) * GLOBE_R * 1.012,
          ),
        );
      }

      var targetP = 0,
        curP = 0,
        running = false,
        rafId = 0,
        t0 = performance.now();
      var _v = new THREE.Vector3(),
        _n = new THREE.Vector3(),
        _cam = new THREE.Vector3();
      var _nm = new THREE.Matrix3();
      var W = 1,
        H = 1;

      function resize() {
        var rect = canvas.getBoundingClientRect();
        W = Math.max(1, rect.width);
        H = Math.max(1, rect.height);
        var pr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pr);
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        dotMat.uniforms.uPixelRatio.value = pr;
        shellMat.uniforms.uPixelRatio.value = pr;
      }

      function updateReticles() {
        if (!markerEls.length || !anchors.length) return;
        camera.getWorldPosition(_cam);
        _nm.getNormalMatrix(group.matrixWorld);
        for (var k = 0; k < markerEls.length; k++) {
          var el = markerEls[k];
          if (k >= anchors.length) {
            el.classList.remove("on");
            continue;
          }
          _v.copy(anchors[k]).applyMatrix4(group.matrixWorld);
          _n.copy(anchors[k]).applyMatrix3(_nm).normalize();
          var toCam = _cam.clone().sub(_v).normalize();
          var facing = _n.dot(toCam);
          var ndc = _v.clone().project(camera);
          var visible =
            facing > 0.15 && ndc.z < 1 && Math.abs(ndc.x) < 1.1 && Math.abs(ndc.y) < 1.1;
          if (visible) {
            el.classList.add("on");
            el.style.transform =
              "translate(" +
              ((ndc.x * 0.5 + 0.5) * W).toFixed(1) +
              "px," +
              ((-ndc.y * 0.5 + 0.5) * H).toFixed(1) +
              "px) translate(-50%,-50%)";
          } else el.classList.remove("on");
        }
      }

      function frame() {
        if (!running) return;
        rafId = requestAnimationFrame(frame);
        var now = performance.now(),
          dt = (now - t0) / 1000;
        t0 = now;
        var tt = now / 1000;

        curP += (targetP - curP) * 0.26;
        var ez = curP * (2 - curP); // ease-out: o zoom é sentido logo no início
        camera.position.z = lerp(CAM_Z_FAR, CAM_Z_NEAR, ez);
        camera.fov = lerp(FOV_FAR, FOV_NEAR, curP);
        camera.updateProjectionMatrix();

        group.rotation.y += 0.045 * dt;
        // casca orbital gira um pouco mais rápido em torno de um eixo levemente inclinado
        shell.rotation.y += 0.018 * dt;
        shell.rotation.x += 0.004 * dt;
        group.updateMatrixWorld();

        // terminador vivo (luz orbitando lentamente)
        uniforms.uLightDir.value.set(
          Math.cos(tt * 0.05) * 0.75,
          0.35,
          Math.sin(tt * 0.05) * 0.75 + 0.15,
        );
        dotMat.uniforms.uTime.value = tt;
        dotMat.uniforms.uProgress.value = curP;
        shellMat.uniforms.uTime.value = tt;
        shellMat.uniforms.uProgress.value = curP;
        atmoMat.uniforms.uTime.value = tt;
        atmoMat.uniforms.uProgress.value = curP;

        renderer.render(scene, camera);
        updateReticles();
      }

      var api = {
        setProgress: function (p) {
          targetP = Math.max(0, Math.min(1, p));
        },
        start: function () {
          if (!running) {
            running = true;
            t0 = performance.now();
            rafId = requestAnimationFrame(frame);
          }
        },
        stop: function () {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
        },
        resize: resize,
        dispose: function () {
          api.stop();
          globe.geometry.dispose();
          globeMat.dispose();
          atmo.geometry.dispose();
          atmoMat.dispose();
          dotGeo.dispose();
          dotMat.dispose();
          shellGeo.dispose();
          shellMat.dispose();
          if (uniforms.uMap.value) uniforms.uMap.value.dispose();
          renderer.dispose();
        },
      };

      resize();
      window.addEventListener("resize", resize);
      window.__setGlobeProgress = function (p) {
        curP = targetP = Math.max(0, Math.min(1, p));
        renderer.render(scene, camera);
        updateReticles();
      };
      return api;
    },
  };
})();
