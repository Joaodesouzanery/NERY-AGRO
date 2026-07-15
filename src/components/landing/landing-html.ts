// Corpo do <body> da landing (HTML/CSS/JS vanilla), renderizado verbatim na home '/'.
// Template literal legível: editável diretamente. Paths root-absolutos; CTA -> /torre-de-controle.

export const LANDING_HTML = `<div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>

<!-- DOT-RAIL do brand film (preenche conforme a narrativa avança) -->
<div class="film-dots" id="film-dots" aria-hidden="true">
  <span class="fdot" data-film-dot="0" data-label="Início"></span>
  <span class="fdot" data-film-dot="1" data-label="Plataforma"></span>
  <span class="fdot" data-film-dot="2" data-label="Módulos"></span>
  <span class="fdot" data-film-dot="3" data-label="Em ação"></span>
  <span class="fdot" data-film-dot="4" data-label="Para quem"></span>
  <span class="fdot" data-film-dot="5" data-label="Começar"></span>
</div>

<!-- NAV -->
<nav class="nav" id="nav">
  <div class="container">
    <a href="#" class="brand" aria-label="AgroTorre">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 22 12 12 22 2 12Z" opacity=".9"/><circle cx="12" cy="12" r="3.4"/></svg>
      AgroTorre
    </a>
    <div class="nav-right">
      <button class="nav-search" aria-label="Buscar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <span class="nav-search-t">Buscar</span>
      </button>
      <a href="https://calendly.com/neryadministrativo/30min" target="_blank" rel="noopener noreferrer" class="btn" data-magnetic>Agendar DEMO</a>
      <a href="/login" class="btn" data-magnetic>Acessar plataforma</a>
      <span class="nav-div" aria-hidden="true"></span>
      <button class="icon-btn" id="menu-open" aria-label="Abrir menu" aria-expanded="false" aria-controls="mega"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></svg></button>
    </div>
  </div>
</nav>

<!-- HERO (globo 3D = monitoramento por satélite) -->
<header class="hero" id="hero" data-film="0">
  <div class="space"></div>
  <canvas id="globe-gl" aria-hidden="true"></canvas>
  <img class="globe-fallback" src="/textures/earth-fallback.jpg" alt="" aria-hidden="true">
  <div class="gmarkers" aria-hidden="true">
    <span class="gm" style="--gm-label:'TALHÃO 14'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 8.2C3.2 5.8 1.3 6.4 1.6 8.8c.2 1.6 1.6 2.4 2.9 2.2"/><path d="M19.5 8.2c1.3-2.4 3.2-1.8 2.9.6-.2 1.6-1.6 2.4-2.9 2.2"/><path d="M5 10c0 5.3 3 8.3 7 8.3s7-3 7-8.3a7 7 0 0 0-14 0Z"/><path d="M9 18.2c0 1.6 6 1.6 6 0"/><circle cx="9.4" cy="11.1" r=".95"/><circle cx="14.6" cy="11.1" r=".95"/><path d="M10.4 14.6h3.2"/><circle cx="10.6" cy="15.9" r=".5"/><circle cx="13.4" cy="15.9" r=".5"/></svg></span>
    <span class="gm" style="--gm-label:'SEDE'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.2 9 4.4l6.5 4.8"/><path d="M4 8.3V20h10V8.3"/><path d="M7.4 20v-5.2h3.2V20"/><path d="M9 8.4 6.4 10.6M9 8.4l2.6 2.2"/><path d="M17.5 20V11a2.5 2.5 0 0 1 5 0v9"/><path d="M17.5 13.6h5M17.5 16.6h5"/></svg></span>
    <span class="gm" style="--gm-label:'RELATÓRIO'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/><path d="M8.5 9h4M8.5 11.5h7"/><path d="M8.5 18v-2.4M11.5 18v-3.6M14.5 18v-1.6"/><path d="M8 18h8"/></svg></span>
    <span class="gm" style="--gm-label:'TALHÃO 31'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 8.2C3.2 5.8 1.3 6.4 1.6 8.8c.2 1.6 1.6 2.4 2.9 2.2"/><path d="M19.5 8.2c1.3-2.4 3.2-1.8 2.9.6-.2 1.6-1.6 2.4-2.9 2.2"/><path d="M5 10c0 5.3 3 8.3 7 8.3s7-3 7-8.3a7 7 0 0 0-14 0Z"/><path d="M9 18.2c0 1.6 6 1.6 6 0"/><circle cx="9.4" cy="11.1" r=".95"/><circle cx="14.6" cy="11.1" r=".95"/><path d="M10.4 14.6h3.2"/><circle cx="10.6" cy="15.9" r=".5"/><circle cx="13.4" cy="15.9" r=".5"/></svg></span>
    <span class="gm" style="--gm-label:'ARMAZÉM'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.2 9 4.4l6.5 4.8"/><path d="M4 8.3V20h10V8.3"/><path d="M7.4 20v-5.2h3.2V20"/><path d="M9 8.4 6.4 10.6M9 8.4l2.6 2.2"/><path d="M17.5 20V11a2.5 2.5 0 0 1 5 0v9"/><path d="M17.5 13.6h5M17.5 16.6h5"/></svg></span>
    <span class="gm" style="--gm-label:'SAFRA'"><i class="gm-fr"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/><path d="M8.5 9h4M8.5 11.5h7"/><path d="M8.5 18v-2.4M11.5 18v-3.6M14.5 18v-1.6"/><path d="M8 18h8"/></svg></span>
  </div>
  <div class="hero-ui">
    <div class="hero-eyebrow mono">AgroTorre · Torre de Controle</div>
    <div class="status tr mono">
      <span><span class="live">● </span>Operação ativa</span>
      <span>120.482 ha monitorados</span>
      <span>Cargas 24 · Alertas 3</span>
    </div>

    <!-- CONSOLE OPERACIONAL (eco do Target Board do Gotham) -->
    <aside class="hero-console" aria-label="Console operacional (demonstração)" aria-hidden="true" data-lenis-prevent>
      <div class="hc-head">
        <div class="hc-title mono"><span class="live">●</span> Operação · Safra 25/26</div>
        <div class="hc-class mono">AGR//SAFRA//IRR</div>
      </div>
      <div class="hc-tabs mono">
        <button class="hc-tab on" type="button" tabindex="-1">Talhões</button>
        <button class="hc-tab" type="button" tabindex="-1">Cargas</button>
        <button class="hc-tab" type="button" tabindex="-1">Alertas</button>
      </div>
      <div class="hc-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" placeholder="Buscar talhão…" tabindex="-1" aria-label="Buscar talhão">
      </div>
      <div class="hc-chips mono">
        <span class="hc-chip">Status ▾</span>
        <span class="hc-chip">Cultura ▾</span>
        <span class="hc-chip">Região ▾</span>
      </div>
      <div class="hc-rec mono">Recomendar ações <span class="arw">→</span></div>
      <div class="hc-list" role="list">

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21V11"/><path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5Z"/><path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">Talhão ███ · Braúna</span><span class="hc-prio p1">P1</span></div>
            <div class="hc-meta mono"><span class="hc-type">Soja</span><span class="hc-st green">Plantio</span></div>
            <div class="hc-code mono">TLH-0142 · GO//SAF//IRR</div>
          </div>
        </div>

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h.01M8 12h.01M8 16h.01M12 8h.01M16 8h.01"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">Lote ███ · Santa Helena</span><span class="hc-prio p2">P2</span></div>
            <div class="hc-meta mono"><span class="hc-type">Boi</span><span class="hc-st amber">Sanitário</span></div>
            <div class="hc-code mono">PEC-0317 · MT//REB//VAC</div>
          </div>
        </div>

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">Carga ███ · Rota BR-163</span><span class="hc-prio p2">P2</span></div>
            <div class="hc-meta mono"><span class="hc-type">Carga</span><span class="hc-st blue">Trânsito</span></div>
            <div class="hc-code mono">LOG-0908 · GO//ROTA//FRT</div>
          </div>
        </div>

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21V11"/><path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5Z"/><path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">Talhão ███ · Pé de Serra</span><span class="hc-prio p1">P1</span></div>
            <div class="hc-meta mono"><span class="hc-type">Milho</span><span class="hc-st amber">Colheita</span></div>
            <div class="hc-code mono">TLH-0451 · GO//SAF//SEC</div>
          </div>
        </div>

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="3"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">APP ███ · Córrego Fundo</span><span class="hc-prio p1">P1</span></div>
            <div class="hc-meta mono"><span class="hc-type">Solo</span><span class="hc-st red">Alerta</span></div>
            <div class="hc-code mono">SUS-0066 · MT//APP//AMB</div>
          </div>
        </div>

        <div class="hc-card" role="listitem">
          <span class="hc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg></span>
          <div class="hc-body">
            <div class="hc-row"><span class="hc-name">Carga ███ · CSA Semana 12</span><span class="hc-prio p2">P2</span></div>
            <div class="hc-meta mono"><span class="hc-type">Carga</span><span class="hc-st blue">Trânsito</span></div>
            <div class="hc-code mono">LOG-1024 · GO//CSA//EXP</div>
          </div>
        </div>

      </div>
      <div class="hc-foot mono"><span>6 itens · 2 P1</span><span>Tempo real · 24/7</span></div>
    </aside>
    <!-- /CONSOLE -->

    <div class="enter">Você está entrando na <b>Torre</b> <b>de</b> <b>Controle.</b></div>
    <div class="scrollcue mono"><span class="ln"></span> Role para explorar</div>
    <div class="timecode mono">Tempo real · 24/7</div>

    <!-- (2) COORDENADA / GRID com glifo de mira (canto inferior-direito) -->
    <div class="hud-coord mono" aria-hidden="true">
      <div class="hc-read">
        <svg class="hc-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
        <span>T-14 · <span id="hud-lat">−15.78</span> <span id="hud-lon">−47.93</span> · 412 HA</span>
      </div>
      <div class="hc-glyphs"><i></i><i></i><i></i><span>SAT · LOCK</span></div>
    </div>

    <!-- (1) FAIXA DE COLUNAS DE LEGENDA (base) -->
    <div class="hud-legend mono" aria-hidden="true">
      <span class="hl-col"><b>Você</b> está entrando na</span>
      <span class="hl-col"><b>Tempo:</b> 3 min · role para explorar</span>
      <span class="hl-col hl-wide"><b>O sistema operacional</b> da sua fazenda</span>
      <span class="hl-col hl-right">Copyright ©2026 AgroTorre</span>
    </div>

    <!-- (3) RÓTULOS DE REGIÃO tênues sobre o globo (posições calibradas p/ globo baixo) -->
    <div class="hud-regions" aria-hidden="true">
      <span class="hud-rg" style="top:58%;left:52%"><i></i>Brasília</span>
      <span class="hud-rg" style="top:64%;left:44%"><i></i>Goiás</span>
      <span class="hud-rg r-mt" style="top:68%;left:36%"><i></i>Mato Grosso</span>
      <span class="hud-rg r-ba" style="top:60%;left:60%"><i></i>Bahia</span>
    </div>
  </div>
  <div class="bigword" id="bigword"><span class="bw-fit">AgroTorre</span></div>
  <div class="hero-mask"></div>
</header>

<!-- STATEMENT (a virada escuro→claro) -->
<section class="section statement theme-dark" data-theme="dark" data-film="1">
  <div class="container">
    <div class="label reveal"><span class="k">{ AgroTorre }</span><span class="sep mono">// Plataforma</span></div>
    <h2 class="huge" data-split>Sua fazenda inteira sob <span class="accent">controle</span>.</h2>
    <p class="lead reveal d2">A torre de controle que conecta campo, pecuária, logística, financeiro e sustentabilidade — em tempo real, sem planilhas soltas.</p>
    <div class="row reveal d2">
      <span>Tempo real, do talhão ao caixa</span>
      <span>Rastreabilidade ponta a ponta</span>
      <span>Menos perdas, decisão mais rápida</span>
    </div>
    <p style="margin-top:38px"><a href="#offerings" class="btn reveal d3">Ver módulos <span class="arw">→</span></a></p>
  </div>
</section>

<!-- MÉTRICAS -->
<section class="metrics theme-light" data-theme="light">
  <div class="container">
    <div class="grid">
      <div class="metric reveal"><div class="num"><span data-count="120" data-decimals="0">120</span><span class="u"> mil ha</span></div><div class="lbl">Área monitorada em tempo real</div></div>
      <div class="metric reveal d1"><div class="num"><span data-count="850" data-decimals="0">850</span><span class="u"> mil</span></div><div class="lbl">Registros conectados (campo→financeiro)</div></div>
      <div class="metric reveal d2"><div class="num"><span data-count="9" data-decimals="0">9</span></div><div class="lbl">Módulos e integrações numa só torre</div></div>
      <div class="metric reveal d3"><div class="num"><span data-count="24" data-decimals="0">24</span><span class="u">/7</span></div><div class="lbl">Operação sob controle</div></div>
    </div>
  </div>
</section>

<!-- MARQUEE de domínios -->
<div class="trust theme-gray" data-theme="gray" aria-hidden="true">
  <div class="marquee" id="marquee">
    <span class="it">Campo</span><span class="it">Pecuária</span><span class="it">Logística</span><span class="it">Financeiro</span><span class="it">Emissão de Carbono</span><span class="it">Inteligência</span><span class="it">Rastreabilidade</span><span class="it">COGS</span>
    <span class="it">Campo</span><span class="it">Pecuária</span><span class="it">Logística</span><span class="it">Financeiro</span><span class="it">Emissão de Carbono</span><span class="it">Inteligência</span><span class="it">Rastreabilidade</span><span class="it">COGS</span>
  </div>
</div>

<!-- CAPABILITIES 0.1 / 0.2 / 0.3 -->
<section class="section theme-light" data-theme="light" id="caps">
  <div class="container caps">
    <div class="list reveal">
      <div class="cap"><div class="idx">0.1</div><p>Lançou no campo, na pecuária ou na logística e os KPIs da operação inteira atualizam na hora — sem fechar planilha, sem esperar o fim do mês.</p></div>
      <div class="cap"><div class="idx">0.2</div><p>Lotes e animais com QR Code escaneável — origem, vacinação e cadeia de custódia rastreadas ponta a ponta, prontas para auditoria.</p></div>
      <div class="cap"><div class="idx">0.3</div><p>Cargas, talhões, bases e APPs georreferenciados num mapa operacional único e interativo — tudo o que se move e tudo o que produz, numa tela só.</p></div>
      <div class="cap"><div class="idx">0.4</div><p>Cola o apontamento do WhatsApp e o sistema extrai, confere e salva o romaneio — e desenha ou mede a área direto no mapa, sem depender do perímetro cadastrado.</p></div>
    </div>
    <div class="media" data-parallax>
      <figure class="shot">
        <img src="/images/fazenda.jpg" alt="Lavoura monitorada com a sede da fazenda ao fundo" loading="lazy">
        <figcaption>Campo monitorado · do plantio à colheita</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- OFFERINGS (módulos) -->
<section class="section offerings theme-gray" data-theme="gray" data-film="2" id="offerings">
  <div class="container">
    <div class="label reveal"><span class="k">{ Módulos }</span><span class="sep mono">// Plataforma</span></div>
    <h2 class="huge" data-split>Uma plataforma, toda a <span class="accent">operação</span> agro.</h2>
    <div class="grid">
      <div class="off reveal"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21V11"/><path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5Z"/><path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z"/></svg></span><div class="oi">01 — Campo</div><h3>Campo &amp; Produção</h3><p>Áreas e talhões com GPS, calendário de plantio/colheita, insumos, pragas, solo, irrigação e diário de campo — com custo por hectare, maquinário e estimativa de safra.</p><span class="more">Saber mais →</span></div>
      <div class="off reveal d1"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h.01M8 12h.01M8 16h.01M12 8h.01M16 8h.01"/></svg></span><div class="oi">02 — Pecuária</div><h3>Pecuária</h3><p>Ficha individual por animal, QR Code no brinco, calendário sanitário, ciclo reprodutivo, produção diária (leite/ovos) e curva de peso — rastreados ponta a ponta.</p><span class="more">Saber mais →</span></div>
      <div class="off reveal d2"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span><div class="oi">03 — Financeiro</div><h3>Financeiro &amp; COGS</h3><p>Fluxo de caixa, centros de custo com orçado × realizado, contratos, ponto de equilíbrio e crédito rural — custo verdadeiro e margem por produto, etapa, rota e talhão.</p><span class="more">Saber mais →</span></div>
      <div class="off reveal d2"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg></span><div class="oi">04 — Logística</div><h3>Logística &amp; Colheita</h3><p>Remessa/recebimento colando o apontamento do WhatsApp (extrai, confere e salva), colheita e pagamento, caixas vazias e rastreabilidade origem→beneficiamento — mais cargas, frota, rotas, fretes, cestas (CSA) e expedição no mapa em tempo real.</p><span class="more">Saber mais →</span></div>
      <div class="off reveal d3"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 20c-5 0-8-3-8-8 5 0 8 3 8 8Z"/><path d="M21 5c0 7-4 11-10 11"/></svg></span><div class="oi">05 — Emissão de Carbono</div><h3>Emissão de Carbono</h3><p>Pegada de CO₂e por escopo (1/2/3), categoria e talhão — integrada ao COGS, à Torre e ao Talhão 360. Mais certificação orgânica, agroecologia, resíduos e monitoramento de APP.</p><span class="more">Saber mais →</span></div>
      <div class="off reveal d3"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg></span><div class="oi">06 — Inteligência</div><h3>Inteligência</h3><p>KPIs e alertas cruzando dados de todos os módulos, lucratividade por cultura, relatório de perdas e dashboards automáticos — para agir antes do prejuízo.</p><span class="more">Saber mais →</span></div>
    </div>
    <p style="margin-top:38px"><a href="#" class="btn reveal">Ver todos os módulos <span class="arw">→</span></a></p>
  </div>
</section>

<!-- EM AÇÃO — telas de prova (mockups estilizados) -->
<section class="section proof theme-light" data-theme="light" data-film="3" id="em-acao">
  <div class="container">
    <div class="label reveal"><span class="k">{ Em ação }</span><span class="sep mono">// Telas da plataforma</span></div>
    <h2 class="huge" data-split>Cada módulo, uma <span class="accent">decisão</span>.</h2>
    <p class="lead reveal d1">Da área desenhada no satélite ao custo por etapa — o que a equipe vê na operação real, todos os dias.</p>
    <div class="screens reveal d2">

      <!-- Torre de Controle -->
      <div class="screen">
        <div class="bar"><i></i><i></i><i></i><span class="t">AgroTorre // Torre de Controle</span></div>
        <span class="badge">Mapa operacional</span>
        <div class="scr scr-dark"><div class="gx"></div>
          <svg viewBox="0 0 420 300" preserveAspectRatio="none">
            <polyline class="route" points="40,250 130,205 220,215 300,150 385,95" fill="none"/>
            <circle class="pin pin-ok" cx="60" cy="120" r="6"/>
            <circle class="pin pin-ok" cx="130" cy="205" r="6"/>
            <circle class="pin pin-warn" cx="220" cy="215" r="6"/>
            <circle class="pin pin-ok" cx="300" cy="150" r="6"/>
            <circle class="pin pin-alert" cx="385" cy="95" r="6"/>
          </svg>
          <div class="scr-kpis"><span>120k ha</span><span>Cargas 24</span><span class="warn">Alertas 3</span></div>
        </div>
        <span class="notional">Dados fictícios</span>
      </div>

      <!-- Talhão 360 -->
      <div class="screen">
        <div class="bar"><i></i><i></i><i></i><span class="t">AgroTorre // Talhão 360°</span></div>
        <span class="badge">Medir &amp; desenhar</span>
        <div class="scr scr-sat"><div class="gx"></div>
          <svg viewBox="0 0 420 300" preserveAspectRatio="none">
            <polygon class="poly" points="70,90 235,60 340,150 255,245 95,210"/>
            <circle class="vtx" cx="70" cy="90" r="4"/>
            <circle class="vtx" cx="235" cy="60" r="4"/>
            <circle class="vtx" cx="340" cy="150" r="4"/>
            <circle class="vtx" cx="255" cy="245" r="4"/>
            <circle class="vtx" cx="95" cy="210" r="4"/>
          </svg>
          <div class="scr-kpis"><span>412 ha</span><span>Perímetro 8,4 km</span></div>
        </div>
        <span class="notional">Dados fictícios</span>
      </div>

      <!-- RDC — Diário de Campo -->
      <div class="screen">
        <div class="bar"><i></i><i></i><i></i><span class="t">AgroTorre // RDC — Diário de Campo</span></div>
        <span class="badge">Ficha do dia</span>
        <div class="scr scr-doc">
          <div class="ficha">
            <div class="fh"><span class="fh-t">RDC · Talhão 14</span><span class="fh-b">Safra 25/26</span></div>
            <div class="fr"><span class="ck on"></span>Plantio — 12 ha concluídos</div>
            <div class="fr"><span class="ck on"></span>Pulverização — defensivo aplicado</div>
            <div class="fr"><span class="ck on"></span>Leitura de pragas — sem ocorrência</div>
            <div class="fr"><span class="ck"></span>Adubação de cobertura</div>
            <div class="fr"><span class="ck"></span>Irrigação — turno da tarde</div>
          </div>
        </div>
        <span class="notional">Dados fictícios</span>
      </div>

      <!-- COGS por etapa -->
      <div class="screen">
        <div class="bar"><i></i><i></i><i></i><span class="t">AgroTorre // COGS por etapa</span></div>
        <span class="badge">Custo real</span>
        <div class="scr"><div class="gx"></div>
          <svg viewBox="0 0 420 300" preserveAspectRatio="none">
            <polyline class="edge" points="20,210 80,170 140,185 200,120 260,140 320,80 400,100" fill="none"/>
            <rect x="40" y="210" width="34" height="60" class="bar-fill"/>
            <rect x="100" y="180" width="34" height="90" class="bar-fill"/>
            <rect x="160" y="150" width="34" height="120" class="bar-hi"/>
            <rect x="220" y="195" width="34" height="75" class="bar-fill"/>
            <rect x="280" y="165" width="34" height="105" class="bar-fill"/>
            <rect x="340" y="205" width="34" height="65" class="bar-fill"/>
          </svg>
          <div class="scr-kpis"><span>R$/ha por etapa</span><span class="ok">Margem +12%</span></div>
        </div>
        <span class="notional">Dados fictícios</span>
      </div>

    </div>
  </div>
</section>

<!-- FRASE DE IMPACTO -->
<section class="section theme-dark" data-theme="dark">
  <div class="container">
    <div class="label reveal"><span class="k">{ Decisão }</span><span class="sep mono">// Tempo real</span></div>
    <h2 class="huge" data-split>Quem enxerga a operação inteira decide antes do <span class="accent">prejuízo</span>.</h2>
    <p class="lead reveal d2">No agro, informação atrasada vira perda. A torre de controle conecta campo, pecuária, logística e financeiro em tempo real — para você agir na hora certa, não no fim do mês.</p>
  </div>
</section>

<!-- DO TALHÃO AO SATÉLITE -->
<section class="section theme-light" data-theme="light">
  <div class="container caps">
    <div class="reveal">
      <div class="label"><span class="k">{ Campo + Nuvem }</span><span class="sep mono">// Mobile</span></div>
      <h2 class="huge" data-split>Do talhão ao satélite — até <span class="accent">offline</span>.</h2>
      <p class="lead">O diário de campo funciona sem internet e sincroniza quando você volta a ter sinal — tudo com backup na nuvem. Talhões, cargas, bases e APPs georreferenciados num mapa único, do celular ao centro de operações.</p>
    </div>
    <div class="media" data-parallax>
      <figure class="shot">
        <img src="/images/caminhao-estrada.jpg" alt="Caminhão em estrada rural entre lavouras" loading="lazy">
        <figcaption>Cargas rastreadas no mapa</figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- CASOS DE USO -->
<section class="section theme-gray" data-theme="gray" id="impact">
  <div class="container">
    <div class="label reveal"><span class="k">{ Na prática }</span><span class="sep mono">// Casos de uso</span></div>
    <h2 class="huge" data-split>Do plantio à entrega, <span class="accent">conectado</span>.</h2>
    <div class="caps" style="margin-top:46px">
      <div class="reveal">
        <div class="src mono" style="display:flex;gap:10px;margin-bottom:12px"><b>Fazenda Braúna</b> · Cliente AgroTorre</div>
        <p class="lead" style="margin-top:0;max-width:46ch">Lavoura, rebanho e logística num só painel. Cada lançamento no campo atualiza KPIs, COGS e o mapa da operação na hora — custo real por etapa, perdas monitoradas e decisões tomadas antes que o problema vire prejuízo.</p>
        <div class="src mono" style="display:flex;gap:10px;margin:36px 0 12px"><b>Fazenda Santa Helena</b> · Operação integrada</div>
        <p class="lead" style="margin-top:0;max-width:46ch">Do campo ao financeiro em tempo real: campo, pecuária e logística conectados numa única torre de controle, com rastreabilidade ponta a ponta e sem planilha solta.</p>
      </div>
      <div class="media" data-parallax>
      <div class="screen float">
        <div class="bar"><i></i><i></i><i></i><span class="t">AgroTorre // Produção &amp; COGS</span></div>
        <span class="badge">Caso de uso</span>
        <div class="scr"><div class="gx"></div>
          <svg viewBox="0 0 420 300" preserveAspectRatio="none">
            <polyline class="edge" points="20,210 80,170 140,185 200,120 260,140 320,80 400,100" fill="none"/>
            <rect x="30" y="220" width="26" height="50" class="bar-fill"/>
            <rect x="70" y="200" width="26" height="70" class="bar-fill"/>
            <rect x="110" y="180" width="26" height="90" class="bar-hi"/>
            <rect x="150" y="210" width="26" height="60" class="bar-fill"/>
            <rect x="190" y="160" width="26" height="110" class="bar-fill"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
  </div>
</section>

<!-- QUOTE (produtor) -->
<section class="section quote theme-dark" data-theme="dark">
  <div class="container">
    <blockquote data-split>Pela primeira vez enxergo a fazenda inteira numa tela só — do talhão ao caixa. Parei de decidir no escuro.</blockquote>
    <div class="who reveal d1">Iago de Sá — Fazenda Braúna</div>
    <div class="role reveal d1">Cliente AgroTorre</div>
  </div>
</section>

<!-- NA PRÁTICA (cards) -->
<section class="section news theme-light" data-theme="light" id="news">
  <div class="container">
    <div class="label reveal"><span class="k">{ Na prática }</span><span class="sep mono">// Do plantio à entrega</span></div>
    <div class="grid">
      <article class="ncard reveal">
        <div class="src mono"><b>Agricultura</b> · Lavoura</div>
        <h3>Lavoura monitorada do plantio à colheita.</h3>
        <p style="color:var(--text-2);margin:0">Áreas e talhões com GPS, calendário de plantio/colheita, insumos, pragas, solo e clima — com custo por hectare e estimativa de safra atualizados em tempo real.</p>
      </article>
      <article class="ncard reveal d1">
        <div class="src mono"><b>Pecuária</b> · Rebanho</div>
        <h3>Rebanho rastreado por lote e QR Code.</h3>
        <p style="color:var(--text-2);margin:0">Ficha individual por animal, calendário sanitário, ciclo reprodutivo, produção diária e curva de peso — origem e cadeia de custódia ponta a ponta.</p>
      </article>
      <article class="ncard reveal d2">
        <div class="src mono"><b>Logística</b> · Distribuição</div>
        <h3>Cargas e frota acompanhadas no mapa.</h3>
        <p style="color:var(--text-2);margin:0">Roteirização de entregas, fretes, rotas e bases monitoradas em tempo real, com checklist de expedição e custo de transporte por carga.</p>
      </article>
      <article class="ncard reveal d3">
        <div class="src mono"><b>Financeiro</b> · COGS</div>
        <h3>Custo real conectado à operação.</h3>
        <p style="color:var(--text-2);margin:0">Fluxo de caixa, ponto de equilíbrio e custo por produto, etapa e rota calculados a partir dos lançamentos reais — sem planilha paralela.</p>
      </article>
    </div>
    <p style="margin-top:34px"><a href="#offerings" class="btn reveal">Ver todos os módulos <span class="arw">→</span></a></p>
  </div>
</section>

<!-- PERSONAS — plataforma integrada (para quem) -->
<section class="section personas theme-light" data-theme="light" data-film="4" id="personas">
  <div class="container">
    <div class="label reveal"><span class="k">{ Plataforma integrada }</span><span class="sep mono">// Para quem</span></div>
    <h2 class="huge" data-split>Uma torre, três <span class="accent">olhares</span>.</h2>
    <div class="grid">
      <div class="persona reveal">
        <span class="p-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></span>
        <h3>Produtor / Gestor</h3>
        <p>Enxerga a operação inteira numa tela só — do talhão ao caixa, em tempo real, e decide antes do prejuízo.</p>
      </div>
      <div class="persona reveal d1">
        <span class="p-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21V11"/><path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5Z"/><path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z"/></svg></span>
        <h3>Agrônomo / Equipe de campo</h3>
        <p>Registra e consulta direto no campo — diário, talhões e pragas — funcionando até offline e sincronizando depois.</p>
      </div>
      <div class="persona reveal d2">
        <span class="p-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span>
        <h3>Financeiro / Cooperativa</h3>
        <p>Acompanha o custo real, o COGS por produto e etapa e o ponto de equilíbrio — decisão sustentada por números reais.</p>
      </div>
    </div>
  </div>
</section>

<!-- BAND / valor -->
<section class="section band theme-gray" data-theme="gray" id="contact">
  <div class="container">
    <div class="k mono reveal">{ Tudo conectado · em tempo real }</div>
    <h2 data-split>Tudo conectado, do plantio à <span class="accent">entrega</span>.</h2>
    <div class="reveal d2"><a href="/login" class="btn solid" data-magnetic>Acessar plataforma <span class="arw">→</span></a></div>
  </div>
</section>

<!-- CTA BAND -->
<section class="section cta-band theme-dark" data-theme="dark" data-film="5" id="cta">
  <div class="container">
    <h2 data-split>Cada hectare sob <span class="accent">controle</span>.</h2>
    <p class="reveal d1">Dados conectados em tempo real, do plantio à entrega — menos perdas, mais eficiência e decisões tomadas na hora certa.</p>
    <div class="acts reveal d2">
      <a href="/login" class="btn solid" data-magnetic>Acessar plataforma <span class="arw">→</span></a>
      <a href="https://calendly.com/neryadministrativo/30min" target="_blank" rel="noopener noreferrer" class="btn" data-magnetic>Agendar DEMO <span class="arw">→</span></a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="theme-dark" data-theme="dark">
  <div class="container">
    <div class="foot-word-wrap"><div class="foot-word" id="foot-word">AgroTorre</div></div>
    <div class="f-top">
      <div class="f-brand">
        <a href="#" class="brand"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2 22 12 12 22 2 12Z" opacity=".9"/><circle cx="12" cy="12" r="3.4" fill="#050506"/></svg> AgroTorre</a>
        <p>Gestão agro em tempo real, do campo ao financeiro.</p>
      </div>
      <div>
        <h4>Módulos</h4>
        <a href="#">Campo &amp; Produção</a><a href="#">Pecuária</a><a href="#">Financeiro &amp; COGS</a><a href="#">Logística</a><a href="#">Emissão de Carbono</a><a href="#">Inteligência</a>
      </div>
      <div>
        <h4>Plataforma</h4>
        <a href="#">Torre de Controle</a><a href="#">Mapa operacional</a><a href="#">Rastreabilidade QR</a><a href="#">Offline + nuvem</a><a href="#">Importar / Exportar</a><a href="/login">Acessar plataforma</a>
      </div>
      <div>
        <h4>Setores</h4>
        <div class="f-ind">
          <a href="#">Agricultura</a><a href="#">Pecuária</a><a href="#">Café</a><a href="#">Grãos</a><a href="#">Hortifrúti</a><a href="#">Orgânicos</a><a href="#">Laticínios</a><a href="#">Cana</a><a href="#">Florestal</a><a href="#">Cooperativas</a><a href="#">Logística agro</a><a href="#">Agroindústria</a>
        </div>
      </div>
    </div>
    <div class="f-bot">
      <div class="l">
        <span>© 2026 AgroTorre. Todos os direitos reservados.</span>
        <a href="#" id="cookie-settings">Cookies</a>
        <span>Brasil</span>
      </div>
      <div class="r"><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">YouTube</a><a href="#">Suporte</a></div>
    </div>
  </div>
</footer>

<!-- COOKIE BANNER -->
<div class="cookie" id="cookie" role="dialog" aria-label="Consentimento de cookies">
  <div class="panel">
    <p>Usamos cookies para melhorar sua navegação, analisar o uso da plataforma e aprimorar nossos serviços. <a href="#">Saiba mais</a></p>
    <div class="acts">
      <button class="btn solid" data-consent="all">Aceitar todos</button>
      <button class="btn" data-consent="reject">Recusar</button>
      <button class="btn" data-consent="settings">Configurar</button>
    </div>
  </div>
</div>

<!-- MEGA-MENU -->
<div class="mega" id="mega" role="dialog" aria-label="Menu principal" aria-hidden="true">
  <button class="close" id="menu-close" aria-label="Fechar menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 6l12 12M18 6 6 18"/></svg>
  </button>
  <div class="inner">
    <div><h4>Módulos</h4><a class="mi" href="#offerings">Campo</a><a class="mi" href="#offerings">Pecuária</a><a class="mi" href="#offerings">Financeiro &amp; COGS</a><a class="mi" href="#offerings">Logística</a><a class="mi" href="#offerings">Emissão de Carbono</a><a class="mi" href="#offerings">Inteligência</a></div>
    <div><h4>Soluções</h4><a class="mi" href="#caps">Tempo real</a><a class="mi" href="#caps">Rastreabilidade QR</a><a class="mi" href="#caps">Mapa operacional</a><a class="mi" href="#impact">Caso de uso</a></div>
    <div><h4>Empresa</h4><a class="mi" href="#">Sobre</a><a class="mi" href="#news">Na prática</a><a class="mi" href="#contact">Contato</a><a class="mi" href="#">Suporte</a></div>
    <div><h4>Recursos</h4><a class="mi" href="#">Documentação</a><a class="mi" href="#">Blog</a><a class="mi" href="#impact">Casos de uso</a><a class="mi" href="/login">Acessar plataforma</a></div>
  </div>
</div>

<!-- overlays cinematográficos -->
<div class="vignette" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>`;
