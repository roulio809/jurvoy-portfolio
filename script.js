(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Titre : découpe en lettres ---------- */
  let ci = 0;
  $$('[data-split]').forEach(el => {
    const txt = el.textContent;
    el.textContent = '';
    [...txt].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--i', ci++);
      s.textContent = ch;
      el.appendChild(s);
    });
  });

  /* ---------- Réseau de particules (canvas) ---------- */
  const cv = $('#net');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, pts = [];
    const mouse = { x: -999, y: -999 };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(95, Math.floor((W * H) / 17000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .8, hot: Math.random() < .08
      }));
    };
    const LINK = 135, MLINK = 170;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(94,234,212,${(1 - d / LINK) * .28})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < MLINK) {
          ctx.strokeStyle = `rgba(255,184,107,${(1 - dm / MLINK) * .55})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = p.hot ? '#ffb86b' : '#5eead4';
        ctx.globalAlpha = p.hot ? .9 : .65;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    let raf;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    if (reduce) draw(); else loop();
    document.addEventListener('visibilitychange', () => {
      if (reduce) return;
      document.hidden ? cancelAnimationFrame(raf) : loop();
    });
  }

  /* ---------- Halo qui suit le curseur ---------- */
  const glow = $('.glow');
  if (glow && !reduce) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function tick() {
      gx += (tx - gx) * .12; gy += (ty - gy) * .12;
      glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Barre de progression + nav ---------- */
  const bar = $('.progress'), nav = $('#nav');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    nav.classList.toggle('scrolled', scrollY > 30);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), links = $('#links');
  const closeMenu = () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#links a').forEach(a => a.addEventListener('click', closeMenu));

  const navLinks = $$('#links a:not(.pill)');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secObs.observe(s));

  /* ---------- Apparition au scroll ---------- */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revObs.observe(el));

  /* ---------- Texte dactylographié ---------- */
  const typed = $('#typed');
  const phrases = [
    'administre des systèmes Windows & Linux',
    'configure des réseaux Cisco',
    'déploie des services (AD, DHCP, GPO)',
    'supervise une infra avec Zabbix',
    'relie les utilisateurs à la technique'
  ];
  if (typed) {
    if (reduce) { typed.textContent = phrases[0]; }
    else {
      let i = 0, j = 0, del = false;
      const tick = () => {
        const t = phrases[i];
        typed.textContent = t.slice(0, j);
        if (!del && j === t.length) { del = true; return setTimeout(tick, 1700); }
        if (del && j === 0) { del = false; i = (i + 1) % phrases.length; return setTimeout(tick, 350); }
        j += del ? -1 : 1;
        setTimeout(tick, del ? 22 : 48);
      };
      typed.textContent = '';
      setTimeout(tick, 900);
    }
  }

  /* ---------- Terminal animé ---------- */
  const term = $('#term');
  if (term) {
    const script = [
      { cmd: 'whoami' },
      { out: 'jules urvoy · <b>BTS SIO</b> option SISR · Nantes' },
      { cmd: 'cat stack.txt' },
      { out: 'debian · windows-server · cisco' },
      { out: 'opnsense · zabbix · asterisk' },
      { cmd: 'ping -c1 curiosité' },
      { out: '64 bytes : time&lt;1ms  <span class="ok">(0% de perte)</span>' },
      { cmd: 'systemctl status motivation' },
      { out: '<span class="ok">●</span> motivation.service — <span class="ok">active (running)</span>' }
    ];
    const prompt = () => {
      const d = document.createElement('div');
      d.innerHTML = '<span class="p">jules@infra</span>:<span class="p">~</span>$ ';
      return d;
    };
    (async () => {
      term.innerHTML = '';
      await sleep(reduce ? 0 : 1100);
      for (const l of script) {
        if (l.cmd) {
          const row = prompt(); term.appendChild(row);
          const span = document.createElement('span'); row.appendChild(span);
          if (reduce) span.textContent = l.cmd;
          else for (const ch of l.cmd) { span.textContent += ch; await sleep(38 + Math.random() * 40); }
          await sleep(reduce ? 0 : 260);
        } else {
          const row = document.createElement('div');
          row.className = 'out fade'; row.innerHTML = l.out; term.appendChild(row);
          await sleep(reduce ? 0 : 320);
        }
      }
      const last = prompt(); last.innerHTML += '<span class="cur"></span>'; term.appendChild(last);
    })();
  }

  /* ---------- Cartes : effet de projecteur + inclinaison ---------- */
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (!reduce && e.pointerType === 'mouse') {
        const rx = ((y / r.height) - .5) * -7, ry = ((x / r.width) - .5) * 9;
        card.style.transition = 'border-color .3s, box-shadow .3s';
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    card.addEventListener('pointerleave', () => {
      card.style.transition = 'transform .6s var(--ease), border-color .3s, box-shadow .3s';
      card.style.transform = '';
    });
  });

  /* ---------- Boutons magnétiques ---------- */
  if (!reduce) {
    $$('.btn.primary, .btn.ghost').forEach(b => {
      b.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .18, y = (e.clientY - r.top - r.height / 2) * .3;
        b.style.transform = `translate(${x}px,${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Schéma d'infrastructure interactif ---------- */
  const topo = $('#topo');
  if (topo) {
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs = {}, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };
    const W = 150, H = 46;
    const nodes = {
      net: { x: 400, y: 36,  t: 'Internet', s: 'réseau externe', k: 'Point d’entrée',
             d: 'Tout le trafic entrant et sortant passe par le pare-feu avant d’atteindre le réseau interne.', tags: ['WAN'] },
      fw:  { x: 400, y: 122, t: 'OPNsense', s: 'pare-feu', k: 'Sécurité',
             d: 'Mise en place d’un pare-feu OPNsense pour contrôler les flux entre Internet et le réseau interne.', tags: ['OPNsense', 'Filtrage', 'Pare-feu'] },
      sw:  { x: 400, y: 214, t: 'Cisco', s: 'routage · commutation', k: 'Cœur de réseau',
             d: 'Configuration de commutateurs et de routeurs Cisco. Routage et commutation travaillés notamment avec Cisco Packet Tracer.', tags: ['Cisco', 'Routage', 'Commutation', 'Packet Tracer'] },
      win: { x: 120, y: 316, t: 'Windows Server', s: 'AD · DHCP · GPO', k: 'Annuaire & identité',
             d: 'Gestion des utilisateurs et groupes, serveur de fichiers, GPO, profils itinérants, réplication d’Active Directory et redondance DHCP. Automatisation avec PowerShell.', tags: ['Active Directory', 'GPO', 'DHCP', 'PowerShell'] },
      lin: { x: 290, y: 316, t: 'Linux', s: 'Apache · MariaDB', k: 'Services serveur',
             d: 'Administration et configuration de services réseaux sous Debian et Linux Mint : serveur web Apache et base de données MariaDB.', tags: ['Debian', 'Linux Mint', 'Apache', 'MariaDB'] },
      zbx: { x: 510, y: 316, t: 'Zabbix', s: 'supervision', k: 'Supervision',
             d: 'Supervision de l’infrastructure avec Zabbix pour surveiller l’état des machines et des services.', tags: ['Zabbix', 'Monitoring'] },
      ast: { x: 680, y: 316, t: 'Asterisk', s: 'téléphonie IP', k: 'Communication',
             d: 'Mise en place d’un service de téléphonie IP avec Asterisk.', tags: ['Asterisk', 'ToIP'] },
      cli: { x: 400, y: 404, t: 'Postes & support', s: 'GLPI · MediaWiki', k: 'Utilisateurs',
             d: 'Assistance aux utilisateurs avec GLPI, configuration de postes de travail Windows 10/11 et alimentation d’une base de connaissances MediaWiki.', tags: ['GLPI', 'MediaWiki', 'Windows 10/11', 'Ticketing'] }
    };
    const edges = [['net', 'fw'], ['fw', 'sw'], ['sw', 'win'], ['sw', 'lin'], ['sw', 'zbx'], ['sw', 'ast'], ['sw', 'cli']];

    const svg = el('svg', { viewBox: '0 0 800 440', role: 'group' }, topo);
    const gLinks = el('g', {}, svg), gPk = el('g', {}, svg), gNodes = el('g', {}, svg);

    const path = (a, b) => {
      const A = nodes[a], B = nodes[b];
      const y1 = A.y + H / 2, y2 = B.y - H / 2;
      if (A.x === B.x) return `M${A.x} ${y1}V${y2}`;
      const my = y1 + (y2 - y1) / 2;
      return `M${A.x} ${y1}V${my}H${B.x}V${y2}`;
    };
    const linkEls = {};
    edges.forEach(([a, b], i) => {
      const d = path(a, b);
      el('path', { d, class: 'link' }, gLinks);
      linkEls[a + b] = el('path', { d, class: 'link flow' }, gLinks);
      if (!reduce) {
        const c = el('circle', { r: 3.2, class: 'pkt' }, gPk);
        const am = el('animateMotion', { dur: (2.4 + (i % 3) * .5) + 's', repeatCount: 'indefinite', begin: (i * .35) + 's', path: d }, c);
      }
    });

    const els = {};
    Object.entries(nodes).forEach(([id, n]) => {
      const g = el('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.t, transform: `translate(${n.x - W / 2} ${n.y - H / 2})` }, gNodes);
      const ring = el('rect', { class: 'pulse', width: W, height: H, rx: 12, style: `transform-origin:${W / 2}px ${H / 2}px;transform-box:fill-box` }, g);
      el('rect', { width: W, height: H, rx: 12 }, g);
      const t1 = el('text', { class: 't1', x: W / 2, y: 20, 'text-anchor': 'middle' }, g); t1.textContent = n.t;
      const t2 = el('text', { class: 't2', x: W / 2, y: 35, 'text-anchor': 'middle' }, g); t2.textContent = n.s;
      els[id] = g;
      g.addEventListener('pointerenter', () => { stop(); show(id); });
      g.addEventListener('click', () => { stop(); show(id); });
      g.addEventListener('focus', () => { stop(); show(id); });
    });

    const pK = $('#p-kicker'), pT = $('#p-title'), pP = $('#p-text'), pG = $('#p-tags'), panel = $('#panel');
    let current = null;
    function show(id) {
      if (current === id) return;
      current = id;
      Object.entries(els).forEach(([k, g]) => g.classList.toggle('active', k === id));
      Object.entries(linkEls).forEach(([k, p]) => p.classList.toggle('hot', k.includes(id)));
      const n = nodes[id];
      pK.textContent = n.k; pT.textContent = n.t; pP.textContent = n.d;
      pG.innerHTML = n.tags.map(t => `<span>${t}</span>`).join('');
      // relance l'animation d'entrée du panneau
      [...panel.children].forEach(c => { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; });
    }
    let timer = null;
    const order = Object.keys(nodes);
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    show('fw');
    if (!reduce) {
      let idx = 1;
      timer = setInterval(() => { show(order[idx % order.length]); idx++; }, 3600);
    }
  }

  /* ---------- Filtres du parcours ---------- */
  const filters = $$('.f'), items = $$('#timeline .item');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.cat === f;
      it.classList.toggle('hide', !show);
      if (show) { it.classList.add('in'); it.style.opacity = 0; it.style.transform = 'translateY(14px)';
        requestAnimationFrame(() => requestAnimationFrame(() => { it.style.opacity = ''; it.style.transform = ''; })); }
    });
  }));

  /* ---------- Copier l'email ---------- */
  const copy = $('#copy');
  if (copy) copy.addEventListener('click', async () => {
    const mail = 'julesurvoy@gmail.com';
    try { await navigator.clipboard.writeText(mail); }
    catch (e) {
      const t = document.createElement('textarea'); t.value = mail; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (_) {} t.remove();
    }
    const old = copy.textContent; copy.textContent = 'Adresse copiée ✓';
    setTimeout(() => { copy.textContent = old; }, 2000);
  });

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
