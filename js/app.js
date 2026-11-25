/* =========================================================================
   MEMENTO — interactions
   All content is loaded from /content/*.json (editable via Pages CMS).
   ========================================================================= */
(function () {
  "use strict";
  let M = {};
  let T = {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* image paths: "images/gallery/name.webp" (from CMS may start with "/") */
  const norm = (p) => String(p || "").replace(/^\/+/, "");
  const hasSmall = (p) => /^images\/(gallery|booth)\/[^/]+\.webp$/.test(norm(p)) && !/-sm\.webp$/.test(p);
  const src = (p, size) => { p = norm(p); return size === "sm" && hasSmall(p) ? p.replace(/\.webp$/, "-sm.webp") : p; };
  const srcset = (p) => hasSmall(p) ? `${src(p, "sm")} 720w, ${src(p)} 1600w` : "";
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const rich = (str) => esc(str || "").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  const lookLabel = (id) => (M.looks.find((l) => l.id === id) || {}).label || "";
  const bgLabel = (id) => (M.backgrounds.find((b) => b.id === id) || {}).label || "";
  const pad2 = (n) => String(n).padStart(2, "0");

  /* ---------- image loading ---------- */
  function loadImg(img, path, sizes, onSize) {
    img.classList.add("is-pending");
    img.decoding = "async";
    const set = srcset(path);
    if (set) { img.sizes = sizes || "(max-width: 820px) 100vw, 50vw"; img.srcset = set; } else { img.removeAttribute("srcset"); }
    img.src = src(path, "sm");
    const done = () => { img.classList.remove("is-pending"); img.classList.add("is-loaded"); if (onSize) onSize(img.naturalWidth, img.naturalHeight); };
    if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
  }
  function hydrateStatic() {
    $$("[data-t]").forEach((el) => {
      const v = get(T, el.dataset.t); if (v == null) return;
      el.innerHTML = el.classList.contains("about__story") ? String(v).split(/\n\n+/).map((p) => `<p>${rich(p)}</p>`).join("") : rich(v);
    });
    $$("img[data-img]").forEach((img) => {
      const p = get(T, img.dataset.img);
      const fig = img.closest("figure");
      if (!p) { if (fig) fig.hidden = true; return; }
      if (!img.closest(".hero")) img.loading = "lazy";
      loadImg(img, p);
    });
    if (T.seo) { document.title = T.seo.title; const d = $('meta[name="description"]'); if (d) d.content = T.seo.description; }
    $$("[data-city]").forEach((s) => (s.textContent = M.contact.city || ""));
    const list = (id, items, tpl) => { const el = $(id); if (el) el.innerHTML = (items || []).map(tpl).join(""); };
    const roman = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii."];
    list("#principles", T.about.principles, (x, i) => `<li class="reveal"><span>${roman[i] || i + 1 + "."}</span><h3>${rich(x.title)}</h3><p>${rich(x.text)}</p></li>`);
    list("#features", T.booth.features, (x, i) => `<li class="reveal"><span>${pad2(i + 1)}</span><h3>${rich(x.title)}</h3><p>${rich(x.text)}</p></li>`);
    list("#partner-points", T.partner.points, (x) => `<li class="reveal"><b>${rich(x.title)}</b>${rich(x.text)}</li>`);
  }

  /* ---------- contact bindings ---------- */
  function waLink(msg) {
    return `https://wa.me/${M.contact.whatsappNumber}?text=${encodeURIComponent(msg || M.contact.whatsappMessage)}`;
  }
  function bindContact() {
    const c = M.contact;
    $$("[data-wa]").forEach((a) => { a.href = "waPlain" in a.dataset ? `https://wa.me/${c.whatsappNumber}` : waLink(a.dataset.waKey ? get(T, a.dataset.waKey) : a.dataset.waMsg); a.target = "_blank"; a.rel = "noopener noreferrer"; });
    $$("[data-email]").forEach((a) => { a.href = `mailto:${c.email}${a.dataset.emailSubject ? "?subject=" + encodeURIComponent(a.dataset.emailSubject) : ""}`; });
    $$("[data-email-text]").forEach((s) => (s.textContent = c.email));
    $$("[data-wa-text]").forEach((s) => (s.textContent = c.whatsappDisplay));
    $$("[data-person]").forEach((s) => (s.textContent = c.person));
    $$("[data-social]").forEach((a) => { if (c[a.dataset.social]) a.href = c[a.dataset.social]; a.target = "_blank"; a.rel = "noopener noreferrer"; });
  }

  /* ---------- header & drawer ---------- */
  function initHeader() {
    const header = $(".header");
    const btn = $(".header__menu");
    const drawer = $("#drawer");
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 20);
      const open = drawer.classList.contains("is-open");
      header.classList.toggle("is-hidden", !open && y > 600 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    $$(".drawer__nav a").forEach((a, i) => a.style.setProperty("--i", i));
    const setOpen = (open) => {
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "close menu" : "open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    btn.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
    $$("a", drawer).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false); });

    // current section in nav
    const links = $$(".header__nav a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((l) => l.classList.toggle("is-current", l.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((l) => { const t = $(l.getAttribute("href")); if (t) io.observe(t); });
  }

  /* ---------- reveal on scroll ---------- */
  let revealIO;
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("is-in")); return; }
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealIO.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    // stagger siblings
    $$(".reveal").forEach((el) => {
      const sibs = $$(":scope > .reveal", el.parentElement);
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--rd", Math.min(i, 5) * 0.08 + "s");
      revealIO.observe(el);
    });
  }

  /* ---------- radio-group helper (keyboard) ---------- */
  function radioGroup(container, onSelect) {
    container.addEventListener("click", (e) => {
      const b = e.target.closest("[role=radio]");
      if (b && container.contains(b)) onSelect(b.dataset.id, b);
    });
    container.addEventListener("keydown", (e) => {
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
      if (!keys.includes(e.key)) return;
      const items = $$("[role=radio]", container);
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const n = items[(i + (keys.indexOf(e.key) < 2 ? 1 : -1) + items.length) % items.length];
      n.focus(); onSelect(n.dataset.id, n);
    });
  }
  function setChecked(container, id) {
    $$("[role=radio]", container).forEach((b) => {
      const on = b.dataset.id === id;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (!$("[role=radio][aria-checked=true]", container)) { const f = $("[role=radio]", container); if (f) f.tabIndex = 0; }
  }

  /* ---------- lightbox ---------- */
  const LB = { list: [], i: 0, lastFocus: null };
  function captionFor(item) {
    if (item.name || item.format === "strip") return "";
    return `<em>${esc(bgLabel(item.background) || "memento")}</em>`;
  }
  function lbShow(i) {
    const n = LB.list.length;
    LB.i = (i + n) % n;
    const item = LB.list[LB.i];
    const img = $("#lb-img");
    img.classList.add("is-swapping");
    const pre = new Image();
    pre.onload = () => {
      img.src = pre.src; img.alt = item.alt || "memento photograph";
      requestAnimationFrame(() => img.classList.remove("is-swapping"));
    };
    pre.src = src(item.image);
    $("#lb-cap").innerHTML = captionFor(item);
    $("#lb-count").textContent = `${pad2(LB.i + 1)} / ${pad2(n)}`;
    // preload neighbours
    [1, -1].forEach((d) => { const nb = LB.list[(LB.i + d + n) % n]; if (nb) new Image().src = src(nb.image); });
  }
  function lbOpen(list, i) {
    LB.list = list; LB.lastFocus = document.activeElement;
    const lb = $("#lightbox");
    lb.hidden = false; document.body.classList.add("lb-open");
    lbShow(i);
    $("#lb-close").focus();
  }
  function lbClose() {
    $("#lightbox").hidden = true; document.body.classList.remove("lb-open");
    if (LB.lastFocus) LB.lastFocus.focus();
  }
  function initLightbox() {
    $("#lb-close").addEventListener("click", lbClose);
    $("#lb-prev").addEventListener("click", () => lbShow(LB.i - 1));
    $("#lb-next").addEventListener("click", () => lbShow(LB.i + 1));
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox" || e.target.classList.contains("lightbox__fig")) lbClose(); });
    document.addEventListener("keydown", (e) => {
      if ($("#lightbox").hidden) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowRight") lbShow(LB.i + 1);
      if (e.key === "ArrowLeft") lbShow(LB.i - 1);
      if (e.key === "Tab") { // simple focus trap
        const f = $$("#lightbox button"); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    let x0 = null, y0 = null;
    const fig = $(".lightbox__fig");
    fig.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    fig.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(LB.i + (dx < 0 ? 1 : -1));
      else if (dy > 90) lbClose();
      x0 = null;
    });
  }

  /* ---------- gallery ----------
     Two uniform groups, never mixed in one grid:
       landscape photographs  -> every frame 3:2
       portrait prints/strips -> every frame 2:3 (image is contained, never cropped) */
  const G = { look: "original", bg: null, visible: [] };
  const isPortrait = (g) => g.format === "strip" || (g.h || 0) > (g.w || 0);

  function renderFilters() {
    const lookBox = $("#filter-look");
    lookBox.innerHTML = M.looks
      .map((l) => `<button class="chip" role="radio" data-id="${l.id}" aria-checked="false">${esc(l.label)}</button>`).join("");
    radioGroup(lookBox, (id) => { G.look = id; renderGallery(); });
    $("#gallery-reset").addEventListener("click", () => { G.look = "original"; G.bg = null; renderGallery(); });
  }

  function filtered() {
    return M.gallery.filter((g) =>
      (G.look === "all" || g.look === G.look) &&
      (!G.bg || g.background === G.bg));
  }

  function tileHTML(g, i) {
    const strip = g.format === "strip";
    const meta = strip ? "strip" : bgLabel(g.background) || "memento";
    const cap = strip ? "" : `<figcaption class="tile__cap"><b>${esc(meta)}</b></figcaption>`;
    return `<figure class="tile${strip ? " tile--strip" : ""}" style="--d:${Math.min(i, 12)}" tabindex="0" role="button"
        aria-label="open photo ${i + 1}: ${esc(meta)}, ${esc(lookLabel(g.look))}" data-i="${i}">
      <span class="tile__num">no. ${pad2(i + 1)}</span>
      <div class="tile__frame"><img alt="${esc(meta)} photograph, ${esc(lookLabel(g.look))}" loading="lazy"></div>
      ${cap}
    </figure>`;
  }

  function renderGallery() {
    setChecked($("#filter-look"), G.look);
    const box = $("#gallery");
    const all = filtered();
    const land = all.filter((g) => !isPortrait(g));
    const port = all.filter(isPortrait);
    const list = land.concat(port);
    G.visible = list;
    // backdrop tag (set from "find your frame")
    const countEl = $(".filters__count");
    $$(".bg-tag", countEl).forEach((n) => n.remove());
    if (G.bg) {
      const t = document.createElement("button");
      t.className = "bg-tag chip"; t.style.marginLeft = "10px"; t.style.fontStyle = "normal";
      t.innerHTML = `${esc(bgLabel(G.bg))} ✕`; t.setAttribute("aria-label", "remove background filter");
      t.addEventListener("click", () => { G.bg = null; G.look = "original"; renderGallery(); });
      countEl.appendChild(t);
    }
    $("#gallery-empty").hidden = all.length > 0;

    const group = (cls, items, offset) => items.length
      ? `<div class="gallery__group gallery__group--${cls}">${items.map((g, i) => tileHTML(g, offset + i)).join("")}</div>` : "";
    box.innerHTML = group("landscape", land, 0) + group("portrait", port, land.length);
    $$(".tile", box).forEach((t, i) => loadImg($("img", t), list[i].image, "(max-width: 820px) 50vw, 33vw"));
  }

  function initGallery() {
    renderFilters();
    renderGallery();
    const box = $("#gallery");
    const open = (t) => lbOpen(G.visible, +t.dataset.i);
    box.addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (t) open(t); });
    box.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("tile")) { e.preventDefault(); open(e.target); } });
  }

  function jumpToArchive() {
    renderGallery();
    $("#archive").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- Find Your Frame selectors ---------- */
  function makeSelector(root, items, kind) {
    const optBox = $("[data-options]", root);
    const imgs = $$(".stage__img", root);
    let current = null;

    optBox.innerHTML = items.map((it, i) => kind === "look"
      ? `<button class="option" role="radio" aria-checked="false" data-id="${it.id}">
           <span class="option__name">${esc(it.label)}</span>
         </button>`
      : `<button class="swatch" role="radio" aria-checked="false" data-id="${it.id}">
           <img alt="" loading="lazy" src="${src(it.thumb || it.preview, "sm")}"><span><b>${esc(it.label)}</b></span>
         </button>`).join("");

    function select(id, initial) {
      if (id === current) return;
      current = id;
      const it = items.find((x) => x.id === id);
      setChecked(optBox, id);
      $("[data-stage-name]", root).textContent = it.label;
      const sh = $("[data-short]", root), de = $("[data-desc]", root);
      if (sh && de) {
        sh.textContent = it.short || ""; de.textContent = it.description || "";
        [sh, de].forEach((p) => { p.style.animation = "none"; void p.offsetWidth; p.style.animation = ""; });
      }

      const [a, b] = imgs[0].classList.contains("is-active") ? imgs : [imgs[1], imgs[0]];
      b.alt = `${it.label} — example photograph`;
      const swap = () => { b.classList.add("is-active"); a.classList.remove("is-active"); };
      b.onload = swap;
      const ss = srcset(it.preview);
      if (ss) { b.sizes = "(max-width: 820px) 100vw, 58vw"; b.srcset = ss; } else b.removeAttribute("srcset");
      b.src = src(it.preview);
      if (b.complete && b.naturalWidth) swap();

      // more examples
      const more = $("[data-more]", root);
      if (more) {
        const ex = M.gallery.filter((g) => (kind === "look" ? g.look === id : g.background === id) && norm(g.image) !== norm(it.preview));
        more.innerHTML = ex.slice(0, 4).map((g, i) =>
          `<button data-k="${i}" aria-label="view example ${i + 1} of ${esc(it.label)}"><img alt="" loading="lazy" src="${src(g.image, "sm")}"></button>`).join("");
        more.onclick = (e) => { const bt = e.target.closest("button"); if (bt) lbOpen(ex, +bt.dataset.k); };
      }
      if (!initial) root.dataset.selected = id;
    }

    radioGroup(optBox, (id) => select(id));
    $("[data-jump]", root).addEventListener("click", (e) => {
      e.preventDefault();
      if (kind === "look") { G.look = current; G.bg = null; } else { G.bg = current; G.look = "all"; }
      jumpToArchive();
    });
    select(items[0].id, true);
  }

  /* ---------- prints ---------- */
  function initPrints() {
    const rail = $("#prints-rail");
    rail.innerHTML = M.prints.map((p, i) => `
      <figure class="print reveal" data-i="${i}" tabindex="0" role="button" aria-label="view ${esc(p.name)}">
        <div class="print__card"><img alt="${esc(p.name)}" loading="lazy"></div>
      </figure>`).join("");
    $$(".print", rail).forEach((f, i) => loadImg($("img", f), M.prints[i].image, "(max-width: 820px) 60vw, 22vw"));
    const open = (f) => lbOpen(M.prints, +f.dataset.i);
    rail.addEventListener("click", (e) => { const f = e.target.closest(".print"); if (f) open(f); });
    rail.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("print")) open(e.target); });
  }

  /* ---------- locations ---------- */
  function initLocations() {
    const box = $("#loc-list");
    box.innerHTML = M.locations.map((l, i) => {
      const href = l.maps || waLink("Hi Memento, I'd like to book the booth for an event.");
      const evCta = `<a class="link-arrow" href="${esc(href)}" target="_blank" rel="noopener">${esc(l.button || "open in maps")}</a>`;
      return `<article class="loc reveal">
        <span class="loc__n">${pad2(i + 1)}</span>
        <div><h3 class="loc__name">${esc(l.name)}</h3>${l.venue || l.city ? `<p class="loc__venue">${esc([l.venue, l.city].filter(Boolean).join(" · "))}</p>` : ""}</div>
        ${l.address ? `<p class="loc__addr">${esc(l.address)}</p>` : ""}
        ${l.hours ? `<p class="loc__hours"><b>hours</b><span>${esc(l.hours)}</span></p>` : ""}
        <div class="loc__act">${evCta}<div class="loc__img"><img alt="" loading="lazy"></div></div>
      </article>`;
    }).join("");
    $$(".loc", box).forEach((el, i) => { const im = $(".loc__img img", el); if (M.locations[i].image) loadImg(im, M.locations[i].image, "84px"); else im.parentElement.remove(); });
  }

  /* ---------- boot ---------- */
  async function loadContent() {
    const files = ["settings", "text", "gallery", "looks", "backgrounds", "prints", "locations"];
    const data = await Promise.all(files.map((f) => fetch(`content/${f}.json`, { cache: "no-cache" }).then((r) => r.json())));
    const [settings, text, gallery, looks, backgrounds, prints, locations] = data;
    const shown = (a) => (a || []).filter((x) => x && x.show !== false);
    T = text;
    M = {
      contact: settings,
      gallery: shown(gallery).filter((g) => g.image).map((g) => Object.assign({}, g, {
        background: g.background && g.background !== "none" ? g.background : null,
      })),
      looks: shown(looks).filter((l) => l.preview),
      backgrounds: shown(backgrounds).filter((b) => b.preview),
      prints: shown(prints).filter((p) => p.image),
      locations: shown(locations),
    };
  }

  async function boot() {
    try { await loadContent(); }
    catch (e) { console.error("Content failed to load", e); document.body.classList.remove("is-loading"); return; }
    hydrateStatic();
    bindContact();
    initHeader();
    initLightbox();
    initGallery();
    if (M.looks.length) makeSelector($("#look-selector"), M.looks, "look"); else $("#look-selector").hidden = true;
    if (M.backgrounds.length) makeSelector($("#bg-selector"), M.backgrounds, "bg"); else $("#bg-selector").hidden = true;
    initPrints();
    initLocations();
    initReveal();
    const heroImg = $(".hc--a img");
    const lift = () => document.body.classList.remove("is-loading");
    if (!heroImg || heroImg.complete) setTimeout(lift, 500);
    else { heroImg.addEventListener("load", () => setTimeout(lift, 350), { once: true }); }
    setTimeout(lift, 2200); // never hold the page hostage
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
