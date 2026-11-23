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
  const catLabel = (id) => (M.categories.find((c) => c.id === id) || {}).label || "";
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
    $$("[data-t]").forEach((el) => { const v = get(T, el.dataset.t); if (v != null) el.innerHTML = rich(v); });
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
    $("#ticker").innerHTML = (T.hero.ticker || []).map((w) => `<span>${esc(w)}</span>`).join("<i>✦</i>");
  }

  /* ---------- contact bindings ---------- */
  function waLink(msg) {
    return `https://wa.me/${M.contact.whatsappNumber}?text=${encodeURIComponent(msg || M.contact.whatsappMessage)}`;
  }
  function bindContact() {
    const c = M.contact;
    $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.waKey ? get(T, a.dataset.waKey) : a.dataset.waMsg); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-email]").forEach((a) => { a.href = `mailto:${c.email}${a.dataset.emailSubject ? "?subject=" + encodeURIComponent(a.dataset.emailSubject) : ""}`; });
    $$("[data-email-text]").forEach((s) => (s.textContent = c.email));
    $$("[data-wa-text]").forEach((s) => (s.textContent = c.whatsappDisplay));
    $$("[data-person]").forEach((s) => (s.textContent = c.person));
    $$("[data-social]").forEach((a) => { a.href = c[a.dataset.social]; a.target = "_blank"; a.rel = "noopener"; });
    $("#year").textContent = new Date().getFullYear();
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
      btn.querySelector("span").textContent = open ? "Close" : "Menu";
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
  }

  /* ---------- lightbox ---------- */
  const LB = { list: [], i: 0, lastFocus: null };
  function captionFor(item) {
    const parts = [];
    if (item.categories) parts.push(item.categories.map(catLabel).join(" · "));
    if (item.look) parts.push(lookLabel(item.look));
    if (item.background) parts.push(bgLabel(item.background));
    const title = item.name || (item.format === "strip" ? "The strip" : bgLabel(item.background) || "Memento");
    return `<em>${esc(title)}</em>${esc(parts.join("  /  "))}`;
  }
  function lbShow(i) {
    const n = LB.list.length;
    LB.i = (i + n) % n;
    const item = LB.list[LB.i];
    const img = $("#lb-img");
    img.classList.add("is-swapping");
    const pre = new Image();
    pre.onload = () => {
      img.src = pre.src; img.alt = item.alt || "Memento photograph";
      requestAnimationFrame(() => img.classList.remove("is-swapping"));
    };
    pre.src = src(item.image);
    $("#lb-cap").innerHTML = item.note ? `<em>${esc(item.name)}</em>${esc(item.note)}` : captionFor(item);
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

  /* ---------- gallery ---------- */
  const PAGE = 16;
  const G = { cat: "all", look: "all", bg: null, visible: [], limit: PAGE };
  const LAND_DESKTOP = [7, 5, 4, 4, 4, 5, 7, 6, 6];
  const LAND_MOBILE = [6, 3, 3];

  function renderFilters() {
    const catBox = $("#filter-category");
    const count = (pred) => M.gallery.filter(pred).length;
    catBox.innerHTML = M.categories.map((c) => {
      const n = c.id === "all" ? M.gallery.length : count((g) => g.categories.includes(c.id));
      return `<button class="chip" role="radio" data-id="${c.id}" aria-checked="false">${esc(c.label)}<sup>${n}</sup></button>`;
    }).join("");
    const lookBox = $("#filter-look");
    lookBox.innerHTML = [{ id: "all", label: "Every look" }].concat(M.looks)
      .map((l) => `<button class="chip" role="radio" data-id="${l.id}" aria-checked="false">${esc(l.label)}</button>`).join("");
    radioGroup(catBox, (id) => { G.cat = id; G.limit = PAGE; renderGallery(); });
    radioGroup(lookBox, (id) => { G.look = id; G.limit = PAGE; renderGallery(); });
    $("#gallery-more").addEventListener("click", () => { const from = G.limit; G.limit += PAGE; renderGallery(); const t = $$(".tile")[from]; if (t) t.focus({ preventScroll: true }); });
    $("#gallery-reset").addEventListener("click", () => { G.cat = "all"; G.look = "all"; G.bg = null; renderGallery(); });
  }

  function filtered() {
    return M.gallery.filter((g) =>
      (G.cat === "all" || g.categories.includes(G.cat)) &&
      (G.look === "all" || g.look === G.look) &&
      (!G.bg || g.background === G.bg));
  }

  function renderGallery() {
    setChecked($("#filter-category"), G.cat);
    setChecked($("#filter-look"), G.look);
    const box = $("#gallery");
    const all = filtered();
    const list = all.slice(0, G.limit);
    G.visible = list;
    const more = $("#gallery-more");
    more.hidden = all.length <= G.limit;
    more.querySelector("span").textContent = all.length - list.length;
    $("#gallery-count").textContent = all.length;
    // backdrop tag (set from "Find Your Frame")
    const countEl = $(".filters__count");
    $$(".bg-tag", countEl).forEach((n) => n.remove());
    if (G.bg) {
      const t = document.createElement("button");
      t.className = "bg-tag chip"; t.style.marginLeft = "10px"; t.style.fontStyle = "normal";
      t.innerHTML = `${esc(bgLabel(G.bg))} ✕`; t.setAttribute("aria-label", "Remove backdrop filter");
      t.addEventListener("click", () => { G.bg = null; renderGallery(); });
      countEl.appendChild(t);
    }
    $("#gallery-empty").hidden = all.length > 0;

    box.innerHTML = list.map((g, i) => {
      const meta = g.format === "strip" ? "Strip" : bgLabel(g.background) || "Memento";
      return `<figure class="tile${g.format === "strip" ? " tile--strip" : ""}" style="--d:${Math.min(i % PAGE, 12)}" tabindex="0" role="button"
                aria-label="Open photo ${i + 1}: ${esc(g.categories.map(catLabel).join(", "))}, ${esc(lookLabel(g.look))}" data-i="${i}">
          <span class="tile__num">No. ${pad2(i + 1)}</span>
          <div class="tile__frame" style="aspect-ratio:${g.w || 3}/${g.h || 2}"><img alt="${esc(catLabel(g.categories[0]))} photograph, ${esc(lookLabel(g.look))}" loading="lazy"></div>
          <figcaption class="tile__cap"><b>${esc(catLabel(g.categories[0]))}</b><span>${esc(lookLabel(g.look))} · ${esc(meta)}</span></figcaption>
        </figure>`;
    }).join("");
    $$(".tile", box).forEach((t, i) => loadImg($("img", t), list[i].image, "(max-width: 820px) 50vw, 33vw", (w, h) => {
      const g = list[i];
      if (!g.w || !g.h) { g.w = w; g.h = h; $(".tile__frame", t).style.aspectRatio = `${w}/${h}`; scheduleLayout(); }
    }));
    layoutGallery();
  }

  let lt; function scheduleLayout() { clearTimeout(lt); lt = setTimeout(layoutGallery, 60); }
  function layoutGallery() {
    const box = $("#gallery");
    const tiles = $$(".tile", box);
    if (!tiles.length) return;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const cols = mobile ? 6 : 12;
    const gap = parseFloat(getComputedStyle(box).columnGap) || 0;
    const colW = (box.clientWidth - gap * (cols - 1)) / cols;
    const ROW = 8, CAP = 34, BOTTOM = mobile ? 18 : 28;
    let land = 0;
    tiles.forEach((t, i) => {
      const g = G.visible[i];
      const gw = g.w || 3, gh = g.h || 2;
      const portrait = gh > gw;
      let span;
      if (mobile) span = portrait ? 3 : LAND_MOBILE[land++ % LAND_MOBILE.length];
      else span = portrait ? 3 : LAND_DESKTOP[land++ % LAND_DESKTOP.length];
      const w = colW * span + gap * (span - 1);
      const h = w * (gh / gw) + CAP + BOTTOM;
      t.style.gridColumn = `span ${span}`;
      t.style.gridRowEnd = `span ${Math.ceil(h / ROW)}`;
    });
  }

  function initGallery() {
    renderFilters();
    renderGallery();
    const box = $("#gallery");
    const open = (t) => lbOpen(G.visible, +t.dataset.i);
    box.addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (t) open(t); });
    box.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("tile")) { e.preventDefault(); open(e.target); } });
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layoutGallery, 120); });
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
           <span class="option__n">${pad2(i + 1)}</span><span class="option__name">${esc(it.label)}</span><span class="option__short">${esc(it.short)}</span>
         </button>`
      : `<button class="swatch" role="radio" aria-checked="false" data-id="${it.id}">
           <img alt="" loading="lazy" src="${src(it.thumb || it.preview, "sm")}"><span><b>${esc(it.label)}</b><small>${esc(it.short)}</small></span>
         </button>`).join("");

    function select(id, initial) {
      if (id === current) return;
      current = id;
      const it = items.find((x) => x.id === id);
      setChecked(optBox, id);
      $("[data-stage-name]", root).textContent = it.label;
      const sh = $("[data-short]", root), de = $("[data-desc]", root);
      sh.textContent = it.short; de.textContent = it.description;
      [sh, de].forEach((p) => { p.style.animation = "none"; void p.offsetWidth; p.style.animation = ""; });

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
          `<button data-k="${i}" aria-label="View example ${i + 1} of ${esc(it.label)}"><img alt="" loading="lazy" src="${src(g.image, "sm")}"></button>`).join("");
        more.onclick = (e) => { const bt = e.target.closest("button"); if (bt) lbOpen(ex, +bt.dataset.k); };
      }
      if (!initial) root.dataset.selected = id;
    }

    radioGroup(optBox, (id) => select(id));
    $("[data-jump]", root).addEventListener("click", (e) => {
      e.preventDefault();
      if (kind === "look") { G.look = current; G.bg = null; } else { G.bg = current; G.look = "all"; }
      G.cat = "all"; G.limit = PAGE;
      jumpToArchive();
    });
    select(items[0].id, true);
  }

  /* ---------- prints ---------- */
  function initPrints() {
    const rail = $("#prints-rail");
    rail.innerHTML = M.prints.map((p, i) => `
      <figure class="print reveal" data-i="${i}" tabindex="0" role="button" aria-label="View ${esc(p.name)}">
        <div class="print__card"><img alt="${esc(p.name)}" loading="lazy"></div>
        <figcaption><span class="print__n">No. ${pad2(i + 1)}</span><h3>${esc(p.name)}</h3><p>${esc(p.note)}</p></figcaption>
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
      const ph = [l.name, l.venue, l.address, l.hours].some((v) => /\[.*\]/.test(v || ""));
      const href = l.maps || waLink("Hi Memento, I'd like to book the booth for an event.");
      const evCta = `<a class="link-arrow" href="${esc(href)}" target="_blank" rel="noopener">${esc(l.button || "Open in Maps")}</a>`;
      return `<article class="loc reveal${ph ? " is-placeholder" : ""}">
        <span class="loc__n">${pad2(i + 1)}</span>
        <div><h3 class="loc__name">${esc(l.name)}</h3><p class="loc__venue">${esc([l.venue, l.city].filter(Boolean).join(" · "))}</p>${ph ? '<span class="placeholder-flag">Details to be confirmed</span>' : ""}</div>
        <p class="loc__addr">${esc(l.address)}</p>
        <p class="loc__hours"><b>Hours</b><span>${esc(l.hours)}</span></p>
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
      categories: [{ id: "all", label: "All Moments" }].concat(settings.categories || []),
      gallery: shown(gallery).filter((g) => g.image).map((g) => Object.assign({}, g, {
        categories: [].concat(g.categories || []),
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
